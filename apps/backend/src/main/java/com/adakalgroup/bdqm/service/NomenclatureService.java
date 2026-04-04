package com.adakalgroup.bdqm.service;

import com.adakalgroup.bdqm.dto.NomenclatureEntryDto;
import com.adakalgroup.bdqm.dto.NomenclatureTypeDto;
import com.adakalgroup.bdqm.model.NomenclatureEntry;
import com.adakalgroup.bdqm.model.NomenclatureType;
import com.adakalgroup.bdqm.repository.NomenclatureEntryRepository;
import com.adakalgroup.bdqm.repository.NomenclatureTypeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class NomenclatureService {

    private final NomenclatureTypeRepository nomenclatureTypeRepository;
    private final NomenclatureEntryRepository nomenclatureEntryRepository;

    // ===== NomenclatureType CRUD =====

    public List<NomenclatureTypeDto> getAllTypes() {
        return nomenclatureTypeRepository.findAll()
                .stream()
                .map(this::mapTypeToDto)
                .collect(Collectors.toList());
    }

    public List<NomenclatureTypeDto> getActiveTypes() {
        return nomenclatureTypeRepository.findByActiveTrue()
                .stream()
                .map(this::mapTypeToDto)
                .collect(Collectors.toList());
    }

    public NomenclatureTypeDto getType(Long id) {
        NomenclatureType type = nomenclatureTypeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Nomenclature type not found with id: " + id));
        return mapTypeToDto(type);
    }

    public NomenclatureTypeDto getTypeByCtab(String ctab) {
        NomenclatureType type = nomenclatureTypeRepository.findByCtab(ctab)
                .orElseThrow(() -> new RuntimeException("Nomenclature type not found: ctab=" + ctab));
        return mapTypeToDto(type);
    }

    @Transactional
    public NomenclatureTypeDto createType(NomenclatureTypeDto dto) {
        NomenclatureType type = NomenclatureType.builder()
                .ctab(dto.getCtab())
                .name(dto.getName())
                .displayName(dto.getDisplayName())
                .description(dto.getDescription())
                .syncEnabled(dto.getSyncEnabled() != null ? dto.getSyncEnabled() : true)
                .active(dto.getActive() != null ? dto.getActive() : true)
                .build();
        NomenclatureType saved = nomenclatureTypeRepository.save(type);
        log.info("Created nomenclature type: {} (ctab={})", saved.getName(), saved.getCtab());
        return mapTypeToDto(saved);
    }

    @Transactional
    public NomenclatureTypeDto updateType(Long id, NomenclatureTypeDto dto) {
        NomenclatureType type = nomenclatureTypeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Nomenclature type not found with id: " + id));

        type.setCtab(dto.getCtab());
        type.setName(dto.getName());
        type.setDisplayName(dto.getDisplayName());
        type.setDescription(dto.getDescription());
        if (dto.getSyncEnabled() != null) type.setSyncEnabled(dto.getSyncEnabled());
        if (dto.getActive() != null) type.setActive(dto.getActive());

        NomenclatureType updated = nomenclatureTypeRepository.save(type);
        log.info("Updated nomenclature type: {} (ctab={})", updated.getName(), updated.getCtab());
        return mapTypeToDto(updated);
    }

    @Transactional
    public void deleteType(Long id) {
        NomenclatureType type = nomenclatureTypeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Nomenclature type not found with id: " + id));
        type.setActive(false);
        nomenclatureTypeRepository.save(type);
        log.info("Soft-deleted nomenclature type: ctab={}", type.getCtab());
    }

    // ===== NomenclatureEntry queries =====

    public List<NomenclatureEntryDto> getEntriesByCtab(String ctab) {
        return nomenclatureEntryRepository.findByCtabAndActiveTrue(ctab)
                .stream()
                .map(this::mapEntryToDto)
                .collect(Collectors.toList());
    }

    public List<NomenclatureEntryDto> searchEntries(String ctab, String search) {
        return nomenclatureEntryRepository.findByCtabAndCaccContainingIgnoreCase(ctab, search)
                .stream()
                .map(this::mapEntryToDto)
                .collect(Collectors.toList());
    }

    /**
     * Validates that a value exists in the given nomenclature.
     * Used by CbsValidationService for FK validation.
     */
    public boolean isValidNomenclatureValue(String ctab, String cacc) {
        return nomenclatureEntryRepository.existsValidEntry(ctab, cacc);
    }

    /**
     * Returns the label for a nomenclature code.
     */
    public Optional<String> getLabel(String ctab, String cacc) {
        return nomenclatureEntryRepository.findByCtabAndCaccAndAge(ctab, cacc.trim(), "00000")
                .map(NomenclatureEntry::getLib1);
    }

    // ===== Mappers =====

    private NomenclatureTypeDto mapTypeToDto(NomenclatureType entity) {
        return NomenclatureTypeDto.builder()
                .id(entity.getId())
                .ctab(entity.getCtab())
                .name(entity.getName())
                .displayName(entity.getDisplayName())
                .description(entity.getDescription())
                .syncEnabled(entity.getSyncEnabled())
                .active(entity.getActive())
                .entryCount(entity.getEntryCount())
                .lastSyncedAt(entity.getLastSyncedAt())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    private NomenclatureEntryDto mapEntryToDto(NomenclatureEntry entity) {
        return NomenclatureEntryDto.builder()
                .id(entity.getId())
                .ctab(entity.getCtab())
                .cacc(entity.getCacc())
                .age(entity.getAge())
                .lib1(entity.getLib1())
                .lib2(entity.getLib2())
                .lib3(entity.getLib3())
                .lib4(entity.getLib4())
                .lib5(entity.getLib5())
                .mnt1(entity.getMnt1())
                .active(entity.getActive())
                .lastSyncedAt(entity.getLastSyncedAt())
                .build();
    }
}
