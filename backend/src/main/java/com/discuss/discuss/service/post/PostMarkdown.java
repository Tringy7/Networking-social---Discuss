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

    public static String replaceImageKeys(String content, Map<String, String> replacements) {
        if (content == null) return null;
        return IMAGE.matcher(content).replaceAll(match -> java.util.regex.Matcher.quoteReplacement(
                "post-image:" + replacements.getOrDefault(match.group(1), match.group(1))));
    }
}
