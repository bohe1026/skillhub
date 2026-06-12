package com.iflytek.skillhub.auth.local;

import jakarta.persistence.LockModeType;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface RegistrationInviteRepository extends JpaRepository<RegistrationInvite, Long> {

    Optional<RegistrationInvite> findByCodeIgnoreCase(String code);

    boolean existsByCodeIgnoreCase(String code);

    Page<RegistrationInvite> findAllByOrderByCreatedAtDesc(Pageable pageable);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select invite from RegistrationInvite invite where lower(invite.code) = lower(:code)")
    Optional<RegistrationInvite> findByCodeForUpdate(@Param("code") String code);
}
