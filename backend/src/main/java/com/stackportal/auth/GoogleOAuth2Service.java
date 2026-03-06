package com.stackportal.auth;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class GoogleOAuth2Service {

    @Value("${google.client-id}")
    private String clientId;

    public GoogleUserInfo verifyIdToken(String idToken) {
        // In production, verify the token using Google's libraries.
        // Here we only define the contract; implementation should call Google APIs.
        return null;
    }
}

@Data
@AllArgsConstructor
class GoogleUserInfo {
    private String email;
    private String name;
}

