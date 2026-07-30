package com.stackportal.auth;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.Collections;

@Service
@RequiredArgsConstructor
public class GoogleOAuth2Service {

    @Value("${google.client-id:}")
    private String clientId;

    public GoogleUserInfo verifyIdToken(String idToken) {
        if (clientId.isBlank()) {
            return null;
        }

        GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                new NetHttpTransport(), GsonFactory.getDefaultInstance())
                .setAudience(Collections.singletonList(clientId))
                .build();

        try {
            GoogleIdToken verifiedToken = verifier.verify(idToken);
            if (verifiedToken == null) {
                return null;
            }

            GoogleIdToken.Payload payload = verifiedToken.getPayload();
            String email = payload.getEmail();
            if (email == null || email.isBlank() || !Boolean.parseBoolean(String.valueOf(payload.getEmailVerified()))) {
                return null;
            }

            String name = (String) payload.get("name");
            return new GoogleUserInfo(payload.getSubject(), email, name);
        } catch (GeneralSecurityException | IOException exception) {
            return null;
        }
    }
}

@Data
@AllArgsConstructor
class GoogleUserInfo {
    private String subject;
    private String email;
    private String name;
}

