package com.bdspm.service;

import com.bdspm.api.dto.DtoMapper;
import com.bdspm.api.dto.EndTenancyContractRequest;
import com.bdspm.api.dto.TenancyContractDto;
import com.bdspm.api.dto.TenancyContractRequest;
import com.bdspm.common.ResourceNotFoundException;
import com.bdspm.domain.entity.BedUnit;
import com.bdspm.domain.entity.Property;
import com.bdspm.domain.entity.Room;
import com.bdspm.domain.entity.TenancyContract;
import com.bdspm.domain.enums.BedUnitStatus;
import com.bdspm.domain.enums.TenancyContractStatus;
import com.bdspm.domain.repository.BedUnitRepository;
import com.bdspm.domain.repository.PropertyRepository;
import com.bdspm.domain.repository.RoomRepository;
import com.bdspm.domain.repository.TenancyContractRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.EnumSet;
import java.util.List;

@Service
public class TenancyContractService {

    private static final EnumSet<TenancyContractStatus> ACTIVE_CONTRACT_STATUSES =
            EnumSet.of(TenancyContractStatus.ACTIVE, TenancyContractStatus.NOTICE);

    private final TenancyContractRepository tenancyContractRepository;
    private final PropertyRepository propertyRepository;
    private final RoomRepository roomRepository;
    private final BedUnitRepository bedUnitRepository;

    public TenancyContractService(TenancyContractRepository tenancyContractRepository,
                                  PropertyRepository propertyRepository,
                                  RoomRepository roomRepository,
                                  BedUnitRepository bedUnitRepository) {
        this.tenancyContractRepository = tenancyContractRepository;
        this.propertyRepository = propertyRepository;
        this.roomRepository = roomRepository;
        this.bedUnitRepository = bedUnitRepository;
    }

    @Transactional
    public void refreshExpiredContracts() {
        List<TenancyContract> expiredContracts = tenancyContractRepository
                .findAllByStatusAndEndDateLessThanEqual(TenancyContractStatus.NOTICE, LocalDate.now());

        for (TenancyContract contract : expiredContracts) {
            contract.setStatus(TenancyContractStatus.ENDED);
            if (contract.getActualEndDate() == null) {
                contract.setActualEndDate(contract.getEndDate());
            }
            contract.getBedUnit().setStatus(BedUnitStatus.AVAILABLE);
        }
    }

    @Transactional
    public List<TenancyContractDto> listContracts() {
        refreshExpiredContracts();
        return tenancyContractRepository.findAllDetailed().stream()
                .map(DtoMapper::toTenancyContractDto)
                .toList();
    }

    @Transactional
    public TenancyContractDto getContract(Long id) {
        refreshExpiredContracts();
        return tenancyContractRepository.findDetailedById(id)
                .map(DtoMapper::toTenancyContractDto)
                .orElseThrow(() -> new ResourceNotFoundException("Contract not found: " + id));
    }

    @Transactional
    public TenancyContractDto createContract(TenancyContractRequest request) {
        validateDateRange(request.startDate(), request.endDate());
        ContractLinks links = resolveLinks(request.propertyId(), request.roomId(), request.bedUnitId());
        ensureBedCanAcceptContract(links.bedUnit(), null);

        TenancyContract contract = new TenancyContract();
        applyContractFields(contract, request, links);
        contract.setStatus(TenancyContractStatus.ACTIVE);
        contract.setEndedImmediately(false);
        contract.setActualEndDate(null);

        links.bedUnit().setStatus(BedUnitStatus.OCCUPIED);
        contract = tenancyContractRepository.save(contract);
        return getContract(contract.getId());
    }

    @Transactional
    public TenancyContractDto updateContract(Long id, TenancyContractRequest request) {
        refreshExpiredContracts();
        validateDateRange(request.startDate(), request.endDate());

        TenancyContract contract = tenancyContractRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Contract not found: " + id));
        if (contract.getStatus() == TenancyContractStatus.ENDED) {
            throw new IllegalArgumentException("Ended contracts cannot be updated.");
        }

        ContractLinks links = resolveLinks(request.propertyId(), request.roomId(), request.bedUnitId());
        Long currentBedId = contract.getBedUnit() == null ? null : contract.getBedUnit().getId();
        boolean changingBed = currentBedId == null || !currentBedId.equals(links.bedUnit().getId());
        if (changingBed) {
            ensureBedCanAcceptContract(links.bedUnit(), id);
            contract.getBedUnit().setStatus(BedUnitStatus.AVAILABLE);
        }

        applyContractFields(contract, request, links);
        links.bedUnit().setStatus(contract.getStatus() == TenancyContractStatus.NOTICE
                ? BedUnitStatus.NOTICE
                : BedUnitStatus.OCCUPIED);

        contract = tenancyContractRepository.save(contract);
        return getContract(contract.getId());
    }

