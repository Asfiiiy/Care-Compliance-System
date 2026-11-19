import { api } from "@/lib/axios";

export const dashboardService = {
  getSummary(includeInactive?: boolean) {
    return api.get("/dashboard/summary", {
      params: includeInactive ? { includeInactive: "true" } : undefined
    });
  },

  getAdminSummary() {
    return api.get("/dashboard/admin-summary");
  },

  getTopOrganizations() {
    return api.get("/dashboard/top-organizations");
  },

  getRecentActivity() {
    return api.get("/dashboard/recent-activity");
  },

  getRecentNotifications() {
    return api.get("/dashboard/recent-notifications");
  },

  getExpiringCertificates() {
    return api.get("/dashboard/expiring-certificates");
  },

  getExpiringTrainings() {
    return api.get("/dashboard/expiring-trainings");
  },
};