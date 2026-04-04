package com.adakalgroup.bdqm.dto.amplitude;

import jakarta.xml.bind.annotation.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Customer reporting attributes.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@XmlAccessorType(XmlAccessType.FIELD)
public class ReportingAttributes {

    @XmlElement(name = "declaredHome")
    private String declaredHome;

    @XmlElement(name = "economicAgentCode")
    private String economicAgentCode;

    @XmlElement(name = "activityFieldCode")
    private String activityFieldCode;

    @XmlElement(name = "relationshipWithTheBank")
    private String relationshipWithTheBank;

    @XmlElement(name = "gradingAgreement")
    private String gradingAgreement;
}
