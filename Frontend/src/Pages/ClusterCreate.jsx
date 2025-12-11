import React, { useEffect, useState } from "react";
import companyAPI from "../axios/companyAPI";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchClusters,
  addCluster,
} from "../features/clusterAdded/ClusterAdded";

const ClusterCreate = () => {
  const [formData, setFormData] = useState({
    companyId: "",
    companyCode: "",
    location: "",
    state: "",
    village: "",
    manager: "",
  });

  const dispatch = useDispatch();
  const { clusters } = useSelector((state) => state.clusters);

  const [rows, setRows] = useState([]);
  const [companies, setCompanies] = useState([]);

  // Load companies
  const fetchAllCompany = async () => {
    try {
      const response = await companyAPI.getAll();
      if (response.status === 200) {
        setCompanies(response.data);
      }
    } catch (error) {
      console.error("Error fetching companies:", error);
    }
  };

  useEffect(() => {
    fetchAllCompany();
    dispatch(fetchClusters());
  }, []);

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "companyId") {
      const selected = companies.find((c) => c.id == value);
      setFormData({
        ...formData,
        companyId: value,
        companyCode: selected?.code || "",
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  // Add Row
  const addRow = () => {
    const { companyId, companyCode, location, manager, village, state } =
      formData;

    if (!companyId || !location || !manager) {
      alert("Please fill all fields.");
      return;
    }

    setRows([
      ...rows,
      {
        id: Date.now(),
        companyId,
        companyCode,
        location,
        manager,
        village,
        state,
      },
    ]);

    setFormData({
      companyId: "",
      companyCode: "",
      location: "",
      manager: "",
      village: "",
      state: "",
    });
  };

  // Remove row
  const removeRow = (id) => {
    setRows(rows.filter((r) => r.id !== id));
  };

  // Submit
  const handleSubmit = () => {
    rows.forEach((row) => {
      dispatch(
        addCluster({
          companyId: row.companyId,
          location: row.location,
          manager: row.manager,
          state: row.state,
          village: row.village,
        })
      );
    });

    alert("Clusters submitted!");
    setRows([]);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Title */}
      <h1 className="text-2xl font-bold mb-6">Cluster Management</h1>

      {/* FORM CARD */}
      <div className="bg-white shadow-lg p-6 rounded-xl">
        {/* Company Select */}
        <div className="mb-4">
          <label className="block font-semibold mb-1">
            Company (Warehouse)
          </label>
          <select
            name="companyId"
            value={formData.companyId}
            onChange={handleInputChange}
            className="w-full border p-2 rounded-lg"
          >
            <option value="">Select Company</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.code})
              </option>
            ))}
          </select>
        </div>

        {/* Location */}
        <div className="mb-4">
          <label className="block font-semibold mb-1">Address</label>
          <input
            type="text"
            placeholder="Address"
            name="location"
            value={formData.location}
            onChange={handleInputChange}
            className="w-full border p-2 rounded-lg"
          />
        </div>

        <div className="mb-4">
          <label className="block font-semibold mb-1">State</label>
          <input
            type="text"
            placeholder="State"
            name="state"
            value={formData.state}
            onChange={handleInputChange}
            className="w-full border p-2 rounded-lg"
          />
        </div>

        <div className="mb-4">
          <label className="block font-semibold mb-1">Village/City</label>
          <input
            type="text"
            placeholder="Village/City"
            name="village"
            value={formData.village}
            onChange={handleInputChange}
            className="w-full border p-2 rounded-lg"
          />
        </div>

        {/* Manager */}
        <div className="mb-4">
          <label className="block font-semibold mb-1">Cluster Manager</label>
          <input
            type="text"
            placeholder="Cluster Manager"
            name="manager"
            value={formData.manager}
            onChange={handleInputChange}
            className="w-full border p-2 rounded-lg"
          />
        </div>

        {/* Add Button */}
        <button
          onClick={addRow}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          ➕ Add Cluster Row
        </button>
      </div>

      {/* Added Rows Section */}
      {rows.length > 0 && (
        <div className="mt-6 bg-white shadow-md p-4 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Rows to be Added</h2>

          {rows.map((r) => (
            <div
              key={r.id}
              className="border p-4 rounded-lg mb-2 flex justify-between items-center"
            >
              <div>
                <p>
                  <strong>Company:</strong> {r.companyCode}
                </p>
                <p>
                  <strong>Location:</strong> {r.location}
                </p>
                <p>
                  <strong>Manager:</strong> {r.manager}
                </p>
              </div>

              <button
                onClick={() => removeRow(r.id)}
                className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700"
              >
                ❌ Remove
              </button>
            </div>
          ))}

          {/* Submit button */}
          <button
            onClick={handleSubmit}
            className="bg-green-600 text-white px-5 py-3 rounded-lg mt-4 hover:bg-green-700"
          >
            ✅ Submit All Clusters
          </button>
        </div>
      )}

      {/* DATATABLE */}
      <div className="mt-10">
        <h2 className="text-2xl font-bold mb-4">All Clusters</h2>

        <div className="overflow-x-auto shadow-lg rounded-xl">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-200">
              <tr>
                <th className="p-3 border">ID</th>
                <th className="p-3 border">Company Code</th>
                <th className="p-3 border">Company Name</th>
                <th className="p-3 border">Location</th>
                <th className="p-3 border">Manager</th>
                <th className="p-3 border">Contact No</th>
                <th className="p-3 border">Address</th>
              </tr>
            </thead>

            <tbody>
              {clusters.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="p-3 border">{c.id}</td>
                  <td className="p-3 border">{c.company_code}</td>
                  <td className="p-3 border">{c.company_name}</td>
                  <td className="p-3 border">{c.cluster_location}</td>
                  <td className="p-3 border">{c.cluster_manager}</td>
                  <td className="p-3 border">{c.company_contact_no}</td>
                  <td className="p-3 border">{c.company_address}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ClusterCreate;
