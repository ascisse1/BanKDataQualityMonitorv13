package com.adakalgroup.dataqualitybackend.dto.amplitude;

import jakarta.xml.bind.annotation.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * General customer attributes (branch, officer, segment, etc.).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@XmlAccessorType(XmlAccessType.FIELD)
public class GeneralAttributes {

    @XmlElement(name = "branchCode")
    private String branchCode;

    @XmlElement(name = "customerOfficer")
    private String customerOfficer;

    @XmlElement(name = "qualityCode")
    private String qualityCode;

    @XmlElement(name = "taxableCustomer")
    private Boolean taxableCustomer;

    @XmlElement(name = "internalCategoryCode")
    private String internalCategoryCode;

    @XmlElement(name = "segment")
    private String segment;

    @XmlElement(name = "statisticNumber")
    private String statisticNumber;

    @XmlElement(name = "sponsorCustomerCode")
    private String sponsorCustomerCode;

    @XmlElement(name = "centralBankRiskEffectiveDate")
    private String centralBankRiskEffectiveDate;
}
