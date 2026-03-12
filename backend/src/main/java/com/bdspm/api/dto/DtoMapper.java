package com.bdspm.api.dto;

import com.bdspm.domain.entity.BedUnit;
import com.bdspm.domain.entity.Payment;
import com.bdspm.domain.entity.Property;
import com.bdspm.domain.entity.Room;

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
        return new PaymentDto(
                payment.getId(),
                payment.getTxnNo(),
                payment.getAmount(),
                payment.getPaymentDate(),
                payment.getPaymentMode(),
                payment.getStatus(),
                payment.getProperty() == null ? null : payment.getProperty().getId(),
                payment.getProperty() == null ? null : payment.getProperty().getName(),
                payment.getRoom() == null ? null : payment.getRoom().getId(),
                payment.getRoom() == null ? null : payment.getRoom().getName(),
                payment.getBedUnit() == null ? null : payment.getBedUnit().getId(),
                payment.getCreatedBy().getId(),
                payment.getCreatedBy().getUsername(),
                payment.getCreatedAt()
        );
    }
}
