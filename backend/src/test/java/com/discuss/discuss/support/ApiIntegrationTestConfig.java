package com.discuss.discuss.support;

import com.discuss.discuss.config.*;
import com.discuss.discuss.controller.chat.ChatConversationController;
import com.discuss.discuss.controller.chat.ChatMessageController;
import com.discuss.discuss.controller.chat.ChatPrivacyController;
import com.discuss.discuss.controller.chat.ChatRealtimeController;
import com.discuss.discuss.controller.chat.ChatRequestController;
import com.discuss.discuss.service.chat.ChatAttachmentService;
import com.discuss.discuss.service.media.AttachmentMediaService;
import com.discuss.discuss.service.chat.ChatConversationService;
import com.discuss.discuss.service.chat.ChatMessageService;
import com.discuss.discuss.service.chat.ChatPrivacyService;
import com.discuss.discuss.service.chat.ChatReactionService;
import com.discuss.discuss.service.chat.ChatReportEvidenceService;
import com.discuss.discuss.service.chat.ChatRequestService;
import com.discuss.discuss.service.chat.ChatUpdates;
import com.discuss.discuss.service.chat.ChatServiceConfiguration;
import com.discuss.discuss.controller.admin.ManageCategoryController;
import com.discuss.discuss.controller.admin.ManageCommunityController;
import com.discuss.discuss.controller.admin.ManagePostController;
import com.discuss.discuss.controller.admin.ManageReputationController;
import com.discuss.discuss.controller.admin.ManageUserController;
import com.discuss.discuss.controller.admin.AdminController;
import com.discuss.discuss.controller.admin.ManageActivityLogController;
import com.discuss.discuss.controller.admin.ManageReportController;
import com.discuss.discuss.controller.comment.CommentController;
import com.discuss.discuss.controller.comment.PostCommentController;
import com.discuss.discuss.controller.community.CommunityController;
import com.discuss.discuss.controller.community.CommunityMemberController;
import com.discuss.discuss.controller.community.CategoryController;
import com.discuss.discuss.controller.community.ExploreCommunityController;
import com.discuss.discuss.controller.notification.CommunityNotificationPreferenceController;
import com.discuss.discuss.controller.notification.NotificationController;
import com.discuss.discuss.controller.post.PostController;
import com.discuss.discuss.controller.post.PostFeedController;
import com.discuss.discuss.controller.report.ReportController;
import com.discuss.discuss.controller.user.UserController;
import com.discuss.discuss.controller.user.UserSearchController;
import com.discuss.discuss.entity.User;
import com.discuss.discuss.exception.GlobalExceptionHandler;
import com.discuss.discuss.mapper.chat.ChatMapperImpl;
import com.discuss.discuss.mapper.comment.CommentMapper;
import com.discuss.discuss.mapper.community.CommunityMapper;
import com.discuss.discuss.mapper.community.CommunityMemberMapper;
import com.discuss.discuss.mapper.page.PageMapper;
import com.discuss.discuss.mapper.post.PostMapper;
import com.discuss.discuss.mapper.report.ReportMapper;
import com.discuss.discuss.mapper.user.UserMapper;
import com.discuss.discuss.mapper.user.UserUpdateMapperImpl;
import com.discuss.discuss.repository.UserRepository;
import com.discuss.discuss.service.admin.AdminCategoryService;
import com.discuss.discuss.service.admin.AdminCommunityService;
import com.discuss.discuss.service.admin.AdminPostService;
import com.discuss.discuss.service.admin.AdminReputationService;
import com.discuss.discuss.service.admin.AdminUserService;
import com.discuss.discuss.service.admin.AdminService;
import com.discuss.discuss.service.admin.AdminActivityLogService;
import com.discuss.discuss.service.admin.AdminReportService;
import com.discuss.discuss.service.audit.ActivityLogService;
import com.discuss.discuss.service.auth.JwtService;
import com.discuss.discuss.service.auth.SessionTokenValidator;
import com.discuss.discuss.service.comment.*;
import com.discuss.discuss.service.community.*;
import com.discuss.discuss.service.notification.CommunityNotificationPreferenceService;
import com.discuss.discuss.service.notification.NotificationEvents;
import com.discuss.discuss.service.notification.NotificationService;
import com.discuss.discuss.service.post.*;
import com.discuss.discuss.service.report.*;
import com.discuss.discuss.service.user.*;
import com.zaxxer.hikari.HikariDataSource;
import jakarta.persistence.EntityManagerFactory;
import org.hibernate.boot.model.naming.PhysicalNamingStrategySnakeCaseImpl;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.context.annotation.ImportCandidates;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.ImportSelector;
import org.springframework.core.type.AnnotationMetadata;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.data.web.config.EnableSpringDataWebSupport;
import org.springframework.orm.jpa.JpaTransactionManager;
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean;
import org.springframework.orm.jpa.vendor.HibernateJpaVendorAdapter;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.transaction.annotation.EnableTransactionManagement;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;
import tools.jackson.databind.json.JsonMapper;

