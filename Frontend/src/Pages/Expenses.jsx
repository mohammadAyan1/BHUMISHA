import React from "react";
import Dropdowns from "../components/Expenses/Dropdowns";
import ExpensesList from "../components/Expenses/ExpensesList";
import { useState } from "react";

const Expenses = () => {
  const [openExpenses, setOpenExpenses] = useState("form");
  return (
    <>
      <div className="flex justify-around bg-blue-700 p-2 rounded">
        <div className="bg-white p-1 rounded">
          <button onClick={() => setOpenExpenses("form")}>Expenses Form</button>
        </div>
        <div className="bg-white p-1 rounded">
          <button onClick={() => setOpenExpenses("list")}>Expenses List</button>
        </div>
      </div>
      {openExpenses == "form" ? <Dropdowns /> : <ExpensesList />}
    </>
  );
};

export default Expenses;
