import { api } from "./axios";

const clusterTransactionApi = {
  create: (data) => api.post("/cluster-transaction", data),
  getAll: () => api.get("/cluster-transaction"),
};

export default clusterTransactionApi;
