import React, { useState } from "react";
import EmployeeList from "../../components/EmployeeList/EmployeeList";
import salaryPageAPI from "../../axios/SalaryPageAPI";

export default function SalaryPage() {
  const [employee, setEmployee] = useState(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [report, setReport] = useState(null);

  async function generate() {
    if (!employee) return alert("Select employee");
    const res = await salaryPageAPI.generate({
      employee_id: employee.id,
      year,
      month,
    });
    setReport(res.data.result);
  }

  async function fetchReport() {
    if (!employee) return alert("Select employee");
    try {
      const res = await salaryPageAPI.getReport(employee?.id, year, month);

      const r = res.data.result;

      // Normalize DB fields into FE format
      const normalized = {
        daysInMonth: r.days_in_month,
        perDay: Number(r.base_salary) / r.days_in_month,
        totalDeduction: Number(r.total_deduction),
        incentivesTotal: Number(r.total_incentives),
        finalSalary: Number(r.final_salary),

        // ❗ You MUST fetch attendance rows if needed
        attendanceRecords: r.attendanceRecords || [], // fallback empty
      };

      setReport(normalized);
    } catch (err) {
      alert("Report not generated yet", err);
    }
  }

  console.log(report, "this is the reports");

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4 lg:p-6 min-h-screen bg-gray-100">
      {/* Employee Selector */}
      <div className="lg:w-1/4 bg-white p-5 rounded-2xl shadow-lg h-fit">
        <h5 className="text-lg font-semibold mb-4 text-gray-700">
          Select Employee
        </h5>
        <EmployeeList onSelect={setEmployee} show={false} />
      </div>

      {/* Salary Section */}
      <div className="lg:w-3/4 flex-1 flex flex-col gap-6">
        {/* Header & Controls */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-5 rounded-2xl shadow-lg">
          <div>
            <h4 className="text-xl font-bold text-gray-800">
              Salary — {employee?.name || "Select an employee"}
            </h4>
            <p className="text-gray-500 mt-1 text-sm">
              Generate or fetch saved report
            </p>
          </div>

          <div className="flex flex-wrap gap-3 mt-3 md:mt-0">
            <input
              type="number"
              className="p-2 rounded-lg border border-gray-300 w-24 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              placeholder="Year"
            />
            <input
              type="number"
              className="p-2 rounded-lg border border-gray-300 w-20 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              min={1}
              max={12}
              placeholder="Month"
            />
            <button
              onClick={generate}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition"
            >
              Generate
            </button>
            <button
              onClick={fetchReport}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-400 transition"
            >
              Fetch
            </button>
          </div>
        </div>

        {/* Report Section */}
        {report && (
          <div className="bg-white p-5 rounded-2xl shadow-lg">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-gray-700">
              <div className="p-4 bg-gray-50 rounded-lg text-center shadow-sm">
                <div className="text-sm text-gray-500">Days in Month</div>
                <div className="font-semibold">{report.daysInMonth}</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg text-center shadow-sm">
                <div className="text-sm text-gray-500">Per Day</div>
                <div className="font-semibold">₹{report.perDay}</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg text-center shadow-sm">
                <div className="text-sm text-gray-500">Total Deduction</div>
                <div className="font-semibold">₹{report.totalDeduction}</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg text-center shadow-sm">
                <div className="text-sm text-gray-500">Incentives</div>
                <div className="font-semibold">₹{report.incentivesTotal}</div>
              </div>
              <div className="col-span-full mt-3 p-4 bg-indigo-600 text-white rounded-lg text-center font-bold text-lg">
                Final Salary: ₹{report.finalSalary}
              </div>
            </div>

            {/* Attendance Table */}
            <h5 className="font-semibold mb-2 text-gray-700">
              Attendance Records
            </h5>
            <div className="overflow-x-auto max-h-80 rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Leave Type</th>
                    <th>Reason</th>
                    <th>Deduction</th>
                  </tr>
                </thead>

                <tbody>
                  {report.attendanceRecords.map((rec, idx) => (
                    <tr key={idx}>
                      <td>{new Date(rec.date).toLocaleDateString()}</td>
                      <td>{rec.status}</td>
                      <td>{rec.leave_type}</td>
                      <td>{rec.reason}</td>
                      <td>
                        {rec.status === "absent"
                          ? `₹${report.perDay}`
                          : rec.leave_type === "paid"
                          ? "-"
                          : rec.leave_type === "unpaid" &&
                            rec.status.includes("halfday")
                          ? `₹${report.perDay / 2}`
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
