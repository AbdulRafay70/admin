import React from 'react';
import { Nav } from 'react-bootstrap';
import { NavLink } from 'react-router-dom';

const tabs = [
  { name: 'Dashboard', path: '/hr' },
  { name: 'Employees', path: '/hr/employees' },
  { name: 'Attendance', path: '/hr/attendance' },
  { name: 'Movements', path: '/hr/movements' },
  { name: 'Commissions', path: '/hr/commissions' },
  { name: 'Punctuality', path: '/hr/punctuality' },
  { name: 'Approvals', path: '/hr/approvals' },
  { name: 'Payments', path: '/hr/payments' },
];

export default function HRTabs({ activeName }) {
  return (
    <div className="row mb-3">
      <div className="d-flex flex-wrap justify-content-between align-items-center w-100">
        <nav className="nav flex-wrap gap-2">
          {tabs.map((tab) => {
            return (
              <NavLink
                key={tab.path}
                to={tab.path}
                end={tab.path === '/hr'}
                className={({ isActive }) =>
                  `nav-link btn btn-link text-decoration-none px-0 me-3 ${
                    isActive || activeName === tab.name ? 'text-primary fw-semibold' : 'text-muted'
                  }`
                }
                style={{ backgroundColor: 'transparent', border: 'none' }}
              >
                {tab.name}
              </NavLink>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
