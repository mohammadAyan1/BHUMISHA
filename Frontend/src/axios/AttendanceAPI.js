import { api } from "./axios";

const AttendanceAPI = {
    mark: (data) => api.post("/attendance/mark", data),
};

export default AttendanceAPI;
