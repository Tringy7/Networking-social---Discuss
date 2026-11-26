package com.discuss.discuss.controller.comment;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import com.discuss.discuss.entity.Comment;
import com.discuss.discuss.entity.Community;
import com.discuss.discuss.entity.Post;
import com.discuss.discuss.entity.User;
import com.discuss.discuss.enums.CommentStatus;
import com.discuss.discuss.enums.CommunityVisibility;
import com.discuss.discuss.enums.UserRole;
import com.discuss.discuss.repository.CommentRepository;
import com.discuss.discuss.support.AbstractApiIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mock.web.MockMultipartFile;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class CommentControllerIntegrationTest extends AbstractApiIntegrationTest {

    @Autowired CommentRepository comments;

    @Test
    void commentAuthorCanEditAndDeleteButAnotherUserCannotEdit() throws Exception {
        User author = user(UserRole.USER);
        User other = user(UserRole.USER);
        Post post = publishedPost(author, community(author, CommunityVisibility.PUBLIC));
        Comment comment = comments.save(Comment.builder().post(post).user(author)
                .status(CommentStatus.VISIBLE).content("Original").build());
        String path = "/comments/" + comment.getId();

        mvc.perform(body(patch(path).with(as(other)), """
                {"content":"Other user's edit"}
                """)).andExpect(status().isForbidden());
        assertThat(comments.findById(comment.getId()).orElseThrow().getContent()).isEqualTo("Original");
        mvc.perform(body(patch(path).with(as(author)), """
                {"content":"  Updated  "}
                """)).andExpect(status().isOk()).andExpect(jsonPath("$.content").value("Updated"));
        mvc.perform(delete(path).with(as(author))).andExpect(status().isOk());
        assertThat(comments.findById(comment.getId()).orElseThrow().getStatus()).isEqualTo(CommentStatus.DELETED);
    }

    @Test
    void replyMustBelongToTheSamePost() throws Exception {
        User author = user(UserRole.USER);
        Community community = community(author, CommunityVisibility.PUBLIC);
        Post first = publishedPost(author, community);
        Post second = publishedPost(author, community);
        var parent = comments.save(Comment.builder().post(first).user(author)
                .status(CommentStatus.VISIBLE).content("Parent comment").build());

        mvc.perform(body(post("/comments").with(as(author)), """
                {"postId":%d,"parentId":%d,"content":"Reply"}
                """.formatted(second.getId(), parent.getId()))).andExpect(status().isBadRequest());
        mvc.perform(body(post("/comments").with(as(author)), """
                {"postId":%d,"parentId":%d,"content":"Reply"}
                """.formatted(first.getId(), parent.getId()))).andExpect(status().isCreated())
                .andExpect(jsonPath("$.parentId").value(parent.getId()))
                .andExpect(jsonPath("$.content").value("Reply"));
    }

    @Test
    void updatesAndRemovesCurrentUsersCommentVote() throws Exception {
        User author = user(UserRole.USER);
        User voter = user(UserRole.USER);
        Post post = publishedPost(author, community(author, CommunityVisibility.PUBLIC));
        Comment comment = comments.save(Comment.builder().user(author).post(post)
                .content("A comment").status(CommentStatus.VISIBLE).build());

        mvc.perform(body(put("/comments/{id}/vote", comment.getId()).with(as(voter)), "{\"type\":\"UP\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.voteScore").value(1));
        mvc.perform(delete("/comments/{id}/vote", comment.getId()).with(as(voter)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.voteScore").value(0));
    }

    @ParameterizedTest
    @CsvSource({"comment.png, image/png", "comment.mp4, video/mp4"})
    void acceptsMultipartCommentWithAttachment(String name, String contentType) throws Exception {
        User author = user(UserRole.USER);
        Post post = publishedPost(author, community(author, CommunityVisibility.PUBLIC));
        var file = new MockMultipartFile("files", name, contentType, new byte[]{1, 2, 3});
        var stored = new com.discuss.discuss.dto.media.StoredCommentImageDTO("comments/1/" + name, name, contentType, 3);
        boolean video = "video/mp4".equals(contentType);
        org.mockito.Mockito.when(video
                ? images.storeCommentVideo(org.mockito.ArgumentMatchers.anyLong(), org.mockito.ArgumentMatchers.eq(file))
                : images.storeCommentImage(org.mockito.ArgumentMatchers.anyLong(), org.mockito.ArgumentMatchers.eq(file)))
                .thenReturn(stored);

        mvc.perform(multipart("/comments").file(jsonPart("comment",
                        "{\"postId\":" + post.getId() + ",\"content\":\"With picture\"}")).file(file).with(as(author)))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.content").value("With picture"))
                .andExpect(jsonPath("$.attachments[0].contentType").value(contentType));
    }
}
