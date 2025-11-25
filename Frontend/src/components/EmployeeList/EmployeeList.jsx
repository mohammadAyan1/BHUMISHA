import React, { useEffect, useState } from 'react';
import api from '../../axios/employeeAPI';

export default function EmployeeList({ onSelect }) {
    const [employees, setEmployees] = useState([]);
    useEffect(() => {
        api.getAll().then(res => setEmployees(res.data)).catch(console.error);
    }, []);
    return (
        <div>
            <h2>Employees</h2>
            <ul>
                {employees.map(e => (
                    <li key={e.id}>
                        <button onClick={() => onSelect(e)}>{e.name} — ₹{e.base_salary}</button>
                    </li>
                ))}
            </ul>
        </div>
    );
}
