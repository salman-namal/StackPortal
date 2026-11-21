package com.stackportal.service.auth;

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

    public void sendEmailVerification(String to, String otpCode) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setFrom(from);
        message.setSubject("Verify your Stack Portal account");
        message.setText("Your email verification code is: " + otpCode + "\n\nThis code will expire in 15 minutes.");
        mailSender.send(message);
    }

    public void sendPasswordReset(String to, String resetLink) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setFrom(from);
        message.setSubject("Reset your Stack Portal password");
        message.setText("Use the link below to reset your Stack Portal password.\n\n"
                + resetLink
                + "\n\nThis link will expire in 15 minutes.");
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

    public void sendNewUserCredentials(String to, String name, String username, String temporaryPassword, String loginUrl) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setFrom(from);
        message.setSubject("Your Stack Portal account");
        message.setText("Hello " + name + ",\n\n"
                + "Your Stack Portal account has been created.\n"
                + "Username: " + username + "\n"
                + "Email: " + to + "\n"
                + "Temporary password: " + temporaryPassword + "\n\n"
                + "Sign in at: " + loginUrl);
        mailSender.send(message);
    }

    public void sendTenantAdminInvitation(String to, String name, String invitationUrl, String loginUrl) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to); message.setFrom(from); message.setSubject("Set up your StackPortal administrator account");
        message.setText("Hello " + name + ",\n\nSet your administrator password using this one-time link:\n" + invitationUrl
                + "\n\nAfter setup, sign in at:\n" + loginUrl + "\n\nThis invitation expires in 24 hours.");
        mailSender.send(message);
    }
}

