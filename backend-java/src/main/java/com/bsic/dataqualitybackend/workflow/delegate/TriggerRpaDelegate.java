package com.bsic.dataqualitybackend.workflow.delegate;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.camunda.bpm.engine.delegate.DelegateExecution;
import org.camunda.bpm.engine.delegate.JavaDelegate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Component("triggerRpaDelegate")
@RequiredArgsConstructor
public class TriggerRpaDelegate implements JavaDelegate {

    private final RestTemplate restTemplate;

    @Value("${app.rpa.uipath.url:http://localhost:8080}")
    private String uipathUrl;

    @Value("${app.rpa.uipath.api-key:dummy-key}")
    private String uipathApiKey;

    @Override
    public void execute(DelegateExecution execution) throws Exception {
        Long ticketId = (Long) execution.getVariable("ticketId");
        String ticketNumber = (String) execution.getVariable("ticketNumber");
        String cli = (String) execution.getVariable("clientId");

        log.info("Triggering RPA for ticket: {}", ticketNumber);

        Map<String, Object> rpaPayload = new HashMap<>();
        rpaPayload.put("ticketId", ticketId);
        rpaPayload.put("ticketNumber", ticketNumber);
        rpaPayload.put("clientId", cli);
        rpaPayload.put("action", "UPDATE_AMPLITUDE");
        rpaPayload.put("callbackUrl", uipathUrl + "/api/rpa/callback");
        rpaPayload.put("processInstanceId", execution.getProcessInstanceId());

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Bearer " + uipathApiKey);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(rpaPayload, headers);

            String rpaEndpoint = uipathUrl + "/api/rpa/jobs/start";
            Map<String, Object> response = restTemplate.postForObject(rpaEndpoint, request, Map.class);

            String jobId = response != null ? (String) response.get("jobId") : null;

            execution.setVariable("rpaJobId", jobId);
            execution.setVariable("rpaTriggeredAt", LocalDateTime.now());
            execution.setVariable("rpaInProgress", true);

            log.info("RPA job triggered successfully. Job ID: {}", jobId);

        } catch (Exception e) {
            log.error("Failed to trigger RPA for ticket {}: {}", ticketNumber, e.getMessage());
            execution.setVariable("rpaInProgress", false);
            execution.setVariable("rpaError", e.getMessage());
            throw e;
        }
    }
}
