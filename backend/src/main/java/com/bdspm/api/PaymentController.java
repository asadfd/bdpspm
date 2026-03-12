package com.bdspm.api;

import com.bdspm.api.dto.PaymentDto;
import com.bdspm.api.dto.PaymentLogRequest;
import com.bdspm.api.dto.PaymentRequest;
import com.bdspm.domain.entity.User;
import com.bdspm.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @GetMapping
    public ResponseEntity<List<PaymentDto>> listPayments() {
        return ResponseEntity.ok(paymentService.listPayments());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PaymentDto> getPayment(@PathVariable Long id) {
        return ResponseEntity.ok(paymentService.getPayment(id));
    }

    @PostMapping
    public ResponseEntity<PaymentDto> createPayment(@Valid @RequestBody PaymentRequest request,
                                                    @AuthenticationPrincipal User agent) {
        PaymentDto dto = paymentService.createPayment(request, agent);
        return ResponseEntity.created(URI.create("/api/payments/" + dto.id())).body(dto);
    }

    @PostMapping("/log")
    public ResponseEntity<PaymentDto> logPayment(
            @Valid @RequestBody PaymentLogRequest request,
            @AuthenticationPrincipal User agent) {
        PaymentDto dto = paymentService.logPayment(request, agent);
        return ResponseEntity.created(URI.create("/api/payments/" + dto.id())).body(dto);
    }

    @PutMapping("/{id}")
    public ResponseEntity<PaymentDto> updatePayment(@PathVariable Long id,
                                                    @Valid @RequestBody PaymentRequest request) {
        return ResponseEntity.ok(paymentService.updatePayment(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePayment(@PathVariable Long id) {
        paymentService.deletePayment(id);
        return ResponseEntity.noContent().build();
    }
}
