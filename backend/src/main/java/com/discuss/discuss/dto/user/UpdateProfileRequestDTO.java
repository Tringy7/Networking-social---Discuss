package com.discuss.discuss.dto.user;

import com.discuss.discuss.enums.Gender;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record UpdateProfileRequestDTO(
        @Size(max = 50) String displayName,
        // Clear IO -> UI send request bio = ""
        @Size(max = 500) String bio,
        @Past LocalDate dateOfBirth,
        Gender gender,
        @Size(max = 100) String location,
        Boolean showDateOfBirth,
        Boolean showLocation,
        Boolean showPostsOnProfile
) {
    public UpdateProfileRequestDTO {
        displayName = trim(displayName);
        bio = trim(bio);
        location = trim(location);
    }

    private static String trim(String s) {
        return s == null ? null : s.trim();
    }
}