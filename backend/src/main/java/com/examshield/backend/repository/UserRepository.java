package com.examshield.backend.repository;

import com.examshield.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.examshield.backend.model.UserRole;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    List<User> findByRole(UserRole role);
    long countByRole(UserRole role);
    org.springframework.data.domain.Page<User> findByRole(UserRole role, org.springframework.data.domain.Pageable pageable);
    org.springframework.data.domain.Page<User> findAll(org.springframework.data.domain.Pageable pageable);
}
