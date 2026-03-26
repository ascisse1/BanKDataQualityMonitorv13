package com.bsic.dataqualitybackend.config;

import io.micrometer.tracing.Tracer;
import io.micrometer.tracing.propagation.Propagator;
import io.opentelemetry.api.OpenTelemetry;
import io.opentelemetry.api.common.AttributeKey;
import io.opentelemetry.api.common.Attributes;
import io.opentelemetry.api.trace.propagation.W3CTraceContextPropagator;
import io.opentelemetry.context.propagation.ContextPropagators;
import io.opentelemetry.exporter.otlp.trace.OtlpGrpcSpanExporter;
import io.opentelemetry.sdk.OpenTelemetrySdk;
import io.opentelemetry.sdk.resources.Resource;
import io.opentelemetry.sdk.trace.SdkTracerProvider;
import io.opentelemetry.sdk.trace.export.BatchSpanProcessor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * OpenTelemetry configuration for distributed tracing.
 * Exports traces to Tempo via OTLP protocol.
 */
@Slf4j
@Configuration
@ConditionalOnProperty(name = "management.tracing.enabled", havingValue = "true", matchIfMissing = true)
public class TracingConfig {

    @Value("${spring.application.name:bsic-data-quality-backend}")
    private String applicationName;

    @Value("${management.otlp.tracing.endpoint:http://localhost:4317}")
    private String otlpEndpoint;

    @Bean
    public OpenTelemetry openTelemetry() {
        Resource resource = Resource.getDefault()
                .merge(Resource.create(Attributes.of(
                        AttributeKey.stringKey("service.name"), applicationName,
                        AttributeKey.stringKey("service.version"), "1.0.0",
                        AttributeKey.stringKey("deployment.environment"), "development"
                )));

        OtlpGrpcSpanExporter spanExporter = OtlpGrpcSpanExporter.builder()
                .setEndpoint(otlpEndpoint)
                .build();

        SdkTracerProvider tracerProvider = SdkTracerProvider.builder()
                .addSpanProcessor(BatchSpanProcessor.builder(spanExporter).build())
                .setResource(resource)
                .build();

        OpenTelemetrySdk openTelemetry = OpenTelemetrySdk.builder()
                .setTracerProvider(tracerProvider)
                .setPropagators(ContextPropagators.create(W3CTraceContextPropagator.getInstance()))
                .build();

        // Register shutdown hook
        Runtime.getRuntime().addShutdownHook(new Thread(tracerProvider::close));

        log.info("OpenTelemetry configured with OTLP endpoint: {}", otlpEndpoint);
        return openTelemetry;
    }
}
