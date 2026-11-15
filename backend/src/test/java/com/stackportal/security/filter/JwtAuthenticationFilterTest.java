package com.stackportal.security.filter;

import com.stackportal.security.jwt.JwtService;
import com.stackportal.service.user.UserService;
import com.stackportal.tenant.context.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.fail;
import static org.mockito.Mockito.*;

class JwtAuthenticationFilterTest {

    @AfterEach
    void clearTenantContext() {
        TenantContext.clear();
    }

    @Test
    void rejectsAJwtWhenTheRequestTenantDoesNotMatchItsTenantClaim() throws Exception {
        JwtService jwtService = mock(JwtService.class);
        UserService userService = mock(UserService.class);
        when(jwtService.extractUsername("token")).thenReturn("user@example.com");
        when(jwtService.getTenantIdFromToken("token")).thenReturn(42L);

        JwtAuthenticationFilter filter = new JwtAuthenticationFilter(jwtService, userService);
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/users");
        request.addHeader("Authorization", "Bearer token");
        request.addHeader("X-Tenant-ID", "7");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, (ignoredRequest, ignoredResponse) ->
                fail("The filter chain must not continue after a tenant mismatch"));

        assertThat(response.getStatus()).isEqualTo(403);
        verifyNoInteractions(userService);
    }
}
