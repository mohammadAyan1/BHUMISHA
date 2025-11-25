// import React, { useEffect, useState } from "react";
// import { useParams } from "react-router-dom";
// import PurchaseOrderAPI from "../../axios/PurchaseOrderAPI";
// import { useSelector } from "react-redux";
// import "./Invoice.css";

// const Invoice = () => {
//   const { id } = useParams();
//   const [invoice, setInvoice] = useState(null);
//   const [vendorInfo, setVendorInfo] = useState(null);
//   const vendors = useSelector((s) => s.vendor.vendors || []);
//   const vendor = invoice ? vendors.find((v) => String(v.id ?? v._id) === String(invoice.vendor_id)) : null;

// useEffect(() => {
//   let active = true;

//   // Fetch invoice
//   PurchaseOrderAPI.getInvoice(id)
//     .then((res) => {
//       if (!active) return;
//       const data = res.data;
//       setInvoice(data);

//       // Safely find vendor after invoice and vendors are ready
//       const v = vendors.find(v => String(v.id ?? v._id) === String(data.vendor_id));
//       setVendorInfo(v || null);
//     })
//     .catch((err) => console.error("Invoice fetch error:", err));

//   return () => {
//     active = false;
//   };
// }, [id, vendors]); // ✅ vendors dependency add kiya
//   if (!invoice) return <p>Loading invoice...</p>;

//   const fmt = (val) => Number(val || 0).toFixed(2);

//   // Totals (numbers only)
//   const totalTaxable = (invoice.items || []).reduce(
//     (sum, i) => sum + (parseFloat(i.taxable_amount) || 0),
//     0
//   );
//   const totalGst = (invoice.items || []).reduce(
//     (sum, i) => sum + (parseFloat(i.gst_amount) || 0),
//     0
//   );
//   const grandTotal = (invoice.items || []).reduce(
//     (sum, i) =>
//       sum +
//       ((parseFloat(i.amount) || 0) + (parseFloat(i.gst_amount) || 0)),
//     0
//   );

//   return (
//     <div id="invoice-print" className="p-6 bg-white shadow rounded-xl">
//       {/* Header */}
//       <div className="flex justify-between items-center mb-4">
//         <h1 className="text-2xl font-bold">Invoice #{invoice.invoiceNo || "N/A"}</h1>
//         <button
//           onClick={() => window.print()}
//           className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 active:scale-95"
//         >
//           🖨️ Print
//         </button>
//       </div>

//       {/* Parties and meta */}
//       <div className="mb-4">
//         <p><strong>Date:</strong> {invoice.date || "N/A"}</p>
//        <p><strong>Vendor:</strong> {invoice && vendors.find(v => String(v.id ?? v._id) === String(invoice.vendor_id))?.name || "N/A"}</p>
// <p><strong>GST No:</strong> {invoice && vendors.find(v => String(v.id ?? v._id) === String(invoice.vendor_id))?.gst_no || "N/A"}</p>
// <p><strong>Address:</strong> {invoice && vendors.find(v => String(v.id ?? v._id) === String(invoice.vendor_id))?.address || "N/A"}</p>
// <p><strong>Mobile:</strong> {invoice && vendors.find(v => String(v.id ?? v._id) === String(invoice.vendor_id))?.mobile_no || "N/A"}</p>
//       </div>

//       {/* Items table with footer totals */}
//       <table className="w-full mt-4 border">
//         <thead className="bg-gray-100">
//           <tr>
//             <th className="border p-2">SI</th>
//             <th className="border p-2">Product Name</th>
//             <th className="border p-2">HSN Code</th>
//             <th className="border p-2">Qty</th>
//             <th className="border p-2">Rate</th>
//             <th className="border p-2">Amount</th>
//             <th className="border p-2">GST%</th>
//             <th className="border p-2">GST Amount</th>
//             <th className="border p-2">Final Amount</th>
//           </tr>
//         </thead>
//         <tbody>
//           {(invoice.items || []).map((item, idx) => {
//             const finalAmount =
//               (parseFloat(item.amount) || 0) + (parseFloat(item.gst_amount) || 0);
//             return (
//               <tr key={idx} className="odd:bg-white even:bg-gray-50">
//                 <td className="border p-2">{idx + 1}</td>
//                 <td className="border p-2">{item.item_name || item.product_name || "N/A"}</td>
//                 <td className="border p-2">{item.hsn_code || "-"}</td>
//                 <td className="border p-2">{fmt(item.qty)}</td>
//                 <td className="border p-2">{fmt(item.rate)}</td>
//                 <td className="border p-2">{fmt(item.amount)}</td>
//                 <td className="border p-2">{fmt(item.gst_percent || 0)}%</td>
//                 <td className="border p-2">{fmt(item.gst_amount)}</td>
//                 <td className="border p-2">{fmt(finalAmount)}</td>
//               </tr>
//             );
//           })}
//         </tbody>

