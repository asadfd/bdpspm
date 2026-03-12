package com.bdspm.api;

import com.bdspm.api.dto.RoomManagementDto;
import com.bdspm.api.dto.RoomRequest;
import com.bdspm.service.RoomService;
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
@RequestMapping("/api/rooms")
public class RoomController {

    private final RoomService roomService;

    public RoomController(RoomService roomService) {
        this.roomService = roomService;
    }

    @GetMapping
    public ResponseEntity<List<RoomManagementDto>> listRooms() {
        return ResponseEntity.ok(roomService.listRooms());
    }

    @GetMapping("/{id}")
    public ResponseEntity<RoomManagementDto> getRoom(@PathVariable Long id) {
        return ResponseEntity.ok(roomService.getRoom(id));
    }

    @PostMapping
    public ResponseEntity<RoomManagementDto> createRoom(@Valid @RequestBody RoomRequest request) {
        RoomManagementDto dto = roomService.createRoom(request);
        return ResponseEntity.created(URI.create("/api/rooms/" + dto.id())).body(dto);
    }

    @PutMapping("/{id}")
    public ResponseEntity<RoomManagementDto> updateRoom(@PathVariable Long id,
                                                        @Valid @RequestBody RoomRequest request) {
        return ResponseEntity.ok(roomService.updateRoom(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRoom(@PathVariable Long id) {
        roomService.deleteRoom(id);
        return ResponseEntity.noContent().build();
    }
}
