import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAllClustersProduct,
  createClusterProduct,
} from "../../features/ClusterProducts/ClusterProducts";
import { toast } from "react-toastify";

const ClusterProducts = () => {
  const { list } = useSelector((state) => state?.secondClusterProducts);
  const dispatch = useDispatch();

  const [formData, setFormData] = useState({
    name: "",
    hsn: "",
  });

  const handleSubmitClusterProduct = (e) => {
    e.preventDefault();
    dispatch(createClusterProduct(formData))
      .then(() => {
        toast.success("Cluster Product Created Successfully");
        setFormData({
          name: "",
          hsn: "",
        });
      })
      .catch(() => toast.error("Error While Creating Product"));
  };

  useEffect(() => {
    dispatch(fetchAllClustersProduct());
  }, [dispatch]);

  const handleFillInput = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Form Card */}
      <div className="bg-white shadow-lg rounded-xl p-6 mb-8 border">
        <h2 className="text-xl font-semibold mb-6">Create Cluster Product</h2>

        <form
          onSubmit={handleSubmitClusterProduct}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <div className="flex flex-col">
            <label className="mb-1 font-medium">Product Name</label>
            <input
              type="text"
              name="name"
              value={formData?.name}
              onChange={handleFillInput}
              className="border rounded-lg p-2 focus:ring w-full"
              required
            />
          </div>

          <div className="flex flex-col">
            <label className="mb-1 font-medium">HSN Number</label>
            <input
              type="text"
              name="hsn"
              value={formData?.hsn}
              onChange={handleFillInput}
              className="border rounded-lg p-2 focus:ring w-full"
              required
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 w-full md:w-auto"
            >
              Create Product
            </button>
          </div>
        </form>
      </div>

      {/* Table */}
      <div className="bg-white shadow-lg rounded-xl p-6 border overflow-x-auto">
        <h2 className="text-xl font-semibold mb-4">Cluster Products List</h2>

        <table className="w-full table-auto border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-4 py-2 text-left">Product Name</th>
              <th className="border px-4 py-2 text-left">HSN Number</th>
              <th className="border px-4 py-2 text-center">Action</th>
            </tr>
          </thead>

          <tbody>
            {list?.map((item) => (
              <tr key={item?.id} className="hover:bg-gray-50">
                <td className="border px-4 py-2">{item?.name}</td>
                <td className="border px-4 py-2">{item?.hsn_number}</td>

                <td className="border px-4 py-2 text-center space-x-3">
                  <button className="text-blue-600 hover:text-blue-800 text-lg">
                    ✏️
                  </button>
                  <button className="text-red-600 hover:text-red-800 text-lg">
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ClusterProducts;
