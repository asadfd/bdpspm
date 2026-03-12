package com.bdspm.service;

import com.bdspm.api.dto.DtoMapper;
import com.bdspm.api.dto.PropertyDto;
import com.bdspm.api.dto.PropertyRequest;
import com.bdspm.common.ResourceNotFoundException;
import com.bdspm.domain.entity.Property;
import com.bdspm.domain.repository.PropertyRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class PropertyService {

    private final PropertyRepository propertyRepository;

    public PropertyService(PropertyRepository propertyRepository) {
        this.propertyRepository = propertyRepository;
    }

    @Transactional(readOnly = true)
    public List<PropertyDto> listProperties() {
        return propertyRepository.findAllWithRoomsAndBedUnits().stream()
                .map(DtoMapper::toPropertyDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public PropertyDto getProperty(Long id) {
        return propertyRepository.findDetailedById(id)
                .map(DtoMapper::toPropertyDto)
                .orElseThrow(() -> new ResourceNotFoundException("Property not found: " + id));
    }

    @Transactional
    public PropertyDto createProperty(PropertyRequest request) {
        Property property = new Property();
        property.setName(request.name().trim());
        property = propertyRepository.save(property);
        return getProperty(property.getId());
    }

    @Transactional
    public PropertyDto updateProperty(Long id, PropertyRequest request) {
        Property property = propertyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Property not found: " + id));
        property.setName(request.name().trim());
        property = propertyRepository.save(property);
        return getProperty(property.getId());
    }

    @Transactional
    public void deleteProperty(Long id) {
        if (!propertyRepository.existsById(id)) {
            throw new ResourceNotFoundException("Property not found: " + id);
        }
        propertyRepository.deleteById(id);
    }
}
