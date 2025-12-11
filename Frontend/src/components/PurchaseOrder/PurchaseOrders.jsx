import React, { useState } from "react";
import PurchaseOrderForm from "./PurchaseOrderForm";
import PurchaseOrderList from "./PurchaseOrderList";
import { Link } from "react-router-dom";

export default function PurchaseOrders() {
  const [editingPO, setEditingPO] = useState(null);

  const handleEdit = (po) => setEditingPO(po);
  const handleFormSubmit = () => setEditingPO(null);

  return (
    <div className="min-h-screen bg-gray-100">
      <h2 className="text-2xl font-bold mb-4">Purchase Orders</h2>

      <div className="flex flex-row justify-around items-center mb-2">
        <Link
          className="bg-blue-600 p-2 rounded hover:bg-amber-700"
          to="/vendor"
          target="_blank"
          rel="noopener noreferrer"
        >
          Vendor
        </Link>
        <Link
          className="bg-blue-600 p-2 rounded hover:bg-amber-700"
          to="/farmer"
          target="_blank"
          rel="noopener noreferrer"
        >
          Farmer
        </Link>
        <Link
          className="bg-blue-600 p-2 rounded hover:bg-amber-700"
          to="/products"
          target="_blank"
          rel="noopener noreferrer"
        >
          Products
        </Link>
      </div>

      {/* Form */}
      <div className="mb-6 bg-white rounded shadow p-4">
        <PurchaseOrderForm
          purchaseOrder={editingPO}
          onSubmitted={handleFormSubmit}
        />
      </div>

      {/* List below */}
      <div className="bg-white rounded shadow p-4">
        <PurchaseOrderList onEdit={handleEdit} />
      </div>
    </div>
  );
}
