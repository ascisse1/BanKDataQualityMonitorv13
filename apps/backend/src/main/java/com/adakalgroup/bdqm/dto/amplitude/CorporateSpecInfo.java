package com.adakalgroup.bdqm.dto.amplitude;

import jakarta.xml.bind.annotation.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Corporate customer specific information (personne morale).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@XmlAccessorType(XmlAccessType.FIELD)
public class CorporateSpecInfo {

    @XmlElement(name = "tradeNameToDeclare")
    private String tradeNameToDeclare;

    @XmlElement(name = "secondTradeNameToDeclare")
    private String secondTradeNameToDeclare;

    @XmlElement(name = "companyCreationDate")
    private String companyCreationDate;

    @XmlElement(name = "legalFormCode")
    private String legalFormCode;

    @XmlElement(name = "statutoryAuditor1")
    private String statutoryAuditor1;

    @XmlElement(name = "statutoryAuditor2")
    private String statutoryAuditor2;

    @XmlElement(name = "corporateId")
    private CorporateId corporateId;

    @XmlElement(name = "legalInformation")
    private LegalInformation legalInformation;

    @XmlElement(name = "groupAndJob")
    private GroupAndJob groupAndJob;

    // ===== Nested types =====

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @XmlAccessorType(XmlAccessType.FIELD)
    public static class CorporateId {

        @XmlElement(name = "nationalIdentifier")
        private String nationalIdentifier;

        @XmlElement(name = "socialIdentityNumber")
        private String socialIdentityNumber;

        @XmlElement(name = "taxIdentityNumber")
        private String taxIdentityNumber;

        @XmlElement(name = "abbreviation")
        private String abbreviation;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @XmlAccessorType(XmlAccessType.FIELD)
    public static class LegalInformation {

        @XmlElement(name = "tradeRegisterNumber")
        private String tradeRegisterNumber;

        @XmlElement(name = "deliveryDateOfTradeRegister")
        private String deliveryDateOfTradeRegister;

        @XmlElement(name = "tradeRegisterDeliveryPlace")
        private String tradeRegisterDeliveryPlace;

        @XmlElement(name = "validityDateOfTradeRegister")
        private String validityDateOfTradeRegister;

        @XmlElement(name = "chamberOfCommerceCode")
        private String chamberOfCommerceCode;

        @XmlElement(name = "licenseNumber")
        private String licenseNumber;

        @XmlElement(name = "validityDateOfLicense")
        private String validityDateOfLicense;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @XmlAccessorType(XmlAccessType.FIELD)
    public static class GroupAndJob {

        @XmlElement(name = "customersGroup")
        private String customersGroup;

        @XmlElement(name = "subgroup")
        private String subgroup;

        @XmlElement(name = "job")
        private String job;

        @XmlElement(name = "subjob")
        private String subjob;
    }
}
