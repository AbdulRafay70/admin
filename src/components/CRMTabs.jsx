import React from 'react';
import { Nav } from 'react-bootstrap';
import { NavLink } from 'react-router-dom';
import { usePermission } from '../contexts/EnhancedPermissionContext';

export default function CRMTabs({ activeName }) {
  const { hasPermission } = usePermission();

  // Define tabs with their required permissions
  const tabs = [
    {
      name: 'Customers',
      path: '/customer-management',
      permission: 'view_walking_customer_admin' // Walking Customer permission
    },
    {
      name: 'Leads',
      path: '/lead-management',
      permission: 'view_leads_admin' // Leads permission
    },
    {
      name: 'Passport Leads',
      path: '/passport-leads',
      permission: 'view_passport_leads_admin' // Passport Leads permission
    },
  ];

  // Filter tabs based on user permissions
  const visibleTabs = tabs.filter(tab => hasPermission(tab.permission));

  // If no tabs are visible, don't render anything
  if (visibleTabs.length === 0) {
    return null;
  }

  return (
    <div className="row mb-3">
      <div className="d-flex flex-wrap justify-content-between align-items-center w-100">
        <nav className="nav flex-wrap gap-2">
          {visibleTabs.map((tab) => (
            <NavLink
              key={tab.path}
              to={tab.path}
              className={({ isActive }) =>
                `nav-link btn btn-link text-decoration-none px-0 me-3 ${isActive || activeName === tab.name ? 'text-primary fw-semibold' : 'text-muted'
                }`
              }
              style={{ backgroundColor: 'transparent' }}
            >
              {tab.name}
            </NavLink>
          ))}
        </nav>

        <div className="input-group" style={{ maxWidth: '320px' }}>
          <input type="text" className="form-control" placeholder="Search CRM..." />
        </div>
      </div>
    </div>
  );
}