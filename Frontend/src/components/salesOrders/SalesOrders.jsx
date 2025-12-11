import React, { useState } from "react";
import CreateSalesOrder from "./CreateSalesOrder";
import SalesOrderList from "./SalesOrderList";
import { Link } from "react-router-dom";

export default function SalesOrders() {
  const [editing, setEditing] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="min-h-screen  bg-gray-100">
      <h2 className="text-2xl bg-white px-2 py-2 rounded-md  font-bold mb-4">
        Sales Orders
      </h2>

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
          to="/customers"
          target="_blank"
          rel="noopener noreferrer"
        >
          customer
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

      <div className="mb-6 bg-white rounded shadow p-4">
        <CreateSalesOrder
          so={editing}
          onSaved={() => {
            setEditing(null);
            setRefreshKey((k) => k + 1); // trigger list reload
          }}
        />
      </div>

      <div className="bg-white rounded shadow p-4">
        <SalesOrderList
          key={refreshKey} // optional: remount on refresh
          refreshKey={refreshKey}
          onEdit={(so) => setEditing(so)}
        />
      </div>
    </div>
  );
}

// import React, { useState } from "react";
// import CreateSalesOrder from "./CreateSalesOrder";
// import SalesOrderList from "./SalesOrderList";
// import { Link } from "react-router-dom";

// export default function SalesOrders() {
//   const [editing, setEditing] = useState(null);
//   const [refreshKey, setRefreshKey] = useState(0);

//   return (
//     <div className="min-h-screen bg-gray-50 p-4 md:p-6">
//       <div className="mb-6">
//         <h2 className="text-2xl font-bold text-gray-800 mb-2">Sales Orders</h2>
//         <p className="text-gray-600">
//           Manage all sales transactions and invoices
//         </p>
//       </div>

//       <div className="flex flex-wrap gap-3 mb-6 p-4 bg-white rounded-xl shadow-sm">
//         <Link
//           className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
//           to="/vendor"
//           target="_blank"
//           rel="noopener noreferrer"
//         >
//           <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
//             <path
//               fillRule="evenodd"
//               d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
//               clipRule="evenodd"
//             />
//           </svg>
//           Vendor
//         </Link>
//         <Link
//           className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
//           to="/customer"
//           target="_blank"
//           rel="noopener noreferrer"
//         >
//           <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
//             <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
//           </svg>
//           Customer
//         </Link>
//         <Link
//           className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition flex items-center gap-2"
//           to="/farmer"
//           target="_blank"
//           rel="noopener noreferrer"
//         >
//           <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
//             <path
//               fillRule="evenodd"
//               d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"
//               clipRule="evenodd"
//             />
//           </svg>
//           Farmer
//         </Link>
//         <Link
//           className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center gap-2"
//           to="/products"
//           target="_blank"
//           rel="noopener noreferrer"
//         >
//           <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
//             <path
//               fillRule="evenodd"
//               d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z"
//               clipRule="evenodd"
//             />
//           </svg>
//           Products
//         </Link>
//       </div>

//       <div className="mb-6 bg-white rounded-xl shadow p-4 md:p-6">
//         <CreateSalesOrder
//           so={editing}
//           onSaved={() => {
//             setEditing(null);
//             setRefreshKey((k) => k + 1);
//           }}
//         />
//       </div>

//       <div className="bg-white rounded-xl shadow p-4 md:p-6">
//         <SalesOrderList
//           key={refreshKey}
//           refreshKey={refreshKey}
//           onEdit={(so) => setEditing(so)}
//         />
//       </div>
//     </div>
//   );
// }
