package com.discuss.discuss.service.auth.social;

import com.discuss.discuss.exception.auth.AuthErrorCode;
import com.discuss.discuss.exception.auth.AuthException;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
public class SocialAuthProviderFactory {

    private final Map<String, SocialAuthProvider> providers;

    public SocialAuthProviderFactory(List<SocialAuthProvider> providerList) {
        this.providers = providerList.stream()
                .collect(Collectors.toMap(SocialAuthProvider::getProviderName, p -> p));
    }

    public SocialAuthProvider getProvider(String providerName) {
        SocialAuthProvider provider = providers.get(providerName.toLowerCase());
        if (provider == null) {
            throw new AuthException(AuthErrorCode.UNSUPPORTED_PROVIDER ,"Unsupported provider: " + providerName);
        }
        return provider;
    }
}