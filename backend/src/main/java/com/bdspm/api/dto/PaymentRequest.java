package com.bdspm.api.dto;

import com.bdspm.domain.enums.PaymentStatus;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record PaymentRequest(
        @NotBlank @Size(max = 100) String txnNo,
        @NotNull @DecimalMin("0.01") BigDecimal amount,
        @NotNull LocalDate paymentDate,
        @Size(max = 50) String paymentMode,
        PaymentStatus status,
        @NotNull Long propertyId,
        @NotNull Long roomId,
        @NotNull Long bedUnitId
) {}
