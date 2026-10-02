package com.discuss.discuss.utils.annotation.auth;

import com.discuss.discuss.enums.UserStatus;
import com.discuss.discuss.repository.UserRepository;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class UniqueUsernameValidator
        implements ConstraintValidator<UniqueUsername, String> {

    private final UserRepository userRepository;

    @Override
    public boolean isValid(String username, ConstraintValidatorContext context) {

        if (username == null || username.isBlank()) {
            return true;
        }

        return !userRepository.existsByUsernameAndStatus(
                username.trim(),
                UserStatus.ACTIVE);
    }
}