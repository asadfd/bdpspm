package com.bdspm.api.dto;

import com.bdspm.domain.entity.BedUnit;
import com.bdspm.domain.entity.Payment;
import com.bdspm.domain.entity.Property;
import com.bdspm.domain.entity.Room;
import com.bdspm.domain.entity.TenancyContract;

import java.util.List;

public final class DtoMapper {

    private DtoMapper() {
    }

    public static PropertyDto toPropertyDto(Property property) {
        List<RoomDto> rooms = property.getRooms().stream()
                .sorted((left, right) -> {
                    int byName = left.getName().compareToIgnoreCase(right.getName());
                    if (byName != 0) {
                        return byName;
                    }
                    return Long.compare(left.getId(), right.getId());
                })
                .map(DtoMapper::toRoomDto)
                .toList();
        return new PropertyDto(property.getId(), property.getName(), rooms);
    }

    public static RoomDto toRoomDto(Room room) {
        List<BedUnitDto> bedUnits = room.getBedUnits().stream()
                .sorted((left, right) -> Long.compare(left.getId(), right.getId()))
                .map(DtoMapper::toBedUnitDto)
                .toList();
        return new RoomDto(room.getId(), room.getName(), room.getProperty().getId(), bedUnits);
    }

    public static BedUnitDto toBedUnitDto(BedUnit bedUnit) {
        return new BedUnitDto(bedUnit.getId(), bedUnit.getStatus(), bedUnit.getRoom().getId());
    }

    public static RoomManagementDto toRoomManagementDto(Room room) {
        return new RoomManagementDto(
                room.getId(),
                room.getName(),
                room.getProperty().getId(),
                room.getProperty().getName(),
                room.getBedUnits().size()
        );
    }

    public static BedUnitManagementDto toBedUnitManagementDto(BedUnit bedUnit) {
        return new BedUnitManagementDto(
                bedUnit.getId(),
                bedUnit.getStatus(),
                bedUnit.getRoom().getId(),
                bedUnit.getRoom().getName(),
                bedUnit.getRoom().getProperty().getId(),
                bedUnit.getRoom().getProperty().getName()
        );
    }

    public static PaymentDto toPaymentDto(Payment payment) {
        TenancyContract contract = payment.getTenancyContract();
        return new PaymentDto(
                payment.getId(),
                contract == null ? null : contract.getId(),
                contract == null ? null : contract.getTenantName(),
                payment.getPaymentDate(),
                payment.getDueDate(),
                payment.getAmountPaid(),
                payment.getAmountPending(),
                payment.getStatus(),
                payment.getProperty() == null ? null : payment.getProperty().getId(),
                payment.getProperty() == null ? null : payment.getProperty().getName(),
                payment.getRoom() == null ? null : payment.getRoom().getId(),
                payment.getRoom() == null ? null : payment.getRoom().getName(),
                payment.getBedUnit() == null ? null : payment.getBedUnit().getId(),
                contract == null ? null : contract.getStatus().name(),
                payment.getCreatedBy().getId(),
                payment.getCreatedBy().getUsername(),
                payment.getCreatedAt()
        );
    }

    public static TenancyContractDto toTenancyContractDto(TenancyContract contract) {
        return new TenancyContractDto(
                contract.getId(),
                contract.getTenantName(),
                contract.getTenantGovernmentId(),
                contract.getTenantPhoneNumber(),
                contract.getProperty().getId(),
                contract.getProperty().getName(),
                contract.getRoom().getId(),
                contract.getRoom().getName(),
                contract.getBedUnit().getId(),
                contract.getBedUnit().getStatus(),
                contract.getRentAmount(),
                contract.getStartDate(),
                contract.getEndDate(),
                contract.getStatus(),
                contract.isEndedImmediately(),
                contract.getActualEndDate(),
                contract.getCreatedAt()
        );
    }
}
