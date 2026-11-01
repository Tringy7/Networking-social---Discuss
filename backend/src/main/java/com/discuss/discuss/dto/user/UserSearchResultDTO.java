package com.discuss.discuss.dto.user;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserSearchResultDTO {

    private String id;
    private String username;
    private String displayName;
    private String bio;
    private String avatarUrl;
}