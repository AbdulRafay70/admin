import React from 'react';
import { Nav } from 'react-bootstrap';
import { NavLink } from 'react-router-dom';
import { usePermission } from '../contexts/EnhancedPermissionContext';

const allTabs = [
    { name: 'Ledger', path: '/payment', permissions: ['view_ledger_admin', 'view_financial_ledger_admin'] },
    { name: 'Add Payment', path: '/payment/add-payment', permissions: ['add_payments_finance_admin'] },
    { name: 'Bank Accounts', path: '/payment/bank-accounts', permissions: ['view_bank_account_admin', 'add_bank_account_admin', 'edit_bank_account_admin', 'delete_bank_account_admin'] },
    { name: 'Kuickpay', path: '/payment/kuickpay' }, // No specific permission mentioned
    { name: 'Pending Payments', path: '/payment/pending-payments', permissions: ['view_pending_payments_admin', 'add_remarks_pending_payments_admin'] },
    { name: 'Booking History', path: '/payment/booking-history', permissions: ['view_booking_history_admin', 'view_agent_bookings_admin', 'view_branch_bookings_admin', 'view_employee_bookings_admin', 'view_org_bookings_admin'] },
];

export default function PaymentTabs({ activeName }) {
    const { hasAnyPermission } = usePermission();

    // Filter tabs based on permissions
    const tabs = allTabs.filter(tab => {
        if (!tab.permissions) return true; // Always show tabs without permission requirements
        return hasAnyPermission(tab.permissions); // Check if user has any of the required permissions
    });

    return (
        <div className="row">
            <div className="d-flex flex-wrap justify-content-between align-items-center w-100">
                <nav className="nav flex-wrap gap-2">
                    {tabs.map((tab) => {
                        return (
                            <NavLink
                                key={tab.path}
                                to={tab.path}
                                end={tab.path === '/payment'}
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
