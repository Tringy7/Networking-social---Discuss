package com.discuss.discuss.service.auth.email;

import com.discuss.discuss.enums.OtpPurpose;
import com.discuss.discuss.exception.auth.AuthErrorCode;
import com.discuss.discuss.exception.auth.AuthException;
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

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;

    @Value("${spring.mail.username}")
    private String fromAddress;

    @Async
    public void sendOtpEmail(OtpPurpose purpose, String toEmail, String username, String otpCode) {
        Context context = new Context();
        context.setVariable("username", username);
        context.setVariable("otpCode", otpCode);
        context.setVariable("year", java.time.Year.now().getValue());

        String htmlContent = templateEngine.process(purpose.getTemplate(), context);
        sendHtmlEmail(toEmail, purpose.getSubject(), htmlContent);
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
            throw new AuthException(AuthErrorCode.EMAIL_SEND_FAILED, "Failed to send email to " + to, e);
        }
    }
}