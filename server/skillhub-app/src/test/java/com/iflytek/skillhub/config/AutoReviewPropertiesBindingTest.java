package com.iflytek.skillhub.config;

import org.junit.jupiter.api.Test;
import org.springframework.boot.context.properties.bind.Binder;
import org.springframework.boot.context.properties.source.ConfigurationPropertySources;
import org.springframework.boot.env.YamlPropertySourceLoader;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;
import org.springframework.core.env.StandardEnvironment;
import org.springframework.core.io.ClassPathResource;

import java.io.IOException;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

class AutoReviewPropertiesBindingTest {

    @Test
    void defaultConfig_disablesAutoReview() throws IOException {
        AutoReviewProperties properties = bindProperties(Map.of());

        assertFalse(properties.isEnabled());
        assertEquals(96, properties.getPassScore());
        assertEquals("system-auto-review", properties.getReviewerId());
    }

    @Test
    void environmentVariables_overrideAutoReviewDefaults() throws IOException {
        AutoReviewProperties properties = bindProperties(Map.of(
                "SKILLHUB_AUTO_REVIEW_ENABLED", "true",
                "SKILLHUB_AUTO_REVIEW_PASS_SCORE", "108",
                "SKILLHUB_AUTO_REVIEW_REVIEWER_ID", "robot-reviewer"
        ));

        assertEquals(true, properties.isEnabled());
        assertEquals(108, properties.getPassScore());
        assertEquals("robot-reviewer", properties.getReviewerId());
    }

    private AutoReviewProperties bindProperties(Map<String, Object> envVars) throws IOException {
        ConfigurableEnvironment environment = new StandardEnvironment();
        environment.getPropertySources().addFirst(new MapPropertySource("test-env", envVars));

        YamlPropertySourceLoader loader = new YamlPropertySourceLoader();
        List<org.springframework.core.env.PropertySource<?>> propertySources = loader.load(
                "application.yml",
                new ClassPathResource("application.yml")
        );
        for (org.springframework.core.env.PropertySource<?> propertySource : propertySources) {
            environment.getPropertySources().addLast(propertySource);
        }
        ConfigurationPropertySources.attach(environment);

        return Binder.get(environment)
                .bind("skillhub.auto-review", AutoReviewProperties.class)
                .orElseThrow(() -> new IllegalStateException("Failed to bind auto review properties"));
    }
}
