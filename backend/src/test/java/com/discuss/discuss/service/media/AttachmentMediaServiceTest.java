package com.discuss.discuss.service.media;

import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;

class AttachmentMediaServiceTest {
    @Test
    void classifiesMediaByBytesAndTreatsHtmlAsADownload() {
        assertThat(AttachmentMediaService.detectMedia("0000ftypisom".getBytes(StandardCharsets.US_ASCII))).isEqualTo("video/mp4");
        assertThat(AttachmentMediaService.detectMedia("<html></html>".getBytes(StandardCharsets.US_ASCII))).isEqualTo("application/octet-stream");
        assertThat(AttachmentMediaService.detectMedia(new byte[0])).isEqualTo("application/octet-stream");
    }
}
