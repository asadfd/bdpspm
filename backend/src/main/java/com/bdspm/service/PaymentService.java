package com.bdspm.service;

import com.bdspm.api.dto.DtoMapper;
import com.bdspm.api.dto.PaymentDto;
import com.bdspm.api.dto.PaymentLogRequest;
import com.bdspm.api.dto.PaymentRequest;
import com.bdspm.domain.entity.BedUnit;
import com.bdspm.common.ResourceNotFoundException;
import com.bdspm.domain.entity.Payment;
import com.bdspm.domain.entity.Property;
import com.bdspm.domain.entity.Room;
import com.bdspm.domain.entity.User;
import com.bdspm.domain.enums.PaymentStatus;
import com.bdspm.domain.repository.BedUnitRepository;
import com.bdspm.domain.repository.PaymentRepository;
import com.bdspm.domain.repository.PropertyRepository;
import com.bdspm.domain.repository.RoomRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final PropertyRepository propertyRepository;
    private final RoomRepository roomRepository;
    private final BedUnitRepository bedUnitRepository;

    public PaymentService(PaymentRepository paymentRepository,
                          PropertyRepository propertyRepository,
                          RoomRepository roomRepository,
                          BedUnitRepository bedUnitRepository) {
        this.paymentRepository = paymentRepository;
        this.propertyRepository = propertyRepository;
        this.roomRepository = roomRepository;
        this.bedUnitRepository = bedUnitRepository;
    }

    @Transactional(readOnly = true)
    public List<PaymentDto> listPayments() {
        return paymentRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(DtoMapper::toPaymentDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public PaymentDto getPayment(Long id) {
        return paymentRepository.findDetailedById(id)
                .map(DtoMapper::toPaymentDto)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found: " + id));
    }

    @Transactional
    public PaymentDto logPayment(PaymentLogRequest request, User createdBy) {
        PaymentRequest paymentRequest = new PaymentRequest(
                request.txnNo(),
                request.amount(),
                request.date(),
                null,
                PaymentStatus.PENDING,
                request.propertyId(),
                request.roomId(),
                request.bedUnitId()
        );
        return createPayment(paymentRequest, createdBy);
    }

    @Transactional
    public PaymentDto createPayment(PaymentRequest request, User createdBy) {
        validateUniqueTxnNo(request.txnNo(), null);
        PaymentLinks paymentLinks = resolvePaymentLinks(request.propertyId(), request.roomId(), request.bedUnitId());

        Payment payment = new Payment();
        payment.setTxnNo(request.txnNo().trim());
        payment.setAmount(request.amount());
        payment.setPaymentDate(request.paymentDate());
        payment.setPaymentMode(normalizePaymentMode(request.paymentMode()));
        payment.setStatus(request.status() == null ? PaymentStatus.PENDING : request.status());
        payment.setProperty(paymentLinks.property());
        payment.setRoom(paymentLinks.room());
        payment.setBedUnit(paymentLinks.bedUnit());
        payment.setCreatedBy(createdBy);
        payment = paymentRepository.save(payment);
        return getPayment(payment.getId());
    }

    @Transactional
    public PaymentDto updatePayment(Long id, PaymentRequest request) {
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found: " + id));

        validateUniqueTxnNo(request.txnNo(), id);
        PaymentLinks paymentLinks = resolvePaymentLinks(request.propertyId(), request.roomId(), request.bedUnitId());

        payment.setTxnNo(request.txnNo().trim());
        payment.setAmount(request.amount());
        payment.setPaymentDate(request.paymentDate());
        payment.setPaymentMode(normalizePaymentMode(request.paymentMode()));
        payment.setStatus(request.status() == null ? payment.getStatus() : request.status());
        payment.setProperty(paymentLinks.property());
        payment.setRoom(paymentLinks.room());
        payment.setBedUnit(paymentLinks.bedUnit());
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

    private void validateUniqueTxnNo(String txnNo, Long currentId) {
        String normalizedTxnNo = txnNo.trim();
        boolean exists = currentId == null
                ? paymentRepository.existsByTxnNo(normalizedTxnNo)
                : paymentRepository.existsByTxnNoAndIdNot(normalizedTxnNo, currentId);

        if (exists) {
            throw new IllegalArgumentException("Payment with txn_no already exists: " + normalizedTxnNo);
        }
    }

    private String normalizePaymentMode(String paymentMode) {
        if (paymentMode == null || paymentMode.isBlank()) {
            return null;
        }
        return paymentMode.trim();
    }

    private PaymentLinks resolvePaymentLinks(Long propertyId, Long roomId, Long bedUnitId) {
        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new ResourceNotFoundException("Property not found: " + propertyId));
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found: " + roomId));
        BedUnit bedUnit = bedUnitRepository.findById(bedUnitId)
                .orElseThrow(() -> new ResourceNotFoundException("Bed unit not found: " + bedUnitId));

        if (room.getProperty() == null || !property.getId().equals(room.getProperty().getId())) {
            throw new IllegalArgumentException("Selected room does not belong to the selected property.");
        }
        if (bedUnit.getRoom() == null || !room.getId().equals(bedUnit.getRoom().getId())) {
            throw new IllegalArgumentException("Selected bed does not belong to the selected room.");
        }

        return new PaymentLinks(property, room, bedUnit);
    }

    private record PaymentLinks(Property property, Room room, BedUnit bedUnit) {
    }
}
