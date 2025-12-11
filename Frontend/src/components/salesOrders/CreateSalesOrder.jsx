// import React, { useEffect, useMemo, useState } from "react";
// import { refApi, soApi } from "../../axios/soApi.js";
// import sequenceAPI from "../../axios/sequenceAPI.js";
// import Swal from "sweetalert2";
// import { useDispatch, useSelector } from "react-redux";
// import { fetchVendors } from "../../features/vendor/vendorThunks.js";
// import { fetchFarmers } from "../../features/farmers/farmerSlice.js";

// const fx = (n, d = 2) => (isNaN(n) ? (0).toFixed(d) : Number(n).toFixed(d));

// // Add margin calculation functions
// const getMarginPercentByQty = (qty, buyerType) => {
//   // If buyer is retailer, always return 50% margin regardless of quantity
//   if (buyerType === "Retailer") {
//     return 50;
//   }

//   // For wholesalers, use the existing quantity-based logic
//   const q = Number(qty) || 0;
//   if (q >= 1 && q <= 4) return 50;
//   if (q >= 5 && q <= 9) return 30;
//   if (q >= 10) return 25;
//   return 0;
// };

// const calcLine = (r) => {
//   const qty = Number(r.qty) || 0;
//   const rate = Number(r.rate) || 0; //changes are made here
//   const d1 = Number(r.d1_percent) || 0;
//   const gst = Number(r.gst_percent) || 0;
//   const amount = qty * rate;
//   const discPerUnit = (rate * d1) / 100;
//   const discTotal = discPerUnit * qty;
//   const taxable = Math.max(amount - discTotal, 0);
//   const gstAmt = (taxable * gst) / 100;
//   const finalAmt = taxable + gstAmt;
//   return { amount, discPerUnit, discTotal, taxable, gstAmt, finalAmt };
// };

// export default function CreateSalesOrder({ so = null, onSaved }) {
//   const isEditMode = Boolean(so);
//   const [loading, setLoading] = useState(false);
//   const [customers, setCustomers] = useState([]);
//   const [products, setProducts] = useState([]);
//   const [useCostMargin] = useState(true); // Add this state

//   const [form, setForm] = useState({
//     so_no: "",
//     party_id: "",
//     party_type: "",
//     buyer_type: "Retailer", // Set default to Retailer
//     payment_method: "",
//     date: new Date().toISOString().split("T")[0],
//     bill_time: "",
//     bill_time_am_pm: "PM",
//     address: "",
//     mobile_no: "",
//     gst_no: "",
//     place_of_supply: "",
//     terms_condition: "",
//     other_amount: "",
//     other_note: "",
//     items: [
//       {
//         product_id: "",
//         hsn_code: "",
//         qty: 0,
//         rate: 0,
//         d1_percent: 0,
//         gst_percent: 0,
//         cost_rate: 0, // Add cost_rate to track the base cost
//         available: 0,
//         manualRate: false, // Add manualRate flag
//         discount_25: 0,
//         discount_30: 0,
//         discount_50: 0,
//         total_50: 0,
//         unit: "",
//       },
//     ],
//   });

//   // Add function to recompute selling rate based on margin
//   const recomputeSellingRate = (item, buyerTypeOverride) => {
//     const q = Number(item.qty) || 0;
//     const base = Number(item.cost_rate) || 0; // product.value as base cost
//     const buyerType = buyerTypeOverride || form.buyer_type || "";

//     if (useCostMargin && !item.manualRate) {
//       const bt = String(buyerType).toLowerCase();
//       const isWholesale =
//         bt === "whole saler" || bt === "wholesaler" || bt === "wholesale";

//       let selling = base;

//       if (!isWholesale || q < 5) {
//         // Default 50% margin case – use explicit total/discount_50 if available
//         const explicitTotal = Number(item.total_50 || 0);
//         const explicitDisc50 = Number(item.discount_50 || 0);

//         if (explicitTotal > 0) {
//           selling = explicitTotal;
//         } else if (explicitDisc50 > 0) {
//           selling = base + explicitDisc50;
//         } else {
//           selling = base * 1.5;
//         }
//       } else if (q >= 5 && q < 10) {
//         // Wholesale 5–9 qty → base + discount_30
//         selling = base + (Number(item.discount_30) || 0);
//       } else if (q >= 10) {
//         // Wholesale qty >= 10 → base + discount_25
//         selling = base + (Number(item.discount_25) || 0);
//       }

//       return Number.isFinite(selling) ? selling : base;
//     }
//     return item.rate || 0;
//   };

//   useEffect(() => {
//     (async () => {
//       try {
//         const [cRes, pRes, seqRes] = await Promise.all([
//           refApi.customers(),
//           refApi.products(),
//           sequenceAPI.next("so", { prefix: "SO-", pad: 6 }),
//         ]);

//         setCustomers(cRes.data || []);
//         const plist = pRes.data?.list || pRes.data || [];
//         const normalized = plist.map((p) => ({
//           id: p.id ?? p._id,
//           product_name: p.product_name,
//           hsn_code: p.hsn_code || "",
//           default_rate: Number(p.sale_rate ?? p.rate ?? p.value ?? 0),
//           default_gst: Number(p.gst_percent ?? p.gst_rate ?? p.gst ?? 0),
//           available: Number(p.size ?? p.stock ?? p.available ?? 0),
//           // use base value as cost, discounts as absolute margin amounts, and keep total (50% margin) if provided
//           cost_rate: Number(p.value ?? p.total ?? 0),
//           discount_25: Number(p.discount_25 || 0),
//           discount_30: Number(p.discount_30 || 0),
//           discount_50: Number(p.discount_50 || 0),
//           total_50: Number(p.total || 0),
//           unit: p.unit || "", // Make sure this exists
//           raw: p,
//         }));
//         setProducts(normalized);
//         if (!isEditMode) {
//           setForm((prev) => ({ ...prev, so_no: seqRes.data?.value || "" }));
//         }
//       } catch (e) {
//         console.error(e);
//         alert(
//           e?.response?.data?.error ||
//             e.message ||
//             "Failed to load reference data"
//         );
//       }
//     })();
//   }, [isEditMode, form?.party_type]);

//   useEffect(() => {
//     if (!isEditMode || !so) return;
//     const normalizedDate = so.date
//       ? new Date(so.date).toISOString().split("T")[0]
//       : "";
//     setForm((p) => ({
//       ...p,
//       so_no: so.so_no || "",
//       party_id: String(so.party_id || ""),
//       party_type: so.party_type,
//       buyer_type: so.buyer_type || "Retailer",
//       date: normalizedDate,
//       bill_time: "",
//       bill_time_am_pm: "PM",
//       address: so.address || "",
//       mobile_no: so.mobile_no || "",
//       gst_no: so.gst_no || "",
//       place_of_supply: so.place_of_supply || "",
//       terms_condition: so.terms_condition || "",
//       items: so.items?.map((it) => {
//         const prod = products.find(
//           (x) => String(x.id) === String(it.product_id)
//         );
//         return {
//           id: it.id || it._id,
//           product_id: String(it.product_id || ""),
//           hsn_code: it.hsn_code || prod?.hsn_code || "",
//           qty: Number(it.qty || 0),
//           rate: Number(it.rate || prod?.default_rate || 0),
//           d1_percent: Number(it.discount_per_qty ?? 0),
//           gst_percent: Number(it.gst_percent ?? prod?.default_gst ?? 0),
//           cost_rate: Number(prod?.cost_rate || 0),
//           available: Number(prod?.available || 0),
//           manualRate: true, // In edit mode, assume rates are manual
//         };
//       }) || [
//         {
//           product_id: "",
//           hsn_code: "",
//           qty: 1,
//           rate: 0,
//           d1_percent: 0,
//           gst_percent: 0,
//           cost_rate: 0,
//           available: 0,
//           manualRate: false,
//         },
//       ],
//     }));
//   }, [isEditMode, so, products]);

//   const onHeader = (e) => {
//     const { name, value } = e.target;

//     if (name === "buyer_type") {
//       // Recompute rates on buyer type change for non-manual rows
//       setForm((prev) => {
//         const next = { ...prev, [name]: value };
//         next.items = next.items.map((row) => {
//           if (useCostMargin && !row.manualRate) {
//             const newRate = recomputeSellingRate(row, value);
//             return { ...row, rate: Number.isFinite(newRate) ? newRate : 0 };
//           }
//           return row;
//         });
//         return next;
//       });
//       return;
//     }

//     if (name === "party_id") {
//       const c = customers.find((x) => String(x.id) === String(value));
//       if (c) {
//         setForm((p) => ({
//           ...p,
//           party_id: String(value),
//           address: c.address || "",
//           mobile_no: c.phone || "",
//           gst_no: c.add_gst ? c.gst_no || "" : "",
//         }));
//         return;
//       }
//     }
//     if (name === "other_amount") {
//       const v = Math.max(0, Number(value || 0));
//       setForm((p) => ({ ...p, other_amount: v }));
//       return;
//     }
//     setForm((p) => ({ ...p, [name]: value }));
//   };

//   const onItem = (i, e) => {
//     const { name, value } = e.target;

//     setForm((prev) => {
//       const next = { ...prev };
//       const row = { ...next.items[i] };

//       const numeric = [
//         "qty",
//         "rate",
//         "d1_percent",
//         "gst_percent",
//         "product_id",
//       ];
//       row[name] = numeric.includes(name)
//         ? value === ""
//           ? ""
//           : Number(value)
//         : value;

//       // When product_id changes → update product details
//       if (name === "product_id") {
//         const p = products.find((x) => String(x.id) === String(value));
//         row.hsn_code = p?.hsn_code || "";
//         row.cost_rate = Number(p?.cost_rate || 0);
//         row.available = Number(p?.available || 0);
//         row.discount_25 = Number(p?.discount_25 || 0);
//         row.discount_30 = Number(p?.discount_30 || 0);
//         row.discount_50 = Number(p?.discount_50 || 0);
//         row.total_50 = Number(p?.total_50 || 0);
//         row.unit = p?.unit || "";

//         // Set initial rate based on margin calculation
//         if ((!row.rate || row.rate === 0) && p?.cost_rate > 0) {
//           const initialRate = recomputeSellingRate({
//             ...row,
//             cost_rate: p.cost_rate,
//             qty: 1,
//             manualRate: false,
//           });
//           row.rate = initialRate;
//           row.manualRate = false;
//         } else if (p?.default_rate != null) {
//           row.rate = Number(p.default_rate);
//           row.manualRate = true;
//         }

//         if (
//           (!row.gst_percent || row.gst_percent === 0) &&
//           p?.default_gst != null
//         )
//           row.gst_percent = Number(p.default_gst);
//       }

//       // When quantity changes, update rate if not manually set
//       if (
//         name === "qty" &&
//         useCostMargin &&
//         !row.manualRate &&
//         row.cost_rate > 0
//       ) {
//         const newRate = recomputeSellingRate(row);

//         row.rate = newRate;
//       }

//       // When rate is manually changed, mark as manual rate
//       if (name === "rate") {
//         row.manualRate = true;
//       }

//       // Validation: if qty > available → alert user
//       if (
//         name === "qty" &&
//         row.available != null &&
//         Number(value) > row.available
//       ) {
//         alert("Given quantity should not be greater than available quantity");
//         row.qty = row.available;
//       }

//       next.items = next.items.map((r, idx) => (idx === i ? row : r));

//       return next;
//     });
//   };

//   const addItem = () =>
//     setForm((p) => ({
//       ...p,
//       items: [
//         ...p.items,
//         {
//           product_id: "",
//           hsn_code: "",
//           qty: 1,
//           rate: 0,
//           d1_percent: 0,
//           gst_percent: 0,
//           cost_rate: 0,
//           available: 0,
//           manualRate: false,
//           unit: "",
//         },
//       ],
//     }));

//   const removeItem = (i) =>
//     setForm((p) => ({
//       ...p,
//       items: p.items.filter((_, idx) => idx !== i),
//     }));

//   const totals = useMemo(() => {
//     return form.items.reduce(
//       (a, r) => {
//         const c = calcLine({
//           qty: Number(r.qty || 0),
//           rate: Number(r.rate || 0),
//           d1_percent: Number(r.d1_percent || 0),
//           gst_percent: Number(r.gst_percent || 0),
//         });
//         a.taxable += c.taxable;
//         a.gst += c.gstAmt;
//         a.final += c.finalAmt;
//         return a;
//       },
//       { taxable: 0, gst: 0, final: 0 }
//     );
//   }, [form.items]);

//   const isValid = useMemo(() => {
//     const headOk = form.so_no && form.date && Number(form.party_id) > 0;
//     const itemsOk =
//       form.items.length > 0 &&
//       form.items.every(
//         (r) =>
//           Number(r.product_id) > 0 && Number(r.qty) > 0 && Number(r.rate) > 0
//       );
//     return Boolean(headOk && itemsOk);
//   }, [form]);

//   const onSubmit = async (e) => {
//     e.preventDefault();

//     const result = await Swal.fire({
//       title: "Confirm",
//       text: `Are you sure you want to ${
//         isEditMode ? "update" : "create"
//       } this Sales Order?`,
//       icon: "question",
//       showCancelButton: true,
//       confirmButtonText: "Yes",
//       cancelButtonText: "No",
//     });

//     if (!result.isConfirmed) return;

//     try {
//       setLoading(true);
//       let [h = "00", m = "00"] = String(form.bill_time || "00:00").split(":");
//       let hour = Number(h);
//       let minute = Number(m);
//       if (isNaN(hour)) hour = 0;
//       if (isNaN(minute)) minute = 0;
//       if (form.bill_time_am_pm === "PM" && hour < 12) hour += 12;
//       if (form.bill_time_am_pm === "AM" && hour === 12) hour = 0;
//       const bill_time = form.date
//         ? `${form.date} ${String(hour).padStart(2, "0")}:${String(
//             minute
//           ).padStart(2, "0")}:00`
//         : null;

//       const items = form.items.map((r) => ({
//         id: r.id,
//         product_id: Number(r.product_id),
//         hsn_code: r.hsn_code || "",
//         qty: Number(r.qty || 0),
//         rate: Number(r.rate || 0),
//         discount_per_qty: Number(r.d1_percent || 0),
//         gst_percent: Number(r.gst_percent || 0),
//       }));

//       const payload = {
//         so_no: form.so_no,
//         party_type: form?.party_type,
//         party_id: Number(form.party_id),
//         buyer_type: form.buyer_type,
//         date: form.date || null,
//         bill_time,
//         address: form.address || "",
//         mobile_no: form.mobile_no || "",
//         gst_no: form.gst_no || "",
//         place_of_supply: form.place_of_supply || "",
//         terms_condition: form.terms_condition || "",
//         other_amount: Number(form.other_amount || 0),
//         other_note: form.other_note || "",
//         items,
//       };

//       if (isEditMode) {
//         await soApi.update(so.id || so._id, payload);
//       } else {
//         await soApi.create(payload);
//       }

//       setLoading(false);
//       onSaved && onSaved();

//       if (!isEditMode) {
//         setForm({
//           so_no: "",
//           party_id: "",
//           date: "",
//           bill_time: "",
//           bill_time_am_pm: "PM",
//           address: "",
//           mobile_no: "",
//           gst_no: "",
//           place_of_supply: "",
//           terms_condition: "",
//           other_amount: 0,
//           other_note: "",
//           buyer_type: "Retailer",
//           items: [
//             {
//               product_id: "",
//               hsn_code: "",
//               qty: 1,
//               rate: 0,
//               d1_percent: 0,
//               gst_percent: 0,
//               cost_rate: 0,
//               available: 0,
//               manualRate: false,
//             },
//           ],
//         });
//       }
//     } catch (err) {
//       console.error(err);
//       const msg =
//         err?.response?.data?.error ||
//         (err?.message?.includes("ER_DUP_ENTRY")
//           ? "SO number already exists. Please use a unique SO No."
//           : err.message) ||
//         "Failed to save SO";
//       alert(msg);
//       setLoading(false);
//     }
//   };

//   const dispatch = useDispatch();

//   const onPartyTypeChange = (e) => {
//     const val = e.target.value;
//     setForm((prev) => ({
//       ...prev,
//       party_type: val,
//     }));

//     if (val == "Vendor") {
//       dispatch(fetchFarmers());
//     } else {
//       dispatch(fetchVendors());
//     }
//   };

//   const { list } = useSelector((state) => state.farmers);
//   const { vendors } = useSelector((state) => state.vendors);

//   return (
//     <form onSubmit={onSubmit} className="bg-white rounded-xl mb-6">
//       {/* Title */}
//       <div className="flex items-center justify-between mb-4">
//         <h3 className="text-xl font-bold">
//           {isEditMode ? "Edit Sales Order" : "Create Sales Order"}
//         </h3>
//         <div className="text-right text-xs text-gray-500">
//           <div>
//             Date: <span className="font-medium">{form.date || "-"}</span>
//           </div>
//           <div>
//             Time: <span className="font-medium">{form.bill_time || "-"}</span>
//           </div>
//         </div>
//       </div>

//       {/* Summary + Header */}
//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
//         {/* Summary Card */}
//         <div className="lg:col-span-1">
//           <div className="bg-white border rounded-xl shadow-sm p-4">
//             <div className="text-sm font-semibold text-gray-800 mb-2">
//               Payment Summary
//             </div>

//             <div className="space-y-3">
//               <div className="flex items-center justify-between">
//                 <span className="text-xs text-gray-600">Old Remaining</span>
//                 <span className="font-semibold">{fx(0, 3)}</span>
//               </div>
//               <div className="flex items-center justify-between">
//                 <span className="text-xs text-gray-600">Sale Total</span>
//                 <span className="font-semibold">{fx(totals.final, 3)}</span>
//               </div>
//               <div className="flex items-center justify-between">
//                 <span className="text-xs text-gray-600">Due After Pay</span>
//                 <span className="font-semibold">{fx(totals.final, 3)}</span>
//               </div>

//               <div className="flex items-center justify-between">
//                 <span className="text-xs text-gray-600">Status</span>
//                 <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-green-100 text-green-700">
//                   Paid
//                 </span>
//               </div>

//               <div className="pt-2 border-t space-y-2">
//                 <div className="flex items-center justify-between text-xs">
//                   <span className="text-gray-600">Party</span>
//                   <span className="text-gray-800">
//                     {customers.find(
//                       (x) => Number(x.id) === Number(form.party_id)
//                     )?.name || "-"}
//                   </span>
//                 </div>
//                 <div className="flex items-center justify-between text-xs">
//                   <span className="text-gray-600">Paid Amount</span>
//                   <span className="text-gray-800">{fx(0, 3)}</span>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Header Card */}
//         <div className="lg:col-span-2">
//           <div className="bg-white border rounded-xl shadow-sm p-4">
//             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
//               {isEditMode && (
//                 <div className="flex flex-col">
//                   <label className="text-sm text-gray-600 mb-1">SO No</label>
//                   <input
//                     type="text"
//                     className="border rounded-lg p-2"
//                     name="so_no"
//                     value={form.so_no}
//                     onChange={onHeader}
//                     placeholder="Enter SO Number"
//                     readOnly={!isEditMode}
//                   />
//                 </div>
//               )}

