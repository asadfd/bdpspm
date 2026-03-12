package com.bdspm.domain.repository;

import com.bdspm.domain.entity.BedUnit;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface BedUnitRepository extends JpaRepository<BedUnit, Long> {

    @EntityGraph(attributePaths = {"room", "room.property"})
    @Query("select b from BedUnit b order by b.id asc")
    List<BedUnit> findAllWithRoomAndProperty();

    @EntityGraph(attributePaths = {"room", "room.property"})
    @Query("select b from BedUnit b where b.id = :id")
    Optional<BedUnit> findDetailedById(@Param("id") Long id);
}
