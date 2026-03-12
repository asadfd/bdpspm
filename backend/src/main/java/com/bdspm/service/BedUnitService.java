package com.bdspm.service;

import com.bdspm.api.dto.BedUnitManagementDto;
import com.bdspm.api.dto.BedUnitRequest;
import com.bdspm.api.dto.DtoMapper;
import com.bdspm.common.ResourceNotFoundException;
import com.bdspm.domain.entity.BedUnit;
import com.bdspm.domain.entity.Room;
import com.bdspm.domain.repository.BedUnitRepository;
import com.bdspm.domain.repository.RoomRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class BedUnitService {

    private final BedUnitRepository bedUnitRepository;
    private final RoomRepository roomRepository;

    public BedUnitService(BedUnitRepository bedUnitRepository, RoomRepository roomRepository) {
        this.bedUnitRepository = bedUnitRepository;
        this.roomRepository = roomRepository;
    }

    @Transactional(readOnly = true)
    public List<BedUnitManagementDto> listBeds() {
        return bedUnitRepository.findAllWithRoomAndProperty().stream()
                .map(DtoMapper::toBedUnitManagementDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public BedUnitManagementDto getBed(Long id) {
        return bedUnitRepository.findDetailedById(id)
                .map(DtoMapper::toBedUnitManagementDto)
                .orElseThrow(() -> new ResourceNotFoundException("Bed unit not found: " + id));
    }

    @Transactional
    public BedUnitManagementDto createBed(BedUnitRequest request) {
        Room room = roomRepository.findById(request.roomId())
                .orElseThrow(() -> new ResourceNotFoundException("Room not found: " + request.roomId()));

        BedUnit bedUnit = new BedUnit();
        bedUnit.setStatus(request.status());
        bedUnit.setRoom(room);
        bedUnit = bedUnitRepository.save(bedUnit);
        return getBed(bedUnit.getId());
    }

    @Transactional
    public BedUnitManagementDto updateBed(Long id, BedUnitRequest request) {
        BedUnit bedUnit = bedUnitRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bed unit not found: " + id));
        Room room = roomRepository.findById(request.roomId())
                .orElseThrow(() -> new ResourceNotFoundException("Room not found: " + request.roomId()));

        bedUnit.setStatus(request.status());
        bedUnit.setRoom(room);
        bedUnit = bedUnitRepository.save(bedUnit);
        return getBed(bedUnit.getId());
    }

    @Transactional
    public void deleteBed(Long id) {
        if (!bedUnitRepository.existsById(id)) {
            throw new ResourceNotFoundException("Bed unit not found: " + id);
        }
        bedUnitRepository.deleteById(id);
    }
}
