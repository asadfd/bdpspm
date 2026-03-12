package com.bdspm.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record PropertyRequest(
        @NotBlank @Size(max = 200) String name
) {}
