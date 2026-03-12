package com.bdspm.service;

import com.bdspm.api.dto.DtoMapper;
import com.bdspm.api.dto.RoomManagementDto;
import com.bdspm.api.dto.RoomRequest;
import com.bdspm.common.ResourceNotFoundException;
import com.bdspm.domain.entity.Property;
import com.bdspm.domain.entity.Room;
import com.bdspm.domain.repository.PropertyRepository;
import com.bdspm.domain.repository.RoomRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class RoomService {

    private final RoomRepository roomRepository;
    private final PropertyRepository propertyRepository;

    public RoomService(RoomRepository roomRepository, PropertyRepository propertyRepository) {
        this.roomRepository = roomRepository;
        this.propertyRepository = propertyRepository;
    }

    @Transactional(readOnly = true)
    public List<RoomManagementDto> listRooms() {
        return roomRepository.findAllWithPropertyAndBedUnits().stream()
                .map(DtoMapper::toRoomManagementDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public RoomManagementDto getRoom(Long id) {
        return roomRepository.findDetailedById(id)
                .map(DtoMapper::toRoomManagementDto)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found: " + id));
    }

    @Transactional
    public RoomManagementDto createRoom(RoomRequest request) {
        Property property = propertyRepository.findById(request.propertyId())
                .orElseThrow(() -> new ResourceNotFoundException("Property not found: " + request.propertyId()));

        Room room = new Room();
        room.setName(request.name().trim());
        room.setProperty(property);
        room = roomRepository.save(room);
        return getRoom(room.getId());
    }

    @Transactional
    public RoomManagementDto updateRoom(Long id, RoomRequest request) {
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found: " + id));
        Property property = propertyRepository.findById(request.propertyId())
                .orElseThrow(() -> new ResourceNotFoundException("Property not found: " + request.propertyId()));

        room.setName(request.name().trim());
        room.setProperty(property);
        room = roomRepository.save(room);
        return getRoom(room.getId());
    }

    @Transactional
    public void deleteRoom(Long id) {
        if (!roomRepository.existsById(id)) {
            throw new ResourceNotFoundException("Room not found: " + id);
        }
        roomRepository.deleteById(id);
    }
}
