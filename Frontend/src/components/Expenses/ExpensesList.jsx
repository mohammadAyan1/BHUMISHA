import React, { useEffect, useState } from "react";
import expensesAPI from "../../axios/ExpensesAPI.js";

const ExpensesList = () => {
  const [expenses, setExpenses] = useState([]);

  // Function to parse the document URL from the string
  const getDocumentUrl = (documents) => {
    if (!documents) return null;

    try {
      // If it's a JSON string with brackets, parse it
      if (documents.startsWith("[") && documents.endsWith("]")) {
        const parsed = JSON.parse(documents);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed[0];
        }
      }

      // If it's already a plain string, return it
      return documents;
    } catch (error) {
      console.error("Error parsing documents:", error);
      // If parsing fails, try to clean the string
      return documents.replace(/[\[\]"]/g, "");
    }
  };

  const fetchAllExpenses = async () => {
    try {
      const res = await expensesAPI.getAll();
      setExpenses(res?.data?.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAllExpenses();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-7xl mx-auto bg-white shadow-md rounded-lg overflow-hidden">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            Expenses List
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200 divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 uppercase">
                    Expenses For
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 uppercase">
                    Expenses Type
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 uppercase">
                    Master
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 uppercase">
                    Amount
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 uppercase">
                    Remark
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 uppercase">
                    Documents
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 uppercase">
                    Company
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 uppercase">
                    Expenses Date
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-gray-200">
                {expenses.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-4 text-center text-gray-500"
                    >
                      No expenses found
                    </td>
                  </tr>
                ) : (
                  expenses.map((data, index) => {
                    const documentUrl = getDocumentUrl(data.documents);

                    return (
                      <tr
                        key={index}
                        className="hover:bg-gray-50 transition duration-150"
                      >
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {data.expenses_for}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {data.expenses_type}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {data.master_name || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {data.amount}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {data.remark || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {documentUrl ? (
                            <a
                              href={`${
                                import.meta.env.VITE_API_BASE_URL
                              }/${documentUrl}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              View Document
                            </a>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {data.code ? `${data.code} - ${data.name}` : "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {data?.expense_date}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpensesList;
