import { api } from "./axios";

const IncentiveAPI = {
  getAllIncentive: () => api.get("/employees/all"),
  createIncentive: (form) => api.post("/incentives/create", form),
};

export default IncentiveAPI;
