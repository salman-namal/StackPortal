package com.stackportal.dto.response.tenant;

import java.util.List;

public record TenantDashboardResponse(long totalTenants, long activeTenants, long inactiveTenants,
                                      List<TenantResponse> recentTenants) {
}