//               <div className="flex flex-col">
//                 <label className="text-sm text-gray-600 mb-1">Date</label>
//                 <input
//                   type="date"
//                   className="border rounded-lg p-2"
//                   name="date"
//                   value={form.date}
//                   onChange={onHeader}
//                 />
//               </div>

//               <div className="flex flex-col">
//                 <label className="text-sm text-gray-600 mb-1">Party Type</label>
//                 <select
//                   className="border rounded p-1"
//                   value={form.party_type}
//                   onChange={onPartyTypeChange}
//                 >
//                   <option value="Customer">Customer</option>
//                   <option value="Vendor">Vendor</option>
//                   <option value="Farmer">Farmer</option>
//                 </select>
//               </div>

//               <div className="flex flex-col">
//                 <label className="text-sm text-gray-600 mb-1">
//                   {form?.party_type == "Vendor"
//                     ? "Firm/Vendor"
//                     : form?.party_type === "Customer"
//                     ? "Customer"
//                     : "Farmer"}
//                 </label>
//                 <select
//                   className="border rounded-lg p-2"
//                   name="party_id"
//                   value={form.party_id}
//                   onChange={onHeader}
//                 >
//                   <option value="">Select</option>

//                   {form.party_type === "Customer"
//                     ? customers.map((c) => (
//                         <option key={c.id} value={c.id}>
//                           {c.name}
//                         </option>
//                       ))
//                     : form.party_type === "Vendor"
//                     ? vendors.map((c) => (
//                         <option key={c.id} value={c.id}>
//                           {c.vendor_name}
//                         </option>
//                       ))
//                     : list.map((c) => (
//                         <option key={c.id} value={c.id}>
//                           {c.name}
//                         </option>
//                       ))}
//                 </select>
//               </div>

//               <div className="flex flex-col">
//                 <label className="text-sm text-gray-600 mb-1">
//                   Paid Amount
//                 </label>
//                 <input
//                   className="border rounded-lg p-2"
//                   placeholder="0"
//                   value={0}
//                   readOnly
//                 />
//                 <span className="text-[10px] text-gray-500">
//                   Max allowed: 0.000
//                 </span>
//               </div>

//               <div className="flex flex-col">
//                 <label className="text-sm text-gray-600 mb-1">Mobile No.</label>
//                 <input
//                   className="border rounded-lg p-2"
//                   name="mobile_no"
//                   value={form.mobile_no}
//                   onChange={onHeader}
//                   placeholder="Mobile"
//                 />
//               </div>

//               <div className="flex flex-col">
//                 <label className="text-sm text-gray-600 mb-1">GST No.</label>
//                 <input
//                   className="border rounded-lg p-2"
//                   name="gst_no"
//                   value={form.gst_no}
//                   onChange={onHeader}
//                   placeholder="GST No."
//                 />
//               </div>

//               <div className="flex flex-col lg:col-span-2">
//                 <label className="text-sm text-gray-600 mb-1">Address</label>
//                 <input
//                   className="border rounded-lg p-2"
//                   name="address"
//                   value={form.address}
//                   onChange={onHeader}
//                   placeholder="Address"
//                 />
//               </div>

//               <div className="flex flex-col">
//                 <label className="text-sm text-gray-600 mb-1">
//                   Other Amount
//                 </label>
//                 <input
//                   type="number"
//                   className="border rounded-lg p-2"
//                   name="other_amount"
//                   value={form.other_amount}
//                   onChange={onHeader}
//                   min={0}
//                   placeholder="e.g. 100"
//                 />
//               </div>

//               <div className="flex flex-col">
//                 <label className="text-sm text-gray-600 mb-1">Remark</label>
//                 <input
//                   className="border rounded-lg p-2"
//                   name="other_note"
//                   value={form.other_note}
//                   onChange={onHeader}
//                   placeholder="e.g. Transportation"
//                 />
//               </div>

//               <div className="flex flex-col lg:col-span-2">
//                 <label className="text-sm text-gray-600 mb-1">
//                   Party Balance
//                 </label>
//                 <input
//                   className="border rounded-lg p-2 bg-gray-100"
//                   value={fx(0, 3)}
//                   readOnly
//                 />
//               </div>

//               <div className="flex flex-col">
//                 <label className="text-sm text-gray-600 mb-1">
//                   Payment Method
//                 </label>
//                 <select
//                   className="border rounded-lg p-2"
//                   name="payment_method"
//                   value={form.payment_method}
//                   onChange={onHeader}
//                 >
//                   <option>Cash</option>
//                   <option>UPI</option>
//                   <option>Card</option>
//                   <option>Bank</option>
//                   <option>Credit</option>
//                 </select>
//               </div>

//               <div className="flex flex-col">
//                 <label className="text-sm text-gray-600 mb-1">
//                   select type
//                 </label>
//                 <select
//                   className="border p-2 rounded-lg"
//                   name="buyer_type"
//                   value={form.buyer_type}
//                   onChange={onHeader}
//                 >
//                   <option>Retailer</option>
//                   <option>Whole Saler</option>
//                 </select>
//               </div>

//               <div className="flex flex-col">
//                 <label className="text-sm text-gray-600 mb-1">
//                   Payment Status
//                 </label>
//                 <div className="inline-flex items-center px-2 py-1 rounded text-xs bg-green-100 text-green-700 w-min">
//                   Paid
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Items Table */}
//       <div className="mt-4 overflow-x-auto">
//         <table className="min-w-full border text-xs">
//           <thead className="bg-green-700 text-white">
//             <tr>
//               <th className="px-2 py-2 border text-center w-10">S.No</th>
//               <th className="px-2 py-2 border text-left">Item Name</th>
//               <th className="px-2 py-2 border text-left">HSNCode</th>
//               <th className="px-2 py-2 border text-center w-20">Aval QTY</th>
//               <th className="px-2 py-2 border text-center w-16">QTY</th>
//               <th className="px-2 py-2 border text-center w-16">Unit</th>
//               <th className="px-2 py-2 border text-right">Rate</th>
//               <th className="px-2 py-2 border text-right">Amount</th>
//               <th className="px-2 py-2 border text-right">Disc %</th>
//               <th className="px-2 py-2 border text-right">Per Qty Disc</th>
//               <th className="px-2 py-2 border text-right">Total Disc</th>
//               <th className="px-2 py-2 border text-right">GST%</th>
//               <th className="px-2 py-2 border text-right">GST Amt</th>
//               <th className="px-2 py-2 border text-right">FinalAmt</th>
//               <th className="px-2 py-2 border text-center w-16">Actions</th>
//             </tr>
//           </thead>

//           <tbody>
//             {form.items.map((it, i) => {
//               const { amount, discPerUnit, discTotal, gstAmt, finalAmt } =
//                 calcLine(it);
//               return (
//                 <tr key={i} className="odd:bg-white even:bg-gray-50">
//                   <td className="px-2 py-1 border text-center">{i + 1}</td>

//                   <td className="px-2 py-1 border">
//                     <div className="flex gap-1">
//                       <select
//                         className="border rounded p-1 w-44"
//                         name="product_id"
//                         value={it.product_id}
//                         onChange={(e) => onItem(i, e)}
//                       >
//                         <option value="">Select</option>
//                         {products.map((p) => (
//                           <option key={p.id} value={p.id}>
//                             {p.product_name}
//                           </option>
//                         ))}
//                       </select>
//                     </div>
//                   </td>

//                   <td className="px-2 py-1 border bg-gray-100">
//                     <input
//                       readOnly
//                       className="border rounded w-full h-8 px-2 text-xs"
//                       name="hsn_code"
//                       value={it.hsn_code || ""}
//                     />
//                   </td>

//                   <td className="px-2 py-1 border text-center">
//                     <input
//                       readOnly
//                       className="border rounded p-1 w-20 bg-gray-100"
//                       value={it.available ?? 0}
//                     />
//                   </td>

//                   <td className="px-2 py-1 border text-center">
//                     <input
//                       type="number"
//                       min={1}
//                       className="border rounded w-16 h-8 px-2 text-center text-xs"
//                       name="qty"
//                       value={it.qty === 0 ? "" : it?.qty}
//                       onChange={(e) => onItem(i, e)}
//                     />
//                   </td>

//                   <td className="px-2 py-1 border">
//                     <div className="flex gap-1">
//                       <select
//                         className="border rounded p-1 w-44"
//                         name="unit"
//                         value={it.unit}
//                         onChange={(e) => onItem(i, e)}
//                       >
//                         <option value="">Select</option>
//                         <option value="ton">Ton</option>
//                         <option value="quantal">Quantal</option>
//                         <option value="kg">KG</option>
//                         <option value="gram">Gram</option>
//                       </select>
//                     </div>
//                   </td>

//                   <td className="px-2 py-1 border text-right">
//                     <input
//                       type="number"
//                       className={
//                         "border rounded w-20 h-8 px-2 text-right text-xs"
//                       }
//                       name="rate"
//                       value={it.rate === 0 ? "" : it?.rate}
//                       onChange={(e) => onItem(i, e)}
//                     />
//                     <div className="text-[10px] text-gray-500 text-right">
//                       {useCostMargin && !it.manualRate
//                         ? `Margin: ${getMarginPercentByQty(
//                             it.qty || 0,
//                             form.buyer_type
//                           )}% ${
//                             form.buyer_type === "Retailer"
//                               ? "(fixed)"
//                               : "(auto)"
//                           }`
//                         : "Manual rate"}
//                     </div>
//                   </td>

//                   <td className="px-2 py-1 border text-right">
//                     {fx(amount, 3)}
//                   </td>

//                   <td className="px-2 py-1 border text-right">
//                     <input
//                       type="number"
//                       className="border rounded w-16 h-8 px-2 text-right text-xs"
//                       name="d1_percent"
//                       value={it.d1_percent === 0 ? "" : it?.d1_percent}
//                       onChange={(e) => onItem(i, e)}
//                     />
//                   </td>

//                   <td className="px-2 py-1 border text-right">
//                     <div className="flex flex-col items-end">
//                       <input
//                         type="text"
//                         className="border rounded w-20 h-8 px-2 text-right text-xs bg-gray-100 cursor-not-allowed"
//                         value={fx(discPerUnit, 3)}
//                         readOnly
//                       />
//                       <div className="text-[10px] text-gray-500">
//                         x {it.qty || 0} = {fx(discTotal, 3)}
//                       </div>
//                     </div>
//                   </td>

//                   <td className="px-2 py-1 border text-right">
//                     <span className="font-semibold">{fx(discTotal, 3)}</span>
//                   </td>

//                   <td className="px-2 py-1 border text-right">
//                     <input
//                       type="number"
//                       className="border rounded w-16 h-8 px-2 text-right text-xs"
//                       name="gst_percent"
//                       value={it.gst_percent === 0 ? "" : it?.gst_percent}
//                       onChange={(e) => onItem(i, e)}
//                     />
//                   </td>

//                   <td className="px-2 py-1 border text-right">
//                     {fx(gstAmt, 3)}
//                   </td>
//                   <td className="px-2 py-1 border text-right">
//                     {fx(finalAmt, 3)}
//                   </td>

//                   <td className="px-2 py-1 border text-center">
//                     <button
//                       type="button"
//                       className="h-8 w-8 grid place-items-center rounded-full bg-red-100 text-red-600 hover:bg-red-200"
//                       onClick={() => removeItem(i)}
//                     >
//                       ×
//                     </button>
//                   </td>
//                 </tr>
//               );
//             })}
//           </tbody>

//           <tfoot>
//             <tr className="bg-gray-100 font-semibold text-right text-xs">
//               <td className="px-2 py-1 border text-center"></td>
//               <td className="px-2 py-1 border text-left">Totals</td>
//               <td className="px-2 py-1 border text-left"></td>
//               <td className="px-2 py-1 border text-center"></td>
//               <td className="px-2 py-1 border text-center">
//                 {fx(
//                   form.items.reduce((a, r) => a + Number(r.qty || 0), 0),
//                   3
//                 )}
//               </td>
//               <td className="px-2 py-1 border text-right">
//                 {fx(
//                   form.items.reduce((a, r) => a + Number(r.rate || 0), 0),
//                   3
//                 )}
//               </td>
//               <td className="px-2 py-1 border text-right">
//                 {fx(totals.taxable, 3)}
//               </td>
//               <td className="px-2 py-1 border text-right"></td>
//               <td className="px-2 py-1 border text-right">—</td>
//               <td className="px-2 py-1 border text-right">
//                 {fx(
//                   form.items.reduce(
//                     (a, r) =>
//                       a +
//                       Number(r.qty || 0) *
//                         ((Number(r.rate || 0) * Number(r.d1_percent || 0)) /
//                           100),
//                     0
//                   ),
//                   3
//                 )}
//               </td>
//               <td className="px-2 py-1 border text-right"></td>
//               <td className="px-2 py-1 border text-right">
//                 {fx(totals.gst, 3)}
//               </td>
//               <td className="px-2 py-1 border text-right">
//                 {fx(totals.final, 3)}
//               </td>
//               <td className="px-2 py-1 border text-center"></td>
//             </tr>
//             <tr>
//               <td className="px-2 py-1 border" colSpan={14}>
//                 <button
//                   className="px-2 py-1 bg-gray-200 rounded text-xs"
//                   onClick={(e) => {
//                     e.preventDefault();
//                     addItem();
//                   }}
//                   type="button"
//                 >
//                   Add Row
//                 </button>
//               </td>
//             </tr>
//           </tfoot>
//         </table>
//       </div>

//       {/* Actions */}
//       <div className="flex justify-end gap-3 mt-4">
//         <button
//           type="button"
//           className="px-4 py-2 bg-gray-200 rounded-lg"
//           onClick={() => {
//             setForm({
//               so_no: "",
//               party_id: "",
//               date: "",
//               bill_time: "",
//               bill_time_am_pm: "PM",
//               address: "",
//               mobile_no: "",
//               gst_no: "",
//               place_of_supply: "",
//               terms_condition: "",
//               buyer_type: "Retailer",
//               items: [
//                 {
//                   product_id: "",
//                   hsn_code: "",
//                   qty: 1,
//                   rate: 0,
//                   d1_percent: 0,
//                   gst_percent: 0,
//                   cost_rate: 0,
//                   available: 0,
//                   manualRate: false,
//                 },
//               ],
//             });
//           }}
//         >
//           Reset
//         </button>

//         <button
//           type="submit"
//           disabled={!isValid || loading}
//           className={`px-6 py-2 rounded-lg text-white ${
//             !isValid || loading
//               ? "bg-green-700/50 cursor-not-allowed"
//               : "bg-green-700 hover:bg-green-800 active:scale-95"
//           }`}
//         >
//           {isEditMode ? "Update SO" : "Create SO"}
//         </button>
//       </div>
//     </form>
//   );
// }

////////////////////////////////////////////////////////////////

// import React, { useEffect, useMemo, useState } from "react";
// import { refApi, soApi } from "../../axios/soApi.js";
// import sequenceAPI from "../../axios/sequenceAPI.js";
// import Swal from "sweetalert2";
// import { useDispatch, useSelector } from "react-redux";
// import { fetchVendors } from "../../features/vendor/vendorThunks.js";
// import { fetchFarmers } from "../../features/farmers/farmerSlice.js";

// const fx = (n, d = 2) => (isNaN(n) ? (0).toFixed(d) : Number(n).toFixed(d));

// // Unit conversion constants (to grams)
// const UNIT_CONVERSIONS = {
//   ton: 1000000, // 1 ton = 1,000,000 grams
//   quantal: 100000, // 1 quantal = 100,000 grams
//   kg: 1000, // 1 kg = 1,000 grams
//   gram: 1, // 1 gram = 1 gram
// };

// // Add margin calculation functions
// const getMarginPercentByQty = (qty, buyerType) => {
//   // If buyer is retailer, always return 50% margin regardless of quantity
//   if (buyerType === "Retailer") {
//     return 50;
//   }

//   // For wholesalers, use the existing quantity-based logic
//   const q = Number(qty) || 0;
//   if (q >= 1 && q <= 4) return 50;
//   if (q >= 5 && q <= 9) return 30;
//   if (q >= 10) return 25;
//   return 0;
// };

// const calcLine = (r) => {
//   // Convert quantity from selected unit to kg for calculation
//   let qtyInKg = 0;
//   if (r.unit && r.unit !== "") {
//     // Convert from selected unit to grams, then to kg
//     const qtyInGrams = Number(r.qty || 0) * UNIT_CONVERSIONS[r.unit];
//     qtyInKg = qtyInGrams / 1000; // Convert grams to kg
//   } else {
//     // Default to kg if no unit selected
//     qtyInKg = Number(r.qty || 0);
//   }

//   const rate = Number(r.rate) || 0; // rate is per kg
//   const d1 = Number(r.d1_percent) || 0;
//   const gst = Number(r.gst_percent) || 0;
//   const amount = qtyInKg * rate;
//   const discPerUnit = (rate * d1) / 100;
//   const discTotal = discPerUnit * qtyInKg;
//   const taxable = Math.max(amount - discTotal, 0);
//   const gstAmt = (taxable * gst) / 100;
//   const finalAmt = taxable + gstAmt;
//   return {
//     amount,
//     discPerUnit,
//     discTotal,
//     taxable,
//     gstAmt,
//     finalAmt,
//     qtyInKg, // Return qty in kg for total calculations
//   };
// };

// // Helper function to convert grams to selected unit
// const convertFromGrams = (grams, unit) => {
//   if (!unit || !UNIT_CONVERSIONS[unit]) return grams / 1000; // Default to kg
//   return grams / UNIT_CONVERSIONS[unit];
// };

// // Helper function to convert from selected unit to grams
// const convertToGrams = (quantity, unit) => {
//   if (!unit || !UNIT_CONVERSIONS[unit]) return quantity * 1000; // Default to kg
//   return quantity * UNIT_CONVERSIONS[unit];
// };

// // Helper function to convert rate from per kg to per selected unit
// const getRateForUnit = (ratePerKg, unit) => {
//   if (!unit || !UNIT_CONVERSIONS[unit]) return ratePerKg;

//   // Convert rate per kg to rate per unit
//   // Example: 100 Rs/kg = 100 * 1000 (g/kg) / UNIT_CONVERSIONS[unit] (g/unit)
//   const ratePerGram = ratePerKg / 1000; // Rs per gram
//   return ratePerGram * UNIT_CONVERSIONS[unit];
// };

// // Helper function to convert rate from per unit to per kg
// const getRatePerKgFromUnit = (ratePerUnit, unit) => {
//   if (!unit || !UNIT_CONVERSIONS[unit]) return ratePerUnit;

//   // Convert rate per unit to rate per kg
//   // Example: For Quintal (100 kg): ratePerQuintal / 100
//   const ratePerGram = ratePerUnit / UNIT_CONVERSIONS[unit];
//   return ratePerGram * 1000; // Rs per kg
// };

