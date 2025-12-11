import React, { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchFarmers,
  deleteFarmer,
  updateFarmerStatus,
} from "../../features/farmers/farmerSlice";
import DataTable from "../DataTable/DataTable";
import { IconButton } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";

import {
  Building2,
  FileText,
  MapPin,
  Phone,
  CreditCard,
  Landmark,
  FileSignature,
} from "lucide-react";
import farmersAPI from "../../axios/farmerAPI"; // Assuming this exists
import { toast } from "react-toastify";

export default function FarmerList({ onEdit }) {
  const dispatch = useDispatch();
  const { list: farmers, loading } = useSelector((state) => state.farmers);
  const [bankDetailsFarmer, setBankDetailsFarmer] = useState(null);

  // Statement modal state
  const [showStatement, setShowStatement] = useState(false);
  const [statementRows, setStatementRows] = useState([]);
  const [statementTotals, setStatementTotals] = useState(null);
  const [statementLoading, setStatementLoading] = useState(false);
  const [activeFarmer, setActiveFarmer] = useState(null);
  const [stFrom, setStFrom] = useState(() => {
    const d = new Date(Date.now() - 30 * 24 * 3600 * 1000);
    return d.toISOString().slice(0, 10);
  });
  const [stTo, setStTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [stPage, setStPage] = useState(1);
  const [stLimit, setStLimit] = useState(50);
  const [stSort, setStSort] = useState("asc");

  useEffect(() => {
    dispatch(fetchFarmers());
  }, [dispatch]);

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this farmer?")) {
      dispatch(deleteFarmer(id));
    }
  };

  const handleStatusToggle = async (id, currentStatus) => {
    const normalizedCurrentStatus = (currentStatus || "")
      .toString()
      .toLowerCase();
    const newStatus =
      normalizedCurrentStatus === "active" ? "inactive" : "active";
    await dispatch(updateFarmerStatus({ id, status: newStatus }));
    // Refresh farmers list to get updated data from backend
    dispatch(fetchFarmers());
  };

  // Open statement modal
  const openStatement = useCallback(
    async (farmer) => {
      setActiveFarmer(farmer);
      setShowStatement(true);
      setStatementLoading(true);
      try {
        const res = await farmersAPI.getStatement(farmer.id, {
          from: stFrom,
          to: stTo,
          page: stPage,
          limit: stLimit,
          sort: stSort,
        });
        setStatementRows(res.data.rows || []);
        setStatementTotals(res.data.totals || null);
      } catch (err) {
        toast.error("Failed to load statement");
        console.error(err);
      } finally {
        setStatementLoading(false);
      }
    },
    [stFrom, stTo, stPage, stLimit, stSort]
  );

  // Close statement modal
  const closeStatement = useCallback(() => {
    setShowStatement(false);
    setStatementRows([]);
    setStatementTotals(null);
    setActiveFarmer(null);
  }, []);

  const columns = [
    {
      field: "sl_no",
      headerName: "S.No.",
      width: 80,
      backgroundColore: "gray",
      sortable: false,
      renderCell: (params) => {
        const rowIndex = farmers.findIndex(
          (farmer) => farmer.id === params.row.id
        );
        return rowIndex + 1;
      },
    },
    {
      field: "name",
      headerName: "Name",
      flex: 1,
      renderCell: (params) => (
        <button
          type="button"
          onClick={() => openStatement(params.row)}
          className="text-blue-600 underline hover:text-blue-800"
          title="View transactions"
        >
          {params.value}
        </button>
      ),
    },
    { field: "father_name", headerName: "Father Name", flex: 1 },
    { field: "district", headerName: "District", flex: 1 },
    { field: "tehsil", headerName: "Tehsil", flex: 1 },
    { field: "patwari_halka", headerName: "Patwari Halka", flex: 1 },
    { field: "village", headerName: "Village", flex: 1 },
    { field: "contact_number", headerName: "Contact", flex: 1 },
    { field: "khasara_number", headerName: "Khasara No.", flex: 1 },
    // { field: "bank", headerName: "Bank", flex: 1 },

    {
      field: "balance",
      headerName: "Balance",
      width: 140,
      // Balance column renderCell
      renderCell: (params) => {
        const bal = Number(params.row.balance ?? 0);
        const min = Number(params.row.min_balance ?? 5000);
        const high = bal > min; // change here
        return (
          <span
            className={high ? "text-red-600 font-semibold" : "text-gray-800"}
          >
            {bal.toFixed(2)}
          </span>
        );
      },
    },

    // min_balance column removed from list; kept in input/form only
    {
      field: "status",
      headerName: "Status",
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <div
          onClick={() => handleStatusToggle(params.row.id, params.value)}
          className={`relative inline-flex items-center h-6 rounded-full w-11 cursor-pointer transition-all duration-300 shadow-md ${
            (params.value || "").toString().toLowerCase() === "active"
              ? "bg-green-500"
              : "bg-gray-300"
          }`}
          title={`Click to ${
            (params.value || "").toString().toLowerCase() === "active"
              ? "deactivate"
              : "activate"
          }`}
        >
          {/* White circle slider */}
          <span
            className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-300 shadow-lg border border-gray-200 ${
              (params.value || "").toString().toLowerCase() === "active"
                ? "translate-x-6"
                : "translate-x-1"
            }`}
          />
        </div>
      ),
    },

    {
      field: "actions",
      headerName: "Actions",
      sortable: false,
      width: 120,
      renderCell: (params) => (
        <div className="flex gap-2">
          <IconButton color="primary" onClick={() => onEdit(params.row)}>
            <EditIcon />
          </IconButton>
          <IconButton color="error" onClick={() => handleDelete(params.row.id)}>
            <DeleteIcon />
          </IconButton>
        </div>
      ),
    },
  ];

  if (loading) return <p>Loading farmers...</p>;

  return (
    <div>
      <DataTable rows={farmers} columns={columns} loading={loading} />

      {/* Statement Modal */}
      {showStatement && activeFarmer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 min-w-[800px] max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                Statement - {activeFarmer.name}
              </h2>

              <button
                onClick={closeStatement}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Filters */}
            <div className="flex gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  From Date
                </label>
                <input
                  type="date"
                  value={stFrom}
                  onChange={(e) => setStFrom(e.target.value)}
                  className="border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  To Date
                </label>
                <input
                  type="date"
                  value={stTo}
                  onChange={(e) => setStTo(e.target.value)}
                  className="border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Limit
                </label>
                <select
                  value={stLimit}
                  onChange={(e) => setStLimit(Number(e.target.value))}
                  className="border rounded px-3 py-2"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => openStatement(activeFarmer)}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Refresh
                </button>
              </div>
            </div>

            {/* Totals */}
            {statementTotals && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-600">Opening Balance</p>
                  <p className="text-xl font-bold text-blue-900">
                    ₹{Number(statementTotals.opening_balance || 0).toFixed(2)}
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-600">Total Invoiced</p>
                  <p className="text-xl font-bold text-green-900">
                    ₹{Number(statementTotals.total_invoiced || 0).toFixed(2)}
                  </p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-sm text-red-600">Total Paid</p>
                  <p className="text-xl font-bold text-red-900">
                    ₹{Number(statementTotals.total_paid || 0).toFixed(2)}
                  </p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-purple-600">Outstanding Balance</p>
                  <p className="text-xl font-bold text-purple-900">
                    ₹
                    {Number(statementTotals.outstanding_balance || 0).toFixed(
                      2
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* Transactions Table */}
            {statementLoading ? (
              <p>Loading transactions...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 border-b text-left">Date</th>
                      <th className="px-4 py-2 border-b text-left">Type</th>
                      <th className="px-4 py-2 border-b text-left">
                        Description
                      </th>
                      <th className="px-4 py-2 border-b text-right">Debit</th>
                      <th className="px-4 py-2 border-b text-right">Credit</th>
                      <th className="px-4 py-2 border-b text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statementRows.map((row, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-2 border-b">
                          {new Date(row.tx_datetime).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-2 border-b">{row.tx_type}</td>
                        <td className="px-4 py-2 border-b">{row.note}</td>
                        <td className="px-4 py-2 border-b text-right">
                          {row.tx_type === "Sale"
                            ? `₹${Number(row.amount || 0).toFixed(2)}`
                            : ""}
                        </td>
                        <td className="px-4 py-2 border-b text-right">
                          {row.tx_type === "Payment"
                            ? `₹${Number(row.amount || 0).toFixed(2)}`
                            : ""}
                        </td>
                        <td className="px-4 py-2 border-b text-right">
                          ₹{Number(row.running_balance || 0).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex justify-end pt-4 border-t border-gray-200">
              <button
                onClick={closeStatement}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bank Details Modal */}
      {bankDetailsFarmer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 min-w-[500px] max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <AccountBalanceIcon className="text-blue-600" />
                Bank Details - {bankDetailsFarmer.name}
              </h2>
              <button
                onClick={() => setBankDetailsFarmer(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {(() => {
              // Bank details are directly on the farmer object from backend JOIN query
              const bank = {
                pan_number: bankDetailsFarmer.pan_number || "",
                account_holder_name:
                  bankDetailsFarmer.account_holder_name || "",
                bank_name: bankDetailsFarmer.bank_name || "",
                account_number: bankDetailsFarmer.account_number || "",
                ifsc_code: bankDetailsFarmer.ifsc_code || "",
                branch_name: bankDetailsFarmer.branch_name || "",
              };

              return (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                      <div className="flex items-center gap-2 mb-2">
                        <FileSignature size={18} className="text-purple-600" />
                        <p className="text-sm font-semibold text-purple-800">
                          PAN Number
                        </p>
                      </div>
                      <p className="text-lg font-bold text-purple-900">
                        {bank.pan_number || "Not Available"}
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Building2 size={18} className="text-green-600" />
                        <p className="text-sm font-semibold text-green-800">
                          Account Holder
                        </p>
                      </div>
                      <p className="text-lg font-bold text-green-900">
                        {bank.account_holder_name || "Not Available"}
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Landmark size={18} className="text-blue-600" />
                        <p className="text-sm font-semibold text-blue-800">
                          Bank Name
                        </p>
                      </div>
                      <p className="text-lg font-bold text-blue-900">
                        {bank.bank_name || "Not Available"}
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
                      <div className="flex items-center gap-2 mb-2">
                        <CreditCard size={18} className="text-orange-600" />
                        <p className="text-sm font-semibold text-orange-800">
                          Account Number
                        </p>
                      </div>
                      <p className="text-lg font-bold text-orange-900">
                        {bank.account_number || "Not Available"}
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-4 border border-indigo-200">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText size={18} className="text-indigo-600" />
                        <p className="text-sm font-semibold text-indigo-800">
                          IFSC Code
                        </p>
                      </div>
                      <p className="text-lg font-bold text-indigo-900">
                        {bank.ifsc_code || "Not Available"}
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl p-4 border border-teal-200">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin size={18} className="text-teal-600" />
                        <p className="text-sm font-semibold text-teal-800">
                          Branch Name
                        </p>
                      </div>
                      <p className="text-lg font-bold text-teal-900">
                        {bank.branch_name || "Not Available"}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-gray-200">
                    <button
                      onClick={() => setBankDetailsFarmer(null)}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      Close
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
