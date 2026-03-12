package com.bdspm.service;

import com.bdspm.api.dto.DtoMapper;
import com.bdspm.api.dto.InventoryMapDto;
import com.bdspm.api.dto.PropertyDto;
import com.bdspm.domain.repository.PropertyRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class InventoryService {

    private final PropertyRepository propertyRepository;

    public InventoryService(PropertyRepository propertyRepository) {
        this.propertyRepository = propertyRepository;
    }

    @Transactional(readOnly = true)
    public InventoryMapDto getMap() {
        List<PropertyDto> propertyDtos = propertyRepository.findAllWithRoomsAndBedUnits().stream()
                .map(DtoMapper::toPropertyDto)
                .toList();
        return new InventoryMapDto(propertyDtos);
    }
}
