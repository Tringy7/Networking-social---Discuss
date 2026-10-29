package com.discuss.discuss.dto.community;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class RequestBanDTO {
    @NotBlank(message = "username must not be blank")
    private String username;

    @Size(max = 2000, message = "reason must not exceed 2000 characters")
    private String reason;
}
