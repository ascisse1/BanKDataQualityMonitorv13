package com.adakalgroup.dataqualitybackend.dto.amplitude;

import jakarta.xml.bind.annotation.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Customer situation (nationality, residence, legal situation).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@XmlAccessorType(XmlAccessType.FIELD)
public class CustomerSituation {

    @XmlElement(name = "nationalityCode")
    private String nationalityCode;

    @XmlElement(name = "countryOfResidence")
    private String countryOfResidence;

    @XmlElement(name = "legalSituation")
    private String legalSituation;

    @XmlElement(name = "applicationDateOfLegalSituation")
    private String applicationDateOfLegalSituation;
}
