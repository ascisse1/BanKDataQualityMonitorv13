package com.bsic.dataqualitybackend.controller;

import com.bsic.dataqualitybackend.dto.AnomalyDto;
import com.bsic.dataqualitybackend.model.enums.AnomalyStatus;
import com.bsic.dataqualitybackend.model.enums.ClientType;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AnomalyControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void shouldGetIndividualAnomalies() throws Exception {
        mockMvc.perform(get("/api/anomalies/individual")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").exists());
    }

    @Test
    void shouldGetCorporateAnomalies() throws Exception {
        mockMvc.perform(get("/api/anomalies/corporate")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").exists());
    }

    @Test
    void shouldGetInstitutionalAnomalies() throws Exception {
        mockMvc.perform(get("/api/anomalies/institutional")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void shouldGetAnomaliesByBranch() throws Exception {
        mockMvc.perform(get("/api/anomalies/by-branch")
                        .param("clientType", "INDIVIDUAL"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray());
    }

    @Test
    void shouldGetRecentAnomalies() throws Exception {
        mockMvc.perform(get("/api/anomalies/recent")
                        .param("limit", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray());
    }

    @Test
    void shouldCreateAnomaly() throws Exception {
        AnomalyDto anomalyDto = AnomalyDto.builder()
                .clientNumber("TEST001")
                .clientName("Test Client")
                .clientType(ClientType.INDIVIDUAL)
                .fieldName("email")
                .currentValue("invalid-email")
                .expectedValue("valid@email.com")
                .errorMessage("Invalid email format")
                .status(AnomalyStatus.PENDING)
                .severity("HIGH")
                .agencyCode("AG001")
                .build();

        mockMvc.perform(post("/api/anomalies")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(anomalyDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.clientNumber").value("TEST001"));
    }

    @Test
    void shouldUpdateAnomaly() throws Exception {
        AnomalyDto createDto = AnomalyDto.builder()
                .clientNumber("TEST002")
                .clientName("Test Client 2")
                .clientType(ClientType.INDIVIDUAL)
                .fieldName("phone")
                .currentValue("123")
                .expectedValue("1234567890")
                .errorMessage("Invalid phone")
                .status(AnomalyStatus.PENDING)
                .severity("MEDIUM")
                .agencyCode("AG001")
                .build();

        String createResponse = mockMvc.perform(post("/api/anomalies")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createDto)))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        AnomalyDto updateDto = AnomalyDto.builder()
                .status(AnomalyStatus.CORRECTED)
                .correctionValue("1234567890")
                .build();

        mockMvc.perform(put("/api/anomalies/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateDto)))
                .andExpect(status().isOk());
    }

    @Test
    void shouldDeleteAnomaly() throws Exception {
        AnomalyDto createDto = AnomalyDto.builder()
                .clientNumber("TEST003")
                .clientName("Test Client 3")
                .clientType(ClientType.INDIVIDUAL)
                .fieldName("address")
                .currentValue("invalid")
                .expectedValue("valid address")
                .errorMessage("Invalid address")
                .status(AnomalyStatus.PENDING)
                .severity("LOW")
                .agencyCode("AG001")
                .build();

        mockMvc.perform(post("/api/anomalies")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createDto)))
                .andExpect(status().isOk());

        mockMvc.perform(delete("/api/anomalies/1"))
                .andExpect(status().isOk());
    }
}
