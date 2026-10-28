package com.discuss.discuss.config.init;

import com.discuss.discuss.entity.Category;
import com.discuss.discuss.entity.Community;
import com.discuss.discuss.entity.CommunityInfo;
import com.discuss.discuss.entity.CommunityMember;
import com.discuss.discuss.entity.User;
import com.discuss.discuss.entity.UserPrivacySettings;
import com.discuss.discuss.entity.UserProfile;
import com.discuss.discuss.enums.CommunityRole;
import com.discuss.discuss.enums.CommunityStatus;
import com.discuss.discuss.enums.CommunityVisibility;
import com.discuss.discuss.enums.MembershipStatus;
import com.discuss.discuss.enums.Provider;
import com.discuss.discuss.enums.UserRole;
import com.discuss.discuss.enums.UserStatus;
import com.discuss.discuss.repository.CategoryRepository;
import com.discuss.discuss.repository.CommunityInfoRepository;
import com.discuss.discuss.repository.CommunityMemberRepository;
import com.discuss.discuss.repository.CommunityRepository;
import com.discuss.discuss.repository.UserPrivacySettingsRepository;
import com.discuss.discuss.repository.UserProfileRepository;
import com.discuss.discuss.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
@Slf4j
@Order(2)
public class CommunityDataInitializer implements CommandLineRunner {

    private static final String MOCK_OWNER_USERNAME = "discuss_mock_owner";
    private static final String MOCK_OWNER_EMAIL = "discuss_mock_owner@seed.invalid";
    private static final String MOCK_OWNER_PASSWORD = "DiscussMock123!";
    private static final String MOCK_OWNER_DISPLAY_NAME = "DISCUSS Community";

    private record CommunitySeed(
            String name,
            String categorySlug,
            String description,
            CommunityVisibility visibility
    ) {}

    private static final List<CommunitySeed> COMMUNITIES = List.of(
            new CommunitySeed(
                    "lap-trinh-viet",
                    "programming",
                    "Cộng đồng chia sẻ kiến thức lập trình, hỏi đáp kỹ thuật và cùng nhau xây dựng sản phẩm.",
                    CommunityVisibility.PUBLIC
            ),
            new CommunitySeed(
                    "cong-nghe-ai",
                    "technology",
                    "Thảo luận về công nghệ mới, trí tuệ nhân tạo, phần cứng và các xu hướng số.",
                    CommunityVisibility.PUBLIC
            ),
            new CommunitySeed(
                    "java-spring",
                    "programming",
                    "Trao đổi kinh nghiệm Java, Spring Boot, thiết kế hệ thống và phát triển backend.",
                    CommunityVisibility.PUBLIC
            ),
            new CommunitySeed(
                    "frontend-viet",
                    "programming",
                    "Nơi dành cho cộng đồng frontend: JavaScript, TypeScript, React, CSS và trải nghiệm người dùng.",
                    CommunityVisibility.PUBLIC
            ),
            new CommunitySeed(
                    "hoc-tap-moi-ngay",
                    "education-learning",
                    "Chia sẻ tài liệu, phương pháp học tập và động lực để tiến bộ mỗi ngày.",
                    CommunityVisibility.PUBLIC
            ),
            new CommunitySeed(
                    "thiet-ke-sang-tao",
                    "art-design",
                    "Chia sẻ ý tưởng, sản phẩm và góp ý về thiết kế đồ họa, UI/UX và sáng tạo thị giác.",
                    CommunityVisibility.PUBLIC
            ),
            new CommunitySeed(
                    "game-thu-viet",
                    "gaming",
                    "Cùng bàn luận về game mới, thiết bị chơi game, hướng dẫn và những trận đấu đáng nhớ.",
                    CommunityVisibility.PUBLIC
            ),
            new CommunitySeed(
                    "goc-rieng-dev",
                    "careers-work",
                    "Không gian riêng để thành viên chia sẻ kinh nghiệm công việc và nghề nghiệp trong ngành công nghệ.",
                    CommunityVisibility.PRIVATE
            )
    );

