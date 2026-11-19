import { api } from "@/lib/axios";

export const reportService = {
  getStaffReport(query?: any) {
    return api.get("/reports/staff", { params: query });
  },

  getTrainingReport(query?: any) {
    return api.get("/reports/training", { params: query });
  },

  getCertificateReport(query?: any) {
    return api.get("/reports/certificates", { params: query });
  },

  getComplianceReport() {
    return api.get("/reports/compliance");
  },

  getExpiringReport() {
    return api.get("/reports/expiring");
  },

  getCqcInspectionPack(organizationId?: string) {
    return api.get("/reports/cqc-inspection-pack", {
      params: organizationId ? { organizationId } : undefined,
    });
  },
};
