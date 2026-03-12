package com.bdspm.domain.repository;

import com.bdspm.domain.entity.Property;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PropertyRepository extends JpaRepository<Property, Long> {

    @EntityGraph(attributePaths = {"rooms"})
    @Query("select distinct p from Property p order by p.name asc, p.id asc")
    List<Property> findAllWithRoomsAndBedUnits();

    @EntityGraph(attributePaths = {"rooms"})
    @Query("select distinct p from Property p where p.id = :id")
    Optional<Property> findDetailedById(@Param("id") Long id);
}
