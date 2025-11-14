import React, { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import { Link, NavLink } from "react-router-dom";
import Header from "../../components/Header";
import { Search } from "lucide-react";
import { Gear } from "react-bootstrap-icons";
import { Button } from "react-bootstrap";
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const BankAccountsScreen = () => {
  const tabs = [
    { name: "Ledger", path: "/payment", isActive: true },
    { name: "Add Payment", path: "/payment/add-payment", isActive: false },
    { name: "Bank Accounts", path: "/payment/bank-accounts", isActive: false },
    { name: "Pending Payments", path: "/payment/pending-payments", isActive: false },
    { name: "Booking History", path: "/payment/booking-history", isActive: false },
  ];

  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({ bankName: '', accountTitle: '', accountNumber: '', isCompany: '' });

  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    bankName: "",
    accountTitle: "",
    accountNumber: "",
    iban: "",
    isCompanyAccount: true,
    status: 'active',
    createdById: ''
  });

  const [bankAccounts, setBankAccounts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [editingAccount, setEditingAccount] = useState(null);
  const [users, setUsers] = useState([]);

  const toggleDropdown = (accountId) => {
    setDropdownOpen(dropdownOpen === accountId ? null : accountId);
  };

  // Safely render values that might be objects (some API shapes return nested objects)
  const renderVal = (val) => {
    if (val === null || val === undefined) return "";
    if (typeof val === 'object') {
      // Try common nested properties that may hold a human-readable string
      if (val.bank_name) return String(val.bank_name);
      if (val.name) return String(val.name);
      if (val.account_title) return String(val.account_title);
      if (val.title) return String(val.title);
      // Fallback to a compact JSON representation for debugging
      try { return JSON.stringify(val); } catch (e) { return String(val); }
    }
    return String(val);
  };

  const handleAction = (action, accountId) => {
    console.log(`${action} action for account ID: ${accountId}`);
    setDropdownOpen(null);
    // Add your action logic here
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // fetch bank accounts from API
  const fetchBankAccounts = async () => {
    setLoadingAccounts(true);
    setFetchError(null);
    try {
  const organization_id = getOrgId();
  console.debug('fetchBankAccounts - organization_id:', organization_id);
  const branch_id = (() => { try { const s = JSON.parse(localStorage.getItem('selectedOrganization')) || {}; return s?.branch_id || s?.branch || localStorage.getItem('selectedBranchId') || 0; } catch (_) { return localStorage.getItem('selectedBranchId') || 0; } })();
      const token = localStorage.getItem('accessToken');
      const resp = await axios.get('https://api.saer.pk/api/bank-accounts/', {
        params: { organization: organization_id, organization_id, branch_id, _ts: Date.now() },
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = Array.isArray(resp.data) ? resp.data : (resp.data.results || []);
      setBankAccounts(data);
    } catch (err) {
      console.error('Failed to fetch bank accounts', err);
      setFetchError('Failed to load bank accounts');
    } finally {
      setLoadingAccounts(false);
    }
  };

  // helper: robustly extract organization id from localStorage
  const getOrgId = () => {
    try {
      const adminOrgRaw = localStorage.getItem('adminOrganizationData');
      if (adminOrgRaw) {
        const adminOrg = JSON.parse(adminOrgRaw);
        if (adminOrg && (adminOrg.id || adminOrg.pk)) return adminOrg.id || adminOrg.pk;
      }
      const raw = localStorage.getItem('selectedOrganization');
      if (!raw) return 0;
      const parsed = JSON.parse(raw);
      if (!parsed) return 0;
      if (typeof parsed === 'number') return parsed;
      if (typeof parsed === 'string' && !isNaN(Number(parsed))) return Number(parsed);
      if (parsed.ids && Array.isArray(parsed.ids) && parsed.ids.length) return parsed.ids[0];
      if (parsed.id) return parsed.id;
      if (parsed.organization && (parsed.organization.id || parsed.organization_id)) return parsed.organization.id || parsed.organization_id;
      if (parsed.org_id) return parsed.org_id;
      if (parsed.organization_id) return parsed.organization_id;
      return 0;
    } catch (e) {
      return 0;
    }
  };

  useEffect(() => {
    fetchBankAccounts();
  }, []);

  const resetForm = () => setFormData({ bankName: '', accountTitle: '', accountNumber: '', iban: '', isCompanyAccount: true, status: 'active', createdById: '' });

  const fetchUsers = async (organization_id) => {
    try {
      console.debug('fetchUsers - organization_id:', organization_id);
      const token = localStorage.getItem('accessToken');
      const resp = await axios.get(`https://api.saer.pk/api/users/?organization=${organization_id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = Array.isArray(resp.data) ? resp.data : (resp.data.results || []);
      setUsers(data);
    } catch (err) {
      console.warn('Failed to fetch users for created_by select', err);
      setUsers([]);
    }
  };

  useEffect(() => {
    if (showModal) {
      fetchUsers(getOrgId());
    }
  }, [showModal]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoadingSubmit(true);
    try {
  const organization_id = getOrgId();
      // Derive branch/agency/created_by from token payload when possible (no user inputs shown for these IDs)
      const rawToken = localStorage.getItem('accessToken');
      let decoded = {};
      if (rawToken) {
        try {
          decoded = jwtDecode(rawToken) || {};
        } catch (e) {
          console.warn('Failed to decode JWT with jwt-decode, falling back to manual parse', e);
          try {
            const payload = rawToken.split('.')[1];
            const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
            decoded = JSON.parse(json);
          } catch (ee) {
            decoded = {};
          }
        }
      }
  const selectedOrganization = (() => { try { return JSON.parse(localStorage.getItem('selectedOrganization')) || {}; } catch (_) { return {}; } })();
  const branch_id = decoded.branch_id || decoded.branch || selectedOrganization?.branch_id || selectedOrganization?.branch || localStorage.getItem('selectedBranchId') || 0;
      let agency_id = decoded.agency_id || decoded.agency || localStorage.getItem('selectedAgencyId') || 0;
      // If agency_id still not available, try to fetch available agencies for this organization and pick the first one as a fallback
      if (!agency_id || Number(agency_id) === 0) {
        try {
          const tokenHeader = rawToken ? { Authorization: `Bearer ${rawToken}` } : {};
          const agencyResp = await axios.get(`https://api.saer.pk/api/agencies/?organization=${organization_id}`, { headers: tokenHeader });
          const agencies = Array.isArray(agencyResp.data) ? agencyResp.data : (agencyResp.data.results || []);
          if (agencies.length > 0) {
            const first = agencies[0];
            agency_id = first.agency_id || first.id || first.pk || agency_id;
            console.debug('bank account submit - picked fallback agency id', agency_id);
          }
        } catch (e) {
          console.warn('Could not fetch agencies for fallback agency_id', e);
        }
      }
  const created_by_id = formData.createdById || decoded.user_id || decoded.id || decoded.sub || (JSON.parse(localStorage.getItem('user')) || {}).id || 0;
      // If this is a company account the backend requires created_by_id to be present
      if (formData.isCompanyAccount && (!created_by_id || Number(created_by_id) === 0)) {
        console.error('created_by_id missing while is_company_account is true', { decoded, created_by_id });
        alert('Cannot create company account because created_by_id is missing from your token or localStorage.user. Please login or ensure your token contains user id.');
        setLoadingSubmit(false);
        return;
      }
      // Normalize branch_id: it may be numeric PK or a branch_code/name string stored in localStorage.
      let numericBranchId = null;
      try {
        if (branch_id && !isNaN(Number(branch_id)) && Number(branch_id) > 0) {
          numericBranchId = Number(branch_id);
        } else if (branch_id) {
          // attempt to resolve branch_code or name to numeric id via branches API
          try {
            const tokenHeader = rawToken ? { Authorization: `Bearer ${rawToken}` } : {};
            const branchesResp = await axios.get('https://api.saer.pk/api/branches/', {
              params: { organization_id: organization_id },
              headers: tokenHeader
            });
            const branchItems = Array.isArray(branchesResp.data) ? branchesResp.data : (branchesResp.data.results || []);
            const match = branchItems.find(b => b.branch_code === String(branch_id) || b.name === String(branch_id) || String(b.id) === String(branch_id));
            if (match) numericBranchId = match.id;
          } catch (e) {
            console.warn('Could not resolve branch identifier to numeric id', e);
          }
        }
      } catch (e) {
        numericBranchId = null;
      }

      const payload = {
        organization_id: Number(organization_id) || undefined,
        // Only include branch_id when a valid branch is available (>0)
        ...(numericBranchId && Number(numericBranchId) > 0 ? { branch_id: Number(numericBranchId) } : {}),
        ...(Number(agency_id) > 0 ? { agency_id: Number(agency_id) } : {}),
  // created_by_id is deprecated for BankAccount model; do not send it
        bank_name: formData.bankName,
        account_title: formData.accountTitle,
        account_number: formData.accountNumber,
        iban: formData.iban,
        status: formData.status || 'active',
  // is_company_account no longer part of the model; omit
      };
      // Ensure created_by is present in the shape the backend may expect.
      // If this is a company account, try to fetch the full user object and attach it as `created_by` in addition to `created_by_id`.
      if (formData.isCompanyAccount && created_by_id) {
        try {
          const tokenHeader = rawToken ? { Authorization: `Bearer ${rawToken}` } : {};
          const userResp = await axios.get(`https://api.saer.pk/api/users/${created_by_id}/`, { headers: tokenHeader });
          // attach the full user object under created_by (backend may expect nested object)
          payload.created_by = userResp.data;
        } catch (e) {
          // fallback: also include numeric created_by field (some backends expect string or numeric)
          payload.created_by = Number(created_by_id) || payload.created_by_id;
          console.warn('Could not fetch user object for created_by; sending numeric id as fallback', e);
        }
      }
      console.debug('bank account submit - token decoded payload and payload to send', { decoded, payload });
      const token = localStorage.getItem('accessToken');
      let resp;
      if (editingAccount && (editingAccount.id || editingAccount.pk)) {
        const id = editingAccount.id || editingAccount.pk;
        resp = await axios.put(`https://api.saer.pk/api/bank-accounts/${id}/`, payload, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
      } else {
        resp = await axios.post('https://api.saer.pk/api/bank-accounts/', payload, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
      }
      console.debug('saved bank account', resp.data);
      // refresh list
      await fetchBankAccounts();
      setShowModal(false);
      resetForm();
      setEditingAccount(null);
      window.alert(editingAccount ? 'Bank account updated' : 'Bank account created');
    } catch (err) {
      console.error('Failed to create bank account', err, err.response && err.response.data);
      // simple UI feedback: keep modal open for user to retry
      const serverMsg = err?.response?.data ? JSON.stringify(err.response.data) : 'Check console for details.';
      alert(`Failed to save bank account: ${serverMsg}`);
    } finally {
      setLoadingSubmit(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
    setEditingAccount(null);
  };

  const handleEdit = (account) => {
    setEditingAccount(account);
    setFormData({
      bankName: account.bank_name || account.bankName || '',
      accountTitle: account.account_title || account.accountTitle || '',
      accountNumber: account.account_number || account.accountNumber || '',
      iban: account.iban || '',
      isCompanyAccount: account.is_company_account || account.isCompanyAccount || false,
      status: account.status || 'active',
      // branch/agency are derived from token on submit; created_by can be selected when needed
      createdById: account.created_by_id || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (account) => {
    if (!account) return;
    const ok = window.confirm('Are you sure you want to delete this bank account?');
    if (!ok) return;
    try {
      const token = localStorage.getItem('accessToken');
      const id = account.id || account.pk || account.account_number;
      await axios.delete(`https://api.saer.pk/api/bank-accounts/${id}/`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      await fetchBankAccounts();
      window.alert('Bank account deleted');
    } catch (err) {
      console.error('Failed to delete bank account', err);
      alert('Failed to delete bank account. See console for details.');
    }
  };

  return (
    <div className="min-vh-100" style={{ fontFamily: "Poppins, sans-serif" }}>
      <div className="row g-0">
        {/* Sidebar */}
        <div className="col-12 col-lg-2">
          <Sidebar />
        </div>
        {/* Main Content */}
        <div className="col-12 col-lg-10">
          <div className="container">
            <Header />
            <div className="px-3 px-lg-4 my-3">
              {/* Navigation Tabs */}
              <div className="row ">
                <div className="d-flex flex-wrap justify-content-between align-items-center w-100">
                  {/* Navigation Tabs */}
                  <nav className="nav flex-wrap gap-2">
                    {tabs.map((tab, index) => (
                      <NavLink
                        key={index}
                        to={tab.path}
                        className={`nav-link btn btn-link text-decoration-none px-0 me-3 border-0 ${tab.name === "Bank Accounts"
                          ? "text-primary fw-semibold"
                          : "text-muted"
                          }`}
                        style={{ backgroundColor: "transparent" }}
                      >
                        {tab.name}
                      </NavLink>
                    ))}
                  </nav>

                  {/* Action Buttons */}
                  <div className="input-group" style={{ maxWidth: "300px" }}>
                    <span className="input-group-text">
                      <Search />
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search name, address, job, etc"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div className="min-vh-100">
                <div className="row">
                  <div className="col-12 col-xl-12">
                    <div
                      className="card shadow-sm border-0"
                      onClick={() => setDropdownOpen(null)}
                    >
                      <div
                        className="card-body p-4"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <h4 className="card-title mb-4 fw-bold text-dark">
                          Bank Accounts Information
                        </h4>

                        <div className="table-responsive">
                          {loadingAccounts ? (
                            <div className="text-center py-4">Loading bank accounts...</div>
                          ) : fetchError ? (
                            <div className="text-center text-danger py-4">{fetchError}</div>
                          ) : (
                            <>
                              {/* Filters */}
                              <div className="row mb-3 g-2 align-items-center">
                                <div className="col-auto">
                                  <input type="text" className="form-control" placeholder="Filter Bank Name" name="bankName" value={filters.bankName} onChange={handleFilterChange} />
                                </div>
                                <div className="col-auto">
                                  <input type="text" className="form-control" placeholder="Filter Account Title" name="accountTitle" value={filters.accountTitle} onChange={handleFilterChange} />
                                </div>
                                <div className="col-auto">
                                  <input type="text" className="form-control" placeholder="Filter Account Number" name="accountNumber" value={filters.accountNumber} onChange={handleFilterChange} />
                                </div>
                                <div className="col-auto">
                                  <select className="form-select" name="isCompany" value={filters.isCompany} onChange={handleFilterChange}>
                                    <option value="">All</option>
                                    <option value="yes">Company</option>
                                    <option value="no">Agent</option>
                                  </select>
                                </div>
                                <div className="col-auto">
                                  <button className="btn btn-outline-secondary" type="button" onClick={() => setFilters({ bankName: '', accountTitle: '', accountNumber: '', isCompany: '' })}>Clear</button>
                                </div>
                              </div>
                              <table className="table table-borderless">
                            <thead>
                              <tr className="border-bottom">
                                <th className="fw-normal text-muted pb-3">
                                  Bank Name
                                </th>
                                <th className="fw-normal text-muted pb-3">
                                  Account Title
                                </th>
                                <th className="fw-normal text-muted pb-3">
                                  Account Number
                                </th>
                                <th className="fw-normal text-muted pb-3">IBAN</th>
                                <th className="fw-normal text-muted pb-3">Company Account</th>
                                <th className="fw-normal text-muted pb-3">
                                  Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {bankAccounts
                                .filter(account => {
                                  if (filters.bankName && !(account.bank_name || account.bankName || '').toLowerCase().includes(filters.bankName.toLowerCase())) return false;
                                  if (filters.accountTitle && !(account.account_title || account.accountTitle || '').toLowerCase().includes(filters.accountTitle.toLowerCase())) return false;
                                  if (filters.accountNumber && !(account.account_number || account.accountNumber || '').toLowerCase().includes(filters.accountNumber.toLowerCase())) return false;
                                  if (filters.isCompany === 'yes' && !(account.is_company_account || account.isCompanyAccount)) return false;
                                  if (filters.isCompany === 'no' && (account.is_company_account || account.isCompanyAccount)) return false;
                                  return true;
                                })
                                .map((account) => (
                                <tr key={account.id || account.pk || account.account_number} className="border-bottom">
                                  <td className="py-3">
                                    <span
                                      className="fw-bold text-dark text-decoration-underline"
                                      style={{ cursor: "pointer" }}
                                    >
                                      {renderVal(account.bank_name || account.bankName)}
                                    </span>
                                  </td>
                                  <td className="py-3 text-muted">
                                    {renderVal(account.account_title || account.accountTitle)}
                                  </td>
                                  <td className="py-3 text-dark">
                                    {renderVal(account.account_number || account.accountNumber)}
                                  </td>
                                  <td className="py-3 text-dark">{renderVal(account.iban)}</td>
                                  <td className="py-3 text-center">
                                    {(account.is_company_account || account.isCompanyAccount) ? 'Yes' : 'No'}
                                  </td>
                                  <td className="py-3">
                                    <div className="dropdown">
                                      <button
                                        className="btn btn-link p-0 text-primary"
                                        style={{ textDecoration: "none" }}
                                        onClick={() => toggleDropdown(account.id || account.pk || account.account_number)}
                                      >
                                        <Gear />
                                      </button>
                                      {dropdownOpen === (account.id || account.pk || account.account_number) && (
                                        <div
                                          className="dropdown-menu show position-absolute bg-white border rounded shadow-sm py-1"
                                          style={{
                                            right: 0,
                                            top: "100%",
                                            minWidth: "120px",
                                            zIndex: 1000,
                                          }}
                                        >
                                          <button
                                            className="dropdown-item py-2 px-3 border-0 bg-transparent w-100 text-start"
                                            onClick={() => handleEdit(account)}
                                            style={{ color: "#1B78CE" }}
                                          >
                                            Edit
                                          </button>
                                          <button
                                            className="dropdown-item py-2 px-3 border-0 bg-transparent w-100 text-start text-danger"
                                            onClick={() => handleDelete(account)}
                                          >
                                            Remove
                                          </button>
                                          <button
                                            className="dropdown-item py-2 px-3 border-0 bg-transparent w-100 text-start text-secondary"
                                            onClick={() => setDropdownOpen(null)}
                                          >
                                            Cancel
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                            </table>
                          </>)}
                        </div>

                        <div className="d-flex justify-content-end mt-4">
                          <button
                            className="btn btn-primary px-4 py-2"
                            onClick={() => setShowModal(true)}
                          >
                            Add Bank Account
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modal */}
                {showModal && (
                  <div
                    className="modal show d-block"
                    tabIndex="-1"
                    style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
                  >
                    <div className="modal-dialog modal-dialog-centered">
                      <div className="modal-content">
                        <div className="modal-header border-bottom">
                          <h5 className="modal-title text-center fw-bold">
                            Add Bank Account
                          </h5>
                        </div>

                        <div className="modal-body p-4">
                            <form onSubmit={handleSubmit}>
                            <label htmlFor="" className="form-label">
                              Bank Name
                            </label>
                            <input
                              type="text"
                              className="form-control  shadow-none"
                              id="bankName"
                              name="bankName"
                              value={formData.bankName}
                              onChange={handleInputChange}
                              required
                              placeholder="Meezan Bank "
                            />

                            <label htmlFor="" className="form-label">
                              Account Title
                            </label>
                            <input
                              type="text"
                              className="form-control  shadow-none"
                              id="accountTitle"
                              name="accountTitle"
                              value={formData.accountTitle}
                              onChange={handleInputChange}
                              required
                              placeholder="Saer.pk"
                            />

                            <label htmlFor="" className="form-label">
                              Account Number
                            </label>
                            <input
                              type="text"
                              className="form-control  shadow-none"
                              id="accountNumber"
                              name="accountNumber"
                              value={formData.accountNumber}
                              onChange={handleInputChange}
                              required
                              placeholder="3302237082738"
                            />

                            <label htmlFor="" className="form-label">

                              IBAN
                            </label>
                            <input
                              type="text"
                              className="form-control  shadow-none"
                              id="iban"
                              name="iban"
                              value={formData.iban}
                              onChange={handleInputChange}
                              required
                              placeholder=" Pk3202293203782936"
                            />
                            <div className="form-check mt-3">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="isCompanyAccount"
                                name="isCompanyAccount"
                                checked={!!formData.isCompanyAccount}
                                onChange={(e) => setFormData(prev => ({ ...prev, isCompanyAccount: e.target.checked }))}
                              />
                              <label className="form-check-label" htmlFor="isCompanyAccount">
                                Is Company Account
                              </label>
                            </div>

                            <div className="mt-3">
                              <label className="form-label">Status</label>
                              <select
                                className="form-select"
                                name="status"
                                value={formData.status}
                                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                              >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                              </select>
                            </div>

                            {formData.isCompanyAccount && (
                              <div className="mt-3">
                                <label className="form-label">Created By</label>
                                <select
                                  className="form-select"
                                  name="createdById"
                                  value={formData.createdById}
                                  onChange={handleInputChange}
                                >
                                  <option value="">Select creator</option>
                                  {users.map((u) => (
                                    <option key={u.id || u.pk || u.user_id} value={u.id || u.pk || u.user_id}>
                                      {u.full_name || u.name || u.username || u.email || (`ID ${u.id || u.pk || u.user_id}`)}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}

                            <div className="d-flex justify-content-end mt-3 gap-2">
                              <button
                                type="submit"
                                className="btn btn-primary px-4"
                                disabled={loadingSubmit}
                              >
                                {loadingSubmit ? 'Saving...' : 'Save'}
                              </button>
                              <button
                                type="button"
                                className="btn btn-light text-muted px-4"
                                onClick={handleCloseModal}
                              >
                                Cancel
                              </button>
                            </div>
                          </form>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BankAccountsScreen;
