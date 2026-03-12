package com.bdspm.api;

import com.bdspm.api.dto.BedUnitManagementDto;
import com.bdspm.api.dto.BedUnitRequest;
import com.bdspm.service.BedUnitService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/beds")
public class BedUnitController {

    private final BedUnitService bedUnitService;

    public BedUnitController(BedUnitService bedUnitService) {
        this.bedUnitService = bedUnitService;
    }

    @GetMapping
    public ResponseEntity<List<BedUnitManagementDto>> listBeds() {
        return ResponseEntity.ok(bedUnitService.listBeds());
    }

    @GetMapping("/{id}")
    public ResponseEntity<BedUnitManagementDto> getBed(@PathVariable Long id) {
        return ResponseEntity.ok(bedUnitService.getBed(id));
    }

    @PostMapping
    public ResponseEntity<BedUnitManagementDto> createBed(@Valid @RequestBody BedUnitRequest request) {
        BedUnitManagementDto dto = bedUnitService.createBed(request);
        return ResponseEntity.created(URI.create("/api/beds/" + dto.id())).body(dto);
    }

    @PutMapping("/{id}")
    public ResponseEntity<BedUnitManagementDto> updateBed(@PathVariable Long id,
                                                          @Valid @RequestBody BedUnitRequest request) {
        return ResponseEntity.ok(bedUnitService.updateBed(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBed(@PathVariable Long id) {
        bedUnitService.deleteBed(id);
        return ResponseEntity.noContent().build();
    }
}
