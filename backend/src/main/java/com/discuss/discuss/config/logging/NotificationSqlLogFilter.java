package com.discuss.discuss.config.logging;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.turbo.TurboFilter;
import ch.qos.logback.core.spi.FilterReply;
import org.slf4j.MDC;
import org.slf4j.Marker;

public class NotificationSqlLogFilter extends TurboFilter {
    public static final String WORKER_CONTEXT = "notificationOutboxWorker";

    @Override
    public FilterReply decide(Marker marker, Logger logger, Level level, String format,
                              Object[] params, Throwable throwable) {
        if ("org.hibernate.SQL".equals(logger.getName()) && Level.DEBUG.equals(level)
                && "true".equals(MDC.get(WORKER_CONTEXT))) {
            return FilterReply.DENY;
        }
        return FilterReply.NEUTRAL;
    }
}
