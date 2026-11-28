package com.discuss.discuss.service.community;

import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

@Service
public class CommunityRulesService {
    private final String defaultRules;

    public CommunityRulesService() {
        try (var input = new ClassPathResource("community/default-rules.md").getInputStream()) {
            defaultRules = normalize(new String(input.readAllBytes(), StandardCharsets.UTF_8));
            if (defaultRules.isBlank()) {
                throw new IllegalStateException("Default community rules must not be empty");
            }
        } catch (IOException ex) {
            throw new IllegalStateException("Cannot load default community rules", ex);
        }
    }

    public String getDefaultRules() {
        return defaultRules;
    }

    public String resolve(String markdown) {
        String normalized = normalize(markdown);
        return normalized.isBlank() ? defaultRules : normalized;
    }

    // Preserve Markdown indentation and trailing spaces; normalize only transport artifacts.
    private String normalize(String markdown) {
        if (markdown == null) return "";
        String value = markdown.startsWith("\uFEFF") ? markdown.substring(1) : markdown;
        return value.replace("\r\n", "\n").replace('\r', '\n');
    }
}