//         {/* Footer totals directly under Final Amount column */}
//         <tfoot>
//           <tr className="bg-gray-50">
//             <td className="border p-2 text-right font-bold" colSpan={6}>
//               Totals
//             </td>
//             <td className="border p-2 text-right font-bold">—</td>
//             <td className="border p-2 text-right font-bold">{fmt(totalGst)}</td>
//             <td className="border p-2 text-right font-bold">{fmt(grandTotal)}</td>
//           </tr>
//           <tr className="bg-gray-50">
//             <td className="border p-2 text-right font-bold" colSpan={8}>
//               Total Taxable
//             </td>
//             <td className="border p-2 text-right font-bold">{fmt(totalTaxable)}</td>
//           </tr>
//         </tfoot>
//       </table>

//       {/* Bold summary block below table (optional but good for print) */}
//       <div className="mt-4 text-right">
//         <p className="font-bold">Total Taxable: {fmt(totalTaxable)}</p>
//         <p className="font-bold">Total GST: {fmt(totalGst)}</p>
//         <h2 className="text-lg font-bold">Grand Total: {fmt(grandTotal)}</h2>
//       </div>
//     </div>
//   );
// };

// export default Invoice;
// src/components/purchase/POinvoice.jsx

// src/components/purchase/POinvoice.jsx
// src/components/purchase/POinvoice.jsx

// src/components/purchase/POinvoice.jsx

// src/components/purchase/POinvoice.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import PurchaseOrderAPI from "../../axios/PurchaseOrderAPI";

const fmt = (v, d = 2) => Number(v || 0).toFixed(d);
const safe = (v, f = "—") =>
  v === null || v === undefined || v === "" ? f : v;

function toWords(n) {
  const a = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const b = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];
  const num = Math.round(Number(n || 0));
  if (num === 0) return "Zero";
  const s = (x) => {
    if (x < 20) return a[x];
    if (x < 100)
      return `${b[Math.floor(x / 10)]}${x % 10 ? " " + a[x % 10] : ""}`;
    if (x < 1000)
      return `${a[Math.floor(x / 100)]} Hundred${
        x % 100 ? " " + s(x % 100) : ""
      }`;
    return "";
  };
  const units = [
    { v: 10000000, n: " Crore" },
    { v: 100000, n: " Lakh" },
    { v: 1000, n: " Thousand" },
    { v: 100, n: " Hundred" },
  ];
  let x = num,
    out = "";
  for (const u of units) {
    if (x >= u.v) {
      const q = Math.floor(x / u.v);
      out += `${out ? " " : ""}${s(q)}${u.n}`;
      x = x % u.v;
    }
  }
  if (x > 0) out += `${out ? " " : ""}${s(x)}`;
  return out.trim();
}

