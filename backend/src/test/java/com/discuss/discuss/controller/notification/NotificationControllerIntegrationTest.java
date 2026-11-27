package com.discuss.discuss.controller.notification;

import com.discuss.discuss.entity.Notification;
import com.discuss.discuss.entity.User;
import com.discuss.discuss.enums.NotificationType;
import com.discuss.discuss.enums.UserRole;
import com.discuss.discuss.repository.NotificationRepository;
import com.discuss.discuss.support.AbstractApiIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class NotificationControllerIntegrationTest extends AbstractApiIntegrationTest {

    @Autowired NotificationRepository notifications;

    @Test
    void markingAndClearingReadNotificationsIsScopedToRecipient() throws Exception {
        User actor = user(UserRole.USER);
        User recipient = user(UserRole.USER);
        Notification first = notification(actor, recipient);
        Notification second = notification(actor, recipient);

        mvc.perform(get("/notifications/unread-count").with(as(recipient))).andExpect(status().isOk())
                .andExpect(jsonPath("$.unreadCount").value(2));
        mvc.perform(put("/notifications/{id}/read", first.getId()).with(as(actor))).andExpect(status().isNotFound());
        mvc.perform(put("/notifications/{id}/read", first.getId()).with(as(recipient))).andExpect(status().isNoContent());
        mvc.perform(delete("/notifications/read").with(as(recipient))).andExpect(status().isNoContent());

        assertThat(notifications.findById(first.getId())).isEmpty();
        assertThat(notifications.findById(second.getId()).orElseThrow().getReadAt()).isNull();
        mvc.perform(put("/notifications/read-all").with(as(recipient))).andExpect(status().isNoContent());
        mvc.perform(get("/notifications/unread-count").with(as(recipient))).andExpect(status().isOk())
                .andExpect(jsonPath("$.unreadCount").value(0));
    }

    @Test
    void summaryChangesWhenANewNotificationReplacesTheUnreadCountOfAnOlderOne() throws Exception {
        User actor = user(UserRole.USER);
        User recipient = user(UserRole.USER);
        var original = notification(actor, recipient);
        mvc.perform(get("/notifications/unread-count").with(as(recipient)))
                .andExpect(jsonPath("$.unreadCount").value(1))
                .andExpect(jsonPath("$.latestId").value(original.getId()));

        mvc.perform(put("/notifications/{id}/read", original.getId()).with(as(recipient)))
                .andExpect(status().isNoContent());
        var latest = notification(actor, recipient);
        mvc.perform(get("/notifications/unread-count").with(as(recipient)))
                .andExpect(jsonPath("$.unreadCount").value(1))
                .andExpect(jsonPath("$.latestId").value(latest.getId()))
                .andExpect(jsonPath("$.lastReadAt").exists());
    }

    private Notification notification(User actor, User recipient) {
        return notifications.save(Notification.builder().actor(actor).recipientId(recipient.getId())
                .type(NotificationType.REPORT_REVIEWED).build());
    }

    @Test
    void unreadListExcludesReadNotificationsAndOtherRecipients() throws Exception {
        User sender = user(UserRole.USER);
        User recipient = user(UserRole.USER);
        Notification unread = notification(sender, recipient);
        Notification read = notification(sender, recipient);
        notification(sender, sender);
        for (NotificationType type : new NotificationType[]{
                NotificationType.CHAT_MESSAGE_RECEIVED, NotificationType.CHAT_REQUEST_RECEIVED}) {
            notifications.save(Notification.builder().actor(sender).recipientId(recipient.getId())
                    .type(type).build());
        }

        mvc.perform(get("/notifications/unread-count").with(as(recipient))).andExpect(status().isOk())
                .andExpect(jsonPath("$.unreadCount").value(2));
        mvc.perform(get("/notifications").with(as(recipient))).andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(2));
        mvc.perform(put("/notifications/{id}/read", read.getId()).with(as(recipient)))
                .andExpect(status().isNoContent());

        mvc.perform(get("/notifications").param("unreadOnly", "true").with(as(recipient)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].id").value(unread.getId()));
    }
}
