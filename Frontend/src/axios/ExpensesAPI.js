import { api } from "./axios";

const expensesAPI = {
  getAll: () => api.get("/expenses"),
  // create: (data) => api.post("/expenses/create", data),
  create: (data) =>
    api.post("/expenses/create", data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),
};

export default expensesAPI;
