import { api } from "@/lib/axios";

export const certificateService = {
  findAll(query?: any) {
    return api.get("/certificates", { params: query });
  },

  findOne(id: string) {
    return api.get(`/certificates/${id}`);
  },

  create(dto: any, file?: File) {
    const formData = new FormData();
    Object.keys(dto).forEach((key) => {
      if (dto[key] !== undefined && dto[key] !== null && dto[key] !== "") {
        formData.append(key, dto[key]);
      }
    });
    if (file) {
      formData.append("file", file);
    }
    return api.post("/certificates", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  update(id: string, dto: any, file?: File) {
    const formData = new FormData();
    Object.keys(dto).forEach((key) => {
      if (dto[key] !== undefined && dto[key] !== null && dto[key] !== "") {
        formData.append(key, dto[key]);
      }
    });
    if (file) {
      formData.append("file", file);
    }
    return api.patch(`/certificates/${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  remove(id: string) {
    return api.delete(`/certificates/${id}`);
  },
};
