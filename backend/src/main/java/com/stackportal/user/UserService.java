package com.stackportal.user;

import com.stackportal.auth.EmailService;
import com.stackportal.common.ApiResponse;
import com.stackportal.exception.ApiException;
import com.stackportal.user.dto.CreateUserRequest;
import com.stackportal.user.dto.UpdateUserRequest;
import com.stackportal.user.dto.UserDto;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;

import java.util.List;
import java.security.SecureRandom;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService implements UserDetailsService {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(UserService.class);

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    private static final Set<String> ASSIGNABLE_ROLES = Set.of("ADMIN", "MANAGER", "USER");
    private static final char[] TEMPORARY_PASSWORD_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%".toCharArray();
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        Long tenant = com.stackportal.tenant.context.TenantContext.getTenantId();
        log.debug("UserService.loadUserByUsername: username={} tenantId={} thread={}", username, tenant, Thread.currentThread().getId());
        return userRepository.findByEmailOrUsername(username, username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
    }

    @Transactional
    public ApiResponse<UserDto> createUser(CreateUserRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ApiException("Email already in use", HttpStatus.BAD_REQUEST);
        }
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new ApiException("Username already in use", HttpStatus.BAD_REQUEST);
        }

        String temporaryPassword = request.getPassword() == null || request.getPassword().isBlank()
                ? generateTemporaryPassword() : request.getPassword();

        User user = new User();
        user.setName(request.getName());
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(temporaryPassword));
        user.setActive(true);
        user.setEmailVerified(true);
        user.setRoles(resolveRoles(request.getRoles()));

        userRepository.save(user);
        String loginUrl = frontendUrl.replaceAll("/+$", "") + "/auth/login";
        emailService.sendNewUserCredentials(user.getEmail(), user.getName(), user.getUsername(), temporaryPassword, loginUrl);
        return ApiResponse.ok("User created", toDto(user));
    }

    @Transactional
    public ApiResponse<UserDto> updateUser(Long id, UpdateUserRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ApiException("User not found", HttpStatus.NOT_FOUND));

        if (userRepository.existsByEmailAndIdNot(request.getEmail(), id)) {
            throw new ApiException("Email already in use", HttpStatus.BAD_REQUEST);
        }
        if (userRepository.existsByUsernameAndIdNot(request.getUsername(), id)) {
            throw new ApiException("Username already in use", HttpStatus.BAD_REQUEST);
        }
        user.setName(request.getName());
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());

        if (request.getActive() != null) {
            boolean previousActive = user.isActive();
            user.setActive(request.getActive());
            if (previousActive != user.isActive()) {
                emailService.sendAccountStatusChange(user.getEmail(), user.isActive());
            }
        }

        if (request.getRoles() != null && !request.getRoles().isEmpty()) {
            user.setRoles(resolveRoles(request.getRoles()));
        }

        userRepository.save(user);
        return ApiResponse.ok("User updated", toDto(user));
    }

    @Transactional
    public ApiResponse<Void> deleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            throw new ApiException("User not found", HttpStatus.NOT_FOUND);
        }
        userRepository.deleteById(id);
        return ApiResponse.ok("User deleted", null);
    }

    @Transactional
    public ApiResponse<Void> setActive(Long id, boolean active) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ApiException("User not found", HttpStatus.NOT_FOUND));
        boolean previousActive = user.isActive();
        user.setActive(active);
        userRepository.save(user);

        if (previousActive != active) {
            emailService.sendAccountStatusChange(user.getEmail(), active);
        }

        return ApiResponse.ok("User status updated", null);
    }

    public ApiResponse<UserDto> getUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ApiException("User not found", HttpStatus.NOT_FOUND));
        return ApiResponse.ok("User fetched successfully", toDto(user));
    }

    @Transactional
    public ApiResponse<Page<UserDto>> listUsers(int page, int size, String search, String sortBy,
                                                String sortDir, Boolean active, Boolean emailVerified) {
        Pageable pageable = PageRequest.of(page, size, createSort(sortBy, sortDir));
        Page<User> users = userRepository.findAll(
                UserSpecifications.withFilters(search, active, emailVerified), pageable);
        Page<UserDto> mapped = users.map(this::toDto);
        return ApiResponse.ok("Users fetched successfully", mapped);
    }

    private Sort createSort(String sortBy, String sortDir) {
        Set<String> supportedSortFields = Set.of("name", "email", "username", "active", "emailVerified", "createdAt", "updatedAt");
        String safeSortBy = supportedSortFields.contains(sortBy) ? sortBy : "createdAt";
        Sort.Direction direction = "asc".equalsIgnoreCase(sortDir) ? Sort.Direction.ASC : Sort.Direction.DESC;
        return Sort.by(direction, safeSortBy);
    }

    private UserDto toDto(User user) {
        return UserDto.builder()
                .id(user.getId())
                .name(user.getName())
                .username(user.getUsername())
                .email(user.getEmail())
                .active(user.isActive())
                .emailVerified(user.isEmailVerified())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .roles(user.getRoles().stream()
                        .map(r -> r.getRoleName().name())
                        .collect(Collectors.toSet()))
                .build();
    }

    private java.util.Set<Role> resolveRoles(Set<String> roleNames) {
        if (roleNames == null || roleNames.isEmpty()) {
            Role userRole = roleRepository.findByRoleName(RoleName.USER)
                    .orElseThrow(() -> new ApiException("Default USER role not configured", HttpStatus.INTERNAL_SERVER_ERROR));
            return java.util.Set.of(userRole);
        }
        if (roleNames.stream().anyMatch(role -> !ASSIGNABLE_ROLES.contains(role))) {
            throw new ApiException("Only ADMIN, MANAGER, and USER roles can be assigned", HttpStatus.BAD_REQUEST);
        }
        List<Role> roles = roleNames.stream()
                .map(name -> roleRepository.findByRoleName(RoleName.valueOf(name))
                        .orElseThrow(() -> new ApiException("Role not found: " + name, HttpStatus.BAD_REQUEST)))
                .toList();
        return java.util.Set.copyOf(roles);
    }

    private String generateTemporaryPassword() {
        StringBuilder password = new StringBuilder(12);
        for (int index = 0; index < 12; index++) {
            password.append(TEMPORARY_PASSWORD_CHARS[SECURE_RANDOM.nextInt(TEMPORARY_PASSWORD_CHARS.length)]);
        }
        return password.toString();
    }
}

