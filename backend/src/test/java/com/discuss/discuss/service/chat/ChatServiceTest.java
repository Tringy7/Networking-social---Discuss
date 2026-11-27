package com.discuss.discuss.service.chat;

import com.discuss.discuss.entity.ChatRequest;
import com.discuss.discuss.exception.chat.ChatErrorCode;
import com.discuss.discuss.exception.chat.ChatException;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ChatServiceTest {
    @Test
    void directKeyDoesNotDependOnInitiator() {
        assertThat(ChatAccess.directKey(2, 9)).isEqualTo(ChatAccess.directKey(9, 2)).isEqualTo("2:9");
    }

    @Test
    void onlyTheRecipientCanAcceptOrRejectAndOnlyTheSenderCanWithdraw() {
        var request = new ChatRequest();
        request.setSenderId(1L);
        request.setRecipientId(2L);
        request.setStatus(ChatRequest.Status.PENDING);
        assertThatCode(() -> ChatRequestService.validateRequestDecision(request, 2, ChatRequest.Status.ACCEPTED)).doesNotThrowAnyException();
        assertThatCode(() -> ChatRequestService.validateRequestDecision(request, 1, ChatRequest.Status.WITHDRAWN)).doesNotThrowAnyException();
        assertThatThrownBy(() -> ChatRequestService.validateRequestDecision(request, 1, ChatRequest.Status.REJECTED))
                .isInstanceOfSatisfying(ChatException.class, error -> assertThat(error.getError()).isEqualTo(ChatErrorCode.REQUEST_ACTION_FORBIDDEN));
        request.setStatus(ChatRequest.Status.ACCEPTED);
        assertThatThrownBy(() -> ChatRequestService.validateRequestDecision(request, 2, ChatRequest.Status.ACCEPTED))
                .isInstanceOfSatisfying(ChatException.class, error -> assertThat(error.getError()).isEqualTo(ChatErrorCode.REQUEST_NOT_PENDING));
    }
}
