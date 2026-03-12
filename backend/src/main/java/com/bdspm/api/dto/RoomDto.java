package com.bdspm.api.dto;

import java.util.List;

public record RoomDto(Long id, String name, Long propertyId, List<BedUnitDto> bedUnits) {}
