package com.discuss.discuss.controller.post;

import com.discuss.discuss.exception.GlobalExceptionHandler;
import com.discuss.discuss.service.post.PostService;
import com.discuss.discuss.exception.post.PostException;
import com.discuss.discuss.exception.post.PostErrorCode;
import com.discuss.discuss.exception.media.MediaException;
import com.discuss.discuss.exception.media.MediaErrorCode;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.api.*;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class PostControllerTest {
    private PostService service;
    private MockMvc mvc;
    @BeforeEach void setUp() {
        service = mock(PostService.class);
        mvc = MockMvcBuilders.standaloneSetup(new PostController(service))
                .setControllerAdvice(new GlobalExceptionHandler()).build();
    }
    private String document(String fields) {
        return "{\"communityName\":\"java\",\"title\":\"Hello\"," + fields + "}";
    }
    @ParameterizedTest @ValueSource(strings = {
        "\"type\":\"TEXT\",\"content\":\"# Markdown\"",
        "\"type\":\"TEXT\",\"media\":[{\"type\":\"IMAGE\",\"objectKey\":\"posts/draft-12/a.webp\"}]",
        "\"type\":\"TEXT\",\"content\":\"Description\",\"media\":[{\"type\":\"IMAGE\",\"objectKey\":\"posts/draft-12/a.webp\",\"caption\":\"First image\"}]",
    })
    void acceptsCreateDto(String fields) throws Exception {
        mvc.perform(post("/posts").contentType(MediaType.APPLICATION_JSON).content(document(fields))).andExpect(status().isCreated());
        verify(service).createPost(any());
    }
    @ParameterizedTest @ValueSource(strings = {
        "\"content\":\"Missing type\"",
        "\"type\":\"IMAGE\",\"content\":\"Invalid type\"",
        "\"type\":\"TEXT\",\"content\":\"Body\",\"media\":[null]",
        "\"type\":\"TEXT\",\"media\":[{\"objectKey\":\"a.webp\"}]",
        "\"type\":\"TEXT\",\"media\":[{\"type\":\"IMAGE\",\"objectKey\":\" \"}]"
    })
    void rejectsInvalidDtoBeforeWriting(String fields) throws Exception {
        mvc.perform(post("/posts").contentType(MediaType.APPLICATION_JSON).content(document(fields)))
                .andExpect(status().isBadRequest());
        verifyNoInteractions(service);
    }
    @Test void reportsNestedMediaErrorsByIndex() throws Exception {
        mvc.perform(post("/posts").contentType(MediaType.APPLICATION_JSON).content(document(
                "\"type\":\"TEXT\",\"content\":\"Body\",\"media\":[{\"type\":\"IMAGE\",\"objectKey\":\"a.webp\"},{\"type\":\"IMAGE\"}]")))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.errors['media[1].objectKey']").exists());
    }
    @Test void rejectsMoreThanTwentyMedia() throws Exception {
        String items = "[" + String.join(",", java.util.Collections.nCopies(21, "{\"type\":\"IMAGE\",\"objectKey\":\"a.webp\"}")) + "]";
        mvc.perform(post("/posts").contentType(MediaType.APPLICATION_JSON).content(document("\"type\":\"TEXT\",\"media\":" + items)))
                .andExpect(status().isBadRequest());
        verifyNoInteractions(service);
    }
    @Test void rejectsOversizedCaption() throws Exception {
        mvc.perform(post("/posts").contentType(MediaType.APPLICATION_JSON).content(document(
                "\"type\":\"TEXT\",\"media\":[{\"type\":\"IMAGE\",\"objectKey\":\"a.webp\",\"caption\":\"" + "a".repeat(501) + "\"}]")))
                .andExpect(status().isBadRequest());
        verifyNoInteractions(service);
    }
    @Test void rejectsOversizedContent() throws Exception {
        mvc.perform(post("/posts").contentType(MediaType.APPLICATION_JSON).content(document(
                "\"type\":\"TEXT\",\"content\":\"" + "a".repeat(50001) + "\""))).andExpect(status().isBadRequest());
        verifyNoInteractions(service);
    }
    @Test void rejectsMalformedJson() throws Exception {
        mvc.perform(post("/posts").contentType(MediaType.APPLICATION_JSON).content("{")).andExpect(status().isBadRequest());
    }
    @Test void rejectsPreviousBlocksContract() throws Exception {
        mvc.perform(post("/posts").contentType(MediaType.APPLICATION_JSON).content(document(
                "\"blocks\":[{\"type\":\"TEXT\",\"text\":\"Body\"}]"))).andExpect(status().isBadRequest());
        verifyNoInteractions(service);
    }
    @Test void returnsForbiddenForNonMember() throws Exception {
        when(service.createPost(any())).thenThrow(new AccessDeniedException("Not a member"));
        mvc.perform(post("/posts").contentType(MediaType.APPLICATION_JSON).content(document("\"type\":\"TEXT\",\"content\":\"Body\"")))
                .andExpect(status().isForbidden());
    }
    @ParameterizedTest
    @EnumSource(PostErrorCode.class)
    void mapsEveryPostErrorCodeToConfiguredResponse(PostErrorCode code) throws Exception {
        when(service.createPost(any())).thenThrow(new PostException(code));
        mvc.perform(post("/posts").contentType(MediaType.APPLICATION_JSON)
                .content(document("\"type\":\"TEXT\",\"content\":\"Body\"")))
                .andExpect(status().is(code.getStatus().value()))
                .andExpect(jsonPath("$.status").value(code.getStatus().value()))
                .andExpect(jsonPath("$.message").value(code.getDefaultMessage()));
    }
    @Test void allowsCustomMessagesAndKeepsTheCauseOffTheResponse() throws Exception {
        var cause = new IllegalStateException("Internal storage details");
        when(service.createPost(any())).thenThrow(new PostException(PostErrorCode.POST_NOT_FOUND, "Custom message", cause));
        mvc.perform(post("/posts").contentType(MediaType.APPLICATION_JSON)
                .content(document("\"type\":\"TEXT\",\"content\":\"Body\"")))
                .andExpect(status().isNotFound()).andExpect(jsonPath("$.message").value("Custom message"))
                .andExpect(jsonPath("$.cause").doesNotExist());
    }
    @Test void mediaFailuresUseTheExistingMediaHandler() throws Exception {
        when(service.createPost(any())).thenThrow(new MediaException(MediaErrorCode.MEDIA_ACCESS_DENIED));
        mvc.perform(post("/posts").contentType(MediaType.APPLICATION_JSON)
                .content(document("\"type\":\"TEXT\",\"content\":\"Body\"")))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value(MediaErrorCode.MEDIA_ACCESS_DENIED.getDefaultMessage()));
    }

}
