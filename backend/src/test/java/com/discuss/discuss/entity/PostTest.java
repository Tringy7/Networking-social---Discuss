package com.discuss.discuss.entity;

import com.discuss.discuss.enums.PostStatus;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import static org.assertj.core.api.Assertions.assertThat;

class PostTest {
    @ParameterizedTest
    @CsvSource(value = {
        "PUBLISHED, PUBLISHED, 2, false",
        "DELETED, PUBLISHED, NULL, true",
        "DELETED, NULL, 2, true",
        "DELETED, NULL, 1, false",
        "DELETED, NULL, NULL, false"
    }, nullValues = "NULL")
    void identifiesModerationRemovalIncludingOlderRecords(PostStatus status, PostStatus previousStatus,
                                                          Long deletedBy, boolean moderationRemoval) {
        Post post = Post.builder().user(User.builder().id(1L).build()).status(status)
                .statusBeforeModerationRemoval(previousStatus).deletedByUserId(deletedBy).build();

        assertThat(post.isModerationRemoval()).isEqualTo(moderationRemoval);
    }
}
