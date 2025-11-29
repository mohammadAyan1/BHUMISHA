import { api } from "./axios";

// ✅ Category API calls
const holidayAPI = {
  create: (data) => api.post("/holiday", data),
  getAll: () => api.get("/holiday"),
  //   update: (id, data) => api.put(`/categories/${id}`, data),
  //   remove: (id) => api.delete(`/categories/${id}`),
  //   updateStatus: (id, status) =>
  //     api.patch(`/categories/${id}/status`, { status }),
};

export default holidayAPI;