    @Transactional
    public TenancyContractDto endContract(Long id, EndTenancyContractRequest request) {
        refreshExpiredContracts();

        TenancyContract contract = tenancyContractRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Contract not found: " + id));
        if (contract.getStatus() == TenancyContractStatus.ENDED) {
            throw new IllegalArgumentException("Contract is already ended.");
        }

        if (request.immediateEnd()) {
            contract.setStatus(TenancyContractStatus.ENDED);
            contract.setEndedImmediately(true);
            contract.setActualEndDate(LocalDate.now());
            contract.getBedUnit().setStatus(BedUnitStatus.AVAILABLE);
        } else if (!contract.getEndDate().isAfter(LocalDate.now())) {
            contract.setStatus(TenancyContractStatus.ENDED);
            contract.setEndedImmediately(false);
            contract.setActualEndDate(contract.getEndDate());
            contract.getBedUnit().setStatus(BedUnitStatus.AVAILABLE);
        } else {
            contract.setStatus(TenancyContractStatus.NOTICE);
            contract.setEndedImmediately(false);
            contract.setActualEndDate(null);
            contract.getBedUnit().setStatus(BedUnitStatus.NOTICE);
        }

        contract = tenancyContractRepository.save(contract);
        return getContract(contract.getId());
    }

    @Transactional
    public void deleteContract(Long id) {
        refreshExpiredContracts();
        TenancyContract contract = tenancyContractRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Contract not found: " + id));
        if (contract.getStatus() != TenancyContractStatus.ENDED) {
            throw new IllegalArgumentException("Only ended contracts can be deleted.");
        }
        tenancyContractRepository.delete(contract);
    }

    @Transactional
    public TenancyContract getContractForPayment(Long id) {
        refreshExpiredContracts();
        TenancyContract contract = tenancyContractRepository.findDetailedById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Contract not found: " + id));
        if (contract.getStatus() == TenancyContractStatus.ENDED) {
            throw new IllegalArgumentException("Payments can only be recorded for active or notice contracts.");
        }
        return contract;
    }

    private void validateDateRange(LocalDate startDate, LocalDate endDate) {
        if (endDate.isBefore(startDate)) {
            throw new IllegalArgumentException("Contract end date cannot be before the start date.");
        }
    }

    private void ensureBedCanAcceptContract(BedUnit bedUnit, Long currentContractId) {
        if (bedUnit.getStatus() != BedUnitStatus.AVAILABLE) {
            throw new IllegalArgumentException("Only available beds can receive a new tenancy contract.");
        }

        boolean hasExistingContract = currentContractId == null
                ? tenancyContractRepository.existsByBedUnitIdAndStatusIn(bedUnit.getId(), ACTIVE_CONTRACT_STATUSES)
                : tenancyContractRepository.existsByBedUnitIdAndStatusInAndIdNot(
                        bedUnit.getId(), ACTIVE_CONTRACT_STATUSES, currentContractId);

        if (hasExistingContract) {
            throw new IllegalArgumentException("The selected bed already has an active tenancy contract.");
        }
    }

    private ContractLinks resolveLinks(Long propertyId, Long roomId, Long bedUnitId) {
        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new ResourceNotFoundException("Property not found: " + propertyId));
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found: " + roomId));
        BedUnit bedUnit = bedUnitRepository.findDetailedById(bedUnitId)
                .orElseThrow(() -> new ResourceNotFoundException("Bed unit not found: " + bedUnitId));

        if (room.getProperty() == null || !property.getId().equals(room.getProperty().getId())) {
            throw new IllegalArgumentException("Selected room does not belong to the selected property.");
        }
        if (bedUnit.getRoom() == null || !room.getId().equals(bedUnit.getRoom().getId())) {
            throw new IllegalArgumentException("Selected bed does not belong to the selected room.");
        }

        return new ContractLinks(property, room, bedUnit);
    }

    private void applyContractFields(TenancyContract contract, TenancyContractRequest request, ContractLinks links) {
        contract.setTenantName(request.tenantName().trim());
        contract.setTenantGovernmentId(request.tenantGovernmentId().trim());
        contract.setTenantPhoneNumber(request.tenantPhoneNumber().trim());
        contract.setProperty(links.property());
        contract.setRoom(links.room());
        contract.setBedUnit(links.bedUnit());
        contract.setRentAmount(request.rentAmount());
        contract.setStartDate(request.startDate());
        contract.setEndDate(request.endDate());
    }

    private record ContractLinks(Property property, Room room, BedUnit bedUnit) {
    }
}
