package com.adakalgroup.dataqualitybackend.dto.amplitude;

import jakarta.xml.bind.annotation.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request header for Amplitude API calls.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@XmlAccessorType(XmlAccessType.FIELD)
public class RequestHeader {

    @XmlElement(name = "requestId1", required = true)
    private RequestId1 requestId1;

    @XmlElement(name = "serviceName", required = true)
    private String serviceName;

    @XmlElement(name = "timestamp", required = true)
    private String timestamp;

    @XmlElement(name = "originalName")
    private String originalName;

    @XmlElement(name = "languageCode")
    private String languageCode;

    @XmlElement(name = "userCode", required = true)
    private String userCode;

    @XmlElement(name = "channelCode")
    private String channelCode;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @XmlAccessorType(XmlAccessType.FIELD)
    public static class RequestId1 {
        @XmlElement(name = "requestId", required = true)
        private String requestId;
    }
}
