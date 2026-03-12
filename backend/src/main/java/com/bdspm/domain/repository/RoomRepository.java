package com.bdspm.domain.repository;

import com.bdspm.domain.entity.Room;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface RoomRepository extends JpaRepository<Room, Long> {

    @EntityGraph(attributePaths = {"property", "bedUnits"})
    @Query("select distinct r from Room r order by r.name asc, r.id asc")
    List<Room> findAllWithPropertyAndBedUnits();

    @EntityGraph(attributePaths = {"property", "bedUnits"})
    @Query("select distinct r from Room r where r.id = :id")
    Optional<Room> findDetailedById(@Param("id") Long id);
}
