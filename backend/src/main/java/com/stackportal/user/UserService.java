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

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService implements UserDetailsService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        return userRepository.findByEmailOrUsername(username, username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
    }

    @Transactional
    public ApiResponse<UserDto> createUser(CreateUserRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ApiException("Email already in use", HttpStatus.BAD_REQUEST);
        }

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setActive(true);
        user.setEmailVerified(true);
        user.setRoles(resolveRoles(request.getRoles()));

        userRepository.save(user);
        return ApiResponse.ok("User created", toDto(user));
    }

    @Transactional
    public ApiResponse<UserDto> updateUser(Long id, UpdateUserRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ApiException("User not found", HttpStatus.NOT_FOUND));

        user.setName(request.getName());
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

    public ApiResponse<Page<UserDto>> listUsers(int page, int size, String search) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<User> users;
        if (search != null && !search.isBlank()) {
            users = userRepository.findAll(pageable)
                    .map(u -> u); // placeholder - for complex search use Specifications or custom query
        } else {
            users = userRepository.findAll(pageable);
        }
        Page<UserDto> mapped = users.map(this::toDto);
        return ApiResponse.ok("Users fetched", mapped);
    }

    @Transactional
    public ApiResponse<UserDto> assignRoles(Long id, Set<String> roleNames) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ApiException("User not found", HttpStatus.NOT_FOUND));
        user.setRoles(resolveRoles(roleNames));
        userRepository.save(user);
        return ApiResponse.ok("Roles updated", toDto(user));
    }

    private UserDto toDto(User user) {
        return UserDto.builder()
                .id(user.getId())
                .name(user.getName())
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
        List<Role> roles = roleNames.stream()
                .map(name -> roleRepository.findByRoleName(RoleName.valueOf(name))
                        .orElseThrow(() -> new ApiException("Role not found: " + name, HttpStatus.BAD_REQUEST)))
                .toList();
        return java.util.Set.copyOf(roles);
    }
}

