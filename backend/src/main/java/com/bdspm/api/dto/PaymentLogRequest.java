package com.bdspm.api.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public record PaymentLogRequest(
        @NotNull LocalDate date,
        @NotNull LocalDate dueDate,
        @NotNull @DecimalMin("0.00") BigDecimal amountPaid,
        @NotNull @DecimalMin("0.00") BigDecimal amountPending,
        @NotNull Long tenancyContractId
) {}
