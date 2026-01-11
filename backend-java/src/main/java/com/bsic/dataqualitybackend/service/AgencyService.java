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

    public List<AgencyDto> getAgenciesOrderedByName() {
        return agencyRepository.findAllByOrderByLibAsc()
            .stream()
            .map(this::mapToDto)
            .collect(Collectors.toList());
    }

    public AgencyDto getAgencyByCode(String age) {
        return agencyRepository.findByAge(age)
            .map(this::mapToDto)
            .orElseThrow(() -> new RuntimeException("Agency not found with code: " + age));
    }

    @Transactional
    public AgencyDto createAgency(AgencyDto dto) {
        if (agencyRepository.existsByAge(dto.getAge())) {
            throw new RuntimeException("Agency with code " + dto.getAge() + " already exists");
        }

        Agency agency = mapToEntity(dto);
        Agency saved = agencyRepository.save(agency);
        log.info("Created agency with code: {}", saved.getAge());
        return mapToDto(saved);
    }

    @Transactional
    public AgencyDto updateAgency(String age, AgencyDto dto) {
        Agency agency = agencyRepository.findByAge(age)
            .orElseThrow(() -> new RuntimeException("Agency not found with code: " + age));

        agency.setLib(dto.getLib());

        Agency updated = agencyRepository.save(agency);
        log.info("Updated agency with code: {}", updated.getAge());
        return mapToDto(updated);
    }

    @Transactional
    public void deleteAgency(String age) {
        agencyRepository.deleteById(age);
        log.info("Deleted agency with code: {}", age);
    }

    private AgencyDto mapToDto(Agency agency) {
        return AgencyDto.builder()
            .age(agency.getAge())
            .lib(agency.getLib())
            .createdAt(agency.getCreatedAt())
            .updatedAt(agency.getUpdatedAt())
            .build();
    }

    private Agency mapToEntity(AgencyDto dto) {
        return Agency.builder()
            .age(dto.getAge())
            .lib(dto.getLib())
            .build();
    }
}
