import React, { useEffect, useState, useMemo, useRef } from "react";
import AttendanceAPI from "../../axios/AttendanceAPI";
import holidayAPI from "../../axios/Holiday";

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

  const [holidays, setHolidays] = useState([]);
  const dayRefs = useRef({});

  const today = new Date();
  const todayDay = today.getDate();
  const todayMonth = today.getMonth() + 1;
  const todayYear = today.getFullYear();

  const Days = (monthVal, yearVal) => new Date(yearVal, monthVal, 0).getDate();
  const normalizeDate = (isoStr) =>
    new Date(isoStr).toISOString().split("T")[0];

  const holidayMap = useMemo(() => {
    const map = {};
    holidays.forEach((h) => {
      if (h && h.holiday_date) {
        map[normalizeDate(h.holiday_date)] = h;
      }
    });
    return map;
  }, [holidays]);

  const isSunday = (day, monthVal, yearVal) =>
    new Date(yearVal, monthVal - 1, day).getDay() === 0;

  const isFutureDate = (day, monthVal, yearVal) => {
    const d = new Date(yearVal, monthVal - 1, day, 0, 0, 0, 0);
    const todayOnly = new Date(todayYear, todayMonth - 1, todayDay, 0, 0, 0, 0);
    return d > todayOnly;
  };

  const formatCellDateKey = (day, monthVal, yearVal) =>
    `${String(yearVal).padStart(4, "0")}-${String(monthVal).padStart(
      2,
      "0"
    )}-${String(day).padStart(2, "0")}`;

  useEffect(() => {
    if (date) {
      const [y, m] = date.split("-");
      setMonth(Number(m));
      setYear(Number(y));
    } else {
      setMonth(todayMonth);
      setYear(todayYear);
    }
  }, [date]);

  useEffect(() => {
    AttendanceAPI.getAll()
      .then((res) => setEmployee(res?.data ?? []))
      .catch((err) => console.log(err));
  }, []);

  const fetchAllHoliday = async () => {
    holidayAPI
      .getAll()
      .then((res) => {
        const list = Array.isArray(res?.data)
          ? res.data
          : res?.data?.data ?? [];
        setHolidays(list);
      })
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchAllHoliday();
  }, []);

  const fetchAttendance = async () => {
    if (!year || !month) return;
    AttendanceAPI.getByYearMonth(year, month)
      .then((res) => setAttendance(res?.data ?? []))
      .catch((err) => console.log(err));
  };

  useEffect(() => {
    fetchAttendance();
  }, [year, month]);

  const handleDeleteAttendance = async (attendanceId) => {
    if (!attendanceId) return;
    await AttendanceAPI.delete(attendanceId)
      .then(() => fetchAttendance())
      .catch((err) => console.log(err));
  };

  const handleChangeAttendance = async (payload) => {
    if (!payload && !payloadData) return;
    await AttendanceAPI.mark(payloadData ?? payload)
      .then(() => fetchAttendance())
      .catch((err) => console.log(err));
  };

  const getAttendanceStatus = (empId, day, fullDate) => {
    if (!attendance) return null;
    const [y, m] = fullDate ? fullDate.split("-") : [todayYear, todayMonth];
    const selectedDate = new Date(`${y}-${m}-${String(day).padStart(2, "0")}`);
    return (
      attendance.find((a) => {
        if (a.employee_id !== empId) return false;
        const attD = new Date(a.date);
        return (
          attD.getDate() === selectedDate.getDate() &&
          attD.getMonth() === selectedDate.getMonth() &&
          attD.getFullYear() === selectedDate.getFullYear()
        );
      }) || null
    );
  };

  useEffect(() => {
    if (dayRefs.current[todayDay]) {
      dayRefs.current[todayDay].scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [month, year, attendance, holidays]);

  return (
    <div className="p-4 max-w-full overflow-x-auto">
      {/* Date Filter */}
      <div className="mb-4 flex items-center gap-4">
        <input
          type="month"
          className="border rounded-lg p-2"
          onChange={(e) => setDate(e.target.value)}
        />
        <div>
          <strong>
            {String(month).padStart(2, "0")}/{year}
          </strong>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="overflow-x-auto border rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200 table-auto">
          <thead className="bg-gray-100 sticky top-0">
            <tr>
              <th className="px-3 py-2 text-center sticky left-0 bg-gray-100">
                SNO.
              </th>
              <th className="px-3 py-2 text-left sticky left-12 bg-gray-100 min-w-[180px]">
                Name
              </th>
              {month &&
                year &&
                Array.from({ length: Days(month, year) }, (_, i) => {
                  const day = i + 1;
                  const isTodayCol =
                    day === todayDay &&
                    month === todayMonth &&
                    year === todayYear;
                  return (
                    <th
                      key={i}
                      className={`px-2 py-2 text-center ${
                        isTodayCol ? "bg-yellow-100" : ""
                      }`}
                    >
                      {String(day).padStart(2, "0")}/
                      {String(month).padStart(2, "0")}
                    </th>
                  );
                })}
              <th className="px-2 py-2 text-center bg-gray-100">
                Working Days
              </th>
              <th className="px-2 py-2 text-center bg-gray-100">Present</th>
              <th className="px-2 py-2 text-center bg-gray-100">Absent</th>
              <th className="px-2 py-2 text-center bg-gray-100">Leaves</th>
              <th className="px-2 py-2 text-center bg-gray-100">Half Days</th>
            </tr>
          </thead>

          <tbody>
            {employee.map((emp, index) => {
              let workingDays = 0,
                present = 0,
                absent = 0,
                leaves = 0,
                halfDays = 0;

              return (
                <tr key={emp.id} className="hover:bg-gray-50">
                  <td className="sticky left-0 bg-white text-center px-3 py-2">
                    {index + 1}
                  </td>
                  <td className="sticky left-12 bg-white px-3 py-2">
                    {emp.name}
                  </td>

                  {Array.from({ length: Days(month, year) }, (_, idx) => {
                    const day = idx + 1;
                    const cellKey = formatCellDateKey(day, month, year);
                    const holiday = holidayMap[cellKey];
                    const sunday = isSunday(day, month, year);
                    const future = isFutureDate(day, month, year);
                    const att = getAttendanceStatus(emp.id, day, date);
                    const isTodayCol =
                      day === todayDay &&
                      month === todayMonth &&
                      year === todayYear;

                    const tdRef = (el) => {
                      if (!dayRefs.current[day]) dayRefs.current[day] = el;
                    };

                    if (!sunday && !holiday) workingDays++;
                    if (att?.status === "present") present++;
                    else if (att?.status === "absent") absent++;
                    else if (att?.status === "leave") leaves++;
                    else if (
                      ["first halfday", "second halfday"].includes(att?.status)
                    )
                      halfDays++;

                    if (sunday)
                      return (
                        <td
                          key={idx}
                          ref={tdRef}
                          className={`text-center text-red-600 font-semibold ${
                            isTodayCol ? "bg-yellow-100" : ""
                          }`}
                        >
                          Sunday
                        </td>
                      );
                    if (holiday)
                      return (
                        <td
                          key={idx}
                          ref={tdRef}
                          className={`text-center ${
                            isTodayCol ? "bg-yellow-100" : ""
                          }`}
                        >
                          <div className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-sm font-semibold">
                            HOLIDAY
                          </div>
                          <div className="text-xs">{holiday.remark}</div>
                        </td>
                      );
                    if (future)
                      return (
                        <td
                          key={idx}
                          ref={tdRef}
                          className={isTodayCol ? "bg-yellow-100" : ""}
                        ></td>
                      );

                    return (
                      <td
                        key={idx}
                        ref={tdRef}
                        className={`text-center ${
                          isTodayCol ? "bg-yellow-100" : ""
                        }`}
                      >
                        <div className="flex flex-col items-center gap-1">
                          <input
                            type="checkbox"
                            checked={!att?.status}
                            onChange={() =>
                              att && handleDeleteAttendance(att.id)
                            }
                          />
                          <select
                            className="border rounded p-1 text-sm"
                            value={att?.status || ""}
                            onChange={(e) => {
                              const value = e.target.value;
                              const [y, m] = date
                                ? date.split("-")
                                : [year, month];
                              const selectedDate = `${y}-${m}-${String(
                                day
                              ).padStart(2, "0")}`;
                              const payload = {
                                employee_id: emp.id,
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
                            <option value="first halfday">
                              First Half Day
                            </option>
                            <option value="second halfday">
                              Second Half Day
                            </option>
                          </select>
                        </div>
                      </td>
                    );
                  })}

                  {/* Summary cells */}
                  <td className="text-center font-semibold">{workingDays}</td>
                  <td className="text-center font-semibold">
                    {Number(workingDays) -
                      (Number(absent) + Number(leaves) + Number(halfDays) / 2)}
                  </td>
                  <td className="text-center font-semibold">{absent}</td>
                  <td className="text-center font-semibold">{leaves}</td>
                  <td className="text-center font-semibold">{halfDays}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AttendenceUpdate;
