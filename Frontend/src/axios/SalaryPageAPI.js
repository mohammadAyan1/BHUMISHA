import { api } from "./axios";

const salaryPageAPI = {
  generate: (payload) => api.post("/salary/generate", payload),
  getReport: (id, year, month) =>
    api.get(`/salary/employee/${id}?year=${year}&month=${month}`),
};

export default salaryPageAPI;
