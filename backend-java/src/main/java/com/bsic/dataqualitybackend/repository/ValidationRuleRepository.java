package com.bsic.dataqualitybackend.repository;

import com.bsic.dataqualitybackend.model.ValidationRule;
import com.bsic.dataqualitybackend.model.enums.ClientType;
import com.bsic.dataqualitybackend.model.enums.RuleType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ValidationRuleRepository extends JpaRepository<ValidationRule, Long> {

    List<ValidationRule> findByActive(Boolean active);

    List<ValidationRule> findByRuleType(RuleType ruleType);

    List<ValidationRule> findByClientType(ClientType clientType);

    List<ValidationRule> findByActiveAndClientType(Boolean active, ClientType clientType);

    List<ValidationRule> findByActiveOrderByPriorityDesc(Boolean active);

    List<ValidationRule> findByFieldName(String fieldName);

    List<ValidationRule> findByActiveAndFieldName(Boolean active, String fieldName);
}
