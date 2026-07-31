package com.stackportal.user;

import org.springframework.data.jpa.domain.Specification;

public final class UserSpecifications {

    private UserSpecifications() {
    }

    public static Specification<User> withFilters(String search, Boolean active, Boolean emailVerified) {
        return Specification.where(matchesSearch(search))
                .and(hasActiveStatus(active))
                .and(hasEmailVerifiedStatus(emailVerified));
    }

    private static Specification<User> matchesSearch(String search) {
        return (root, query, criteriaBuilder) -> {
            if (search == null || search.isBlank()) {
                return criteriaBuilder.conjunction();
            }

            String pattern = "%" + search.trim().toLowerCase() + "%";
            return criteriaBuilder.or(
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("name")), pattern),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("username")), pattern),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("email")), pattern)
            );
        };
    }

    private static Specification<User> hasActiveStatus(Boolean active) {
        return (root, query, criteriaBuilder) -> active == null
                ? criteriaBuilder.conjunction()
                : criteriaBuilder.equal(root.get("active"), active);
    }

    private static Specification<User> hasEmailVerifiedStatus(Boolean emailVerified) {
        return (root, query, criteriaBuilder) -> emailVerified == null
                ? criteriaBuilder.conjunction()
                : criteriaBuilder.equal(root.get("emailVerified"), emailVerified);
    }
}
