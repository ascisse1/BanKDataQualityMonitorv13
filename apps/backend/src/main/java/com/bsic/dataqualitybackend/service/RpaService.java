package com.bsic.dataqualitybackend.service;

import com.bsic.dataqualitybackend.model.RpaJob;
import com.bsic.dataqualitybackend.repository.RpaJobRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class RpaService {

    private final RpaJobRepository rpaJobRepository;
    private final WorkflowService workflowService;

    @Transactional
    public RpaJob createJob(Long ticketId, String processInstanceId, String action) {
        log.info("Creating RPA job for ticket: {}", ticketId);

        RpaJob job = RpaJob.builder()
                .jobId(UUID.randomUUID().toString())
                .ticketId(ticketId)
                .processInstanceId(processInstanceId)
                .action(action)
                .status("PENDING")
                .startedAt(LocalDateTime.now())
                .build();

        return rpaJobRepository.save(job);
    }

    @Transactional
    public void updateJobStatus(String jobId, String status, String errorMessage, String resultData) {
        log.info("Updating RPA job status: {} -> {}", jobId, status);

        RpaJob job = rpaJobRepository.findByJobId(jobId)
                .orElseThrow(() -> new IllegalArgumentException("RPA job not found: " + jobId));

        job.setStatus(status);

        if ("RUNNING".equals(status)) {
            job.setStartedAt(LocalDateTime.now());
        } else if ("COMPLETED".equals(status) || "FAILED".equals(status)) {
            job.setCompletedAt(LocalDateTime.now());
        }

        if (errorMessage != null) {
            job.setErrorMessage(errorMessage);
        }

        if (resultData != null) {
            job.setResultData(resultData);
        }

        rpaJobRepository.save(job);

        if ("COMPLETED".equals(status) || "FAILED".equals(status)) {
            notifyWorkflow(job);
        }
    }

    private void notifyWorkflow(RpaJob job) {
        if (job.getProcessInstanceId() != null) {
            boolean success = "COMPLETED".equals(job.getStatus());
            workflowService.notifyRpaCompletion(
                job.getProcessInstanceId(),
                success,
                job.getErrorMessage()
            );
        }
    }

    public Optional<RpaJob> getJobById(String jobId) {
        return rpaJobRepository.findByJobId(jobId);
    }

    public List<RpaJob> getJobsByTicket(Long ticketId) {
        return rpaJobRepository.findByTicketId(ticketId);
    }

    public List<RpaJob> getJobsByStatus(String status) {
        return rpaJobRepository.findByStatus(status);
    }

    @Transactional
    public void retryFailedJob(String jobId) {
        log.info("Retrying failed RPA job: {}", jobId);

        RpaJob job = rpaJobRepository.findByJobId(jobId)
                .orElseThrow(() -> new IllegalArgumentException("RPA job not found: " + jobId));

        if (!"FAILED".equals(job.getStatus())) {
            throw new IllegalStateException("Only failed jobs can be retried");
        }

        job.setStatus("PENDING");
        job.setRetryCount(job.getRetryCount() + 1);
        job.setStartedAt(LocalDateTime.now());
        job.setCompletedAt(null);

        rpaJobRepository.save(job);
    }

    public List<RpaJob> findStuckJobs(int timeoutMinutes) {
        LocalDateTime threshold = LocalDateTime.now().minusMinutes(timeoutMinutes);
        return rpaJobRepository.findStuckJobs(threshold);
    }

    @Transactional
    public void cleanupStuckJobs(int timeoutMinutes) {
        List<RpaJob> stuckJobs = findStuckJobs(timeoutMinutes);

        for (RpaJob job : stuckJobs) {
            log.warn("Marking stuck job as failed: {}", job.getJobId());
            updateJobStatus(job.getJobId(), "FAILED", "Job timeout - exceeded " + timeoutMinutes + " minutes", null);
        }
    }
}
