package com.adakalgroup.dataqualitybackend.service;

import com.adakalgroup.dataqualitybackend.model.Structure;
import com.adakalgroup.dataqualitybackend.repository.StructureRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class StructureService {

    private final StructureRepository structureRepository;

    public List<Structure> getAllAgencies() {
        return structureRepository.findByTypeAndStatus("AGENCY", "ACTIVE");
    }

    public List<Structure> getAgenciesOrderedByName() {
        return structureRepository.findByTypeAndStatusOrderByNameAsc("AGENCY", "ACTIVE");
    }

    public Structure getByCode(String code) {
        return structureRepository.findByCode(code)
                .orElseThrow(() -> new RuntimeException("Structure not found with code: " + code));
    }

    public String getLabel(String code) {
        if (code == null || code.isBlank()) return null;
        return structureRepository.findByCode(code)
                .map(s -> s.getName() != null ? s.getName().trim() : null)
                .orElse(null);
    }

    public Map<String, String> getAgencyNameMap() {
        return getAllAgencies().stream()
                .collect(Collectors.toMap(
                        Structure::getCode,
                        s -> s.getName() != null ? s.getName() : s.getCode(),
                        (a, b) -> a));
    }

    @Transactional
    public Structure createAgency(String code, String name) {
        structureRepository.findByCode(code).ifPresent(s -> {
            throw new RuntimeException("Structure with code " + code + " already exists");
        });

        Structure structure = Structure.builder()
                .code(code)
                .name(name != null ? name : code)
                .type("AGENCY")
                .status("ACTIVE")
                .build();
        log.info("Created agency structure: {}", code);
        return structureRepository.save(structure);
    }

    @Transactional
    public Structure updateAgency(String code, String name) {
        Structure structure = getByCode(code);
        structure.setName(name);
        log.info("Updated agency structure: {}", code);
        return structureRepository.save(structure);
    }

    @Transactional
    public void deleteAgency(String code) {
        Structure structure = getByCode(code);
        structureRepository.delete(structure);
        log.info("Deleted agency structure: {}", code);
    }
}
