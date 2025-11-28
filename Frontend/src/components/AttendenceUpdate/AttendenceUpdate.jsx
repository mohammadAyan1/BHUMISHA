import React, { useEffect, useState } from "react";
import AttendanceAPI from "../../axios/AttendanceAPI";

const AttendenceUpdate = () => {
  const [date, setDate] = useState(null);
  const [month, setMonth] = useState(null);
  const [year, setYear] = useState(null);
  const [employee, setEmployee] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [payloadData, setPayloadData] = useState(null);
  const [openDetailsModel, setOpenDetailsModel] = useState(null);
  const [popup, setPopup] = useState({
    open: false,
    empId: null,
    day: null,
    type: "",
    reason: "",
    paidType: "",
  });

  const Days = (month, year) => new Date(year, month, 0).getDate();

  useEffect(() => {
    if (date) {
      const [selectedYear, selectedMonth] = date.split("-");
      setMonth(Number(selectedMonth));
      setYear(Number(selectedYear));
    } else {
      setMonth(new Date().getMonth() + 1);
      setYear(new Date().getFullYear());
    }
  }, [date]);

  useEffect(() => {
    AttendanceAPI.getAll()
      .then((res) => setEmployee(res?.data))
      .catch(console.log);
  }, []);

  const handleGetAllAttendance = async () => {
    if (!year || !month) return;
    AttendanceAPI.getByYearMonth(year, month)
      .then((res) => setAttendance(res?.data))
      .catch(console.log);
  };

  useEffect(() => {
    handleGetAllAttendance();
  }, [year, month]);

  const handleDeleteAttendance = async (attendanceId) => {
    await AttendanceAPI.delete(attendanceId)
      .then(() => handleGetAllAttendance())
      .catch(console.log);
  };

  const handleChangeAttendance = async (payload) => {
    await AttendanceAPI.mark(payloadData ?? payload)
      .then(() => handleGetAllAttendance())
      .catch(console.log);
  };

  const getAttendanceStatus = (empId, day, fullDate) => {
    if (!attendance) return null;
    let targetDate;

    if (fullDate) {
      const [yr, mn] = fullDate.split("-");
      const d = String(day).padStart(2, "0");
      targetDate = new Date(`${yr}-${mn}-${d}`);
    } else {
      const now = new Date();
      const mn = String(now.getMonth() + 1).padStart(2, "0");
      const d = String(day).padStart(2, "0");
      targetDate = new Date(`${now.getFullYear()}-${mn}-${d}`);
    }

    const targetY = targetDate.getFullYear();
    const targetM = targetDate.getMonth() + 1;
    const targetD = targetDate.getDate();

    return (
      attendance.find((a) => {
        if (a.employee_id !== empId) return false;
        const attDate = new Date(a.date);
        return (
          attDate.getFullYear() === targetY &&
          attDate.getMonth() + 1 === targetM &&
          attDate.getDate() === targetD
        );
      }) || null
    );
  };

  return (
    <div className="p-4 max-w-full overflow-x-auto">
      {/* DATE FILTER */}
      <div className="mb-4 flex justify-start">
        <input
          type="month"
          className="border rounded-lg p-2 focus:ring-2 focus:ring-blue-400 focus:outline-none"
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      {/* ATTENDANCE TABLE */}
      <div className="overflow-x-auto shadow-md rounded-lg border">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100 sticky top-0 z-10">
            <tr>
              <th className="px-3 py-2 text-center sticky left-0 bg-gray-100 z-20">
                SNO.
              </th>
              <th className="px-3 py-2 text-center sticky left-12 bg-gray-100 z-20 min-w-[180px]">
                Name
              </th>
              {Array.from({ length: Days(month, year) }, (_, i) => (
                <th key={i} className="px-2 py-2 text-center">
                  {String(i + 1).padStart(2, "0")}/
                  {String(month).padStart(2, "0")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {employee.map((emp, index) => (
              <tr key={emp.id}>
                <td className="sticky left-0 bg-white z-10 text-center px-3 py-2">
                  {index + 1}
                </td>
                <td className="sticky left-12 bg-white z-10 px-3 py-2 min-w-[180px]">
                  {emp.name}
                </td>
                {Array.from({ length: Days(month, year) }, (_, dIndex) => {
                  const day = dIndex + 1;
                  const att = getAttendanceStatus(emp?.id, day, date);

                  return (
                    <td key={dIndex} className="px-1 py-1 text-center">
                      <div className="flex flex-col items-center gap-1">
                        {/* PRESENT CHECKBOX */}
                        <input
                          type="checkbox"
                          className="w-4 h-4"
                          checked={att?.status?.length > 0 ? false : true}
                          onChange={() => {
                            if (att) handleDeleteAttendance(att?.id);
                          }}
                        />

                        {/* STATUS SELECT */}
                        <select
                          className="text-sm border rounded p-1 focus:ring-1 focus:ring-blue-400 focus:outline-none"
                          value={att?.status || ""}
                          onChange={(e) => {
                            const value = e.target.value;
                            const [yr, mn] = date
                              ? date.split("-")
                              : [year, month];
                            const selectedDate = new Date(
                              `${yr}-${mn}-${String(day).padStart(2, "0")}`
                            );
                            const payload = {
                              employee_id: emp?.id,
                              status: value,
                              attendenceDate: selectedDate,
                            };

                            setPayloadData(payload);
                            if (value === "absent")
                              handleChangeAttendance(payload);
                            if (
                              [
                                "leave",
                                "first halfday",
                                "second halfday",
                              ].includes(value)
                            ) {
                              setPopup({
                                open: true,
                                empId: emp.id,
                                day,
                                type: value,
                              });
                            }
                          }}
                        >
                          <option value="">Select</option>
                          <option value="leave">Leave</option>
                          <option value="absent">Absent</option>
                          <option value="first halfday">First Half Day</option>
                          <option value="second halfday">
                            Second Half Day
                          </option>
                        </select>

                        {/* ICON BUTTON */}
                        {["leave", "first halfday", "second halfday"].includes(
                          att?.status
                        ) && (
                          <button
                            className="bg-yellow-400 text-white px-1 rounded text-xs"
                            onClick={() =>
                              setOpenDetailsModel({ ...att, openModel: true })
                            }
                          >
                            ⚠️
                          </button>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* DETAILS MODAL */}
      {openDetailsModel?.openModel && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-80 p-5">
            <h3 className="text-lg font-semibold mb-3">
              Leave Details – {openDetailsModel?.date}
            </h3>
            <p>
              <strong>Reason:</strong> {openDetailsModel?.reason}
            </p>
            <p>
              <strong>Leave Type:</strong> {openDetailsModel?.leave_type}
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400"
                onClick={() => setOpenDetailsModel(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP MODAL */}
      {popup.open && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-80 p-5">
            <h3 className="text-lg font-semibold mb-3">
              Reason for {popup.type}
            </h3>
            <textarea
              className="w-full border rounded p-2 mb-3 focus:ring-1 focus:ring-blue-400 focus:outline-none"
              placeholder="Enter reason..."
              value={popup.reason}
              onChange={(e) => {
                setPopup((p) => ({ ...p, reason: e.target.value }));
                setPayloadData((prev) => ({ ...prev, reason: e.target.value }));
              }}
            />
            <label className="block font-medium mb-1">Leave Type</label>
            <select
              className="w-full border rounded p-2 mb-3 focus:ring-1 focus:ring-blue-400 focus:outline-none"
              value={popup.paidType}
              onChange={(e) => {
                setPopup((p) => ({ ...p, paidType: e.target.value }));
                setPayloadData((prev) => ({
                  ...prev,
                  leave_type: e.target.value,
                }));
              }}
            >
              <option value="">Select</option>
              {popup.type === "leave" && (
                <>
                  <option value="paid">Paid Leave</option>
                  <option value="unpaid">Unpaid Leave</option>
                </>
              )}
              {(popup.type === "first halfday" ||
                popup.type === "second halfday") && (
                <>
                  <option value="paid">Paid Half Day</option>
                  <option value="unpaid">Unpaid Half Day</option>
                </>
              )}
            </select>
            <div className="flex justify-end gap-2">
              <button
                className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400"
                onClick={() => setPopup({ open: false })}
              >
                Cancel
              </button>
              <button
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={() => {
                  setAttendance((prev) =>
                    prev.map((a) =>
                      a.employee_id === popup.empId && a.day === popup.day
                        ? {
                            ...a,
                            status: popup.type,
                            reason: popup.reason,
                            paidType: popup.paidType,
                          }
                        : a
                    )
                  );
                  setPopup({ open: false });
                  handleChangeAttendance();
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendenceUpdate;
