import { api } from "@/lib/axios";

export const organizationService = {
  getPublicList() {
    return api.get("/organizations/public-list");
  },

  findAll(query?: { search?: string }) {
    return api.get("/organizations", {
      params: query,
    });
  },

  findOne(id: string) {
    return api.get(`/organizations/${id}`);
  },

  create(dto: { name: string; address?: string; postcode?: string; rating?: string }) {
    return api.post("/organizations", dto);
  },

  update(id: string, dto: { name?: string; address?: string; postcode?: string; rating?: string }) {
    return api.patch(`/organizations/${id}`, dto);
  },

  remove(id: string) {
    return api.delete(`/organizations/${id}`);
  },
};
