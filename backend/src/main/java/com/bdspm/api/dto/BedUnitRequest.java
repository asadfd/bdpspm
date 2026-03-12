package com.bdspm.api.dto;

import com.bdspm.domain.enums.BedUnitStatus;
import jakarta.validation.constraints.NotNull;

public record BedUnitRequest(
        @NotNull BedUnitStatus status,
        @NotNull Long roomId
) {}
