import { api } from "@/lib/axios";

export const userService = {
  findAll() {
    return api.get("/users");
  },

  findOne(id: string) {
    return api.get(`/users/${id}`);
  },

  create(dto: any) {
    return api.post("/users", dto);
  },

  update(id: string, dto: any) {
    return api.patch(`/users/${id}`, dto);
  },

  remove(id: string) {
    return api.delete(`/users/${id}`);
  },

  clearMock() {
    return api.post("/users/clear-mock");
  },
};
