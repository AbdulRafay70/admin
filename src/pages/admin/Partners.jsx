import React, { useState, useEffect, useMemo } from "react";
import { Dropdown, Table, Button, Form, Modal, Spinner } from "react-bootstrap";
import { Gear } from "react-bootstrap-icons";
import { Funnel, Search } from "lucide-react";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import PartnersTabs from "../../components/PartnersTabs";
import { NavLink } from "react-router-dom";
import axios from "axios";
import Select from "react-select";
import { jwtDecode } from "jwt-decode";
import AdminFooter from "../../components/AdminFooter";
import { usePermission } from "../../contexts/EnhancedPermissionContext";

const ShimmerLoader = () => {
  return (
    <div className="py-3">
      {[...Array(5)].map((_, index) => (
        <div
          key={index}
          className="shimmer-line mb-2"
          style={{
            height: "20px",
            width: "100%",
            borderRadius: "4px",
            background:
              "linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)",
            backgroundSize: "200% 100%",
            animation: "shimmer 1.5s infinite",
          }}
        ></div>
      ))}
    </div>
  );
};

const Partners = ({ embed = false }) => {
  // Get permission checking functions
  const { hasPermission, hasAnyPermission, isLoading: permissionsLoading } = usePermission();
  const PARTNERS_CACHE_KEY = "partners_cache";
  const AGENCIES_CACHE_KEY = "agencies_cache";
  const GROUPS_CACHE_KEY = "groups_cache";
  const BRANCHES_CACHE_KEY = "branches_cache";
  const ORGANIZATIONS_CACHE_KEY = "organizations_cache";
  const CACHE_EXPIRY_TIME = 30 * 60 * 1000;

  // State declarations
  const [filter, setFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [partners, setPartners] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [agencies, setAgencies] = useState([]);
  const [groups, setGroups] = useState([]);
  const [branches, setBranches] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [isAgentType, setIsAgentType] = useState(false);
  const [isAdminType, setIsAdminType] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [organizations, setOrganizations] = useState([]);
  const [formErrors, setFormErrors] = useState({});
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [selectedBranchForAgency, setSelectedBranchForAgency] = useState(null);
  const [hrEmployees, setHrEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  const [partnerForm, setPartnerForm] = useState({
    first_name: "",
    email: "",
    username: "",
    password: "",
    is_active: true,
    groups: [],
    branches: [],
    organizations: [],
    profile: {
      type: "",
    },
  });

  const accessToken = localStorage.getItem("accessToken");
  const axiosConfig = {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  };

  const statusOptions = ["All", "Active", "Inactive"];
  const PAGE_SIZE = 8;

  // Get selected organization from localStorage
  const getSelectedOrganization = () => {
    const org = localStorage.getItem("selectedOrganization");
    return org ? JSON.parse(org) : null;
  };

  // Fetch partners data
  const fetchPartners = async () => {
    setIsLoading(true);

    try {
      // TEMPORARY: Disable cache to always fetch fresh data
      // const cachedData = localStorage.getItem(PARTNERS_CACHE_KEY);
      // const cacheTimestamp = localStorage.getItem(
      //   `${PARTNERS_CACHE_KEY}_timestamp`
      // );

      // if (
      //   cachedData &&
      //   cacheTimestamp &&
      //   Date.now() - parseInt(cacheTimestamp) < CACHE_EXPIRY_TIME
      // ) {
      //   setPartners(JSON.parse(cachedData));
      //   setTotalPages(
      //     Math.ceil(JSON.parse(cachedData).length / PAGE_SIZE) || 1
      //   );
      // } else {
      // Fetch all users without organization filter (since we disabled org filtering)
      const usersUrl = `http://127.0.0.1:8000/api/users/`;
      console.log('Fetching users from:', usersUrl);
      const response = await axios.get(usersUrl, axiosConfig);
      const data = response.data || [];
      console.log('Received users:', data.length, data);
      setPartners(data);
      setTotalPages(Math.ceil(data.length / PAGE_SIZE) || 1);

      // Clear old cache
      localStorage.removeItem(PARTNERS_CACHE_KEY);
      localStorage.removeItem(`${PARTNERS_CACHE_KEY}_timestamp`);
      // }
    } catch (error) {
      console.error("Error fetching partners:", error);
      setPartners([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch agencies data
  const fetchAgencies = async () => {
    try {
      // TEMPORARY: Disable cache to always fetch fresh agencies
      // const cachedData = localStorage.getItem(AGENCIES_CACHE_KEY);
      // const cacheTimestamp = localStorage.getItem(
      //   `${AGENCIES_CACHE_KEY}_timestamp`
      // );

      // if (
      //   cachedData &&
      //   cacheTimestamp &&
      //   Date.now() - parseInt(cacheTimestamp) < CACHE_EXPIRY_TIME
      // ) {
      //   setAgencies(JSON.parse(cachedData));
      // } else {
      const orgId = getCurrentOrgId();
      const agenciesUrl = orgId
        ? `http://127.0.0.1:8000/api/agencies/?organization=${orgId}`
        : `http://127.0.0.1:8000/api/agencies/`;
      const response = await axios.get(agenciesUrl, axiosConfig);
      const data = response.data || [];
      setAgencies(data);

      // Clear old cache
      localStorage.removeItem(AGENCIES_CACHE_KEY);
      localStorage.removeItem(`${AGENCIES_CACHE_KEY}_timestamp`);
      // }
    } catch (error) {
      console.error("Error fetching agencies:", error);
      setAgencies([]);
    }
  };

  // Fetch groups data
  const fetchGroups = async () => {
    try {
      // TEMPORARY: Disable cache to always fetch fresh groups
      // const cachedData = localStorage.getItem(GROUPS_CACHE_KEY);
      // const cacheTimestamp = localStorage.getItem(
      //   `${GROUPS_CACHE_KEY}_timestamp`
      // );

      // if (
      //   cachedData &&
      //   cacheTimestamp &&
      //   Date.now() - parseInt(cacheTimestamp) < CACHE_EXPIRY_TIME
      // ) {
      //   setGroups(JSON.parse(cachedData));
      // } else {
      // Always fetch all groups (global + org-scoped) and let client-side
      // filtering determine which groups to show for the current org.
      console.debug("fetchGroups: calling /api/groups/");
      const response = await axios.get(
        `http://127.0.0.1:8000/api/groups/`,
        axiosConfig
      );
      // Support both direct array responses and paginated { results: [] } responses
      let data = response.data || [];
      if (data && typeof data === "object" && Array.isArray(data.results)) {
        data = data.results;
      }
      console.debug("fetchGroups: received", data);
      setGroups(data);

      // Clear old cache
      localStorage.removeItem(GROUPS_CACHE_KEY);
      localStorage.removeItem(`${GROUPS_CACHE_KEY}_timestamp`);
      // }
    } catch (error) {
      console.error("Error fetching groups:", error);
      setGroups([]);
    }
  };

  // Fetch branches for selected organization (used in partner modal)
  const fetchBranches = async () => {
    try {
      // TEMPORARY: Disable cache to always fetch fresh branches
      // const cachedData = localStorage.getItem(BRANCHES_CACHE_KEY);
      // const cacheTimestamp = localStorage.getItem(`${BRANCHES_CACHE_KEY}_timestamp`);

      // if (cachedData && cacheTimestamp && Date.now() - parseInt(cacheTimestamp) < CACHE_EXPIRY_TIME) {
      //   setBranches(JSON.parse(cachedData));
      // } else {
      const orgId = getCurrentOrgId();
      const branchesUrl = orgId
        ? `http://127.0.0.1:8000/api/branches/?organization=${orgId}`
        : `http://127.0.0.1:8000/api/branches/`;
      const response = await axios.get(branchesUrl, axiosConfig);
      const data = response.data || [];
      setBranches(data);

      // Clear old cache
      localStorage.removeItem(BRANCHES_CACHE_KEY);
      localStorage.removeItem(`${BRANCHES_CACHE_KEY}_timestamp`);
      // }
    } catch (error) {
      console.error("Error fetching branches:", error);
      setBranches([]);
    }
  };

  // Fetch all organizations
  const fetchOrganizations = async () => {
    try {
      const cachedData = localStorage.getItem(ORGANIZATIONS_CACHE_KEY);
      const cacheTimestamp = localStorage.getItem(`${ORGANIZATIONS_CACHE_KEY}_timestamp`);

      if (cachedData && cacheTimestamp && Date.now() - parseInt(cacheTimestamp) < CACHE_EXPIRY_TIME) {
        setOrganizations(JSON.parse(cachedData));
      } else {
        const response = await axios.get(`http://127.0.0.1:8000/api/organizations/`, axiosConfig);
        const data = response.data || [];
        setOrganizations(data);

        localStorage.setItem(ORGANIZATIONS_CACHE_KEY, JSON.stringify(data));
        localStorage.setItem(`${ORGANIZATIONS_CACHE_KEY}_timestamp`, Date.now().toString());
      }
    } catch (error) {
      console.error("Error fetching organizations:", error);
      setOrganizations([]);
    }
  };

  // Fetch HR Employees
  const fetchHREmployees = async () => {
    setLoadingEmployees(true);
    try {
      const response = await axios.get(`http://127.0.0.1:8000/api/hr/employees/`, axiosConfig);
      const data = response.data || [];
      setHrEmployees(data);
    } catch (error) {
      console.error("Error fetching HR employees:", error);
      setHrEmployees([]);
    } finally {
      setLoadingEmployees(false);
    }
  };

  // Get agency details for a partner
  const getPartnerAgency = (partner) => {
    if (!partner.profile || partner.profile.type !== "agent") return null;

    if (partner.agency_details && partner.agency_details.length > 0) {
      return partner.agency_details[0];
    }

    if (partner.agencies && partner.agencies.length > 0) {
      const agencyId = partner.agencies[0];
      return agencies.find((agency) => agency.id === agencyId) || null;
    }

    return null;
  };

  // Filter partners based on filters and selected organization
  const filteredPartners = useMemo(() => {
    const typeMap = {
      employees: "employee",
      agents: "agent",
      branches: "subagent",
    };

    const orgId = getCurrentOrgId();

    console.log('Filtering partners:', {
      totalPartners: partners.length,
      orgId: orgId,
      statusFilter: statusFilter,
      searchTerm: searchTerm,
      filter: filter
    });

    return partners.filter((partner) => {
      // TEMPORARY: Disable organization filtering to debug
      const matchesOrganization = true;

      const matchesStatus =
        statusFilter === "All" ||
        (statusFilter === "Active" && partner.is_active) ||
        (statusFilter === "Inactive" && !partner.is_active) ||
        (statusFilter === "Without Agreement" &&
          !(partner.profile?.agreement_status ?? true));

      const agency = getPartnerAgency(partner);
      const phoneNumber =
        agency?.phone_number || partner.profile?.phone_number || "";
      const address = agency?.address || partner.profile?.address || "";

      const matchesSearch =
        searchTerm === "" ||
        (partner.first_name?.toLowerCase() || "").includes(
          searchTerm.toLowerCase()
        ) ||
        (partner.email?.toLowerCase() || "").includes(
          searchTerm.toLowerCase()
        ) ||
        phoneNumber.includes(searchTerm) ||
        address.toLowerCase().includes(searchTerm.toLowerCase());

      let matchesType = true;
      if (filter !== "all") {
        if (filter === "agents") {
          matchesType = partner.profile?.type === "agent" || partner.profile?.type === "area-agent";
        } else if (filter === "employees") {
          matchesType = partner.profile?.type === "employee";
        } else if (filter === "branches") {
          matchesType = partner.profile?.type === "subagent";
        } else {
          matchesType = true;
        }
      }

      // Filter by selected group if provided
      const partnerGroupIds = Array.isArray(partner.groups)
        ? partner.groups.map((g) => (typeof g === "object" ? g.id : g))
        : [];

      const matchesGroup =
        !selectedGroupId || partnerGroupIds.includes(selectedGroupId);

      return (
        matchesOrganization && matchesStatus && matchesSearch && matchesType && matchesGroup
      );
    });
  }, [partners, statusFilter, searchTerm, filter, agencies, selectedGroupId, groups, currentUser]);


  // Paginate partners
  const paginatedPartners = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return filteredPartners.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredPartners, currentPage]);

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Show create partner modal
  const handleShowCreate = () => {
    setEditingId(null);
    const currentOrgId = getCurrentOrgId();
    setPartnerForm({
      first_name: "",
      last_name: "",
      email: "",
      username: "",
      password: "",
      is_active: true,
      groups: [],
      agencies: [],
      branches: [],
      organizations: currentOrgId ? [currentOrgId] : [],
      profile: {
        type: "",
      },
    });
    setSelectedBranchForAgency(null);
    setSelectedEmployee(null);
    setShowModal(true);
  };

  // Show edit partner modal
  const handleShowEdit = (partner) => {
    console.log('Editing partner:', partner);
    setEditingId(partner.id);

    // Extract IDs from detail objects
    const groupIds = partner.group_details?.map(g => g.id) || partner.groups || [];
    const branchIds = partner.branch_details?.map(b => b.id) || partner.branches || [];
    const agencyIds = partner.agency_details?.map(a => a.id) || partner.agencies || [];
    const organizationIds = partner.organization_details?.map(o => o.id) || partner.organizations || [];

    // Determine user type from profile or Django flags
    let userType = partner.profile?.type || "";
    if (!userType) {
      // Fallback to Django user flags
      if (partner.is_superuser) {
        userType = "superadmin";
      } else if (partner.is_staff) {
        userType = "admin";
      }
    }

    const formData = {
      first_name: partner.first_name || "",
      last_name: partner.last_name || "",
      email: partner.email || "",
      username: partner.username || "",
      password: "",
      is_active: partner.is_active,
      groups: groupIds,
      branches: branchIds,
      agencies: agencyIds,
      organizations: organizationIds,
      profile: {
        type: userType,
      },
    };

    console.log('Setting form data:', formData);
    setPartnerForm(formData);

    // Set agent type if editing an agent or area-agent
    const isAgent = userType === "agent" || userType === "area-agent";
    const isAdmin = userType === "admin" || userType === "superadmin";

    setIsAgentType(isAgent);
    setIsAdminType(isAdmin);

    // Set selected branch for agency filtering if user is an agent
    if (isAgent) {
      setSelectedBranchForAgency(branchIds.length > 0 ? branchIds[0] : null);
    } else {
      setSelectedBranchForAgency(null);
    }

    setShowModal(true);
  };

  // Close modal
  const handleClose = () => {
    setShowModal(false);
    setLogoFile(null);
    setLogoPreview("");
    setFormErrors({});
    setShowErrorAlert(false);
    setSelectedBranchForAgency(null);
  };

  // Add this function to your Partners component
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === "profile.type") {
      const isAgent = value === "agent" || value === "area-agent";
      const isAdmin = value === "admin" || value === "superadmin";
      setIsAgentType(isAgent);
      setIsAdminType(isAdmin);
    }

    if (name.startsWith("profile.")) {
      const profileField = name.split(".")[1];
      setPartnerForm((prev) => ({
        ...prev,
        profile: {
          ...prev.profile,
          [profileField]: type === "checkbox" ? checked : value,
        },
      }));
    } else {
      setPartnerForm((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };
  // Handle form submission
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setFormErrors({});
    setShowErrorAlert(false);

    try {
      const selectedBranch = localStorage.getItem("selectedBranchId");
      const Branch = selectedBranch ? [selectedBranch] : [];

      // If organizations not selected, use current organization
      const orgsToUse = (partnerForm.organizations && partnerForm.organizations.length > 0)
        ? partnerForm.organizations
        : (getCurrentOrgId() ? [getCurrentOrgId()] : []);

      const userPayload = {
        username: partnerForm.username,
        email: partnerForm.email,
        password: partnerForm.password,
        first_name: partnerForm.first_name,
        last_name: partnerForm.last_name,
        profile: { type: partnerForm.profile.type },
        organizations: orgsToUse,
        branches: (partnerForm.branches && partnerForm.branches.length > 0) ? partnerForm.branches : Branch,
        agencies: partnerForm.agencies || [],
        groups: partnerForm.groups,
        is_active: partnerForm.is_active,
      };

      if (partnerForm.password && !editingId) {
        userPayload.password = partnerForm.password;
      }

      // Make the API call
      let response;
      if (editingId) {
        response = await axios.put(
          `http://127.0.0.1:8000/api/users/${editingId}/`,
          userPayload,
          axiosConfig
        );
      } else {
        response = await axios.post(
          `http://127.0.0.1:8000/api/users/`,
          userPayload,
          axiosConfig
        );
      }

      // Clear cache and refresh
      localStorage.removeItem(PARTNERS_CACHE_KEY);
      localStorage.removeItem(`${PARTNERS_CACHE_KEY}_timestamp`);
      setRefreshTrigger((prev) => prev + 1);
      handleClose();
    } catch (error) {
      console.error("Error saving partner:", error);

      // Parse error response for user-friendly messages
      if (error.response?.data) {
        const errorData = error.response.data;

        // Handle {success: false, errors: {...}} format
        if (errorData.errors && typeof errorData.errors === 'object') {
          setFormErrors(errorData.errors);
          setShowErrorAlert(true);
        }
        // Handle direct field errors format
        else if (typeof errorData === 'object' && !errorData.detail) {
          // Check if it's a group error and provide helpful message
          if (errorData.groups) {
            const groupError = Array.isArray(errorData.groups) ? errorData.groups.join(', ') : errorData.groups;
            setFormErrors({ groups: [`${groupError}. Please refresh the page and try again.`] });
          } else {
            setFormErrors(errorData);
          }
          setShowErrorAlert(true);
        }
        // Handle detail message format
        else if (errorData.detail) {
          setFormErrors({ general: [errorData.detail] });
          setShowErrorAlert(true);
        }
        else {
          alert(`Error: ${error.message}`);
        }
      } else {
        alert(`Error: ${error.message}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  // Handle partner deletion
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this partner?")) {
      setIsLoading(true);
      try {
        await axios.delete(`http://127.0.0.1:8000/api/users/${id}/`, axiosConfig);

        // Clear the partners cache since we've made changes
        localStorage.removeItem(PARTNERS_CACHE_KEY);
        localStorage.removeItem(`${PARTNERS_CACHE_KEY}_timestamp`);

        setRefreshTrigger((prev) => prev + 1);
      } catch (error) {
        console.error("Error deleting partner:", error);
        alert(`Error: ${error.response?.data?.detail || error.message}`);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Handle status change
  const handleStatusChange = async (id, newStatus) => {
    setIsLoading(true);
    try {
      await axios.patch(
        `http://127.0.0.1:8000/api/users/${id}/`,
        { is_active: newStatus === "Active" },
        axiosConfig
      );

      // Clear the partners cache since we've made changes
      localStorage.removeItem(PARTNERS_CACHE_KEY);
      localStorage.removeItem(`${PARTNERS_CACHE_KEY}_timestamp`);

      setRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      console.error("Error updating status:", error);
      alert(`Error: ${error.response?.data?.detail || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to resolve the current organization id (logged-in user's org preferred)
  function getCurrentOrgId() {
    if (currentUser) {
      if (Array.isArray(currentUser.organizations) && currentUser.organizations.length > 0) {
        return currentUser.organizations[0];
      }
      if (currentUser.organization) return currentUser.organization;
    }
    const sel = getSelectedOrganization();
    return sel && sel.id ? sel.id : null;
  }

  // Helper to get user type display text
  const getUserType = (partner) => {
    // Check profile type first
    if (partner.profile?.type) {
      const type = partner.profile.type;
      // Special case: display "Branch" instead of "Subagent"
      if (type === 'subagent') {
        return 'Branch';
      }
      return type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ');
    }

    // Fallback to Django user flags
    if (partner.is_superuser) {
      return 'Superadmin';
    }
    if (partner.is_staff) {
      return 'Admin';
    }

    return 'User';
  };

  // Fetch current user data
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const decoded = jwtDecode(token);
        const userId = decoded.user_id || decoded.id;

        const response = await axios.get(
          `http://127.0.0.1:8000/api/users/${userId}/`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setCurrentUser(response.data);
      } catch (error) {
        console.error("Error fetching current user:", error);
      }
    };

    fetchCurrentUser();
  }, []);
  useEffect(() => {
    fetchPartners();
    fetchAgencies();
    fetchGroups();
    fetchBranches();
    fetchOrganizations();
  }, [refreshTrigger, currentUser]);

  // Get groups for selected organization
  const getGroupsForOrganization = () => {
    const orgId = getCurrentOrgId();
    if (!orgId) return groups;
    return groups.filter((group) => {
      // include global/unscoped groups (extended==null) or groups scoped to current organization
      if (!group.extended) return true;
      return group.extended.organization === orgId;
    });
  };

  // Add this function to your Partners component
  // const handleChange = (e) => {
  //   const { name, value, type, checked } = e.target;

  //   if (name === "profile.type") {
  //     const isAgent = value === "agent";
  //     setIsAgentType(isAgent);
  //   }

  //   if (name.startsWith("profile.")) {
  //     const profileField = name.split(".")[1];
  //     setPartnerForm((prev) => ({
  //       ...prev,
  //       profile: {
  //         ...prev.profile,
  //         [profileField]: type === "checkbox" ? checked : value,
  //       },
  //     }));
  //   } else {
  //     setPartnerForm((prev) => ({
  //       ...prev,
  //       [name]: type === "checkbox" ? checked : value,
  //     }));
  //   }
  // };

  const options = [
    { value: "agent", label: "Agent" },
    { value: "area-agent", label: "Area Agent" },
    { value: "employee", label: "Employee" },
    { value: "subagent", label: "Branch" },
    { value: "admin", label: "Admin" },
    { value: "superadmin", label: "Super Admin" },
  ];

  // Navigation is rendered by shared PartnersTabs

  return (
    <>
      <style>
        {`
            @keyframes shimmer {
              0% { background-position: -200% 0; }
              100% { background-position: 200% 0; }
            }
            
            .shimmer-line {
              background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
              background-size: 200% 100%;
              animation: shimmer 1.5s infinite;
              border-radius: 4px;
            }
          `}
      </style>
      <div className="min-vh-100" style={{ fontFamily: "Poppins, sans-serif" }}>
        <div className="row g-0">
          {/* Sidebar */}
          {!embed && (
            <div className="col-12 col-lg-2">
              <Sidebar />
            </div>
          )}
          {/* Main Content */}
          <div className={`col-12 ${!embed ? 'col-lg-10' : ''}`}>
            <div className={embed ? '' : 'container'}>
              {!embed && <Header />}
              <div className="px-3 px-lg-4 my-3">
                {/* Navigation Tabs */}
                {!embed && <PartnersTabs />}

                <div className="p-3 my-3 rounded-4 shadow-sm">
                  <div className="d-flex flex-wrap gap-2 justify-content-between">
                    <div>
                      <h5 className="fw-semibold mb-0">All User's</h5>
                    </div>
                    <div className="d-flex flex-wrap gap-2">
                      {/* Only show Add User button if user has view_add_users_admin permission */}
                      {hasPermission('view_add_users_admin') && (
                        <button
                          className="btn btn-primary"
                          onClick={handleShowCreate}
                          disabled={isLoading || isSubmitting}
                        >
                          {isLoading ? (
                            <Spinner size="sm" animation="border" />
                          ) : (
                            "Add User's"
                          )}
                        </button>
                      )}
                      <button
                        className="btn btn-primary"
                        disabled={isLoading || isSubmitting}
                      >
                        {isLoading ? (
                          <Spinner size="sm" animation="border" />
                        ) : (
                          "Print"
                        )}
                      </button>
                      <button
                        className="btn btn-primary"
                        disabled={isLoading || isSubmitting}
                      >
                        {isLoading ? (
                          <Spinner size="sm" animation="border" />
                        ) : (
                          "Download"
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                    <div className="d-flex gap-3 mt-3 flex-wrap">
                      <button
                        className={`btn ${filter === "all" ? "btn-primary" : "btn-outline-secondary"
                          }`}
                        onClick={() => setFilter("all")}
                      >
                        All
                      </button>
                      <button
                        className={`btn ${filter === "employee"
                          ? "btn-primary"
                          : "btn-outline-secondary"
                          }`}
                        onClick={() => setFilter("employees")}
                      >
                        Employees
                      </button>
                      <button
                        className={`btn ${filter === "agents"
                          ? "btn-primary"
                          : "btn-outline-secondary"
                          }`}
                        onClick={() => setFilter("agents")}
                      >
                        Agents
                      </button>
                      {/* Group select filter */}
                      <div style={{ minWidth: 220 }}>
                        <Select
                          isClearable
                          placeholder="Filter by group"
                          options={getGroupsForOrganization().map((group) => ({
                            value: group.id,
                            label: group.name,
                          }))}
                          value={
                            selectedGroupId
                              ? { value: selectedGroupId, label: groups.find(g => g.id === selectedGroupId)?.name }
                              : null
                          }
                          onChange={(opt) => setSelectedGroupId(opt ? opt.value : null)}
                          className="basic-single"
                          classNamePrefix="select"
                        />
                      </div>
                    </div>
                    <Dropdown>
                      <Dropdown.Toggle
                        variant=""
                        disabled={isLoading || isSubmitting}
                      >
                        <Funnel size={16} className="me-1" />
                        Filters
                      </Dropdown.Toggle>
                      <Dropdown.Menu>
                        {statusOptions.map((status, idx) => (
                          <Dropdown.Item
                            key={idx}
                            onClick={() => setStatusFilter(status)}
                            active={statusFilter === status}
                          >
                            {status}
                          </Dropdown.Item>
                        ))}
                      </Dropdown.Menu>
                    </Dropdown>
                  </div>

                  {isLoading ? (
                    <div className="p-3">
                      <ShimmerLoader />
                    </div>
                  ) : (
                    <>
                      {filteredPartners.length === 0 ? (
                        <div className="text-center py-5">
                          <p>No partners found</p>
                          <Button
                            variant="primary"
                            onClick={() => setRefreshTrigger((prev) => prev + 1)}
                          >
                            Refresh
                          </Button>
                        </div>
                      ) : (
                        <>
                          <Table
                            hover
                            responsive
                            className="align-middle text-center"
                          >
                            <thead>
                              <tr>
                                <th>ID</th>
                                <th>Username</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>User Type</th>
                                <th>Status</th>
                                <th>Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {paginatedPartners.map((partner) => {
                                const agency = getPartnerAgency(partner);
                                const phoneNumber =
                                  agency?.phone_number ||
                                  partner.profile?.phone_number ||
                                  "N/A";
                                const address =
                                  agency?.address ||
                                  partner.profile?.address ||
                                  "N/A";

                                return (
                                  <tr key={partner.id}>
                                    <td>{partner.id}</td>
                                    <td>{partner.username || "N/A"}</td>
                                    <td>{(partner.first_name && partner.last_name) ? `${partner.first_name} ${partner.last_name}` : (partner.first_name || partner.last_name || "N/A")}</td>
                                    <td>{partner.email || "N/A"}</td>
                                    <td>
                                      <span className="badge bg-primary">
                                        {getUserType(partner)}
                                      </span>
                                    </td>
                                    <td
                                      className="fw-bold"
                                      style={{
                                        color: partner.is_active
                                          ? "#0EE924"
                                          : "#FF0000",
                                      }}
                                    >
                                      {partner.is_active ? "Active" : "Inactive"}
                                    </td>
                                    <td>
                                      <Dropdown>
                                        <Dropdown.Toggle
                                          variant="link"
                                          className="text-decoration-none p-0"
                                          disabled={isSubmitting}
                                        >
                                          <Gear size={18} />
                                        </Dropdown.Toggle>
                                        <Dropdown.Menu>
                                          <Dropdown.Item
                                            className="text-primary"
                                            onClick={() => handleShowEdit(partner)}
                                            disabled={isSubmitting}
                                          >
                                            Edit
                                          </Dropdown.Item>
                                          <Dropdown.Item
                                            className="text-success"
                                            onClick={() =>
                                              handleStatusChange(
                                                partner.id,
                                                "Active"
                                              )
                                            }
                                            disabled={
                                              partner.is_active || isSubmitting
                                            }
                                          >
                                            Activate
                                          </Dropdown.Item>
                                          <Dropdown.Item
                                            className="text-danger"
                                            onClick={() =>
                                              handleStatusChange(
                                                partner.id,
                                                "Inactive"
                                              )
                                            }
                                            disabled={
                                              !partner.is_active || isSubmitting
                                            }
                                          >
                                            Block
                                          </Dropdown.Item>
                                          <Dropdown.Item
                                            onClick={() => handleDelete(partner.id)}
                                            className="text-danger"
                                            disabled={isSubmitting}
                                          >
                                            Delete
                                          </Dropdown.Item>
                                        </Dropdown.Menu>
                                      </Dropdown>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </Table>

                          <div className="d-flex flex-wrap justify-content-between align-items-center mt-3 mb-3">
                            <div className="d-flex flex-wrap align-items-center">
                              <span className="me-2">
                                Showing {paginatedPartners.length} of{" "}
                                {filteredPartners.length} partners
                              </span>
                            </div>
                            <nav>
                              <ul className="pagination pagination-sm mb-0">
                                <li
                                  className={`page-item ${currentPage === 1 ? "disabled" : ""
                                    }`}
                                >
                                  <button
                                    className="page-link"
                                    onClick={() =>
                                      handlePageChange(currentPage - 1)
                                    }
                                    disabled={currentPage === 1}
                                  >
                                    Previous
                                  </button>
                                </li>
                                {Array.from(
                                  { length: totalPages },
                                  (_, i) => i + 1
                                ).map((page) => (
                                  <li
                                    key={page}
                                    className={`page-item ${currentPage === page ? "active" : ""
                                      }`}
                                  >
                                    <button
                                      className="page-link"
                                      onClick={() => handlePageChange(page)}
                                    >
                                      {page}
                                    </button>
                                  </li>
                                ))}
                                <li
                                  className={`page-item ${currentPage === totalPages ? "disabled" : ""
                                    }`}
                                >
                                  <button
                                    className="page-link"
                                    onClick={() =>
                                      handlePageChange(currentPage + 1)
                                    }
                                    disabled={currentPage === totalPages}
                                  >
                                    Next
                                  </button>
                                </li>
                              </ul>
                            </nav>
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
                <div>
                  <AdminFooter />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Add/Edit Partner Modal */}
        <Modal
          show={showModal}
          onHide={handleClose}
          centered
          size=""
          style={{ fontFamily: "Poppins, sans-serif" }}
        >
          <Modal.Body>
            <h4 className="text-center fw-bold p-4 mb-4">
              {editingId ? "Edit User" : "New User"}
            </h4>
            <hr />
            <Form className="p-4">
              {/* Error Alert */}
              {showErrorAlert && Object.keys(formErrors).length > 0 && (
                <div className="alert alert-danger alert-dismissible fade show mb-3" role="alert">
                  <strong>Error:</strong>
                  <ul className="mb-0 mt-2">
                    {Object.entries(formErrors).map(([field, messages]) => (
                      <li key={field}>
                        {field === 'general' ? '' : `${field}: `}
                        {Array.isArray(messages) ? messages.join(', ') : messages}
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowErrorAlert(false)}
                    aria-label="Close"
                  ></button>
                </div>
              )}
              {/* Type Dropdown */}
              <div className="mb-3">
                <label htmlFor="" className="Control-label">Type</label>
                <Select
                  options={options}
                  value={options.find(
                    (opt) => opt.value === partnerForm.profile.type
                  )}
                  onChange={(selected) => {
                    const selectedType = selected ? selected.value : "";
                    handleChange({
                      target: { name: "profile.type", value: selectedType },
                    });
                    // Fetch HR employees when type is employee
                    if (selectedType === "employee" && hrEmployees.length === 0) {
                      fetchHREmployees();
                    }
                    // Reset selected employee when type changes
                    setSelectedEmployee(null);
                  }}
                />
              </div>

              {/* Employee Selector - Only show for employee type */}
              {partnerForm.profile.type === "employee" && (
                <div className="mb-3">
                  <label htmlFor="" className="Control-label">Select Employee from HR Database</label>
                  <Select
                    options={hrEmployees.map(emp => ({
                      value: emp.id,
                      label: `${emp.id} - ${emp.first_name} ${emp.last_name}`,
                      employee: emp
                    }))}
                    value={selectedEmployee ? {
                      value: selectedEmployee.id,
                      label: `${selectedEmployee.id} - ${selectedEmployee.first_name} ${selectedEmployee.last_name}`
                    } : null}
                    onChange={(selected) => {
                      if (selected) {
                        const employee = selected.employee;
                        setSelectedEmployee(employee);
                        // Auto-populate fields from selected employee
                        setPartnerForm(prev => ({
                          ...prev,
                          first_name: employee.first_name || "",
                          last_name: employee.last_name || "",
                          email: employee.email || "",
                        }));
                      } else {
                        setSelectedEmployee(null);
                        setPartnerForm(prev => ({
                          ...prev,
                          first_name: "",
                          last_name: "",
                          email: "",
                        }));
                      }
                    }}
                    isLoading={loadingEmployees}
                    placeholder="Select an employee..."
                    isClearable
                  />
                  {selectedEmployee && (
                    <small className="text-muted">
                      Employee selected. Personal information fields are auto-populated and locked.
                    </small>
                  )}
                </div>
              )}

              {/* Basic Info Fields */}
              <div className="mb-3">
                <label htmlFor="" className="Control-label">Name</label>
                <input
                  type="text"
                  name="first_name"
                  className="form-control rounded shadow-none border px-1 py-2"
                  required
                  placeholder="Full Name"
                  value={partnerForm.first_name}
                  onChange={handleChange}
                  disabled={partnerForm.profile.type === "employee" && selectedEmployee}
                  style={partnerForm.profile.type === "employee" && selectedEmployee ? { backgroundColor: '#f0f0f0', cursor: 'not-allowed' } : {}}
                />
                {partnerForm.profile.type === "employee" && selectedEmployee && (
                  <small className="text-muted">This field is auto-populated from HR database</small>
                )}
              </div>

              <div className="mb-3">
                <label htmlFor="" className="Control-label">Last Name</label>
                <input
                  type="text"
                  name="last_name"
                  className="form-control rounded shadow-none border px-1 py-2"
                  placeholder="Last Name"
                  value={partnerForm.last_name}
                  onChange={handleChange}
                  disabled={partnerForm.profile.type === "employee" && selectedEmployee}
                  style={partnerForm.profile.type === "employee" && selectedEmployee ? { backgroundColor: '#f0f0f0', cursor: 'not-allowed' } : {}}
                />
                {partnerForm.profile.type === "employee" && selectedEmployee && (
                  <small className="text-muted">This field is auto-populated from HR database</small>
                )}
              </div>

              <div className="mb-3">
                <label htmlFor="" className="Control-label">Email</label>
                <input
                  type="email"
                  name="email"
                  className="form-control rounded shadow-none  px-1 py-2"
                  required
                  placeholder="Email"
                  value={partnerForm.email}
                  onChange={handleChange}
                  disabled={partnerForm.profile.type === "employee" && selectedEmployee}
                  style={partnerForm.profile.type === "employee" && selectedEmployee ? { backgroundColor: '#f0f0f0', cursor: 'not-allowed' } : {}}
                />
                {partnerForm.profile.type === "employee" && selectedEmployee && (
                  <small className="text-muted">This field is auto-populated from HR database</small>
                )}
              </div>

              <div className="mb-3">
                <label htmlFor="" className="Control-label">
                  Username
                </label>
                <input
                  type="text"
                  name="username"
                  className="form-control rounded shadow-none  px-1 py-2"
                  required
                  placeholder="Username"
                  value={partnerForm.username}
                  onChange={handleChange}
                  disabled={editingId !== null}
                  style={editingId !== null ? { backgroundColor: '#e9ecef', cursor: 'not-allowed' } : {}}
                />
                {editingId !== null && (
                  <small className="text-muted">Username cannot be changed</small>
                )}
              </div>

              <div className="mb-3">
                <label htmlFor="" className="Control-label">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  className="form-control rounded shadow-none  px-1 py-2"
                  required={!editingId}
                  placeholder={editingId ? "****" : "Password"}
                  value={partnerForm.password}
                  onChange={handleChange}
                />
                {editingId && (
                  <small className="text-muted">Leave blank to use same password</small>
                )}
              </div>

              {/* Organization Dropdown - Only shown for admin/superadmin */}
              {isAdminType && (
                <div className="mb-3">
                  <label htmlFor="" className="Control-label">
                    Organization
                  </label>
                  <Select
                    isMulti
                    name="organizations"
                    options={organizations.map((org) => ({
                      value: org.id,
                      label: org.name,
                    }))}
                    value={organizations
                      .filter((org) => partnerForm.organizations.includes(org.id))
                      .map((org) => ({
                        value: org.id,
                        label: org.name,
                      }))}
                    onChange={(selected) =>
                      setPartnerForm((prev) => ({
                        ...prev,
                        organizations: selected.map((option) => option.value),
                      }))
                    }
                    className="basic-multi-select"
                    classNamePrefix="select"
                    placeholder="Select organization(s)"
                  />
                </div>
              )}

              {/* Groups Dropdown */}
              <div className="mb-3">
                <label htmlFor="" className="Control-label">
                  Groups
                </label>
                <Select
                  isMulti
                  name="groups"
                  options={getGroupsForOrganization().map((group) => ({
                    value: group.id,
                    label: group.name,
                  }))}
                  value={groups
                    .filter((group) => partnerForm.groups.includes(group.id))
                    .map((group) => ({
                      value: group.id,
                      label: group.name,
                    }))}
                  onChange={(selected) =>
                    setPartnerForm((prev) => ({
                      ...prev,
                      groups: selected.map((option) => option.value),
                    }))
                  }
                  className="basic-multi-select"
                  classNamePrefix="select"
                />
              </div>

              {/* Branch Selection for Employees */}
              {partnerForm.profile.type === "employee" && (
                <div className="mb-3">
                  <label htmlFor="" className="Control-label">
                    Branch <span className="text-danger">*</span>
                  </label>
                  <Select
                    options={branches.map((b) => ({
                      value: b.id,
                      label: `${b.name} (${b.branch_code || b.id})`
                    }))}
                    value={
                      partnerForm.branches && partnerForm.branches.length > 0
                        ? {
                          value: partnerForm.branches[0],
                          label: branches.find(b => b.id === partnerForm.branches[0])?.name || `Branch ID: ${partnerForm.branches[0]}`
                        }
                        : null
                    }
                    onChange={(selected) => {
                      const branchId = selected ? selected.value : null;

                      // Auto-populate organization based on selected branch
                      let organizationId = null;
                      if (branchId) {
                        const selectedBranch = branches.find(b => b.id === branchId);
                        if (selectedBranch && selectedBranch.organization) {
                          organizationId = selectedBranch.organization;
                        }
                      }

                      // Update branch and organization
                      setPartnerForm((prev) => ({
                        ...prev,
                        branches: branchId ? [branchId] : [],
                        organizations: organizationId ? [organizationId] : [],
                      }));
                    }}
                    placeholder="Select a branch"
                    isClearable
                    className="basic-single"
                    classNamePrefix="select"
                  />
                  <small className="text-muted">
                    Select the branch this employee belongs to
                  </small>
                </div>
              )}

              {/* Branch Selection for Branch Users (Subagents) */}
              {partnerForm.profile.type === "subagent" && (
                <div className="mb-3">
                  <label htmlFor="" className="Control-label">
                    Branch <span className="text-danger">*</span>
                  </label>
                  <Select
                    options={branches.map((b) => ({
                      value: b.id,
                      label: `${b.name} (${b.branch_code || b.id})`
                    }))}
                    value={
                      partnerForm.branches && partnerForm.branches.length > 0
                        ? {
                          value: partnerForm.branches[0],
                          label: branches.find(b => b.id === partnerForm.branches[0])?.name || `Branch ID: ${partnerForm.branches[0]}`
                        }
                        : null
                    }
                    onChange={(selected) => {
                      const branchId = selected ? selected.value : null;

                      // Auto-populate organization based on selected branch
                      let organizationId = null;
                      if (branchId) {
                        const selectedBranch = branches.find(b => b.id === branchId);
                        if (selectedBranch && selectedBranch.organization) {
                          organizationId = selectedBranch.organization;
                        }
                      }

                      // Update branch and organization
                      setPartnerForm((prev) => ({
                        ...prev,
                        branches: branchId ? [branchId] : [],
                        organizations: organizationId ? [organizationId] : [],
                      }));
                    }}
                    placeholder="Select a branch"
                    isClearable
                    className="basic-single"
                    classNamePrefix="select"
                  />
                  <small className="text-muted">
                    Organization will be automatically set based on selected branch
                  </small>
                </div>
              )}

              {/* Agency Fields (only shown when type is agent) */}
              {isAgentType && (
                <>
                  {/* Display current branch and agency when editing */}
                  {editingId && (
                    <div className="mb-3 p-3 bg-light rounded">
                      <h6 className="fw-semibold mb-2">Current Assignment</h6>
                      <div className="row">
                        <div className="col-md-6">
                          <p className="mb-1">
                            <strong>Branch:</strong>{" "}
                            {partnerForm.branches && partnerForm.branches.length > 0
                              ? branches.find(b => b.id === partnerForm.branches[0])?.name ||
                              `Branch ID: ${partnerForm.branches[0]}`
                              : "Not assigned"}
                            {partnerForm.branches && partnerForm.branches.length > 0 && (
                              <span className="text-muted ms-1">
                                ({branches.find(b => b.id === partnerForm.branches[0])?.branch_code || "N/A"})
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="col-md-6">
                          <p className="mb-1">
                            <strong>Agency:</strong>{" "}
                            {partnerForm.agencies && partnerForm.agencies.length > 0
                              ? agencies.find(a => a.id === partnerForm.agencies[0])?.ageny_name ||
                              `Agency ID: ${partnerForm.agencies[0]}`
                              : "Not assigned"}
                          </p>
                        </div>
                      </div>
                      <small className="text-muted">You can change the assignment below</small>
                    </div>
                  )}

                  {/* Branch select FIRST for agents */}
                  <div className="mb-3">
                    <label htmlFor="" className="form-label">
                      Select Branch <span className="text-danger">*</span>
                    </label>
                    <Select
                      options={branches.map((b) => ({ value: b.id, label: `${b.name} (${b.branch_code || b.id})` }))}
                      value={
                        selectedBranchForAgency
                          ? { value: selectedBranchForAgency, label: branches.find(x => x.id === selectedBranchForAgency)?.name }
                          : null
                      }
                      onChange={(selected) => {
                        const branchId = selected ? selected.value : null;
                        setSelectedBranchForAgency(branchId);

                        // Auto-populate organization based on selected branch
                        let organizationId = null;
                        if (branchId) {
                          const selectedBranch = branches.find(b => b.id === branchId);
                          if (selectedBranch && selectedBranch.organization) {
                            organizationId = selectedBranch.organization;
                          }
                        }

                        // Clear agency selection and update branch + organization
                        setPartnerForm((prev) => ({
                          ...prev,
                          agencies: [],
                          branches: branchId ? [branchId] : [],
                          organizations: organizationId ? [organizationId] : [],
                        }));
                      }}
                      placeholder="Select a branch first"
                      isClearable
                    />
                  </div>

                  {/* Agency select SECOND - only show if branch is selected */}
                  <div className="mb-3">
                    <label htmlFor="" className="form-label">
                      Select Agency {selectedBranchForAgency && <span className="text-danger">*</span>}
                    </label>
                    <Select
                      options={agencies
                        .filter(agency => agency.branch === selectedBranchForAgency)
                        .map((agency) => ({
                          value: agency.id,
                          label: agency.ageny_name || agency.name,
                        }))}
                      value={
                        partnerForm.agencies &&
                          partnerForm.agencies.length > 0
                          ? {
                            value: partnerForm.agencies[0],
                            label: agencies.find(
                              (a) => a.id === partnerForm.agencies[0]
                            )?.ageny_name || agencies.find(
                              (a) => a.id === partnerForm.agencies[0]
                            )?.name,
                          }
                          : null
                      }
                      onChange={(selected) => {
                        setPartnerForm((prev) => ({
                          ...prev,
                          agencies: selected ? [selected.value] : [],
                        }));
                      }}
                      isDisabled={!selectedBranchForAgency}
                      placeholder={selectedBranchForAgency ? "Select an agency" : "Please select a branch first"}
                      isClearable
                    />
                    {!selectedBranchForAgency && (
                      <small className="text-muted">
                        Please select a branch first to see available agencies
                      </small>
                    )}
                    {selectedBranchForAgency && agencies.filter(a => a.branch === selectedBranchForAgency).length === 0 && (
                      <small className="text-warning">
                        No agencies found for this branch
                      </small>
                    )}
                  </div>
                </>
              )}

              <div className="row">
                <div className="col-md-6 d-flex align-items-center mb-3">
                  <Form.Check
                    type="switch"
                    id="user-active-switch"
                    name="is_active"
                    label="User active"
                    checked={partnerForm.is_active}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="d-flex justify-content-between">
                <Button
                  variant="primary"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Spinner size="sm" animation="border" />
                  ) : editingId ? (
                    "Update"
                  ) : (
                    "Save and close"
                  )}
                </Button>
                <Button
                  variant="light"
                  className="text-muted"
                  onClick={handleClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </div>
            </Form>
          </Modal.Body>
        </Modal>
      </div>
    </>
  );
};

export default Partners;
