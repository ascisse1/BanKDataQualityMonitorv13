package com.adakalgroup.dataqualitybackend.dto.amplitude;

import jakarta.xml.bind.annotation.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Root envelope for Amplitude modifyCustomer API response.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@XmlRootElement(name = "CustomerResponse")
@XmlAccessorType(XmlAccessType.FIELD)
public class CustomerResponse {

    @XmlElement(name = "responseHeader")
    private ResponseHeader responseHeader;

    @XmlElement(name = "responseStatus")
    private ResponseStatus responseStatus;

    public boolean isSuccess() {
        return responseStatus != null && responseStatus.getStatusCode() >= 0;
    }

    public boolean hasErrors() {
        return responseStatus != null && responseStatus.getStatusCode() == -1;
    }

    public boolean hasWarnings() {
        return responseStatus != null && responseStatus.getStatusCode() == 1;
    }

    // ===== Nested types =====

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @XmlAccessorType(XmlAccessType.FIELD)
    public static class ResponseHeader {

        @XmlElement(name = "requestId1")
        private RequestHeader.RequestId1 requestId1;

        @XmlElement(name = "responseId")
        private String responseId;

        @XmlElement(name = "timestamp")
        private String timestamp;

        @XmlElement(name = "serviceVersion")
        private String serviceVersion;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @XmlAccessorType(XmlAccessType.FIELD)
    public static class ResponseStatus {

        /** -1 = error, 0 = success, 1 = success with warnings */
        @XmlElement(name = "statusCode")
        private int statusCode;

        @XmlElement(name = "messages")
        private ResponseMessages messages;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @XmlAccessorType(XmlAccessType.FIELD)
    public static class ResponseMessages {

        @XmlElement(name = "message")
        private List<ResponseMessage> message;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @XmlAccessorType(XmlAccessType.FIELD)
    public static class ResponseMessage {

        /** WARNING, INFO, ERROR */
        @XmlElement(name = "nature")
        private String nature;

        @XmlElement(name = "code")
        private String code;

        @XmlElement(name = "line")
        private List<String> line;

        @XmlElement(name = "errorInformation")
        private ErrorInformation errorInformation;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @XmlAccessorType(XmlAccessType.FIELD)
    public static class ErrorInformation {

        @XmlElement(name = "errorCode")
        private String errorCode;

        @XmlElement(name = "convertedCode")
        private String convertedCode;

        @XmlElement(name = "errorMessage")
        private String errorMessage;
    }
}
