package com.bsic.dataqualitybackend.repository;

import com.bsic.dataqualitybackend.model.ReconciliationAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReconciliationAttemptRepository extends JpaRepository<ReconciliationAttempt, Long> {

    List<ReconciliationAttempt> findByTaskIdOrderByAttemptNumber(Long taskId);
}
