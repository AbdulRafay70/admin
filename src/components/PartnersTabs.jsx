import React from 'react';
import { Nav } from 'react-bootstrap';
import { NavLink } from 'react-router-dom';
import './PartnersTabs.css';
import { usePermission } from '../contexts/EnhancedPermissionContext';

const allTabs = [
  {
    name: 'Overview',
    path: '',
    permissions: ['view_add_users_admin', 'view_users_admin']
  },
  {
    name: 'Organization',
    path: 'organization',
    permissions: ['view_organization_admin', 'add_organization_admin', 'edit_organization_admin', 'delete_organization_admin']
  },
  {
    name: 'Role Permissions',
    path: 'role-permissions',
    permissions: ['view_groups_admin', 'add_groups_admin', 'edit_groups_admin', 'delete_groups_admin', 'assign_permissions_to_groups_admin']
  },
  {
    name: 'Discounts',
    path: 'discounts',
    permissions: ['view_discount_groups_admin', 'add_discount_groups_admin', 'edit_discount_groups_admin', 'delete_discount_groups_admin', 'assign_commission_to_discount_groups_admin']
  },
  {
    name: 'Organization Links',
    path: 'organization-links',
    permissions: ['view_create_link_org_admin', 'add_create_link_org_admin', 'edit_create_link_org_admin', 'delete_create_link_org_admin', 'view_create_resell_request_admin', 'add_create_resell_request_admin', 'edit_create_resell_request_admin', 'delete_create_resell_request_admin']
  },
  {
    name: 'Branches',
    path: 'branche',
    permissions: ['view_branch_admin', 'add_branch_admin', 'edit_branch_admin', 'delete_branch_admin']
  },
  {
    name: 'Agencies',
    path: 'agencies',
    permissions: ['view_agency_admin', 'add_agency_admin', 'edit_agency_admin', 'delete_agency_admin']
  },
  {
    name: 'Markup',
    path: 'markup',
    permissions: ['view_markup_add_group_admin', 'add_markup_add_group_admin', 'edit_markup_add_group_admin', 'delete_markup_add_group_admin', 'view_markup_assign_value_admin', 'add_markup_assign_value_admin', 'edit_markup_assign_value_admin', 'delete_markup_assign_value_admin']
  },
  {
    name: 'Commission Rules',
    path: 'commission-rules',
    permissions: ['view_commission_add_group_admin', 'add_commission_add_group_admin', 'edit_commission_add_group_admin', 'delete_commission_add_group_admin', 'view_commission_assign_value_admin', 'add_commission_assign_value_admin', 'edit_commission_assign_value_admin', 'delete_commission_assign_value_admin']
  },
  {
    name: 'Commission Earnings',
    path: 'commission-earnings',
    permissions: ['view_commission_add_group_admin', 'add_commission_add_group_admin', 'edit_commission_add_group_admin', 'delete_commission_add_group_admin']
  },
  {
    name: 'Service Charges',
    path: 'service-charges',
    permissions: ['view_commission_add_group_admin', 'add_commission_add_group_admin', 'edit_commission_add_group_admin', 'delete_commission_add_group_admin']
  },
];

export default function PartnersTabs({ activeName }) {
  const { hasAnyPermission } = usePermission();

  // REMOVED: Permission-based filtering - show all tabs always
  // User requested that all tabs remain visible regardless of which page they're on
  const visibleTabs = allTabs;

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
          {visibleTabs.map((tab) => (
            <NavLink
              key={tab.name}
              to={resolveTo(tab.path)}
              end={tab.path === ''}
              className={({ isActive }) =>
                `partners-tab-link ${isActive || activeName === tab.name ? 'active' : ''
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