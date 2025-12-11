import { api } from "./axios";

// ✅ Category API calls
const ClusterInventoryApi = {
  create: (data) => api.post("/clusters-inventory", data),
  getAll: () => api.get("/clusters-inventory"),
  update: (id, data) => api.put(`/clusters-inventory/${id}`, data),
  remove: (id) => api.delete(`/clusters-inventory/${id}`),
  updateStatus: (id, status) =>
    api.patch(`/clusters-inventory/${id}/status`, { status }),
};

export default ClusterInventoryApi;