import javax.sql.DataSource;
import java.util.Map;

@Configuration(proxyBeanMethods = false)
@EnableWebMvc
@EnableSpringDataWebSupport
@EnableWebSecurity
@EnableTransactionManagement(proxyTargetClass = true)
@EnableJpaRepositories(basePackageClasses = UserRepository.class)
@Import({SecurityConfiguration.class, CustomAuthenticationEntryPoint.class, CustomAccessDeniedHandler.class,
        ChatConversationController.class, ChatRequestController.class, ChatMessageController.class,
        ChatPrivacyController.class, ChatRealtimeController.class,
        ChatServiceConfiguration.class, ChatAttachmentService.class, AttachmentMediaService.class, ChatConversationService.class, ChatMessageService.class, ChatPrivacyService.class, ChatReactionService.class, ChatReportEvidenceService.class, ChatRequestService.class,
        ChatUpdates.class, SessionTokenValidator.class, JwtService.class, GlobalExceptionHandler.class,
        UserController.class, CommunityMemberController.class, CommunityController.class, PostController.class,
        CommentController.class,
        ReportController.class, NotificationController.class, ManageUserController.class,
        CommunityNotificationPreferenceController.class, ManageCategoryController.class,
        ManageReputationController.class, ManageCommunityController.class, ManagePostController.class,
        UserService.class, UserSpecifications.class, UserPrivacyService.class, UserAuthorizationService.class,
        UserProfileService.class, PublicUserProfileService.class, UserReputationService.class,
        CommunityMemberService.class, CommunitySupport.class, CommunityAuthorizationService.class, CategoryService.class,
        CommunityService.class, CommunityInfoService.class, CommunityRulesService.class, CommunitySpecifications.class,
        PostService.class, PostSupport.class, PostQueryService.class, PostSpecifications.class, PostAttachmentService.class,
        CommentService.class, CommentSupport.class, CommentAttachmentService.class,
        ReportService.class, ReportSupport.class, ReportReviewService.class, PostReportQueryService.class,
        CommentReportQueryService.class, NotificationService.class, NotificationEvents.class,
        CommunityNotificationPreferenceService.class, AdminUserService.class, AdminCategoryService.class,
        AdminReputationService.class, AdminCommunityService.class, AdminPostService.class,
        ActivityLogService.class, PageMapper.class, ChatMapperImpl.class, PostMapper.class, CommentMapper.class, ReportMapper.class,
        UserMapper.class, UserUpdateMapperImpl.class, CommunityMapper.class, CommunityMemberMapper.class,
        AdminController.class, ManageActivityLogController.class, ManageReportController.class,
        PostCommentController.class, CategoryController.class, ExploreCommunityController.class,
        PostFeedController.class, UserSearchController.class, AdminService.class,
        AdminActivityLogService.class, AdminReportService.class, CommentQueryService.class,
        CommunityReportQueryService.class, UserSearchService.class, ApiIntegrationTestConfig.FilterImports.class})
class ApiIntegrationTestConfig {
    static class FilterImports implements ImportSelector {
        @Override
        public String[] selectImports(AnnotationMetadata metadata) {
            return ImportCandidates.load(AutoConfiguration.class, getClass().getClassLoader()).getCandidates().stream()
                    .filter(name -> name.startsWith("com.turkraft.springfilter."))
                    .toArray(String[]::new);
        }
    }

    @Bean
    HikariDataSource dataSource() {
        var dataSource = new HikariDataSource();
        dataSource.setJdbcUrl("jdbc:h2:mem:discuss-api;MODE=MySQL;DB_CLOSE_DELAY=-1");
        dataSource.setUsername("sa");
        return dataSource;
    }

    @Bean
    LocalContainerEntityManagerFactoryBean entityManagerFactory(DataSource dataSource) {
        var factory = new LocalContainerEntityManagerFactoryBean();
        factory.setDataSource(dataSource);
        factory.setPackagesToScan(User.class.getPackageName());
        factory.setJpaVendorAdapter(new HibernateJpaVendorAdapter());
        factory.setJpaPropertyMap(Map.of("hibernate.hbm2ddl.auto", "create-drop",
                "hibernate.physical_naming_strategy", PhysicalNamingStrategySnakeCaseImpl.class.getName(),
                "hibernate.hbm2ddl.halt_on_error", true));
        return factory;
    }

    @Bean
    JpaTransactionManager transactionManager(EntityManagerFactory entityManagerFactory) {
        return new JpaTransactionManager(entityManagerFactory);
    }

    @Bean
    JsonMapper objectMapper() {
        return JsonMapper.builder().build();
    }
}