    private final CommunityRepository communityRepository;
    private final CommunityInfoRepository communityInfoRepository;
    private final CommunityMemberRepository communityMemberRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final UserPrivacySettingsRepository userPrivacySettingsRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        Map<String, Category> categoriesBySlug = categoryRepository.findAll().stream()
                .collect(Collectors.toMap(Category::getSlug, Function.identity()));
        User owner = getOrCreateMockOwner();
        int inserted = 0;

        for (CommunitySeed seed : COMMUNITIES) {
            Category category = categoriesBySlug.get(seed.categorySlug());
            if (category == null) {
                log.warn("Skipping community '{}': category '{}' was not initialized", seed.name(), seed.categorySlug());
                continue;
            }

            var existingCommunity = communityRepository.findByName(seed.name());
            boolean isNew = existingCommunity.isEmpty();
            Community community = existingCommunity.orElseGet(() -> communityRepository.save(Community.builder()
                    .owner(owner)
                    .name(seed.name())
                    .status(CommunityStatus.ACTIVE)
                    .visibility(seed.visibility())
                    .build()));
            User previousOwner = community.getOwner();

            community.setOwner(owner);
            communityRepository.save(community);

            if (communityInfoRepository.findByCommunity(community).isEmpty()) {
                communityInfoRepository.save(CommunityInfo.builder()
                        .community(community)
                        .category(category)
                        .description(seed.description())
                        .build());
            }

            if (previousOwner != null && !previousOwner.getId().equals(owner.getId())) {
                communityMemberRepository.findByCommunityAndUser(community, previousOwner)
                        .filter(member -> member.getRole() == CommunityRole.OWNER)
                        .ifPresent(member -> {
                            member.setRole(CommunityRole.MEMBER);
                            communityMemberRepository.save(member);
                        });
            }
            ensureOwnerMembership(community, owner);
            if (isNew) inserted++;
        }

        log.info("Seeded/updated {} mock communities; all are owned by '{}'", inserted, owner.getUsername());
    }

    private User getOrCreateMockOwner() {
        User owner = userRepository.findByUsername(MOCK_OWNER_USERNAME)
                .orElseGet(() -> userRepository.save(User.builder()
                        .username(MOCK_OWNER_USERNAME)
                        .email(MOCK_OWNER_EMAIL)
                        .password(passwordEncoder.encode(MOCK_OWNER_PASSWORD))
                        .role(UserRole.USER)
                        .status(UserStatus.ACTIVE)
                        .provider(Provider.LOCAL)
                        .build()));

        if (owner.getStatus() != UserStatus.ACTIVE) {
            owner.setStatus(UserStatus.ACTIVE);
            owner = userRepository.save(owner);
        }
        if (owner.getRole() != UserRole.USER) {
            owner.setRole(UserRole.USER);
            owner = userRepository.save(owner);
        }
        if (owner.getPassword() == null || owner.getPassword().isBlank()) {
            owner.setPassword(passwordEncoder.encode(MOCK_OWNER_PASSWORD));
            owner = userRepository.save(owner);
        }

        if (userProfileRepository.findByUser(owner).isEmpty()) {
            userProfileRepository.save(UserProfile.builder()
                    .user(owner)
                    .displayName(MOCK_OWNER_DISPLAY_NAME)
                    .bio("Tài khoản dữ liệu mẫu quản lý các cộng đồng demo của DISCUSS.")
                    .build());
        }
        if (userPrivacySettingsRepository.findByUser(owner).isEmpty()) {
            userPrivacySettingsRepository.save(UserPrivacySettings.builder()
                    .user(owner)
                    .build());
        }
        return owner;
    }

    private void ensureOwnerMembership(Community community, User owner) {
        CommunityMember membership = communityMemberRepository.findByCommunityAndUser(community, owner)
                .orElseGet(() -> CommunityMember.builder()
                        .community(community)
                        .user(owner)
                        .build());
        membership.setRole(CommunityRole.OWNER);
        membership.setStatus(MembershipStatus.ACTIVE);
        membership.setLeftAt(null);
        communityMemberRepository.save(membership);
    }
}
