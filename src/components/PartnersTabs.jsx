import React from 'react';
import { Nav } from 'react-bootstrap';
import { NavLink } from 'react-router-dom';
import './PartnersTabs.css';

const tabs = [
  // use relative paths so tabs resolve under the current parent route (e.g. /admin/partners)
  { name: 'Overview', path: '' },
  { name: 'Organization', path: 'organization' },
  { name: 'Role Permissions', path: 'role-permissions' },
  { name: 'Discounts', path: 'discounts' },
  { name: 'Organization Links', path: 'organization-links' },
  { name: 'Branches', path: 'branche' },
  { name: 'Markup', path: 'markup' },
  { name: 'Commission Rules', path: 'commission-rules' },
];

export default function PartnersTabs({ activeName }) {
  // Always resolve partners tabs to absolute /partners paths so
  // the links work even when the app is mounted under a prefix
  // like /admin (e.g. current location /admin/partners).
  const partnersBase = '/partners';

  const resolveTo = (tabPath) => {
    // If it's already absolute (starts with '/'), use it as-is (Portal)
    if (tabPath.startsWith('/')) return tabPath;
    // Otherwise map to /partners or /partners/<tabPath>
    return tabPath ? `${partnersBase}/${tabPath}` : partnersBase;
  };

  return (
    <div className="partners-tabs-wrapper">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
        <nav className="partners-tabs-nav">
          {tabs.map((tab) => (
            <NavLink
              key={tab.name}
              to={resolveTo(tab.path)}
              end={tab.path === ''}
              className={({ isActive }) =>
                `partners-tab-link ${
                  isActive || activeName === tab.name ? 'active' : ''
                }`
              }
            >
              {tab.name}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}