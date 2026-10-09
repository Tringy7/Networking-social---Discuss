package com.discuss.discuss.enums;

public enum OtpPurpose {

    VERIFY_EMAIL(
            "otp:verify-email:",
            "otp-verification",
            "Your Account Verification Code"),

    FORGOT_PASSWORD(
            "otp:forgot-password:",
            "password-reset-otp",
            "Your Password Reset Code"),

    CHANGE_PASSWORD(
            "otp:change-password:",
            "change-password-otp",
            "Confirm Your Password Change");

    private final String prefix;
    private final String template;
    private final String subject;

    OtpPurpose(String prefix, String template, String subject) {
        this.prefix = prefix;
        this.template = template;
        this.subject = subject;
    }

    public String getPrefix() { return prefix; }
    public String getTemplate() { return template; }
    public String getSubject() { return subject; }
}