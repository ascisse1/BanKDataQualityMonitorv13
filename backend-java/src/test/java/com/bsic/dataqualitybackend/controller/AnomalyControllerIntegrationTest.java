package com.bsic.dataqualitybackend.controller;

import com.bsic.dataqualitybackend.dto.AnomalyDto;
<<<<<<< HEAD
import com.bsic.dataqualitybackend.model.enums.AnomalyStatus;
=======
>>>>>>> 745e2a7 (Initial commit after re-initializing repository)
import com.bsic.dataqualitybackend.model.enums.ClientType;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
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
<<<<<<< HEAD
                .clientType(ClientType.valueOf("INDIVIDUAL"))
=======
                .clientType("INDIVIDUAL")
>>>>>>> 745e2a7 (Initial commit after re-initializing repository)
                .fieldName("email")
                .currentValue("invalid-email")
                .expectedValue("valid@email.com")
                .errorMessage("Invalid email format")
<<<<<<< HEAD
                .status(AnomalyStatus.valueOf("PENDING"))
=======
                .status("PENDING")
>>>>>>> 745e2a7 (Initial commit after re-initializing repository)
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
<<<<<<< HEAD
                .clientType(ClientType.valueOf("INDIVIDUAL"))
=======
                .clientType("INDIVIDUAL")
>>>>>>> 745e2a7 (Initial commit after re-initializing repository)
                .fieldName("phone")
                .currentValue("123")
                .expectedValue("1234567890")
                .errorMessage("Invalid phone")
<<<<<<< HEAD
                .status(AnomalyStatus.valueOf("PENDING"))
=======
                .status("PENDING")
>>>>>>> 745e2a7 (Initial commit after re-initializing repository)
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
<<<<<<< HEAD
                .status(AnomalyStatus.valueOf("CORRECTED"))
=======
                .status("CORRECTED")
>>>>>>> 745e2a7 (Initial commit after re-initializing repository)
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
<<<<<<< HEAD
                .clientType(ClientType.valueOf("INDIVIDUAL"))
=======
                .clientType("INDIVIDUAL")
>>>>>>> 745e2a7 (Initial commit after re-initializing repository)
                .fieldName("address")
                .currentValue("invalid")
                .expectedValue("valid address")
                .errorMessage("Invalid address")
<<<<<<< HEAD
                .status(AnomalyStatus.valueOf("PENDING"))
=======
                .status("PENDING")
>>>>>>> 745e2a7 (Initial commit after re-initializing repository)
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
