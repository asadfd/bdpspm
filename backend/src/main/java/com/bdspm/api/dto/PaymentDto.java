package com.bdspm.api.dto;

import com.bdspm.domain.enums.PaymentStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

public record PaymentDto(
        Long id,
        Long tenancyContractId,
        String tenantName,
        LocalDate paymentDate,
        LocalDate dueDate,
        BigDecimal amountPaid,
        BigDecimal amountPending,
        PaymentStatus status,
        Long propertyId,
        String propertyName,
        Long roomId,
        String roomName,
        Long bedUnitId,
        String contractStatus,
        Long createdByUserId,
        String createdByUsername,
        OffsetDateTime createdAt
) {}
