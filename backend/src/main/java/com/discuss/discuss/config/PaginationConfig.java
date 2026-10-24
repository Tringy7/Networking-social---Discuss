package com.discuss.discuss.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.web.config.PageableHandlerMethodArgumentResolverCustomizer;

@Configuration
public class PaginationConfig {

    @Value("${app.pagination.default-page-size}")
    private int defaultPageSize;

    @Value("${app.pagination.max-page-size}")
    private int maxPageSize;

    @Bean
    public PageableHandlerMethodArgumentResolverCustomizer paginationCustomizer() {
        return resolver -> {
            resolver.setFallbackPageable(PageRequest.of(0, defaultPageSize));
            resolver.setMaxPageSize(maxPageSize);
        };
    }
}