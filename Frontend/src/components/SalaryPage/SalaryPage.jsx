import React, { useState } from 'react';
import api from "../../axios/salaryAPI"
import EmployeeList from '../../components/EmployeeList/EmployeeList';

export default function SalaryPage() {
    const [employee, setEmployee] = useState(null);
    const [year, setYear] = useState(new Date().getFullYear());
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [report, setReport] = useState(null);

    const generate = async () => {
        if (!employee) return alert('Select employee');
        const res = await api.post('/salary/generate', { employee_id: employee.id, year, month });
        setReport(res.data.result);
    };

    const fetchReport = async () => {
        if (!employee) return alert('Select employee');
        try {
            const res = await api.get(`/salary/employee/${employee.id}?year=${year}&month=${month}`);
            setReport(res.data);
        } catch (err) {
            alert('Report not generated yet');
        }
    };

    return (
        <div style={{ display: 'flex', gap: 30 }}>
            <div style={{ width: 300 }}>
                <EmployeeList onSelect={setEmployee} />
            </div>

            <div>
                <h3>Salary — {employee?.name}</h3>
                <div>
                    <input type="number" value={year} onChange={e => setYear(Number(e.target.value))} />
                    <input type="number" value={month} onChange={e => setMonth(Number(e.target.value))} min={1} max={12} />
                </div>
                <button onClick={generate}>Generate</button>
                <button onClick={fetchReport}>Fetch saved report</button>

                {report && (
                    <div style={{ marginTop: 20 }}>
                        <p>Days in month: {report.daysInMonth}</p>
                        <p>Per day: ₹{report.perDay}</p>
                        <p>Total Deduction: ₹{report.totalDeduction}</p>
                        <p>Incentives: ₹{report.incentivesTotal}</p>
                        <h4>Final Salary: ₹{report.finalSalary}</h4>
                    </div>
                )}
            </div>
        </div>
    );
}
