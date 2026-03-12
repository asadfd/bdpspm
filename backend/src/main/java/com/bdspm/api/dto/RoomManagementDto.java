package com.bdspm.api.dto;

public record RoomManagementDto(
        Long id,
        String name,
        Long propertyId,
        String propertyName,
        int bedCount
) {}
