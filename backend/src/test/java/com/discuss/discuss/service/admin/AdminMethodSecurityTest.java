package com.discuss.discuss.service.admin;
import com.discuss.discuss.service.audit.ActivityLogService;
import com.discuss.discuss.service.post.*;
import org.junit.jupiter.api.*;
import org.springframework.context.annotation.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.core.annotation.AnnotationTemplateExpressionDefaults;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
class AdminMethodSecurityTest {
    AnnotationConfigApplicationContext context;
    @Configuration @EnableMethodSecurity(proxyTargetClass = true)
    static class Config {
        @Bean static AnnotationTemplateExpressionDefaults templates() { return new AnnotationTemplateExpressionDefaults(); }
        @Bean PostQueryService queries() { return mock(PostQueryService.class); }
        @Bean PostService posts() { return mock(PostService.class); }
        @Bean ActivityLogService logs() { return mock(ActivityLogService.class); }
        @Bean AdminPostService admin(PostQueryService q, PostService p, ActivityLogService l) { return new AdminPostService(q, p, l); }
    }
    @BeforeEach void setup() { context = new AnnotationConfigApplicationContext(Config.class); }
    @AfterEach void cleanup() { SecurityContextHolder.clearContext(); if (context != null) context.close(); }
    @Test void regularUserCannotReadOrDeleteThroughAdminService() {
        login("USER");
        var service = context.getBean(AdminPostService.class);
        assertThrows(AccessDeniedException.class, () -> service.getDetail(1L));
        assertThrows(AccessDeniedException.class, () -> service.delete(1L));
        verifyNoInteractions(raw(PostQueryService.class), raw(PostService.class));
    }
    @Test void administratorCanUseManagementQuery() {
        login("ADMIN");
        context.getBean(AdminPostService.class).getDetail(1L);
        verify(raw(PostQueryService.class)).getForAdmin(1L);
    }
    <T> T raw(Class<T> type) { return org.springframework.test.util.AopTestUtils.getUltimateTargetObject(context.getBean(type)); }
    void login(String role) {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                "tester", "unused", List.of(new SimpleGrantedAuthority("ROLE_" + role))));
    }
}
