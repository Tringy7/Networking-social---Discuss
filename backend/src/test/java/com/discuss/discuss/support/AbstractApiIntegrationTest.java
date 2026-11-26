package com.discuss.discuss.support;

import com.discuss.discuss.entity.Community;
import com.discuss.discuss.entity.CommunityMember;
import com.discuss.discuss.entity.CommunityInfo;
import com.discuss.discuss.entity.Post;
import com.discuss.discuss.entity.PostContent;
import com.discuss.discuss.entity.User;
import com.discuss.discuss.enums.CommunityRole;
import com.discuss.discuss.enums.CommunityStatus;
import com.discuss.discuss.enums.CommunityVisibility;
import com.discuss.discuss.enums.MembershipStatus;
import com.discuss.discuss.enums.PostStatus;
import com.discuss.discuss.enums.PostType;
import com.discuss.discuss.enums.UserRole;
import com.discuss.discuss.enums.UserStatus;
import com.discuss.discuss.repository.CommunityMemberRepository;
import com.discuss.discuss.repository.CommunityInfoRepository;
import com.discuss.discuss.repository.CommunityRepository;
import com.discuss.discuss.repository.PostRepository;
import com.discuss.discuss.repository.PostContentRepository;
import com.discuss.discuss.repository.UserRepository;
import com.discuss.discuss.service.media.ImageService;
import com.discuss.discuss.service.media.MinioService;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.context.junit.jupiter.web.SpringJUnitWebConfig;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.web.context.WebApplicationContext;

import java.time.LocalDateTime;
import java.nio.charset.StandardCharsets;
import java.util.UUID;

import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.setup.MockMvcBuilders.webAppContextSetup;

@SpringJUnitWebConfig(ApiIntegrationTestConfig.class)
@TestPropertySource(properties = {
        "jwt.secret=dGVzdC1vbmx5LXNpZ25pbmcta2V5LWZvci1hdXRoLW1vY2ttdmM=",
        "jwt.expiration.access.token=3600000",
        "jwt.expiration.refresh.token=604800000"
})
public abstract class AbstractApiIntegrationTest {

    @Autowired private WebApplicationContext context;
    @Autowired private UserRepository users;
    @Autowired private CommunityRepository communities;
    @Autowired private CommunityMemberRepository members;
    @Autowired private CommunityInfoRepository communityInfo;
    @Autowired private PostRepository posts;
    @Autowired private PostContentRepository contents;

    @MockitoBean protected ImageService images;
    @MockitoBean private MinioService minio;

    protected MockMvc mvc;

    @BeforeEach
    protected void setUp() {
        mvc = webAppContextSetup(context).apply(springSecurity()).build();
    }

    protected User user(UserRole role) {
        String name = "user_" + UUID.randomUUID().toString().substring(0, 12);
        return users.save(User.builder().username(name).email(name + "@example.com")
                .role(role).status(UserStatus.ACTIVE).build());
    }

    protected Community community(User owner, CommunityVisibility visibility) {
        var community = communities.save(Community.builder().owner(owner)
                .name("c_" + UUID.randomUUID().toString().substring(0, 12))
                .status(CommunityStatus.ACTIVE).visibility(visibility).build());
        communityInfo.save(CommunityInfo.builder().community(community).build());
        addMember(community, owner, CommunityRole.OWNER);
        return community;
    }

    protected void addMember(Community community, User user, CommunityRole role) {
        members.save(CommunityMember.builder().community(community).user(user).role(role)
                .status(MembershipStatus.ACTIVE).joinedAt(LocalDateTime.now()).build());
    }

    protected Post publishedPost(User author, Community community) {
        return posts.save(Post.builder().user(author).community(community).type(PostType.TEXT)
                .status(PostStatus.PUBLISHED).isPinned(false).build());
    }

    protected Post publishedPost(User author, Community community, String title) {
        Post post = publishedPost(author, community);
        contents.save(PostContent.builder().post(post).title(title).content("Test content").build());
        return post;
    }

    protected static MockMultipartFile jsonPart(String name, String json) {
        return new MockMultipartFile(name, name + ".json", APPLICATION_JSON.toString(),
                json.getBytes(StandardCharsets.UTF_8));
    }

    protected static RequestPostProcessor as(User user) {
        return jwt().jwt(token -> token.subject(user.getUsername()))
                .authorities(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()));
    }

    protected static MockHttpServletRequestBuilder body(MockHttpServletRequestBuilder request, String body) {
        return request.contentType(APPLICATION_JSON).content(body);
    }
}
