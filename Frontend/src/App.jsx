import React, { useMemo, useState } from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
// ToastContainer is mounted once at the root (see main.jsx)

import Sidebar from "./components/Layout/Sidebar";
import Navbar from "./components/Layout/Navbar";
import { useAuth } from "./contexts/AuthContext";
import { useCompany } from "./contexts/CompanyContext";

// salary and incentive routes components

import EmployeesPage from "./components/EmployeesPage/EmployeesPage";
import EmployeeIDCard from "./components/EmployeeIDCard/EmployeeIDCard.jsx";
import SalaryPage from "./components/SalaryPage/SalaryPage.jsx";
import Incentive from "./components/Incentive/Incentive.jsx";
import AttendenceUpdate from "./components/AttendenceUpdate/AttendenceUpdate.jsx";

// Pages
import Dashboard from "./Pages/Dashboard";
import VendorManagement from "./Pages/VendorManagement.jsx";
import FarmerRegistrationPage from "./Pages/FarmerRegistrationPage";

import Categories from "./components/categories/Categories";
import Products from "./Pages/products/Products";

import Purchases from "./components/purchase/Purchases.jsx";
import PurchaseEdit from "./Pages/purchase/PurchaseEdit.jsx";
import PurchaseView from "./Pages/purchase/PurchaseView.jsx";

import CustomersPage from "./components/customers/CustomersPage.jsx";
import SalesPage from "./components/Sales/SalesPage";

import PurchaseOrders from "./components/PurchaseOrder/PurchaseOrders.jsx";
// import Invoice from "./components/PurchaseOrder/Invoice.jsx";

import SalesOrders from "./components/salesOrders/SalesOrders.jsx";

import CompaniesPage from "./components/Company/CompaniesPage.jsx";
import PurchaseForm from "./components/purchase/PurchaseForm.jsx";
import LoginPage from "./Pages/LoginPage";
import SaleOrderInvoice from "./components/salesOrders/SalesOrderInvoice.jsx";
import POinvoice from "./components/PurchaseOrder/POInvoice.jsx";
import SalesInvoice from "./components/Sales/salesInvoice";
import SalesForm from "./components/Sales/SalesForm.jsx";
import CustomProductForm from "./components/Customproductform/CustomProductForm.jsx";
import TrashProduct from "./components/trashProduct/trashProduct.jsx";
import TrashProductForm from "./components/trashProduct/trashProduct.jsx";
import AllPurchasesReport from "./components/PurchasesReports/PurchasesReports.jsx";
import SalesReports from "./components/SalesReports/SalesReports.jsx";
import Expenses from "./Pages/Expenses.jsx";
import SalaryInceptive from "./Pages/SalaryIncentive/SalaryInceptive.jsx";
import Holiday from "./components/Holiday/Holiday.jsx";

// Protected shell: Sidebar + Navbar + keyed Outlet
function AppShell() {
  const { company } = useCompany();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen((v) => !v);
  const toggleCollapse = () => setCollapsed((v) => !v);

  // Child routes re-mount on company change → auto refetch without per-page code
  const outletKey = useMemo(() => company?.code || "no-company", [company]);

  return (
    <div className="flex min-h-screen bg-[var(--secondary-bg)]">
      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        collapsed={collapsed}
        toggleSidebar={toggleSidebar}
        toggleCollapse={toggleCollapse}
      />

      {/* Main */}
      <div
        className={`flex flex-col flex-1 transition-all duration-300
          ${collapsed ? "md:ml-20" : "md:ml-64"} ml-0`}
      >
        <Navbar toggleSidebar={toggleSidebar} />
        <main className="flex-1 p-2 overflow-y-auto">
          <Outlet key={outletKey} />
        </main>
      </div>
    </div>
  );
}

// Public shell: dedicated login route only
function PublicShell() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  const { token } = useAuth();

  if (!token) return <PublicShell />;

  return (
    <>
      <Routes>
        <Route element={<AppShell />}>
          {/* Dashboard */}
          <Route path="/" element={<Dashboard />} />

          {/* Masters */}
          <Route path="/vendor" element={<VendorManagement />} />
          <Route path="/farmer" element={<FarmerRegistrationPage />} />
          <Route path="/category" element={<Categories />} />
          <Route path="/product" element={<Products />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/customproduct" element={<CustomProductForm />} />
          <Route path="/customproduct/:id" element={<CustomProductForm />} />
          <Route path="/trashproduct" element={<TrashProductForm />} />

          {/* Purchases */}
          <Route path="/purchases" element={<Purchases />} />
          <Route path="/purchases/edit/:poId" element={<PurchaseEdit />} />
          <Route path="/purchases/view/:poId" element={<PurchaseView />} />
          <Route path="/purchases/create" element={<PurchaseForm />} />
          <Route path="/proforma-invoice" element={<AllPurchasesReport />} />

          {/* Reports */}
          <Route path="/sales-reports" element={<SalesReports />} />

          {/* Sales */}
          <Route path="/sales" element={<SalesPage />} />
          {/* <Route path="/sales-orders" element={<SalesOrders />} /> */}
          <Route path="/sales-invoice/:id" element={<SalesInvoice />} />
          {/* Sales Orders */}
          <Route path="/sales-orders" element={<SalesOrders />} />
          <Route
            path="/sales-order/invoice/:id"
            element={<SaleOrderInvoice />}
          />
          <Route path="/sales/create" element={<SalesForm />} />

          {/* Purchase Orders */}
          <Route path="/po-order" element={<PurchaseOrders />} />
          <Route path="/invoice/:id" element={<POinvoice />} />

          {/* Companies */}
          <Route path="/company/new" element={<CompaniesPage />} />

          {/* salary routes */}
          <Route path="/salaryincentive" element={<SalaryInceptive />}>
            <Route index element={<EmployeesPage />} />
            <Route path="employees" element={<EmployeesPage />} />
            <Route path="employee/:employeeId" element={<EmployeeIDCard />} />
            <Route path="salary" element={<SalaryPage />} />
            <Route path="incentives" element={<Incentive />} />
            <Route path="attendance" element={<AttendenceUpdate />} />
            <Route path="holiday" element={<Holiday />} />
          </Route>

          <Route path="/expenses" element={<Expenses />} />
        </Route>

        {/* Unknown to dashboard (logged-in users) */}
        <Route path="/*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
