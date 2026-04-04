package com.adakalgroup.dataqualitybackend.dto.amplitude;

import jakarta.xml.bind.annotation.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Root envelope for Amplitude modifyCustomer API request.
 * Maps to the CustomerRequest XML root element.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@XmlRootElement(name = "CustomerRequest")
@XmlAccessorType(XmlAccessType.FIELD)
public class CustomerRequest {

    @XmlElement(name = "requestHeader", required = true)
    private RequestHeader requestHeader;

    @XmlElement(name = "modifyCustomerRequest", required = true)
    private ModifyCustomerRequest modifyCustomerRequest;
}