// export default function CreateSalesOrder({ so = null, onSaved }) {
//   const isEditMode = Boolean(so);
//   const [loading, setLoading] = useState(false);
//   const [customers, setCustomers] = useState([]);
//   const [products, setProducts] = useState([]);
//   const [useCostMargin] = useState(true); // Add this state

//   const [form, setForm] = useState({
//     so_no: "",
//     party_id: "",
//     party_type: "",
//     buyer_type: "Retailer", // Set default to Retailer
//     payment_method: "",
//     date: new Date().toISOString().split("T")[0],
//     bill_time: "",
//     bill_time_am_pm: "PM",
//     address: "",
//     mobile_no: "",
//     gst_no: "",
//     place_of_supply: "",
//     terms_condition: "",
//     other_amount: "",
//     other_note: "",
//     items: [
//       {
//         product_id: "",
//         hsn_code: "",
//         qty: 0,
//         rate: 0,
//         d1_percent: 0,
//         gst_percent: 0,
//         cost_rate: 0, // Add cost_rate to track the base cost
//         available_grams: 0, // Available quantity in grams
//         manualRate: false, // Add manualRate flag
//         discount_25: 0,
//         discount_30: 0,
//         discount_50: 0,
//         total_50: 0,
//         unit: "",
//         product_unit: "", // Store the product's base unit
//         display_rate: 0, // Rate displayed based on selected unit
//         rate_per_kg: 0, // Rate per kg (for calculations)
//       },
//     ],
//   });

//   // Add function to recompute selling rate based on margin
//   const recomputeSellingRate = (item, buyerTypeOverride) => {
//     const q = Number(item.qty) || 0;
//     const base = Number(item.cost_rate) || 0; // product.value as base cost
//     const buyerType = buyerTypeOverride || form.buyer_type || "";

//     if (useCostMargin && !item.manualRate) {
//       const bt = String(buyerType).toLowerCase();
//       const isWholesale =
//         bt === "whole saler" || bt === "wholesaler" || bt === "wholesale";

//       let selling = base;

//       if (!isWholesale || q < 5) {
//         // Default 50% margin case – use explicit total/discount_50 if available
//         const explicitTotal = Number(item.total_50 || 0);
//         const explicitDisc50 = Number(item.discount_50 || 0);

//         if (explicitTotal > 0) {
//           selling = explicitTotal;
//         } else if (explicitDisc50 > 0) {
//           selling = base + explicitDisc50;
//         } else {
//           selling = base * 1.5;
//         }
//       } else if (q >= 5 && q < 10) {
//         // Wholesale 5–9 qty → base + discount_30
//         selling = base + (Number(item.discount_30) || 0);
//       } else if (q >= 10) {
//         // Wholesale qty >= 10 → base + discount_25
//         selling = base + (Number(item.discount_25) || 0);
//       }

//       return Number.isFinite(selling) ? selling : base;
//     }
//     return item.rate_per_kg || 0; // Return rate per kg
//   };

//   useEffect(() => {
//     (async () => {
//       try {
//         const [cRes, pRes, seqRes] = await Promise.all([
//           refApi.customers(),
//           refApi.products(),
//           sequenceAPI.next("so", { prefix: "SO-", pad: 6 }),
//         ]);

//         setCustomers(cRes.data || []);
//         const plist = pRes.data?.list || pRes.data || [];
//         const normalized = plist.map((p) => ({
//           id: p.id ?? p._id,
//           product_name: p.product_name,
//           hsn_code: p.hsn_code || "",
//           default_rate: Number(p.sale_rate ?? p.rate ?? p.value ?? 0), // This is per kg
//           default_gst: Number(p.gst_percent ?? p.gst_rate ?? p.gst ?? 0),
//           available: Number(p.size ?? p.stock ?? p.available ?? 0), // This is in grams
//           // use base value as cost, discounts as absolute margin amounts, and keep total (50% margin) if provided
//           cost_rate: Number(p.value ?? p.total ?? 0), // Cost per kg
//           discount_25: Number(p.discount_25 || 0),
//           discount_30: Number(p.discount_30 || 0),
//           discount_50: Number(p.discount_50 || 0),
//           total_50: Number(p.total || 0),
//           unit: p.unit || "kg", // Product's base unit
//           raw: p,
//         }));
//         setProducts(normalized);
//         if (!isEditMode) {
//           setForm((prev) => ({ ...prev, so_no: seqRes.data?.value || "" }));
//         }
//       } catch (e) {
//         console.error(e);
//         alert(
//           e?.response?.data?.error ||
//             e.message ||
//             "Failed to load reference data"
//         );
//       }
//     })();
//   }, [isEditMode, form?.party_type]);

//   useEffect(() => {
//     if (!isEditMode || !so) return;
//     const normalizedDate = so.date
//       ? new Date(so.date).toISOString().split("T")[0]
//       : "";
//     setForm((p) => ({
//       ...p,
//       so_no: so.so_no || "",
//       party_id: String(so.party_id || ""),
//       party_type: so.party_type,
//       buyer_type: so.buyer_type || "Retailer",
//       date: normalizedDate,
//       bill_time: "",
//       bill_time_am_pm: "PM",
//       address: so.address || "",
//       mobile_no: so.mobile_no || "",
//       gst_no: so.gst_no || "",
//       place_of_supply: so.place_of_supply || "",
//       terms_condition: so.terms_condition || "",
//       items: so.items?.map((it) => {
//         const prod = products.find(
//           (x) => String(x.id) === String(it.product_id)
//         );
//         const unit = it.unit || prod?.unit || "kg";
//         const availableGrams = prod?.available || 0;

//         return {
//           id: it.id || it._id,
//           product_id: String(it.product_id || ""),
//           hsn_code: it.hsn_code || prod?.hsn_code || "",
//           qty: Number(it.qty || 0),
//           rate_per_kg: Number(it.rate || prod?.default_rate || 0),
//           d1_percent: Number(it.discount_per_qty ?? 0),
//           gst_percent: Number(it.gst_percent ?? prod?.default_gst ?? 0),
//           cost_rate: Number(prod?.cost_rate || 0),
//           available_grams: availableGrams,
//           product_unit: prod?.unit || "kg",
//           unit: unit,
//           display_rate: getRateForUnit(
//             Number(it.rate || prod?.default_rate || 0),
//             unit
//           ),
//           manualRate: true, // In edit mode, assume rates are manual
//           discount_25: Number(prod?.discount_25 || 0),
//           discount_30: Number(prod?.discount_30 || 0),
//           discount_50: Number(prod?.discount_50 || 0),
//           total_50: Number(prod?.total_50 || 0),
//         };
//       }) || [
//         {
//           product_id: "",
//           hsn_code: "",
//           qty: 1,
//           rate_per_kg: 0,
//           d1_percent: 0,
//           gst_percent: 0,
//           cost_rate: 0,
//           available_grams: 0,
//           product_unit: "",
//           unit: "",
//           display_rate: 0,
//           manualRate: false,
//         },
//       ],
//     }));
//   }, [isEditMode, so, products]);

//   const onHeader = (e) => {
//     const { name, value } = e.target;

//     if (name === "buyer_type") {
//       // Recompute rates on buyer type change for non-manual rows
//       setForm((prev) => {
//         const next = { ...prev, [name]: value };
//         next.items = next.items.map((row) => {
//           if (useCostMargin && !row.manualRate && row.cost_rate > 0) {
//             const newRatePerKg = recomputeSellingRate(row, value);
//             const newDisplayRate = getRateForUnit(
//               newRatePerKg,
//               row.unit || row.product_unit
//             );
//             return {
//               ...row,
//               rate_per_kg: Number.isFinite(newRatePerKg) ? newRatePerKg : 0,
//               display_rate: Number.isFinite(newDisplayRate)
//                 ? newDisplayRate
//                 : 0,
//             };
//           }
//           return row;
//         });
//         return next;
//       });
//       return;
//     }

//     if (name === "party_id") {
//       const c = customers.find((x) => String(x.id) === String(value));
//       if (c) {
//         setForm((p) => ({
//           ...p,
//           party_id: String(value),
//           address: c.address || "",
//           mobile_no: c.phone || "",
//           gst_no: c.add_gst ? c.gst_no || "" : "",
//         }));
//         return;
//       }
//     }
//     if (name === "other_amount") {
//       const v = Math.max(0, Number(value || 0));
//       setForm((p) => ({ ...p, other_amount: v }));
//       return;
//     }
//     setForm((p) => ({ ...p, [name]: value }));
//   };

//   const onItem = (i, e) => {
//     const { name, value } = e.target;

//     setForm((prev) => {
//       const next = { ...prev };
//       const row = { ...next.items[i] };

//       const numeric = [
//         "qty",
//         "display_rate",
//         "d1_percent",
//         "gst_percent",
//         "product_id",
//       ];
//       row[name] = numeric.includes(name)
//         ? value === ""
//           ? ""
//           : Number(value)
//         : value;

//       // When product_id changes → update product details
//       if (name === "product_id") {
//         const p = products.find((x) => String(x.id) === String(value));
//         row.hsn_code = p?.hsn_code || "";
//         row.cost_rate = Number(p?.cost_rate || 0);
//         row.available_grams = Number(p?.available || 0); // Store in grams
//         row.product_unit = p?.unit || "kg";
//         row.discount_25 = Number(p?.discount_25 || 0);
//         row.discount_30 = Number(p?.discount_30 || 0);
//         row.discount_50 = Number(p?.discount_50 || 0);
//         row.total_50 = Number(p?.total_50 || 0);
//         row.unit = p?.unit || "kg"; // Set initial unit from product

//         // Set initial rate based on margin calculation
//         if ((!row.rate_per_kg || row.rate_per_kg === 0) && p?.cost_rate > 0) {
//           const initialRatePerKg = recomputeSellingRate({
//             ...row,
//             cost_rate: p.cost_rate,
//             qty: 1,
//             manualRate: false,
//           });
//           row.rate_per_kg = initialRatePerKg;
//           row.display_rate = getRateForUnit(initialRatePerKg, row.unit);
//           row.manualRate = false;
//         } else if (p?.default_rate != null) {
//           row.rate_per_kg = Number(p.default_rate);
//           row.display_rate = getRateForUnit(Number(p.default_rate), row.unit);
//           row.manualRate = true;
//         }

//         if (
//           (!row.gst_percent || row.gst_percent === 0) &&
//           p?.default_gst != null
//         )
//           row.gst_percent = Number(p.default_gst);
//       }

//       // When quantity changes, update rate if not manually set
//       if (
//         name === "qty" &&
//         useCostMargin &&
//         !row.manualRate &&
//         row.cost_rate > 0
//       ) {
//         const newRatePerKg = recomputeSellingRate(row);
//         row.rate_per_kg = newRatePerKg;
//         row.display_rate = getRateForUnit(newRatePerKg, row.unit);
//       }

//       // When display_rate is manually changed, mark as manual rate and convert to per kg
//       if (name === "display_rate") {
//         row.manualRate = true;
//         row.rate_per_kg = getRatePerKgFromUnit(Number(value) || 0, row.unit);
//       }

//       // When unit changes, update display_rate and validate quantity
//       if (name === "unit") {
//         const oldUnit = row.unit;
//         row.unit = value;

//         // Convert display rate to new unit
//         if (row.rate_per_kg > 0) {
//           row.display_rate = getRateForUnit(row.rate_per_kg, value);
//         }

//         // Convert quantity if it was entered in old unit
//         if (row.qty > 0 && oldUnit && oldUnit !== "" && value && value !== "") {
//           // Convert qty from old unit to grams, then to new unit
//           const qtyInGrams = convertToGrams(row.qty, oldUnit);
//           row.qty = convertFromGrams(qtyInGrams, value);
//         }
//       }

//       // Validation: if qty > available → alert user
//       if (name === "qty" || name === "unit") {
//         const availableInSelectedUnit = convertFromGrams(
//           row.available_grams || 0,
//           row.unit
//         );
//         if (Number(row.qty || 0) > availableInSelectedUnit) {
//           alert("Given quantity should not be greater than available quantity");
//           row.qty = availableInSelectedUnit;
//         }
//       }

//       next.items = next.items.map((r, idx) => (idx === i ? row : r));

//       return next;
//     });
//   };

//   const addItem = () =>
//     setForm((p) => ({
//       ...p,
//       items: [
//         ...p.items,
//         {
//           product_id: "",
//           hsn_code: "",
//           qty: 1,
//           rate_per_kg: 0,
//           display_rate: 0,
//           d1_percent: 0,
//           gst_percent: 0,
//           cost_rate: 0,
//           available_grams: 0,
//           manualRate: false,
//           unit: "",
//           product_unit: "",
//           discount_25: 0,
//           discount_30: 0,
//           discount_50: 0,
//           total_50: 0,
//         },
//       ],
//     }));

//   const removeItem = (i) =>
//     setForm((p) => ({
//       ...p,
//       items: p.items.filter((_, idx) => idx !== i),
//     }));

//   const totals = useMemo(() => {
//     return form.items.reduce(
//       (a, r) => {
//         const c = calcLine({
//           qty: Number(r.qty || 0),
//           rate: Number(r.rate_per_kg || 0),
//           d1_percent: Number(r.d1_percent || 0),
//           gst_percent: Number(r.gst_percent || 0),
//           unit: r.unit || r.product_unit || "kg",
//         });
//         a.taxable += c.taxable;
//         a.gst += c.gstAmt;
//         a.final += c.finalAmt;
//         a.totalQtyKg += c.qtyInKg;
//         return a;
//       },
//       { taxable: 0, gst: 0, final: 0, totalQtyKg: 0 }
//     );
//   }, [form.items]);

//   const isValid = useMemo(() => {
//     const headOk = form.so_no && form.date && Number(form.party_id) > 0;
//     const itemsOk =
//       form.items.length > 0 &&
//       form.items.every(
//         (r) =>
//           Number(r.product_id) > 0 &&
//           Number(r.qty) > 0 &&
//           Number(r.rate_per_kg) > 0 &&
//           r.unit &&
//           r.unit !== ""
//       );
//     return Boolean(headOk && itemsOk);
//   }, [form]);

//   const onSubmit = async (e) => {
//     e.preventDefault();

//     const result = await Swal.fire({
//       title: "Confirm",
//       text: `Are you sure you want to ${
//         isEditMode ? "update" : "create"
//       } this Sales Order?`,
//       icon: "question",
//       showCancelButton: true,
//       confirmButtonText: "Yes",
//       cancelButtonText: "No",
//     });

//     if (!result.isConfirmed) return;

//     try {
//       setLoading(true);
//       let [h = "00", m = "00"] = String(form.bill_time || "00:00").split(":");
//       let hour = Number(h);
//       let minute = Number(m);
//       if (isNaN(hour)) hour = 0;
//       if (isNaN(minute)) minute = 0;
//       if (form.bill_time_am_pm === "PM" && hour < 12) hour += 12;
//       if (form.bill_time_am_pm === "AM" && hour === 12) hour = 0;
//       const bill_time = form.date
//         ? `${form.date} ${String(hour).padStart(2, "0")}:${String(
//             minute
//           ).padStart(2, "0")}:00`
//         : null;

//       const items = form.items.map((r) => ({
//         id: r.id,
//         product_id: Number(r.product_id),
//         hsn_code: r.hsn_code || "",
//         qty: Number(r.qty || 0),
//         rate: Number(r.rate_per_kg || 0), // Store rate per kg
//         discount_per_qty: Number(r.d1_percent || 0),
//         gst_percent: Number(r.gst_percent || 0),
//         unit: r.unit || "", // Store the selected unit
//       }));

//       const payload = {
//         so_no: form.so_no,
//         party_type: form?.party_type,
//         party_id: Number(form.party_id),
//         buyer_type: form.buyer_type,
//         date: form.date || null,
//         bill_time,
//         address: form.address || "",
//         mobile_no: form.mobile_no || "",
//         gst_no: form.gst_no || "",
//         place_of_supply: form.place_of_supply || "",
//         terms_condition: form.terms_condition || "",
//         other_amount: Number(form.other_amount || 0),
//         other_note: form.other_note || "",
//         items,
//       };

//       if (isEditMode) {
//         await soApi.update(so.id || so._id, payload);
//       } else {
//         await soApi.create(payload);
//       }

//       setLoading(false);
//       onSaved && onSaved();

//       if (!isEditMode) {
//         setForm({
//           so_no: "",
//           party_id: "",
//           date: "",
//           bill_time: "",
//           bill_time_am_pm: "PM",
//           address: "",
//           mobile_no: "",
//           gst_no: "",
//           place_of_supply: "",
//           terms_condition: "",
//           other_amount: 0,
//           other_note: "",
//           buyer_type: "Retailer",
//           items: [
//             {
//               product_id: "",
//               hsn_code: "",
//               qty: 1,
//               rate_per_kg: 0,
//               display_rate: 0,
//               d1_percent: 0,
//               gst_percent: 0,
//               cost_rate: 0,
//               available_grams: 0,
//               manualRate: false,
//               unit: "",
//               product_unit: "",
//             },
//           ],
//         });
//       }
//     } catch (err) {
//       console.error(err);
//       const msg =
//         err?.response?.data?.error ||
//         (err?.message?.includes("ER_DUP_ENTRY")
//           ? "SO number already exists. Please use a unique SO No."
//           : err.message) ||
//         "Failed to save SO";
//       alert(msg);
//       setLoading(false);
//     }
//   };

//   const dispatch = useDispatch();

//   const onPartyTypeChange = (e) => {
//     const val = e.target.value;
//     setForm((prev) => ({
//       ...prev,
//       party_type: val,
//     }));

//     if (val == "Vendor") {
//       dispatch(fetchFarmers());
//     } else {
//       dispatch(fetchVendors());
//     }
//   };

//   const { list } = useSelector((state) => state.farmers);
//   const { vendors } = useSelector((state) => state.vendors);

//   return (
//     <form onSubmit={onSubmit} className="bg-white rounded-xl mb-6">
//       {/* Title */}
//       <div className="flex items-center justify-between mb-4">
//         <h3 className="text-xl font-bold">
//           {isEditMode ? "Edit Sales Order" : "Create Sales Order"}
//         </h3>
//         <div className="text-right text-xs text-gray-500">
//           <div>
//             Date: <span className="font-medium">{form.date || "-"}</span>
//           </div>
//           <div>
//             Time: <span className="font-medium">{form.bill_time || "-"}</span>
//           </div>
//         </div>
//       </div>

//       {/* Summary + Header */}
//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
//         {/* Summary Card */}
//         <div className="lg:col-span-1">
//           <div className="bg-white border rounded-xl shadow-sm p-4">
//             <div className="text-sm font-semibold text-gray-800 mb-2">
//               Payment Summary
//             </div>

//             <div className="space-y-3">
//               <div className="flex items-center justify-between">
//                 <span className="text-xs text-gray-600">Old Remaining</span>
//                 <span className="font-semibold">{fx(0, 3)}</span>
//               </div>
//               <div className="flex items-center justify-between">
//                 <span className="text-xs text-gray-600">Sale Total</span>
//                 <span className="font-semibold">{fx(totals.final, 3)}</span>
//               </div>
//               <div className="flex items-center justify-between">
//                 <span className="text-xs text-gray-600">Due After Pay</span>
//                 <span className="font-semibold">{fx(totals.final, 3)}</span>
//               </div>

