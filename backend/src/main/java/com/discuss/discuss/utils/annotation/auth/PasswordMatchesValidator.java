package com.discuss.discuss.utils.annotation.auth;

import com.discuss.discuss.dto.auth.PasswordConfirmable;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class PasswordMatchesValidator
        implements ConstraintValidator<PasswordMatches, PasswordConfirmable> {

    @Override
    public boolean isValid(
            PasswordConfirmable dto,
            ConstraintValidatorContext context
    ) {
        if (dto == null) {
            return true;
        }

        String password = dto.getPassword();
        String confirmPassword = dto.getConfirmPassword();

        if (password == null || confirmPassword == null) {
            return true;
        }

        if (password.equals(confirmPassword)) {
            return true;
        }

        context.disableDefaultConstraintViolation();
        context.buildConstraintViolationWithTemplate(
                        context.getDefaultConstraintMessageTemplate()
                )
                .addPropertyNode("confirmPassword")
                .addConstraintViolation();

        return false;
    }
}