package com.bsic.dataqualitybackend.service;

import com.bsic.dataqualitybackend.dto.AgencyDto;
import com.bsic.dataqualitybackend.model.Agency;
import com.bsic.dataqualitybackend.repository.AgencyRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AgencyService {

    private final AgencyRepository agencyRepository;

    public List<AgencyDto> getAllAgencies() {
        return agencyRepository.findAll()
            .stream()
            .map(this::mapToDto)
            .collect(Collectors.toList());
    }

    public List<AgencyDto> getActiveAgencies() {
        return agencyRepository.findByActiveOrderByNameAsc(true)
            .stream()
            .map(this::mapToDto)
            .collect(Collectors.toList());
    }

    public AgencyDto getAgencyByCode(String code) {
        return agencyRepository.findByCode(code)
            .map(this::mapToDto)
            .orElseThrow(() -> new RuntimeException("Agency not found with code: " + code));
    }

    @Transactional
    public AgencyDto createAgency(AgencyDto dto) {
        if (agencyRepository.existsByCode(dto.getCode())) {
            throw new RuntimeException("Agency with code " + dto.getCode() + " already exists");
        }

        Agency agency = mapToEntity(dto);
        Agency saved = agencyRepository.save(agency);
        log.info("Created agency with code: {}", saved.getCode());
        return mapToDto(saved);
    }

    @Transactional
    public AgencyDto updateAgency(Long id, AgencyDto dto) {
        Agency agency = agencyRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Agency not found with id: " + id));

        agency.setName(dto.getName());
        agency.setRegion(dto.getRegion());
        agency.setCity(dto.getCity());
        agency.setAddress(dto.getAddress());
        agency.setPhone(dto.getPhone());
        agency.setEmail(dto.getEmail());
        agency.setManagerName(dto.getManagerName());
        agency.setActive(dto.getActive());

        Agency updated = agencyRepository.save(agency);
        log.info("Updated agency with ID: {}", updated.getId());
        return mapToDto(updated);
    }

    @Transactional
    public void deleteAgency(Long id) {
        agencyRepository.deleteById(id);
        log.info("Deleted agency with ID: {}", id);
    }

    private AgencyDto mapToDto(Agency agency) {
        return AgencyDto.builder()
            .id(agency.getId())
            .code(agency.getCode())
            .name(agency.getName())
            .region(agency.getRegion())
            .city(agency.getCity())
            .address(agency.getAddress())
            .phone(agency.getPhone())
            .email(agency.getEmail())
            .managerName(agency.getManagerName())
            .active(agency.getActive())
            .createdAt(agency.getCreatedAt())
            .updatedAt(agency.getUpdatedAt())
            .build();
    }

    private Agency mapToEntity(AgencyDto dto) {
        return Agency.builder()
            .code(dto.getCode())
            .name(dto.getName())
            .region(dto.getRegion())
            .city(dto.getCity())
            .address(dto.getAddress())
            .phone(dto.getPhone())
            .email(dto.getEmail())
            .managerName(dto.getManagerName())
            .active(dto.getActive() != null ? dto.getActive() : true)
            .build();
    }
}
