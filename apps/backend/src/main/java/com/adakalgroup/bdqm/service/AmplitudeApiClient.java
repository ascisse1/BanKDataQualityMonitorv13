package com.adakalgroup.bdqm.service;

import com.adakalgroup.bdqm.config.AmplitudeApiProperties;
import com.adakalgroup.bdqm.dto.amplitude.CustomerRequest;
import com.adakalgroup.bdqm.dto.amplitude.CustomerResponse;
import jakarta.xml.bind.JAXBContext;
import jakarta.xml.bind.Marshaller;
import jakarta.xml.bind.Unmarshaller;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.io.StringReader;
import java.io.StringWriter;
import java.util.List;
import java.util.stream.Collectors;

/**
 * HTTP client for calling the Amplitude CBS REST API.
 * Handles XML serialization/deserialization via JAXB and API key authentication.
 */
@Slf4j
@Component
@ConditionalOnProperty(name = "app.amplitude-api.enabled", havingValue = "true")
public class AmplitudeApiClient {

    private final RestTemplate restTemplate;
    private final AmplitudeApiProperties properties;
    private final JAXBContext requestContext;
    private final JAXBContext responseContext;

    public AmplitudeApiClient(RestTemplate restTemplate, AmplitudeApiProperties properties) {
        this.restTemplate = restTemplate;
        this.properties = properties;
        try {
            this.requestContext = JAXBContext.newInstance(CustomerRequest.class);
            this.responseContext = JAXBContext.newInstance(CustomerResponse.class);
        } catch (Exception e) {
            throw new RuntimeException("Failed to initialize JAXB contexts for Amplitude API", e);
        }
    }

    /**
     * Call the modifyCustomer Amplitude API.
     *
     * @param customerCode the customer code (CLI)
     * @param request the full CustomerRequest envelope
     * @return the parsed CustomerResponse
     */
    public CustomerResponse modifyCustomer(String customerCode, CustomerRequest request) {
        String url = String.format("%s/customers/%s/%s",
                properties.getBaseUrl(), properties.getVersion(), customerCode);

        String xmlBody = marshalRequest(request);

        log.info("Calling Amplitude API: PUT {} for customer {}", url, customerCode);
        log.debug("Amplitude API request XML:\n{}", xmlBody);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_XML);
        headers.setAccept(List.of(MediaType.APPLICATION_XML));
        headers.set("X-SBS-ApiKey", properties.getApiKey());

        HttpEntity<String> httpEntity = new HttpEntity<>(xmlBody, headers);

        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    url, HttpMethod.PUT, httpEntity, String.class);

            log.info("Amplitude API response: HTTP {} for customer {}", response.getStatusCode(), customerCode);
            log.debug("Amplitude API response XML:\n{}", response.getBody());

            if (response.getBody() == null) {
                throw new AmplitudeApiException("Empty response from Amplitude API", null);
            }

            CustomerResponse parsed = unmarshalResponse(response.getBody());

            if (parsed.hasErrors()) {
                String errorDetails = extractErrorDetails(parsed);
                log.error("Amplitude API returned errors for customer {}: {}", customerCode, errorDetails);
                throw new AmplitudeApiException("Amplitude API error: " + errorDetails, parsed);
            }

            if (parsed.hasWarnings()) {
                String warningDetails = extractWarningDetails(parsed);
                log.warn("Amplitude API returned warnings for customer {}: {}", customerCode, warningDetails);
            }

            return parsed;

        } catch (AmplitudeApiException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to call Amplitude API for customer {}: {}", customerCode, e.getMessage(), e);
            throw new AmplitudeApiException("HTTP call to Amplitude API failed: " + e.getMessage(), null, e);
        }
    }

    private String marshalRequest(CustomerRequest request) {
        try {
            Marshaller marshaller = requestContext.createMarshaller();
            marshaller.setProperty(Marshaller.JAXB_FORMATTED_OUTPUT, true);
            marshaller.setProperty(Marshaller.JAXB_ENCODING, "UTF-8");
            StringWriter writer = new StringWriter();
            marshaller.marshal(request, writer);
            return writer.toString();
        } catch (Exception e) {
            throw new RuntimeException("Failed to marshal CustomerRequest to XML", e);
        }
    }

    private CustomerResponse unmarshalResponse(String xml) {
        try {
            Unmarshaller unmarshaller = responseContext.createUnmarshaller();
            return (CustomerResponse) unmarshaller.unmarshal(new StringReader(xml));
        } catch (Exception e) {
            throw new RuntimeException("Failed to unmarshal Amplitude API response XML", e);
        }
    }

    private String extractErrorDetails(CustomerResponse response) {
        if (response.getResponseStatus().getMessages() == null ||
                response.getResponseStatus().getMessages().getMessage() == null) {
            return "Unknown error (statusCode=" + response.getResponseStatus().getStatusCode() + ")";
        }
        return response.getResponseStatus().getMessages().getMessage().stream()
                .filter(m -> "ERROR".equals(m.getNature()))
                .map(m -> {
                    String msg = m.getCode();
                    if (m.getLine() != null && !m.getLine().isEmpty()) {
                        msg += " - " + String.join("; ", m.getLine());
                    }
                    if (m.getErrorInformation() != null) {
                        msg += " [" + m.getErrorInformation().getErrorMessage() + "]";
                    }
                    return msg;
                })
                .collect(Collectors.joining(" | "));
    }

    private String extractWarningDetails(CustomerResponse response) {
        if (response.getResponseStatus().getMessages() == null ||
                response.getResponseStatus().getMessages().getMessage() == null) {
            return "";
        }
        return response.getResponseStatus().getMessages().getMessage().stream()
                .filter(m -> "WARNING".equals(m.getNature()))
                .map(m -> m.getCode() + (m.getLine() != null ? " - " + String.join("; ", m.getLine()) : ""))
                .collect(Collectors.joining(" | "));
    }

    /**
     * Exception specific to Amplitude API errors.
     */
    public static class AmplitudeApiException extends RuntimeException {
        private final CustomerResponse response;

        public AmplitudeApiException(String message, CustomerResponse response) {
            super(message);
            this.response = response;
        }

        public AmplitudeApiException(String message, CustomerResponse response, Throwable cause) {
            super(message, cause);
            this.response = response;
        }

        public CustomerResponse getResponse() {
            return response;
        }
    }
}
