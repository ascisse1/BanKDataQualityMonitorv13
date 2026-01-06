package com.bsic.dataqualitybackend.service;

import com.bsic.dataqualitybackend.dto.AnomalyDto;
import com.bsic.dataqualitybackend.model.Anomaly;
import com.bsic.dataqualitybackend.model.enums.AnomalyStatus;
import com.bsic.dataqualitybackend.model.enums.ClientType;
import com.bsic.dataqualitybackend.repository.AnomalyRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AnomalyServiceTest {

    @Mock
    private AnomalyRepository anomalyRepository;

    @InjectMocks
    private AnomalyService anomalyService;

    private Anomaly testAnomaly;
    private AnomalyDto testAnomalyDto;

    @BeforeEach
    void setUp() {
        testAnomaly = new Anomaly();
        testAnomaly.setId(1L);
        testAnomaly.setClientNumber("C001");
        testAnomaly.setClientName("Test Client");
        testAnomaly.setClientType(ClientType.INDIVIDUAL);
        testAnomaly.setFieldName("email");
        testAnomaly.setCurrentValue("invalid-email");
        testAnomaly.setExpectedValue("valid@email.com");
        testAnomaly.setErrorMessage("Invalid email format");
        testAnomaly.setStatus(AnomalyStatus.PENDING);
        testAnomaly.setSeverity("HIGH");
        testAnomaly.setAgencyCode("AG001");

        testAnomalyDto = AnomalyDto.builder()
                .id(1L)
                .clientNumber("C001")
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
    }

    @Test
    void shouldCreateAnomaly() {
        when(anomalyRepository.save(any(Anomaly.class))).thenReturn(testAnomaly);

        AnomalyDto result = anomalyService.createAnomaly(testAnomalyDto);

        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getClientNumber()).isEqualTo("C001");
        verify(anomalyRepository, times(1)).save(any(Anomaly.class));
    }

    @Test
    void shouldGetAnomalyById() {
        when(anomalyRepository.findById(1L)).thenReturn(Optional.of(testAnomaly));

        AnomalyDto result = anomalyService.getAnomalyById(1L);

        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getClientNumber()).isEqualTo("C001");
        verify(anomalyRepository, times(1)).findById(1L);
    }

    @Test
    void shouldGetAnomaliesByClientType() {
        List<Anomaly> anomalies = Arrays.asList(testAnomaly);
        Page<Anomaly> page = new PageImpl<>(anomalies);
        Pageable pageable = PageRequest.of(0, 10);

        when(anomalyRepository.findByClientType(ClientType.INDIVIDUAL, pageable)).thenReturn(page);

        Page<AnomalyDto> result = anomalyService.getAnomaliesByClientType(ClientType.INDIVIDUAL, pageable);

        assertThat(result).isNotNull();
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getClientType()).isEqualTo(ClientType.INDIVIDUAL);
        verify(anomalyRepository, times(1)).findByClientType(ClientType.INDIVIDUAL, pageable);
    }

    @Test
    void shouldUpdateAnomaly() {
        when(anomalyRepository.findById(1L)).thenReturn(Optional.of(testAnomaly));
        when(anomalyRepository.save(any(Anomaly.class))).thenReturn(testAnomaly);

        testAnomalyDto.setStatus(AnomalyStatus.CORRECTED);
        AnomalyDto result = anomalyService.updateAnomaly(1L, testAnomalyDto);

        assertThat(result).isNotNull();
        assertThat(result.getStatus()).isEqualTo(AnomalyStatus.CORRECTED);
        verify(anomalyRepository, times(1)).findById(1L);
        verify(anomalyRepository, times(1)).save(any(Anomaly.class));
    }

    @Test
    void shouldDeleteAnomaly() {
        when(anomalyRepository.existsById(1L)).thenReturn(true);
        doNothing().when(anomalyRepository).deleteById(1L);

        anomalyService.deleteAnomaly(1L);

        verify(anomalyRepository, times(1)).existsById(1L);
        verify(anomalyRepository, times(1)).deleteById(1L);
    }

    @Test
    void shouldGetAnomaliesByAgencyCode() {
        List<Anomaly> anomalies = Arrays.asList(testAnomaly);
        when(anomalyRepository.findByAgencyCode("AG001")).thenReturn(anomalies);

        List<AnomalyDto> result = anomalyService.getAnomaliesByAgencyCode("AG001");

        assertThat(result).isNotNull();
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getAgencyCode()).isEqualTo("AG001");
        verify(anomalyRepository, times(1)).findByAgencyCode("AG001");
    }

    @Test
    void shouldGetAnomaliesByStatus() {
        List<Anomaly> anomalies = Arrays.asList(testAnomaly);
        Page<Anomaly> page = new PageImpl<>(anomalies);
        Pageable pageable = PageRequest.of(0, 10);

        when(anomalyRepository.findByStatus(AnomalyStatus.PENDING, pageable)).thenReturn(page);

        Page<AnomalyDto> result = anomalyService.getAnomaliesByStatus(AnomalyStatus.PENDING, pageable);

        assertThat(result).isNotNull();
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getStatus()).isEqualTo(AnomalyStatus.PENDING);
        verify(anomalyRepository, times(1)).findByStatus(AnomalyStatus.PENDING, pageable);
    }

    @Test
    void shouldCountAnomaliesByStatus() {
        when(anomalyRepository.countByStatus(AnomalyStatus.PENDING)).thenReturn(10L);

        long count = anomalyService.countAnomaliesByStatus(AnomalyStatus.PENDING);

        assertThat(count).isEqualTo(10L);
        verify(anomalyRepository, times(1)).countByStatus(AnomalyStatus.PENDING);
    }
}