//               <div className="flex items-center justify-between">
//                 <span className="text-xs text-gray-600">Status</span>
//                 <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-green-100 text-green-700">
//                   Paid
//                 </span>
//               </div>

//               <div className="pt-2 border-t space-y-2">
//                 <div className="flex items-center justify-between text-xs">
//                   <span className="text-gray-600">Party</span>
//                   <span className="text-gray-800">
//                     {customers.find(
//                       (x) => Number(x.id) === Number(form.party_id)
//                     )?.name || "-"}
//                   </span>
//                 </div>
//                 <div className="flex items-center justify-between text-xs">
//                   <span className="text-gray-600">Paid Amount</span>
//                   <span className="text-gray-800">{fx(0, 3)}</span>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Header Card */}
//         <div className="lg:col-span-2">
//           <div className="bg-white border rounded-xl shadow-sm p-4">
//             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
//               {isEditMode && (
//                 <div className="flex flex-col">
//                   <label className="text-sm text-gray-600 mb-1">SO No</label>
//                   <input
//                     type="text"
//                     className="border rounded-lg p-2"
//                     name="so_no"
//                     value={form.so_no}
//                     onChange={onHeader}
//                     placeholder="Enter SO Number"
//                     readOnly={!isEditMode}
//                   />
//                 </div>
//               )}

//               <div className="flex flex-col">
//                 <label className="text-sm text-gray-600 mb-1">Date</label>
//                 <input
//                   type="date"
//                   className="border rounded-lg p-2"
//                   name="date"
//                   value={form.date}
//                   onChange={onHeader}
//                 />
//               </div>

//               <div className="flex flex-col">
//                 <label className="text-sm text-gray-600 mb-1">Party Type</label>
//                 <select
//                   className="border rounded p-1"
//                   value={form.party_type}
//                   onChange={onPartyTypeChange}
//                 >
//                   <option value="Customer">Customer</option>
//                   <option value="Vendor">Vendor</option>
//                   <option value="Farmer">Farmer</option>
//                 </select>
//               </div>

//               <div className="flex flex-col">
//                 <label className="text-sm text-gray-600 mb-1">
//                   {form?.party_type == "Vendor"
//                     ? "Firm/Vendor"
//                     : form?.party_type === "Customer"
//                     ? "Customer"
//                     : "Farmer"}
//                 </label>
//                 <select
//                   className="border rounded-lg p-2"
//                   name="party_id"
//                   value={form.party_id}
//                   onChange={onHeader}
//                 >
//                   <option value="">Select</option>

//                   {form.party_type === "Customer"
//                     ? customers.map((c) => (
//                         <option key={c.id} value={c.id}>
//                           {c.name}
//                         </option>
//                       ))
//                     : form.party_type === "Vendor"
//                     ? vendors.map((c) => (
//                         <option key={c.id} value={c.id}>
//                           {c.vendor_name}
//                         </option>
//                       ))
//                     : list.map((c) => (
//                         <option key={c.id} value={c.id}>
//                           {c.name}
//                         </option>
//                       ))}
//                 </select>
//               </div>

//               <div className="flex flex-col">
//                 <label className="text-sm text-gray-600 mb-1">
//                   Paid Amount
//                 </label>
//                 <input
//                   className="border rounded-lg p-2"
//                   placeholder="0"
//                   value={0}
//                   readOnly
//                 />
//                 <span className="text-[10px] text-gray-500">
//                   Max allowed: 0.000
//                 </span>
//               </div>

//               <div className="flex flex-col">
//                 <label className="text-sm text-gray-600 mb-1">Mobile No.</label>
//                 <input
//                   className="border rounded-lg p-2"
//                   name="mobile_no"
//                   value={form.mobile_no}
//                   onChange={onHeader}
//                   placeholder="Mobile"
//                 />
//               </div>

//               <div className="flex flex-col">
//                 <label className="text-sm text-gray-600 mb-1">GST No.</label>
//                 <input
//                   className="border rounded-lg p-2"
//                   name="gst_no"
//                   value={form.gst_no}
//                   onChange={onHeader}
//                   placeholder="GST No."
//                 />
//               </div>

//               <div className="flex flex-col lg:col-span-2">
//                 <label className="text-sm text-gray-600 mb-1">Address</label>
//                 <input
//                   className="border rounded-lg p-2"
//                   name="address"
//                   value={form.address}
//                   onChange={onHeader}
//                   placeholder="Address"
//                 />
//               </div>

//               <div className="flex flex-col">
//                 <label className="text-sm text-gray-600 mb-1">
//                   Other Amount
//                 </label>
//                 <input
//                   type="number"
//                   className="border rounded-lg p-2"
//                   name="other_amount"
//                   value={form.other_amount}
//                   onChange={onHeader}
//                   min={0}
//                   placeholder="e.g. 100"
//                 />
//               </div>

//               <div className="flex flex-col">
//                 <label className="text-sm text-gray-600 mb-1">Remark</label>
//                 <input
//                   className="border rounded-lg p-2"
//                   name="other_note"
//                   value={form.other_note}
//                   onChange={onHeader}
//                   placeholder="e.g. Transportation"
//                 />
//               </div>

//               <div className="flex flex-col lg:col-span-2">
//                 <label className="text-sm text-gray-600 mb-1">
//                   Party Balance
//                 </label>
//                 <input
//                   className="border rounded-lg p-2 bg-gray-100"
//                   value={fx(0, 3)}
//                   readOnly
//                 />
//               </div>

//               <div className="flex flex-col">
//                 <label className="text-sm text-gray-600 mb-1">
//                   Payment Method
//                 </label>
//                 <select
//                   className="border rounded-lg p-2"
//                   name="payment_method"
//                   value={form.payment_method}
//                   onChange={onHeader}
//                 >
//                   <option>Cash</option>
//                   <option>UPI</option>
//                   <option>Card</option>
//                   <option>Bank</option>
//                   <option>Credit</option>
//                 </select>
//               </div>

//               <div className="flex flex-col">
//                 <label className="text-sm text-gray-600 mb-1">
//                   select type
//                 </label>
//                 <select
//                   className="border p-2 rounded-lg"
//                   name="buyer_type"
//                   value={form.buyer_type}
//                   onChange={onHeader}
//                 >
//                   <option>Retailer</option>
//                   <option>Whole Saler</option>
//                 </select>
//               </div>

//               <div className="flex flex-col">
//                 <label className="text-sm text-gray-600 mb-1">
//                   Payment Status
//                 </label>
//                 <div className="inline-flex items-center px-2 py-1 rounded text-xs bg-green-100 text-green-700 w-min">
//                   Paid
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Items Table */}
//       <div className="mt-4 overflow-x-auto">
//         <table className="min-w-full border text-xs">
//           <thead className="bg-green-700 text-white">
//             <tr>
//               <th className="px-2 py-2 border text-center w-10">S.No</th>
//               <th className="px-2 py-2 border text-left">Item Name</th>
//               <th className="px-2 py-2 border text-left">HSNCode</th>
//               <th className="px-2 py-2 border text-center w-20">Aval QTY</th>
//               <th className="px-2 py-2 border text-center w-16">QTY</th>
//               <th className="px-2 py-2 border text-center w-16">Unit</th>
//               <th className="px-2 py-2 border text-right">Rate</th>
//               <th className="px-2 py-2 border text-right">Amount</th>
//               <th className="px-2 py-2 border text-right">Disc %</th>
//               <th className="px-2 py-2 border text-right">Per Qty Disc</th>
//               <th className="px-2 py-2 border text-right">Total Disc</th>
//               <th className="px-2 py-2 border text-right">GST%</th>
//               <th className="px-2 py-2 border text-right">GST Amt</th>
//               <th className="px-2 py-2 border text-right">FinalAmt</th>
//               <th className="px-2 py-2 border text-center w-16">Actions</th>
//             </tr>
//           </thead>

//           <tbody>
//             {form.items.map((it, i) => {
//               const { amount, discPerUnit, discTotal, gstAmt, finalAmt } =
//                 calcLine({
//                   qty: Number(it.qty || 0),
//                   rate: Number(it.rate_per_kg || 0),
//                   d1_percent: Number(it.d1_percent || 0),
//                   gst_percent: Number(it.gst_percent || 0),
//                   unit: it.unit || it.product_unit || "kg",
//                 });

//               const availableInSelectedUnit = convertFromGrams(
//                 it.available_grams || 0,
//                 it.unit
//               );

//               return (
//                 <tr key={i} className="odd:bg-white even:bg-gray-50">
//                   <td className="px-2 py-1 border text-center">{i + 1}</td>

//                   <td className="px-2 py-1 border">
//                     <div className="flex gap-1">
//                       <select
//                         className="border rounded p-1 w-44"
//                         name="product_id"
//                         value={it.product_id}
//                         onChange={(e) => onItem(i, e)}
//                       >
//                         <option value="">Select</option>
//                         {products.map((p) => (
//                           <option key={p.id} value={p.id}>
//                             {p.product_name}
//                           </option>
//                         ))}
//                       </select>
//                     </div>
//                   </td>

//                   <td className="px-2 py-1 border bg-gray-100">
//                     <input
//                       readOnly
//                       className="border rounded w-full h-8 px-2 text-xs"
//                       name="hsn_code"
//                       value={it.hsn_code || ""}
//                     />
//                   </td>

//                   <td className="px-2 py-1 border text-center">
//                     <input
//                       readOnly
//                       className="border rounded p-1 w-20 bg-gray-100"
//                       value={fx(availableInSelectedUnit, 3)}
//                     />
//                     <div className="text-[8px] text-gray-500">
//                       {it.unit ? `in ${it.unit}` : "in kg"}
//                     </div>
//                   </td>

//                   <td className="px-2 py-1 border text-center">
//                     <input
//                       type="number"
//                       min={0}
//                       step="0.001"
//                       className="border rounded w-16 h-8 px-2 text-center text-xs"
//                       name="qty"
//                       value={it.qty === 0 ? "" : it?.qty}
//                       onChange={(e) => onItem(i, e)}
//                       max={availableInSelectedUnit}
//                     />
//                     <div className="text-[8px] text-gray-500">
//                       Max: {fx(availableInSelectedUnit, 3)}
//                     </div>
//                   </td>

//                   <td className="px-2 py-1 border">
//                     <div className="flex gap-1">
//                       <select
//                         className="border rounded p-1 w-44"
//                         name="unit"
//                         value={it.unit}
//                         onChange={(e) => onItem(i, e)}
//                       >
//                         <option value="">Select</option>
//                         <option value="ton">Ton</option>
//                         <option value="quantal">Quantal</option>
//                         <option value="kg">KG</option>
//                         <option value="gram">Gram</option>
//                       </select>
//                     </div>
//                   </td>

//                   <td className="px-2 py-1 border text-right">
//                     <input
//                       type="number"
//                       step="0.01"
//                       className={
//                         "border rounded w-20 h-8 px-2 text-right text-xs"
//                       }
//                       name="display_rate"
//                       value={it.display_rate === 0 ? "" : it?.display_rate}
//                       onChange={(e) => onItem(i, e)}
//                     />
//                     <div className="text-[10px] text-gray-500 text-right">
//                       {useCostMargin && !it.manualRate
//                         ? `Margin: ${getMarginPercentByQty(
//                             it.qty || 0,
//                             form.buyer_type
//                           )}% ${
//                             form.buyer_type === "Retailer"
//                               ? "(fixed)"
//                               : "(auto)"
//                           }`
//                         : "Manual rate"}
//                       <br />
//                       {it.unit ? `Per ${it.unit}` : "Per kg"} |{" "}
//                       {fx(it.rate_per_kg, 2)}/kg
//                     </div>
//                   </td>

//                   <td className="px-2 py-1 border text-right">
//                     {fx(amount, 3)}
//                   </td>

//                   <td className="px-2 py-1 border text-right">
//                     <input
//                       type="number"
//                       className="border rounded w-16 h-8 px-2 text-right text-xs"
//                       name="d1_percent"
//                       value={it.d1_percent === 0 ? "" : it?.d1_percent}
//                       onChange={(e) => onItem(i, e)}
//                     />
//                   </td>

//                   <td className="px-2 py-1 border text-right">
//                     <div className="flex flex-col items-end">
//                       <input
//                         type="text"
//                         className="border rounded w-20 h-8 px-2 text-right text-xs bg-gray-100 cursor-not-allowed"
//                         value={fx(discPerUnit, 3)}
//                         readOnly
//                       />
//                       <div className="text-[10px] text-gray-500">
//                         x {it.qty || 0} = {fx(discTotal, 3)}
//                       </div>
//                     </div>
//                   </td>

//                   <td className="px-2 py-1 border text-right">
//                     <span className="font-semibold">{fx(discTotal, 3)}</span>
//                   </td>

//                   <td className="px-2 py-1 border text-right">
//                     <input
//                       type="number"
//                       className="border rounded w-16 h-8 px-2 text-right text-xs"
//                       name="gst_percent"
//                       value={it.gst_percent === 0 ? "" : it?.gst_percent}
//                       onChange={(e) => onItem(i, e)}
//                     />
//                   </td>

//                   <td className="px-2 py-1 border text-right">
//                     {fx(gstAmt, 3)}
//                   </td>
//                   <td className="px-2 py-1 border text-right">
//                     {fx(finalAmt, 3)}
//                   </td>

//                   <td className="px-2 py-1 border text-center">
//                     <button
//                       type="button"
//                       className="h-8 w-8 grid place-items-center rounded-full bg-red-100 text-red-600 hover:bg-red-200"
//                       onClick={() => removeItem(i)}
//                     >
//                       ×
//                     </button>
//                   </td>
//                 </tr>
//               );
//             })}
//           </tbody>

//           <tfoot>
//             <tr className="bg-gray-100 font-semibold text-right text-xs">
//               <td className="px-2 py-1 border text-center"></td>
//               <td className="px-2 py-1 border text-left">Totals</td>
//               <td className="px-2 py-1 border text-left"></td>
//               <td className="px-2 py-1 border text-center"></td>
//               <td className="px-2 py-1 border text-center">
//                 Total Qty (kg): {fx(totals.totalQtyKg, 3)}
//               </td>
//               <td className="px-2 py-1 border text-center"></td>
//               <td className="px-2 py-1 border text-right">
//                 {fx(
//                   form.items.reduce(
//                     (a, r) => a + Number(r.rate_per_kg || 0),
//                     0
//                   ),
//                   3
//                 )}
//               </td>
//               <td className="px-2 py-1 border text-right">
//                 {fx(totals.taxable, 3)}
//               </td>
//               <td className="px-2 py-1 border text-right"></td>
//               <td className="px-2 py-1 border text-right">—</td>
//               <td className="px-2 py-1 border text-right">
//                 {fx(
//                   form.items.reduce((a, r) => {
//                     const c = calcLine({
//                       qty: Number(r.qty || 0),
//                       rate: Number(r.rate_per_kg || 0),
//                       d1_percent: Number(r.d1_percent || 0),
//                       gst_percent: Number(r.gst_percent || 0),
//                       unit: r.unit || r.product_unit || "kg",
//                     });
//                     return a + c.discTotal;
//                   }, 0),
//                   3
//                 )}
//               </td>
//               <td className="px-2 py-1 border text-right"></td>
//               <td className="px-2 py-1 border text-right">
//                 {fx(totals.gst, 3)}
//               </td>
//               <td className="px-2 py-1 border text-right">
//                 {fx(totals.final, 3)}
//               </td>
//               <td className="px-2 py-1 border text-center"></td>
//             </tr>
//             <tr>
//               <td className="px-2 py-1 border" colSpan={14}>
//                 <button
//                   className="px-2 py-1 bg-gray-200 rounded text-xs"
//                   onClick={(e) => {
//                     e.preventDefault();
//                     addItem();
//                   }}
//                   type="button"
//                 >
//                   Add Row
//                 </button>
//               </td>
//             </tr>
//           </tfoot>
//         </table>
//       </div>

//       {/* Actions */}
//       <div className="flex justify-end gap-3 mt-4">
//         <button
//           type="button"
//           className="px-4 py-2 bg-gray-200 rounded-lg"
//           onClick={() => {
//             setForm({
//               so_no: "",
//               party_id: "",
//               date: "",
//               bill_time: "",
//               bill_time_am_pm: "PM",
//               address: "",
//               mobile_no: "",
//               gst_no: "",
//               place_of_supply: "",
//               terms_condition: "",
//               buyer_type: "Retailer",
//               items: [
//                 {
//                   product_id: "",
//                   hsn_code: "",
//                   qty: 1,
//                   rate_per_kg: 0,
//                   display_rate: 0,
//                   d1_percent: 0,
//                   gst_percent: 0,
//                   cost_rate: 0,
//                   available_grams: 0,
//                   manualRate: false,
//                   unit: "",
//                   product_unit: "",
//                 },
//               ],
//             });
//           }}
//         >
//           Reset
//         </button>

//         <button
//           type="submit"
//           disabled={!isValid || loading}
//           className={`px-6 py-2 rounded-lg text-white ${
//             !isValid || loading
//               ? "bg-green-700/50 cursor-not-allowed"
//               : "bg-green-700 hover:bg-green-800 active:scale-95"
//           }`}
//         >
//           {isEditMode ? "Update SO" : "Create SO"}
//         </button>
//       </div>
//     </form>
//   );
// }

import React, { useEffect, useMemo, useState } from "react";
import { refApi, soApi } from "../../axios/soApi.js";
import sequenceAPI from "../../axios/sequenceAPI.js";
import Swal from "sweetalert2";
import { useDispatch, useSelector } from "react-redux";
import { fetchVendors } from "../../features/vendor/vendorThunks.js";
import { fetchFarmers } from "../../features/farmers/farmerSlice.js";

const fx = (n, d = 2) => (isNaN(n) ? (0).toFixed(d) : Number(n).toFixed(d));

// Unit conversion constants (to grams)
const UNIT_CONVERSIONS = {
  ton: 1000000, // 1 ton = 1,000,000 grams
  quantal: 100000, // 1 quantal = 100,000 grams
  kg: 1000, // 1 kg = 1,000 grams
  gram: 1, // 1 gram = 1 gram
};

// Add margin calculation functions
const getMarginPercentByQty = (qty, buyerType) => {
  // If buyer is retailer, always return 50% margin regardless of quantity
  if (buyerType === "Retailer") {
    return 50;
  }

  // For wholesalers, use the existing quantity-based logic
  const q = Number(qty) || 0;
  if (q >= 1 && q <= 4) return 50;
  if (q >= 5 && q <= 9) return 30;
  if (q >= 10) return 25;
  return 0;
};

