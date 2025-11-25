import React, { useEffect, useState } from "react";
import employeeAPI from "../../axios/employeeAPI";
import expensesAPI from "../../axios/ExpensesAPI.js";
import { toast } from "react-toastify";

const Dropdowns = () => {
  const [formData, setFormData] = useState({
    category: "",
    subCategory: "",
    from: "",
    to: "",
    pnrNo: "",
    location: "",
    empName: "", // This will now store the selected employee name
    billNo: "",
    amount: "",
    remark: "",
  });

  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    employeeAPI
      .getAll()
      .then((res) => {
        console.log(res?.data);
        setEmployees(res?.data);
      })
      .catch((err) => {
        console.log(err);
      });
  }, []);

  const [errors, setErrors] = useState({});

  const handleCategoryChange = (e) => {
    const category = e.target.value;
    // Reset all fields when category changes
    setFormData({
      category: category,
      subCategory: "",
      from: "",
      to: "",
      pnrNo: "",
      location: "",
      empName: "",
      billNo: "",
      amount: "",
      remark: "",
    });
    setErrors({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.category) {
      newErrors.category = "Please select a category";
    }

    switch (formData.category) {
      case "travels":
        if (!formData.from) newErrors.from = "From location is required";
        if (!formData.to) newErrors.to = "To location is required";
        if (!formData.amount) newErrors.amount = "Amount is required";
        break;
      case "rent":
        if (!formData.location) newErrors.location = "Location is required";
        if (!formData.amount) newErrors.amount = "Amount is required";
        break;
      case "emp":
        if (!formData.empName) newErrors.empName = "Employee name is required";
        if (!formData.subCategory)
          newErrors.subCategory = "Please select sub category";
        if (!formData.amount) newErrors.amount = "Amount is required";
        break;
      case "bill":
        if (!formData.billNo) newErrors.billNo = "Bill number is required";
        if (!formData.amount) newErrors.amount = "Amount is required";
        if (!formData.subCategory)
          newErrors.subCategory = "Please select sub category";
        break;
      case "others":
        if (!formData.amount) newErrors.amount = "Amount is required";
        if (!formData.remark) newErrors.remark = "Remarks are required";
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (validateForm()) {
      console.log("Form Data:", formData);
      // alert("submitted successfully!");

      expensesAPI
        .create(formData)
        .then((res) => {
          console.log(res);
          toast("created expenses successfully");
        })
        .catch((err) => {
          console.log(err);
        });

      // Reset form
      setFormData({
        category: "",
        subCategory: "",
        from: "",
        to: "",
        pnrNo: "",
        location: "",
        empName: "",
        billNo: "",
        amount: "",
        remark: "",
      });
    }
  };

  const renderDynamicFields = () => {
    switch (formData.category) {
      case "travels":
        return (
          <div className="mt-6 p-6 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-800 mb-4">
              Travel Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  From <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="from"
                  value={formData.from}
                  onChange={handleInputChange}
                  placeholder="Departure location"
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.from ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.from && (
                  <p className="mt-1 text-sm text-red-600">{errors.from}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  To <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="to"
                  value={formData.to}
                  onChange={handleInputChange}
                  placeholder="Destination location"
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.to ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.to && (
                  <p className="mt-1 text-sm text-red-600">{errors.to}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  PNR Number
                </label>
                <input
                  type="text"
                  name="pnrNo"
                  value={formData.pnrNo}
                  onChange={handleInputChange}
                  placeholder="Enter PNR number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  placeholder="Enter amount"
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.amount ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.amount && (
                  <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Remarks
              </label>
              <textarea
                name="remark"
                value={formData.remark}
                onChange={handleInputChange}
                placeholder="Additional remarks"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
              />
            </div>
          </div>
        );

      case "rent":
        return (
          <div className="mt-6 p-6 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="text-lg font-semibold text-green-800 mb-4">
              Rent Details
            </h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="Property location"
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  errors.location ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.location && (
                <p className="mt-1 text-sm text-red-600">{errors.location}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  placeholder="Rent amount"
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    errors.amount ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.amount && (
                  <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Remarks
              </label>
              <textarea
                name="remark"
                value={formData.remark}
                onChange={handleInputChange}
                placeholder="Rent remarks"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                rows="3"
              />
            </div>
          </div>
        );

      case "emp":
        return (
          <div className="mt-6 p-6 bg-purple-50 border border-purple-200 rounded-lg">
            <h3 className="text-lg font-semibold text-purple-800 mb-4">
              Employee Details
            </h3>

            {/* Employee Name Dropdown */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Employee Name <span className="text-red-500">*</span>
              </label>
              <select
                name="empName"
                value={formData.empName}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  errors.empName ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="">Select Employee</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name}
                  </option>
                ))}
              </select>
              {errors.empName && (
                <p className="mt-1 text-sm text-red-600">{errors.empName}</p>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sub Category <span className="text-red-500">*</span>
              </label>
              <select
                name="subCategory"
                value={formData.subCategory}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  errors.subCategory ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="">Select Type</option>
                <option value="advance">Advance</option>
                <option value="salary">Salary</option>
                <option value="others">Others</option>
              </select>
              {errors.subCategory && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.subCategory}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  placeholder="Enter amount"
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    errors.amount ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.amount && (
                  <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Remarks
              </label>
              <textarea
                name="remark"
                value={formData.remark}
                onChange={handleInputChange}
                placeholder="Employee payment remarks"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                rows="3"
              />
            </div>
          </div>
        );

      case "bill":
        return (
          <div className="mt-6 p-6 bg-orange-50 border border-orange-200 rounded-lg">
            <h3 className="text-lg font-semibold text-orange-800 mb-4">
              Bill Details
            </h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bill Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="billNo"
                value={formData.billNo}
                onChange={handleInputChange}
                placeholder="Enter bill number"
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                  errors.billNo ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.billNo && (
                <p className="mt-1 text-sm text-red-600">{errors.billNo}</p>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sub Category <span className="text-red-500">*</span>
              </label>
              <select
                name="subCategory"
                value={formData.subCategory}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  errors.subCategory ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="">Select Type</option>
                <option value="light">Electricity</option>
                <option value="water">water</option>
                <option value="others">Others</option>
              </select>
              {errors.subCategory && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.subCategory}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  placeholder="Bill amount"
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    errors.amount ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.amount && (
                  <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Remarks
              </label>
              <textarea
                name="remark"
                value={formData.remark}
                onChange={handleInputChange}
                placeholder="Bill remarks"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                rows="3"
              />
            </div>
          </div>
        );

      case "others":
        return (
          <div className="mt-6 p-6 bg-gray-50 border border-gray-200 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Other Expenses
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  placeholder="Enter amount"
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-500 ${
                    errors.amount ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.amount && (
                  <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Remarks <span className="text-red-500">*</span>
              </label>
              <textarea
                name="remark"
                value={formData.remark}
                onChange={handleInputChange}
                placeholder="Describe the expenses"
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-500 ${
                  errors.remark ? "border-red-500" : "border-gray-300"
                }`}
                rows="3"
                required
              />
              {errors.remark && (
                <p className="mt-1 text-sm text-red-600">{errors.remark}</p>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            Expenses Form
          </h2>

          <form onSubmit={handleSubmit}>
            {/* Main Category Dropdown */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleCategoryChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.category ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="">Select Category</option>
                <option value="travels">Travels</option>
                <option value="rent">Rent</option>
                <option value="bill">Bill</option>
                <option value="emp">Employee</option>
                <option value="others">Others</option>
              </select>
              {errors.category && (
                <p className="mt-1 text-sm text-red-600">{errors.category}</p>
              )}
            </div>

            {/* Dynamic Fields Based on Category */}
            {renderDynamicFields()}

            <div className="mt-8">
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200 font-medium"
              >
                Submit Expense
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Dropdowns;
