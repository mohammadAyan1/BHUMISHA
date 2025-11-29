import React, { useEffect, useState } from "react";
import expensesAPI from "../../axios/ExpensesAPI.js";

const ExpensesList = () => {
  const [expenses, setExpenses] = useState([]);

  const fetcAllExpenses = async () => {
    expensesAPI
      .getAll()
      .then((res) => {
        setExpenses(res?.data?.data || []);
      })
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetcAllExpenses();
  }, []);

  return (
    <div>
      <table border="1" style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>Expenses For</th>
            <th>Expenses Type</th>
            <th>Master</th>
            <th>Amount</th>
            <th>remark</th>
            <th>documents</th>
          </tr>
        </thead>

        <tbody>
          {expenses.map((data, index) => (
            <tr key={index}>
              <td>{data.expenses_for}</td>
              <td>{data.expenses_type}</td>
              <td>{data.master}</td>
              <td>{data.amount}</td>
              <td>{data.remark}</td>
              {data?.documents && (
                <td>
                  <a
                    href={`${import.meta.env.VITE_API_BASE_URL}/${
                      data.documents
                    }`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-blue-700"
                  >
                    View Documents/Image
                  </a>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ExpensesList;
