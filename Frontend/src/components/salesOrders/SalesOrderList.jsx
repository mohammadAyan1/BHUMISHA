// src/components/salesOrders/SalesOrderList.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { soApi, refApi } from "../../axios/soApi.js";
import Swal from "sweetalert2";

const fx = (n, d = 2) => (isNaN(n) ? (0).toFixed(d) : Number(n).toFixed(d));
const formatDate = (s) => (!s ? "-" : new Date(s).toISOString().split("T")[0]);
const formatTime = (s) => {
  if (!s) return "-";
  const d = new Date(s);
  if (isNaN(d)) return "-";
  let h = d.getHours(),
    m = String(d.getMinutes()).padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return `${String(h).padStart(2, "0")}:${m} ${ampm}`;
};

export default function SalesOrderList({ onEdit, refreshKey = 0 }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [products, setProducts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [show, setShow] = useState(false);
  const navigate = useNavigate();

  const productNameOf = useMemo(() => {
    const map = new Map();
    (products || []).forEach((p) =>
      map.set(String(p.id ?? p._id), p.product_name)
    );
    return (id) => map.get(String(id));
  }, [products]);

  const load = async () => {
    try {
      setLoading(true);
      const [l, p] = await Promise.all([soApi.list(), refApi.products()]);
      setRows(l.data || []);
      setProducts(p.data?.list || p.data || []);
      setErr("");
    } catch (e) {
      setErr(e?.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [refreshKey]);

  useEffect(() => {
    const onFocus = () => load();
    const onVis = () => {
      if (!document.hidden) load();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  const openModal = (po) => {
    setSelected(po);
    setShow(true);
  };
  const closeModal = () => {
    setShow(false);
    setSelected(null);
  };

  const onDelete = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      try {
        await soApi.remove(id);
        Swal.fire("Deleted!", "Sales Order has been deleted.", "success");
        load();
      } catch (error) {
        Swal.fire("Error!", "Failed to delete Sales Order.", "error");
      }
    }
  };

  if (loading)
    return <div className="p-6 bg-white shadow rounded">Loading...</div>;
  if (err)
    return (
      <div className="p-6 bg-white shadow rounded text-red-600">{err}</div>
    );

  return (
    <div className="bg-white shadow rounded">
      <div className="flex items-center border-b border-gray-200 justify-between mb-3">
        <h3 className="text-lg font-semibold">Sales Orders</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border border-gray-200 text-sm">
          <thead className="bg-gray-100">
            <tr className="">
              <th className="border p-2  text-left">SO No</th>
              <th className="border p-2  text-left">Customer</th>
              <th className="border p-2  text-left">Date</th>
              <th className="border p-2  text-left">Bill Time</th>
              <th className="border p-2  text-right">Taxable</th>
              <th className="border p-2  text-right">GST</th>
              <th className="border p-2  text-right">Grand</th>
              <th className="border p-2  text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td className="border p-4 text-center" colSpan={8}>
                  No Sales Orders
                </td>
              </tr>
            )}
            {rows.map((r) => {
              const id = r.id || r._id;
              return (
                <tr
                  key={id}
                  className="odd:bg-white even:bg-gray-50 text-center"
                >
                  <td className="border p-2">
                    <button
                      className="underline text-blue-600 cursor-pointer hover:text-blue-800 active:scale-95"
                      onClick={() => openModal(r)}
                    >
                      {r.so_no || "-"}
                    </button>
                  </td>
                  <td className="border p-2">
                    {r.party_name || r.customer_id || "-"}
                  </td>
                  <td className="border p-2">{formatDate(r.date)}</td>
                  <td className="border p-2">{formatTime(r.bill_time)}</td>
                  <td className="border p-2 text-right">
                    {fx(r?.summary?.total_taxable ?? 0)}
                  </td>
                  <td className="border p-2 text-right">
                    {fx(r?.summary?.total_gst ?? 0)}
                  </td>
                  <td className="border p-2 text-right font-semibold">
                    {fx(
                      (r?.summary?.grand_total ?? r.final_amount ?? 0) +
                        Number(r?.other_amount || 0)
                    )}
                  </td>
                  <td className="border p-2 space-x-2">
                    <button
                      className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 active:scale-95"
                      onClick={() => openModal(r)}
                    >
                      Items
                    </button>
                    <button
                      className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 active:scale-95"
                      onClick={() => onEdit && onEdit(r)}
                    >
                      Edit
                    </button>
                    <button
                      className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 active:scale-95"
                      onClick={() => onDelete(id)}
                    >
                      Delete
                    </button>
                    <button
                      className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 active:scale-95"
                      onClick={() =>
                        navigate(`/sales-order/invoice/${id}?auto=1`)
                      }
                      title="Invoice PDF"
                    >
                      Invoice
                    </button>
                    <button
                      className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 active:scale-95"
                      onClick={() => navigate(`/sales/create?so=${id}`)}
                      title="Create Sale from SO"
                    >
                      Create Sale
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {show && selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          role="dialog"
          aria-modal="true"
        >
          <div className="absolute inset-0 bg-black/40" onClick={closeModal} />
          <div className="relative z-10 w-[95vw] max-w-5xl max-h-[90vh] overflow-auto bg-white rounded-xl shadow-xl">
            <div className="flex items-center justify-between px-5 py-3 border-b">
              <h4 className="text-lg font-semibold">
                SO Details — {selected.so_no}
              </h4>
              <button
                className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 active:scale-95"
                onClick={closeModal}
              >
                Close
              </button>
            </div>

            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
              <div>
                <div className="text-gray-500">Customer</div>
                <div className="font-medium">
                  {selected.party_name || selected.customer_id || "-"}
                </div>
              </div>
              <div>
                <div className="text-gray-500">Date</div>
                <div className="font-medium">{formatDate(selected.date)}</div>
              </div>
              <div>
                <div className="text-gray-500">Bill Time</div>
                <div className="font-medium">
                  {formatTime(selected.bill_time)}
                </div>
              </div>
              <div className="sm:col-span-2">
                <div className="text-gray-500">Address</div>
                <div className="font-medium">{selected.address || "-"}</div>
              </div>
              <div>
                <div className="text-gray-500">Mobile</div>
                <div className="font-medium">{selected.mobile_no || "-"}</div>
              </div>
              <div>
                <div className="text-gray-500">GST</div>
                <div className="font-medium">{selected.gst_no || "-"}</div>
              </div>
              <div>
                <div className="text-gray-500">Place</div>
                <div className="font-medium">
                  {selected.place_of_supply || "-"}
                </div>
              </div>
              <div className="lg:col-span-3">
                <div className="text-gray-500">Terms</div>
                <div className="font-medium">
                  {selected.terms_condition || "-"}
                </div>
              </div>
            </div>

            <div className="px-5 pb-5">
              <div className="text-sm font-semibold mb-2">Items</div>
              <div className="overflow-auto">
                <table className="w-full border text-xs">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border p-1">#</th>
                      <th className="border p-1 text-left">Product</th>
                      <th className="border p-1 text-left">HSN</th>
                      <th className="border p-1 text-right">Qty</th>
                      <th className="border p-1 text-right">Rate</th>
                      <th className="border p-1 text-right">Amount</th>
                      <th className="border p-1 text-right">Disc%/Unit</th>
                      <th className="border p-1 text-right">Disc Amt</th>
                      <th className="border p-1 text-right">GST%</th>
                      <th className="border p-1 text-right">GST Amt</th>
                      <th className="border p-1 text-right">Final</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selected.items || []).map((it, idx) => {
                      const name =
                        it.product_name ||
                        it.item_name ||
                        productNameOf(it.product_id) ||
                        String(it.product_id);
                      return (
                        <tr
                          key={it.id || idx}
                          className="odd:bg-white even:bg-gray-50"
                        >
                          <td className="border p-1">{idx + 1}</td>
                          <td className="border p-1">{name}</td>
                          <td className="border p-1">{it.hsn_code || "-"}</td>
                          <td className="border p-1 text-right">
                            {fx(it.qty, 2)}
                          </td>
                          <td className="border p-1 text-right">
                            {fx(it.rate, 2)}
                          </td>
                          <td className="border p-1 text-right">
                            {fx(it.amount, 2)}
                          </td>
                          <td className="border p-1 text-right">
                            {fx(it.discount_per_qty ?? 0, 2)} (
                            {fx(it.discount_rate ?? 0, 2)})
                          </td>
                          <td className="border p-1 text-right">
                            {fx(it.discount_total ?? 0, 2)}
                          </td>
                          <td className="border p-1 text-right">
                            {fx(it.gst_percent ?? 0, 2)}
                          </td>
                          <td className="border p-1 text-right">
                            {fx(it.gst_amount ?? 0, 2)}
                          </td>
                          <td className="border p-1 text-right">
                            {fx(it.final_amount ?? it.total ?? 0, 2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex justify-end text-sm">
                <div>
                  <div>
                    Taxable:{" "}
                    <span className="font-medium">
                      {fx(selected?.summary?.total_taxable ?? 0, 2)}
                    </span>
                  </div>
                  <div>
                    GST:{" "}
                    <span className="font-medium">
                      {fx(selected?.summary?.total_gst ?? 0, 2)}
                    </span>
                  </div>
                  <div>
                    Other Amount:{" "}
                    <span className="font-medium">
                      {fx(selected?.other_amount ?? 0, 2)}
                    </span>
                  </div>
                  <div>Remark: {selected?.other_note || "—"}</div>
                  <div className="font-semibold text-base">
                    Grand Total:{" "}
                    {fx(
                      (selected?.summary?.grand_total ??
                        selected?.final_amount ??
                        0) + Number(selected?.other_amount || 0),
                      2
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// import React, { useEffect, useMemo, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { soApi, refApi } from "../../axios/soApi.js";
// import Swal from "sweetalert2";
// import html2canvas from "html2canvas";
// import jsPDF from "jspdf";

// const fx = (n, d = 2) => (isNaN(n) ? (0).toFixed(d) : Number(n).toFixed(d));
// const formatDate = (s) => (!s ? "-" : new Date(s).toISOString().split("T")[0]);
// const formatTime = (s) => {
//   if (!s) return "-";
//   const d = new Date(s);
//   if (isNaN(d)) return "-";
//   let h = d.getHours(),
//     m = String(d.getMinutes()).padStart(2, "0");
//   const ampm = h >= 12 ? "PM" : "AM";
//   h = h % 12;
//   if (h === 0) h = 12;
//   return `${String(h).padStart(2, "0")}:${m} ${ampm}`;
// };

// // Function to convert quantity to kg
// const convertToKg = (quantity, unit) => {
//   if (!quantity && quantity !== 0) return 0;

//   const unitConversions = {
//     kg: 1,
//     g: 0.001,
//     ton: 1000,
//     quintal: 100,
//     l: 1,
//     ml: 0.001,
//     pcs: 1,
//     bag: 50,
//     sack: 50,
//   };

//   const qty = Number(quantity);
//   const unitKey = (unit || "").toLowerCase().trim();
//   const conversionFactor = unitConversions[unitKey] || 1;

//   return qty * conversionFactor;
// };

// export default function SalesOrderList({ onEdit, refreshKey = 0 }) {
//   const [rows, setRows] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [err, setErr] = useState("");
//   const [products, setProducts] = useState([]);
//   const [selected, setSelected] = useState(null);
//   const [show, setShow] = useState(false);
//   const navigate = useNavigate();

//   const productNameOf = useMemo(() => {
//     const map = new Map();
//     (products || []).forEach((p) =>
//       map.set(String(p.id ?? p._id), p.product_name)
//     );
//     return (id) => map.get(String(id));
//   }, [products]);

//   const load = async () => {
//     try {
//       setLoading(true);
//       const [l, p] = await Promise.all([soApi.list(), refApi.products()]);
//       setRows(l.data || []);
//       setProducts(p.data?.list || p.data || []);
//       setErr("");
//     } catch (e) {
//       setErr(e?.response?.data?.error || e.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     load();
//   }, [refreshKey]);

//   const openModal = (so) => {
//     setSelected(so);
//     setShow(true);
//   };
//   const closeModal = () => {
//     setShow(false);
//     setSelected(null);
//   };

//   const onDelete = async (id) => {
//     const result = await Swal.fire({
//       title: "Are you sure?",
//       text: "You won't be able to revert this!",
//       icon: "warning",
//       showCancelButton: true,
//       confirmButtonColor: "#d33",
//       cancelButtonColor: "#3085d6",
//       confirmButtonText: "Yes, delete it!",
//     });

//     if (result.isConfirmed) {
//       try {
//         await soApi.remove(id);
//         Swal.fire("Deleted!", "Sales Order has been deleted.", "success");
//         load();
//       } catch (error) {
//         Swal.fire("Error!", "Failed to delete Sales Order.", "error");
//       }
//     }
//   };

//   // Function to download invoice as PDF
//   const downloadInvoice = async (so) => {
//     try {
//       Swal.fire({
//         title: "Generating Invoice...",
//         allowOutsideClick: false,
//         didOpen: () => {
//           Swal.showLoading();
//         },
//       });

//       // Navigate to invoice page
//       navigate(`/sales-order/invoice/${so.id || so._id}?download=1`);
//     } catch (error) {
//       console.error("Error downloading invoice:", error);
//       Swal.fire("Error", "Failed to generate invoice", "error");
//     }
//   };

//   // Function to print invoice
//   const printInvoice = (soId) => {
//     const printWindow = window.open(
//       `/sales-order/invoice/${soId}?print=1`,
//       "_blank"
//     );
//     if (printWindow) {
//       printWindow.onload = () => {
//         printWindow.print();
//       };
//     }
//   };

//   if (loading)
//     return (
//       <div className="flex justify-center items-center h-64">
//         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
//       </div>
//     );

//   if (err)
//     return (
//       <div className="p-6 bg-white shadow rounded-xl text-red-600">
//         Error: {err}
//       </div>
//     );

//   return (
//     <div className="bg-white shadow rounded-xl">
//       <div className="p-6 border-b">
//         <div className="flex flex-col md:flex-row md:items-center justify-between">
//           <div>
//             <h3 className="text-xl font-bold text-gray-800">Sales Orders</h3>
//             <p className="text-gray-600 mt-1">Manage all sales orders</p>
//           </div>
//           <div className="mt-4 md:mt-0">
//             <button
//               onClick={load}
//               className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
//             >
//               <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
//                 <path
//                   fillRule="evenodd"
//                   d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
//                   clipRule="evenodd"
//                 />
//               </svg>
//               Refresh
//             </button>
//           </div>
//         </div>
//       </div>

//       <div className="overflow-x-auto">
//         <table className="w-full border border-gray-200 text-sm">
//           <thead className="bg-gray-800 text-white">
//             <tr>
//               <th className="px-4 py-3 text-left">SO No</th>
//               <th className="px-4 py-3 text-left">Customer</th>
//               <th className="px-4 py-3 text-left">Date</th>
//               <th className="px-4 py-3 text-left">Buyer Type</th>
//               <th className="px-4 py-3 text-right">Taxable (₹)</th>
//               <th className="px-4 py-3 text-right">GST (₹)</th>
//               <th className="px-4 py-3 text-right">Grand (₹)</th>
//               <th className="px-4 py-3 text-left">Actions</th>
//             </tr>
//           </thead>
//           <tbody>
//             {rows.length === 0 && (
//               <tr>
//                 <td className="px-4 py-8 text-center text-gray-500" colSpan={8}>
//                   No Sales Orders found
//                 </td>
//               </tr>
//             )}
//             {rows.map((r) => {
//               const id = r.id || r._id;
//               const finalTotal =
//                 (r?.summary?.grand_total ?? r.final_amount ?? 0) +
//                 Number(r?.other_amount || 0);

//               return (
//                 <tr key={id} className="border-b hover:bg-gray-50">
//                   <td className="px-4 py-3">
//                     <button
//                       className="text-blue-600 hover:text-blue-800 font-medium"
//                       onClick={() => openModal(r)}
//                     >
//                       {r.so_no || "-"}
//                     </button>
//                   </td>
//                   <td className="px-4 py-3">
//                     <div className="font-medium">{r.party_name || "-"}</div>
//                     <div className="text-xs text-gray-500">{r.party_type}</div>
//                   </td>
//                   <td className="px-4 py-3">
//                     {formatDate(r.date)}
//                     <div className="text-xs text-gray-500">
//                       {formatTime(r.bill_time)}
//                     </div>
//                   </td>
//                   <td className="px-4 py-3">
//                     <span
//                       className={`px-2 py-1 rounded text-xs ${
//                         r.buyer_type === "Retailer"
//                           ? "bg-purple-100 text-purple-700"
//                           : "bg-blue-100 text-blue-700"
//                       }`}
//                     >
//                       {r.buyer_type || "N/A"}
//                     </span>
//                   </td>
//                   <td className="px-4 py-3 text-right font-medium">
//                     ₹{fx(r?.summary?.total_taxable ?? 0, 2)}
//                   </td>
//                   <td className="px-4 py-3 text-right">
//                     ₹{fx(r?.summary?.total_gst ?? 0, 2)}
//                   </td>
//                   <td className="px-4 py-3 text-right font-bold text-green-700">
//                     ₹{fx(finalTotal, 2)}
//                   </td>
//                   <td className="px-4 py-3">
//                     <div className="flex flex-wrap gap-2">
//                       <button
//                         className="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition text-xs"
//                         onClick={() => openModal(r)}
//                         title="View Details"
//                       >
//                         View
//                       </button>
//                       <button
//                         className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition text-xs"
//                         onClick={() => onEdit && onEdit(r)}
//                         title="Edit"
//                       >
//                         Edit
//                       </button>
//                       {/* <button
//                         className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition text-xs"
//                         onClick={() => downloadInvoice(r)}
//                         title="Download Invoice"
//                       >
//                         PDF
//                       </button> */}
//                       <button
//                         className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition text-xs"
//                         onClick={() => printInvoice(id)}
//                         title="Print Invoice"
//                       >
//                         Print
//                       </button>
//                       <button
//                         className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition text-xs"
//                         onClick={() => onDelete(id)}
//                         title="Delete"
//                       >
//                         Delete
//                       </button>
//                     </div>
//                   </td>
//                 </tr>
//               );
//             })}
//           </tbody>
//         </table>
//       </div>

//       {show && selected && (
//         <div
//           className="fixed inset-0 z-50 flex items-center justify-center p-4"
//           role="dialog"
//           aria-modal="true"
//         >
//           <div className="absolute inset-0 bg-black/40" onClick={closeModal} />
//           <div className="relative z-10 w-full max-w-6xl max-h-[90vh] overflow-auto bg-white rounded-xl shadow-xl">
//             <div className="flex items-center justify-between px-6 py-4 border-b">
//               <div>
//                 <h4 className="text-xl font-bold text-gray-800">
//                   Sales Order — {selected.so_no}
//                 </h4>
//                 <p className="text-sm text-gray-600 mt-1">
//                   Date: {formatDate(selected.date)} | Time:{" "}
//                   {formatTime(selected.bill_time)}
//                 </p>
//               </div>
//               <div className="flex items-center gap-3">
//                 <button
//                   className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
//                   onClick={() => downloadInvoice(selected)}
//                 >
//                   Download Invoice
//                 </button>
//                 <button
//                   className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
//                   onClick={closeModal}
//                 >
//                   Close
//                 </button>
//               </div>
//             </div>

//             <div className="p-6">
//               {/* Header Info */}
//               <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
//                 <div className="bg-gray-50 p-4 rounded-lg">
//                   <h5 className="font-semibold text-gray-700 mb-3">
//                     Party Details
//                   </h5>
//                   <div className="space-y-2">
//                     <div>
//                       <div className="text-sm text-gray-500">Name</div>
//                       <div className="font-medium">
//                         {selected.party_name || "-"}
//                       </div>
//                     </div>
//                     <div>
//                       <div className="text-sm text-gray-500">Type</div>
//                       <div className="font-medium">{selected.party_type}</div>
//                     </div>
//                     <div>
//                       <div className="text-sm text-gray-500">Buyer Type</div>
//                       <div className="font-medium">{selected.buyer_type}</div>
//                     </div>
//                   </div>
//                 </div>

//                 <div className="bg-gray-50 p-4 rounded-lg">
//                   <h5 className="font-semibold text-gray-700 mb-3">
//                     Contact Details
//                   </h5>
//                   <div className="space-y-2">
//                     <div>
//                       <div className="text-sm text-gray-500">Address</div>
//                       <div className="font-medium">
//                         {selected.address || "-"}
//                       </div>
//                     </div>
//                     <div>
//                       <div className="text-sm text-gray-500">Mobile</div>
//                       <div className="font-medium">
//                         {selected.mobile_no || "-"}
//                       </div>
//                     </div>
//                     <div>
//                       <div className="text-sm text-gray-500">GST</div>
//                       <div className="font-medium">
//                         {selected.gst_no || "-"}
//                       </div>
//                     </div>
//                   </div>
//                 </div>

//                 <div className="bg-gray-50 p-4 rounded-lg">
//                   <h5 className="font-semibold text-gray-700 mb-3">
//                     Order Summary
//                   </h5>
//                   <div className="space-y-2">
//                     <div className="flex justify-between">
//                       <span className="text-gray-600">Taxable Amount:</span>
//                       <span className="font-medium">
//                         ₹{fx(selected?.summary?.total_taxable ?? 0, 2)}
//                       </span>
//                     </div>
//                     <div className="flex justify-between">
//                       <span className="text-gray-600">GST Amount:</span>
//                       <span className="font-medium">
//                         ₹{fx(selected?.summary?.total_gst ?? 0, 2)}
//                       </span>
//                     </div>
//                     <div className="flex justify-between">
//                       <span className="text-gray-600">Other Amount:</span>
//                       <span className="font-medium">
//                         ₹{fx(selected?.other_amount ?? 0, 2)}
//                       </span>
//                     </div>
//                     <div className="flex justify-between pt-2 border-t">
//                       <span className="font-bold text-gray-800">
//                         Grand Total:
//                       </span>
//                       <span className="font-bold text-green-700">
//                         ₹
//                         {fx(
//                           (selected?.summary?.grand_total ??
//                             selected?.final_amount ??
//                             0) + Number(selected?.other_amount || 0),
//                           2
//                         )}
//                       </span>
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               {/* Items Table */}
//               <div className="mb-8">
//                 <h5 className="font-semibold text-gray-700 mb-4">
//                   Order Items
//                 </h5>
//                 <div className="overflow-x-auto">
//                   <table className="w-full border border-gray-200 text-sm">
//                     <thead className="bg-gray-100">
//                       <tr>
//                         <th className="px-4 py-2 border text-left">#</th>
//                         <th className="px-4 py-2 border text-left">Product</th>
//                         <th className="px-4 py-2 border text-left">HSN</th>
//                         <th className="px-4 py-2 border text-right">Qty</th>
//                         <th className="px-4 py-2 border text-left">Unit</th>
//                         <th className="px-4 py-2 border text-right">
//                           Rate/kg (₹)
//                         </th>
//                         <th className="px-4 py-2 border text-right">
//                           Amount (₹)
//                         </th>
//                         <th className="px-4 py-2 border text-right">Disc %</th>
//                         <th className="px-4 py-2 border text-right">
//                           Disc Amt (₹)
//                         </th>
//                         <th className="px-4 py-2 border text-right">GST %</th>
//                         <th className="px-4 py-2 border text-right">
//                           GST Amt (₹)
//                         </th>
//                         <th className="px-4 py-2 border text-right">
//                           Final (₹)
//                         </th>
//                       </tr>
//                     </thead>
//                     <tbody>
//                       {(selected.items || []).map((it, idx) => {
//                         const name =
//                           it.product_name ||
//                           it.item_name ||
//                           productNameOf(it.product_id) ||
//                           String(it.product_id);
//                         const qtyInKg = convertToKg(
//                           it.qty || 0,
//                           it.unit || "kg"
//                         );
//                         const amount = qtyInKg * Number(it.rate || 0);
//                         const discAmt =
//                           amount * (Number(it.discount_per_qty || 0) / 100);
//                         const taxable = amount - discAmt;
//                         const gstAmt =
//                           taxable * (Number(it.gst_percent || 0) / 100);
//                         const finalAmt = taxable + gstAmt;

//                         return (
//                           <tr
//                             key={it.id || idx}
//                             className="border-b hover:bg-gray-50"
//                           >
//                             <td className="px-4 py-2 border text-center">
//                               {idx + 1}
//                             </td>
//                             <td className="px-4 py-2 border font-medium">
//                               {name}
//                             </td>
//                             <td className="px-4 py-2 border">
//                               {it.hsn_code || "-"}
//                             </td>
//                             <td className="px-4 py-2 border text-right">
//                               <div>{fx(it.qty || 0, 2)}</div>
//                               <div className="text-xs text-gray-500">
//                                 ≈{fx(qtyInKg, 2)} kg
//                               </div>
//                             </td>
//                             <td className="px-4 py-2 border">
//                               {it.unit || "kg"}
//                             </td>
//                             <td className="px-4 py-2 border text-right">
//                               ₹{fx(it.rate || 0, 2)}
//                             </td>
//                             <td className="px-4 py-2 border text-right">
//                               ₹{fx(amount, 2)}
//                             </td>
//                             <td className="px-4 py-2 border text-right">
//                               {fx(it.discount_per_qty || 0, 2)}%
//                             </td>
//                             <td className="px-4 py-2 border text-right text-red-600">
//                               -₹{fx(discAmt, 2)}
//                             </td>
//                             <td className="px-4 py-2 border text-right">
//                               {fx(it.gst_percent || 0, 2)}%
//                             </td>
//                             <td className="px-4 py-2 border text-right text-blue-600">
//                               ₹{fx(gstAmt, 2)}
//                             </td>
//                             <td className="px-4 py-2 border text-right font-bold text-green-700">
//                               ₹{fx(finalAmt, 2)}
//                             </td>
//                           </tr>
//                         );
//                       })}
//                     </tbody>
//                   </table>
//                 </div>
//               </div>

//               {/* Footer */}
//               <div className="border-t pt-6">
//                 <div className="flex flex-col md:flex-row justify-between gap-6">
//                   <div className="md:w-2/3">
//                     <h6 className="font-semibold text-gray-700 mb-2">
//                       Terms & Conditions
//                     </h6>
//                     <p className="text-sm text-gray-600">
//                       {selected.terms_condition ||
//                         "Standard terms and conditions apply."}
//                     </p>
//                     <p className="text-sm text-gray-600 mt-2">
//                       <strong>Remark:</strong>{" "}
//                       {selected.other_note || "No remarks"}
//                     </p>
//                   </div>
//                   <div className="md:w-1/3">
//                     <div className="bg-gray-50 p-4 rounded-lg">
//                       <div className="space-y-2">
//                         <div className="flex justify-between">
//                           <span className="text-gray-600">Total Taxable:</span>
//                           <span className="font-medium">
//                             ₹{fx(selected?.summary?.total_taxable ?? 0, 2)}
//                           </span>
//                         </div>
//                         <div className="flex justify-between">
//                           <span className="text-gray-600">Total GST:</span>
//                           <span className="font-medium">
//                             ₹{fx(selected?.summary?.total_gst ?? 0, 2)}
//                           </span>
//                         </div>
//                         <div className="flex justify-between">
//                           <span className="text-gray-600">Other Charges:</span>
//                           <span className="font-medium">
//                             ₹{fx(selected?.other_amount ?? 0, 2)}
//                           </span>
//                         </div>
//                         <div className="flex justify-between pt-2 border-t">
//                           <span className="text-lg font-bold text-gray-800">
//                             Grand Total:
//                           </span>
//                           <span className="text-lg font-bold text-green-700">
//                             ₹
//                             {fx(
//                               (selected?.summary?.grand_total ??
//                                 selected?.final_amount ??
//                                 0) + Number(selected?.other_amount || 0),
//                               2
//                             )}
//                           </span>
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }
