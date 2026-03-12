package com.bdspm.api;

import com.bdspm.api.dto.InventoryMapDto;
import com.bdspm.service.InventoryService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/inventory")
public class InventoryController {

    private final InventoryService inventoryService;

    public InventoryController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    @GetMapping("/map")
    public ResponseEntity<InventoryMapDto> getMap() {
        InventoryMapDto map = inventoryService.getMap();
        return ResponseEntity.ok(map);
    }
}
