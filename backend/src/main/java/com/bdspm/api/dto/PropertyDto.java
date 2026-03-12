package com.bdspm.api.dto;

import java.util.List;

public record PropertyDto(Long id, String name, List<RoomDto> rooms) {}
