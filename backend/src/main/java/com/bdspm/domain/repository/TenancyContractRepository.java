package com.bdspm.domain.repository;

import com.bdspm.domain.entity.TenancyContract;
import com.bdspm.domain.enums.TenancyContractStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface TenancyContractRepository extends JpaRepository<TenancyContract, Long> {

    @EntityGraph(attributePaths = {"property", "room", "bedUnit", "bedUnit.room", "bedUnit.room.property"})
    @Query("select c from TenancyContract c order by c.createdAt desc")
    List<TenancyContract> findAllDetailed();

    @EntityGraph(attributePaths = {"property", "room", "bedUnit", "bedUnit.room", "bedUnit.room.property"})
    @Query("select c from TenancyContract c where c.id = :id")
    Optional<TenancyContract> findDetailedById(@Param("id") Long id);

    boolean existsByBedUnitIdAndStatusIn(Long bedUnitId, Collection<TenancyContractStatus> statuses);

    boolean existsByBedUnitIdAndStatusInAndIdNot(Long bedUnitId, Collection<TenancyContractStatus> statuses, Long id);

    @EntityGraph(attributePaths = {"property", "room", "bedUnit", "bedUnit.room", "bedUnit.room.property"})
    List<TenancyContract> findAllByStatusAndEndDateLessThanEqual(TenancyContractStatus status, LocalDate endDate);
}
