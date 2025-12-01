import { api } from "./axios";

// ✅ Category API calls
const holidayAPI = {
  create: (data) => api.post("/holiday", data),
  getAll: () => api.get("/holiday"),
};

export default holidayAPI;
