package com.stackportal.repository.master;

import com.stackportal.entity.master.Tenant;
import com.stackportal.entity.master.TenantStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TenantRepository extends JpaRepository<Tenant, Long> {

    Optional<Tenant> findByCode(String code);

    boolean existsByCode(String code);

    boolean existsByName(String name);
    boolean existsByLogoId(UUID logoId);

    List<Tenant> findByStatus(TenantStatus status);
    long countByStatus(TenantStatus status);
    List<Tenant> findTop5ByOrderByCreatedAtDesc();

    @Query("""
            select t from Tenant t
            where (:search is null or :search = ''
                   or lower(t.name) like lower(concat('%', :search, '%'))
                   or lower(t.code) like lower(concat('%', :search, '%')))
              and (:status is null or t.status = :status)
            """)
    Page<Tenant> search(@Param("search") String search,
                        @Param("status") TenantStatus status,
                        Pageable pageable);
}
