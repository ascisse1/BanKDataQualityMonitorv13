package com.adakalgroup.bdqm.service;

import com.adakalgroup.bdqm.config.AmplitudeApiProperties;
import com.adakalgroup.bdqm.dto.amplitude.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.UUID;

/**
 * Builds Amplitude API request objects from validated corrections.
 * Uses the CBS data dictionary api_field_path mapping to route
 * each correction to the correct position in the XML structure.
 */
@Slf4j
@Component
@ConditionalOnProperty(name = "app.amplitude-api.enabled", havingValue = "true")
public class AmplitudeRequestBuilder {

    private final AmplitudeApiProperties properties;
    private final CbsDataDictionaryService dictionaryService;

    public AmplitudeRequestBuilder(AmplitudeApiProperties properties,
                                   CbsDataDictionaryService dictionaryService) {
        this.properties = properties;
        this.dictionaryService = dictionaryService;
    }

    /**
     * Build a complete CustomerRequest from a set of field corrections.
     *
     * @param customerCode the customer code (CLI)
     * @param corrections map of CBS column name → corrected value
     * @return the CustomerRequest ready to send to the API
     */
    public CustomerRequest buildModifyRequest(String customerCode, Map<String, String> corrections) {
        Map<String, String> apiMapping = dictionaryService.getApiFieldMapping("bkcli");

        ModifyCustomerRequest payload = new ModifyCustomerRequest();
        payload.setCustomerCode(customerCode);

        int mappedFields = 0;
        for (Map.Entry<String, String> entry : corrections.entrySet()) {
            String cbsColumn = entry.getKey();
            String value = entry.getValue();

            String apiPath = apiMapping.get(cbsColumn);
            if (apiPath == null || apiPath.isBlank()) {
                log.warn("No api_field_path mapping for CBS column '{}' — skipping", cbsColumn);
                continue;
            }

            setFieldByPath(payload, apiPath, value);
            mappedFields++;
            log.debug("Mapped CBS column '{}' → API path '{}' = '{}'", cbsColumn, apiPath, value);
        }

        if (mappedFields == 0) {
            throw new IllegalArgumentException(
                    "No corrections could be mapped to API fields. Check api_field_path configuration in cbs_fields.");
        }

        log.info("Built Amplitude modifyCustomer request for {} with {} mapped fields out of {} corrections",
                customerCode, mappedFields, corrections.size());

        return CustomerRequest.builder()
                .requestHeader(buildRequestHeader())
                .modifyCustomerRequest(payload)
                .build();
    }

