import React, { useEffect, useState, useRef } from "react";
import { Offcanvas, Nav } from "react-bootstrap";
import axios from "axios";
import api from '../utils/Api';
import { NavLink, useLocation, Link } from "react-router-dom";
import {
  Check,
  FileAxis3DIcon,
  FileText,
  HelpCircle,
  Hotel,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  PackageIcon,
  User,
  UserPlus,
  Users,
  Building2,
  BookOpen,
  Layers,
  DollarSign,
  Bell,
  Search,
  Settings,
} from "lucide-react";
import { Bag, Cash } from "react-bootstrap-icons";
import { useAuth } from "../context/AuthContext";
import { usePermission } from "../contexts/EnhancedPermissionContext";

const Sidebar = () => {
  const { logout } = useAuth();
  const { hasAnyPermission, isLoading: permissionsLoading } = usePermission();
  const [show, setShow] = useState(false);
  const [organization, setOrganization] = useState({});
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  const getNavLinkClass = ({ isActive }) =>
    `nav-link d-flex align-items-center gap-2 ${isActive ? "active-link" : ""}`;

  useEffect(() => {
    const fetchOrganization = async () => {
      try {
        const token = localStorage.getItem("token");

        // Always fetch fresh organization data to ensure logo is up-to-date
        const selectedOrg = localStorage.getItem("selectedOrganization");
        if (!selectedOrg) return;

        const orgData = JSON.parse(selectedOrg);
        const orgId = orgData.ids ? orgData.ids[0] : orgData.id;

        try {
          // Use shared api instance which adds baseURL and auth headers
          const orgRes = await api.get(`/organizations/${orgId}/`);
          setOrganization(orgRes.data || {});
          // Update localStorage with fresh data
          localStorage.setItem("adminOrganizationData", JSON.stringify(orgRes.data || {}));
        } catch (e) {
          // If organization fetch fails (404 or other), log and continue with empty org
          console.error('Organization fetch failed (sidebar)', e);
          setOrganization({});
        }
      } catch (err) {
        console.error("Error fetching organization:", err);
      }
    };

    fetchOrganization();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("adminOrganizationData");
    logout();
  };

  return (
    <>
      <div className="custom-sidebar-position">
        {/* Mobile toggle button */}
        <button
          className="d-lg-none hamburg btn btn-dark top-0 end-0 my-2 mx-4"
          onClick={handleShow}
        >
          <Menu size={20} />
        </button>

        {/* Mobile Offcanvas */}
        <Offcanvas
          show={show}
          onHide={handleClose}
          placement="end"
          className="w-75"
        >
          <Offcanvas.Header closeButton>
            <Offcanvas.Title>
              {organization?.logo ? (
                <img
                  src={organization.logo}
                  alt={organization.name}
                  style={{
                    width: "150px",
                    height: "40px",
                    objectFit: "contain",
                  }}
                />
              ) : (
                <span>Loading...</span>
              )}
            </Offcanvas.Title>
          </Offcanvas.Header>
          <Offcanvas.Body>
            <div className="d-flex flex-column h-100">
              {<div className="d-flex flex-column flex-md-row align-items-center gap-3 w-100 justify-content-md-end header-bottom ">
                <div className="w-100 flex-md-grow-0" style={{ maxWidth: "350px" }}>
                  <div className="input-group">
                    <span className="input-group-text bg-light">
                      <Search size={18} />
                    </span>
                    <input
                      type="text"
                      className="form-control border-start-0 bg-light"
                      placeholder="Search anything"
                      style={{ boxShadow: "none" }}
                    />
                  </div>
                </div>

                <div className="d-flex align-items-center gap-2">
                  <button className="btn btn-light position-relative p-2 rounded-circle">
                    <Bell size={18} />
                    <span
                      className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                      style={{ fontSize: "10px" }}
                    >
                      .
                    </span>
                  </button>

                  <div className="dropdown" ref={dropdownRef}>
                    <button
                      className="btn d-flex align-items-center gap-2 dropdown-toggle p-0"
                      onClick={() => setShowDropdown(!showDropdown)}
                    >
                      <div
                        className="rounded-circle bg-info d-flex align-items-center justify-content-center text-white fw-bold"
                        style={{ width: "32px", height: "32px", fontSize: "14px" }}
                      >
                        MB
                      </div>
                      <div className="text-start">
                        <div
                          className="fw-semibold text-dark"
                          style={{ fontSize: "14px" }}
                        >
                          Mubeen Bhullar
                        </div>
                        <div className="text-muted" style={{ fontSize: "12px" }}>
                          Admin
                        </div>
                      </div>
                    </button>

                    {showDropdown && (
                      <div
                        className="dropdown-menu dropdown-menu-end show mt-2 p-2"
                        style={{ minWidth: "200px" }}
                      >
                        <Link
                          to="/profile"
                          className="dropdown-item rounded py-2"
                        >
                          <User size={16} className="me-2" /> Profile
                        </Link>
                        <a className="dropdown-item rounded py-2" href="#">
                          <Settings size={16} className="me-2" /> Settings
                        </a>
                        <hr className="dropdown-divider" />
                        <button
                          onClick={logout}
                          className="nav-link d-flex align-items-center gap-2 border-0 bg-transparent"
                        >
                          <LogOut size={20} /> <span className="fs-6">Logout</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>}
              <Nav className="flex-column flex-grow-1">
                {/* Nav Links */}
                <Nav.Item className="mb-3">
                  <NavLink to="/dashboard" className={getNavLinkClass}>
                    <LayoutDashboard size={20} />
                    <span className="fs-6">Dashboard</span>
                  </NavLink>
                </Nav.Item>
                <Nav.Item className="mb-3">
                  <NavLink to="/packages" className={getNavLinkClass}>
                    <PackageIcon size={20} />
                    <span className="fs-6">Packages</span>
                  </NavLink>
                </Nav.Item>
                <Nav.Item className="mb-3">
                  <NavLink to="//hotel-availability-manager" className={getNavLinkClass}>
                    <Hotel size={20} /> <span className="fs-6">Hotels</span>
                  </NavLink>
                </Nav.Item>
                {/* Hotel sub-links removed — navigation is available via HotelsTabs */}
                {/* CRM sub-links removed — use the CRM horizontal tabs inside pages for navigation */}
                {/* Blog Management - Only show if has blog permissions */}
                {hasAnyPermission(['view_blog_admin', 'add_blog_admin', 'edit_blog_admin', 'delete_blog_admin']) && (
                  <Nav.Item className="mb-3">
                    <NavLink to="/blog-management" className={getNavLinkClass}>
                      <BookOpen size={20} /> <span className="fs-6">Blog Management</span>
                    </NavLink>
                  </Nav.Item>
                )}
                <Nav.Item className="mb-3">
                  <NavLink to="/universal-list" className={getNavLinkClass}>
                    <Users size={20} /> <span className="fs-6">Universal Registry</span>
                  </NavLink>
                </Nav.Item>
                {/* CRM group - single link that opens the CRM page; use in-page tabs for subsections */}
                {/* Only show CRM if user has ANY CRM-related permission */}
                {hasAnyPermission([
                  'view_leads_admin',
                  'view_loan_admin',
                  'view_tasks_admin',
                  'view_closed_leads_admin',
                  'view_instant_admin',
                  'view_passport_leads_admin',
                  'view_walking_customer_admin',
                  'view_customer_database_admin'
                ]) && (() => {
                  // Determine which CRM page to link to based on permissions
                  let crmPath = '/customer-management'; // default
                  if (hasAnyPermission(['view_leads_admin', 'view_loan_admin', 'view_tasks_admin', 'view_closed_leads_admin', 'view_instant_admin'])) {
                    crmPath = '/lead-management';
                  } else if (hasAnyPermission(['view_passport_leads_admin'])) {
                    crmPath = '/passport-leads';
                  } else if (hasAnyPermission(['view_walking_customer_admin', 'view_customer_database_admin'])) {
                    crmPath = '/customer-management';
                  }

                  return (
                    <Nav.Item className="mb-3">
                      <NavLink to={crmPath} className={getNavLinkClass}>
                        <Users size={20} /> <span className="fs-6">CRM</span>
                      </NavLink>
                    </Nav.Item>
                  );
                })()}
                {/* Daily Operations - Only show if user has ANY daily operations permission */}
                {hasAnyPermission([
                  'view_hotel_checkin_admin',
                  'update_hotel_checkin_admin',
                  'view_ziyarat_operations_admin',
                  'update_ziyarat_operations_admin',
                  'view_transport_operations_admin',
                  'update_transport_operations_admin',
                  'view_airport_operations_admin',
                  'update_airport_operations_admin',
                  'view_food_operations_admin',
                  'update_food_operations_admin',
                  'view_pax_details_admin',
                  'update_pax_details_admin'
                ]) && (
                    <Nav.Item className="mb-3">
                      <NavLink to="/daily-operations" className={getNavLinkClass}>
                        <Check size={20} /> <span className="fs-6">Daily Operations</span>
                      </NavLink>
                    </Nav.Item>
                  )}
                {/* HR/Employees - Smart routing based on permissions */}
                {hasAnyPermission([
                  'view_employees_admin', 'add_employees_admin', 'edit_employees_admin', 'delete_employees_admin',
                  'view_attendance_admin', 'add_attendance_admin', 'edit_attendance_admin', 'delete_attendance_admin',
                  'view_movements_admin', 'add_movements_admin', 'edit_movements_admin', 'delete_movements_admin',
                  'view_hr_commission_admin', 'add_hr_commission_admin', 'edit_hr_commission_admin', 'delete_hr_commission_admin',
                  'view_punctuality_admin', 'add_punctuality_admin', 'edit_punctuality_admin', 'delete_punctuality_admin',
                  'view_approvals_admin', 'add_approvals_admin', 'edit_approvals_admin', 'delete_approvals_admin',
                  'view_hr_payments_admin', 'add_hr_payments_admin', 'edit_hr_payments_admin', 'delete_hr_payments_admin'
                ]) && (() => {
                  // Determine first accessible HR page based on view permissions
                  let hrPath = '/hr'; // default fallback
                  if (hasAnyPermission(['view_employees_admin', 'add_employees_admin', 'edit_employees_admin', 'delete_employees_admin'])) {
                    hrPath = '/hr/employees';
                  } else if (hasAnyPermission(['view_attendance_admin', 'add_attendance_admin', 'edit_attendance_admin', 'delete_attendance_admin'])) {
                    hrPath = '/hr/attendance';
                  } else if (hasAnyPermission(['view_movements_admin', 'add_movements_admin', 'edit_movements_admin', 'delete_movements_admin'])) {
                    hrPath = '/hr/movements';
                  } else if (hasAnyPermission(['view_hr_commission_admin', 'add_hr_commission_admin', 'edit_hr_commission_admin', 'delete_hr_commission_admin'])) {
                    hrPath = '/hr/commissions';
                  } else if (hasAnyPermission(['view_punctuality_admin', 'add_punctuality_admin', 'edit_punctuality_admin', 'delete_punctuality_admin'])) {
                    hrPath = '/hr/punctuality';
                  } else if (hasAnyPermission(['view_approvals_admin', 'add_approvals_admin', 'edit_approvals_admin', 'delete_approvals_admin'])) {
                    hrPath = '/hr/approvals';
                  } else if (hasAnyPermission(['view_hr_payments_admin', 'add_hr_payments_admin', 'edit_hr_payments_admin', 'delete_hr_payments_admin'])) {
                    hrPath = '/hr/payments';
                  }

                  return (
                    <Nav.Item className="mb-3">
                      <NavLink to={hrPath} className={getNavLinkClass}>
                        <User size={20} /> <span className="fs-6">Employees</span>
                      </NavLink>
                    </Nav.Item>
                  );
                })()}
                <Nav.Item className="mb-3">
                  <NavLink to="/rules-management" className={getNavLinkClass}>
                    <Layers size={20} /> <span className="fs-6">Rules Management</span>
                  </NavLink>
                </Nav.Item>
                <Nav.Item className="mb-3">
                  <NavLink to="/form-list" className={getNavLinkClass}>
                    <FileText size={20} /> <span className="fs-6">Forms Management</span>
                  </NavLink>
                </Nav.Item>
                {/* Payment - Smart routing based on permissions */}
                {hasAnyPermission([
                  'view_ledger_admin', 'view_financial_ledger_admin',
                  'add_payments_finance_admin', 'approve_payments_admin', 'reject_payments_admin',
                  'view_bank_account_admin', 'add_bank_account_admin', 'edit_bank_account_admin', 'delete_bank_account_admin',
                  'view_pending_payments_admin', 'add_remarks_pending_payments_admin'
                ]) && (() => {
                  // Determine first accessible Payment page based on permissions
                  let paymentPath = '/payment'; // default to Ledger
                  if (hasAnyPermission(['view_ledger_admin', 'view_financial_ledger_admin'])) {
                    paymentPath = '/payment';
                  } else if (hasAnyPermission(['add_payments_finance_admin'])) {
                    paymentPath = '/payment/add-payment';
                  } else if (hasAnyPermission(['view_bank_account_admin', 'add_bank_account_admin', 'edit_bank_account_admin', 'delete_bank_account_admin'])) {
                    paymentPath = '/payment/bank-accounts';
                  } else if (hasAnyPermission(['view_pending_payments_admin', 'add_remarks_pending_payments_admin'])) {
                    paymentPath = '/payment/pending-payments';
                  }

                  return (
                    <Nav.Item className="mb-3">
                      <NavLink to={paymentPath} className={getNavLinkClass}>
                        <Cash size={20} /> <span className="fs-6">Payment</span>
                      </NavLink>
                    </Nav.Item>
                  );
                })()}
                {/* Finance - Smart routing based on permissions */}
                {hasAnyPermission([
                  'view_recent_transactions_admin', 'view_profit_loss_reports_admin',
                  'view_expense_management_admin', 'add_expense_management_admin', 'edit_expense_management_admin', 'delete_expense_management_admin',
                  'view_manual_posting_admin', 'add_manual_posting_admin', 'edit_manual_posting_admin', 'delete_manual_posting_admin',
                  'view_tax_reports_fbr_admin', 'view_balance_sheet_admin', 'view_audit_trail_admin'
                ]) && (() => {
                  // Determine first accessible Finance page based on permissions
                  let financePath = '/finance'; // default to Dashboard
                  if (hasAnyPermission(['view_recent_transactions_admin'])) {
                    financePath = '/finance';
                  } else if (hasAnyPermission(['view_profit_loss_reports_admin'])) {
                    financePath = '/finance/profit-loss';
                  } else if (hasAnyPermission(['view_expense_management_admin', 'add_expense_management_admin', 'edit_expense_management_admin', 'delete_expense_management_admin'])) {
                    financePath = '/finance/expenses';
                  } else if (hasAnyPermission(['view_manual_posting_admin', 'add_manual_posting_admin', 'edit_manual_posting_admin', 'delete_manual_posting_admin'])) {
                    financePath = '/finance/manual-posting';
                  } else if (hasAnyPermission(['view_tax_reports_fbr_admin'])) {
                    financePath = '/finance/tax-reports';
                  } else if (hasAnyPermission(['view_balance_sheet_admin'])) {
                    financePath = '/finance/balance-sheet';
                  } else if (hasAnyPermission(['view_audit_trail_admin'])) {
                    financePath = '/finance/audit-trail';
                  }

                  return (
                    <Nav.Item className="mb-3">
                      <NavLink to={financePath} className={getNavLinkClass}>
                        <DollarSign size={20} /> <span className="fs-6">Finance</span>
                      </NavLink>
                    </Nav.Item>
                  );
                })()}
                {hasAnyPermission(['view_ticket_admin', 'add_ticket_admin']) && (

                  <Nav.Item className="mb-3">
                    <NavLink to="/ticket-booking" className={getNavLinkClass}>
                      <Check size={20} /> <span className="fs-6">Ticket Booking</span>
                    </NavLink>
                  </Nav.Item>
                )}
                <Nav.Item className="mb-3">
                  <NavLink to="/order-delivery" className={getNavLinkClass}>
                    <FileAxis3DIcon size={20} /> <span className="fs-6">Order Delivery</span>
                  </NavLink>
                </Nav.Item>
                <Nav.Item className="mb-3">
                  <NavLink to="/pax-movement" className={getNavLinkClass}>
                    <User size={20} /> <span className="fs-6">Pax Movement</span>
                  </NavLink>
                </Nav.Item>

                <Nav.Item className="mb-3">
                  <NavLink to="/partners" className={getNavLinkClass}>
                    <Bag size={20} /> <span className="fs-6">Partners</span>
                  </NavLink>
                </Nav.Item>
                <Nav.Item className="mb-3">
                  <NavLink to="/agency-profile" className={getNavLinkClass}>
                    <Building2 size={20} /> <span className="fs-6">Agency Relations</span>
                  </NavLink>
                </Nav.Item>
              </Nav>
              <Nav.Item className="mt-auto">
                <button
                  onClick={handleLogout}
                  className="nav-link text-danger d-flex align-items-center gap-2 border-0 bg-transparent"
                >
                  <LogOut size={20} /> <span className="fs-6">Logout</span>
                </button>
              </Nav.Item>
            </div>
          </Offcanvas.Body>
        </Offcanvas>

        {/* Desktop Sidebar */}
        <div
          className="d-none d-lg-flex flex-column vh-100 px-2 shadow"
          style={{ overflowY: "auto" }}
        >
          <div className="mt-5 d-flex justify-content-center">
            {organization?.logo && (
              <img
                src={organization.logo}
                alt={organization.name}
                style={{
                  width: "150px",
                  height: "40px",
                  objectFit: "contain",
                }}
              />
            )}
          </div>
          <div
            className="d-flex flex-column"
            style={{ flex: 1, overflowY: "auto", paddingBottom: "20px" }}
          >
            <Nav className="flex-column flex-grow-1 mt-5">
              <Nav.Item className="mb-3">
                <NavLink to="/dashboard" style={{ color: "black" }} className={getNavLinkClass}>
                  <LayoutDashboard size={20} /> <span className="fs-6">Dashboard</span>
                </NavLink>
              </Nav.Item>
              {/* Packages - Only show if has package permissions */}
              {hasAnyPermission(['view_package_admin', 'add_package_admin', 'edit_package_admin', 'delete_package_admin']) && (
                <Nav.Item className="mb-3">
                  <NavLink to="/packages" style={{ color: "black" }} className={getNavLinkClass}>
                    <PackageIcon size={20} /> <span className="fs-6">Packages</span>
                  </NavLink>
                </Nav.Item>
              )}
              {/* Ticket Booking - Only show if has ticket permissions */}
              {hasAnyPermission(['view_ticket_admin', 'add_ticket_admin']) && (
                <Nav.Item className="mb-3">
                  <NavLink to="/ticket-booking" style={{ color: "black" }} className={getNavLinkClass}>
                    <Check size={20} /> <span className="fs-6">Ticket Booking</span>
                  </NavLink>
                </Nav.Item>
              )}
              {/* Partners - Only show if has partners permissions */}
              {hasAnyPermission(['view_partners_admin', 'add_admin_users_admin', 'view_organization_admin']) && (
                <Nav.Item className="mb-3">
                  <NavLink to="/partners" style={{ color: "black" }} className={getNavLinkClass}>
                    <Bag size={20} /> <span className="fs-6">Partner's</span>
                  </NavLink>
                </Nav.Item>
              )}
              {/* Hotels - Only show if has hotel permissions */}
              {hasAnyPermission(['view_hotel_admin', 'add_hotel_admin', 'edit_hotel_admin']) && (
                <Nav.Item className="mb-3">
                  <NavLink to="/hotel-availability-manager" style={{ color: "black" }} className={getNavLinkClass}>
                    <Hotel size={20} /> <span className="fs-6">Hotels</span>
                  </NavLink>
                </Nav.Item>
              )}
              {/* Hotel sub-links removed — navigation is available via HotelsTabs */}
              {/* Blog Management - Only show if has blog permissions */}
              {hasAnyPermission(['view_blog_admin', 'add_blog_admin', 'edit_blog_admin', 'delete_blog_admin']) && (
                <Nav.Item className="mb-3">
                  <NavLink to="/blog-management" style={{ color: "black" }} className={getNavLinkClass}>
                    <BookOpen size={20} /> <span className="fs-6">Blog Management</span>
                  </NavLink>
                </Nav.Item>
              )}

              {/* CRM sub-links removed — use the CRM horizontal tabs inside pages for navigation */}
              {/* Universal Registry - Always visible (no permission in database) */}
              <Nav.Item className="mb-3">
                <NavLink to="/universal-list" style={{ color: "black" }} className={getNavLinkClass}>
                  <Users size={20} /> <span className="fs-6">Universal Registry</span>
                </NavLink>
              </Nav.Item>
              {/* CRM group - single sidebar link to CRM page (page shows horizontal tabs for subsections) */}
              {/* CRM - Only show if has ANY CRM permissions */}
              {hasAnyPermission([
                'view_leads_admin',
                'view_loan_admin',
                'view_tasks_admin',
                'view_closed_leads_admin',
                'view_instant_admin',
                'view_passport_leads_admin',
                'view_walking_customer_admin',
                'view_customer_database_admin'
              ]) && (() => {
                // Determine which CRM page to link to based on permissions
                let crmPath = '/customer-management'; // default
                if (hasAnyPermission(['view_leads_admin', 'view_loan_admin', 'view_tasks_admin', 'view_closed_leads_admin', 'view_instant_admin'])) {
                  crmPath = '/lead-management';
                } else if (hasAnyPermission(['view_passport_leads_admin'])) {
                  crmPath = '/passport-leads';
                } else if (hasAnyPermission(['view_walking_customer_admin', 'view_customer_database_admin'])) {
                  crmPath = '/customer-management';
                }

                return (
                  <Nav.Item className="mb-3">
                    <NavLink to={crmPath} style={{ color: "black" }} className={getNavLinkClass}>
                      <Users size={20} /> <span className="fs-6">CRM</span>
                    </NavLink>
                  </Nav.Item>
                );
              })()}
              {/* Daily Operations - Only show if user has ANY daily operations permission */}
              {hasAnyPermission([
                'view_hotel_checkin_admin',
                'update_hotel_checkin_admin',
                'view_ziyarat_operations_admin',
                'update_ziyarat_operations_admin',
                'view_transport_operations_admin',
                'update_transport_operations_admin',
                'view_airport_operations_admin',
                'update_airport_operations_admin',
                'view_food_operations_admin',
                'update_food_operations_admin',
                'view_pax_details_admin',
                'update_pax_details_admin'
              ]) && (
                  <Nav.Item className="mb-3">
                    <NavLink to="/daily-operations" style={{ color: "black" }} className={getNavLinkClass}>
                      <Check size={20} /> <span className="fs-6">Daily Operations</span>
                    </NavLink>
                  </Nav.Item>
                )}
              {/* HR/Employees - Smart routing based on permissions */}
              {hasAnyPermission([
                'view_employees_admin', 'add_employees_admin', 'edit_employees_admin', 'delete_employees_admin',
                'view_attendance_admin', 'add_attendance_admin', 'edit_attendance_admin', 'delete_attendance_admin',
                'view_movements_admin', 'add_movements_admin', 'edit_movements_admin', 'delete_movements_admin',
                'view_hr_commission_admin', 'add_hr_commission_admin', 'edit_hr_commission_admin', 'delete_hr_commission_admin',
                'view_punctuality_admin', 'add_punctuality_admin', 'edit_punctuality_admin', 'delete_punctuality_admin',
                'view_approvals_admin', 'add_approvals_admin', 'edit_approvals_admin', 'delete_approvals_admin',
                'view_hr_payments_admin', 'add_hr_payments_admin', 'edit_hr_payments_admin', 'delete_hr_payments_admin'
              ]) && (() => {
                // Determine first accessible HR page based on view permissions
                let hrPath = '/hr'; // default fallback
                if (hasAnyPermission(['view_employees_admin', 'add_employees_admin', 'edit_employees_admin', 'delete_employees_admin'])) {
                  hrPath = '/hr/employees';
                } else if (hasAnyPermission(['view_attendance_admin', 'add_attendance_admin', 'edit_attendance_admin', 'delete_attendance_admin'])) {
                  hrPath = '/hr/attendance';
                } else if (hasAnyPermission(['view_movements_admin', 'add_movements_admin', 'edit_movements_admin', 'delete_movements_admin'])) {
                  hrPath = '/hr/movements';
                } else if (hasAnyPermission(['view_hr_commission_admin', 'add_hr_commission_admin', 'edit_hr_commission_admin', 'delete_hr_commission_admin'])) {
                  hrPath = '/hr/commissions';
                } else if (hasAnyPermission(['view_punctuality_admin', 'add_punctuality_admin', 'edit_punctuality_admin', 'delete_punctuality_admin'])) {
                  hrPath = '/hr/punctuality';
                } else if (hasAnyPermission(['view_approvals_admin', 'add_approvals_admin', 'edit_approvals_admin', 'delete_approvals_admin'])) {
                  hrPath = '/hr/approvals';
                } else if (hasAnyPermission(['view_hr_payments_admin', 'add_hr_payments_admin', 'edit_hr_payments_admin', 'delete_hr_payments_admin'])) {
                  hrPath = '/hr/payments';
                }

                return (
                  <Nav.Item className="mb-3">
                    <NavLink to={hrPath} style={{ color: "black" }} className={getNavLinkClass}>
                      <User size={20} /> <span className="fs-6">Employees</span>
                    </NavLink>
                  </Nav.Item>
                );
              })()}
              {/* Rules Management - Only show if has rules permissions */}
              {hasAnyPermission(['view_rule_admin', 'add_rule_admin', 'edit_rule_admin', 'delete_rule_admin']) && (
                <Nav.Item className="mb-3">
                  <NavLink to="/rules-management" style={{ color: "black" }} className={getNavLinkClass}>
                    <Layers size={20} /> <span className="fs-6">Rules Management</span>
                  </NavLink>
                </Nav.Item>
              )}
              {/* Forms Management - Only show if has forms permissions */}
              {hasAnyPermission(['view_form_admin', 'add_form_admin', 'edit_form_admin', 'delete_form_admin']) && (
                <Nav.Item className="mb-3">
                  <NavLink to="/form-list" style={{ color: "black" }} className={getNavLinkClass}>
                    <FileText size={20} /> <span className="fs-6">Forms Management</span>
                  </NavLink>
                </Nav.Item>
              )}
               {/* Pax Movement - Only show if has pax movement permissions */}
              {hasAnyPermission(['view_pax_all_passengers_admin']) && (
                <Nav.Item className="mb-3">
                  <NavLink to="/pax-movement" style={{ color: "black" }} className={getNavLinkClass}>
                    <Users size={20} /> <span className="fs-6">Pax Movement</span>
                  </NavLink>
                </Nav.Item>
              )}
              <Nav.Item className="mb-3">
                  <NavLink to="/public-users" className={getNavLinkClass}>
                    <Users size={20} /> <span className="fs-6">Public Users</span>
                  </NavLink>
                </Nav.Item>
              {/* Payment - Smart routing based on permissions */}
              {hasAnyPermission([
                'view_ledger_admin', 'view_financial_ledger_admin',
                'add_payments_finance_admin', 'approve_payments_admin', 'reject_payments_admin',
                'view_bank_account_admin', 'add_bank_account_admin', 'edit_bank_account_admin', 'delete_bank_account_admin',
                'view_pending_payments_admin', 'add_remarks_pending_payments_admin'
              ]) && (() => {
                // Determine first accessible Payment page based on permissions
                let paymentPath = '/payment'; // default to Ledger
                if (hasAnyPermission(['view_ledger_admin', 'view_financial_ledger_admin'])) {
                  paymentPath = '/payment';
                } else if (hasAnyPermission(['add_payments_finance_admin'])) {
                  paymentPath = '/payment/add-payment';
                } else if (hasAnyPermission(['view_bank_account_admin', 'add_bank_account_admin', 'edit_bank_account_admin', 'delete_bank_account_admin'])) {
                  paymentPath = '/payment/bank-accounts';
                } else if (hasAnyPermission(['view_pending_payments_admin', 'add_remarks_pending_payments_admin'])) {
                  paymentPath = '/payment/pending-payments';
                }

                return (
                  <Nav.Item className="mb-3">
                    <NavLink to={paymentPath} style={{ color: "black" }} className={getNavLinkClass}>
                      <Cash size={20} /> <span className="fs-6">Payment</span>
                    </NavLink>
                  </Nav.Item>
                );
              })()}
              {/* Finance - Smart routing based on permissions */}
              {hasAnyPermission([
                'view_recent_transactions_admin', 'view_profit_loss_reports_admin',
                'view_expense_management_admin', 'add_expense_management_admin', 'edit_expense_management_admin', 'delete_expense_management_admin',
                'view_manual_posting_admin', 'add_manual_posting_admin', 'edit_manual_posting_admin', 'delete_manual_posting_admin',
                'view_tax_reports_fbr_admin', 'view_balance_sheet_admin', 'view_audit_trail_admin'
              ]) && (() => {
                // Determine first accessible Finance page based on permissions
                let financePath = '/finance'; // default to Dashboard
                if (hasAnyPermission(['view_recent_transactions_admin'])) {
                  financePath = '/finance';
                } else if (hasAnyPermission(['view_profit_loss_reports_admin'])) {
                  financePath = '/finance/profit-loss';
                } else if (hasAnyPermission(['view_expense_management_admin', 'add_expense_management_admin', 'edit_expense_management_admin', 'delete_expense_management_admin'])) {
                  financePath = '/finance/expenses';
                } else if (hasAnyPermission(['view_manual_posting_admin', 'add_manual_posting_admin', 'edit_manual_posting_admin', 'delete_manual_posting_admin'])) {
                  financePath = '/finance/manual-posting';
                } else if (hasAnyPermission(['view_tax_reports_fbr_admin'])) {
                  financePath = '/finance/tax-reports';
                } else if (hasAnyPermission(['view_balance_sheet_admin'])) {
                  financePath = '/finance/balance-sheet';
                } else if (hasAnyPermission(['view_audit_trail_admin'])) {
                  financePath = '/finance/audit-trail';
                }

                return (
                  <Nav.Item className="mb-3">
                    <NavLink to={financePath} style={{ color: "black" }} className={getNavLinkClass}>
                      <DollarSign size={20} /> <span className="fs-6">Finance</span>
                    </NavLink>
                  </Nav.Item>
                );
              })()}
              {/* Order Delivery - Only show if has order delivery permissions */}
              {hasAnyPermission(['view_order_delivery_admin', 'add_order_delivery_admin']) && (
                <Nav.Item className="mb-3">
                  <NavLink to="/order-delivery" style={{ color: "black" }} className={getNavLinkClass}>
                    <FileAxis3DIcon size={20} /> <span className="fs-6">Order Delivery</span>
                  </NavLink>
                </Nav.Item>
              )}


              {/* Agency Relations - Only show if has agency permissions */}
              {hasAnyPermission(['view_agency_admin', 'view_agency_profile_admin']) && (
                <Nav.Item className="mb-3">
                  <NavLink to="/agency-profile" style={{ color: "black" }} className={getNavLinkClass}>
                    <Building2 size={20} /> <span className="fs-6">Agency Relations</span>
                  </NavLink>
                </Nav.Item>
              )}
            </Nav>

            <Nav.Item className="mt-auto mb-3">
              <button
                onClick={handleLogout}
                className="nav-link text-danger d-flex align-items-center gap-2 border-0 bg-transparent w-100"
              >
                <LogOut size={20} /> <span className="fs-6">Logout</span>
              </button>
            </Nav.Item>
          </div>
        </div>
      </div>

      <style>
        {`
          .custom-sidebar-position {
            width: 250px;
            min-width: 250px;
            height: 100vh;
            overflow-y: auto;
            position: sticky;
            top: 0;
          }

          @media (max-width: 991.98px) {
            .custom-sidebar-position {
              position: static;
              width: 100%;
              min-width: 100%;
              height: auto;
            }
          }

          .active-link {
            color: #0d6efd !important;
            font-weight: 500;
          }
        `}
      </style>
    </>
  );
};

export default Sidebar;
