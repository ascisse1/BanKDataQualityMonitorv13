package com.adakalgroup.dataqualitybackend.dto.amplitude;

import jakarta.xml.bind.annotation.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Individual customer specific information (personne physique).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@XmlAccessorType(XmlAccessType.FIELD)
public class IndividualSpecInfo {

    @XmlElement(name = "individualGeneralInfo")
    private IndividualGeneralInfo generalInfo;

    @XmlElement(name = "birth")
    private CustomerBirth birth;

    @XmlElement(name = "idPaper")
    private CustomerIdPaper idPaper;

    @XmlElement(name = "family")
    private CustomerFamily family;

    // ===== Nested types =====

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @XmlAccessorType(XmlAccessType.FIELD)
    public static class IndividualGeneralInfo {

        @XmlElement(name = "firstname")
        private String firstname;

        @XmlElement(name = "middlename")
        private String middlename;

        @XmlElement(name = "thirdname")
        private String thirdname;

        @XmlElement(name = "familyStatusCode")
        private String familyStatusCode;

        @XmlElement(name = "marriageSettlementCode")
        private String marriageSettlementCode;

        @XmlElement(name = "holderLegalCapacity")
        private String holderLegalCapacity;

        @XmlElement(name = "applicationDateOfLegalCapacity")
        private String applicationDateOfLegalCapacity;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @XmlAccessorType(XmlAccessType.FIELD)
    public static class CustomerBirth {

        @XmlElement(name = "holderSex")
        private String holderSex;

        @XmlElement(name = "maidenName")
        private String maidenName;

        @XmlElement(name = "birthDate")
        private String birthDate;

        @XmlElement(name = "birthCity")
        private String birthCity;

        @XmlElement(name = "birthCounty")
        private String birthCounty;

        @XmlElement(name = "birthRegion")
        private String birthRegion;

        @XmlElement(name = "birthCountry")
        private String birthCountry;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @XmlAccessorType(XmlAccessType.FIELD)
    public static class CustomerIdPaper {

        @XmlElement(name = "type")
        private String type;

        @XmlElement(name = "idPaperNumber")
        private String idPaperNumber;

        @XmlElement(name = "idPaperDeliveryDate")
        private String idPaperDeliveryDate;

        @XmlElement(name = "idPaperDeliveryPlace")
        private String idPaperDeliveryPlace;

        @XmlElement(name = "organisationWhichDeliver")
        private String organisationWhichDeliver;

        @XmlElement(name = "idPaperValidityDate")
        private String idPaperValidityDate;

        @XmlElement(name = "nationalIdentifier")
        private String nationalIdentifier;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @XmlAccessorType(XmlAccessType.FIELD)
    public static class CustomerFamily {

        @XmlElement(name = "spouseType")
        private String spouseType;

        @XmlElement(name = "spouseCode")
        private String spouseCode;

        @XmlElement(name = "numberOfChildren")
        private Short numberOfChildren;

        @XmlElement(name = "customerFamilyRelationshipCode")
        private String customerFamilyRelationshipCode;

        @XmlElement(name = "holderMotherName")
        private String holderMotherName;
    }
}
