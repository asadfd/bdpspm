package com.bdspm.domain.repository;

import com.bdspm.domain.entity.Payment;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    boolean existsByTxnNo(String txnNo);

    boolean existsByTxnNoAndIdNot(String txnNo, Long id);

    @EntityGraph(attributePaths = {"createdBy", "property", "room", "bedUnit"})
    List<Payment> findAllByOrderByCreatedAtDesc();

    @EntityGraph(attributePaths = {"createdBy", "property", "room", "bedUnit"})
    @Query("select p from Payment p where p.id = :id")
    Optional<Payment> findDetailedById(@Param("id") Long id);
}
