package com.bdspm.api.dto;

import com.bdspm.domain.enums.BedUnitStatus;

public record BedUnitDto(Long id, BedUnitStatus status, Long roomId) {}
