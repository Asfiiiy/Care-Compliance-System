import { api } from "@/lib/axios";

export const trainingService = {
  findAll(query?: any) {
    return api.get("/training", { params: query });
  },

  findOne(id: string) {
    return api.get(`/training/${id}`);
  },

  create(dto: any) {
    return api.post("/training", dto);
  },

  update(id: string, dto: any) {
    return api.patch(`/training/${id}`, dto);
  },

  remove(id: string) {
    return api.delete(`/training/${id}`);
  },
};
