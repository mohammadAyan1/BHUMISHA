// src/components/Sales/SalesInvoicePrint.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import salesAPI from "../../axios/salesAPI";

import { api } from "../../axios/axios";

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

export default function SalesInvoice() {
  const { id } = useParams();
  const { search } = useLocation();
  const auto = new URLSearchParams(search).get("auto") === "1";

  const nav = useNavigate();
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [patyBank, setPatyBank] = useState(null);

  const ref = useRef(null);

  useEffect(() => {
    if (!id) return;
    let on = true;
    setLoading(true);
    salesAPI
      .getById(id)
      .then(({ data }) => on && setSale(data ?? null))
      .catch(
        (e) =>
          on &&
          setErr(
            e?.response?.data?.message || e?.message || "Failed to load Sale"
          )
      )
      .finally(() => on && setLoading(false));
    return () => {
      on = false;
    };
  }, [id]);

  const items = useMemo(
    () => (Array.isArray(sale?.items) ? sale.items : []),
    [sale]
  );

  const taxBreakup = useMemo(() => {
    // Group by GST percentage
    const gstGroups = {};
    let totalTaxable = 0,
      totalDiscount = 0,
      totalGross = 0;
    for (const r of items) {
      const qty = Number(r.qty || 0);
      const rate = Number(r.rate || 0);
      const lineDiscount = Number(r.discount_amount || 0);
      const lineTaxable = Number(r.taxable_amount || qty * rate - lineDiscount);
      const gstPercent = Number(r.gst_percent || r.tax_percent || 0);
      const lineGstAmt = Number(r.gst_amount || 0);
      const lineC = Number(r.cgst_amount || 0);
      const lineS = Number(r.sgst_amount || 0);
      const lineI = Number(r.igst_amount || 0);
      const totalGst = lineGstAmt || lineC + lineS + lineI;
      const net = Number(r.net_total || lineTaxable + totalGst);

      totalTaxable += lineTaxable;
      totalDiscount += lineDiscount;
      totalGross += net;

      if (!gstGroups[gstPercent]) {
        gstGroups[gstPercent] = {
          taxable: 0,
          gst: 0,
          cgst: 0,
          sgst: 0,
          igst: 0,
        };
      }
      gstGroups[gstPercent].taxable += lineTaxable;
      gstGroups[gstPercent].gst += totalGst;
      gstGroups[gstPercent].cgst += lineC;
      gstGroups[gstPercent].sgst += lineS;
      gstGroups[gstPercent].igst += lineI;
    }

    // For each group, if no specific CGST/SGST/IGST, assume CGST = SGST = GST/2
    Object.keys(gstGroups).forEach((percent) => {
      const group = gstGroups[percent];
      if (group.cgst + group.sgst + group.igst === 0 && group.gst > 0) {
        group.cgst = group.gst / 2;
        group.sgst = group.gst / 2;
      }
    });

    return {
      groups: gstGroups,
      totalTaxable,
      totalDiscount,
      totalGst: Object.values(gstGroups).reduce((s, g) => s + g.gst, 0),
      totalCgst: Object.values(gstGroups).reduce((s, g) => s + g.cgst, 0),
      totalSgst: Object.values(gstGroups).reduce((s, g) => s + g.sgst, 0),
      totalIgst: Object.values(gstGroups).reduce((s, g) => s + g.igst, 0),
      total: totalGross,
    };
  }, [items]);

  const handlePDF = async () => {
    if (!ref.current) return;
    const canvas = await html2canvas(ref.current, {
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
    pdf.save(`SALE-${sale?.bill_no || id}.pdf`);
  };

  const handleWhatsAppShare = async () => {
    try {
      const phone = String(party?.mobile_no || party?.phone || "").replace(
        /[^0-9]/g,
        ""
      );
      if (!phone) return alert("No customer mobile number found");
      if (!ref.current) return alert("Invoice not ready to share");

      const canvas = await html2canvas(ref.current, {
        scale: 1.5,
        useCORS: true,
        backgroundColor: "#fff",
      });
      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);

      const fname = `SALE-${sale?.bill_no || id}-${Date.now()}`;
      const { data } = await api.post("/invoice-image", {
        fileData: dataUrl,
        filename: fname,
      });
      const relUrl = data?.url || "";
      const base = image_url || "";
      const publicUrl = relUrl.startsWith("http") ? relUrl : `${base}${relUrl}`;

      const total =
        Number(taxBreakup?.total || 0) + Number(sale?.other_amount || 0);
      const msg = `Hello, here is your invoice ${
        sale?.bill_no || id
      }. Grand Total: Rs. ${total.toFixed(2)}. Remark: ${safe(
        sale?.other_note,
        "—"
      )}\n${publicUrl}`;
      const wa = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
      window.open(wa, "_blank");
    } catch (e) {
      alert(
        e?.response?.data?.error || e?.message || "Failed to share on WhatsApp"
      );
    }
  };

  useEffect(() => {
    if (!auto || !sale) return;
    const t = setTimeout(() => handlePDF(), 300);
    return () => clearTimeout(t);
  }, [auto, sale]);

  useEffect(() => {
    if (!sale) return; // wait until sale data is loaded

    const fetchData = async () => {
      try {
        const res = await api.get("/vendor-bank-details/fetchByName", {
          params: { mobile_no: sale.party_phone }, // ✅ correct key
        });

        setPatyBank(res?.data?.data);
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };

    fetchData();
  }, [sale]);

  if (loading) return <div>Loading...</div>;
  if (err) return <div style={{ color: "red" }}>{err}</div>;
  if (!sale) return <div>No data</div>;

  const company = sale.company || {};
  const party = {
    name: sale.party_name || sale.customer_name,
    gst_no: sale.party_gst || sale.gst_no,
    address: sale.party_address || sale.address,
    mobile_no: sale.party_phone || sale.mobile_no,
    email: sale.party_email || sale.email,
    state_name:
      sale.party_state_name || sale.place_of_supply || sale.state_name,
    state_code: sale.party_state_code || sale.state_code,
  };

  const image_url = import.meta.env.VITE_IMAGE_URL;

  return (
    <div className="flex flex-col items-center py-6 bg-gray-50 min-h-screen">
      <div className="flex gap-2 mb-4 no-print">
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
        <button
          onClick={handleWhatsAppShare}
          className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded shadow"
          title="Send via WhatsApp"
        >
          WhatsApp
        </button>
        <button
          onClick={() => nav(-1)}
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded shadow"
        >
          Back
        </button>
      </div>

      <div
        id="invoice-wrap"
        ref={ref}
        className="bg-white text-black shadow max-w-[784px] w-[794px] p-0 print:p-0"
        style={{ fontFamily: "Arial, sans-serif" }}
      >
        {/* Outer border */}
        <div className="border border-black m-2 p-2">
          {/* Top Brand Header */}
          <div className=" flex items-center gap-3">
            <img
              src={
                company?.image_url
                  ? `${image_url}${company.image_url}`
                  : "/img/image.png"
              }
              alt="Logo"
              className="w-30 h-30 border border-black object-contain"
            />
            <div className="flex-1">
              <div
                className="text-[26px]  font-extrabold tracking-wide"
                style={{ color: "green" }}
              >
                {safe(company.name, "")}
              </div>
              <div
                className="text-[12px] py-1 px-2 inline-block text-white"
                style={{ background: "#0aa37f", borderRadius: 2 }}
              >
                Close to Nature
              </div>
              <div className="text-[11px] mt-1">
                {safe(company.address, "")}
              </div>
              <div className="text-[11px]">
                Mob: {safe(company.contact_no, "")} &nbsp; Web:{" "}
                {safe("www.bhumishaorganics.com")} &nbsp; Email:{" "}
                {safe(company.email, "")}
              </div>
            </div>
            <div className="text-right text-[11px] min-w-[120px]">
              <div className="font-semibold">
                GST NO : {safe(company.gst_no, "")}
              </div>
              <div className="mt-1 border border-black px-2 py-1 text-[13px] font-bold">
                TAX INVOICE
              </div>
              <div className="text-[10px] mt-1">ORIGINAL FOR RECIPIENT</div>
            </div>
          </div>

          {/* Customer + Invoice Meta */}
          <div className="grid grid-cols-2 gap-2 mt-2 text-[11px]">
            <div className="border border-black">
              <div className="bg-gray-100 border-b border-black px-2 py-1 font-semibold">
                Customer Detail
              </div>
              <div className="px-2 py-1 leading-5">
                <div>
                  <span className="inline-block w-20">M/S</span>{" "}
                  {safe(party.name, "")}
                </div>
                <div>
                  <span className="inline-block w-20">Address</span>{" "}
                  {safe(party.address, "")}
                </div>
                <div>
                  <span className="inline-block w-20">Phone</span>{" "}
                  {safe(party?.mobile_no, "")}
                </div>
                <div>
                  <span className="inline-block w-20">GSTIN</span>{" "}
                  {safe(party.gst_no, "")}
                </div>
                <div>
                  <span className="inline-block w-20">Place of Supply</span>{" "}
                  {safe(party.address, "")}
                </div>
              </div>
            </div>
            <div className="border border-black">
              <div className="grid grid-cols-2 text-[11px]">
                <div className="px-2 py-1 border-b border-r border-black">
                  <div>Invoice No.</div>
                  <div className="font-semibold">{safe(sale.bill_no, "")}</div>
                </div>
                <div className="px-2 py-1 border-b border-black">
                  <div>Invoice Date</div>
                  <div className="font-semibold">
                    {safe(sale.bill_date, "")}
                  </div>
                </div>
                {/* <div className="px-2 py-1 border-r border-black">
                  <div>Challan No</div>
                  <div className="font-semibold">{safe(sale.challan_no, "33")}</div>
                </div> */}
                <div className="px-2 py-1">
                  <div>Challan Date</div>
                  <div className="font-semibold">
                    {safe(sale.challan_date, safe(sale.bill_date, ""))}
                  </div>
                </div>
                <div className="px-2 py-1 border-t border-r border-black">
                  <div>Other Amount</div>
                  <div className="font-semibold">{fmt(sale.other_amount)}</div>
                </div>
                <div className="px-2 py-1 border-t border-black">
                  <div>Remark</div>
                  <div className="font-semibold">
                    {safe(sale.other_note, "—")}
                  </div>
                </div>
                <div className="px-2 py-1 border-t border-r border-black">
                  <div>E-Way Bill No.</div>
                  <div className="font-semibold">
                    {safe(sale.eway_bill_no, "")}
                  </div>
                </div>
                <div className="px-2 py-1 border-t border-black">
                  <div>Transport</div>
                  <div className="font-semibold">
                    {safe(sale.transport_name, "")}
                  </div>
                </div>
                <div className="px-2 py-1 border-t border-r border-black">
                  <div>Transport ID</div>
                  <div className="font-semibold">
                    {safe(sale.transport_id, "")}
                  </div>
                </div>
                <div className="px-2 py-1 border-t border-black">
                  <div>Vehicle No.</div>
                  <div className="font-semibold">
                    {safe(sale.vehicle_no, "—")}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="border border-black mt-2">
            <table className="w-full border-collapse text-[11px]">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-black py-1 px-1 w-8">Sr.</th>
                  <th className="border border-black py-1 px-1 text-left">
                    Name of Product / Service
                  </th>
                  <th className="border border-black py-1 px-1 w-16">
                    HSN / SAC
                  </th>
                  <th className="border border-black py-1 px-1 w-12">Qty</th>
                  <th className="border border-black py-1 px-1 w-12">UOM</th>
                  <th className="border border-black py-1 px-1 w-18">Rate</th>
                  <th className="border border-black py-1 px-1 w-20">
                    Taxable Value
                  </th>
                  <th className="border border-black py-1 px-1 w-12">% GST</th>
                  <th className="border border-black py-1 px-1 w-20">Amount</th>
                </tr>
              </thead>
              <tbody>
                {items.length ? (
                  items.map((r, i) => {
                    const qty = Number(r.qty || 0);
                    const rate = Number(r.rate || 0);
                    const discAmt = Number(r.discount_amount || 0);
                    const taxable = Number(
                      r.taxable_amount || qty * rate - discAmt
                    );
                    const gstp = Number(r.gst_percent || r.tax_percent || 0);
                    const gstAmt =
                      Number(r.gst_amount || r.cgst_amount || 0) +
                        Number(r.sgst_amount || 0) +
                        Number(r.igst_amount || 0) || (taxable * gstp) / 100;
                    const net = Number(r.net_total || taxable + gstAmt);
                    const unit = r.unit || r.unit_code || "NOS";
                    const desc =
                      r.item_name || r.product_name || `#${r.product_id}`;
                    return (
                      <tr key={r.id || i} className="align-top">
                        <td className="border border-black py-1 px-1 text-center">
                          {i + 1}
                        </td>
                        <td className="border border-black py-1 px-1 text-left">
                          {desc}
                        </td>
                        <td className="border border-black py-1 px-1 text-center">
                          {safe(r.hsn_code, "—")}
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
                          {fmt(taxable)}
                        </td>
                        <td className="border border-black py-1 px-1 text-center">
                          {fmt(gstp, 0)}
                        </td>
                        <td className="border border-black py-1 px-1 text-right">
                          {fmt(net)}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      className="border border-black py-6 px-1 text-center"
                      colSpan={9}
                    >
                      No Items
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100 font-semibold">
                  <td
                    className="border border-black py-1 px-1 text-center"
                    colSpan={3}
                  >
                    Total
                  </td>
                  <td className="border border-black py-1 px-1 text-center">
                    {fmt(items.reduce((s, r) => s + Number(r.qty || 0), 0))}
                  </td>
                  <td className="border border-black py-1 px-1 text-center">
                    NOS
                  </td>
                  <td className="border border-black py-1 px-1"></td>
                  <td className="border border-black py-1 px-1 text-right">
                    {fmt(taxBreakup.totalTaxable)}
                  </td>
                  <td className="border border-black py-1 px-1"></td>
                  <td className="border border-black py-1 px-1 text-right">
                    {fmt(taxBreakup.total)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Totals Grid */}
          <div className="grid grid-cols-2 gap-2 mt-2 text-[11px]">
            <div className="border border-black px-2 py-1">
              <div className="font-semibold mb-1">Bank Details</div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div>
                    <strong>Name</strong> {safe(company?.bank_bank_name, "")}
                  </div>
                  <div>
                    <strong>Branch</strong>{" "}
                    {safe(company?.bank_branch_name, "")}
                  </div>
                  <div>
                    <strong>Acc. Number</strong>{" "}
                    {safe(company?.bank_account_number, "—")}
                  </div>
                  <div>
                    <strong>IFSC</strong> {safe(company?.bank_ifsc_code, "—")}
                  </div>
                  <div>
                    <strong>UPI ID</strong>{" "}
                    {safe(company?.bank_upi_id || company?.upi_id, "—")}
                  </div>
                </div>
                {/* <div className="flex items-center justify-center">
                  <img
                    className="w-24 h-24"
                    alt="QR"
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
                      `SALE:${safe(sale.bill_no, id)} AMT:${fmt(taxBreakup.total)}`
                    )}`}
                  />
                </div> */}
              </div>
              <div className="text-[10px] mt-2">Pay using UPI</div>
            </div>

            <div className="border border-black">
              <div className="grid grid-cols-2">
                <div className="px-2 py-1 border-b border-r border-black">
                  Taxable Amount
                </div>
                <div className="px-2 py-1 border-b text-right border-black">
                  {fmt(taxBreakup.totalTaxable)}
                </div>

                <div className="px-2 py-1 border-b border-r border-black">
                  Total Tax
                </div>
                <div className="px-2 py-1 border-b text-right border-black">
                  {fmt(taxBreakup.totalGst)}
                </div>

                <div className="px-2 py-1 border-b border-r border-black">
                  Discount
                </div>
                <div className="px-2 py-1 border-b text-right border-black">
                  - {fmt(taxBreakup.totalDiscount)}
                </div>

                <div className="px-2 py-2 font-semibold border-r border-black">
                  Total Amount After Tax
                </div>
                <div className="px-2 py-2 font-bold text-right text-[14px]">
                  ₹ {fmt(taxBreakup.total)}
                </div>
                <div className="px-2 py-2 font-semibold border-t border-r border-black">
                  Other Amount
                </div>
                <div className="px-2 py-2 text-right border-t border-black">
                  ₹ {fmt(sale.other_amount)}
                </div>
                <div className="px-2 py-2 border-t border-r border-black">
                  Remark
                </div>
                <div className="px-2 py-2 border-t border-black">
                  {safe(sale.other_note, "—")}
                </div>

                <div className="px-2 py-2 font-semibold border-t border-r border-black">
                  Grand Total
                </div>
                <div className="px-2 py-2 font-bold text-right text-[14px] border-t border-black">
                  ₹{" "}
                  {fmt(
                    Number(taxBreakup.total || 0) +
                      Number(sale.other_amount || 0)
                  )}
                </div>
              </div>

              {/* GST Breakdown Section */}
              <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-sm font-semibold text-gray-700 mb-2">
                  GST Breakdown Details
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="flex justify-between">
                    <span className="font-medium">SGST AMT:</span>
                    <span className="font-mono">
                      {fmt(taxBreakup.totalSgst)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">CGST AMT:</span>
                    <span className="font-mono">
                      {fmt(taxBreakup.totalCgst)}
                    </span>
                  </div>
                </div>
                <div className="mt-3 space-y-1">
                  {Object.keys(taxBreakup.groups)
                    .filter((p) => Number(p) > 0)
                    .sort((a, b) => Number(a) - Number(b))
                    .map((percent) => {
                      const group = taxBreakup.groups[percent];
                      return (
                        <div
                          key={percent}
                          className="flex items-center justify-between text-xs bg-white p-2 rounded border"
                        >
                          <span className="font-medium">{percent}%:</span>
                          <div className="flex gap-4">
                            <span>SGST {fmt(group.sgst)}</span>
                            <span>CGST {fmt(group.cgst)}</span>
                            <span className="font-medium">
                              = {fmt(group.sgst + group.cgst)} /{" "}
                              {fmt(group.taxable)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>

          {/* Amount in words */}
          <div className="border border-black mt-2 px-2 py-1 text-[11px]">
            <div className="">Total in words</div>
            <div className="mt-1 font-bold">
              {toWords(
                Number(taxBreakup.total || 0) + Number(sale.other_amount || 0)
              )}{" "}
              Rupees Only
            </div>
            <div className="mt-1">GST Amount: {fmt(taxBreakup.totalGst)}</div>
            <div className="mt-1 italic text-gray-700">
              Grand Total = Total After Tax + Other Amount
            </div>
          </div>

          {/* Terms + Declaration + Signature */}
          <div className="grid grid-cols-2 gap-2 mt-2 text-[11px]">
            <div className="border border-black px-2 py-2">
              <div className="font-semibold mb-1">Terms and Conditions</div>
              <div className="whitespace-pre-line">
                {sale.remarks ||
                  `Subject to Maharashtra Jurisdiction.\nOur Responsibility Ceases as soon as goods leaves our Premises.\nGoods once sold will not taken back.\nDelivery Ex: Premises.\nCustomer Signature`}
              </div>
            </div>
            <div className="border border-black px-2 py-2 text-center">
              <div>For {safe(company.name, "")}</div>
              <div className="mt-12 inline-block border-t border-black w-40"></div>
              <div className="text-[10px] mt-1">Authorised Signatory</div>
              <div className="text-[10px] mt-4 italic">
                This is a computer generated invoice, no signature required.
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-[10px] mt-2">
            Thank you for shopping with us!
          </div>
        </div>
      </div>

      <style>{`
@media print {
  @page {
    size: A4;
    margin: 1.5;
  }

  body * {
    visibility: hidden;
  }

  #invoice-wrap,
  #invoice-wrap * {
    visibility: visible;
  }

  #invoice-wrap {
    position: absolute;
    left: 0;
    top: 0;
    width: 794px; /* exact A4 width in px */
    margin: 0;
    padding: 0;
    box-shadow: none;
  }

  .no-print {
    display: none !important;
  }
}
`}</style>
    </div>
  );
}
