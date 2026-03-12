package com.bdspm.domain.repository;

import com.bdspm.domain.entity.User;

import java.util.Optional;

public interface UserRepository extends org.springframework.data.jpa.repository.JpaRepository<User, Long> {

    Optional<User> findByUsernameAndActiveTrue(String username);

    Optional<User> findByUsernameAndEmailAndActiveTrue(String username, String email);

    Optional<User> findByEmailAndActiveTrue(String email);
}
