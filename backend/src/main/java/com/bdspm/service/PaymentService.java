package com.bdspm.service;

import com.bdspm.api.dto.DtoMapper;
import com.bdspm.api.dto.PaymentDto;
import com.bdspm.api.dto.PaymentLogRequest;
import com.bdspm.api.dto.PaymentRequest;
import com.bdspm.common.ResourceNotFoundException;
import com.bdspm.domain.entity.Payment;
import com.bdspm.domain.entity.TenancyContract;
import com.bdspm.domain.entity.User;
import com.bdspm.domain.enums.PaymentStatus;
import com.bdspm.domain.repository.PaymentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final TenancyContractService tenancyContractService;

    public PaymentService(PaymentRepository paymentRepository,
                          TenancyContractService tenancyContractService) {
        this.paymentRepository = paymentRepository;
        this.tenancyContractService = tenancyContractService;
    }

    @Transactional
    public List<PaymentDto> listPayments() {
        tenancyContractService.refreshExpiredContracts();
        return paymentRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(DtoMapper::toPaymentDto)
                .toList();
    }

    @Transactional
    public PaymentDto getPayment(Long id) {
        tenancyContractService.refreshExpiredContracts();
        return paymentRepository.findDetailedById(id)
                .map(DtoMapper::toPaymentDto)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found: " + id));
    }

    @Transactional
    public PaymentDto logPayment(PaymentLogRequest request, User createdBy) {
        PaymentRequest paymentRequest = new PaymentRequest(
                request.date(),
                request.dueDate(),
                request.amountPaid(),
                request.amountPending(),
                PaymentStatus.PENDING,
                request.tenancyContractId()
        );
        return createPayment(paymentRequest, createdBy);
    }

    @Transactional
    public PaymentDto createPayment(PaymentRequest request, User createdBy) {
        validateAmounts(request.amountPaid(), request.amountPending());
        TenancyContract contract = tenancyContractService.getContractForPayment(request.tenancyContractId());

        Payment payment = new Payment();
        payment.setTxnNo(payment.getTxnNo());
        payment.setAmount(request.amountPaid());
        payment.setPaymentDate(request.paymentDate());
        payment.setDueDate(request.dueDate());
        payment.setPaymentMode(null);
        payment.setStatus(resolveStatus(request.status()));
        payment.setAmountPaid(request.amountPaid());
        payment.setAmountPending(request.amountPending());
        payment.setTenancyContract(contract);
        payment.setProperty(contract.getProperty());
        payment.setRoom(contract.getRoom());
        payment.setBedUnit(contract.getBedUnit());
        payment.setCreatedBy(createdBy);
        payment = paymentRepository.save(payment);
        return getPayment(payment.getId());
    }

    @Transactional
    public PaymentDto updatePayment(Long id, PaymentRequest request) {
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found: " + id));
        validateAmounts(request.amountPaid(), request.amountPending());
        TenancyContract contract = tenancyContractService.getContractForPayment(request.tenancyContractId());

        payment.setTxnNo(generateTxnNo(contract));
        payment.setAmount(request.amountPaid());
        payment.setPaymentDate(request.paymentDate());
        payment.setDueDate(request.dueDate());
        payment.setPaymentMode(null);
        payment.setStatus(resolveStatus(request.status()));
        payment.setAmountPaid(request.amountPaid());
        payment.setAmountPending(request.amountPending());
        payment.setTenancyContract(contract);
        payment.setProperty(contract.getProperty());
        payment.setRoom(contract.getRoom());
        payment.setBedUnit(contract.getBedUnit());
        payment = paymentRepository.save(payment);
        return getPayment(payment.getId());
    }

    @Transactional
    public void deletePayment(Long id) {
        if (!paymentRepository.existsById(id)) {
            throw new ResourceNotFoundException("Payment not found: " + id);
        }
        paymentRepository.deleteById(id);
    }

    private void validateAmounts(BigDecimal amountPaid, BigDecimal amountPending) {
        if (amountPaid.compareTo(BigDecimal.ZERO) < 0 || amountPending.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Paid and pending amounts must be zero or positive.");
        }
    }

    private PaymentStatus resolveStatus(PaymentStatus requestedStatus) {
        return requestedStatus == null ? PaymentStatus.PENDING : requestedStatus;
    }

    private String generateTxnNo(TenancyContract contract) {
        String token = UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();
        return "CONTRACT-" + contract.getId() + "-" + token;
    }
}
