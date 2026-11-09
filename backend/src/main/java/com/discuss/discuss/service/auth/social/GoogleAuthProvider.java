package com.discuss.discuss.service.auth.social;

import com.discuss.discuss.dto.auth.SocialUserInfo;
import com.discuss.discuss.exception.auth.AuthErrorCode;
import com.discuss.discuss.exception.auth.AuthException;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Collections;

@Component
public class GoogleAuthProvider implements SocialAuthProvider {

    private final GoogleIdTokenVerifier verifier;

    public GoogleAuthProvider(
            @Value("${spring.security.oauth2.client.registration.google.client-id}")
            String googleClientId
    ) {
        this.verifier = new GoogleIdTokenVerifier.Builder(
                new NetHttpTransport(),
                GsonFactory.getDefaultInstance()
        )
                .setAudience(Collections.singletonList(googleClientId))
                .build();
    }

    @Override
    public String getProviderName() {
        return "google";
    }

    @Override
    public SocialUserInfo verifyToken(String idTokenString) {

        if (idTokenString == null || idTokenString.isBlank()) {
            throw new AuthException(
                    AuthErrorCode.SOCIAL_VERIFICATION_FAILED
            );
        }

        try {
            GoogleIdToken idToken = verifier.verify(idTokenString);

            if (idToken == null) {
                throw new AuthException(
                        AuthErrorCode.SOCIAL_VERIFICATION_FAILED
                );
            }

            GoogleIdToken.Payload payload = idToken.getPayload();

            String email = payload.getEmail();

            if (email == null || email.isBlank()) {
                throw new AuthException(
                        AuthErrorCode.SOCIAL_VERIFICATION_FAILED
                );
            }

            return SocialUserInfo.builder()
                    .email(email)
                    .name((String) payload.get("name"))
                    .emailVerified(
                            Boolean.TRUE.equals(
                                    payload.getEmailVerified()
                            )
                    )
                    .providerUserId(payload.getSubject())
                    .build();

        } catch (AuthException e) {
            throw e;

        } catch (Exception e) {
            throw new AuthException(
                    AuthErrorCode.SOCIAL_VERIFICATION_FAILED
            );
        }
    }
}