package com.discuss.discuss.service.post;

import com.discuss.discuss.exception.post.PostException;
import com.discuss.discuss.exception.post.PostErrorCode;
import java.util.*;
import java.util.regex.Pattern;

/** Only managed image tokens are rendered as images by the frontend. Never resolve user URLs on the server. */
public final class PostMarkdown {
    private static final Pattern IMAGE = Pattern.compile("post-image:([A-Za-z0-9_./-]+)");
    private PostMarkdown() {}

    public static Set<String> imageKeys(String content) {
        Set<String> keys = new LinkedHashSet<>();
        var matcher = IMAGE.matcher(content == null ? "" : content);
        while (matcher.find()) keys.add(matcher.group(1));
        if (keys.size() > 20) throw new PostException(PostErrorCode.TOO_MANY_MEDIA);
        return keys;
    }

    public static String legacyMarkdown(String content, String language, String code) {
        String markdown = content == null ? "" : content;
        if (code == null || code.isBlank()) return markdown;
        String fence = "```";
        while (code.contains(fence)) fence += "`";
        String safeLanguage = language == null ? "" : language.replaceAll("[^a-zA-Z0-9_+#.-]", "");
        return markdown + "\n\n" + fence + safeLanguage + "\n" + code + "\n" + fence;
    }
}
