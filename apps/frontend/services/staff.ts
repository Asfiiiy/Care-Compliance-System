import { api } from "@/lib/axios";

export const staffService = {
  findAll(query?: any) {
    return api.get("/staff", {
      params: query,
    });
  },

  findOne(id: string) {
    return api.get(`/staff/${id}`);
  },

  create(dto: any) {
    return api.post("/staff", dto);
  },

  update(id: string, dto: any) {
    return api.patch(`/staff/${id}`, dto);
  },

  remove(id: string) {
    return api.delete(`/staff/${id}`);
  },

  restore(id: string) {
    return api.patch(`/staff/${id}/restore`);
  },
};
