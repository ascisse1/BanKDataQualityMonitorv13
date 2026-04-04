package com.adakalgroup.bdqm.repository;

import com.adakalgroup.bdqm.model.ValidationRule;
import com.adakalgroup.bdqm.model.enums.ClientType;
import com.adakalgroup.bdqm.model.enums.RuleType;
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

    /**
     * Find active rules for a specific client type OR rules that apply to all client types (null).
     */
    List<ValidationRule> findByActiveAndClientTypeInOrderByPriorityDesc(Boolean active, List<ClientType> clientTypes);

    /**
     * Find active rules where clientType is null (applies to all).
     */
    List<ValidationRule> findByActiveAndClientTypeIsNullOrderByPriorityDesc(Boolean active);

    List<ValidationRule> findByActiveAndTableNameOrderByPriorityDesc(Boolean active, String tableName);
}
