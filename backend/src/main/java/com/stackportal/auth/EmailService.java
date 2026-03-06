package com.stackportal.auth;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String from;

    public void sendEmailVerification(String to, String verificationLink) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setFrom(from);
        message.setSubject("Verify your Stack Portal account");
        message.setText("Please click the link below to verify your email:\n" + verificationLink);
        mailSender.send(message);
    }

    public void sendPasswordReset(String to, String resetLink) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setFrom(from);
        message.setSubject("Reset your Stack Portal password");
        message.setText("Please click the link below to reset your password:\n" + resetLink);
        mailSender.send(message);
    }

    public void sendAccountStatusChange(String to, boolean active) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setFrom(from);
        message.setSubject("Your Stack Portal account status changed");
        String status = active ? "activated" : "deactivated";
        message.setText("Your account has been " + status + ".");
        mailSender.send(message);
    }
}

