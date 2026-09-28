package com.discuss.discuss.utils.annotation.auth;

import com.discuss.discuss.dto.auth.RegisterRequestDTO;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class PasswordMatchesValidator implements ConstraintValidator<PasswordMatches, RegisterRequestDTO> {

    @Override
    public boolean isValid(RegisterRequestDTO dto, ConstraintValidatorContext context) {
        return dto.getPassword() != null &&
                dto.getPassword().equals(dto.getConfirmPassword());
    }
}