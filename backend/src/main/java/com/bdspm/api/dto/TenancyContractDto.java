package com.bdspm.api.dto;

import com.bdspm.domain.enums.BedUnitStatus;
import com.bdspm.domain.enums.TenancyContractStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

public record TenancyContractDto(
        Long id,
        String tenantName,
        String tenantGovernmentId,
        String tenantPhoneNumber,
        Long propertyId,
        String propertyName,
        Long roomId,
        String roomName,
        Long bedUnitId,
        BedUnitStatus bedStatus,
        BigDecimal rentAmount,
        LocalDate startDate,
        LocalDate endDate,
        TenancyContractStatus status,
        boolean endedImmediately,
        LocalDate actualEndDate,
        OffsetDateTime createdAt
) {}