export default function POinvoice() {
  const { id } = useParams();
  const { search } = useLocation();
  const auto = new URLSearchParams(search).get("auto") === "1";

  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!id) return;
    let active = true;
    (async () => {
      try {
        setLoading(true);
        // Prefer /:id/invoice if you add it later, otherwise getById
        const res =
          typeof PurchaseOrderAPI.getInvoice === "function"
            ? await PurchaseOrderAPI.getInvoice(id)
            : await PurchaseOrderAPI.getById(id);
        if (!active) return;
        setDoc(res?.data ?? null);
        setErr("");
      } catch (e) {
        if (!active) return;
        const msg =
          e?.response?.data?.message ||
          e?.response?.data?.error ||
          e?.message ||
          "Failed to load";
        setErr(msg);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  const totals = useMemo(() => {
    const items = Array.isArray(doc?.items) ? doc.items : [];
    const taxable = items.reduce(
      (s, i) =>
        s + (parseFloat(i.amount || 0) - parseFloat(i.discount_total || 0)),
      0
    );
    const gst = items.reduce((s, i) => s + parseFloat(i.gst_amount || 0), 0);
    const total = items.reduce(
      (s, i) => s + parseFloat(i.final_amount || 0),
      0
    );
    const discount = items.reduce(
      (s, i) => s + parseFloat(i.discount_total || 0),
      0
    );
    return { taxable, gst, total, discount };
  }, [doc]);

  const handlePDF = async () => {
    if (!wrapRef.current) return;
    const canvas = await html2canvas(wrapRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#fff",
    });
    const img = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pw = pdf.internal.pageSize.getWidth();
    const ph = (canvas.height * pw) / canvas.width;
    const pageH = pdf.internal.pageSize.getHeight();
    if (ph <= pageH) {
      pdf.addImage(img, "PNG", 0, 0, pw, ph);
    } else {
      let off = 0;
      while (off < ph) {
        pdf.addImage(img, "PNG", 0, -off, pw, ph);
        off += pageH;
        if (off < ph) pdf.addPage();
      }
    }
    pdf.save(`PO-${doc?.po_no || doc?.bill_no || id}.pdf`);
  };

  useEffect(() => {
    if (!auto || !doc) return;
    const t = setTimeout(() => handlePDF(), 300);
    return () => clearTimeout(t);
  }, [auto, doc]);

  if (loading) return <div>Loading...</div>;
  if (err) return <div style={{ color: "red" }}>{err}</div>;
  if (!doc) return <div>No data</div>;

  // Map purchase-order fields to template fields
  const company = doc.company || {};
  const party = doc.party || {
    name: doc.vendor_name || doc.party_name,
    gst_no: doc.gst_no,
    address: doc.address,
    mobile_no: doc.mobile_no,
    email: doc.email,
  };
  const items = Array.isArray(doc?.items) ? doc.items : [];
  const image_url = import.meta.env.VITE_IMAGE_URL;
  return (
    <div className="flex flex-col items-center py-6 bg-gray-50 min-h-screen">
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => window.print()}
          className="bg-gray-700 hover:bg-gray-800 text-white font-semibold py-2 px-4 rounded shadow"
        >
          Print
        </button>
        <button
          onClick={handlePDF}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded shadow"
        >
          Download PDF
        </button>
      </div>

      <div
        ref={wrapRef}
        className="bg-white text-black border border-black shadow max-w-[794px] w-[794px] p-3 print:p-3"
        style={{ fontFamily: "Arial, sans-serif", fontSize: 12 }}
      >
        <div className="flex justify-between items-center text-[10px] mb-1">
          <div>Page No. 1 of 1</div>
          <div className="text-center flex-1">Purchse Order BILL OF SUPPLY</div>
          <div>Original Copy</div>
        </div>

        <div className="flex justify-between gap-2 border border-black p-2 mb-1">
          <img
            src={
              company?.image_url
                ? `${image_url}${company.image_url}`
                : "/img/image.png"
            }
            alt="Logo"
            className="w-16 h-16 border border-black object-contain"
          />
          <div className="flex-1 text-center">
            <div className="text-base font-bold">
              {safe(company.name, "Bhumisha Organics")}
            </div>
            <div className="text-[11px]">
              {safe(company.address, "Add Address")}
            </div>
            <div className="text-[10px] mt-1">
              Mobile: {safe(company.mobile, "+91 9999999999")} | Email:{" "}
              {safe(company.email, "company@email.com")}
            </div>
            <div className="text-[10px]">
              GSTIN - {safe(company.gstin, "99AAAAA1234F001")} | PAN -{" "}
              {safe(company.pan, "99AAAAA1234F")}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-1">
          <div className="border border-black p-2">
            <div className="font-semibold mb-1">Billing Details</div>
            <div className="text-[11px] leading-5">
              <div>
                <span className="inline-block w-16">Name</span> :{" "}
                {safe(party.name, "—")}
              </div>
              <div>
                <span className="inline-block w-16">GSTIN</span> :{" "}
                {safe(party.gst_no, "—")} | Mobile{" "}
                {safe(party.mobile_no, "+91")} |{" "}
              </div>
              <div>
                <span className="inline-block w-16">Address</span> :{" "}
                {safe(party.address, "—")}
              </div>
            </div>
          </div>
          <div className="border border-black p-2">
            <div className="text-[11px] leading-5">
              <div>
                <span className="inline-block w-28">Invoice</span> :{" "}
                {safe(doc.po_no || doc.bill_no, "—")}
              </div>
              <div>
                <span className="inline-block w-28">Number</span> :{" "}
                {safe(doc.number, "—")}
              </div>
              <div>
                <span className="inline-block w-28">Invoice Date</span> :{" "}
                {safe(doc.date || doc.bill_date, "—")}
              </div>
              <div>
                <span className="inline-block w-28">Due Date</span> :{" "}
                {safe(doc.due_date, "—")}
              </div>
              {/* <div><span className="inline-block w-28">Room No. Check In</span> : {safe(doc.room_no, "—")}</div> */}
              {/* <div><span className="inline-block w-28">Time Check Out</span> : {safe(doc.time_out, "—")}</div> */}
              <div>
                <span className="inline-block w-28">Time</span> :{" "}
                {safe(doc.bill_time, "—")}
              </div>
            </div>
          </div>
        </div>

        <div className="border border-black mb-1">
          <table className="w-full border-collapse text-[11px]">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-black py-1 px-1 w-8">Sr.</th>
                <th className="border border-black py-1 px-1 text-left">
                  Item Description
                </th>
                <th className="border border-black py-1 px-1 w-16">HSN/SAC</th>
                <th className="border border-black py-1 px-1 w-12">Qty</th>
                <th className="border border-black py-1 px-1 w-12">Unit</th>
                <th className="border border-black py-1 px-1 w-16">
                  List Price
                </th>
                <th className="border border-black py-1 px-1 w-20">Disc.</th>
                <th className="border border-black py-1 px-1 w-12">Tax %</th>
                <th className="border border-black py-1 px-1 w-20">
                  Amount (₹)
                </th>
              </tr>
            </thead>
            <tbody>
              {items.length ? (
                items.map((it, i) => {
                  const qty = Number(it.qty || 0);
                  const rate = Number(it.rate || 0);
                  const amount = Number(it.amount || qty * rate);
                  const disc = Number(it.discount_total || 0);
                  const gstp = Number(it.gst_percent || 0);
                  const final = Number(it.final_amount || amount - disc);
                  const unit = it.unit || it.unit_code || "N.A.";
                  const desc =
                    it.item_name || it.product_name || `#${it.product_id}`;
                  return (
                    <tr key={it.id || i} className="align-top">
                      <td className="border border-black py-1 px-1 text-center">
                        {i + 1}
                      </td>
                      <td className="border border-black py-1 px-1">{desc}</td>
                      <td className="border border-black py-1 px-1 text-center">
                        {safe(it.hsn_code, "—")}
                      </td>
                      <td className="border border-black py-1 px-1 text-center">
                        {fmt(qty)}
                      </td>
                      <td className="border border-black py-1 px-1 text-center">
                        {unit}
                      </td>
                      <td className="border border-black py-1 px-1 text-right">
                        {fmt(rate)}
                      </td>
                      <td className="border border-black py-1 px-1 text-right">
                        {disc > 0
                          ? `${fmt(disc)}${
                              it.discount_percent
                                ? ` (${fmt(it.discount_percent, 0)}%)`
                                : ""
                            }`
                          : "0.00"}
                      </td>
                      <td className="border border-black py-1 px-1 text-center">
                        {fmt(gstp, 0)}
                      </td>
                      <td className="border border-black py-1 px-1 text-right">
                        {fmt(final)}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    className="border border-black py-4 px-1 text-center"
                    colSpan={9}
                  >
                    No Items
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex justify-between border-t border-black py-1 text-[11px]">
          <span>Discount</span>
          <span>- {fmt(totals.discount)}</span>
        </div>
        <div className="flex justify-between border-t border-black py-1 text-[11px]">
          <span>GST</span>
          <span>{fmt(totals.gst)}</span>
        </div>
        <div className="flex justify-between border-t-2 border-black py-2 font-semibold text-[13px]">
          <span>Total</span>
          <span>{fmt(totals.total)}</span>
        </div>

        <div className="text-[11px]">
          <div className="font-semibold">Rs. {fmt(totals.total)} Only</div>
          <div className="mt-1">
            Amount in words:{" "}
            <span className="font-bold">
              {toWords(totals.total)} Rupees Only
            </span>
          </div>
          <div className="mt-1">
            Settled by : Bank : {fmt(doc.settled_bank_amount || 0)} | Invoice
            Balance : {fmt(doc.balance || 0)}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 border-t border-black mt-2 pt-2 text-[11px]">
          <div className="col-span-2">
            <div className="font-semibold mb-1">Terms and Conditions</div>
            <div className="whitespace-pre-line">
              {doc.terms_condition ||
                `1. Goods once sold will not be taken back.
2. Interest @ 18% p.a. will be charged if payment is delayed.
3. Subject to “Delhi” jurisdiction only.`}
            </div>
          </div>
          {/* <div className="flex items-center justify-center">
            <img className="w-20 h-20" alt="QR" src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(`INV:${doc.po_no || doc.bill_no} AMT:${fmt(totals.total)}`)}`} />
          </div> */}
        </div>

        <div className="grid grid-cols-3 gap-2 border-t border-black mt-2 pt-2 text-[11px]">
          <div className="col-span-2">
            <div>
              <strong>Account Number:</strong>{" "}
              {safe(company.acc_no, "123456789")}
              <br />
              <strong>Bank:</strong> {safe(company.bank, "ICICI Bank")}
              <br />
              <strong>IFSC:</strong> {safe(company.ifsc, "ICICI1234")}
              <br />
              <strong>Branch:</strong> {safe(company.branch, "Noida")}
            </div>
          </div>
          <div className="text-center">
            <div>For {safe(company.name, "Company Name")}</div>
            <div className="mt-10 border-t border-black inline-block w-32"></div>
            <div className="text-[10px] mt-1">Signature</div>
          </div>
        </div>

        <div className="text-center text-[10px] mt-2">
          Invoice Created by{" "}
          <a
            href="https://www.mazru.in"
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            www.mazru.in
          </a>
        </div>
      </div>

      <style>{`
        @media print {
          @page { size: A4; margin: 8mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          button { display: none !important; }
        }
      `}</style>
    </div>
  );
}
