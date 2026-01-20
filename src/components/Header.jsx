import { Bell, LogOut, Search, Settings, User, Building2, MapPin } from "lucide-react";
import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { jwtDecode } from "jwt-decode";

const routeTitles = [
  { path: "/profile", title: "Profile" },
  { path: "/dashboard", title: "Dashboard" },
  { path: "/packages", title: "Packages" },
  { path: "/packages/add-packages", title: "Packages" },
  { path: "/packages/visa-and-other", title: "Visa and Other" },
  { path: "/packages/edit/:id", title: "Packages" },
  { path: "/hotels", title: "Hotels" },
  { path: "/hotels/EditDetails/:id", title: "Hotels" },
  { path: "/hotels/EditPrices/:id", title: "Hotels" },
  { path: "/hotels/EditAv/:id", title: "Hotels" },
  { path: "/hotels/add-hotels", title: "Hotels" },
  { path: "/intimation", title: "Intimation" },
  { path: "/daily-operations", title: "Daily Operations" },
  { path: "/partners", title: "Partner's" },
  { path: "/partners/message/:id", title: "Partner's" },
  { path: "/partners/organization", title: "Partner's" },
  { path: "/partners/request", title: "Partner's" },
  { path: "/partners/role-permissions", title: "Partner's" },
  { path: "/partners/role-permissions/update-permissions", title: "Partner's" },
  { path: "/partners/discounts", title: "Partner's" },
  { path: "/partners/discounts/update-discountss", title: "Partner's" },
  { path: "/partners/branche", title: "Partner's" },
  { path: "/partners/agencies", title: "Partner's" },
  { path: "/partners/empolye", title: "Partner's" },
  { path: "/partners/portal", title: "Partner's" },
  { path: "/ticket-booking", title: "Booking" },
  { path: "/ticket-booking/detail", title: "Booking" },
  { path: "/ticket-booking/add-ticket", title: "Booking" },
  { path: "/payment", title: "Payment" },
  { path: "/payment/add-payment", title: "Payment" },
  { path: "/payment/booking-history", title: "Payment" },
  { path: "/payment/pending-payments", title: "Payment" },
  { path: "/payment/bank-accounts", title: "Payment" },
  { path: "/order-delivery", title: "Order Delivery System" },
  { path: "/order-delivery/:orderNo", title: "Order Delivery System" },
  { path: "/order-delivery/ticketing", title: "Order Delivery System" },
  { path: "/order-delivery/ticketing/:orderNo", title: "Order Delivery System" },
];

function getTitleFromPath(pathname) {
  for (let route of routeTitles) {
    const base = route.path.replace(/:\w+/g, "[^/]+");
    const regex = new RegExp("^" + base + "$");
    if (regex.test(pathname)) return route.title;
  }
  return "Dashboard";
}

