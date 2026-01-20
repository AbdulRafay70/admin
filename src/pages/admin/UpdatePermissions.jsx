import React, { useState, useEffect } from "react";
import Select from "react-select";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import { Link, NavLink } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import AdminFooter from "../../components/AdminFooter";

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

const UpdateGroupPermissions = () => {
  const [selectedGroupType, setSelectedGroupType] = useState(""); // "admin" or "agent"
  const [groups, setGroups] = useState([]);
  const [permissions, setPermissions] = useState({});
  const [permissionSections, setPermissionSections] = useState([]);
  const [permissionNameMap, setPermissionNameMap] = useState({});
  const [allPermissions, setAllPermissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [groupPermissions, setGroupPermissions] = useState([]);
  const [collapsedSections, setCollapsedSections] = useState({});
  const [permissionSearchTerm, setPermissionSearchTerm] = useState("");
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [adminGroup, setAdminGroup] = useState(null);
  const [agentGroup, setAgentGroup] = useState(null);
  const [userPermissions, setUserPermissions] = useState([]); // Current user's permission codenames

  // Category metadata for icons and colors
  const categoryMetadata = {
    'Login': { icon: '🔐', color: '#6610f2', label: 'Login Access' },
    'Package': { icon: '📦', color: '#0d6efd', label: 'Packages' },
    'Hotel': { icon: '🏨', color: '#198754', label: 'Hotels' },
    'Hotel - Availability': { icon: '📅', color: '#17a2b8', label: 'Hotel Availability' },
    'Hotel - Outsourcing': { icon: '🤝', color: '#6610f2', label: 'Hotel Outsourcing' },
    'Hotel - Floor Management': { icon: '🏢', color: '#20c997', label: 'Hotel Floor Management' },
    'Ticket': { icon: '✈️', color: '#fd7e14', label: 'Tickets' },
    'Booking': { icon: '📋', color: '#6f42c1', label: 'Bookings' },
    'User': { icon: '👥', color: '#0dcaf0', label: 'Users' },
    'Universal Registration': { icon: '📝', color: '#0d6efd', label: 'Universal Registration' },
    'Organization': { icon: '🏢', color: '#212529', label: 'Organizations' },
    'Branch': { icon: '🏪', color: '#20c997', label: 'Branches' },
    'Agency': { icon: '🏛️', color: '#d63384', label: 'Agencies' },
    'Employee': { icon: '👤', color: '#6c757d', label: 'Employees' },
    'Permission': { icon: '🔐', color: '#6610f2', label: 'Permissions' },
    'Commission Group': { icon: '👨‍👩‍👧‍👦', color: '#fd7e14', label: 'Commission Group' },
    'Ziyarat': { icon: '🕌', color: '#198754', label: 'Ziyarat' },
    'Transport': { icon: '🚌', color: '#0dcaf0', label: 'Transport' },
    'Food': { icon: '🍽️', color: '#ffc107', label: 'Food Service' },
    'Finance': { icon: '💰', color: '#28a745', label: 'Finance' },
    'Lead': { icon: '📞', color: '#17a2b8', label: 'Leads' },
    'Customer': { icon: '👤', color: '#6c757d', label: 'Customers' },
    'Content': { icon: '📝', color: '#6f42c1', label: 'Blogs' },
    'Form': { icon: '📋', color: '#17a2b8', label: 'Form Management' },
    'Rules': { icon: '📜', color: '#6610f2', label: 'Rules Management' },
    'Marketing': { icon: '📢', color: '#e83e8c', label: 'Marketing' },
    'HR': { icon: '👔', color: '#fd7e14', label: 'HR' },
    'Pax Movement': { icon: '🚶', color: '#17a2b8', label: 'Pax Movement & Intimation' },
    'Daily Operations': { icon: '📋', color: '#28a745', label: 'Daily Operations' },
    'CRM': { icon: '📊', color: '#6f42c1', label: 'CRM' },
    'Partners': { icon: '🤝', color: '#0d6efd', label: 'Partners' },
    'Payments': { icon: '💳', color: '#198754', label: 'Payments' },
    'Finance': { icon: '💰', color: '#ffc107', label: 'Finance' },
    'Order Delivery': { icon: '📦', color: '#17a2b8', label: 'Order Delivery' },
    'Booking History': { icon: '📒', color: '#6f42c1', label: 'Booking History' },
    'Operations': { icon: '⚙️', color: '#20c997', label: 'Operations' },
    'System': { icon: '📜', color: '#6610f2', label: 'Rules Management' },
    'Visa and Other Permissions': { icon: '🛂', color: '#dc3545', label: 'Visa and Other Permissions' },
    'Umrah Calculator': { icon: '🧮', color: '#17a2b8', label: 'Umrah Calculator' },
    'Uncategorized': { icon: '📁', color: '#adb5bd', label: 'Uncategorized' }
  };

  // Calculate permission statistics - shows only USER'S permissions
  const permissionStats = React.useMemo(() => {
    // For superusers, show all available permissions
    const permsToCount = userPermissions;

    const adminCount = permsToCount.filter(p =>
      p?.endsWith('_admin') || p === 'admin_portal_access'
    ).length;
    const agentCount = permsToCount.filter(p =>
      p?.endsWith('_agent') || p === 'agent_portal_access'
    ).length;
    return {
      admin: adminCount,
      agent: agentCount,
      total: adminCount + agentCount
    };
  }, [userPermissions]);

  // Fetch all permissions once when component mounts 
  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) throw new Error("Authentication token not available");

        const permsRes = await axios.get(
          "http://127.0.0.1:8000/api/permissions/",
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const allPerms = permsRes.data;
        setAllPermissions(allPerms);

        const nameMap = {};
        allPerms.forEach((perm) => {
          nameMap[perm.codename] = perm.name;
        });
        setPermissionNameMap(nameMap);

        // Fetch current user's permissions
        try {
          const userPermsRes = await axios.get(
            "http://127.0.0.1:8000/api/current-user/permissions/",
            { headers: { Authorization: `Bearer ${token}` } }
          );
          console.log('Current user permissions:', userPermsRes.data.permissions);
          console.log('Is superuser:', userPermsRes.data.user?.is_superuser);

          // If superuser, use ALL permissions; otherwise use user's permissions
          if (userPermsRes.data.user?.is_superuser) {
            console.log('🔓 Superuser detected - showing all permissions');
            const allPermCodenames = allPerms.map(p => p.codename);
            setUserPermissions(allPermCodenames);
          } else {
            setUserPermissions(userPermsRes.data.permissions || []);
          }
        } catch (error) {
          console.error('Error fetching user permissions:', error);
          // If user is superuser or has issues, set empty array
          setUserPermissions([]);
        }

        // Keyword to category mapping
        const keywordToCategoryMap = {
          // Login permissions (check first)
          'portal_access': 'Login',
          'admin_portal': 'Login',
          'agent_portal': 'Login',

          // Order Delivery category (check BEFORE general keywords)
          'order_delivery': 'Order Delivery',

          // Booking History category (check BEFORE general keywords)
          'booking_history': 'Booking History',
          'agent_bookings': 'Booking History',
          'org_bookings': 'Booking History',
          'branch_bookings': 'Booking History',
          'employee_bookings': 'Booking History',

          // Finance-specific keywords (check BEFORE Payments to avoid conflicts)
          'recent_transactions': 'Finance',
          'profit_loss_reports': 'Finance',
          'financial_ledger': 'Finance',  // Must be before 'ledger_admin' to match view_financial_ledger_admin
          'expense_management': 'Finance',
          'manual_posting': 'Finance',
          'tax_reports_fbr': 'Finance',
          'balance_sheet': 'Finance',
          'audit_trail': 'Finance',

          // Payments-specific keywords (check AFTER Finance keywords)
          'ledger_admin': 'Payments',  // Only matches view_ledger_admin now
          'payments_finance': 'Payments',
          'approve_payments': 'Payments',
          'reject_payments': 'Payments',
          'bank_account': 'Payments',
          'pending_payments': 'Payments',
          'add_remarks_pending': 'Payments',
          'ledger_agent': 'Payments',
          'deposit_payment': 'Payments',
          'bank_account_agent': 'Payments',

          // Hotel sub-components (map to Hotel category)
          'availability': 'Hotel',
          'outsourcing': 'Hotel',
          'floor_management': 'Hotel',

          // Universal Registration sub-components (map to Universal Registration category)
          'organization_admin': 'Universal Registration',
          'agency_admin': 'Universal Registration',
          'branch_registration': 'Universal Registration',

          // Daily Operations sub-components (map to Daily Operations category)
          'hotel_checkin': 'Daily Operations',
          'ziyarat_operations': 'Daily Operations',
          'transport_operations': 'Daily Operations',
          'airport_operations': 'Daily Operations',
          'food_operations': 'Daily Operations',
          'pax_details': 'Daily Operations',

          // CRM sub-components (map to CRM category)
          'leads_admin': 'CRM',
          'loan_admin': 'CRM',
          'tasks_admin': 'CRM',
          'closed_leads': 'CRM',
          'instant_admin': 'CRM',
          'passport_leads': 'CRM',
          'walking_customer': 'CRM',
          'customer_database': 'CRM',

          // Partners/Add Users sub-components (map to Partners category)
          'add_users': 'Partners',
          'users_admin': 'Partners',
          'groups_admin': 'Partners',
          'branches_admin': 'Partners',
          'organization_admin': 'Partners',
          'agency_admin': 'Partners',
          'branch_admin': 'Partners',
          'discount_groups_admin': 'Partners',
          'create_resell_request': 'Partners',
          'create_link_org': 'Partners',
          'markup_add_group': 'Partners',
          'markup_assign_value': 'Partners',
          'commission_add_group': 'Partners',
          'commission_assign_value': 'Partners',
          'super_admin_admin': 'Partners',
          'admin_admin': 'Partners',
          'agent_admin': 'Partners',
          'area_agent': 'Partners',
          'employee_admin': 'Partners',
          'branch_users_admin': 'Partners',

          // Visa and Other Permissions (check BEFORE general keywords to avoid conflicts)
          'riyal_rate_admin': 'Visa and Other Permissions',
          'shirka_admin': 'Visa and Other Permissions',
          'sector_admin': 'Visa and Other Permissions',
          'big_sector_admin': 'Visa and Other Permissions',
          'visa_transport_rate_admin': 'Visa and Other Permissions',
          'only_visa_rate_admin': 'Visa and Other Permissions',
          'long_term_visa_rate_admin': 'Visa and Other Permissions',
          'transport_price_admin': 'Visa and Other Permissions',
          'food_price_admin': 'Visa and Other Permissions',
          'ziarat_price_admin': 'Visa and Other Permissions',
          'flight_admin': 'Visa and Other Permissions',
          'city_admin': 'Visa and Other Permissions',
          'booking_expire_time_admin': 'Visa and Other Permissions',

          // Umrah Calculator (Agent Portal) - only add permissions
          'add_transport_agent': 'Umrah Calculator',
          'add_flight_agent': 'Umrah Calculator',
          'add_hotel_agent': 'Umrah Calculator',
          'add_food_agent': 'Umrah Calculator',
          'add_ziarat_agent': 'Umrah Calculator',

          // Specific compound keywords
          'commissiongroup': 'Commission Group',
          'discountgroup': 'Finance',
          'booking': 'Booking',
          'package': 'Package',
          'hotel': 'Hotel',
          'room': 'Hotel',
          'bed': 'Hotel',
          'sector': 'Hotel',
          'ticket': 'Ticket',
          'airport': 'Ticket',
          'flight': 'Ticket',
          'airline': 'Ticket',
          'stopover': 'Ticket',
          'ziyarat': 'Ziyarat',
          'ziarat': 'Ziyarat',
          'transport': 'Transport',
          'vehicle': 'Transport',
          'food': 'Food',
          'organization': 'Organization',
          'branch': 'Branch',
          'agency': 'Agency',
          'reseller': 'Agency',
          'user': 'User',
          'group': 'Commission Group',
          'permission': 'Permission',
          'profile': 'User',
          'lead': 'Lead',
          'followup': 'Lead',
          'passport': 'Lead',
          'customer': 'Customer',
          'expense': 'Finance',
          'financial': 'Finance',
          'transaction': 'Finance',
          'loan': 'Finance',

          // HR-specific commission and payments (check BEFORE general Finance keywords)
          'hr_commission': 'HR',
          'hr_payments': 'HR',

          'ledger': 'Finance',
          'commission': 'Finance',
          'discount': 'Finance',
          'fine': 'Finance',
          'bank': 'Finance',
          'payment': 'Finance',
          'account': 'Finance',
          'markup': 'Finance',
          'visa': 'Finance',

          // HR sub-components (map to HR category)
          'employees_admin': 'HR',
          'attendance_admin': 'HR',
          'movements_admin': 'HR',
          'commission_admin': 'HR',
          'punctuality_admin': 'HR',
          'approvals_admin': 'HR',
          'payments_admin': 'HR',

          'attendance': 'HR',
          'leave': 'HR',
          'employee': 'HR',

          // Pax Movements sub-components (map to Pax Movement category)
          'pax_movement': 'Pax Movement',
          'pax_movements': 'Pax Movement',
          'hotels_movements': 'Pax Movement',
          'transport_ziyarat_movements': 'Pax Movement',
          'flights_movements': 'Pax Movement',
          'all_passengers_movements': 'Pax Movement',

          'blog': 'Content',
          'form': 'Form',
          'rule': 'Rules',
          'dynamic': 'Content',
          'submission': 'Content',
          'promotion': 'Marketing',
          'operation': 'Operations',
          'internal': 'Operations',
          'passenger': 'Pax Movement',
          'audit': 'System',
          'log': 'System',
          'session': 'System',
          'token': 'System',
          'contenttype': 'System',
          'city': 'System',
          'registration': 'System',
          'rule': 'System',
          'sequence': 'System',
          'universal': 'System',
          'punctuality': 'HR',
          'salary': 'HR',
          'riyal': 'Finance',
          'rate': 'Finance',
          'resell': 'Agency',
          'shirka': 'Agency',
        };

        const grouped = allPerms.reduce((acc, perm) => {
          let panel = "Uncategorized";
          const codename = (perm.codename || '').toLowerCase();

          // Check each keyword to find a match
          for (const [keyword, category] of Object.entries(keywordToCategoryMap)) {
            if (codename.includes(keyword)) {
              panel = category;
              break;
            }
          }

          // Fallback: try to extract from content_type if no keyword match
          if (panel === "Uncategorized") {
            if (typeof perm.content_type === "string" && perm.content_type) {
              const parts = perm.content_type.split("|");
              const modelName = parts.length >= 2 ? parts[1].trim().toLowerCase() : perm.content_type.trim().toLowerCase();

              for (const [keyword, category] of Object.entries(keywordToCategoryMap)) {
                if (modelName.includes(keyword)) {
                  panel = category;
                  break;
                }
              }

              if (panel === "Uncategorized" && modelName) {
                panel = modelName.charAt(0).toUpperCase() + modelName.slice(1);
              }
            } else if (perm.content_type && typeof perm.content_type === "object") {
              const modelName = (perm.content_type.model || "").toLowerCase();

              for (const [keyword, category] of Object.entries(keywordToCategoryMap)) {
                if (modelName.includes(keyword)) {
                  panel = category;
                  break;
                }
              }

              if (panel === "Uncategorized") {
                panel = perm.content_type.model || "Uncategorized";
              }
            }
          }

          if (!acc[panel]) acc[panel] = [];
          acc[panel].push(perm.codename);
          return acc;
        }, {});

        const sections = Object.keys(grouped)
          .sort((a, b) => {
            // Put Login first
            if (a === 'Login') return -1;
            if (b === 'Login') return 1;
            return a.localeCompare(b);
          })
          .map((panel) => ({
            id: panel,
            title:
              panel === "Uncategorized"
                ? "Uncategorized"
                : panel
                  .replace(/([a-z])([A-Z])/g, "$1 $2")
                  .split(" ")
                  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(" "),
            permissions: grouped[panel].sort(),
          }));
        setPermissionSections(sections);

        // Initialize all sections as collapsed
        const initialCollapsedState = {};
        sections.forEach(section => {
          initialCollapsedState[section.id] = true; // true means collapsed
        });
        setCollapsedSections(initialCollapsedState);
      } catch (err) {
        console.error("Error fetching permissions:", err);
        toast.error("Failed to load permissions");
      }
    };

    fetchPermissions();
  }, []);

  // Fetch groups
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem("accessToken");
        if (!token) throw new Error("Authentication token not available");

        const storedOrg = JSON.parse(
          localStorage.getItem("selectedOrganization")
        );
        const orgId = storedOrg ? storedOrg.id : null;

        const [groupsRes, permsRes] = await Promise.all([
          axios.get("http://127.0.0.1:8000/api/groups/", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get("http://127.0.0.1:8000/api/permissions/", {
            headers: { Authorization: `Bearer ${token}` },
          })
        ]);

        // Filter groups by organization
        const filteredGroups = orgId
          ? groupsRes.data.filter(
            (group) => !group.extended?.organization || group.extended?.organization === orgId
          )
          : groupsRes.data;

        setGroups(filteredGroups);

        // Find Admin and Agent groups
        const admin = filteredGroups.find(g => g.name === 'Admin');
        const agent = filteredGroups.find(g => g.name === 'Agent');

        setAdminGroup(admin);
        setAgentGroup(agent);

      } catch (err) {
        console.error("Error fetching groups:", err);
        toast.error("Failed to load groups");
      } finally {
        setIsLoading(false);
      }
    };

    fetchGroups();
  }, []);

  // When selectedGroupType changes, load that group's permissions
  useEffect(() => {
    const loadGroupPermissions = async () => {
      if (!selectedGroupType) {
        setGroupPermissions([]);
        return;
      }

      const group = selectedGroupType === 'admin' ? adminGroup : agentGroup;
      if (!group) return;

      try {
        const token = localStorage.getItem("accessToken");
        const response = await axios.get(
          `http://127.0.0.1:8000/api/groups/${group.id}/`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const permIDs = Array.isArray(response.data.permissions)
          ? response.data.permissions
          : [];

        // Convert IDs to codenames
        const perms = allPermissions
          .filter((p) => permIDs.includes(p.id))
          .map((p) => p.codename);

        setGroupPermissions(perms);
      } catch (err) {
        console.error("Error loading group permissions:", err);
        toast.error("Failed to load group permissions");
      }
    };

    loadGroupPermissions();
  }, [selectedGroupType, adminGroup, agentGroup, allPermissions]);

  // Initialize permissions state when permissionSections loads or when selectedGroup changes
  useEffect(() => {
    if (!permissionSections.length || !selectedGroup) return;

    const initial = {};
    permissionSections.forEach((section) => {
      initial[section.id] = {};
      section.permissions.forEach((perm) => {
        initial[section.id][perm] = groupPermissions.includes(perm);
      });
    });

    setPermissions(initial);
  }, [permissionSections, selectedGroup]); // Removed groupPermissions to prevent reset on every check/uncheck

  const handlePermissionChange = (sectionId, perm) => {
    setPermissions((prev) => {
      const newValue = !prev[sectionId][perm];

      setGroupPermissions((prevCodenames) => {
        let updatedCodenames;

        if (newValue) {
          // When checking a permission
          updatedCodenames = [...prevCodenames, perm];

          // Auto-check view permission if add/edit/delete/book is selected
          if (perm.includes('add_') || perm.includes('edit_') || perm.includes('delete_') || perm.includes('book_')) {
            // Extract the base permission name (e.g., "package_admin" from "add_package_admin")
            const baseName = perm.replace(/^(add_|edit_|delete_|book_)/, '');
            const viewPermission = `view_${baseName}`;

            // Check if view permission exists in the same section
            const section = permissionSections.find(s => s.id === sectionId);
            if (section && section.permissions.includes(viewPermission)) {
              // Add view permission if not already added
              if (!updatedCodenames.includes(viewPermission)) {
                updatedCodenames = [...updatedCodenames, viewPermission];

                // Also update the permissions state for view
                setPermissions(prevPerms => ({
                  ...prevPerms,
                  [sectionId]: {
                    ...prevPerms[sectionId],
                    [viewPermission]: true
                  }
                }));
              }
            }
          }
        } else {
          // When unchecking a permission
          updatedCodenames = prevCodenames.filter((c) => c !== perm);
        }

        return updatedCodenames;
      });

      return {
        ...prev,
        [sectionId]: {
          ...prev[sectionId],
          [perm]: newValue,
        },
      };
    });
  };

  // Toggle section collapse/expand
  const toggleSection = (sectionId) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  // Handle category-level select all
  const handleCategorySelectAll = (sectionId, isChecked) => {
    const section = permissionSections.find(s => s.id === sectionId);
    if (!section) return;

    const filteredPerms = section.permissions.filter(perm => {
      const permName = permissionNameMap[perm] || perm;
      const searchLower = permissionSearchTerm.toLowerCase();
      const matchesSearch = permName.toLowerCase().includes(searchLower) ||
        perm.toLowerCase().includes(searchLower);

      // Filter based on selected group type
      if (selectedGroupType === 'admin') {
        // For admin, exclude agent-specific permissions (end with _agent OR agent_portal_access)
        if (perm.endsWith('_agent') || perm === 'agent_portal_access') {
          return false;
        }
      } else if (selectedGroupType === 'agent') {
        // For agent, exclude admin-specific permissions (end with _admin OR admin_portal_access)
        if (perm.endsWith('_admin') || perm === 'admin_portal_access') {
          return false;
        }
      }

      return matchesSearch;
    });

    setGroupPermissions(prev => {
      if (isChecked) {
        return [...new Set([...prev, ...filteredPerms])];
      } else {
        return prev.filter(p => !filteredPerms.includes(p));
      }
    });

    setPermissions(prev => {
      const newPerms = { ...prev };
      filteredPerms.forEach(perm => {
        newPerms[sectionId][perm] = isChecked;
      });
      return newPerms;
    });
  };

  // Get category metadata
  const getCategoryMeta = (sectionId) => {
    return categoryMetadata[sectionId] || categoryMetadata['Uncategorized'];
  };

  // Calculate selected count for a category
  const getCategorySelectedCount = (section) => {
    const filteredPerms = section.permissions.filter(perm => {
      const permName = permissionNameMap[perm] || perm;
      const searchLower = permissionSearchTerm.toLowerCase();
      const matchesSearch = permName.toLowerCase().includes(searchLower) ||
        perm.toLowerCase().includes(searchLower);

      // FILTER: Only show permissions user has
      const userHasPermission = userPermissions.includes(perm);
      if (!userHasPermission) {
        return false; // Hide permissions user doesn't have
      }

      // Filter based on selected group type
      if (selectedGroupType === 'admin') {
        // For admin, exclude agent-specific permissions (end with _agent OR agent_portal_access)
        if (perm.endsWith('_agent') || perm === 'agent_portal_access') {
          return false;
        }
      } else if (selectedGroupType === 'agent') {
        // For agent, exclude admin-specific permissions (end with _admin OR admin_portal_access)
        if (perm.endsWith('_admin') || perm === 'admin_portal_access') {
          return false;
        }
      }

      return matchesSearch;
    });

    const selectedCount = filteredPerms.filter(perm =>
      permissions?.[section.id]?.[perm] || false
    ).length;

    return { selected: selectedCount, total: filteredPerms.length };
  };

  // Helper function to organize hotel permissions into sub-groups
  const organizeHotelPermissions = (permissions) => {
    const subGroups = {
      main: [],
      availability: [],
      outsourcing: [],
      floor_management: []
    };

    permissions.forEach(perm => {
      if (perm.includes('availability')) {
        subGroups.availability.push(perm);
      } else if (perm.includes('outsourcing')) {
        subGroups.outsourcing.push(perm);
      } else if (perm.includes('floor_management')) {
        subGroups.floor_management.push(perm);
      } else {
        subGroups.main.push(perm);
      }
    });

    return subGroups;
  };

  // Helper function to organize Universal Registration permissions into sub-groups
  const organizeUniversalRegistrationPermissions = (permissions) => {
    const subGroups = {
      organization: [],
      branch: [],
      agency: [],
      employee: []
    };

    permissions.forEach(perm => {
      if (perm.includes('organization')) {
        subGroups.organization.push(perm);
      } else if (perm.includes('branch')) {
        subGroups.branch.push(perm);
      } else if (perm.includes('agency')) {
        subGroups.agency.push(perm);
      } else if (perm.includes('employee')) {
        subGroups.employee.push(perm);
      }
    });

    return subGroups;
  };

  // Helper function to organize Daily Operations permissions into sub-groups
  const organizeDailyOperationsPermissions = (permissions) => {
    const subGroups = {
      hotel_checkin: [],
      ziyarat_operations: [],
      transport_operations: [],
      airport_operations: [],
      food_operations: [],
      pax_details: []
    };

    permissions.forEach(perm => {
      if (perm.includes('hotel_checkin')) {
        subGroups.hotel_checkin.push(perm);
      } else if (perm.includes('ziyarat_operations')) {
        subGroups.ziyarat_operations.push(perm);
      } else if (perm.includes('transport_operations')) {
        subGroups.transport_operations.push(perm);
      } else if (perm.includes('airport_operations')) {
        subGroups.airport_operations.push(perm);
      } else if (perm.includes('food_operations')) {
        subGroups.food_operations.push(perm);
      } else if (perm.includes('pax_details')) {
        subGroups.pax_details.push(perm);
      }
    });

    return subGroups;
  };

  // Helper function to organize CRM permissions into sub-groups
  const organizeCRMPermissions = (permissions) => {
    const subGroups = {
      leads: [],
      loan: [],
      tasks: [],
      closed_leads: [],
      instant: [],
      passport_leads: [],
      walking_customer: [],
      customer_database: []
    };

    permissions.forEach(perm => {
      if (perm.includes('passport_leads')) {
        subGroups.passport_leads.push(perm);
      } else if (perm.includes('walking_customer')) {
        subGroups.walking_customer.push(perm);
      } else if (perm.includes('customer_database')) {
        subGroups.customer_database.push(perm);
      } else if (perm.includes('closed_leads')) {
        subGroups.closed_leads.push(perm);
      } else if (perm.includes('leads')) {
        subGroups.leads.push(perm);
      } else if (perm.includes('loan')) {
        subGroups.loan.push(perm);
      } else if (perm.includes('tasks')) {
        subGroups.tasks.push(perm);
      } else if (perm.includes('instant')) {
        subGroups.instant.push(perm);
      }
    });

    return subGroups;
  };

  // Helper function to organize HR permissions into sub-groups
  const organizeHRPermissions = (permissions) => {
    const subGroups = {
      employees: [],
      attendance: [],
      movements: [],
      commission: [],
      punctuality: [],
      approvals: [],
      payments: []
    };

    permissions.forEach(perm => {
      if (perm.includes('employees')) {
        subGroups.employees.push(perm);
      } else if (perm.includes('attendance')) {
        subGroups.attendance.push(perm);
      } else if (perm.includes('movements')) {
        subGroups.movements.push(perm);
      } else if (perm.includes('commission')) {
        subGroups.commission.push(perm);
      } else if (perm.includes('punctuality')) {
        subGroups.punctuality.push(perm);
      } else if (perm.includes('approvals')) {
        subGroups.approvals.push(perm);
      } else if (perm.includes('payments')) {
        subGroups.payments.push(perm);
      }
    });

    return subGroups;
  };

  // Helper function to organize Payments permissions into sub-groups
  const organizePaymentsPermissions = (permissions) => {
    const subGroups = {
      ledger: [],
      payments: [],
      bank_account: [],
      pending_payments: []
    };

    permissions.forEach(perm => {
      if (perm.includes('ledger')) {
        subGroups.ledger.push(perm);
      } else if (perm.includes('payments_finance') || perm.includes('approve_payments') || perm.includes('reject_payments') || perm.includes('deposit_payment')) {
        subGroups.payments.push(perm);
      } else if (perm.includes('bank_account')) {
        subGroups.bank_account.push(perm);
      } else if (perm.includes('pending_payments') || perm.includes('add_remarks_pending')) {
        subGroups.pending_payments.push(perm);
      } else if (perm.includes('booking_history') || perm.includes('agent_bookings') ||
        perm.includes('org_bookings') || perm.includes('branch_bookings') ||
        perm.includes('employee_bookings')) {
        subGroups.booking_history.push(perm);
      }
    });

    return subGroups;
  };

  // Helper function to organize Finance permissions into sub-groups
  const organizeFinancePermissions = (permissions) => {
    const subGroups = {
      recent_transactions: [],
      profit_loss_reports: [],
      financial_ledger: [],
      expense_management: [],
      manual_posting: [],
      tax_reports_fbr: [],
      balance_sheet: [],
      audit_trail: []
    };

    permissions.forEach(perm => {
      if (perm.includes('recent_transactions')) {
        subGroups.recent_transactions.push(perm);
      } else if (perm.includes('profit_loss_reports')) {
        subGroups.profit_loss_reports.push(perm);
      } else if (perm.includes('financial_ledger')) {
        subGroups.financial_ledger.push(perm);
      } else if (perm.includes('expense_management')) {
        subGroups.expense_management.push(perm);
      } else if (perm.includes('manual_posting')) {
        subGroups.manual_posting.push(perm);
      } else if (perm.includes('tax_reports_fbr')) {
        subGroups.tax_reports_fbr.push(perm);
      } else if (perm.includes('balance_sheet')) {
        subGroups.balance_sheet.push(perm);
      } else if (perm.includes('audit_trail')) {
        subGroups.audit_trail.push(perm);
      }
    });

    return subGroups;
  };

  // Helper function to organize Pax Movements permissions into sub-groups
  const organizePaxMovementsPermissions = (permissions) => {
    const subGroups = {
      main: [],
      hotels: [],
      transport_ziyarat: [],
      flights: [],
      all_passengers: []
    };

    permissions.forEach(perm => {
      if (perm.includes('hotels_movements')) {
        subGroups.hotels.push(perm);
      } else if (perm.includes('transport_ziyarat_movements')) {
        subGroups.transport_ziyarat.push(perm);
      } else if (perm.includes('flights_movements')) {
        subGroups.flights.push(perm);
      } else if (perm.includes('all_passengers_movements') || perm.includes('pax_all_passengers')) {
        subGroups.all_passengers.push(perm);
      } else if (perm.includes('pax_movements') || perm.includes('pax_movement')) {
        subGroups.main.push(perm);
      }
    });

    return subGroups;
  };

  // Helper function to organize Partners/Add Users permissions into sub-groups
  const organizePartnersPermissions = (permissions) => {
    const subGroups = {
      main: [],
      organization: [],
      groups: [],
      agency: [],
      branch_physical: [],
      discount: [],
      org_links: [],
      markup_rules: [],
      commission_rules: [],
      super_admin: [],
      admin: [],
      agent: [],
      area_agent: [],
      employee: [],
      branch: []
    };

    permissions.forEach(perm => {
      // Check for branch_users FIRST before general _users_ pattern
      if (perm.includes('branch_users')) {
        subGroups.branch.push(perm);
      } else if (perm.includes('add_users') || perm.includes('_users_') || perm.includes('users_admin') ||
        perm.includes('assign_groups') || perm.includes('assign_branches') ||
        perm.includes('assign_organization') || perm.includes('assign_agency')) {
        subGroups.main.push(perm);
      } else if (perm.includes('organization_admin') && !perm.includes('assign')) {
        subGroups.organization.push(perm);
      } else if (perm.includes('discount_groups') || perm.includes('assign_commission_to_discount')) {
        subGroups.discount.push(perm);
      } else if (perm.includes('create_resell_request') || perm.includes('create_link_org')) {
        subGroups.org_links.push(perm);
      } else if (perm.includes('markup_add_group') || perm.includes('markup_assign_value')) {
        subGroups.markup_rules.push(perm);
      } else if (perm.includes('commission_add_group') || perm.includes('commission_assign_value')) {
        subGroups.commission_rules.push(perm);
      } else if ((perm.includes('groups_admin') || perm.includes('assign_permissions_to_groups')) && !perm.includes('assign_groups') && !perm.includes('discount')) {
        subGroups.groups.push(perm);
      } else if (perm.includes('agency_admin') && !perm.includes('assign')) {
        subGroups.agency.push(perm);
      } else if (perm.includes('branch_admin') && !perm.includes('branch_users')) {
        subGroups.branch_physical.push(perm);
      } else if (perm.includes('super_admin')) {
        subGroups.super_admin.push(perm);
      } else if (perm.includes('area_agent')) {
        subGroups.area_agent.push(perm);
      } else if (perm.includes('agent_admin')) {
        subGroups.agent.push(perm);
      } else if (perm.includes('admin_admin')) {
        subGroups.admin.push(perm);
      } else if (perm.includes('employee')) {
        subGroups.employee.push(perm);
      }
    });

    return subGroups;
  };

  // Helper function to organize Visa and Other Permissions into sub-groups
  const organizeVisaOtherPermissions = (permissions) => {
    const subGroups = {
      riyal_rate: [],
      shirka: [],
      sector: [],
      big_sector: [],
      visa_transport_rate: [],
      only_visa_rates: [],
      transport_prices: [],
      food_prices: [],
      ziarat_prices: [],
      flight: [],
      city: [],
      booking_settings: []
    };

    permissions.forEach(perm => {
      if (perm.includes('riyal_rate')) {
        subGroups.riyal_rate.push(perm);
      } else if (perm.includes('shirka')) {
        subGroups.shirka.push(perm);
      } else if (perm.includes('big_sector')) {
        subGroups.big_sector.push(perm);
      } else if (perm.includes('sector_admin')) {
        subGroups.sector.push(perm);
      } else if (perm.includes('visa_transport_rate')) {
        subGroups.visa_transport_rate.push(perm);
      } else if (perm.includes('only_visa_rate') || perm.includes('long_term_visa_rate')) {
        subGroups.only_visa_rates.push(perm);
      } else if (perm.includes('transport_price')) {
        subGroups.transport_prices.push(perm);
      } else if (perm.includes('food_price')) {
        subGroups.food_prices.push(perm);
      } else if (perm.includes('ziarat_price')) {
        subGroups.ziarat_prices.push(perm);
      } else if (perm.includes('flight_admin')) {
        subGroups.flight.push(perm);
      } else if (perm.includes('city_admin')) {
        subGroups.city.push(perm);
      } else if (perm.includes('booking_expire_time')) {
        subGroups.booking_settings.push(perm);
      }
    });

    return subGroups;
  };

  // Helper function to organize Umrah Calculator permissions into sub-groups
  const organizeUmrahCalculatorPermissions = (permissions) => {
    const subGroups = {
      transport: [],
      flight: [],
      hotel: [],
      food: [],
      ziarat: []
    };

    permissions.forEach(perm => {
      if (perm.includes('transport_agent')) {
        subGroups.transport.push(perm);
      } else if (perm.includes('flight_agent')) {
        subGroups.flight.push(perm);
      } else if (perm.includes('hotel_agent')) {
        subGroups.hotel.push(perm);
      } else if (perm.includes('food_agent')) {
        subGroups.food.push(perm);
      } else if (perm.includes('ziarat_agent')) {
        subGroups.ziarat.push(perm);
      }
    });

    return subGroups;
  };

  const handleUpdatePermissions = async () => {
    if (!selectedGroupType) {
      toast.error("Please select a group type (Admin or Agent) first");
      return;
    }

    const group = selectedGroupType === 'admin' ? adminGroup : agentGroup;
    if (!group) {
      toast.error("Group not found");
      return;
    }

    try {
      setIsUpdating(true);
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("Authentication token not available");

      const res = await axios.get(
        `http://127.0.0.1:8000/api/groups/${group.id}/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const groupData = res.data;

      const selectedIDs = allPermissions
        .filter((p) => groupPermissions.includes(p.codename))
        .map((p) => p.id);

      const payload = {
        name: groupData.name,
        extended: groupData.extended,
        permissions: selectedIDs,
      };

      await axios.patch(
        `http://127.0.0.1:8000/api/groups/${group.id}/`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      toast.success(`${selectedGroupType === 'admin' ? 'Admin' : 'Agent'} permissions updated successfully!`);
    } catch (err) {
      console.error("Error updating permissions:", err.response?.data || err);
      toast.error("Failed to update permissions");
    } finally {
      setIsUpdating(false);
    }
  };

  // Helper function to check if user can modify a permission
  const canUserModifyPermission = (permissionCodename) => {
    // User can only modify permissions they have
    return userPermissions.includes(permissionCodename);
  };

  // Helper function to render permission checkbox with disabled state
  const renderPermissionCheckbox = (sectionId, perm, permIndex) => {
    const canModify = canUserModifyPermission(perm);
    const isChecked = permissions?.[sectionId]?.[perm] || false;

    return (
      <tr key={`${sectionId}-${perm}-${permIndex}`}>
        <td className="text-center">
          <input
            className="form-check-input border border-dark"
            type="checkbox"
            checked={isChecked}
            onChange={() => handlePermissionChange(sectionId, perm)}
            disabled={!canModify}
            id={`${sectionId}-${perm}-${permIndex}`}
            style={{
              opacity: canModify ? 1 : 0.5,
              cursor: canModify ? 'pointer' : 'not-allowed'
            }}
          />
        </td>
        <td>
          <label
            className="mb-0 w-100"
            htmlFor={`${sectionId}-${perm}-${permIndex}`}
            style={{
              cursor: canModify ? "pointer" : "not-allowed",
              opacity: canModify ? 1 : 0.6,
              color: canModify ? "inherit" : "#6c757d"
            }}
            title={!canModify ? "You don't have this permission" : ""}
          >
            {permissionNameMap[perm] || perm}
            {!canModify && <span className="ms-2">🔒</span>}
          </label>
        </td>
        <td>
          <code className="text-muted small">{perm}</code>
        </td>
      </tr>
    );
  };

  // Handle assigning permissions to selected group
  const handleAssignPermissions = async () => {
    if (!selectedGroup) {
      toast.error('Please select a group first');
      return;
    }

    setIsUpdating(true);
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        toast.error('Authentication token not found');
        return;
      }

      // First, fetch the group's CURRENT permissions
      const groupResponse = await axios.get(
        `http://127.0.0.1:8000/api/groups/${selectedGroup.value}/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const currentGroupPermissions = groupResponse.data.permissions || [];
      console.log('Current group permissions:', currentGroupPermissions);

      // Get all CURRENTLY CHECKED permissions from UI (what user wants to KEEP)
      const checkedPermissions = [];
      Object.entries(permissions).forEach(([category, perms]) => {
        Object.entries(perms).forEach(([perm, isSelected]) => {
          if (isSelected) {
            checkedPermissions.push(perm);
          }
        });
      });

      // Separate into permissions user CAN modify and CANNOT modify
      const checkedUserCanModify = checkedPermissions.filter(perm => canUserModifyPermission(perm));
      const checkedUserCannotModify = checkedPermissions.filter(perm => !canUserModifyPermission(perm));

      // Convert checked modifiable permissions to IDs
      const checkedModifiableIds = allPermissions
        .filter(p => checkedUserCanModify.includes(p.codename))
        .map(p => p.id);

      // Get permissions user CANNOT modify from current group (preserve these)
      const unchangeablePermissionIds = currentGroupPermissions.filter(permId => {
        const perm = allPermissions.find(p => p.id === permId);
        return perm && !canUserModifyPermission(perm.codename);
      });

      // FINAL: Combine checked modifiable permissions + unchangeable permissions
      // This means:
      // - Checked permissions user can modify: KEPT
      // - Unchecked permissions user can modify: REMOVED
      // - Permissions user cannot modify: PRESERVED (unchanged)
      const finalPermissionIds = [...new Set([...unchangeablePermissionIds, ...checkedModifiableIds])];

      console.log('Permission assignment:', {
        groupName: selectedGroup.label,
        checkedTotal: checkedPermissions.length,
        checkedUserCanModify: checkedUserCanModify.length,
        unchangeable: unchangeablePermissionIds.length,
        finalTotal: finalPermissionIds.length
      });

      // Update group with FINAL permissions
      const response = await axios.patch(
        `http://127.0.0.1:8000/api/groups/${selectedGroup.value}/`,
        { permissions: finalPermissionIds },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      toast.success(`Assigned ${checkedModifiableIds.length} permissions. Preserved ${unchangeablePermissionIds.length} you can't modify. Total: ${finalPermissionIds.length}`);

      // Optionally refresh the page or clear selections
      // setPermissions({});

    } catch (error) {
      console.error('Error assigning permissions:', error);
      toast.error(error.response?.data?.error || 'Failed to assign permissions');
    } finally {
      setIsUpdating(false);
    }
  };

  // Load group permissions when a group is selected
  useEffect(() => {
    const loadGroupPermissions = async () => {
      if (!selectedGroup) {
        return;
      }

      try {
        const token = localStorage.getItem('accessToken');
        if (!token) return;

        // Fetch the selected group's details including permissions
        const response = await axios.get(
          `http://127.0.0.1:8000/api/groups/${selectedGroup.value}/`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const groupPermissions = response.data.permissions || [];

        // Convert permission IDs to codenames
        const groupPermissionCodenames = allPermissions
          .filter(p => groupPermissions.includes(p.id))
          .map(p => p.codename);

        // Auto-check these permissions
        const newPermissions = {};
        permissionSections.forEach(section => {
          newPermissions[section.id] = {};
          section.permissions.forEach(perm => {
            newPermissions[section.id][perm] = groupPermissionCodenames.includes(perm);
          });
        });

        setPermissions(newPermissions);
        toast.info(`Loaded ${groupPermissionCodenames.length} permissions for ${selectedGroup.label}`);
      } catch (error) {
        console.error('Error loading group permissions:', error);
      }
    };

    loadGroupPermissions();
  }, [selectedGroup, allPermissions, permissionSections]);

  const tabs = [
    { name: "All Partners", path: "/partners" },
    { name: "Request", path: "/partners/request" },
    { name: "Group And Permissions", path: "/partners/role-permissions" },
    { name: "Discounts", path: "/partners/discounts" },
    { name: "Organizations", path: "/partners/organization" },
    { name: "Branches", path: "/partners/branche" },
    { name: "Agencies", path: "/partners/agencies" },
  ];

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

          .group-type-btn {
            padding: 12px 32px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            transition: all 0.3s ease;
            border: 2px solid transparent;
          }

          .group-type-btn:not(.active) {
            background: #f8f9fa;
            color: #6c757d;
            border-color: #dee2e6;
          }

          .group-type-btn:not(.active):hover {
            background: #e9ecef;
            border-color: #adb5bd;
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
          }

          .group-type-btn.active {
            transform: translateY(-2px);
            box-shadow: 0 6px 12px rgba(0,0,0,0.15);
          }

          .group-type-btn.admin.active {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-color: #667eea;
          }

          .group-type-btn.agent.active {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            color: white;
            border-color: #f093fb;
          }
        `}
      </style>
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
                    <nav className="nav flex-wrap gap-2">
                      {tabs.map((tab, idx) => (
                        <NavLink
                          key={idx}
                          to={tab.path}
                          className={`nav-link btn btn-link text-decoration-none px-0 me-3 border-0 ${tab.name === "Group And Permissions"
                            ? "text-primary fw-semibold"
                            : "text-muted"
                            }`}
                          style={{ backgroundColor: "transparent" }}
                        >
                          {tab.name}
                        </NavLink>
                      ))}
                    </nav>
                  </div>
                </div>
                <div className="p-3 my-3 bg-white shadow-sm rounded-3">
                  <div>
                    <div className="d-flex justify-content-between align-items-center py-3">
                      <h4 className="mb-0 fw-bold">Update Group Permissions</h4>
                      <div className="d-flex flex-wrap gap-2">
                        {/* Assign Button - For selected group */}
                        <button
                          className="btn btn-success"
                          onClick={handleAssignPermissions}
                          disabled={!selectedGroup || isUpdating}
                          title={selectedGroup ? `Assign permissions to ${selectedGroup.label}` : 'Select a group first'}
                        >
                          {isUpdating ? (
                            <>
                              <span
                                className="spinner-border spinner-border-sm me-2"
                                role="status"
                                aria-hidden="true"
                              ></span>
                              Assigning...
                            </>
                          ) : (
                            <>
                              <i className="fas fa-check me-2"></i>
                              Assign to Group
                            </>
                          )}
                        </button>

                        {/* Update Button - For group type */}
                        <button
                          className="btn btn-primary"
                          onClick={handleUpdatePermissions}
                          disabled={!selectedGroupType || isUpdating}
                        >
                          {isUpdating ? (
                            <>
                              <span
                                className="spinner-border spinner-border-sm me-2"
                                role="status"
                                aria-hidden="true"
                              ></span>
                              Updating...
                            </>
                          ) : (
                            "Update"
                          )}
                        </button>
                        <Link
                          to="/admin/partners/role-permissions"
                          className="btn btn-primary"
                        >
                          Groups
                        </Link>
                      </div>
                    </div>

                    {isLoading ? (
                      <ShimmerLoader />
                    ) : (
                      <div className="p-4">
                        {/* Group Type Selection Buttons */}
                        <div className="mb-4 text-center">
                          <div className="d-inline-flex gap-3 p-3 bg-light rounded-3">
                            <button
                              className={`group-type-btn admin ${selectedGroupType === 'admin' ? 'active' : ''}`}
                              onClick={() => setSelectedGroupType('admin')}
                            >
                              🔐 Admin
                            </button>
                            <button
                              className={`group-type-btn agent ${selectedGroupType === 'agent' ? 'active' : ''}`}
                              onClick={() => setSelectedGroupType('agent')}
                            >
                              👤 Agent
                            </button>
                          </div>
                        </div>

                        {/* Permission Statistics */}
                        <div className="row mb-4">
                          <div className="col-md-4">
                            <div className="card border-primary">
                              <div className="card-body text-center">
                                <h5 className="card-title">📋 Admin Permissions</h5>
                                <h2 className="text-primary">{permissionStats.admin}</h2>
                              </div>
                            </div>
                          </div>
                          <div className="col-md-4">
                            <div className="card border-info">
                              <div className="card-body text-center">
                                <h5 className="card-title">👤 Agent Permissions</h5>
                                <h2 className="text-info">{permissionStats.agent}</h2>
                              </div>
                            </div>
                          </div>
                          <div className="col-md-4">
                            <div className="card border-success">
                              <div className="card-body text-center">
                                <h5 className="card-title">📊 Total Permissions</h5>
                                <h2 className="text-success">{permissionStats.total}</h2>
                              </div>
                            </div>
                          </div>
                        </div>

                        {selectedGroupType && (
                          <>
                            <div className="mb-4 row">
                              {/* Groups Dropdown */}
                              <div className="col-md-6">
                                <fieldset className="border border-black w-100 p-2 rounded mb-3">
                                  <legend className="float-none w-auto px-1 fs-6">
                                    Select Group
                                  </legend>
                                  <Select
                                    value={selectedGroup}
                                    onChange={setSelectedGroup}
                                    options={groups.map(g => ({
                                      value: g.id,
                                      label: `${g.name} (${g.permissions?.length || 0} permissions)`
                                    }))}
                                    placeholder="Select a group..."
                                    isClearable
                                    className="border-0"
                                  />
                                </fieldset>
                              </div>
                              {/* Search Permissions */}
                              <div className="col-md-6">
                                <fieldset className="border border-black w-100 p-2 rounded mb-3">
                                  <legend className="float-none w-auto px-1 fs-6">
                                    Search Permissions
                                  </legend>
                                  <input
                                    type="text"
                                    className="form-control border-0 shadow-none"
                                    placeholder="Search by permission name or code..."
                                    value={permissionSearchTerm}
                                    onChange={(e) => setPermissionSearchTerm(e.target.value)}
                                  />
                                </fieldset>
                              </div>
                            </div>

                            {permissionSections.length > 0 ? (
                              <div className="accordion" id="permissionsAccordion">
                                {permissionSections.map((section) => {
                                  // Filter permissions based on search term AND group type
                                  const filteredPermissions = section.permissions.filter(perm => {
                                    const permName = permissionNameMap[perm] || perm;
                                    const searchLower = permissionSearchTerm.toLowerCase();
                                    const matchesSearch = permName.toLowerCase().includes(searchLower) ||
                                      perm.toLowerCase().includes(searchLower);

                                    // Filter based on selected group type
                                    if (selectedGroupType === 'admin') {
                                      // For admin, exclude agent-specific permissions
                                      // Agent permissions: end with _agent OR are agent_portal_access
                                      if (perm.endsWith('_agent') || perm === 'agent_portal_access') {
                                        return false;
                                      }
                                    } else if (selectedGroupType === 'agent') {
                                      // For agent, exclude admin-specific permissions
                                      // Admin permissions: end with _admin OR are admin_portal_access
                                      if (perm.endsWith('_admin') || perm === 'admin_portal_access') {
                                        return false;
                                      }
                                    }

                                    return matchesSearch;
                                  });

                                  // Skip sections with no matching permissions
                                  if (filteredPermissions.length === 0) return null;

                                  const categoryMeta = getCategoryMeta(section.id);
                                  const { selected, total } = getCategorySelectedCount(section);

                                  // HIDE categories where user has 0 permissions
                                  if (total === 0) return null;

                                  const isCollapsed = collapsedSections[section.id];
                                  const allSelected = selected === total && total > 0;

                                  return (
                                    <div key={section.id} className="card mb-3 border">
                                      {/* Category Header */}
                                      <div className="card-header bg-light p-3">
                                        <div className="d-flex justify-content-between align-items-center">
                                          <div className="d-flex align-items-center gap-3 flex-grow-1">
                                            {/* Collapse Toggle Button */}
                                            <button
                                              className="btn btn-sm btn-link text-decoration-none p-0"
                                              onClick={() => toggleSection(section.id)}
                                              style={{ fontSize: '1.2rem' }}
                                            >
                                              {isCollapsed ? '▶' : '▼'}
                                            </button>

                                            {/* Category Icon and Name */}
                                            <div className="d-flex align-items-center gap-2">
                                              <span style={{ fontSize: '1.5rem' }}>{categoryMeta.icon}</span>
                                              <h6 className="mb-0 fw-bold" style={{ color: categoryMeta.color }}>
                                                {categoryMeta.label}
                                              </h6>
                                            </div>

                                            {/* Permission Count Badge - Shows only user's permissions */}
                                            <span
                                              className={`badge ${selected === total && total > 0 ? 'bg-success' : 'bg-secondary'}`}
                                              style={{ fontSize: '0.85rem' }}
                                            >
                                              {total} {total === 1 ? 'permission' : 'permissions'}
                                            </span>
                                          </div>

                                          {/* Select All Checkbox */}
                                          <div className="form-check">
                                            <input
                                              type="checkbox"
                                              className="form-check-input border border-dark"
                                              id={`select-all-${section.id}`}
                                              checked={allSelected}
                                              onChange={(e) => handleCategorySelectAll(section.id, e.target.checked)}
                                              style={{ cursor: 'pointer' }}
                                            />
                                            <label
                                              className="form-check-label small text-muted"
                                              htmlFor={`select-all-${section.id}`}
                                              style={{ cursor: 'pointer' }}
                                            >
                                              Select All
                                            </label>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Category Body - Permissions Table */}
                                      {!isCollapsed && (
                                        <div className="card-body p-0">
                                          <div className="table-responsive">
                                            <table className="table table-hover table-sm mb-0 align-middle">
                                              <thead className="table-light">
                                                <tr>
                                                  <th style={{ width: "50px" }} className="text-center">
                                                    <input
                                                      type="checkbox"
                                                      className="form-check-input border border-dark"
                                                      checked={allSelected}
                                                      onChange={(e) => handleCategorySelectAll(section.id, e.target.checked)}
                                                      title="Select/Deselect All in Category"
                                                    />
                                                  </th>
                                                  <th>Permission Name</th>
                                                  <th>Code</th>
                                                </tr>
                                              </thead>
                                              <tbody>
                                                {/* Check if this is the Hotel category */}
                                                {section.id === 'Hotel' ? (
                                                  // Render hotel permissions with sub-groups
                                                  (() => {
                                                    const hotelGroups = organizeHotelPermissions(filteredPermissions);
                                                    const subGroupMeta = {
                                                      main: { label: 'Main Hotel Permissions', icon: '🏨' },
                                                      availability: { label: 'Hotel Availability', icon: '📅' },
                                                      outsourcing: { label: 'Hotel Outsourcing', icon: '🤝' },
                                                      floor_management: { label: 'Hotel Floor Management', icon: '🏢' }
                                                    };

                                                    return Object.entries(hotelGroups).map(([groupKey, groupPerms]) => {
                                                      if (groupPerms.length === 0) return null;

                                                      return (
                                                        <React.Fragment key={groupKey}>
                                                          {/* Sub-group Header Row */}
                                                          <tr className="table-secondary">
                                                            <td colSpan="3" className="fw-bold py-2">
                                                              <span className="me-2">{subGroupMeta[groupKey].icon}</span>
                                                              {subGroupMeta[groupKey].label}
                                                            </td>
                                                          </tr>
                                                          {/* Sub-group Permissions */}
                                                          {groupPerms.map((perm, permIndex) => (
                                                            <tr key={`${section.id}-${perm}-${permIndex}`}>
                                                              <td className="text-center">
                                                                <input
                                                                  className="form-check-input border border-dark"
                                                                  type="checkbox"
                                                                  checked={permissions?.[section.id]?.[perm] || false}
                                                                  onChange={() => handlePermissionChange(section.id, perm)}
                                                                  id={`${section.id}-${perm}-${permIndex}`}
                                                                />
                                                              </td>
                                                              <td>
                                                                <label
                                                                  className="mb-0 w-100"
                                                                  htmlFor={`${section.id}-${perm}-${permIndex}`}
                                                                  style={{ cursor: "pointer" }}
                                                                >
                                                                  {permissionNameMap[perm] || perm}
                                                                </label>
                                                              </td>
                                                              <td>
                                                                <code className="text-muted small">{perm}</code>
                                                              </td>
                                                            </tr>
                                                          ))}
                                                        </React.Fragment>
                                                      );
                                                    });
                                                  })()
                                                ) : section.id === 'Universal Registration' ? (
                                                  // Render Universal Registration permissions with sub-groups
                                                  (() => {
                                                    const urGroups = organizeUniversalRegistrationPermissions(filteredPermissions);
                                                    const subGroupMeta = {
                                                      organization: { label: 'Organization', icon: '🏢' },
                                                      branch: { label: 'Branch', icon: '🏪' },
                                                      agency: { label: 'Agency', icon: '🏛️' },
                                                      employee: { label: 'Employee', icon: '👤' }
                                                    };

                                                    return Object.entries(urGroups).map(([groupKey, groupPerms]) => {
                                                      if (groupPerms.length === 0) return null;

                                                      return (
                                                        <React.Fragment key={groupKey}>
                                                          {/* Sub-group Header Row */}
                                                          <tr className="table-secondary">
                                                            <td colSpan="3" className="fw-bold py-2">
                                                              <span className="me-2">{subGroupMeta[groupKey].icon}</span>
                                                              {subGroupMeta[groupKey].label}
                                                            </td>
                                                          </tr>
                                                          {/* Sub-group Permissions */}
                                                          {groupPerms.map((perm, permIndex) => (
                                                            <tr key={`${section.id}-${perm}-${permIndex}`}>
                                                              <td className="text-center">
                                                                <input
                                                                  className="form-check-input border border-dark"
                                                                  type="checkbox"
                                                                  checked={permissions?.[section.id]?.[perm] || false}
                                                                  onChange={() => handlePermissionChange(section.id, perm)}
                                                                  id={`${section.id}-${perm}-${permIndex}`}
                                                                />
                                                              </td>
                                                              <td>
                                                                <label
                                                                  className="mb-0 w-100"
                                                                  htmlFor={`${section.id}-${perm}-${permIndex}`}
                                                                  style={{ cursor: "pointer" }}
                                                                >
                                                                  {permissionNameMap[perm] || perm}
                                                                </label>
                                                              </td>
                                                              <td>
                                                                <code className="text-muted small">{perm}</code>
                                                              </td>
                                                            </tr>
                                                          ))}
                                                        </React.Fragment>
                                                      );
                                                    });
                                                  })()
                                                ) : section.id === 'Daily Operations' ? (
                                                  // Render Daily Operations permissions with sub-groups
                                                  (() => {
                                                    const doGroups = organizeDailyOperationsPermissions(filteredPermissions);
                                                    const subGroupMeta = {
                                                      hotel_checkin: { label: 'Hotel Check-in/Check-out', icon: '🏨' },
                                                      ziyarat_operations: { label: 'Ziyarat', icon: '🕌' },
                                                      transport_operations: { label: 'Transport', icon: '🚌' },
                                                      airport_operations: { label: 'Airport', icon: '✈️' },
                                                      food_operations: { label: 'Food', icon: '🍽️' },
                                                      pax_details: { label: 'Pax Details', icon: '👥' }
                                                    };

                                                    return Object.entries(doGroups).map(([groupKey, groupPerms]) => {
                                                      if (groupPerms.length === 0) return null;

                                                      return (
                                                        <React.Fragment key={groupKey}>
                                                          {/* Sub-group Header Row */}
                                                          <tr className="table-secondary">
                                                            <td colSpan="3" className="fw-bold py-2">
                                                              <span className="me-2">{subGroupMeta[groupKey].icon}</span>
                                                              {subGroupMeta[groupKey].label}
                                                            </td>
                                                          </tr>
                                                          {/* Sub-group Permissions */}
                                                          {groupPerms.map((perm, permIndex) => (
                                                            <tr key={`${section.id}-${perm}-${permIndex}`}>
                                                              <td className="text-center">
                                                                <input
                                                                  className="form-check-input border border-dark"
                                                                  type="checkbox"
                                                                  checked={permissions?.[section.id]?.[perm] || false}
                                                                  onChange={() => handlePermissionChange(section.id, perm)}
                                                                  id={`${section.id}-${perm}-${permIndex}`}
                                                                />
                                                              </td>
                                                              <td>
                                                                <label
                                                                  className="mb-0 w-100"
                                                                  htmlFor={`${section.id}-${perm}-${permIndex}`}
                                                                  style={{ cursor: "pointer" }}
                                                                >
                                                                  {permissionNameMap[perm] || perm}
                                                                </label>
                                                              </td>
                                                              <td>
                                                                <code className="text-muted small">{perm}</code>
                                                              </td>
                                                            </tr>
                                                          ))}
                                                        </React.Fragment>
                                                      );
                                                    });
                                                  })()
                                                ) : section.id === 'CRM' ? (
                                                  // Render CRM permissions with sub-groups
                                                  (() => {
                                                    const crmGroups = organizeCRMPermissions(filteredPermissions);
                                                    const subGroupMeta = {
                                                      leads: { label: 'Leads', icon: '📞' },
                                                      loan: { label: 'Loan', icon: '💰' },
                                                      tasks: { label: 'Tasks', icon: '✅' },
                                                      closed_leads: { label: 'Closed Leads', icon: '🔒' },
                                                      instant: { label: 'Instant', icon: '⚡' },
                                                      passport_leads: { label: 'Passport Leads', icon: '🛂' },
                                                      walking_customer: { label: 'Walking Customer', icon: '🚶' },
                                                      customer_database: { label: 'Customer Database', icon: '💾' }
                                                    };

                                                    return Object.entries(crmGroups).map(([groupKey, groupPerms]) => {
                                                      if (groupPerms.length === 0) return null;

                                                      return (
                                                        <React.Fragment key={groupKey}>
                                                          {/* Sub-group Header Row */}
                                                          <tr className="table-secondary">
                                                            <td colSpan="3" className="fw-bold py-2">
                                                              <span className="me-2">{subGroupMeta[groupKey].icon}</span>
                                                              {subGroupMeta[groupKey].label}
                                                            </td>
                                                          </tr>
                                                          {/* Sub-group Permissions */}
                                                          {groupPerms.map((perm, permIndex) => (
                                                            <tr key={`${section.id}-${perm}-${permIndex}`}>
                                                              <td className="text-center">
                                                                <input
                                                                  className="form-check-input border border-dark"
                                                                  type="checkbox"
                                                                  checked={permissions?.[section.id]?.[perm] || false}
                                                                  onChange={() => handlePermissionChange(section.id, perm)}
                                                                  id={`${section.id}-${perm}-${permIndex}`}
                                                                />
                                                              </td>
                                                              <td>
                                                                <label
                                                                  className="mb-0 w-100"
                                                                  htmlFor={`${section.id}-${perm}-${permIndex}`}
                                                                  style={{ cursor: "pointer" }}
                                                                >
                                                                  {permissionNameMap[perm] || perm}
                                                                </label>
                                                              </td>
                                                              <td>
                                                                <code className="text-muted small">{perm}</code>
                                                              </td>
                                                            </tr>
                                                          ))}
                                                        </React.Fragment>
                                                      );
                                                    });
                                                  })()
                                                ) : section.id === 'HR' ? (
                                                  // Render HR permissions with sub-groups
                                                  (() => {
                                                    const hrGroups = organizeHRPermissions(filteredPermissions);
                                                    const subGroupMeta = {
                                                      employees: { label: 'Employees', icon: '👥' },
                                                      attendance: { label: 'Attendance', icon: '📅' },
                                                      movements: { label: 'Movements', icon: '🚶' },
                                                      commission: { label: 'Commission', icon: '💰' },
                                                      punctuality: { label: 'Punctuality', icon: '⏰' },
                                                      approvals: { label: 'Approvals', icon: '✅' },
                                                      payments: { label: 'Payments', icon: '💵' }
                                                    };

                                                    return Object.entries(hrGroups).map(([groupKey, groupPerms]) => {
                                                      if (groupPerms.length === 0) return null;

                                                      return (
                                                        <React.Fragment key={groupKey}>
                                                          {/* Sub-group Header Row */}
                                                          <tr className="table-secondary">
                                                            <td colSpan="3" className="fw-bold py-2">
                                                              <span className="me-2">{subGroupMeta[groupKey].icon}</span>
                                                              {subGroupMeta[groupKey].label}
                                                            </td>
                                                          </tr>
                                                          {/* Sub-group Permissions */}
                                                          {groupPerms.map((perm, permIndex) => (
                                                            <tr key={`${section.id}-${perm}-${permIndex}`}>
                                                              <td className="text-center">
                                                                <input
                                                                  className="form-check-input border border-dark"
                                                                  type="checkbox"
                                                                  checked={permissions?.[section.id]?.[perm] || false}
                                                                  onChange={() => handlePermissionChange(section.id, perm)}
                                                                  id={`${section.id}-${perm}-${permIndex}`}
                                                                />
                                                              </td>
                                                              <td>
                                                                <label
                                                                  className="mb-0 w-100"
                                                                  htmlFor={`${section.id}-${perm}-${permIndex}`}
                                                                  style={{ cursor: "pointer" }}
                                                                >
                                                                  {permissionNameMap[perm] || perm}
                                                                </label>
                                                              </td>
                                                              <td>
                                                                <code className="text-muted small">{perm}</code>
                                                              </td>
                                                            </tr>
                                                          ))}
                                                        </React.Fragment>
                                                      );
                                                    });
                                                  })()
                                                ) : section.id === 'Payments' ? (
                                                  // Render Payments permissions with sub-groups
                                                  (() => {
                                                    const paymentsGroups = organizePaymentsPermissions(filteredPermissions);
                                                    const subGroupMeta = {
                                                      ledger: { label: 'Ledger', icon: '📒' },
                                                      payments: { label: 'Payments', icon: '💵' },
                                                      bank_account: { label: 'Bank Account', icon: '🏦' },
                                                      pending_payments: { label: 'Pending Payments', icon: '⏳' },
                                                      booking_history: { label: 'Booking History', icon: '📚' }
                                                    };

                                                    return Object.entries(paymentsGroups).map(([groupKey, groupPerms]) => {
                                                      if (groupPerms.length === 0) return null;

                                                      return (
                                                        <React.Fragment key={groupKey}>
                                                          {/* Sub-group Header Row */}
                                                          <tr className="table-secondary">
                                                            <td colSpan="3" className="fw-bold py-2">
                                                              <span className="me-2">{subGroupMeta[groupKey].icon}</span>
                                                              {subGroupMeta[groupKey].label}
                                                            </td>
                                                          </tr>
                                                          {/* Sub-group Permissions */}
                                                          {groupPerms.map((perm, permIndex) => (
                                                            <tr key={`${section.id}-${perm}-${permIndex}`}>
                                                              <td className="text-center">
                                                                <input
                                                                  className="form-check-input border border-dark"
                                                                  type="checkbox"
                                                                  checked={permissions?.[section.id]?.[perm] || false}
                                                                  onChange={() => handlePermissionChange(section.id, perm)}
                                                                  id={`${section.id}-${perm}-${permIndex}`}
                                                                />
                                                              </td>
                                                              <td>
                                                                <label
                                                                  className="mb-0 w-100"
                                                                  htmlFor={`${section.id}-${perm}-${permIndex}`}
                                                                  style={{ cursor: "pointer" }}
                                                                >
                                                                  {permissionNameMap[perm] || perm}
                                                                </label>
                                                              </td>
                                                              <td>
                                                                <code className="text-muted small">{perm}</code>
                                                              </td>
                                                            </tr>
                                                          ))}
                                                        </React.Fragment>
                                                      );
                                                    });
                                                  })()
                                                  /*
 * FINANCE RENDERING CODE TO BE INSERTED
 * Location: d:\Saerpk\admin\src\pages\admin\UpdatePermissions.jsx
 * Insert at: Line 1574 (between Payments and Pax Movement sections)
 * Insert BEFORE the line: ) : section.id === 'Pax Movement' ? (
 */

                                                ) : section.id === 'Finance' ? (
                                                  // Render Finance permissions with sub-groups
                                                  (() => {
                                                    const financeGroups = organizeFinancePermissions(filteredPermissions);
                                                    const subGroupMeta = {
                                                      recent_transactions: { label: 'Recent Transactions', icon: '📊' },
                                                      profit_loss_reports: { label: 'Profit & Loss Reports', icon: '📈' },
                                                      financial_ledger: { label: 'Financial Ledger', icon: '📒' },
                                                      expense_management: { label: 'Expense Management', icon: '💸' },
                                                      manual_posting: { label: 'Manual Posting', icon: '✍️' },
                                                      tax_reports_fbr: { label: 'Tax Reports (FBR)', icon: '🏛️' },
                                                      balance_sheet: { label: 'Balance Sheet', icon: '⚖️' },
                                                      audit_trail: { label: 'Audit Trail', icon: '🔍' }
                                                    };

                                                    return Object.entries(financeGroups).map(([groupKey, groupPerms]) => {
                                                      if (groupPerms.length === 0) return null;

                                                      return (
                                                        <React.Fragment key={groupKey}>
                                                          <tr className="table-secondary">
                                                            <td colSpan="3" className="fw-bold py-2">
                                                              <span className="me-2">{subGroupMeta[groupKey].icon}</span>
                                                              {subGroupMeta[groupKey].label}
                                                            </td>
                                                          </tr>
                                                          {groupPerms.map((perm, permIndex) => (
                                                            <tr key={`${section.id}-${perm}-${permIndex}`}>
                                                              <td className="text-center">
                                                                <input
                                                                  className="form-check-input border border-dark"
                                                                  type="checkbox"
                                                                  checked={permissions?.[section.id]?.[perm] || false}
                                                                  onChange={() => handlePermissionChange(section.id, perm)}
                                                                  id={`${section.id}-${perm}-${permIndex}`}
                                                                />
                                                              </td>
                                                              <td>
                                                                <label
                                                                  className="mb-0 w-100"
                                                                  htmlFor={`${section.id}-${perm}-${permIndex}`}
                                                                  style={{ cursor: "pointer" }}
                                                                >
                                                                  {permissionNameMap[perm] || perm}
                                                                </label>
                                                              </td>
                                                              <td>
                                                                <code className="text-muted small">{perm}</code>
                                                              </td>
                                                            </tr>
                                                          ))}
                                                        </React.Fragment>
                                                      );
                                                    });
                                                  })()

                                                ) : section.id === 'Pax Movement' ? (
                                                  // Render Pax Movement permissions with sub-groups
                                                  (() => {
                                                    const paxGroups = organizePaxMovementsPermissions(filteredPermissions);
                                                    const subGroupMeta = {
                                                      main: { label: 'Main Pax Movements', icon: '🚶' },
                                                      hotels: { label: 'Hotels', icon: '🏨' },
                                                      transport_ziyarat: { label: 'Transport & Ziyarat', icon: '🚌' },
                                                      flights: { label: 'Flights', icon: '✈️' },
                                                      all_passengers: { label: 'All Passengers', icon: '👥' }
                                                    };

                                                    return Object.entries(paxGroups).map(([groupKey, groupPerms]) => {
                                                      if (groupPerms.length === 0) return null;

                                                      return (
                                                        <React.Fragment key={groupKey}>
                                                          {/* Sub-group Header Row */}
                                                          <tr className="table-secondary">
                                                            <td colSpan="3" className="fw-bold py-2">
                                                              <span className="me-2">{subGroupMeta[groupKey].icon}</span>
                                                              {subGroupMeta[groupKey].label}
                                                            </td>
                                                          </tr>
                                                          {/* Sub-group Permissions */}
                                                          {groupPerms.map((perm, permIndex) => (
                                                            <tr key={`${section.id}-${perm}-${permIndex}`}>
                                                              <td className="text-center">
                                                                <input
                                                                  className="form-check-input border border-dark"
                                                                  type="checkbox"
                                                                  checked={permissions?.[section.id]?.[perm] || false}
                                                                  onChange={() => handlePermissionChange(section.id, perm)}
                                                                  id={`${section.id}-${perm}-${permIndex}`}
                                                                />
                                                              </td>
                                                              <td>
                                                                <label
                                                                  className="mb-0 w-100"
                                                                  htmlFor={`${section.id}-${perm}-${permIndex}`}
                                                                  style={{ cursor: "pointer" }}
                                                                >
                                                                  {permissionNameMap[perm] || perm}
                                                                </label>
                                                              </td>
                                                              <td>
                                                                <code className="text-muted small">{perm}</code>
                                                              </td>
                                                            </tr>
                                                          ))}
                                                        </React.Fragment>
                                                      );
                                                    });
                                                  })()
                                                ) : section.id === 'Partners' ? (
                                                  // Render Partners/Add Users permissions with sub-groups
                                                  (() => {
                                                    const partnersGroups = organizePartnersPermissions(filteredPermissions);
                                                    const subGroupMeta = {
                                                      main: { label: 'Add Users', icon: '👥' },
                                                      organization: { label: 'Organization', icon: '🏢' },
                                                      groups: { label: 'Groups', icon: '🔐' },
                                                      agency: { label: 'Agency', icon: '🏛️' },
                                                      branch_physical: { label: 'Branch', icon: '🏪' },
                                                      discount: { label: 'Discount', icon: '💰' },
                                                      org_links: { label: 'Org Links', icon: '🔗' },
                                                      markup_rules: { label: 'Markup Rules', icon: '📈' },
                                                      commission_rules: { label: 'Commission Rules', icon: '💼' },
                                                      super_admin: { label: 'Super Admin', icon: '👑' },
                                                      admin: { label: 'Admin', icon: '🔑' },
                                                      agent: { label: 'Agent', icon: '👤' },
                                                      area_agent: { label: 'Area Agent', icon: '📍' },
                                                      employee: { label: 'Employee', icon: '👨‍💼' },
                                                      branch: { label: 'Branch Users', icon: '👨‍👩‍👧‍👦' }
                                                    };

                                                    return Object.entries(partnersGroups).map(([groupKey, groupPerms]) => {
                                                      if (groupPerms.length === 0) return null;

                                                      return (
                                                        <React.Fragment key={groupKey}>
                                                          {/* Sub-group Header Row */}
                                                          <tr className="table-secondary">
                                                            <td colSpan="3" className="fw-bold py-2">
                                                              <span className="me-2">{subGroupMeta[groupKey].icon}</span>
                                                              {subGroupMeta[groupKey].label}
                                                            </td>
                                                          </tr>
                                                          {/* Sub-group Permissions */}
                                                          {groupPerms.map((perm, permIndex) => (
                                                            <tr key={`${section.id}-${perm}-${permIndex}`}>
                                                              <td className="text-center">
                                                                <input
                                                                  className="form-check-input border border-dark"
                                                                  type="checkbox"
                                                                  checked={permissions?.[section.id]?.[perm] || false}
                                                                  onChange={() => handlePermissionChange(section.id, perm)}
                                                                  id={`${section.id}-${perm}-${permIndex}`}
                                                                />
                                                              </td>
                                                              <td>
                                                                <label
                                                                  className="mb-0 w-100"
                                                                  htmlFor={`${section.id}-${perm}-${permIndex}`}
                                                                  style={{ cursor: "pointer" }}
                                                                >
                                                                  {permissionNameMap[perm] || perm}
                                                                </label>
                                                              </td>
                                                              <td>
                                                                <code className="text-muted small">{perm}</code>
                                                              </td>
                                                            </tr>
                                                          ))}
                                                        </React.Fragment>
                                                      );
                                                    });
                                                  })()
                                                ) : section.id === 'Visa and Other Permissions' ? (
                                                  // Render Visa and Other Permissions with sub-groups
                                                  (() => {
                                                    const visaOtherGroups = organizeVisaOtherPermissions(filteredPermissions);
                                                    const subGroupMeta = {
                                                      riyal_rate: { label: 'Riyal Rate', icon: '💱' },
                                                      shirka: { label: 'Shirka', icon: '🏢' },
                                                      sector: { label: 'Sector', icon: '📍' },
                                                      big_sector: { label: 'Big Sector', icon: '🏗️' },
                                                      visa_transport_rate: { label: 'Visa and Transport Rate', icon: '🛂' },
                                                      only_visa_rates: { label: 'Only Visa Rates', icon: '📋' },
                                                      transport_prices: { label: 'Transport Prices', icon: '🚌' },
                                                      food_prices: { label: 'Food Prices', icon: '🍽️' },
                                                      ziarat_prices: { label: 'Ziarat Prices', icon: '🕌' },
                                                      flight: { label: 'Flight', icon: '✈️' },
                                                      city: { label: 'City', icon: '🏙️' },
                                                      booking_settings: { label: 'Booking Settings', icon: '⏱️' }
                                                    };

                                                    return Object.entries(visaOtherGroups).map(([groupKey, groupPerms]) => {
                                                      if (groupPerms.length === 0) return null;

                                                      return (
                                                        <React.Fragment key={groupKey}>
                                                          {/* Sub-group Header Row */}
                                                          <tr className="table-secondary">
                                                            <td colSpan="3" className="fw-bold py-2">
                                                              <span className="me-2">{subGroupMeta[groupKey].icon}</span>
                                                              {subGroupMeta[groupKey].label}
                                                            </td>
                                                          </tr>
                                                          {/* Sub-group Permissions */}
                                                          {groupPerms.map((perm, permIndex) => (
                                                            <tr key={`${section.id}-${perm}-${permIndex}`}>
                                                              <td className="text-center">
                                                                <input
                                                                  className="form-check-input border border-dark"
                                                                  type="checkbox"
                                                                  checked={permissions?.[section.id]?.[perm] || false}
                                                                  onChange={() => handlePermissionChange(section.id, perm)}
                                                                  id={`${section.id}-${perm}-${permIndex}`}
                                                                />
                                                              </td>
                                                              <td>
                                                                <label
                                                                  className="mb-0 w-100"
                                                                  htmlFor={`${section.id}-${perm}-${permIndex}`}
                                                                  style={{ cursor: "pointer" }}
                                                                >
                                                                  {permissionNameMap[perm] || perm}
                                                                </label>
                                                              </td>
                                                              <td>
                                                                <code className="text-muted small">{perm}</code>
                                                              </td>
                                                            </tr>
                                                          ))}
                                                        </React.Fragment>
                                                      );
                                                    });
                                                  })()
                                                ) : (
                                                  // Render other categories normally
                                                  filteredPermissions.map((perm, permIndex) => (
                                                    <tr key={`${section.id}-${perm}-${permIndex}`}>
                                                      <td className="text-center">
                                                        <input
                                                          className="form-check-input border border-dark"
                                                          type="checkbox"
                                                          checked={permissions?.[section.id]?.[perm] || false}
                                                          onChange={() => handlePermissionChange(section.id, perm)}
                                                          id={`${section.id}-${perm}-${permIndex}`}
                                                        />
                                                      </td>
                                                      <td>
                                                        <label
                                                          className="mb-0 w-100"
                                                          htmlFor={`${section.id}-${perm}-${permIndex}`}
                                                          style={{ cursor: "pointer" }}
                                                        >
                                                          {permissionNameMap[perm] || perm}
                                                        </label>
                                                      </td>
                                                      <td>
                                                        <code className="text-muted small">{perm}</code>
                                                      </td>
                                                    </tr>
                                                  ))
                                                )}
                                              </tbody>
                                            </table>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}

                                {/* No Results Message */}
                                {permissionSections.every(section =>
                                  section.permissions.filter(perm => {
                                    const permName = permissionNameMap[perm] || perm;
                                    const searchLower = permissionSearchTerm.toLowerCase();
                                    return permName.toLowerCase().includes(searchLower) ||
                                      perm.toLowerCase().includes(searchLower);
                                  }).length === 0
                                ) && (
                                    <div className="text-center py-5">
                                      <p className="text-muted mb-0">
                                        <i className="bi bi-search me-2"></i>
                                        No permissions found matching "{permissionSearchTerm}"
                                      </p>
                                    </div>
                                  )}
                              </div>
                            ) : (
                              <div className="text-center py-4">
                                <p>No permissions found</p>
                              </div>
                            )}
                          </>
                        )}

                        {!selectedGroupType && (
                          <div className="text-center py-5">
                            <div className="mb-3">
                              <i className="bi bi-hand-index" style={{ fontSize: '3rem', color: '#6c757d' }}></i>
                            </div>
                            <h5 className="text-muted">Please select Admin or Agent to manage permissions</h5>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <AdminFooter />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default UpdateGroupPermissions;