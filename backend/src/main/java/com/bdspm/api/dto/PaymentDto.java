package com.bdspm.api.dto;

import com.bdspm.domain.enums.PaymentStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

public record PaymentDto(
        Long id,
        String txnNo,
        BigDecimal amount,
        LocalDate paymentDate,
        String paymentMode,
        PaymentStatus status,
        Long propertyId,
        String propertyName,
        Long roomId,
        String roomName,
        Long bedUnitId,
        Long createdByUserId,
        String createdByUsername,
        OffsetDateTime createdAt
) {}
