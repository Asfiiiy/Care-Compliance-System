import { api } from "@/lib/axios";

export const competencyService = {
  findAll(query?: any) {
    return api.get("/competencies", { params: query });
  },

  findOne(id: string) {
    return api.get(`/competencies/${id}`);
  },

  create(dto: any) {
    return api.post("/competencies", dto);
  },

  requestAudit(dto: { competency: string; shift?: string; notes?: string }) {
    return api.post("/competencies/request-audit", dto);
  },

  update(id: string, dto: any) {
    return api.patch(`/competencies/${id}`, dto);
  },

  remove(id: string) {
    return api.delete(`/competencies/${id}`);
  },
};
