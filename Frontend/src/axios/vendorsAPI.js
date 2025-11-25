import { api } from "./axios";

// ✅ Vendor API calls
const vendorAPI = {
  create: (data) => api.post("/vendors", data),
  getAll: () => api.get("/vendors"),
  update: (id, data) => api.put(`/vendors/${id}`, data),
  remove: (id) => api.delete(`/vendors/${id}`),
  updateStatus: (id, status) => api.patch(`/vendors/${id}/status`, { status }),
  getStatement: (id, params) => api.get(`/vendors/${id}/statement`, { params }),
};

export default vendorAPI;