    private RequestHeader buildRequestHeader() {
        return RequestHeader.builder()
                .requestId1(RequestHeader.RequestId1.builder()
                        .requestId("BDQM-" + UUID.randomUUID().toString().substring(0, 8))
                        .build())
                .serviceName("modifyCustomer")
                .timestamp(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME))
                .originalName("BanKDataQualityMonitor")
                .userCode(properties.getUserCode())
                .channelCode(properties.getChannelCode())
                .build();
    }

    /**
     * Set a field value on the ModifyCustomerRequest by navigating the dot-separated path.
     * Creates intermediate objects as needed.
     *
     * Paths like "lastName" set root-level fields.
     * Paths like "individualSpecInfo.birth.birthDate" navigate into nested objects.
     */
    private void setFieldByPath(ModifyCustomerRequest request, String path, String value) {
        String[] parts = path.split("\\.");

        if (parts.length == 1) {
            setRootField(request, parts[0], value);
        } else if (parts.length >= 2) {
            String section = parts[0];
            switch (section) {
                case "situation" -> setSituationField(request, parts, value);
                case "individualSpecInfo" -> setIndividualField(request, parts, value);
                case "corporateSpecInfo" -> setCorporateField(request, parts, value);
                case "generalAttributes" -> setGeneralAttributesField(request, parts, value);
                case "reportingAttributes" -> setReportingAttributesField(request, parts, value);
                default -> log.warn("Unknown API path section: '{}'", section);
            }
        }
    }

    // ===== Root-level fields =====

    private void setRootField(ModifyCustomerRequest req, String field, String value) {
        switch (field) {
            case "lastName" -> req.setLastName(value);
            case "nameToReturn" -> req.setNameToReturn(value);
            case "language" -> req.setLanguage(value);
            case "titleCode" -> req.setTitleCode(value);
            case "memo" -> req.setMemo(value);
            case "externalIdentifier" -> req.setExternalIdentifier(value);
            case "freeFieldCode1" -> req.setFreeFieldCode1(value);
            case "freeFieldCode2" -> req.setFreeFieldCode2(value);
            case "freeFieldCode3" -> req.setFreeFieldCode3(value);
            default -> log.warn("Unknown root API field: '{}'", field);
        }
    }

    // ===== Situation =====

    private void setSituationField(ModifyCustomerRequest req, String[] parts, String value) {
        if (req.getSituation() == null) req.setSituation(new CustomerSituation());
        CustomerSituation sit = req.getSituation();

        String field = parts[1];
        switch (field) {
            case "nationalityCode" -> sit.setNationalityCode(value);
            case "countryOfResidence" -> sit.setCountryOfResidence(value);
            case "legalSituation" -> sit.setLegalSituation(value);
            case "applicationDateOfLegalSituation" -> sit.setApplicationDateOfLegalSituation(value);
            default -> log.warn("Unknown situation field: '{}'", field);
        }
    }

    // ===== Individual spec info =====

    private void setIndividualField(ModifyCustomerRequest req, String[] parts, String value) {
        if (req.getIndividualSpecInfo() == null) req.setIndividualSpecInfo(new IndividualSpecInfo());
        IndividualSpecInfo indiv = req.getIndividualSpecInfo();

        if (parts.length < 3) {
            log.warn("individualSpecInfo path too short: {}", String.join(".", parts));
            return;
        }

        String subSection = parts[1];
        String field = parts[2];

        switch (subSection) {
            case "generalInfo" -> {
                if (indiv.getGeneralInfo() == null)
                    indiv.setGeneralInfo(new IndividualSpecInfo.IndividualGeneralInfo());
                var info = indiv.getGeneralInfo();
                switch (field) {
                    case "firstname" -> info.setFirstname(value);
                    case "middlename" -> info.setMiddlename(value);
                    case "thirdname" -> info.setThirdname(value);
                    case "familyStatusCode" -> info.setFamilyStatusCode(value);
                    case "marriageSettlementCode" -> info.setMarriageSettlementCode(value);
                    case "holderLegalCapacity" -> info.setHolderLegalCapacity(value);
                    case "applicationDateOfLegalCapacity" -> info.setApplicationDateOfLegalCapacity(value);
                    default -> log.warn("Unknown individualGeneralInfo field: '{}'", field);
                }
            }
            case "birth" -> {
                if (indiv.getBirth() == null) indiv.setBirth(new IndividualSpecInfo.CustomerBirth());
                var birth = indiv.getBirth();
                switch (field) {
                    case "holderSex" -> birth.setHolderSex(value);
                    case "maidenName" -> birth.setMaidenName(value);
                    case "birthDate" -> birth.setBirthDate(value);
                    case "birthCity" -> birth.setBirthCity(value);
                    case "birthCounty" -> birth.setBirthCounty(value);
                    case "birthRegion" -> birth.setBirthRegion(value);
                    case "birthCountry" -> birth.setBirthCountry(value);
                    default -> log.warn("Unknown birth field: '{}'", field);
                }
            }
            case "idPaper" -> {
                if (indiv.getIdPaper() == null) indiv.setIdPaper(new IndividualSpecInfo.CustomerIdPaper());
                var idp = indiv.getIdPaper();
                switch (field) {
                    case "type" -> idp.setType(value);
                    case "idPaperNumber" -> idp.setIdPaperNumber(value);
                    case "idPaperDeliveryDate" -> idp.setIdPaperDeliveryDate(value);
                    case "idPaperDeliveryPlace" -> idp.setIdPaperDeliveryPlace(value);
                    case "organisationWhichDeliver" -> idp.setOrganisationWhichDeliver(value);
                    case "idPaperValidityDate" -> idp.setIdPaperValidityDate(value);
                    case "nationalIdentifier" -> idp.setNationalIdentifier(value);
                    default -> log.warn("Unknown idPaper field: '{}'", field);
                }
            }
            case "family" -> {
                if (indiv.getFamily() == null) indiv.setFamily(new IndividualSpecInfo.CustomerFamily());
                var fam = indiv.getFamily();
                switch (field) {
                    case "spouseType" -> fam.setSpouseType(value);
                    case "spouseCode" -> fam.setSpouseCode(value);
                    case "numberOfChildren" -> fam.setNumberOfChildren(Short.parseShort(value));
                    case "customerFamilyRelationshipCode" -> fam.setCustomerFamilyRelationshipCode(value);
                    case "holderMotherName" -> fam.setHolderMotherName(value);
                    default -> log.warn("Unknown family field: '{}'", field);
                }
            }
            default -> log.warn("Unknown individualSpecInfo sub-section: '{}'", subSection);
        }
    }

    // ===== Corporate spec info =====

    private void setCorporateField(ModifyCustomerRequest req, String[] parts, String value) {
        if (req.getCorporateSpecInfo() == null) req.setCorporateSpecInfo(new CorporateSpecInfo());
        CorporateSpecInfo corp = req.getCorporateSpecInfo();

        if (parts.length == 2) {
            // Direct corporate fields: corporateSpecInfo.tradeNameToDeclare
            String field = parts[1];
            switch (field) {
                case "tradeNameToDeclare" -> corp.setTradeNameToDeclare(value);
                case "secondTradeNameToDeclare" -> corp.setSecondTradeNameToDeclare(value);
                case "companyCreationDate" -> corp.setCompanyCreationDate(value);
                case "legalFormCode" -> corp.setLegalFormCode(value);
                case "statutoryAuditor1" -> corp.setStatutoryAuditor1(value);
                case "statutoryAuditor2" -> corp.setStatutoryAuditor2(value);
                default -> log.warn("Unknown corporateSpecInfo field: '{}'", field);
            }
        } else if (parts.length == 3) {
            // Nested: corporateSpecInfo.corporateId.nationalIdentifier
            String subSection = parts[1];
            String field = parts[2];
            switch (subSection) {
                case "corporateId" -> {
                    if (corp.getCorporateId() == null) corp.setCorporateId(new CorporateSpecInfo.CorporateId());
                    var cid = corp.getCorporateId();
                    switch (field) {
                        case "nationalIdentifier" -> cid.setNationalIdentifier(value);
                        case "socialIdentityNumber" -> cid.setSocialIdentityNumber(value);
                        case "taxIdentityNumber" -> cid.setTaxIdentityNumber(value);
                        case "abbreviation" -> cid.setAbbreviation(value);
                        default -> log.warn("Unknown corporateId field: '{}'", field);
                    }
                }
                case "legalInformation" -> {
                    if (corp.getLegalInformation() == null)
                        corp.setLegalInformation(new CorporateSpecInfo.LegalInformation());
                    var legal = corp.getLegalInformation();
                    switch (field) {
                        case "tradeRegisterNumber" -> legal.setTradeRegisterNumber(value);
                        case "deliveryDateOfTradeRegister" -> legal.setDeliveryDateOfTradeRegister(value);
                        case "tradeRegisterDeliveryPlace" -> legal.setTradeRegisterDeliveryPlace(value);
                        case "validityDateOfTradeRegister" -> legal.setValidityDateOfTradeRegister(value);
                        case "chamberOfCommerceCode" -> legal.setChamberOfCommerceCode(value);
                        case "licenseNumber" -> legal.setLicenseNumber(value);
                        case "validityDateOfLicense" -> legal.setValidityDateOfLicense(value);
                        default -> log.warn("Unknown legalInformation field: '{}'", field);
                    }
                }
                case "groupAndJob" -> {
                    if (corp.getGroupAndJob() == null)
                        corp.setGroupAndJob(new CorporateSpecInfo.GroupAndJob());
                    var gj = corp.getGroupAndJob();
                    switch (field) {
                        case "customersGroup" -> gj.setCustomersGroup(value);
                        case "subgroup" -> gj.setSubgroup(value);
                        case "job" -> gj.setJob(value);
                        case "subjob" -> gj.setSubjob(value);
                        default -> log.warn("Unknown groupAndJob field: '{}'", field);
                    }
                }
                default -> log.warn("Unknown corporateSpecInfo sub-section: '{}'", subSection);
            }
        }
    }

    // ===== General attributes =====

    private void setGeneralAttributesField(ModifyCustomerRequest req, String[] parts, String value) {
        if (req.getGeneralAttributes() == null) req.setGeneralAttributes(new GeneralAttributes());
        GeneralAttributes ga = req.getGeneralAttributes();

        String field = parts[1];
        switch (field) {
            case "branchCode" -> ga.setBranchCode(value);
            case "customerOfficer" -> ga.setCustomerOfficer(value);
            case "qualityCode" -> ga.setQualityCode(value);
            case "taxableCustomer" -> ga.setTaxableCustomer(Boolean.parseBoolean(value));
            case "internalCategoryCode" -> ga.setInternalCategoryCode(value);
            case "segment" -> ga.setSegment(value);
            case "statisticNumber" -> ga.setStatisticNumber(value);
            case "sponsorCustomerCode" -> ga.setSponsorCustomerCode(value);
            case "centralBankRiskEffectiveDate" -> ga.setCentralBankRiskEffectiveDate(value);
            default -> log.warn("Unknown generalAttributes field: '{}'", field);
        }
    }

    // ===== Reporting attributes =====

    private void setReportingAttributesField(ModifyCustomerRequest req, String[] parts, String value) {
        if (req.getReportingAttributes() == null) req.setReportingAttributes(new ReportingAttributes());
        ReportingAttributes ra = req.getReportingAttributes();

        String field = parts[1];
        switch (field) {
            case "declaredHome" -> ra.setDeclaredHome(value);
            case "economicAgentCode" -> ra.setEconomicAgentCode(value);
            case "activityFieldCode" -> ra.setActivityFieldCode(value);
            case "relationshipWithTheBank" -> ra.setRelationshipWithTheBank(value);
            case "gradingAgreement" -> ra.setGradingAgreement(value);
            default -> log.warn("Unknown reportingAttributes field: '{}'", field);
        }
    }
}
