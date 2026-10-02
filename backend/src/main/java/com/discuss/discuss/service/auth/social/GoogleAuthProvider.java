package com.discuss.discuss.service.auth.social;

import com.discuss.discuss.dto.auth.SocialUserInfo;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.discuss.discuss.exception.auth.VerificationException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Collections;

@Component
@RequiredArgsConstructor
public class GoogleAuthProvider implements SocialAuthProvider {

    @Value("${spring.security.oauth2.client.registration.google.client-id}")
    private String googleClientId;

    @Override
    public String getProviderName() {
        return "google";
    }

    @Override
    public SocialUserInfo verifyToken(String idTokenString) {
        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                    new NetHttpTransport(), GsonFactory.getDefaultInstance())
                    .setAudience(Collections.singletonList(googleClientId))
                    .build();

            GoogleIdToken idToken = verifier.verify(idTokenString);
            if (idToken == null) {
                throw new VerificationException("Invalid Google ID token");
            }

            GoogleIdToken.Payload payload = idToken.getPayload();

            return SocialUserInfo.builder()
                    .email(payload.getEmail())
                    .name((String) payload.get("name"))
                    .emailVerified(Boolean.TRUE.equals(payload.getEmailVerified()))
                    .providerUserId(payload.getSubject())
                    .build();

        } catch (VerificationException e) {
            throw e;
        } catch (Exception e) {
            throw new VerificationException("Google verification failed");
        }
    }
}