const Header = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const location = useLocation();
  const currentTitle = getTitleFromPath(location.pathname);
  const dropdownRef = useRef(null);
  const { logout } = useAuth();

  // Organization and Branch state
  const [allOrganizations, setAllOrganizations] = useState([]);
  const [selectedOrganization, setSelectedOrganization] = useState(null);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  // Fetch user profile and organizations
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const decoded = jwtDecode(token);
        const userId = decoded.user_id || decoded.id;

        const response = await axios.get(
          `https://b2bapi.saer.pk/api/users/${userId}/`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const profileData = response.data;
        setUserProfile(profileData);

        const orgs = Array.isArray(profileData.organization_details)
          ? profileData.organization_details
          : [];
        setAllOrganizations(orgs);

        // Load saved organization or use first one
        const storedOrg = localStorage.getItem("selectedOrganization");
        if (storedOrg) {
          const parsed = JSON.parse(storedOrg);
          setSelectedOrganization(parsed);
        } else if (orgs.length > 0) {
          setSelectedOrganization(orgs[0]);
          localStorage.setItem("selectedOrganization", JSON.stringify(orgs[0]));
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
      }
    };

    fetchProfile();
  }, []);

  // Fetch branches when organization changes
  useEffect(() => {
    const fetchBranches = async () => {
      if (!selectedOrganization) {
        setBranches([]);
        setSelectedBranch(null);
        return;
      }

      try {
        const token = localStorage.getItem("accessToken");
        const response = await axios.get(`https://b2bapi.saer.pk/api/branches/`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const branchData = response.data.filter(
          (b) => b.organization === selectedOrganization.id
        );
        setBranches(branchData);

        // Load saved branch or use first one
        const storedBranch = localStorage.getItem("selectedBranch");
        if (storedBranch) {
          const parsedBranch = JSON.parse(storedBranch);
          const match = branchData.find((b) => b.id === parsedBranch.id);
          if (match) {
            setSelectedBranch(match);
          } else {
            const firstBranch = branchData.length > 0 ? branchData[0] : null;
            setSelectedBranch(firstBranch);
            if (firstBranch) {
              localStorage.setItem("selectedBranch", JSON.stringify(firstBranch));
              localStorage.setItem("selectedBranchId", firstBranch.id);
            }
          }
        } else {
          const firstBranch = branchData.length > 0 ? branchData[0] : null;
          setSelectedBranch(firstBranch);
          if (firstBranch) {
            localStorage.setItem("selectedBranch", JSON.stringify(firstBranch));
            localStorage.setItem("selectedBranchId", firstBranch.id);
          }
        }
      } catch (err) {
        console.error("Failed to fetch branches:", err);
        setBranches([]);
        setSelectedBranch(null);
      }
    };

    fetchBranches();
  }, [selectedOrganization]);

  // Handle organization change
  const handleOrganizationChange = (e) => {
    const selectedId = Number(e.target.value);
    const selectedOrg = allOrganizations.find((o) => o.id === selectedId);
    if (selectedOrg) {
      setSelectedOrganization(selectedOrg);
      localStorage.setItem("selectedOrganization", JSON.stringify(selectedOrg));
      setSelectedBranch(null);
      localStorage.removeItem("selectedBranch");
      localStorage.removeItem("selectedBranchId");
      window.dispatchEvent(new Event("organizationChanged"));
    }
  };

  // Handle branch change
  const handleBranchChange = (e) => {
    const branchId = Number(e.target.value);
    const branch = branches.find((b) => b.id === branchId);
    setSelectedBranch(branch);
    if (branch) {
      localStorage.setItem("selectedBranch", JSON.stringify(branch));
      localStorage.setItem("selectedBranchId", branch.id);
      window.dispatchEvent(new Event("branchChanged"));
    }
  };

  // Check if user is employee or subagent (they can't change org/branch)
  const isEmployee = userProfile?.profile?.type === "employee";
  const isSubagent = userProfile?.profile?.type === "subagent";
  const canChangeOrgBranch = !isEmployee && !isSubagent;

  // Handle outside click for user dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDropdown]);

  return (
    <header className="">
      <div className="container-fluid px-3 py-3">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
          <div className="d-flex justify-content-between align-items-center">
            <h1 className="fw-bold fs-4 px-0 me-md-3 border-0 mb-0">
              {currentTitle}
            </h1>
          </div>

          <div className="d-flex flex-column flex-md-row align-items-center gap-2 w-100 justify-content-md-end">
            {/* Organization Dropdown */}
            {allOrganizations.length > 0 && (
              <div className="d-flex align-items-center gap-2" style={{ minWidth: "180px" }}>
                <Building2 size={18} className="text-muted" />
                <select
                  className="form-select form-select-sm"
                  value={selectedOrganization ? selectedOrganization.id : ""}
                  onChange={handleOrganizationChange}
                  disabled={!canChangeOrgBranch}
                  style={{ fontSize: "14px" }}
                >
                  {allOrganizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Branch Dropdown */}
            {branches.length > 0 && (
              <div className="d-flex align-items-center gap-2" style={{ minWidth: "180px" }}>
                <MapPin size={18} className="text-muted" />
                <select
                  className="form-select form-select-sm"
                  value={selectedBranch ? selectedBranch.id : ""}
                  onChange={handleBranchChange}
                  disabled={!canChangeOrgBranch}
                  style={{ fontSize: "14px" }}
                >
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name} {branch.branch_code ? `(${branch.branch_code})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Search Bar */}
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

            {/* Notification and User Dropdown */}
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
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
