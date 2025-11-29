import React, { useEffect, useState } from "react";
import holidayAPI from "../../axios/Holiday";

const Holiday = () => {
  const [holidayData, setHolidayData] = useState({
    holidayDate: "",
    holidayRemark: "",
  });

  const fetchHolidayData = async () => {
    await holidayAPI
      .getAll()
      .then((res) => {
        console.log(res);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const createHoliday = async (e) => {
    e.preventDefault();
    await holidayAPI
      .create(holidayData)
      .then((res) => {
        console.log(res);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  useEffect(() => {
    fetchHolidayData();
  }, []);
  return (
    <div className="flex flex-col bg-blue-700 rounded p-4">
      <form onSubmit={createHoliday}>
        <div className="flex flex-col">
          <label className="">select date for Holiday</label>
          <input
            type="date"
            name="holidayDate"
            value={holidayData?.holidayDate}
            className="border rounded min-[100px] p-2 bg-white"
            onChange={(e) =>
              setHolidayData((prev) => ({
                ...prev,
                [e.target.name]: e.target.value,
              }))
            }
            required
          />
        </div>
        <div className="flex flex-col">
          <label>Reason For Holiday</label>
          <input
            type="text"
            name="holidayRemark"
            value={holidayData?.holidayRemark}
            placeholder="Holiday reason"
            className="border rounded p-2 bg-white"
            onChange={(e) =>
              setHolidayData((prev) => ({
                ...prev,
                [e.target.name]: e.target.value,
              }))
            }
          />
        </div>

        <button className="bg-blue-600 p-2 rounded mt-1">Submit</button>
      </form>
    </div>
  );
};

export default Holiday;
