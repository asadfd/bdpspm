package com.bdspm.api.dto;

import com.bdspm.domain.enums.PaymentStatus;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record PaymentRequest(
        @NotNull LocalDate paymentDate,
        @NotNull LocalDate dueDate,
        @NotNull @DecimalMin("0.00") BigDecimal amountPaid,
        @NotNull @DecimalMin("0.00") BigDecimal amountPending,
        PaymentStatus status,
        @NotNull Long tenancyContractId
) {}
