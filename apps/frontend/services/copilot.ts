import { api } from "@/lib/axios";

export const copilotService = {
  getForecast() {
    return api.get("/copilot/forecast");
  },

  chat(prompt: string) {
    return api.post("/copilot/chat", { prompt });
  },
};
