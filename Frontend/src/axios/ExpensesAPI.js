import { api } from "./axios";

const expensesAPI = {
  getAll: () => api.get("/expenses"),
  create: (data) => api.post("/expenses/create", data),
};

export default expensesAPI;
