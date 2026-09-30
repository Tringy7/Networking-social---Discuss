package com.discuss.discuss.service.auth;

import com.discuss.discuss.exception.auth.EmailSendException;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private static final String OTP_TEMPLATE = "otp-verification";
    private static final String PASSWORD_RESET_TEMPLATE = "password-reset";
    private static final String EMAIL_VERIFICATION_TEMPLATE = "email-verification";

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;

    @Value("${spring.mail.username}")
    private String fromAddress;

    @Async
    public void sendOtpEmail(String toEmail, String username, String otpCode) {
        Context context = new Context();
        context.setVariable("username", username);
        context.setVariable("otpCode", otpCode);
        context.setVariable("year", java.time.Year.now().getValue());

        String htmlContent = templateEngine.process(OTP_TEMPLATE, context);
        sendHtmlEmail(toEmail, "Your Account Verification Code", htmlContent);
    }

    @Async
    public void sendPasswordResetEmail(String toEmail, String username, String resetLink) {
        Context context = new Context();
        context.setVariable("username", username);
        context.setVariable("resetLink", resetLink);

        String htmlContent = templateEngine.process(PASSWORD_RESET_TEMPLATE, context);
        sendHtmlEmail(toEmail, "Password Reset Request", htmlContent);
    }

    @Async
    public void sendVerificationEmail(String toEmail, String username, String verifyLink) {
        Context context = new Context();
        context.setVariable("username", username);
        context.setVariable("verifyLink", verifyLink);

        String htmlContent = templateEngine.process(EMAIL_VERIFICATION_TEMPLATE, context);
        sendHtmlEmail(toEmail, "Verify Your Account", htmlContent);
    }

    private void sendHtmlEmail(String to, String subject, String htmlContent) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromAddress);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("Email sent successfully to {}", to);
        } catch (MessagingException e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
            throw new EmailSendException("Failed to send email to " + to, e);
        }
    }
}