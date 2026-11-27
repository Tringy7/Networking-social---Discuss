package com.discuss.discuss.service.chat;

import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;

@Configuration(proxyBeanMethods = false)
@Import({ChatAccess.class, ChatMessageStore.class, ChatChangePublisher.class})
public class ChatServiceConfiguration {
}
