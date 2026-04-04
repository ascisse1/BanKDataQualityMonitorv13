package com.adakalgroup.bdqm.dto.amplitude;

import jakarta.xml.bind.annotation.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Payload for the modifyCustomer Amplitude API service.
 * Fields match the exact XML schema from docs/api/types/modifyCustomerRequest.html.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@XmlAccessorType(XmlAccessType.FIELD)
public class ModifyCustomerRequest {

    // ===== Root-level fields =====

    @XmlElement(name = "customerCode", required = true)
    private String customerCode;

    @XmlElement(name = "language")
    private String language;

    @XmlElement(name = "titleCode")
    private String titleCode;

    @XmlElement(name = "lastName")
    private String lastName;

    @XmlElement(name = "nameToReturn")
    private String nameToReturn;

    @XmlElement(name = "freeFieldCode1")
    private String freeFieldCode1;

    @XmlElement(name = "freeFieldCode2")
    private String freeFieldCode2;

    @XmlElement(name = "freeFieldCode3")
    private String freeFieldCode3;

    @XmlElement(name = "memo")
    private String memo;

    @XmlElement(name = "externalIdentifier")
    private String externalIdentifier;

    // ===== Nested structures =====

    @XmlElement(name = "situation")
    private CustomerSituation situation;

    @XmlElement(name = "individualSpecInfo")
    private IndividualSpecInfo individualSpecInfo;

    @XmlElement(name = "corporateSpecInfo")
    private CorporateSpecInfo corporateSpecInfo;

    @XmlElement(name = "generalAttributes")
    private GeneralAttributes generalAttributes;

    @XmlElement(name = "reportingAttributes")
    private ReportingAttributes reportingAttributes;
}
