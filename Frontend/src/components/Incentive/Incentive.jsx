import React, { useState, useEffect } from "react";
import IncentiveAPI from "../../axios/IncentiveApi";

export default function IncentiveForm() {
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState({
    employee_id: "",
    year: new Date().getFullYear(),
    month: String(new Date().getMonth() + 1).padStart(2, "0"),
    amount: "",
    remark: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await IncentiveAPI.getAllIncentive();
        setEmployees(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchEmployees();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await IncentiveAPI.createIncentive(form);
      alert("Incentive added successfully!");
      setForm({
        employee_id: "",
        year: new Date().getFullYear(),
        month: String(new Date().getMonth() + 1).padStart(2, "0"),
        amount: "",
        remark: "",
      });
    } catch (err) {
      console.error(err);
      alert("Error adding incentive");
    }
    setLoading(false);
  };

  const months = [
    { value: "01", name: "January" },
    { value: "02", name: "February" },
    { value: "03", name: "March" },
    { value: "04", name: "April" },
    { value: "05", name: "May" },
    { value: "06", name: "June" },
    { value: "07", name: "July" },
    { value: "08", name: "August" },
    { value: "09", name: "September" },
    { value: "10", name: "October" },
    { value: "11", name: "November" },
    { value: "12", name: "December" },
  ];

  return (
    <div className="max-w-lg mx-auto mt-10 p-4 sm:p-6 lg:p-8">
      <div className="bg-white shadow-md rounded-xl p-6 sm:p-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
          Add Incentive
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Employee Select */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Employee
            </label>
            <select
              name="employee_id"
              value={form.employee_id}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            >
              <option value="">Select Employee</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name}
                </option>
              ))}
            </select>
          </div>

          {/* Year */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">Year</label>
            <input
              type="number"
              name="year"
              value={form.year}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Enter Year"
              min="2000"
              max="2100"
              required
            />
          </div>

          {/* Month */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Month
            </label>
            <select
              name="month"
              value={form.month}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            >
              <option value="">Select Month</option>
              {months.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Incentive Amount
            </label>
            <input
              type="number"
              name="amount"
              value={form.amount}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Enter amount"
              required
            />
          </div>

          {/* Remark */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Remark
            </label>
            <textarea
              name="remark"
              value={form.remark}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
              rows={3}
              placeholder="Write remark..."
            ></textarea>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition duration-200 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Saving..." : "Add Incentive"}
          </button>
        </form>
      </div>
    </div>
  );
}
