package com.adakalgroup.bdqm.repository;

import com.adakalgroup.bdqm.model.ReconciliationAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReconciliationAttemptRepository extends JpaRepository<ReconciliationAttempt, Long> {

    List<ReconciliationAttempt> findByTaskIdOrderByAttemptNumber(Long taskId);
}
