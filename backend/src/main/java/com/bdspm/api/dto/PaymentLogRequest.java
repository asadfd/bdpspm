package com.bdspm.api.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record PaymentLogRequest(
        @NotNull @Size(min = 1, max = 100) String txnNo,
        @NotNull @DecimalMin("0.01") BigDecimal amount,
        @NotNull LocalDate date,
        @NotNull Long propertyId,
        @NotNull Long roomId,
        @NotNull Long bedUnitId
) {}
