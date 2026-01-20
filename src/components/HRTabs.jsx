import React from 'react';
import { Nav } from 'react-bootstrap';
import { NavLink } from 'react-router-dom';
import { usePermission } from '../contexts/EnhancedPermissionContext';

const allTabs = [
  { name: 'Dashboard', path: '/hr' }, // No permission required for dashboard
  { name: 'Employees', path: '/hr/employees', permissions: ['view_employees_admin', 'add_employees_admin', 'edit_employees_admin', 'delete_employees_admin'] },
  { name: 'Attendance', path: '/hr/attendance', permissions: ['view_attendance_admin', 'add_attendance_admin', 'edit_attendance_admin', 'delete_attendance_admin'] },
  { name: 'Movements', path: '/hr/movements', permissions: ['view_movements_admin', 'add_movements_admin', 'edit_movements_admin', 'delete_movements_admin'] },
  { name: 'Commissions', path: '/hr/commissions', permissions: ['view_hr_commission_admin', 'add_hr_commission_admin', 'edit_hr_commission_admin', 'delete_hr_commission_admin'] },
  { name: 'Punctuality', path: '/hr/punctuality', permissions: ['view_punctuality_admin', 'add_punctuality_admin', 'edit_punctuality_admin', 'delete_punctuality_admin'] },
  { name: 'Approvals', path: '/hr/approvals', permissions: ['view_approvals_admin', 'add_approvals_admin', 'edit_approvals_admin', 'delete_approvals_admin'] },
  { name: 'Payments', path: '/hr/payments', permissions: ['view_hr_payments_admin', 'add_hr_payments_admin', 'edit_hr_payments_admin', 'delete_hr_payments_admin'] },
];

export default function HRTabs({ activeName }) {
  const { hasAnyPermission } = usePermission();

  // Filter tabs based on permissions
  const tabs = allTabs.filter(tab => {
    if (!tab.permissions) return true; // Always show tabs without permission requirements (Dashboard)
    return hasAnyPermission(tab.permissions); // Check if user has any of the required permissions
  });

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
                  `nav-link btn btn-link text-decoration-none px-0 me-3 ${isActive || activeName === tab.name ? 'text-primary fw-semibold' : 'text-muted'
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
