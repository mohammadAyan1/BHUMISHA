import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchFarmers } from "../features/farmers/farmerSlice";
import { addFarm, fetchFarms } from "../features/Farm/FarmSlice";

const FarmDetailsPage = () => {
  const [farmForm, setFarmForm] = useState({
    farmerId: "",
    location: "",
    state: "",
    village: "",
    size: "",
    type: "",
    district: "",
  });

  const dispatch = useDispatch();
  const { farms } = useSelector((state) => state.farms);

  const { list } = useSelector((state) => state.farmers);

  useEffect(() => {
    dispatch(fetchFarmers());
    dispatch(fetchFarms());
  }, [dispatch]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFarmForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitData = (e) => {
    e.preventDefault();
    dispatch(addFarm(farmForm));
    // .then(() => {
    // dispatch(fetchFarms());
    setFarmForm({
      farmerId: "",
      location: "",
      size: "",
      type: "",
      state: "",
      village: "",
      district: "",
    });
    // });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Page Title */}
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        Farm Details Management
      </h2>

      {/* Form Section */}
      <div className="bg-white shadow-lg rounded-xl p-6 mb-10">
        <h3 className="text-xl font-semibold mb-4 text-gray-700">
          Add New Farm
        </h3>

        <form
          onSubmit={handleSubmitData}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {/* Farmer Select */}
          <div className="flex flex-col">
            <label className="font-medium mb-1">Select Farmer</label>
            <select
              name="farmerId"
              value={farmForm.farmerId}
              onChange={handleInputChange}
              className="border p-3 rounded-lg shadow-sm"
              required
            >
              <option value="">-- Select Farmer --</option>
              {list &&
                list.map((farmer) => (
                  <option key={farmer.id} value={farmer.id}>
                    {farmer.name}
                  </option>
                ))}
            </select>
          </div>

          {/* Location */}
          <div className="flex flex-col">
            <label className="font-medium mb-1">Address</label>
            <input
              type="text"
              name="location"
              value={farmForm.location}
              onChange={handleInputChange}
              className="border p-3 rounded-lg shadow-sm"
              placeholder="Enter Address"
              required
            />
          </div>

          <div className="flex flex-col">
            <label className="font-medium mb-1">State</label>
            <input
              type="text"
              name="state"
              value={farmForm.state}
              onChange={handleInputChange}
              className="border p-3 rounded-lg shadow-sm"
              placeholder="Enter state"
              required
            />
          </div>

          <div className="flex flex-col">
            <label className="font-medium mb-1">District</label>
            <input
              type="text"
              name="district"
              value={farmForm.district}
              onChange={handleInputChange}
              className="border p-3 rounded-lg shadow-sm"
              placeholder="Enter district"
              required
            />
          </div>

          <div className="flex flex-col">
            <label className="font-medium mb-1">City/Village</label>
            <input
              type="text"
              name="village"
              value={farmForm.village}
              onChange={handleInputChange}
              className="border p-3 rounded-lg shadow-sm"
              placeholder="Enter City/Village"
              required
            />
          </div>

          {/* Size */}
          <div className="flex flex-col">
            <label className="font-medium mb-1">Farm Size</label>
            <input
              type="number"
              name="size"
              value={farmForm.size}
              onChange={handleInputChange}
              className="border p-3 rounded-lg shadow-sm"
              placeholder="Enter size (e.g., 4 Acre)"
              required
            />
          </div>

          {/* Type */}
          <div className="flex flex-col">
            <label className="font-medium mb-1">Farm Type</label>
            <input
              type="text"
              name="type"
              value={farmForm.type}
              onChange={handleInputChange}
              className="border p-3 rounded-lg shadow-sm"
              placeholder="e.g., Irrigated, Non-Irrigated"
              required
            />
          </div>

          {/* Submit Button */}
          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow-md transition"
            >
              Save Farm Details
            </button>
          </div>
        </form>
      </div>

      {/* Data Table Section */}
      <div className="bg-white shadow-lg rounded-xl p-6 overflow-x-auto">
        <h3 className="text-xl font-semibold mb-4 text-gray-700">Farm List</h3>

        <table className="min-w-full border border-gray-300 rounded-lg overflow-hidden">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 border text-left">#</th>
              <th className="p-3 border text-left">Farmer Name</th>
              <th className="p-3 border text-left">Father Name</th>
              <th className="p-3 border text-left">Contact</th>
              <th className="p-3 border text-left">Location</th>
              <th className="p-3 border text-left">Size</th>
              <th className="p-3 border text-left">Type</th>
              <th className="p-3 border text-left">City/Village</th>
              <th className="p-3 border text-left">District</th>
            </tr>
          </thead>

          <tbody>
            {farms?.data && farms.data.length > 0 ? (
              farms.data.map((item, index) => (
                <tr key={item.farm_id} className="hover:bg-gray-50">
                  <td className="p-3 border">{index + 1}</td>
                  <td className="p-3 border">{item.name}</td>
                  <td className="p-3 border">{item.father_name}</td>
                  <td className="p-3 border">{item.contact_number}</td>
                  <td className="p-3 border">{item.location}</td>
                  <td className="p-3 border">{item.size}</td>
                  <td className="p-3 border">{item.farm_type}</td>
                  <td className="p-3 border">{item.village}</td>
                  <td className="p-3 border">{item.farm_district}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={9}
                  className="text-center p-4 text-gray-500 border"
                >
                  No farm records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FarmDetailsPage;
