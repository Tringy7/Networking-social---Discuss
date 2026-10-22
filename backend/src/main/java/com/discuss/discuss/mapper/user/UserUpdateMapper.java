package com.discuss.discuss.mapper.user;

import com.discuss.discuss.dto.user.UpdateProfileRequestDTO;
import com.discuss.discuss.entity.User;
import com.discuss.discuss.entity.UserPrivacySettings;
import com.discuss.discuss.entity.UserProfile;
import org.mapstruct.*;
import org.springframework.stereotype.Component;

@Mapper(
        componentModel = "spring",
        nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE,
        unmappedTargetPolicy = ReportingPolicy.IGNORE
)
public interface UserUpdateMapper {

    void updateUser(UpdateProfileRequestDTO request, @MappingTarget User user);

    void updateProfile(UpdateProfileRequestDTO request, @MappingTarget UserProfile profile);

    void updatePrivacy(UpdateProfileRequestDTO request, @MappingTarget UserPrivacySettings settings);
}