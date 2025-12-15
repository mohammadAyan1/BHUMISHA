import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAllClustersProduct } from "../features/ClusterProducts/ClusterProducts";
import { fetchClusters } from "../features/clusterAdded/ClusterAdded";
import {
  addClusterInventory,
  fetchClustersInventory,
} from "../features/ClusterInventory/ClusterInventory";

const ClusterInventory = () => {
  const dispatch = useDispatch();
  const [cluster, setCluster] = useState([]);

  const [formData, setFormData] = useState({
    productId: "",
    clusterId: "",
    qty: "",
    purchase: "",
    sale: "",
    date: Date.now(),
    unit: "",
    hsn: "",
  });

  const { list } = useSelector((state) => state.secondClusterProducts);
  const { clusterInventory } = useSelector((state) => state.clusterInventory);

  useEffect(() => {
    dispatch(fetchAllClustersProduct());
    dispatch(fetchClusters())
      .then((res) => setCluster(res?.payload))
      .catch(console.log);
    dispatch(fetchClustersInventory());
  }, [dispatch]);

  // Handle Input Changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "productId") {
      const product = list?.find((p) => p.id == value);
      console.log(product);

      setFormData((prev) => ({
        ...prev,
        productId: value,
        hsn: product?.hsn_number,
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Convert quantity to grams before sending
  const convertToGrams = (qty, unit) => {
    if (!qty) return 0;
    switch (unit) {
      case "kg":
        return qty * 1000;
      case "ton":
        return qty * 1000000;
      case "quintal":
        return qty * 100000;
      case "gram":
        return qty;
      default:
        return qty;
    }
  };

  // Convert grams to kg for display
  // const convertToKg = (qtyInGram) => {
  //   if (!qtyInGram) return 0;
  //   return (qtyInGram / 1000).toFixed(2);
  // };

  const handleSubmitData = (e) => {
    e.preventDefault();

    // Convert quantity to grams
    const qtyInGram = convertToGrams(formData.qty, formData.unit);

    dispatch(
      addClusterInventory({
        ...formData,
        qty: qtyInGram, // always save in grams
      })
    );

    // Reset form
    setFormData({
      productId: "",
      clusterId: "",
      qty: "",
      purchase: "",
      sale: "",
      date: "",
      unit: "",
      hsn: "",
    });
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* Form Card */}
      <div className="max-w-4xl mx-auto bg-white shadow-md rounded-lg p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">
          Add Cluster Inventory
        </h2>
        <form
          onSubmit={handleSubmitData}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {/* Product Dropdown */}
          <div className="flex flex-col">
            <label className="mb-2 font-medium text-gray-700">Product</label>
            <select
              name="productId"
              value={formData.productId}
              onChange={handleInputChange}
              required
              className="border rounded-lg p-2 focus:ring-2 focus:ring-blue-400"
            >
              <option value="">Select Product</option>
              {list?.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          {/* Cluster Dropdown */}
          <div className="flex flex-col">
            <label className="mb-2 font-medium text-gray-700">Cluster</label>
            <select
              name="clusterId"
              value={formData.clusterId}
              onChange={handleInputChange}
              required
              className="border rounded-lg p-2 focus:ring-2 focus:ring-blue-400"
            >
              <option value="">Select Cluster</option>
              {cluster?.map((cl) => (
                <option key={cl.id} value={cl.id}>
                  {cl.cluster_location}
                </option>
              ))}
            </select>
          </div>

          {/* Purchase Rate Editable */}
          <div className="flex flex-col">
            <label className="mb-2 font-medium text-gray-700">
              Purchase Rate
            </label>
            <input
              type="number"
              name="purchase"
              value={formData.purchase}
              onChange={handleInputChange} // now editable
              required
              className="border rounded-lg p-2"
              placeholder="Enter purchase rate"
            />
          </div>

          <div className="flex flex-col">
            <label className="mb-2 font-medium text-gray-700">HSN Number</label>
            <input
              type="text"
              value={formData.hsn}
              readOnly
              className="border rounded-lg p-2"
              placeholder="Enter HSN Number"
            />
          </div>

          {/* Sale Rate Editable */}
          <div className="flex flex-col">
            <label className="mb-2 font-medium text-gray-700">Sale Rate</label>
            <input
              type="number"
              name="sale"
              value={formData.sale}
              onChange={handleInputChange} // now editable
              required
              className="border rounded-lg p-2"
              placeholder="Enter sale rate"
            />
          </div>

          {/* Quantity */}
          <div className="flex flex-col">
            <label className="mb-2 font-medium text-gray-700">Quantity</label>
            <input
              type="number"
              name="qty"
              value={formData.qty}
              onChange={handleInputChange}
              required
              className="border rounded-lg p-2"
            />
          </div>

          {/* Date */}
          {/* <div className="flex flex-col">
            <label className="mb-2 font-medium text-gray-700">Date</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              required
              className="border rounded-lg p-2"
            />
          </div> */}

          {/* Unit */}
          <div className="flex flex-col">
            <label className="mb-2 font-medium text-gray-700">Unit</label>
            <select
              name="unit"
              value={formData.unit}
              onChange={handleInputChange}
              required
              className="border rounded-lg p-2 focus:ring-2 focus:ring-blue-400"
            >
              <option value="">Select Unit</option>
              <option value="kg">Kilogram (kg)</option>
              <option value="ton">Ton</option>
              <option value="quintal">Quintal</option>
              <option value="gram">Gram (g)</option>
            </select>
          </div>

          {/* Submit Button */}
          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Submit
            </button>
          </div>
        </form>
      </div>

      {/* Inventory Table */}
      <div className="max-w-6xl mx-auto bg-white shadow-md rounded-lg p-6 overflow-x-auto">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">
          Cluster Inventory List
        </h2>
        <table className="min-w-full border border-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-2 px-4 border-b text-left">Product</th>
              <th className="py-2 px-4 border-b text-left">Cluster Manager</th>
              <th className="py-2 px-4 border-b text-left">Purchase Rate</th>
              <th className="py-2 px-4 border-b text-left">Sale Rate</th>
              <th className="py-2 px-4 border-b text-left">Quantity (kg)</th>
              {/* <th className="py-2 px-4 border-b text-left">Unit</th> */}
              <th className="py-2 px-4 border-b text-left">Date</th>
            </tr>
          </thead>
          <tbody>
            {clusterInventory?.map((item) => {
              return (
                <tr key={item?.id} className="hover:bg-gray-50">
                  <td className="py-2 px-4 border-b">{item?.product_name}</td>
                  <td className="py-2 px-4 border-b">
                    {item?.cluster_manager}
                  </td>
                  <td className="py-2 px-4 border-b">{item?.purchase_rate}</td>
                  <td className="py-2 px-4 border-b">{item?.sale_rate}</td>
                  <td className="py-2 px-4 border-b">
                    {(item?.qty / 1000).toFixed(2)}
                  </td>
                  {/* <td className="py-2 px-4 border-b">{item?.unit}</td> */}
                  <td className="py-2 px-4 border-b">{item?.entry_date}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ClusterInventory;
