import React from 'react';
import { Nav } from 'react-bootstrap';
import { NavLink } from 'react-router-dom';
import { usePermission } from '../contexts/EnhancedPermissionContext';

const allTabs = [
  { name: 'Overview', path: '/hotel-availability-manager' },
  // Map to the app's actual routes
  { name: 'Availability', path: '/hotel-availability', permission: 'view_availability_admin' },
  { name: 'Outsourcing', path: '/hotel-outsourcing', permission: 'view_outsourcing_admin' },
  { name: 'Floor Management', path: '/hotel-floor-management', permission: 'view_floor_management_admin' },
  // { name: 'Add Hotel', path: '/hotels/add-hotels' },
];

export default function HotelsTabs({ activeName }) {
  const { hasPermission, hasAnyPermission } = usePermission();

  // Filter tabs based on permissions
  const tabs = allTabs.filter(tab => {
    // If tab has no permission requirement, always show it
    if (!tab.permission) return true;
    // Otherwise, check if user has the required permission
    return hasPermission(tab.permission);
  });

  return (
    <div className="row mb-3">
      <div className="d-flex flex-wrap justify-content-between align-items-center w-100">
        <nav className="nav flex-wrap gap-2">
          {tabs.map((tab) => (
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

        <div className="input-group" style={{ maxWidth: '300px' }}>
          <input type="text" className="form-control" placeholder="Search hotels..." />
        </div>
      </div>
    </div>
  );
}
