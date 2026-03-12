package com.bdspm.api.dto;

import com.bdspm.domain.enums.BedUnitStatus;

public record BedUnitManagementDto(
        Long id,
        BedUnitStatus status,
        Long roomId,
        String roomName,
        Long propertyId,
        String propertyName
) {}
