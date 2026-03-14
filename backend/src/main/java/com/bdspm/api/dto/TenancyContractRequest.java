package com.bdspm.api.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record TenancyContractRequest(
        @NotBlank @Size(max = 200) String tenantName,
        @NotBlank @Size(max = 100) String tenantGovernmentId,
        @NotBlank @Size(max = 30) String tenantPhoneNumber,
        @NotNull Long propertyId,
        @NotNull Long roomId,
        @NotNull Long bedUnitId,
        @NotNull @DecimalMin("0.01") BigDecimal rentAmount,
        @NotNull LocalDate startDate,
        @NotNull LocalDate endDate
) {}
