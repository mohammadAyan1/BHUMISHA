import React from "react";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import vendorsAPI from "../axios/vendorsAPI";
import companyAPI from "../axios/companyAPI";
import getAllPurchaseBill from "../axios/getAllPurchasesBill";
import getAllSalesBill from "../axios/getAllSalesBill";
import axios from "axios";
import { useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const monthNames = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export default function Dashboard() {
  const [totalVendors, setTotalVendors] = useState(0);
  const [totalCompanies, setTotalCompanies] = useState(0);
  const [purchaseInvoiceCount, setPurchaseInvoiceCount] = useState(0);
  const [purchaseTotalAmount, setPurchaseTotalAmount] = useState(0);
  const [salesInvoiceCount, setSalesInvoiceCount] = useState(0);
  const [salesTotalAmount, setSalesTotalAmount] = useState(0);
  const [salesTotalProfit, setSalesTotalProfit] = useState(0);
  const [revenueData, setRevenueData] = useState([]);
  const [vendorData, setVendorData] = useState([]);
  const [productCostRetailer, setProductCostRetailer] = useState([]);
  const [productCostWholeSaler, setProductCostWholeSaler] = useState([]);

  const [gstAmount, setGstAmount] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Run all API calls at the same time

        const [vendorRes, company] = await Promise.all([
          vendorsAPI.getAll(),
          companyAPI.getAll(),
        ]);

        const notifyTelegram = async (
          message = "Bhumisha agro server is down. Please restart the server."
        ) => {
          try {
            const token = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
            const id = import.meta.env.VITE_TELEGRAM_CHAT_ID;

            await axios.post(
              `https://api.telegram.org/bot${token}/sendMessage`,
              null,
              {
                params: {
                  chat_id: id,
                  text: message,
                },
              }
            );
          } catch (error) {
            console.error("Error sending Telegram notification:", error);
          }
        };

        if (vendorRes?.status !== 200) {
          await notifyTelegram();
        }
        if (company?.status !== 200) {
          await notifyTelegram();
        }

        // Log results

        // Update state
        setTotalVendors(vendorRes.data.length);
        setTotalCompanies(company.data);

        // Build vendor registrations per month (last 12 months)
        try {
          const now = new Date();
          const start = new Date(now.getFullYear(), now.getMonth() - 11, 1);
          const buckets = new Map();
          for (let i = 0; i < 12; i++) {
            const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
            const key = `${d.getFullYear()}-${d.getMonth()}`;
            buckets.set(key, {
              month: `${monthNames[d.getMonth()]} ${String(
                d.getFullYear()
              ).slice(-2)}`,
              vendors: 0,
            });
          }
          for (const v of vendorRes.data || []) {
            const dt = new Date(
              v.created_at || v.createdAt || v.created || Date.now()
            );
            const key = `${dt.getFullYear()}-${dt.getMonth()}`;
            if (buckets.has(key)) {
              buckets.get(key).vendors += 1;
            }
          }
          setVendorData(Array.from(buckets.values()));
        } catch {
          console.error("Error computing vendor registration metrics");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        // On any failure (server down, network error), notify Telegram
        try {
          await axios.post(
            `https://api.telegram.org/bot${
              import.meta.env.VITE_TELEGRAM_BOT_TOKEN
            }/sendMessage`,
            null,
            {
              params: {
                chat_id: import.meta.env.VITE_TELEGRAM_CHAT_ID,
                text: "Bhumisha agro server is down. Please restart the server.",
              },
            }
          );
        } catch (e) {
          console.error("Secondary Telegram notify failed:", e);
        }
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (totalCompanies && totalCompanies.length > 0) {
      getAllPurchaseBill.getAll(totalCompanies).then((res) => {
        try {
          const companies = res.data || [];
          let invoiceCount = 0;
          let totalAmount = 0;

          for (const company of companies) {
            const entries = Array.isArray(company.purchases)
              ? company.purchases
              : Array.isArray(company.data)
              ? company.data
              : [];

            invoiceCount += entries.length;

            for (const entry of entries) {
              // determine items
              const items = Array.isArray(entry.items) ? entry.items : [entry];
              // prefer entry total_amount/total if present, otherwise sum item totals
              const entryTotal =
                Number(
                  entry.total_amount ??
                    entry.total ??
                    items.reduce(
                      (s, it) =>
                        s +
                        Number(
                          it?.total ?? it?.amount ?? it?.total_amount ?? 0
                        ),
                      0
                    )
                ) || 0;
              totalAmount += entryTotal;
            }
          }

          setPurchaseInvoiceCount(invoiceCount);
          setPurchaseTotalAmount(totalAmount);
        } catch (err) {
          console.error("Error computing purchase metrics", err);
        }
      });
    }

    // also compute sales metrics
    if (totalCompanies && totalCompanies.length > 0) {
      getAllSalesBill.getAll(totalCompanies).then((res) => {
        try {
          const companies = res.data || [];
          let sCount = 0;
          let totalSalesAmount = 0;
          let totalProfit = 0;
          const revenueBuckets = new Map();
          const now = new Date();
          const start = new Date(now.getFullYear(), now.getMonth() - 11, 1);
          for (let i = 0; i < 12; i++) {
            const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
            const key = `${d.getFullYear()}-${d.getMonth()}`;
            revenueBuckets.set(key, {
              month: `${monthNames[d.getMonth()]} ${String(
                d.getFullYear()
              ).slice(-2)}`,
              revenue: 0,
            });
          }

          for (const company of companies) {
            const entries = Array.isArray(company.sales)
              ? company.sales
              : Array.isArray(company.data)
              ? company.data
              : [];

            sCount += entries.length;

            for (const entry of entries) {
              const items = Array.isArray(entry.items)
                ? entry.items
                : Array.isArray(entry.sale_items)
                ? entry.sale_items
                : [entry];

              // compute entry total (prefer explicit total fields, otherwise sum item totals)
              const entryTotal =
                Number(
                  entry.total_amount ??
                    entry.total ??
                    items.reduce(
                      (s, it) =>
                        s +
                        Number(it?.total ?? it?.net_total ?? it?.amount ?? 0),
                      0
                    )
                ) || 0;

              totalSalesAmount += entryTotal;

              // month bucket by bill_date
              const dt = new Date(entry.bill_date || entry.date || Date.now());
              const key = `${dt.getFullYear()}-${dt.getMonth()}`;
              if (revenueBuckets.has(key)) {
                revenueBuckets.get(key).revenue += entryTotal;
              }

              // compute approximate profit: sum(saleValue - (purchase_rate * qty)) per item
              for (const it of items) {
                const saleValue =
                  Number(it?.net_total ?? it?.total ?? it?.amount ?? 0) || 0;
                const costPerUnit =
                  Number(it?.purchase_rate ?? it?.cost_price ?? 0) || 0;
                const qty = Number(it?.qty ?? it?.quantity ?? 0) || 0;
                totalProfit += saleValue - costPerUnit * qty;
              }
            }
          }

          setSalesInvoiceCount(sCount);
          setSalesTotalAmount(totalSalesAmount);
          setSalesTotalProfit(totalProfit);
          setRevenueData(Array.from(revenueBuckets.values()));
        } catch (err) {
          console.error("Error computing sales metrics", err);
        }
      });
    }
  }, [totalCompanies]);

  // enum('retailer','wholesaler')

  useEffect(() => {
    if (totalCompanies && totalCompanies.length > 0) {
      getAllSalesBill
        .getAllRetaildSales(totalCompanies, "retailer")
        .then((res) => {
          setProductCostRetailer(res?.data?.total);
          console.log("Sales Bills:", res.data);
          // Additional logic can be added here if needed in the future
        });
    }
  }, [totalCompanies]);

  useEffect(() => {
    if (totalCompanies && totalCompanies.length > 0) {
      getAllSalesBill
        .getAllRetaildSales(totalCompanies, "wholesaler")
        .then((res) => {
          setProductCostWholeSaler(res?.data?.total);
          console.log("Sales Bills:", res.data);
          // Additional logic can be added here if needed in the future
        });
    }
  }, [totalCompanies]);

  useEffect(() => {
    if (totalCompanies && totalCompanies.length > 0) {
      getAllSalesBill.getGstAmount(totalCompanies).then((res) => {
        setGstAmount(res?.data?.total);
        console.log("Total GST :", res.data);
        // Additional logic can be added here if needed in the future
      });
    }
  }, [totalCompanies]);

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-extrabold text-[var(--text-color)]">
        📊 Dashboard Overview
      </h2>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Link to="/proforma-invoice" className="block">
          <div className="p-6 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 shadow-lg text-white flex items-center gap-4 hover:scale-[1.01] transition-transform">
            <span className="text-4xl leading-none">💸</span>
            <div>
              <p className="text-sm opacity-80">Total Purchases</p>
              <h3 className="text-2xl font-bold">
                ₹{" "}
                {Number(purchaseTotalAmount || 0).toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </h3>
            </div>
          </div>
        </Link>

        <Link to="/proforma-invoice" className="block">
          <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-600 shadow-lg text-white flex items-center gap-4 hover:scale-[1.01] transition-transform">
            <span className="text-4xl leading-none">🧾</span>
            <div>
              <p className="text-sm opacity-80">Purchase Invoices</p>
              <h3 className="text-2xl font-bold">{purchaseInvoiceCount}</h3>
            </div>
          </div>
        </Link>

        <Link to="/sales-reports" className="block">
          <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-500 to-blue-600 shadow-lg text-white flex items-center gap-4 hover:scale-[1.01] transition-transform">
            <span className="text-4xl leading-none">📈</span>
            <div>
              <p className="text-sm opacity-80">Total Sales</p>
              <h3 className="text-2xl font-bold">
                ₹{" "}
                {Number(salesTotalAmount || 0).toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </h3>
            </div>
          </div>
        </Link>

        <Link to="/sales-reports" className="block">
          <div className="p-6 rounded-2xl bg-gradient-to-r from-yellow-500 to-amber-600 shadow-lg text-white flex items-center gap-4 hover:scale-[1.01] transition-transform">
            <span className="text-4xl leading-none">🧾</span>
            <div>
              <p className="text-sm opacity-80">Sales Invoices</p>
              <h3 className="text-2xl font-bold">{salesInvoiceCount}</h3>
            </div>
          </div>
        </Link>

        <div className="p-6 rounded-2xl bg-gradient-to-r from-orange-500 to-red-600 shadow-lg text-white flex items-center gap-4">
          <span className="text-4xl leading-none">🏢</span>
          <div>
            <p className="text-sm opacity-80">Vendors</p>
            <h3 className="text-2xl font-bold">{totalVendors}</h3>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-gradient-to-r from-orange-500 to-red-600 shadow-lg text-white flex items-center gap-4">
          <div className="flex flex-col gap-2">
            <span className="text-2xl p-1 rounded text-purple-900 font-bold">
              Retailer
            </span>
            <span className="text-4xl leading-none">🏢</span>
          </div>
          <div>
            <p className="text-sm opacity-80">Total Product Sales Cost</p>
            <h3 className="text-2xl font-bold">
              {productCostRetailer?.totalSales}
            </h3>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-gradient-to-r from-orange-500 to-red-600 shadow-lg text-white flex items-center gap-4">
          <div className="flex flex-col gap-2">
            <span className="text-2xl p-1 rounded text-purple-900 font-bold">
              Retailer
            </span>
            <span className="text-4xl leading-none">🏢</span>
          </div>
          <div>
            <p className="text-sm opacity-80">Total Product Cost</p>
            <h3 className="text-2xl font-bold">
              {productCostRetailer?.totalCost}
            </h3>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-gradient-to-r from-orange-500 to-red-600 shadow-lg text-white flex items-center gap-4">
          <div className="flex flex-col gap-2">
            <span className="text-2xl p-1 rounded text-purple-900 font-bold">
              Retailer
            </span>
            <span className="text-4xl leading-none">🏢</span>
          </div>
          <div>
            <p>Product Sales Profit</p>
            <h3 className="text-2xl font-bold">
              {Number(productCostRetailer?.totalSales) -
                Number(productCostRetailer?.totalCost)}
            </h3>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-gradient-to-r from-orange-500 to-red-600 shadow-lg text-white flex items-center gap-4">
          <div className="flex flex-col gap-2">
            <span className="text-2xl p-1 rounded text-purple-900 font-bold">
              Whole Saler
            </span>
            <span className="text-4xl leading-none">🏢</span>
          </div>
          <div>
            <p className="text-sm opacity-80">Total Product Sales Cost</p>
            <h3 className="text-2xl font-bold">
              {productCostWholeSaler?.totalSales}
            </h3>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-gradient-to-r from-orange-500 to-red-600 shadow-lg text-white flex items-center gap-4">
          <div className="flex flex-col gap-2">
            <span className="text-2xl p-1 rounded text-purple-900 font-bold">
              Whole Saler
            </span>
            <span className="text-4xl leading-none">🏢</span>
          </div>
          <div>
            <p className="text-sm opacity-80">Total Product Cost</p>
            <h3 className="text-2xl font-bold">
              {productCostWholeSaler?.totalCost}
            </h3>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-gradient-to-r from-orange-500 to-red-600 shadow-lg text-white flex items-center gap-4">
          <div className="flex flex-col gap-2">
            <span className="text-2xl p-1 rounded text-purple-900 font-bold">
              Whole Saler
            </span>
            <span className="text-4xl leading-none">🏢</span>
          </div>
          <div>
            <p>Product Sales Profit</p>
            <h3 className="text-2xl font-bold">
              {Number(productCostWholeSaler?.totalSales) -
                Number(productCostWholeSaler?.totalCost)}
            </h3>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-gradient-to-r from-orange-500 to-red-600 shadow-lg text-white flex items-center gap-4">
          <span className="text-4xl leading-none">🏢</span>
          <div>
            <p className="text-sm opacity-80">Total Sales Product GST Amount</p>
            <h3 className="text-2xl font-bold">
              {gstAmount?.totalGstFromTable}
            </h3>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-gradient-to-r from-orange-500 to-red-600 shadow-lg text-white flex items-center gap-4">
          <span className="text-4xl leading-none">🏢</span>
          <div>
            <p className="text-sm opacity-80">
              Total Purchase Product GST Amount
            </p>
            <h3 className="text-2xl font-bold">
              {gstAmount?.totalGstFromProducts}
            </h3>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-gradient-to-r from-orange-500 to-red-600 shadow-lg text-white flex items-center gap-4">
          <span className="text-4xl leading-none">🏢</span>
          <div>
            <p className="text-sm opacity-80">Total GST Profit</p>
            <h3 className="text-2xl font-bold">
              {(
                Number(gstAmount?.totalGstFromTable) -
                Number(gstAmount?.totalGstFromProducts)
              ).toFixed(2)}
            </h3>
          </div>
        </div>
      </div>

      {/* Graphs Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-[var(--bg)] shadow rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-[var(--text-color)] mb-4">
            Revenue (Recent Months)
          </h3>
          <div className="w-full h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={revenueData}
                margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#4f46e5"
                  strokeWidth={3}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Vendor Growth */}
        <div className="bg-[var(--bg)] shadow rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-[var(--text-color)] mb-4">
            Vendor Registrations
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={vendorData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="vendors" fill="#16a34a" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Transactions */}
      {/* <div className="bg-[var(--bg)] shadow rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-[var(--text-color)] mb-4">
          Recent Transactions
        </h3>
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-[var(--secondary-bg)] text-[var(--accent)]">
            <tr>
              <th className="px-4 py-2">Invoice ID</th>
              <th className="px-4 py-2">Customer</th>
              <th className="px-4 py-2">Amount</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Date</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="px-4 py-2">#INV-1001</td>
              <td className="px-4 py-2">John Doe</td>
              <td className="px-4 py-2">₹320</td>
              <td className="px-4 py-2">
                <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded text-xs">
                  <span>✅</span>
                  <span>Paid</span>
                </span>
              </td>
              <td className="px-4 py-2">24 Aug 2025</td>
            </tr>
            <tr className="border-b">
              <td className="px-4 py-2">#INV-1002</td>
              <td className="px-4 py-2">Jane Smith</td>
              <td className="px-4 py-2">₹150</td>
              <td className="px-4 py-2">
                <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs">
                  <span>⏳</span>
                  <span>Pending</span>
                </span>
              </td>
              <td className="px-4 py-2">23 Aug 2025</td>
            </tr>
            <tr>
              <td className="px-4 py-2">#INV-1003</td>
              <td className="px-4 py-2">Apex Supplies</td>
              <td className="px-4 py-2">₹780</td>
              <td className="px-4 py-2">
                <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 px-2 py-1 rounded text-xs">
                  <span>⚠️</span>
                  <span>Overdue</span>
                </span>
              </td>
              <td className="px-4 py-2">22 Aug 2025</td>
            </tr>
          </tbody>
        </table>
      </div> */}
    </div>
  );
}