const calcLine = (r) => {
  // Convert quantity from selected unit to kg for calculation
  let qtyInKg = 0;
  if (r.unit && r.unit !== "") {
    // Convert from selected unit to grams, then to kg
    const qtyInGrams = Number(r.qty || 0) * UNIT_CONVERSIONS[r.unit];
    qtyInKg = qtyInGrams / 1000; // Convert grams to kg
  } else {
    // Default to kg if no unit selected
    qtyInKg = Number(r.qty || 0);
  }

  const rate = Number(r.rate) || 0; // rate is per kg
  const d1 = Number(r.d1_percent) || 0;
  const gst = Number(r.gst_percent) || 0;
  const amount = qtyInKg * rate;
  const discPerUnit = (rate * d1) / 100;
  const discTotal = discPerUnit * qtyInKg;
  const taxable = Math.max(amount - discTotal, 0);
  const gstAmt = (taxable * gst) / 100;
  const finalAmt = taxable + gstAmt;
  return {
    amount,
    discPerUnit,
    discTotal,
    taxable,
    gstAmt,
    finalAmt,
    qtyInKg, // Return qty in kg for total calculations
  };
};

// Helper function to convert grams to selected unit
const convertFromGrams = (grams, unit) => {
  if (!unit || !UNIT_CONVERSIONS[unit]) return grams / 1000; // Default to kg
  return grams / UNIT_CONVERSIONS[unit];
};

// Helper function to convert from selected unit to grams
const convertToGrams = (quantity, unit) => {
  if (!unit || !UNIT_CONVERSIONS[unit]) return quantity * 1000; // Default to kg
  return quantity * UNIT_CONVERSIONS[unit];
};

// Helper function to convert rate from per kg to per selected unit
const getRateForUnit = (ratePerKg, unit) => {
  if (!unit || !UNIT_CONVERSIONS[unit]) return ratePerKg;

  // Convert rate per kg to rate per unit
  // Example: 100 Rs/kg = 100 * 1000 (g/kg) / UNIT_CONVERSIONS[unit] (g/unit)
  const ratePerGram = ratePerKg / 1000; // Rs per gram
  return ratePerGram * UNIT_CONVERSIONS[unit];
};

// Helper function to convert rate from per unit to per kg
const getRatePerKgFromUnit = (ratePerUnit, unit) => {
  if (!unit || !UNIT_CONVERSIONS[unit]) return ratePerUnit;

  // Convert rate per unit to rate per kg
  // Example: For Quintal (100 kg): ratePerQuintal / 100
  const ratePerGram = ratePerUnit / UNIT_CONVERSIONS[unit];
  return ratePerGram * 1000; // Rs per kg
};

// Helper function to convert grams to KG (for display only)
const convertGramsToKG = (grams) => {
  const g = Number(grams) || 0;
  return g / 1000; // Convert grams to KG
};

// Helper function to convert display unit to KG for calculations
const convertToKGForCalculations = (quantity, unit) => {
  const qty = Number(quantity) || 0;
  switch (unit) {
    case "ton":
      return qty * 1000; // 1 ton = 1,000 KG
    case "quantal":
      return qty * 100; // 1 quantal = 100 KG
    case "kg":
      return qty; // Already in KG
    case "gram":
      return qty / 1000; // Convert grams to KG
    default:
      return qty; // Assume already in KG
  }
};

