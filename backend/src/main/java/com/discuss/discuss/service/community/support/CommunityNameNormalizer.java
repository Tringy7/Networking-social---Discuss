package com.discuss.discuss.service.community.support;

import org.springframework.stereotype.Component;

import java.util.Locale;

@Component
public class CommunityNameNormalizer {

    public String normalize(String name) {
        if (name == null) {
            return null;
        }

        return name.trim().toLowerCase(Locale.ROOT);
    }
}