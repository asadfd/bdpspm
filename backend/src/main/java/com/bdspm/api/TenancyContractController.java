package com.bdspm.api;

import com.bdspm.api.dto.EndTenancyContractRequest;
import com.bdspm.api.dto.TenancyContractDto;
import com.bdspm.api.dto.TenancyContractRequest;
import com.bdspm.service.TenancyContractService;
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
@RequestMapping("/api/contracts")
public class TenancyContractController {

    private final TenancyContractService tenancyContractService;

    public TenancyContractController(TenancyContractService tenancyContractService) {
        this.tenancyContractService = tenancyContractService;
    }

    @GetMapping
    public ResponseEntity<List<TenancyContractDto>> listContracts() {
        return ResponseEntity.ok(tenancyContractService.listContracts());
    }

    @GetMapping("/{id}")
    public ResponseEntity<TenancyContractDto> getContract(@PathVariable Long id) {
        return ResponseEntity.ok(tenancyContractService.getContract(id));
    }

    @PostMapping
    public ResponseEntity<TenancyContractDto> createContract(@Valid @RequestBody TenancyContractRequest request) {
        TenancyContractDto dto = tenancyContractService.createContract(request);
        return ResponseEntity.created(URI.create("/api/contracts/" + dto.id())).body(dto);
    }

    @PutMapping("/{id}")
    public ResponseEntity<TenancyContractDto> updateContract(@PathVariable Long id,
                                                             @Valid @RequestBody TenancyContractRequest request) {
        return ResponseEntity.ok(tenancyContractService.updateContract(id, request));
    }

    @PostMapping("/{id}/end")
    public ResponseEntity<TenancyContractDto> endContract(@PathVariable Long id,
                                                          @RequestBody(required = false) EndTenancyContractRequest request) {
        EndTenancyContractRequest endRequest = request == null
                ? new EndTenancyContractRequest(false)
                : request;
        return ResponseEntity.ok(tenancyContractService.endContract(id, endRequest));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteContract(@PathVariable Long id) {
        tenancyContractService.deleteContract(id);
        return ResponseEntity.noContent().build();
    }
}