export default function CreateSalesOrder({ so = null, onSaved }) {
  const isEditMode = Boolean(so);
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [useCostMargin] = useState(true); // Add this state

  const [form, setForm] = useState({
    so_no: "",
    party_id: "",
    party_type: "",
    buyer_type: "Retailer", // Set default to Retailer
    payment_method: "",
    date: new Date().toISOString().split("T")[0],
    bill_time: "",
    bill_time_am_pm: "PM",
    address: "",
    mobile_no: "",
    gst_no: "",
    place_of_supply: "",
    terms_condition: "",
    other_amount: "",
    other_note: "",
    items: [
      {
        product_id: "",
        hsn_code: "",
        qty: 0,
        rate: 0,
        d1_percent: 0,
        gst_percent: 0,
        cost_rate: 0, // Add cost_rate to track the base cost
        available_grams: 0, // Available quantity in grams
        manualRate: false, // Add manualRate flag
        discount_25: 0,
        discount_30: 0,
        discount_50: 0,
        total_50: 0,
        unit: "",
        product_unit: "", // Store the product's base unit
        display_rate: 0, // Rate displayed based on selected unit
        rate_per_kg: 0, // Rate per kg (for calculations)
      },
    ],
  });

  // Add function to recompute selling rate based on margin
  const recomputeSellingRate = (item, buyerTypeOverride) => {
    const q = Number(item.qty) || 0;
    const base = Number(item.cost_rate) || 0; // product.value as base cost
    const buyerType = buyerTypeOverride || form.buyer_type || "";

    if (useCostMargin && !item.manualRate) {
      const bt = String(buyerType).toLowerCase();
      const isWholesale =
        bt === "whole saler" || bt === "wholesaler" || bt === "wholesale";

      let selling = base;

      if (!isWholesale || q < 5) {
        // Default 50% margin case – use explicit total/discount_50 if available
        const explicitTotal = Number(item.total_50 || 0);
        const explicitDisc50 = Number(item.discount_50 || 0);

        if (explicitTotal > 0) {
          selling = explicitTotal;
        } else if (explicitDisc50 > 0) {
          selling = base + explicitDisc50;
        } else {
          selling = base * 1.5;
        }
      } else if (q >= 5 && q < 10) {
        // Wholesale 5–9 qty → base + discount_30
        selling = base + (Number(item.discount_30) || 0);
      } else if (q >= 10) {
        // Wholesale qty >= 10 → base + discount_25
        selling = base + (Number(item.discount_25) || 0);
      }

      return Number.isFinite(selling) ? selling : base;
    }
    return item.rate_per_kg || 0; // Return rate per kg
  };

  useEffect(() => {
    (async () => {
      try {
        const [cRes, pRes, seqRes] = await Promise.all([
          refApi.customers(),
          refApi.products(),
          sequenceAPI.next("so", { prefix: "SO-", pad: 6 }),
        ]);

        setCustomers(cRes.data || []);
        const plist = pRes.data?.list || pRes.data || [];
        const normalized = plist.map((p) => ({
          id: p.id ?? p._id,
          product_name: p.product_name,
          hsn_code: p.hsn_code || "",
          default_rate: Number(p.sale_rate ?? p.rate ?? p.value ?? 0), // This is per kg
          default_gst: Number(p.gst_percent ?? p.gst_rate ?? p.gst ?? 0),
          available: Number(p.size ?? p.stock ?? p.available ?? 0), // This is in grams
          // use base value as cost, discounts as absolute margin amounts, and keep total (50% margin) if provided
          cost_rate: Number(p.value ?? p.total ?? 0), // Cost per kg
          discount_25: Number(p.discount_25 || 0),
          discount_30: Number(p.discount_30 || 0),
          discount_50: Number(p.discount_50 || 0),
          total_50: Number(p.total || 0),
          unit: p.unit || "kg", // Product's base unit
          raw: p,
        }));
        setProducts(normalized);
        if (!isEditMode) {
          setForm((prev) => ({ ...prev, so_no: seqRes.data?.value || "" }));
        }
      } catch (e) {
        console.error(e);
        alert(
          e?.response?.data?.error ||
            e.message ||
            "Failed to load reference data"
        );
      }
    })();
  }, [isEditMode, form?.party_type]);

  useEffect(() => {
    if (!isEditMode || !so) return;
    const normalizedDate = so.date
      ? new Date(so.date).toISOString().split("T")[0]
      : "";
    setForm((p) => ({
      ...p,
      so_no: so.so_no || "",
      party_id: String(so.party_id || ""),
      party_type: so.party_type,
      buyer_type: so.buyer_type || "Retailer",
      date: normalizedDate,
      bill_time: "",
      bill_time_am_pm: "PM",
      address: so.address || "",
      mobile_no: so.mobile_no || "",
      gst_no: so.gst_no || "",
      place_of_supply: so.place_of_supply || "",
      terms_condition: so.terms_condition || "",
      items: so.items?.map((it) => {
        const prod = products.find(
          (x) => String(x.id) === String(it.product_id)
        );
        const unit = it.unit || prod?.unit || "kg";
        const availableGrams = prod?.available || 0;

        return {
          id: it.id || it._id,
          product_id: String(it.product_id || ""),
          hsn_code: it.hsn_code || prod?.hsn_code || "",
          qty: Number(it.qty || 0),
          rate_per_kg: Number(it.rate || prod?.default_rate || 0),
          d1_percent: Number(it.discount_per_qty ?? 0),
          gst_percent: Number(it.gst_percent ?? prod?.default_gst ?? 0),
          cost_rate: Number(prod?.cost_rate || 0),
          available_grams: availableGrams,
          product_unit: prod?.unit || "kg",
          unit: unit,
          display_rate: getRateForUnit(
            Number(it.rate || prod?.default_rate || 0),
            unit
          ),
          manualRate: true, // In edit mode, assume rates are manual
          discount_25: Number(prod?.discount_25 || 0),
          discount_30: Number(prod?.discount_30 || 0),
          discount_50: Number(prod?.discount_50 || 0),
          total_50: Number(prod?.total_50 || 0),
        };
      }) || [
        {
          product_id: "",
          hsn_code: "",
          qty: 1,
          rate_per_kg: 0,
          d1_percent: 0,
          gst_percent: 0,
          cost_rate: 0,
          available_grams: 0,
          product_unit: "",
          unit: "",
          display_rate: 0,
          manualRate: false,
        },
      ],
    }));
  }, [isEditMode, so, products]);

  const onHeader = (e) => {
    const { name, value } = e.target;

    if (name === "buyer_type") {
      // Recompute rates on buyer type change for non-manual rows
      setForm((prev) => {
        const next = { ...prev, [name]: value };
        next.items = next.items.map((row) => {
          if (useCostMargin && !row.manualRate && row.cost_rate > 0) {
            const newRatePerKg = recomputeSellingRate(row, value);
            const newDisplayRate = getRateForUnit(
              newRatePerKg,
              row.unit || row.product_unit
            );
            return {
              ...row,
              rate_per_kg: Number.isFinite(newRatePerKg) ? newRatePerKg : 0,
              display_rate: Number.isFinite(newDisplayRate)
                ? newDisplayRate
                : 0,
            };
          }
          return row;
        });
        return next;
      });
      return;
    }

    if (name === "party_id") {
      const c = customers.find((x) => String(x.id) === String(value));
      if (c) {
        setForm((p) => ({
          ...p,
          party_id: String(value),
          address: c.address || "",
          mobile_no: c.phone || "",
          gst_no: c.add_gst ? c.gst_no || "" : "",
        }));
        return;
      }
    }
    if (name === "other_amount") {
      const v = Math.max(0, Number(value || 0));
      setForm((p) => ({ ...p, other_amount: v }));
      return;
    }
    setForm((p) => ({ ...p, [name]: value }));
  };

  const onItem = (i, e) => {
    const { name, value } = e.target;

    setForm((prev) => {
      const next = { ...prev };
      const row = { ...next.items[i] };

      const numeric = [
        "qty",
        "display_rate",
        "d1_percent",
        "gst_percent",
        "product_id",
      ];
      row[name] = numeric.includes(name)
        ? value === ""
          ? ""
          : Number(value)
        : value;

      // When product_id changes → update product details
      if (name === "product_id") {
        const p = products.find((x) => String(x.id) === String(value));
        row.hsn_code = p?.hsn_code || "";
        row.cost_rate = Number(p?.cost_rate || 0);
        row.available_grams = Number(p?.available || 0); // Store in grams
        row.product_unit = p?.unit || "kg";
        row.discount_25 = Number(p?.discount_25 || 0);
        row.discount_30 = Number(p?.discount_30 || 0);
        row.discount_50 = Number(p?.discount_50 || 0);
        row.total_50 = Number(p?.total_50 || 0);
        row.unit = p?.unit || "kg"; // Set initial unit from product

        // Set initial rate based on margin calculation
        if ((!row.rate_per_kg || row.rate_per_kg === 0) && p?.cost_rate > 0) {
          const initialRatePerKg = recomputeSellingRate({
            ...row,
            cost_rate: p.cost_rate,
            qty: 1,
            manualRate: false,
          });
          row.rate_per_kg = initialRatePerKg;
          row.display_rate = getRateForUnit(initialRatePerKg, row.unit);
          row.manualRate = false;
        } else if (p?.default_rate != null) {
          row.rate_per_kg = Number(p.default_rate);
          row.display_rate = getRateForUnit(Number(p.default_rate), row.unit);
          row.manualRate = true;
        }

        if (
          (!row.gst_percent || row.gst_percent === 0) &&
          p?.default_gst != null
        )
          row.gst_percent = Number(p.default_gst);
      }

      // When quantity changes, update rate if not manually set
      if (
        name === "qty" &&
        useCostMargin &&
        !row.manualRate &&
        row.cost_rate > 0
      ) {
        const newRatePerKg = recomputeSellingRate(row);
        row.rate_per_kg = newRatePerKg;
        row.display_rate = getRateForUnit(newRatePerKg, row.unit);
      }

      // When display_rate is manually changed, mark as manual rate and convert to per kg
      if (name === "display_rate") {
        row.manualRate = true;
        row.rate_per_kg = getRatePerKgFromUnit(Number(value) || 0, row.unit);
      }

      // When unit changes, update display_rate and validate quantity
      if (name === "unit") {
        const oldUnit = row.unit;
        row.unit = value;

        // Convert display rate to new unit
        if (row.rate_per_kg > 0) {
          row.display_rate = getRateForUnit(row.rate_per_kg, value);
        }

        // Convert quantity if it was entered in old unit
        if (row.qty > 0 && oldUnit && oldUnit !== "" && value && value !== "") {
          // Convert qty from old unit to grams, then to new unit
          const qtyInGrams = convertToGrams(row.qty, oldUnit);
          row.qty = convertFromGrams(qtyInGrams, value);
        }
      }

      // Validation: if qty > available → alert user
      if (name === "qty" || name === "unit") {
        const availableInSelectedUnit = convertFromGrams(
          row.available_grams || 0,
          row.unit
        );
        if (Number(row.qty || 0) > availableInSelectedUnit) {
          alert("Given quantity should not be greater than available quantity");
          row.qty = availableInSelectedUnit;
        }
      }

      next.items = next.items.map((r, idx) => (idx === i ? row : r));

      return next;
    });
  };

  const addItem = () =>
    setForm((p) => ({
      ...p,
      items: [
        ...p.items,
        {
          product_id: "",
          hsn_code: "",
          qty: 1,
          rate_per_kg: 0,
          display_rate: 0,
          d1_percent: 0,
          gst_percent: 0,
          cost_rate: 0,
          available_grams: 0,
          manualRate: false,
          unit: "",
          product_unit: "",
          discount_25: 0,
          discount_30: 0,
          discount_50: 0,
          total_50: 0,
        },
      ],
    }));

  const removeItem = (i) =>
    setForm((p) => ({
      ...p,
      items: p.items.filter((_, idx) => idx !== i),
    }));

  const totals = useMemo(() => {
    return form.items.reduce(
      (a, r) => {
        const c = calcLine({
          qty: Number(r.qty || 0),
          rate: Number(r.rate_per_kg || 0),
          d1_percent: Number(r.d1_percent || 0),
          gst_percent: Number(r.gst_percent || 0),
          unit: r.unit || r.product_unit || "kg",
        });
        a.taxable += c.taxable;
        a.gst += c.gstAmt;
        a.final += c.finalAmt;
        a.totalQtyKg += c.qtyInKg;
        return a;
      },
      { taxable: 0, gst: 0, final: 0, totalQtyKg: 0 }
    );
  }, [form.items]);

  const isValid = useMemo(() => {
    const headOk = form.so_no && form.date && Number(form.party_id) > 0;
    const itemsOk =
      form.items.length > 0 &&
      form.items.every(
        (r) =>
          Number(r.product_id) > 0 &&
          Number(r.qty) > 0 &&
          Number(r.rate_per_kg) > 0 &&
          r.unit &&
          r.unit !== ""
      );
    return Boolean(headOk && itemsOk);
  }, [form]);

  const onSubmit = async (e) => {
    e.preventDefault();

    const result = await Swal.fire({
      title: "Confirm",
      text: `Are you sure you want to ${
        isEditMode ? "update" : "create"
      } this Sales Order?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes",
      cancelButtonText: "No",
    });

    if (!result.isConfirmed) return;

    try {
      setLoading(true);
      let [h = "00", m = "00"] = String(form.bill_time || "00:00").split(":");
      let hour = Number(h);
      let minute = Number(m);
      if (isNaN(hour)) hour = 0;
      if (isNaN(minute)) minute = 0;
      if (form.bill_time_am_pm === "PM" && hour < 12) hour += 12;
      if (form.bill_time_am_pm === "AM" && hour === 12) hour = 0;
      const bill_time = form.date
        ? `${form.date} ${String(hour).padStart(2, "0")}:${String(
            minute
          ).padStart(2, "0")}:00`
        : null;

      const items = form.items.map((r) => ({
        id: r.id,
        product_id: Number(r.product_id),
        hsn_code: r.hsn_code || "",
        qty: Number(r.qty || 0),
        rate: Number(r.rate_per_kg || 0), // Store rate per kg
        discount_per_qty: Number(r.d1_percent || 0),
        gst_percent: Number(r.gst_percent || 0),
        unit: r.unit || "", // Store the selected unit
      }));

      const payload = {
        so_no: form.so_no,
        party_type: form?.party_type,
        party_id: Number(form.party_id),
        buyer_type: form.buyer_type,
        date: form.date || null,
        bill_time,
        address: form.address || "",
        mobile_no: form.mobile_no || "",
        gst_no: form.gst_no || "",
        place_of_supply: form.place_of_supply || "",
        terms_condition: form.terms_condition || "",
        other_amount: Number(form.other_amount || 0),
        other_note: form.other_note || "",
        items,
      };

      if (isEditMode) {
        await soApi.update(so.id || so._id, payload);
      } else {
        await soApi.create(payload);
      }

      setLoading(false);
      onSaved && onSaved();

      if (!isEditMode) {
        setForm({
          so_no: "",
          party_id: "",
          date: "",
          bill_time: "",
          bill_time_am_pm: "PM",
          address: "",
          mobile_no: "",
          gst_no: "",
          place_of_supply: "",
          terms_condition: "",
          other_amount: 0,
          other_note: "",
          buyer_type: "Retailer",
          items: [
            {
              product_id: "",
              hsn_code: "",
              qty: 1,
              rate_per_kg: 0,
              display_rate: 0,
              d1_percent: 0,
              gst_percent: 0,
              cost_rate: 0,
              available_grams: 0,
              manualRate: false,
              unit: "",
              product_unit: "",
            },
          ],
        });
      }
    } catch (err) {
      console.error(err);
      const msg =
        err?.response?.data?.error ||
        (err?.message?.includes("ER_DUP_ENTRY")
          ? "SO number already exists. Please use a unique SO No."
          : err.message) ||
        "Failed to save SO";
      alert(msg);
      setLoading(false);
    }
  };

  const dispatch = useDispatch();

  const onPartyTypeChange = (e) => {
    const val = e.target.value;
    setForm((prev) => ({
      ...prev,
      party_type: val,
    }));

    if (val == "Vendor") {
      dispatch(fetchFarmers());
    } else {
      dispatch(fetchVendors());
    }
  };

  const { list } = useSelector((state) => state.farmers);
  const { vendors } = useSelector((state) => state.vendors);

  return (
    <form onSubmit={onSubmit} className="bg-white rounded-xl mb-6">
      {/* Title */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold">
          {isEditMode ? "Edit Sales Order" : "Create Sales Order"}
        </h3>
        <div className="text-right text-xs text-gray-500">
          <div>
            Date: <span className="font-medium">{form.date || "-"}</span>
          </div>
          <div>
            Time: <span className="font-medium">{form.bill_time || "-"}</span>
          </div>
        </div>
      </div>

      {/* Summary + Header */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Summary Card */}
        <div className="lg:col-span-1">
          <div className="bg-white border rounded-xl shadow-sm p-4">
            <div className="text-sm font-semibold text-gray-800 mb-2">
              Payment Summary
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Old Remaining</span>
                <span className="font-semibold">{fx(0, 3)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Sale Total</span>
                <span className="font-semibold">{fx(totals.final, 3)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Due After Pay</span>
                <span className="font-semibold">{fx(totals.final, 3)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Status</span>
                <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-green-100 text-green-700">
                  Paid
                </span>
              </div>

              <div className="pt-2 border-t space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Party</span>
                  <span className="text-gray-800">
                    {customers.find(
                      (x) => Number(x.id) === Number(form.party_id)
                    )?.name || "-"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Paid Amount</span>
                  <span className="text-gray-800">{fx(0, 3)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Header Card */}
        <div className="lg:col-span-2">
          <div className="bg-white border rounded-xl shadow-sm p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {isEditMode && (
                <div className="flex flex-col">
                  <label className="text-sm text-gray-600 mb-1">SO No</label>
                  <input
                    type="text"
                    className="border rounded-lg p-2"
                    name="so_no"
                    value={form.so_no}
                    onChange={onHeader}
                    placeholder="Enter SO Number"
                    readOnly={!isEditMode}
                  />
                </div>
              )}

              <div className="flex flex-col">
                <label className="text-sm text-gray-600 mb-1">Date</label>
                <input
                  type="date"
                  className="border rounded-lg p-2"
                  name="date"
                  value={form.date}
                  onChange={onHeader}
                />
              </div>

              <div className="flex flex-col">
                <label className="text-sm text-gray-600 mb-1">Party Type</label>
                <select
                  className="border rounded p-1"
                  value={form.party_type}
                  onChange={onPartyTypeChange}
                >
                  <option value="Customer">Customer</option>
                  <option value="Vendor">Vendor</option>
                  <option value="Farmer">Farmer</option>
                </select>
              </div>

              <div className="flex flex-col">
                <label className="text-sm text-gray-600 mb-1">
                  {form?.party_type == "Vendor"
                    ? "Firm/Vendor"
                    : form?.party_type === "Customer"
                    ? "Customer"
                    : "Farmer"}
                </label>
                <select
                  className="border rounded-lg p-2"
                  name="party_id"
                  value={form.party_id}
                  onChange={onHeader}
                >
                  <option value="">Select</option>

                  {form.party_type === "Customer"
                    ? customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))
                    : form.party_type === "Vendor"
                    ? vendors.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.vendor_name}
                        </option>
                      ))
                    : list.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                </select>
              </div>

              <div className="flex flex-col">
                <label className="text-sm text-gray-600 mb-1">
                  Paid Amount
                </label>
                <input
                  className="border rounded-lg p-2"
                  placeholder="0"
                  value={0}
                  readOnly
                />
                <span className="text-[10px] text-gray-500">
                  Max allowed: 0.000
                </span>
              </div>

              <div className="flex flex-col">
                <label className="text-sm text-gray-600 mb-1">Mobile No.</label>
                <input
                  className="border rounded-lg p-2"
                  name="mobile_no"
                  value={form.mobile_no}
                  onChange={onHeader}
                  placeholder="Mobile"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-sm text-gray-600 mb-1">GST No.</label>
                <input
                  className="border rounded-lg p-2"
                  name="gst_no"
                  value={form.gst_no}
                  onChange={onHeader}
                  placeholder="GST No."
                />
              </div>

              <div className="flex flex-col lg:col-span-2">
                <label className="text-sm text-gray-600 mb-1">Address</label>
                <input
                  className="border rounded-lg p-2"
                  name="address"
                  value={form.address}
                  onChange={onHeader}
                  placeholder="Address"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-sm text-gray-600 mb-1">
                  Other Amount
                </label>
                <input
                  type="number"
                  className="border rounded-lg p-2"
                  name="other_amount"
                  value={form.other_amount}
                  onChange={onHeader}
                  min={0}
                  placeholder="e.g. 100"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-sm text-gray-600 mb-1">Remark</label>
                <input
                  className="border rounded-lg p-2"
                  name="other_note"
                  value={form.other_note}
                  onChange={onHeader}
                  placeholder="e.g. Transportation"
                />
              </div>

              <div className="flex flex-col lg:col-span-2">
                <label className="text-sm text-gray-600 mb-1">
                  Party Balance
                </label>
                <input
                  className="border rounded-lg p-2 bg-gray-100"
                  value={fx(0, 3)}
                  readOnly
                />
              </div>

              <div className="flex flex-col">
                <label className="text-sm text-gray-600 mb-1">
                  Payment Method
                </label>
                <select
                  className="border rounded-lg p-2"
                  name="payment_method"
                  value={form.payment_method}
                  onChange={onHeader}
                >
                  <option>Cash</option>
                  <option>UPI</option>
                  <option>Card</option>
                  <option>Bank</option>
                  <option>Credit</option>
                </select>
              </div>

              <div className="flex flex-col">
                <label className="text-sm text-gray-600 mb-1">
                  select type
                </label>
                <select
                  className="border p-2 rounded-lg"
                  name="buyer_type"
                  value={form.buyer_type}
                  onChange={onHeader}
                >
                  <option>Retailer</option>
                  <option>Whole Saler</option>
                </select>
              </div>

              <div className="flex flex-col">
                <label className="text-sm text-gray-600 mb-1">
                  Payment Status
                </label>
                <div className="inline-flex items-center px-2 py-1 rounded text-xs bg-green-100 text-green-700 w-min">
                  Paid
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full border text-xs">
          <thead className="bg-green-700 text-white">
            <tr>
              <th className="px-2 py-2 border text-center w-10">S.No</th>
              <th className="px-2 py-2 border text-left">Item Name</th>
              <th className="px-2 py-2 border text-left">HSNCode</th>
              <th className="px-2 py-2 border text-center w-20">
                Aval QTY (KG)
              </th>{" "}
              {/* Updated */}
              <th className="px-2 py-2 border text-center w-16">QTY</th>
              <th className="px-2 py-2 border text-center w-16">Unit</th>
              <th className="px-2 py-2 border text-right">Rate</th>
              <th className="px-2 py-2 border text-right">Amount</th>
              <th className="px-2 py-2 border text-right">Disc %</th>
              <th className="px-2 py-2 border text-right">Per Qty Disc</th>
              <th className="px-2 py-2 border text-right">Total Disc</th>
              <th className="px-2 py-2 border text-right">GST%</th>
              <th className="px-2 py-2 border text-right">GST Amt</th>
              <th className="px-2 py-2 border text-right">FinalAmt</th>
              <th className="px-2 py-2 border text-center w-16">Actions</th>
            </tr>
          </thead>

          <tbody>
            {form.items.map((it, i) => {
              const { amount, discPerUnit, discTotal, gstAmt, finalAmt } =
                calcLine({
                  qty: Number(it.qty || 0),
                  rate: Number(it.rate_per_kg || 0),
                  d1_percent: Number(it.d1_percent || 0),
                  gst_percent: Number(it.gst_percent || 0),
                  unit: it.unit || it.product_unit || "kg",
                });

              // Convert available grams to KG for display
              const availableInKG = convertGramsToKG(it.available_grams || 0);

              // Calculate available in selected unit for validation
              const availableInSelectedUnit = convertFromGrams(
                it.available_grams || 0,
                it.unit
              );

              return (
                <tr key={i} className="odd:bg-white even:bg-gray-50">
                  <td className="px-2 py-1 border text-center">{i + 1}</td>

                  <td className="px-2 py-1 border">
                    <div className="flex gap-1">
                      <select
                        className="border rounded p-1 w-44"
                        name="product_id"
                        value={it.product_id}
                        onChange={(e) => onItem(i, e)}
                      >
                        <option value="">Select</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.product_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>

                  <td className="px-2 py-1 border bg-gray-100">
                    <input
                      readOnly
                      className="border rounded w-full h-8 px-2 text-xs"
                      name="hsn_code"
                      value={it.hsn_code || ""}
                    />
                  </td>

                  <td className="px-2 py-1 border text-center">
                    <input
                      readOnly
                      className="border rounded p-1 w-20 bg-gray-100"
                      value={fx(availableInKG, 3)}
                      title={`Current stock: ${
                        it.available_grams || 0
                      } grams (${fx(availableInKG, 3)} KG)`}
                    />
                    <div className="text-[8px] text-gray-500">in KG</div>
                  </td>

                  <td className="px-2 py-1 border text-center">
                    <input
                      type="number"
                      min={0}
                      step="0.001"
                      className="border rounded w-16 h-8 px-2 text-center text-xs"
                      name="qty"
                      value={it.qty === 0 ? "" : it?.qty}
                      onChange={(e) => onItem(i, e)}
                      max={availableInSelectedUnit}
                    />
                    <div className="text-[8px] text-gray-500">
                      Max: {fx(availableInSelectedUnit, 3)} {it.unit}
                    </div>
                  </td>

                  <td className="px-2 py-1 border">
                    <div className="flex gap-1">
                      <select
                        className="border rounded p-1 w-44"
                        name="unit"
                        value={it.unit}
                        onChange={(e) => onItem(i, e)}
                      >
                        <option value="">Select</option>
                        <option value="ton">Ton</option>
                        <option value="quantal">Quantal</option>
                        <option value="kg">KG</option>
                        <option value="gram">Gram</option>
                      </select>
                    </div>
                  </td>

                  <td className="px-2 py-1 border text-right">
                    <input
                      type="number"
                      step="0.01"
                      className={
                        "border rounded w-20 h-8 px-2 text-right text-xs"
                      }
                      name="display_rate"
                      value={it.display_rate === 0 ? "" : it?.display_rate}
                      onChange={(e) => onItem(i, e)}
                    />
                    <div className="text-[10px] text-gray-500 text-right">
                      {useCostMargin && !it.manualRate
                        ? `Margin: ${getMarginPercentByQty(
                            it.qty || 0,
                            form.buyer_type
                          )}% ${
                            form.buyer_type === "Retailer"
                              ? "(fixed)"
                              : "(auto)"
                          }`
                        : "Manual rate"}
                      <br />
                      {it.unit ? `Per ${it.unit}` : "Per kg"} |{" "}
                      {fx(it.rate_per_kg, 2)}/kg
                    </div>
                  </td>

                  <td className="px-2 py-1 border text-right">
                    {fx(amount, 3)}
                  </td>

                  <td className="px-2 py-1 border text-right">
                    <input
                      type="number"
                      className="border rounded w-16 h-8 px-2 text-right text-xs"
                      name="d1_percent"
                      value={it.d1_percent === 0 ? "" : it?.d1_percent}
                      onChange={(e) => onItem(i, e)}
                    />
                  </td>

                  <td className="px-2 py-1 border text-right">
                    <div className="flex flex-col items-end">
                      <input
                        type="text"
                        className="border rounded w-20 h-8 px-2 text-right text-xs bg-gray-100 cursor-not-allowed"
                        value={fx(discPerUnit, 3)}
                        readOnly
                      />
                      <div className="text-[10px] text-gray-500">
                        x {it.qty || 0} = {fx(discTotal, 3)}
                      </div>
                    </div>
                  </td>

                  <td className="px-2 py-1 border text-right">
                    <span className="font-semibold">{fx(discTotal, 3)}</span>
                  </td>

                  <td className="px-2 py-1 border text-right">
                    <input
                      type="number"
                      className="border rounded w-16 h-8 px-2 text-right text-xs"
                      name="gst_percent"
                      value={it.gst_percent === 0 ? "" : it?.gst_percent}
                      onChange={(e) => onItem(i, e)}
                    />
                  </td>

                  <td className="px-2 py-1 border text-right">
                    {fx(gstAmt, 3)}
                  </td>
                  <td className="px-2 py-1 border text-right">
                    {fx(finalAmt, 3)}
                  </td>

                  <td className="px-2 py-1 border text-center">
                    <button
                      type="button"
                      className="h-8 w-8 grid place-items-center rounded-full bg-red-100 text-red-600 hover:bg-red-200"
                      onClick={() => removeItem(i)}
                    >
                      ×
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>

          <tfoot>
            <tr className="bg-gray-100 font-semibold text-right text-xs">
              <td className="px-2 py-1 border text-center"></td>
              <td className="px-2 py-1 border text-left">Totals</td>
              <td className="px-2 py-1 border text-left"></td>
              <td className="px-2 py-1 border text-center"></td>
              <td className="px-2 py-1 border text-center">
                Total Qty (kg): {fx(totals.totalQtyKg, 3)}
              </td>
              <td className="px-2 py-1 border text-center"></td>
              <td className="px-2 py-1 border text-right">
                {fx(
                  form.items.reduce(
                    (a, r) => a + Number(r.rate_per_kg || 0),
                    0
                  ),
                  3
                )}
              </td>
              <td className="px-2 py-1 border text-right">
                {fx(totals.taxable, 3)}
              </td>
              <td className="px-2 py-1 border text-right"></td>
              <td className="px-2 py-1 border text-right">—</td>
              <td className="px-2 py-1 border text-right">
                {fx(
                  form.items.reduce((a, r) => {
                    const c = calcLine({
                      qty: Number(r.qty || 0),
                      rate: Number(r.rate_per_kg || 0),
                      d1_percent: Number(r.d1_percent || 0),
                      gst_percent: Number(r.gst_percent || 0),
                      unit: r.unit || r.product_unit || "kg",
                    });
                    return a + c.discTotal;
                  }, 0),
                  3
                )}
              </td>
              <td className="px-2 py-1 border text-right"></td>
              <td className="px-2 py-1 border text-right">
                {fx(totals.gst, 3)}
              </td>
              <td className="px-2 py-1 border text-right">
                {fx(totals.final, 3)}
              </td>
              <td className="px-2 py-1 border text-center"></td>
            </tr>
            <tr>
              <td className="px-2 py-1 border" colSpan={14}>
                <button
                  className="px-2 py-1 bg-gray-200 rounded text-xs"
                  onClick={(e) => {
                    e.preventDefault();
                    addItem();
                  }}
                  type="button"
                >
                  Add Row
                </button>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 mt-4">
        <button
          type="button"
          className="px-4 py-2 bg-gray-200 rounded-lg"
          onClick={() => {
            setForm({
              so_no: "",
              party_id: "",
              date: "",
              bill_time: "",
              bill_time_am_pm: "PM",
              address: "",
              mobile_no: "",
              gst_no: "",
              place_of_supply: "",
              terms_condition: "",
              buyer_type: "Retailer",
              items: [
                {
                  product_id: "",
                  hsn_code: "",
                  qty: 1,
                  rate_per_kg: 0,
                  display_rate: 0,
                  d1_percent: 0,
                  gst_percent: 0,
                  cost_rate: 0,
                  available_grams: 0,
                  manualRate: false,
                  unit: "",
                  product_unit: "",
                },
              ],
            });
          }}
        >
          Reset
        </button>

        <button
          type="submit"
          disabled={!isValid || loading}
          className={`px-6 py-2 rounded-lg text-white ${
            !isValid || loading
              ? "bg-green-700/50 cursor-not-allowed"
              : "bg-green-700 hover:bg-green-800 active:scale-95"
          }`}
        >
          {isEditMode ? "Update SO" : "Create SO"}
        </button>
      </div>
    </form>
  );
}

// import React, { useEffect, useMemo, useState } from "react";
// import { refApi, soApi } from "../../axios/soApi.js";
// import sequenceAPI from "../../axios/sequenceAPI.js";
// import Swal from "sweetalert2";
// import { useDispatch, useSelector } from "react-redux";
// import { fetchVendors } from "../../features/vendor/vendorThunks.js";
// import { fetchFarmers } from "../../features/farmers/farmerSlice.js";

// const fx = (n, d = 2) => (isNaN(n) ? (0).toFixed(d) : Number(n).toFixed(d));

// // Unit conversion constants (all rates are per kg)
// const UNIT_CONVERSIONS = {
//   kg: 1,
//   kgs: 1,
//   kilogram: 1,
//   kilograms: 1,
//   g: 0.001,
//   gm: 0.001,
//   gram: 0.001,
//   grams: 0.001,
//   ton: 1000,
//   tonne: 1000,
//   tonnes: 1000,
//   quintal: 100,
//   quintals: 100,
//   q: 100,
//   qtl: 100,
//   l: 1,
//   liter: 1,
//   liters: 1,
//   ml: 0.001,
//   milliliter: 0.001,
//   milliliters: 0.001,
//   pcs: 1,
//   pc: 1,
//   piece: 1,
//   pieces: 1,
//   bag: 50,
//   bags: 50,
//   sack: 50,
//   sacks: 50,
//   "": 1,
//   null: 1,
//   undefined: 1,
// };

// // Function to convert quantity to kg
// const convertToKg = (quantity, unit) => {
//   if (!quantity && quantity !== 0) return 0;

//   const qty = Number(quantity);
//   const unitKey = (unit || "").toLowerCase().trim();
//   const conversionFactor = UNIT_CONVERSIONS[unitKey] || 1;

//   return qty * conversionFactor;
// };

// // Function to get unit display
// const getUnitDisplay = (unit) => {
//   if (!unit) return "kg";

//   const unitMap = {
//     kg: "kg",
//     kgs: "kg",
//     kilogram: "kg",
//     kilograms: "kg",
//     g: "g",
//     gm: "g",
//     gram: "g",
//     grams: "g",
//     ton: "ton",
//     tonne: "ton",
//     tonnes: "ton",
//     quintal: "qtl",
//     quintals: "qtl",
//     q: "qtl",
//     qtl: "qtl",
//     l: "L",
//     liter: "L",
//     liters: "L",
//     ml: "ml",
//     milliliter: "ml",
//     milliliters: "ml",
//     pcs: "pcs",
//     pc: "pcs",
//     piece: "pcs",
//     pieces: "pcs",
//     bag: "bag",
//     bags: "bag",
//     sack: "sack",
//     sacks: "sack",
//   };

//   return unitMap[unit.toLowerCase()] || unit;
// };

// const getMarginPercentByQty = (qty, buyerType) => {
//   if (buyerType === "Retailer") {
//     return 50;
//   }

//   const q = Number(qty) || 0;
//   if (q >= 1 && q <= 4) return 50;
//   if (q >= 5 && q <= 9) return 30;
//   if (q >= 10) return 25;
//   return 0;
// };

// // Calculate line with unit conversion
// const calcLine = (item) => {
//   const qty = Number(item.qty) || 0;
//   const unit = item.unit || "";
//   const rate = Number(item.rate) || 0; // Rate is per kg
//   const d1 = Number(item.d1_percent) || 0;
//   const gst = Number(item.gst_percent) || 0;

//   // Convert quantity to kg for calculation
//   const qtyInKg = convertToKg(qty, unit);

//   // Calculate amount based on kg quantity
//   const amount = qtyInKg * rate;
//   const discPerUnit = (rate * d1) / 100;
//   const discTotal = discPerUnit * qtyInKg; // Discount in kg terms
//   const taxable = Math.max(amount - discTotal, 0);
//   const gstAmt = (taxable * gst) / 100;
//   const finalAmt = taxable + gstAmt;

//   return {
//     amount,
//     discPerUnit,
//     discTotal,
//     taxable,
//     gstAmt,
//     finalAmt,
//     qtyInKg,
//   };
// };

// export default function CreateSalesOrder({ so = null, onSaved }) {
//   const isEditMode = Boolean(so);
//   const [loading, setLoading] = useState(false);
//   const [customers, setCustomers] = useState([]);
//   const [products, setProducts] = useState([]);
//   const [useCostMargin] = useState(true);

//   const [form, setForm] = useState({
//     so_no: "",
//     party_id: "",
//     party_type: "Customer",
//     buyer_type: "Retailer",
//     payment_method: "Cash",
//     date: new Date().toISOString().split("T")[0],
//     bill_time: "",
//     bill_time_am_pm: "PM",
//     address: "",
//     mobile_no: "",
//     gst_no: "",
//     place_of_supply: "",
//     terms_condition: "",
//     other_amount: "",
//     other_note: "",
//     items: [
//       {
//         product_id: "",
//         hsn_code: "",
//         qty: 0,
//         unit: "kg",
//         rate: 0,
//         d1_percent: 0,
//         gst_percent: 0,
//         cost_rate: 0,
//         available: 0,
//         available_in_kg: 0,
//         manualRate: false,
//         discount_25: 0,
//         discount_30: 0,
//         discount_50: 0,
//         total_50: 0,
//       },
//     ],
//   });

//   const recomputeSellingRate = (item, buyerTypeOverride) => {
//     const q = Number(item.qty) || 0;
//     const base = Number(item.cost_rate) || 0;
//     const buyerType = buyerTypeOverride || form.buyer_type || "";

//     if (useCostMargin && !item.manualRate && base > 0) {
//       const bt = String(buyerType).toLowerCase();
//       const isWholesale =
//         bt === "whole saler" || bt === "wholesaler" || bt === "wholesale";

//       let selling = base;

//       if (!isWholesale || q < 5) {
//         const explicitTotal = Number(item.total_50 || 0);
//         const explicitDisc50 = Number(item.discount_50 || 0);

//         if (explicitTotal > 0) {
//           selling = explicitTotal;
//         } else if (explicitDisc50 > 0) {
//           selling = base + explicitDisc50;
//         } else {
//           selling = base * 1.5;
//         }
//       } else if (q >= 5 && q < 10) {
//         selling = base + (Number(item.discount_30) || 0);
//       } else if (q >= 10) {
//         selling = base + (Number(item.discount_25) || 0);
//       }

//       return Number.isFinite(selling) ? selling : base;
//     }
//     return item.rate || 0;
//   };

//   useEffect(() => {
//     (async () => {
//       try {
//         const [cRes, pRes, seqRes] = await Promise.all([
//           refApi.customers(),
//           refApi.products(),
//           sequenceAPI.next("so", { prefix: "SO-", pad: 6 }),
//         ]);

//         setCustomers(cRes.data || []);
//         const plist = pRes.data?.list || pRes.data || [];
//         const normalized = plist.map((p) => {
//           const unit = p.unit || "kg";
//           const available = Number(p.size ?? p.stock ?? p.available ?? 0);
//           const availableInKg = convertToKg(available, unit);

//           return {
//             id: p.id ?? p._id,
//             product_name: p.product_name,
//             hsn_code: p.hsn_code || "",
//             default_rate: Number(p.sale_rate ?? p.rate ?? p.value ?? 0),
//             default_gst: Number(p.gst_percent ?? p.gst_rate ?? p.gst ?? 0),
//             available: available,
//             available_in_kg: availableInKg,
//             unit: unit,
//             cost_rate: Number(p.value ?? p.total ?? 0),
//             discount_25: Number(p.discount_25 || 0),
//             discount_30: Number(p.discount_30 || 0),
//             discount_50: Number(p.discount_50 || 0),
//             total_50: Number(p.total || 0),
//             raw: p,
//           };
//         });
//         setProducts(normalized);
//         if (!isEditMode) {
//           setForm((prev) => ({ ...prev, so_no: seqRes.data?.value || "" }));
//         }
//       } catch (e) {
//         console.error(e);
//         Swal.fire("Error", "Failed to load reference data", "error");
//       }
//     })();
//   }, [isEditMode, form?.party_type]);

//   useEffect(() => {
//     if (!isEditMode || !so) return;
//     const normalizedDate = so.date
//       ? new Date(so.date).toISOString().split("T")[0]
//       : "";

//     setForm((p) => ({
//       ...p,
//       so_no: so.so_no || "",
//       party_id: String(so.party_id || ""),
//       party_type: so.party_type,
//       buyer_type: so.buyer_type || "Retailer",
//       date: normalizedDate,
//       bill_time: "",
//       bill_time_am_pm: "PM",
//       address: so.address || "",
//       mobile_no: so.mobile_no || "",
//       gst_no: so.gst_no || "",
//       place_of_supply: so.place_of_supply || "",
//       terms_condition: so.terms_condition || "",
//       items: so.items?.map((it) => {
//         const prod = products.find(
//           (x) => String(x.id) === String(it.product_id)
//         );
//         return {
//           id: it.id || it._id,
//           product_id: String(it.product_id || ""),
//           hsn_code: it.hsn_code || prod?.hsn_code || "",
//           qty: Number(it.qty || 0),
//           unit: it.unit || prod?.unit || "kg",
//           rate: Number(it.rate || prod?.default_rate || 0),
//           d1_percent: Number(it.discount_per_qty ?? 0),
//           gst_percent: Number(it.gst_percent ?? prod?.default_gst ?? 0),
//           cost_rate: Number(prod?.cost_rate || 0),
//           available: Number(prod?.available || 0),
//           available_in_kg: Number(prod?.available_in_kg || 0),
//           manualRate: true,
//         };
//       }) || [
//         {
//           product_id: "",
//           hsn_code: "",
//           qty: 1,
//           unit: "kg",
//           rate: 0,
//           d1_percent: 0,
//           gst_percent: 0,
//           cost_rate: 0,
//           available: 0,
//           available_in_kg: 0,
//           manualRate: false,
//         },
//       ],
//     }));
//   }, [isEditMode, so, products]);

//   const onHeader = (e) => {
//     const { name, value } = e.target;

//     if (name === "buyer_type") {
//       setForm((prev) => {
//         const next = { ...prev, [name]: value };
//         next.items = next.items.map((row) => {
//           if (useCostMargin && !row.manualRate && row.cost_rate > 0) {
//             const newRate = recomputeSellingRate(row, value);
//             return { ...row, rate: Number.isFinite(newRate) ? newRate : 0 };
//           }
//           return row;
//         });
//         return next;
//       });
//       return;
//     }

//     if (name === "party_id") {
//       const c = customers.find((x) => String(x.id) === String(value));
//       if (c) {
//         setForm((p) => ({
//           ...p,
//           party_id: String(value),
//           address: c.address || "",
//           mobile_no: c.phone || c.mobile || "",
//           gst_no: c.gst_no || c.add_gst || "",
//         }));
//         return;
//       }
//     }

//     if (name === "other_amount") {
//       const v = Math.max(0, Number(value || 0));
//       setForm((p) => ({ ...p, other_amount: v }));
//       return;
//     }

//     setForm((p) => ({ ...p, [name]: value }));
//   };

//   const onItem = (i, e) => {
//     const { name, value } = e.target;

//     setForm((prev) => {
//       const next = { ...prev };
//       const row = { ...next.items[i] };

//       const numeric = [
//         "qty",
//         "rate",
//         "d1_percent",
//         "gst_percent",
//         "product_id",
//       ];
//       row[name] = numeric.includes(name)
//         ? value === ""
//           ? ""
//           : Number(value)
//         : value;

//       if (name === "product_id") {
//         const p = products.find((x) => String(x.id) === String(value));
//         if (p) {
//           row.hsn_code = p.hsn_code || "";
//           row.cost_rate = Number(p.cost_rate || 0);
//           row.available = Number(p.available || 0);
//           row.available_in_kg = Number(p.available_in_kg || 0);
//           row.discount_25 = Number(p.discount_25 || 0);
//           row.discount_30 = Number(p.discount_30 || 0);
//           row.discount_50 = Number(p.discount_50 || 0);
//           row.total_50 = Number(p.total_50 || 0);
//           row.unit = p.unit || "kg";

//           if ((!row.rate || row.rate === 0) && p.cost_rate > 0) {
//             const initialRate = recomputeSellingRate({
//               ...row,
//               cost_rate: p.cost_rate,
//               qty: 1,
//               manualRate: false,
//             });
//             row.rate = initialRate;
//             row.manualRate = false;
//           } else if (p.default_rate != null) {
//             row.rate = Number(p.default_rate);
//             row.manualRate = true;
//           }

//           if (
//             (!row.gst_percent || row.gst_percent === 0) &&
//             p.default_gst != null
//           ) {
//             row.gst_percent = Number(p.default_gst);
//           }
//         }
//       }

//       if (
//         name === "qty" &&
//         useCostMargin &&
//         !row.manualRate &&
//         row.cost_rate > 0
//       ) {
//         const newRate = recomputeSellingRate(row);
//         row.rate = newRate;
//       }

//       if (name === "rate") {
//         row.manualRate = true;
//       }

//       // Validate quantity against available stock
//       if (name === "qty" || name === "unit") {
//         const qty = Number(row.qty || 0);
//         const unit = row.unit || "kg";
//         const qtyInKg = convertToKg(qty, unit);

//         if (row.available_in_kg > 0 && qtyInKg > row.available_in_kg) {
//           Swal.fire({
//             title: "Insufficient Stock",
//             text: `Available: ${row.available} ${getUnitDisplay(
//               row.unit
//             )} (≈${fx(
//               row.available_in_kg
//             )} kg)\nRequested: ${qty} ${getUnitDisplay(unit)} (≈${fx(
//               qtyInKg
//             )} kg)`,
//             icon: "warning",
//             confirmButtonText: "OK",
//           });
//           // Reset to available quantity
//           if (name === "qty") {
//             row.qty = row.available;
//           }
//         }
//       }

//       next.items = next.items.map((r, idx) => (idx === i ? row : r));
//       return next;
//     });
//   };

//   const addItem = () =>
//     setForm((p) => ({
//       ...p,
//       items: [
//         ...p.items,
//         {
//           product_id: "",
//           hsn_code: "",
//           qty: 1,
//           unit: "kg",
//           rate: 0,
//           d1_percent: 0,
//           gst_percent: 0,
//           cost_rate: 0,
//           available: 0,
//           available_in_kg: 0,
//           manualRate: false,
//         },
//       ],
//     }));

//   const removeItem = (i) =>
//     setForm((p) => ({
//       ...p,
//       items: p.items.filter((_, idx) => idx !== i),
//     }));

//   const totals = useMemo(() => {
//     return form.items.reduce(
//       (acc, item) => {
//         const calc = calcLine(item);
//         acc.taxable += calc.taxable;
//         acc.gst += calc.gstAmt;
//         acc.final += calc.finalAmt;
//         acc.totalQty += Number(item.qty || 0);
//         acc.totalQtyInKg += calc.qtyInKg;
//         return acc;
//       },
//       { taxable: 0, gst: 0, final: 0, totalQty: 0, totalQtyInKg: 0 }
//     );
//   }, [form.items]);

//   const isValid = useMemo(() => {
//     const headOk = form.so_no && form.date && Number(form.party_id) > 0;
//     const itemsOk =
//       form.items.length > 0 &&
//       form.items.every(
//         (r) =>
//           Number(r.product_id) > 0 && Number(r.qty) > 0 && Number(r.rate) > 0
//       );

//     // Check stock availability
//     const stockOk = form.items.every((item) => {
//       const qtyInKg = convertToKg(item.qty, item.unit);
//       return item.available_in_kg >= qtyInKg;
//     });

//     return Boolean(headOk && itemsOk && stockOk);
//   }, [form]);

//   const onSubmit = async (e) => {
//     e.preventDefault();

//     const result = await Swal.fire({
//       title: "Confirm",
//       text: `Are you sure you want to ${
//         isEditMode ? "update" : "create"
//       } this Sales Order?`,
//       icon: "question",
//       showCancelButton: true,
//       confirmButtonText: "Yes",
//       cancelButtonText: "No",
//     });

//     if (!result.isConfirmed) return;

//     try {
//       setLoading(true);

//       let [h = "00", m = "00"] = String(form.bill_time || "00:00").split(":");
//       let hour = Number(h);
//       let minute = Number(m);
//       if (isNaN(hour)) hour = 0;
//       if (isNaN(minute)) minute = 0;
//       if (form.bill_time_am_pm === "PM" && hour < 12) hour += 12;
//       if (form.bill_time_am_pm === "AM" && hour === 12) hour = 0;

//       const bill_time = form.date
//         ? `${form.date} ${String(hour).padStart(2, "0")}:${String(
//             minute
//           ).padStart(2, "0")}:00`
//         : null;

//       const items = form.items.map((r) => {
//         const qtyInKg = convertToKg(r.qty, r.unit);
//         return {
//           id: r.id,
//           product_id: Number(r.product_id),
//           hsn_code: r.hsn_code || "",
//           qty: Number(r.qty || 0),
//           unit: r.unit || "kg",
//           qty_in_kg: qtyInKg,
//           rate: Number(r.rate || 0),
//           discount_per_qty: Number(r.d1_percent || 0),
//           gst_percent: Number(r.gst_percent || 0),
//           amount: qtyInKg * Number(r.rate || 0),
//         };
//       });

//       const payload = {
//         so_no: form.so_no,
//         party_type: form.party_type,
//         party_id: Number(form.party_id),
//         buyer_type: form.buyer_type,
//         date: form.date || null,
//         bill_time,
//         address: form.address || "",
//         mobile_no: form.mobile_no || "",
//         gst_no: form.gst_no || "",
//         place_of_supply: form.place_of_supply || "",
//         terms_condition: form.terms_condition || "",
//         other_amount: Number(form.other_amount || 0),
//         other_note: form.other_note || "",
//         items,
//         totals: {
//           taxable: totals.taxable,
//           gst: totals.gst,
//           final: totals.final + Number(form.other_amount || 0),
//           total_qty: totals.totalQty,
//           total_qty_in_kg: totals.totalQtyInKg,
//         },
//       };

//       if (isEditMode) {
//         await soApi.update(so.id || so._id, payload);
//       } else {
//         await soApi.create(payload);
//       }

//       setLoading(false);

//       Swal.fire({
//         title: "Success!",
//         text: `Sales Order ${isEditMode ? "updated" : "created"} successfully`,
//         icon: "success",
//         timer: 2000,
//       });

//       onSaved && onSaved();

//       if (!isEditMode) {
//         // Reset form
//         const seqRes = await sequenceAPI.next("so", { prefix: "SO-", pad: 6 });
//         setForm({
//           so_no: seqRes.data?.value || "",
//           party_id: "",
//           party_type: "Customer",
//           buyer_type: "Retailer",
//           payment_method: "Cash",
//           date: new Date().toISOString().split("T")[0],
//           bill_time: "",
//           bill_time_am_pm: "PM",
//           address: "",
//           mobile_no: "",
//           gst_no: "",
//           place_of_supply: "",
//           terms_condition: "",
//           other_amount: "",
//           other_note: "",
//           items: [
//             {
//               product_id: "",
//               hsn_code: "",
//               qty: 0,
//               unit: "kg",
//               rate: 0,
//               d1_percent: 0,
//               gst_percent: 0,
//               cost_rate: 0,
//               available: 0,
//               available_in_kg: 0,
//               manualRate: false,
//             },
//           ],
//         });
//       }
//     } catch (err) {
//       console.error(err);
//       const msg =
//         err?.response?.data?.error ||
//         (err?.message?.includes("ER_DUP_ENTRY")
//           ? "SO number already exists. Please use a unique SO No."
//           : err.message) ||
//         "Failed to save SO";

//       Swal.fire("Error", msg, "error");
//       setLoading(false);
//     }
//   };

//   const dispatch = useDispatch();

//   const onPartyTypeChange = (e) => {
//     const val = e.target.value;
//     setForm((prev) => ({
//       ...prev,
//       party_type: val,
//       party_id: "",
//       address: "",
//       mobile_no: "",
//       gst_no: "",
//     }));

//     if (val === "Farmer") {
//       dispatch(fetchFarmers());
//     } else if (val === "Vendor") {
//       dispatch(fetchVendors());
//     }
//   };

//   const { list: farmers = [] } = useSelector((state) => state.farmers || {});
//   const { vendors = [] } = useSelector((state) => state.vendors || {});

//   return (
//     <form onSubmit={onSubmit} className="bg-white rounded-xl">
//       {/* Title */}
//       <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 p-4 border-b">
//         <div>
//           <h3 className="text-xl font-bold text-gray-800">
//             {isEditMode ? "Edit Sales Order" : "Create Sales Order"}
//           </h3>
//           <p className="text-sm text-gray-600 mt-1">
//             Create new sales order with accurate calculations
//           </p>
//         </div>
//         <div className="flex items-center gap-4 mt-2 md:mt-0">
//           <div className="text-right">
//             <div className="text-sm text-gray-500">Date</div>
//             <div className="font-medium">{form.date || "-"}</div>
//           </div>
//           <div className="text-right">
//             <div className="text-sm text-gray-500">Time</div>
//             <div className="font-medium">{form.bill_time || "-"}</div>
//           </div>
//         </div>
//       </div>

//       {/* Summary + Header */}
//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-4">
//         {/* Summary Card */}
//         <div className="lg:col-span-1">
//           <div className="bg-gradient-to-br from-blue-50 to-white border border-blue-100 rounded-xl shadow-sm p-5">
//             <div className="flex items-center justify-between mb-4">
//               <h4 className="font-semibold text-gray-800">Payment Summary</h4>
//               <div className="text-blue-600 bg-blue-100 p-2 rounded-full">
//                 <svg
//                   className="w-5 h-5"
//                   fill="currentColor"
//                   viewBox="0 0 20 20"
//                 >
//                   <path
//                     fillRule="evenodd"
//                     d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"
//                     clipRule="evenodd"
//                   />
//                 </svg>
//               </div>
//             </div>

//             <div className="space-y-4">
//               <div className="flex items-center justify-between">
//                 <span className="text-sm text-gray-600">Sale Total</span>
//                 <span className="font-bold text-lg text-gray-800">
//                   ₹{fx(totals.final, 2)}
//                 </span>
//               </div>

//               <div className="pt-3 border-t space-y-2">
//                 <div className="flex items-center justify-between">
//                   <span className="text-xs text-gray-500">Party</span>
//                   <span className="text-sm text-gray-800 font-medium">
//                     {(() => {
//                       if (form.party_type === "Customer") {
//                         return (
//                           customers.find(
//                             (c) => String(c.id) === String(form.party_id)
//                           )?.name || "-"
//                         );
//                       } else if (form.party_type === "Vendor") {
//                         return (
//                           vendors.find(
//                             (v) => String(v.id) === String(form.party_id)
//                           )?.vendor_name || "-"
//                         );
//                       } else {
//                         return (
//                           farmers.find(
//                             (f) => String(f.id) === String(form.party_id)
//                           )?.name || "-"
//                         );
//                       }
//                     })()}
//                   </span>
//                 </div>
//                 <div className="flex items-center justify-between">
//                   <span className="text-xs text-gray-500">Payment Status</span>
//                   <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-green-100 text-green-700">
//                     To be Paid
//                   </span>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Header Card */}
//         <div className="lg:col-span-2">
//           <div className="bg-white border rounded-xl shadow-sm p-5">
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//               {!isEditMode && (
//                 <div className="flex flex-col">
//                   <label className="text-sm font-medium text-gray-700 mb-1">
//                     SO No *
//                   </label>
//                   <input
//                     type="text"
//                     className="border rounded-lg p-3 bg-gray-50"
//                     name="so_no"
//                     value={form.so_no}
//                     onChange={onHeader}
//                     placeholder="Enter SO Number"
//                     required
//                     readOnly
//                   />
//                 </div>
//               )}

//               <div className="flex flex-col">
//                 <label className="text-sm font-medium text-gray-700 mb-1">
//                   Date *
//                 </label>
//                 <input
//                   type="date"
//                   className="border rounded-lg p-3"
//                   name="date"
//                   value={form.date}
//                   onChange={onHeader}
//                   required
//                 />
//               </div>

//               <div className="flex flex-col">
//                 <label className="text-sm font-medium text-gray-700 mb-1">
//                   Party Type *
//                 </label>
//                 <select
//                   className="border rounded-lg p-3"
//                   value={form.party_type}
//                   onChange={onPartyTypeChange}
//                   required
//                 >
//                   <option value="Customer">Customer</option>
//                   <option value="Vendor">Vendor</option>
//                   <option value="Farmer">Farmer</option>
//                 </select>
//               </div>

//               <div className="flex flex-col">
//                 <label className="text-sm font-medium text-gray-700 mb-1">
//                   {form.party_type === "Customer"
//                     ? "Customer *"
//                     : form.party_type === "Vendor"
//                     ? "Vendor *"
//                     : "Farmer *"}
//                 </label>
//                 <select
//                   className="border rounded-lg p-3"
//                   name="party_id"
//                   value={form.party_id}
//                   onChange={onHeader}
//                   required
//                 >
//                   <option value="">Select {form.party_type}</option>
//                   {form.party_type === "Customer"
//                     ? customers.map((c) => (
//                         <option key={c.id} value={c.id}>
//                           {c.name}
//                         </option>
//                       ))
//                     : form.party_type === "Vendor"
//                     ? vendors.map((v) => (
//                         <option key={v.id} value={v.id}>
//                           {v.vendor_name}
//                         </option>
//                       ))
//                     : farmers.map((f) => (
//                         <option key={f.id} value={f.id}>
//                           {f.name}
//                         </option>
//                       ))}
//                 </select>
//               </div>

//               <div className="flex flex-col">
//                 <label className="text-sm font-medium text-gray-700 mb-1">
//                   Buyer Type *
//                 </label>
//                 <select
//                   className="border rounded-lg p-3"
//                   name="buyer_type"
//                   value={form.buyer_type}
//                   onChange={onHeader}
//                   required
//                 >
//                   <option value="Retailer">Retailer</option>
//                   <option value="Whole Saler">Whole Saler</option>
//                 </select>
//               </div>

//               <div className="flex flex-col">
//                 <label className="text-sm font-medium text-gray-700 mb-1">
//                   Mobile No.
//                 </label>
//                 <input
//                   className="border rounded-lg p-3"
//                   name="mobile_no"
//                   value={form.mobile_no}
//                   onChange={onHeader}
//                   placeholder="Mobile"
//                 />
//               </div>

//               <div className="flex flex-col">
//                 <label className="text-sm font-medium text-gray-700 mb-1">
//                   GST No.
//                 </label>
//                 <input
//                   className="border rounded-lg p-3"
//                   name="gst_no"
//                   value={form.gst_no}
//                   onChange={onHeader}
//                   placeholder="GST No."
//                 />
//               </div>

//               <div className="flex flex-col md:col-span-2">
//                 <label className="text-sm font-medium text-gray-700 mb-1">
//                   Address
//                 </label>
//                 <input
//                   className="border rounded-lg p-3"
//                   name="address"
//                   value={form.address}
//                   onChange={onHeader}
//                   placeholder="Complete address"
//                 />
//               </div>

//               <div className="flex flex-col">
//                 <label className="text-sm font-medium text-gray-700 mb-1">
//                   Other Amount
//                 </label>
//                 <input
//                   type="number"
//                   className="border rounded-lg p-3"
//                   name="other_amount"
//                   value={form.other_amount}
//                   onChange={onHeader}
//                   min={0}
//                   placeholder="e.g. 100"
//                 />
//               </div>

//               <div className="flex flex-col md:col-span-2">
//                 <label className="text-sm font-medium text-gray-700 mb-1">
//                   Remark
//                 </label>
//                 <input
//                   className="border rounded-lg p-3"
//                   name="other_note"
//                   value={form.other_note}
//                   onChange={onHeader}
//                   placeholder="e.g. Transportation charges"
//                 />
//               </div>

//               <div className="flex flex-col">
//                 <label className="text-sm font-medium text-gray-700 mb-1">
//                   Payment Method
//                 </label>
//                 <select
//                   className="border rounded-lg p-3"
//                   name="payment_method"
//                   value={form.payment_method}
//                   onChange={onHeader}
//                 >
//                   <option value="Cash">Cash</option>
//                   <option value="UPI">UPI</option>
//                   <option value="Card">Card</option>
//                   <option value="Bank">Bank Transfer</option>
//                   <option value="Credit">Credit</option>
//                 </select>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Items Table */}
//       <div className="mt-6 p-4">
//         <div className="flex items-center justify-between mb-4">
//           <h4 className="text-lg font-semibold text-gray-800">Order Items</h4>
//           <button
//             type="button"
//             className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
//             onClick={addItem}
//           >
//             <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
//               <path
//                 fillRule="evenodd"
//                 d="M10 3a1 1 0 00-1 1v5H4a1 1 0 100 2h5v5a1 1 0 102 0v-5h5a1 1 0 100-2h-5V4a1 1 0 00-1-1z"
//                 clipRule="evenodd"
//               />
//             </svg>
//             Add Item
//           </button>
//         </div>

//         <div className="overflow-x-auto">
//           <table className="min-w-full border border-gray-200 text-sm">
//             <thead className="bg-gray-800 text-white">
//               <tr>
//                 <th className="px-3 py-3 border text-center w-12">#</th>
//                 <th className="px-3 py-3 border text-left">Product</th>
//                 <th className="px-3 py-3 border text-left w-20">HSN</th>
//                 <th className="px-3 py-3 border text-center w-24">Available</th>
//                 <th className="px-3 py-3 border text-center w-20">Qty</th>
//                 <th className="px-3 py-3 border text-center w-24">Unit</th>
//                 <th className="px-3 py-3 border text-right w-28">
//                   Rate/kg (₹)
//                 </th>
//                 <th className="px-3 py-3 border text-right w-24">Amount (₹)</th>
//                 <th className="px-3 py-3 border text-right w-20">Disc %</th>
//                 <th className="px-3 py-3 border text-right w-28">
//                   Per Qty Disc
//                 </th>
//                 <th className="px-3 py-3 border text-right w-24">Total Disc</th>
//                 <th className="px-3 py-3 border text-right w-20">GST %</th>
//                 <th className="px-3 py-3 border text-right w-28">
//                   GST Amt (₹)
//                 </th>
//                 <th className="px-3 py-3 border text-right w-32">
//                   Final Amt (₹)
//                 </th>
//                 <th className="px-3 py-3 border text-center w-16">Action</th>
//               </tr>
//             </thead>

//             <tbody>
//               {form.items.map((it, i) => {
//                 const {
//                   amount,
//                   discPerUnit,
//                   discTotal,
//                   gstAmt,
//                   finalAmt,
//                   qtyInKg,
//                 } = calcLine(it);
//                 const availableInKg = convertToKg(it.available || 0, it.unit);
//                 const stockStatus =
//                   qtyInKg <= availableInKg ? "text-green-600" : "text-red-600";

//                 return (
//                   <tr key={i} className="border-b hover:bg-gray-50">
//                     <td className="px-3 py-3 border text-center font-medium">
//                       {i + 1}
//                     </td>

//                     <td className="px-3 py-3 border">
//                       <select
//                         className="border rounded p-2 w-full"
//                         name="product_id"
//                         value={it.product_id}
//                         onChange={(e) => onItem(i, e)}
//                         required
//                       >
//                         <option value="">Select Product</option>
//                         {products.map((p) => (
//                           <option key={p.id} value={p.id}>
//                             {p.product_name}
//                           </option>
//                         ))}
//                       </select>
//                     </td>

//                     <td className="px-3 py-3 border bg-gray-50">
//                       <input
//                         readOnly
//                         className="border-0 bg-transparent w-full text-center"
//                         value={it.hsn_code || "-"}
//                       />
//                     </td>

//                     <td className="px-3 py-3 border text-center">
//                       <div className="flex flex-col">
//                         <span className={`font-medium ${stockStatus}`}>
//                           {fx(it.available || 0, 2)}
//                         </span>
//                         <span className="text-xs text-gray-500">
//                           {fx(availableInKg, 2)} kg
//                         </span>
//                       </div>
//                     </td>

//                     <td className="px-3 py-3 border">
//                       <input
//                         type="number"
//                         min={0.001}
//                         step={0.001}
//                         className="border rounded p-2 w-full text-center"
//                         name="qty"
//                         value={it.qty === 0 ? "" : it.qty}
//                         onChange={(e) => onItem(i, e)}
//                         required
//                       />
//                     </td>

//                     <td className="px-3 py-3 border">
//                       <select
//                         className="border rounded p-2 w-full"
//                         name="unit"
//                         value={it.unit}
//                         onChange={(e) => onItem(i, e)}
//                       >
//                         <option value="kg">KG</option>
//                         <option value="ton">Ton</option>
//                         <option value="quintal">Quintal</option>
//                         <option value="gram">Gram</option>
//                         <option value="l">Liter</option>
//                         <option value="ml">ML</option>
//                         <option value="pcs">Pieces</option>
//                         <option value="bag">Bag</option>
//                       </select>
//                     </td>

//                     <td className="px-3 py-3 border text-right">
//                       <div className="flex flex-col items-end">
//                         <input
//                           type="number"
//                           min={0}
//                           step={0.01}
//                           className="border rounded p-2 w-full text-right"
//                           name="rate"
//                           value={it.rate === 0 ? "" : it.rate}
//                           onChange={(e) => onItem(i, e)}
//                           required
//                         />
//                         <div className="text-xs text-gray-500 mt-1">
//                           {useCostMargin && !it.manualRate ? (
//                             <span className="text-green-600">
//                               Auto:{" "}
//                               {getMarginPercentByQty(
//                                 it.qty || 0,
//                                 form.buyer_type
//                               )}
//                               % margin
//                             </span>
//                           ) : (
//                             <span className="text-blue-600">Manual rate</span>
//                           )}
//                         </div>
//                       </div>
//                     </td>

//                     <td className="px-3 py-3 border text-right font-medium">
//                       ₹{fx(amount, 2)}
//                       <div className="text-xs text-gray-500">
//                         {fx(qtyInKg, 3)} kg × ₹{fx(it.rate || 0, 2)}
//                       </div>
//                     </td>

//                     <td className="px-3 py-3 border text-right">
//                       <input
//                         type="number"
//                         min={0}
//                         max={100}
//                         step={0.01}
//                         className="border rounded p-2 w-full text-right"
//                         name="d1_percent"
//                         value={it.d1_percent === 0 ? "" : it.d1_percent}
//                         onChange={(e) => onItem(i, e)}
//                       />
//                     </td>

//                     <td className="px-3 py-3 border text-right text-gray-600">
//                       ₹{fx(discPerUnit, 3)}
//                     </td>

//                     <td className="px-3 py-3 border text-right font-medium text-red-600">
//                       -₹{fx(discTotal, 2)}
//                     </td>

//                     <td className="px-3 py-3 border text-right">
//                       <input
//                         type="number"
//                         min={0}
//                         max={100}
//                         step={0.01}
//                         className="border rounded p-2 w-full text-right"
//                         name="gst_percent"
//                         value={it.gst_percent === 0 ? "" : it.gst_percent}
//                         onChange={(e) => onItem(i, e)}
//                       />
//                     </td>

//                     <td className="px-3 py-3 border text-right text-blue-600">
//                       ₹{fx(gstAmt, 2)}
//                     </td>

//                     <td className="px-3 py-3 border text-right font-bold text-green-700">
//                       ₹{fx(finalAmt, 2)}
//                     </td>

//                     <td className="px-3 py-3 border text-center">
//                       <button
//                         type="button"
//                         className="p-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition"
//                         onClick={() => removeItem(i)}
//                         disabled={form.items.length === 1}
//                       >
//                         <svg
//                           className="w-5 h-5"
//                           fill="currentColor"
//                           viewBox="0 0 20 20"
//                         >
//                           <path
//                             fillRule="evenodd"
//                             d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
//                             clipRule="evenodd"
//                           />
//                         </svg>
//                       </button>
//                     </td>
//                   </tr>
//                 );
//               })}
//             </tbody>

//             <tfoot className="bg-gray-50">
//               <tr>
//                 <td
//                   colSpan={4}
//                   className="px-3 py-3 border text-right font-semibold"
//                 >
//                   Totals:
//                 </td>
//                 <td className="px-3 py-3 border text-center font-semibold">
//                   {fx(totals.totalQty, 3)}
//                 </td>
//                 <td className="px-3 py-3 border text-center font-semibold">
//                   {fx(totals.totalQtyInKg, 3)} kg
//                 </td>
//                 <td className="px-3 py-3 border text-right font-semibold">—</td>
//                 <td className="px-3 py-3 border text-right font-semibold">
//                   ₹
//                   {fx(
//                     form.items.reduce((sum, it) => {
//                       const qtyInKg = convertToKg(it.qty, it.unit);
//                       return sum + qtyInKg * Number(it.rate || 0);
//                     }, 0),
//                     2
//                   )}
//                 </td>
//                 <td className="px-3 py-3 border text-right font-semibold">—</td>
//                 <td className="px-3 py-3 border text-right font-semibold">—</td>
//                 <td className="px-3 py-3 border text-right font-semibold text-red-600">
//                   -₹
//                   {fx(
//                     form.items.reduce((sum, it) => {
//                       const calc = calcLine(it);
//                       return sum + calc.discTotal;
//                     }, 0),
//                     2
//                   )}
//                 </td>
//                 <td className="px-3 py-3 border text-right font-semibold">—</td>
//                 <td className="px-3 py-3 border text-right font-semibold text-blue-600">
//                   ₹{fx(totals.gst, 2)}
//                 </td>
//                 <td className="px-3 py-3 border text-right font-bold text-green-700 text-lg">
//                   ₹{fx(totals.final + Number(form.other_amount || 0), 2)}
//                 </td>
//                 <td className="px-3 py-3 border"></td>
//               </tr>
//             </tfoot>
//           </table>
//         </div>
//       </div>

//       {/* Actions */}
//       <div className="p-4 border-t bg-gray-50 rounded-b-xl">
//         <div className="flex flex-col md:flex-row justify-between items-center gap-4">
//           <div className="text-sm text-gray-600">
//             <div className="flex items-center gap-4">
//               <span>
//                 Total Items:{" "}
//                 <span className="font-bold">{form.items.length}</span>
//               </span>
//               <span>
//                 Total Quantity:{" "}
//                 <span className="font-bold">
//                   {fx(totals.totalQtyInKg, 3)} kg
//                 </span>
//               </span>
//               <span>
//                 Grand Total:{" "}
//                 <span className="font-bold text-green-700">
//                   ₹{fx(totals.final + Number(form.other_amount || 0), 2)}
//                 </span>
//               </span>
//             </div>
//           </div>

//           <div className="flex gap-3">
//             <button
//               type="button"
//               className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition font-medium"
//               onClick={() => {
//                 setForm({
//                   so_no: form.so_no,
//                   party_id: "",
//                   party_type: "Customer",
//                   buyer_type: "Retailer",
//                   payment_method: "Cash",
//                   date: new Date().toISOString().split("T")[0],
//                   bill_time: "",
//                   bill_time_am_pm: "PM",
//                   address: "",
//                   mobile_no: "",
//                   gst_no: "",
//                   place_of_supply: "",
//                   terms_condition: "",
//                   other_amount: "",
//                   other_note: "",
//                   items: [
//                     {
//                       product_id: "",
//                       hsn_code: "",
//                       qty: 0,
//                       unit: "kg",
//                       rate: 0,
//                       d1_percent: 0,
//                       gst_percent: 0,
//                       cost_rate: 0,
//                       available: 0,
//                       available_in_kg: 0,
//                       manualRate: false,
//                     },
//                   ],
//                 });
//               }}
//             >
//               Reset Form
//             </button>

//             <button
//               type="submit"
//               disabled={!isValid || loading}
//               className={`px-8 py-3 rounded-lg text-white font-medium transition ${
//                 !isValid || loading
//                   ? "bg-green-500/50 cursor-not-allowed"
//                   : "bg-green-600 hover:bg-green-700"
//               }`}
//             >
//               {loading ? (
//                 <span className="flex items-center gap-2">
//                   <svg
//                     className="animate-spin h-5 w-5"
//                     fill="none"
//                     viewBox="0 0 24 24"
//                   >
//                     <circle
//                       className="opacity-25"
//                       cx="12"
//                       cy="12"
//                       r="10"
//                       stroke="currentColor"
//                       strokeWidth="4"
//                     />
//                     <path
//                       className="opacity-75"
//                       fill="currentColor"
//                       d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
//                     />
//                   </svg>
//                   Processing...
//                 </span>
//               ) : isEditMode ? (
//                 "Update Sales Order"
//               ) : (
//                 "Create Sales Order"
//               )}
//             </button>
//           </div>
//         </div>
//       </div>
//     </form>
//   );
// }
