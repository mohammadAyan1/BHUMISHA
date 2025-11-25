import React, { useEffect, useMemo, useState } from "react";
import { refApi, soApi } from "../../axios/soApi.js";
import sequenceAPI from "../../axios/sequenceAPI.js";
import Swal from "sweetalert2";
import { useDispatch, useSelector } from "react-redux";
import { fetchVendors } from "../../features/vendor/vendorThunks.js";
import { fetchFarmers } from "../../features/farmers/farmerSlice.js";

const fx = (n, d = 2) => (isNaN(n) ? (0).toFixed(d) : Number(n).toFixed(d));

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
  const qty = Number(r.qty) || 0;
  const rate = Number(r.rate) || 0; //changes are made here
  const d1 = Number(r.d1_percent) || 0;
  const gst = Number(r.gst_percent) || 0;
  const amount = qty * rate;
  const discPerUnit = (rate * d1) / 100;
  const discTotal = discPerUnit * qty;
  const taxable = Math.max(amount - discTotal, 0);
  const gstAmt = (taxable * gst) / 100;
  const finalAmt = taxable + gstAmt;
  return { amount, discPerUnit, discTotal, taxable, gstAmt, finalAmt };
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
    other_amount: 0,
    other_note: "",
    items: [
      {
        product_id: "",
        hsn_code: "",
        qty: 1,
        rate: 0,
        d1_percent: 0,
        gst_percent: 0,
        cost_rate: 0, // Add cost_rate to track the base cost
        available: 0,
        manualRate: false, // Add manualRate flag
        discount_25: 0,
        discount_30: 0,
        discount_50: 0,
        total_50: 0,
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
    return item.rate || 0;
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
          default_rate: Number(p.sale_rate ?? p.rate ?? p.value ?? 0),
          default_gst: Number(p.gst_percent ?? p.gst_rate ?? p.gst ?? 0),
          available: Number(p.size ?? p.stock ?? p.available ?? 0),
          // use base value as cost, discounts as absolute margin amounts, and keep total (50% margin) if provided
          cost_rate: Number(p.value ?? p.total ?? 0),
          discount_25: Number(p.discount_25 || 0),
          discount_30: Number(p.discount_30 || 0),
          discount_50: Number(p.discount_50 || 0),
          total_50: Number(p.total || 0),
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
        return {
          id: it.id || it._id,
          product_id: String(it.product_id || ""),
          hsn_code: it.hsn_code || prod?.hsn_code || "",
          qty: Number(it.qty || 0),
          rate: Number(it.rate || prod?.default_rate || 0),
          d1_percent: Number(it.discount_per_qty ?? 0),
          gst_percent: Number(it.gst_percent ?? prod?.default_gst ?? 0),
          cost_rate: Number(prod?.cost_rate || 0),
          available: Number(prod?.available || 0),
          manualRate: true, // In edit mode, assume rates are manual
        };
      }) || [
        {
          product_id: "",
          hsn_code: "",
          qty: 1,
          rate: 0,
          d1_percent: 0,
          gst_percent: 0,
          cost_rate: 0,
          available: 0,
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
          if (useCostMargin && !row.manualRate) {
            const newRate = recomputeSellingRate(row, value);
            return { ...row, rate: Number.isFinite(newRate) ? newRate : 0 };
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
        "rate",
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
        row.available = Number(p?.available || 0);
        row.discount_25 = Number(p?.discount_25 || 0);
        row.discount_30 = Number(p?.discount_30 || 0);
        row.discount_50 = Number(p?.discount_50 || 0);
        row.total_50 = Number(p?.total_50 || 0);

        // Set initial rate based on margin calculation
        if ((!row.rate || row.rate === 0) && p?.cost_rate > 0) {
          const initialRate = recomputeSellingRate({
            ...row,
            cost_rate: p.cost_rate,
            qty: 1,
            manualRate: false,
          });
          row.rate = initialRate;
          row.manualRate = false;
        } else if (p?.default_rate != null) {
          row.rate = Number(p.default_rate);
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
        

        const newRate = recomputeSellingRate(row);
        

        row.rate = newRate;
      }

      // When rate is manually changed, mark as manual rate
      if (name === "rate") {
        

        row.manualRate = true;
      }

      // Validation: if qty > available → alert user
      if (
        name === "qty" &&
        row.available != null &&
        Number(value) > row.available
      ) {
        alert("Given quantity should not be greater than available quantity");
        row.qty = row.available;
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
          rate: 0,
          d1_percent: 0,
          gst_percent: 0,
          cost_rate: 0,
          available: 0,
          manualRate: false,
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
          rate: Number(r.rate || 0),
          d1_percent: Number(r.d1_percent || 0),
          gst_percent: Number(r.gst_percent || 0),
        });
        a.taxable += c.taxable;
        a.gst += c.gstAmt;
        a.final += c.finalAmt;
        return a;
      },
      { taxable: 0, gst: 0, final: 0 }
    );
  }, [form.items]);

  const isValid = useMemo(() => {
    const headOk = form.so_no && form.date && Number(form.party_id) > 0;
    const itemsOk =
      form.items.length > 0 &&
      form.items.every(
        (r) =>
          Number(r.product_id) > 0 && Number(r.qty) > 0 && Number(r.rate) > 0
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
        rate: Number(r.rate || 0),
        discount_per_qty: Number(r.d1_percent || 0),
        gst_percent: Number(r.gst_percent || 0),
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
              rate: 0,
              d1_percent: 0,
              gst_percent: 0,
              cost_rate: 0,
              available: 0,
              manualRate: false,
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
                <label className="text-sm text-gray-600 mb-1">Customer</label>
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
              <th className="px-2 py-2 border text-center w-20">Aval QTY</th>
              <th className="px-2 py-2 border text-center w-16">QTY</th>
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
                calcLine(it);
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
                      value={it.available ?? 0}
                    />
                  </td>

                  <td className="px-2 py-1 border text-center">
                    <input
                      type="number"
                      min={1}
                      className="border rounded w-16 h-8 px-2 text-center text-xs"
                      name="qty"
                      value={it.qty}
                      onChange={(e) => onItem(i, e)}
                    />
                  </td>

                  <td className="px-2 py-1 border text-right">
                    <input
                      type="number"
                      className={
                        "border rounded w-20 h-8 px-2 text-right text-xs"
                      }
                      name="rate"
                      value={it.rate}
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
                      value={it.d1_percent}
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
                      value={it.gst_percent}
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
                {fx(
                  form.items.reduce((a, r) => a + Number(r.qty || 0), 0),
                  3
                )}
              </td>
              <td className="px-2 py-1 border text-right">
                {fx(
                  form.items.reduce((a, r) => a + Number(r.rate || 0), 0),
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
                  form.items.reduce(
                    (a, r) =>
                      a +
                      Number(r.qty || 0) *
                        ((Number(r.rate || 0) * Number(r.d1_percent || 0)) /
                          100),
                    0
                  ),
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
                  rate: 0,
                  d1_percent: 0,
                  gst_percent: 0,
                  cost_rate: 0,
                  available: 0,
                  manualRate: false,
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
