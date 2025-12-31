import React, { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { Container, Row, Col, Card, Form, Button, Badge, Modal, Tab, Tabs, Alert, Spinner, Table } from "react-bootstrap";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import CRMTabs from "../../components/CRMTabs";
import axios from "axios";
import {
  FileText,
  UserCheck,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Phone,
  Mail,
  Calendar,
  Search,
  Filter,
  Plus,
  Edit2,
  Eye,
  Bell,
  RefreshCw,
  TrendingUp,
  Users,
  Download,
  MessageSquare,
  Trash2,
  Save,
  X,
} from "lucide-react";

const API_BASE_URL = "http://localhost:8000/api";

const PassportLeads = () => {
  // ==================== STATE MANAGEMENT ====================
  // Core Data
  const [leads, setLeads] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ show: false, type: "", message: "" });

  // User Context
  const [branchId, setBranchId] = useState(1); // Default to 1 if not found
  const [organizationId, setOrganizationId] = useState(1); // Default to 1 if not found
  const [userId, setUserId] = useState(null);
  const token = localStorage.getItem("accessToken");

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modals
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateCustomerData, setDuplicateCustomerData] = useState(null);
  const [showPaxFields, setShowPaxFields] = useState(false);

  // Selected Items
  const [selectedLead, setSelectedLead] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editingPassenger, setEditingPassenger] = useState(null);

  // Passengers array for multiple passengers
  const [passengers, setPassengers] = useState([]);

  // Form States
  const initialLeadForm = {
    customer_name: "",
    customer_phone: "",
    cnic: "",
    passport_number: "",
    city: "",
    remarks: "",
    lead_source: "walk-in",
    followup_status: "pending",
    next_followup_date: "",
    assigned_to: "",
    assigned_to_name: "",
    pending_balance: "0.00",
    // Passenger fields - all PaxProfile fields
    pax_first_name: "",
    pax_last_name: "",
    pax_nickname: "",
    pax_passport_number: "",
    pax_date_of_birth: "",
    pax_date_of_issue: "",
    pax_date_of_expiry: "",
    pax_issuing_country: "",
    pax_nationality: "",
    pax_address: "",
    pax_email: "",
    pax_phone: "",
    pax_whatsapp_number: "",
    pax_age: "",
    pax_gender: "",
    pax_notes: "",
  };

  const [leadForm, setLeadForm] = useState(initialLeadForm);

  // ==================== API CALLS ====================

  // Fetch User Details
  const fetchUserDetails = async () => {
    if (!token) {
      console.log("No token found");
      return;
    }
    console.log("Starting fetchUserDetails...");
    try {
      const decoded = jwtDecode(token);
      const uid = decoded.user_id;
      setUserId(uid);
      console.log("Fetching user details for user ID:", uid);

      const response = await axios.get(`${API_BASE_URL}/users/${uid}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const userData = response.data;
      console.log("User data received:", userData);

      if (userData.branch_details?.id) {
        console.log("Setting branch ID:", userData.branch_details.id);
        setBranchId(userData.branch_details.id);
      } else {
        console.log("No branch_details.id found in user data");
      }

      if (userData.organization_details?.id) {
        console.log("Setting organization ID:", userData.organization_details.id);
        setOrganizationId(userData.organization_details.id);
      } else {
        console.log("No organization_details.id found in user data");
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
      showAlert("danger", "Failed to fetch user details");
    }
  };

  // Fetch Users for Assignment
  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/users/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data.results || response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  // Fetch Leads
  const fetchLeads = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/passport-leads/`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { branch_id: branchId }
      });

      const leadsData = response.data.results || response.data;
      setLeads(Array.isArray(leadsData) ? leadsData : []);
    } catch (error) {
      console.error("Error fetching leads:", error);
      showAlert("danger", "Failed to fetch leads");
    } finally {
      setLoading(false);
    }
  };

  // Create Lead with customer validation
  const createLead = async () => {
    if (!leadForm.customer_name || !leadForm.customer_phone) {
      showAlert("danger", "Customer name and phone are required!");
      return;
    }

    setLoading(true);
    try {
      // Step 1: Validate customer data
      const validationResponse = await axios.post(
        `${API_BASE_URL}/passport-leads/validate-customer/`,
        {
          customer_phone: leadForm.customer_phone,
          passport_number: leadForm.passport_number,
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const { duplicate, customer_id, customer, duplicate_field } = validationResponse.data;

      // Step 2: If duplicate found, show custom modal
      if (duplicate) {
        setDuplicateCustomerData({
          customer_id,
          customer,
          duplicate_field,
        });
        setShowDuplicateModal(true);
        setLoading(false);
        return; // Wait for user action in modal
      }

      // Step 3: Proceed with lead creation (no duplicate)
      await proceedWithLeadCreation();
    } catch (error) {
      console.error("Error creating lead:", error);
      showAlert("danger", error.response?.data?.detail || "Failed to create lead");
    } finally {
      setLoading(false);
    }
  };

  // Function to proceed with lead creation
  const proceedWithLeadCreation = async () => {
    try {
      const assignedToId = users.find(u => u.username === leadForm.assigned_to)?.id || null;
      const assignedToName = leadForm.assigned_to || null;

      const paxDetails = passengers.map(pax => ({
        first_name: pax.pax_first_name,
        last_name: pax.pax_last_name || null,
        nickname: pax.pax_nickname || null,
        passport_number: pax.pax_passport_number,
        date_of_birth: pax.pax_date_of_birth || null,
        date_of_issue: pax.pax_date_of_issue || null,
        date_of_expiry: pax.pax_date_of_expiry || null,
        issuing_country: pax.pax_issuing_country || null,
        nationality: pax.pax_nationality || null,
        address: pax.pax_address || null,
        email: pax.pax_email || null,
        phone: pax.pax_phone || null,
        whatsapp_number: pax.pax_whatsapp_number || null,
        age: pax.pax_age || null,
        gender: pax.pax_gender || null,
        notes: pax.pax_notes || null,
      }));

      const payload = {
        branch_id: branchId,
        organization_id: organizationId,
        customer_name: leadForm.customer_name,
        customer_phone: leadForm.customer_phone,
        cnic: leadForm.cnic || null,
        passport_number: leadForm.passport_number || null,
        city: leadForm.city || null,
        remarks: leadForm.remarks || null,
        lead_source: leadForm.lead_source || "walk-in",
        followup_status: leadForm.followup_status || "pending",
        next_followup_date: leadForm.next_followup_date || null,
        assigned_to: assignedToId,
        assigned_to_name: assignedToName,
        pending_balance: leadForm.pending_balance || "0.00",
        pax_details: paxDetails,
      };

      console.log("Creating lead with payload:", payload);

      const response = await axios.post(`${API_BASE_URL}/passport-leads/`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const createdCustomerId = response.data.customer_id;
      showAlert("success", `Lead created successfully! Customer ID: ${createdCustomerId}`);
      setShowLeadModal(false);
      resetLeadForm();
      fetchLeads();
    } catch (error) {
      console.error("Error creating lead:", error);
      showAlert("danger", error.response?.data?.detail || "Failed to create lead");
    }
  };

  // Handle auto-fill from duplicate modal
  const handleAutoFill = () => {
    if (!duplicateCustomerData) return;

    const { customer, customer_id } = duplicateCustomerData;

    setLeadForm({
      ...leadForm,
      customer_name: customer.full_name || leadForm.customer_name,
      customer_phone: customer.phone || leadForm.customer_phone,
      passport_number: customer.passport_number || leadForm.passport_number,
      city: customer.city || leadForm.city,
    });

    setShowDuplicateModal(false);
    setDuplicateCustomerData(null);
    showAlert("info", `Customer data auto-filled! Customer ID: ${customer_id}. Please review and submit.`);
  };

  // Handle continue with existing customer
  const handleContinueWithExisting = async () => {
    setShowDuplicateModal(false);
    const customer_id = duplicateCustomerData?.customer_id;
    setDuplicateCustomerData(null);

    showAlert("info", `Creating lead with existing Customer ID: ${customer_id}`);
    await proceedWithLeadCreation();
  };

  // Customer lookup function
  const lookupCustomer = async (phone, email, passportNumber) => {
    try {
      const params = new URLSearchParams();
      if (phone) params.append('phone', phone);
      if (email) params.append('email', email);
      if (passportNumber) params.append('passport_number', passportNumber);

      const response = await axios.get(`${API_BASE_URL}/customers/lookup/?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      return response.data;
    } catch (error) {
      console.error("Error looking up customer:", error);
      return { found: false, customer: null };
    }
  };

  // Auto-fill customer data
  const handleCustomerLookup = async (field, value) => {
    if (!value) return;

    let lookupData = {};
    if (field === 'customer_phone') lookupData.phone = value;
    else if (field === 'passport_number') lookupData.passportNumber = value;

    const result = await lookupCustomer(lookupData.phone, null, lookupData.passportNumber);

    if (result.found) {
      const customer = result.customer;
      const shouldAutoFill = window.confirm(
        `Found existing customer: ${customer.full_name}\nPhone: ${customer.phone || 'N/A'}\nEmail: ${customer.email || 'N/A'}\n\nDo you want to auto-fill the form with this customer's data?`
      );

      if (shouldAutoFill) {
        setLeadForm({
          ...leadForm,
          customer_name: customer.full_name || leadForm.customer_name,
          customer_phone: customer.phone || leadForm.customer_phone,
          passport_number: customer.passport_number || leadForm.passport_number,
          city: customer.city || leadForm.city,
        });
        showAlert("info", "Customer data auto-filled!");
      }
    }
  };

  // Create or update customer record
  const createOrUpdateCustomer = async (leadData) => {
    try {
      const customerPayload = {
        full_name: leadData.customer_name,
        phone: leadData.customer_phone,
        email: null, // Add email field if available
        passport_number: leadData.passport_number,
        city: leadData.city,
        source: "Passport Lead",
        branch: branchId,
        organization: organizationId,
        service_type: "Passport",
        is_active: true,
      };

      // Check if customer exists
      const lookup = await lookupCustomer(leadData.customer_phone, null, leadData.passport_number);

      if (lookup.found) {
        // Update existing customer
        await axios.put(`${API_BASE_URL}/customers/${lookup.customer.id}/`, customerPayload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        return lookup.customer.id;
      } else {
        // Create new customer
        const response = await axios.post(`${API_BASE_URL}/customers/`, customerPayload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        return response.data.id;
      }
    } catch (error) {
      console.error("Error creating/updating customer:", error);
      return null;
    }
  };

  // Update Lead
  const updateLead = async () => {
    if (!selectedLead) return;
    setLoading(true);
    try {
      const payload = {
        branch_id: branchId,
        organization_id: organizationId,
        customer_name: leadForm.customer_name,
        customer_phone: leadForm.customer_phone,
        cnic: leadForm.cnic || null,
        passport_number: leadForm.passport_number || null,
        city: leadForm.city || null,
        remarks: leadForm.remarks || null,
        followup_status: leadForm.followup_status,
        next_followup_date: leadForm.next_followup_date || null,
        pending_balance: leadForm.pending_balance,
      };

      await axios.put(`${API_BASE_URL}/passport-leads/${selectedLead.id}/`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      showAlert("success", "Lead updated successfully!");
      setShowLeadModal(false);
      resetLeadForm();
      fetchLeads();
    } catch (error) {
      console.error("Error updating lead:", error);
      showAlert("danger", "Failed to update lead");
    } finally {
      setLoading(false);
    }
  };

  // Delete Lead
  const deleteLead = async (id) => {
    if (!window.confirm("Are you sure you want to delete this lead?")) return;

    try {
      await axios.delete(`${API_BASE_URL}/passport-leads/${id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showAlert("success", "Lead deleted successfully!");
      fetchLeads();
    } catch (error) {
      console.error("Error deleting lead:", error);
      showAlert("danger", "Failed to delete lead");
    }
  };

  // Add Passenger
  const addPassenger = () => {
    if (!paxForm.first_name || !paxForm.passport_number) {
      showAlert("danger", "First name and passport number are required!");
      return;
    }

    const newPax = { ...paxForm, id: Date.now() };
    setPassengers([...passengers, newPax]);
    resetPaxForm();
    setShowPaxModal(false);
    showAlert("success", "Passenger added!");
  };

  // Update Passenger
  const updatePassenger = () => {
    if (!paxForm.first_name || !paxForm.passport_number) {
      showAlert("danger", "First name and passport number are required!");
      return;
    }

    setPassengers(passengers.map(p =>
      p.id === selectedPax.id ? { ...paxForm, id: selectedPax.id } : p
    ));
    resetPaxForm();
    setShowPaxModal(false);
    showAlert("success", "Passenger updated!");
  };

  // Delete Passenger
  const deletePassenger = (id) => {
    if (!window.confirm("Remove this passenger?")) return;
    setPassengers(passengers.filter(p => p.id !== id));
    showAlert("success", "Passenger removed!");
  };

  // ==================== HELPER FUNCTIONS ====================

  const showAlert = (type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, type: "", message: "" }), 5000);
  };

  const resetLeadForm = () => {
    setLeadForm(initialLeadForm);
    setSelectedLead(null);
    setEditMode(false);
    setShowPaxFields(false);
    setPassengers([]);
  };

  const addPassengerToList = () => {
    if (!leadForm.pax_first_name || !leadForm.pax_passport_number) {
      showAlert("danger", "Passenger first name and passport number are required!");
      return;
    }

    if (editingPassenger) {
      // Update existing passenger
      setPassengers(passengers.map(p =>
        p.id === editingPassenger.id
          ? {
            ...editingPassenger,
            pax_first_name: leadForm.pax_first_name,
            pax_last_name: leadForm.pax_last_name,
            pax_nickname: leadForm.pax_nickname,
            pax_passport_number: leadForm.pax_passport_number,
            pax_date_of_birth: leadForm.pax_date_of_birth,
            pax_date_of_issue: leadForm.pax_date_of_issue,
            pax_date_of_expiry: leadForm.pax_date_of_expiry,
            pax_issuing_country: leadForm.pax_issuing_country,
            pax_nationality: leadForm.pax_nationality,
            pax_address: leadForm.pax_address,
            pax_email: leadForm.pax_email,
            pax_phone: leadForm.pax_phone,
            pax_whatsapp_number: leadForm.pax_whatsapp_number,
            pax_age: leadForm.pax_age,
            pax_gender: leadForm.pax_gender,
            pax_notes: leadForm.pax_notes,
          }
          : p
      ));
      setEditingPassenger(null);
      showAlert("success", "Passenger updated!");
    } else {
      // Add new passenger
      const newPassenger = {
        id: Date.now(),
        pax_first_name: leadForm.pax_first_name,
        pax_last_name: leadForm.pax_last_name,
        pax_nickname: leadForm.pax_nickname,
        pax_passport_number: leadForm.pax_passport_number,
        pax_date_of_birth: leadForm.pax_date_of_birth,
        pax_date_of_issue: leadForm.pax_date_of_issue,
        pax_date_of_expiry: leadForm.pax_date_of_expiry,
        pax_issuing_country: leadForm.pax_issuing_country,
        pax_nationality: leadForm.pax_nationality,
        pax_address: leadForm.pax_address,
        pax_email: leadForm.pax_email,
        pax_phone: leadForm.pax_phone,
        pax_whatsapp_number: leadForm.pax_whatsapp_number,
        pax_age: leadForm.pax_age,
        pax_gender: leadForm.pax_gender,
        pax_notes: leadForm.pax_notes,
      };

      setPassengers([...passengers, newPassenger]);
      showAlert("success", "Passenger added to list!");
    }

    // Reset only passenger fields
    setLeadForm({
      ...leadForm,
      pax_first_name: "",
      pax_last_name: "",
      pax_nickname: "",
      pax_passport_number: "",
      pax_date_of_birth: "",
      pax_date_of_issue: "",
      pax_date_of_expiry: "",
      pax_issuing_country: "",
      pax_nationality: "",
      pax_address: "",
      pax_email: "",
      pax_phone: "",
      pax_whatsapp_number: "",
      pax_age: "",
      pax_gender: "",
      pax_notes: "",
    });
  };

  const editPassenger = (passenger) => {
    setEditingPassenger(passenger);
    setShowPaxFields(true);
    setLeadForm({
      ...leadForm,
      pax_first_name: passenger.pax_first_name,
      pax_last_name: passenger.pax_last_name,
      pax_nickname: passenger.pax_nickname,
      pax_passport_number: passenger.pax_passport_number,
      pax_date_of_birth: passenger.pax_date_of_birth,
      pax_date_of_issue: passenger.pax_date_of_issue,
      pax_date_of_expiry: passenger.pax_date_of_expiry,
      pax_issuing_country: passenger.pax_issuing_country,
      pax_nationality: passenger.pax_nationality,
      pax_address: passenger.pax_address,
      pax_email: passenger.pax_email,
      pax_phone: passenger.pax_phone,
      pax_whatsapp_number: passenger.pax_whatsapp_number,
      pax_age: passenger.pax_age,
      pax_gender: passenger.pax_gender,
      pax_notes: passenger.pax_notes,
    });
  };

  const removePassenger = (id) => {
    setPassengers(passengers.filter(p => p.id !== id));
    if (editingPassenger?.id === id) {
      setEditingPassenger(null);
    }
    showAlert("success", "Passenger removed!");
  };

  const openLeadModal = (lead = null) => {
    if (lead) {
      setSelectedLead(lead);
      setLeadForm({
        customer_name: lead.customer_name || "",
        customer_phone: lead.customer_phone || "",
        cnic: lead.cnic || "",
        passport_number: lead.passport_number || "",
        city: lead.city || "",
        remarks: lead.remarks || "",
        lead_source: lead.lead_source || "walk-in",
        followup_status: lead.followup_status || "pending",
        next_followup_date: lead.next_followup_date || "",
        assigned_to: lead.assigned_to || "",
        assigned_to_name: lead.assigned_to_name || "",
        pending_balance: lead.pending_balance || "0.00",
        pax_first_name: "",
        pax_last_name: "",
        pax_passport_number: "",
        pax_date_of_birth: "",
        pax_nationality: "",
        pax_phone: "",
        pax_email: "",
      });
      setEditMode(true);
    } else {
      resetLeadForm();
    }
    setShowLeadModal(true);
  };

  const getStatusBadge = (status) => {
    const config = {
      pending: { bg: "warning", text: "Pending", icon: Clock },
      completed: { bg: "success", text: "Completed", icon: CheckCircle },
      converted: { bg: "primary", text: "Converted", icon: UserCheck },
    };
    const { bg, text, icon: Icon } = config[status] || config.pending;
    return (
      <Badge bg={bg} className="d-flex align-items-center gap-1">
        <Icon size={14} />
        {text}
      </Badge>
    );
  };

  // ==================== EFFECTS ====================

  useEffect(() => {
    fetchUserDetails();
    fetchUsers();
  }, []);

  useEffect(() => {
    console.log("Branch ID changed:", branchId, "Org ID:", organizationId);
    // Fetch leads regardless of branch_id to see what we get
    fetchLeads();
  }, [branchId, organizationId]);

  // ==================== FILTERED DATA ====================

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = searchTerm === "" ||
      lead.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.customer_phone?.includes(searchTerm) ||
      lead.passport_number?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || lead.followup_status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: leads.length,
    pending: leads.filter(l => l.followup_status === "pending").length,
    completed: leads.filter(l => l.followup_status === "completed").length,
    converted: leads.filter(l => l.followup_status === "converted").length,
  };

  // ==================== RENDER ====================

  return (
    <>
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar />
        <div style={{ flex: 1, overflow: "auto" }}>
          <Header />
          <Container fluid className="p-4">
            {/* Alert */}
            {alert.show && (
              <Alert variant={alert.type} onClose={() => setAlert({ show: false })} dismissible className="mb-3">
                {alert.message}
              </Alert>
            )}

            <CRMTabs activeName="Passport Leads" />

            {/* Header */}
            <Row className="mb-4">
              <Col>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h2 className="mb-1 fw-bold">
                      <FileText size={32} className="me-2" />
                      Passport Leads
                    </h2>
                    <p className="text-muted">Manage passport applications and follow-ups</p>
                  </div>
                  <Button variant="primary" onClick={() => openLeadModal()}>
                    <Plus size={18} className="me-2" />
                    Add New Lead
                  </Button>
                </div>
              </Col>
            </Row>

            {/* Statistics */}
            <Row className="mb-4">
              <Col md={3}>
                <Card className="shadow-sm border-0" style={{ backgroundColor: "#e3f2fd" }}>
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <p className="text-muted mb-1">Total Leads</p>
                        <h3 className="mb-0 fw-bold">{stats.total}</h3>
                      </div>
                      <div className="rounded-circle d-flex align-items-center justify-content-center"
                        style={{ width: "50px", height: "50px", backgroundColor: "#2196f3" }}>
                        <FileText size={24} className="text-white" />
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="shadow-sm border-0" style={{ backgroundColor: "#fff3e0" }}>
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <p className="text-muted mb-1">Pending</p>
                        <h3 className="mb-0 fw-bold">{stats.pending}</h3>
                      </div>
                      <div className="rounded-circle d-flex align-items-center justify-content-center"
                        style={{ width: "50px", height: "50px", backgroundColor: "#ff9800" }}>
                        <Clock size={24} className="text-white" />
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="shadow-sm border-0" style={{ backgroundColor: "#e8f5e9" }}>
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <p className="text-muted mb-1">Completed</p>
                        <h3 className="mb-0 fw-bold">{stats.completed}</h3>
                      </div>
                      <div className="rounded-circle d-flex align-items-center justify-content-center"
                        style={{ width: "50px", height: "50px", backgroundColor: "#4caf50" }}>
                        <CheckCircle size={24} className="text-white" />
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="shadow-sm border-0" style={{ backgroundColor: "#e1f5fe" }}>
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <p className="text-muted mb-1">Converted</p>
                        <h3 className="mb-0 fw-bold">{stats.converted}</h3>
                      </div>
                      <div className="rounded-circle d-flex align-items-center justify-content-center"
                        style={{ width: "50px", height: "50px", backgroundColor: "#03a9f4" }}>
                        <UserCheck size={24} className="text-white" />
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* Filters */}
            <Card className="mb-4 shadow-sm border-0">
              <Card.Body>
                <Row className="g-3">
                  <Col md={6}>
                    <div className="position-relative">
                      <Search className="position-absolute" style={{ top: "12px", left: "12px" }} size={18} />
                      <Form.Control
                        type="text"
                        placeholder="Search by name, phone, passport..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ paddingLeft: "40px" }}
                      />
                    </div>
                  </Col>
                  <Col md={3}>
                    <Form.Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="completed">Completed</option>
                      <option value="converted">Converted</option>
                    </Form.Select>
                  </Col>
                  <Col md={3}>
                    <Button variant="outline-secondary" className="w-100" onClick={() => {
                      setSearchTerm("");
                      setStatusFilter("all");
                    }}>
                      Clear Filters
                    </Button>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Leads Table */}
            <Card className="shadow-sm border-0">
              <Card.Body>
                {loading ? (
                  <div className="text-center py-5">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-3">Loading leads...</p>
                  </div>
                ) : filteredLeads.length === 0 ? (
                  <div className="text-center py-5">
                    <AlertCircle size={48} className="text-muted mb-3" />
                    <h5 className="text-muted">No leads found</h5>
                    <p className="text-muted">Try adjusting your filters or add a new lead</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <Table hover>
                      <thead style={{ backgroundColor: "#f8f9fa" }}>
                        <tr>
                          <th>#</th>
                          <th>Customer ID</th>
                          <th>Customer</th>
                          <th>Phone</th>
                          <th>Passport</th>
                          <th>City</th>
                          <th>Status</th>
                          <th>Next Follow-up</th>
                          <th>Balance</th>
                          <th>Pax Count</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredLeads.map((lead, idx) => (
                          <tr key={lead.id}>
                            <td>{idx + 1}</td>
                            <td>
                              <Badge bg="info">{lead.customer_id || 'N/A'}</Badge>
                            </td>
                            <td className="fw-semibold">{lead.customer_name}</td>
                            <td>
                              <Phone size={14} className="me-1 text-muted" />
                              {lead.customer_phone}
                            </td>
                            <td>{lead.passport_number || "-"}</td>
                            <td>{lead.city || "-"}</td>
                            <td>{getStatusBadge(lead.followup_status)}</td>
                            <td>
                              {lead.next_followup_date ? (
                                <>
                                  <Calendar size={14} className="me-1 text-muted" />
                                  {lead.next_followup_date}
                                </>
                              ) : "-"}
                            </td>
                            <td className="fw-bold">{lead.pending_balance}</td>
                            <td>
                              <span className="badge bg-secondary">
                                {lead.pax_details?.length || lead.pax?.length || 0} PAX
                              </span>
                            </td>
                            <td>
                              <div className="d-flex gap-1">
                                <Button
                                  size="sm"
                                  variant="outline-primary"
                                  onClick={() => openLeadModal(lead)}
                                  title="Edit"
                                >
                                  <Edit2 size={14} />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline-info"
                                  onClick={async () => {
                                    try {
                                      const response = await axios.get(`${API_BASE_URL}/passport-leads/${lead.id}/`, {
                                        headers: { Authorization: `Bearer ${token}` }
                                      });
                                      setSelectedLead(response.data);
                                      setShowViewModal(true);
                                    } catch (error) {
                                      console.error("Error fetching lead details:", error);
                                      showAlert("danger", "Failed to fetch lead details");
                                    }
                                  }}
                                  title="View Details"
                                >
                                  <Eye size={14} />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline-success"
                                  onClick={() => {
                                    setSelectedLead(lead);
                                    showAlert("info", "Follow-up feature - coming soon!");
                                  }}
                                  title="Add Follow-up"
                                >
                                  <Bell size={14} />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline-danger"
                                  onClick={() => deleteLead(lead.id)}
                                  title="Delete"
                                >
                                  <Trash2 size={14} />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Container>
        </div>
      </div>

      {/* Lead Modal */}
      <Modal show={showLeadModal} onHide={() => setShowLeadModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{editMode ? "Edit Lead" : "Add New Lead"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6} className="mb-3">
                <Form.Label>Customer Name *</Form.Label>
                <Form.Control
                  type="text"
                  value={leadForm.customer_name}
                  onChange={(e) => setLeadForm({ ...leadForm, customer_name: e.target.value })}
                  required
                />
              </Col>
              <Col md={6} className="mb-3">
                <Form.Label>Phone *</Form.Label>
                <Form.Control
                  type="text"
                  value={leadForm.customer_phone}
                  onChange={(e) => setLeadForm({ ...leadForm, customer_phone: e.target.value })}
                  required
                />
              </Col>
              <Col md={6} className="mb-3">
                <Form.Label>CNIC</Form.Label>
                <Form.Control
                  type="text"
                  value={leadForm.cnic}
                  onChange={(e) => setLeadForm({ ...leadForm, cnic: e.target.value })}
                />
              </Col>
              <Col md={6} className="mb-3">
                <Form.Label>Passport Number</Form.Label>
                <Form.Control
                  type="text"
                  value={leadForm.passport_number}
                  onChange={(e) => setLeadForm({ ...leadForm, passport_number: e.target.value })}
                />
              </Col>
              <Col md={6} className="mb-3">
                <Form.Label>City</Form.Label>
                <Form.Control
                  type="text"
                  value={leadForm.city}
                  onChange={(e) => setLeadForm({ ...leadForm, city: e.target.value })}
                />
              </Col>
              <Col md={6} className="mb-3">
                <Form.Label>Lead Source</Form.Label>
                <Form.Select
                  value={leadForm.lead_source}
                  onChange={(e) => setLeadForm({ ...leadForm, lead_source: e.target.value })}
                >
                  <option value="walk-in">Walk-in</option>
                  <option value="phone">Phone</option>
                  <option value="email">Email</option>
                  <option value="referral">Referral</option>
                  <option value="website">Website</option>
                </Form.Select>
              </Col>
              <Col md={6} className="mb-3">
                <Form.Label>Follow-up Status</Form.Label>
                <Form.Select
                  value={leadForm.followup_status}
                  onChange={(e) => setLeadForm({ ...leadForm, followup_status: e.target.value })}
                >
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="converted">Converted</option>
                </Form.Select>
              </Col>
              <Col md={6} className="mb-3">
                <Form.Label>Next Follow-up Date</Form.Label>
                <Form.Control
                  type="date"
                  value={leadForm.next_followup_date}
                  onChange={(e) => setLeadForm({ ...leadForm, next_followup_date: e.target.value })}
                />
              </Col>
              {!editMode && (
                <Col md={6} className="mb-3">
                  <Form.Label>Assigned To</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Type name or select user"
                    value={leadForm.assigned_to}
                    onChange={(e) => setLeadForm({ ...leadForm, assigned_to: e.target.value })}
                  />
                </Col>
              )}
              <Col md={6} className="mb-3">
                <Form.Label>Pending Balance</Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  value={leadForm.pending_balance}
                  onChange={(e) => setLeadForm({ ...leadForm, pending_balance: e.target.value })}
                />
              </Col>
              <Col md={6} className="mb-3">
                <Form.Label>Assigned To</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Assigned to name"
                  value={leadForm.assigned_to_name}
                  onChange={(e) => setLeadForm({ ...leadForm, assigned_to_name: e.target.value })}
                />
              </Col>
              <Col md={12} className="mb-3">
                <Form.Label>Remarks</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={leadForm.remarks}
                  onChange={(e) => setLeadForm({ ...leadForm, remarks: e.target.value })}
                />
              </Col>
            </Row>

            {!editMode && (
              <>
                <hr className="my-4" />
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="mb-0">Passenger Details (Optional)</h6>
                  <Button
                    size="sm"
                    variant={showPaxFields ? "outline-secondary" : "outline-primary"}
                    onClick={() => setShowPaxFields(!showPaxFields)}
                  >
                    {showPaxFields ? <X size={16} className="me-1" /> : <Plus size={16} className="me-1" />}
                    {showPaxFields ? "Hide Passenger" : "Add Passenger"}
                  </Button>
                </div>

                {showPaxFields && (
                  <Row>
                    <Col md={6} className="mb-3">
                      <Form.Label>First Name *</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="First name"
                        value={leadForm.pax_first_name}
                        onChange={(e) => setLeadForm({ ...leadForm, pax_first_name: e.target.value })}
                      />
                    </Col>
                    <Col md={6} className="mb-3">
                      <Form.Label>Last Name</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Last name"
                        value={leadForm.pax_last_name}
                        onChange={(e) => setLeadForm({ ...leadForm, pax_last_name: e.target.value })}
                      />
                    </Col>
                    <Col md={6} className="mb-3">
                      <Form.Label>Nickname</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Nickname"
                        value={leadForm.pax_nickname}
                        onChange={(e) => setLeadForm({ ...leadForm, pax_nickname: e.target.value })}
                      />
                    </Col>
                    <Col md={6} className="mb-3">
                      <Form.Label>Passport Number *</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Passport number"
                        value={leadForm.pax_passport_number}
                        onChange={(e) => setLeadForm({ ...leadForm, pax_passport_number: e.target.value })}
                      />
                    </Col>
                    <Col md={6} className="mb-3">
                      <Form.Label>Date of Birth</Form.Label>
                      <Form.Control
                        type="date"
                        value={leadForm.pax_date_of_birth}
                        onChange={(e) => setLeadForm({ ...leadForm, pax_date_of_birth: e.target.value })}
                      />
                    </Col>
                    <Col md={6} className="mb-3">
                      <Form.Label>Age</Form.Label>
                      <Form.Control
                        type="number"
                        placeholder="Age"
                        value={leadForm.pax_age}
                        onChange={(e) => setLeadForm({ ...leadForm, pax_age: e.target.value })}
                      />
                    </Col>
                    <Col md={6} className="mb-3">
                      <Form.Label>Gender</Form.Label>
                      <Form.Select
                        value={leadForm.pax_gender}
                        onChange={(e) => setLeadForm({ ...leadForm, pax_gender: e.target.value })}
                      >
                        <option value="">Select</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </Form.Select>
                    </Col>
                    <Col md={6} className="mb-3">
                      <Form.Label>Date of Issue</Form.Label>
                      <Form.Control
                        type="date"
                        value={leadForm.pax_date_of_issue}
                        onChange={(e) => setLeadForm({ ...leadForm, pax_date_of_issue: e.target.value })}
                      />
                    </Col>
                    <Col md={6} className="mb-3">
                      <Form.Label>Date of Expiry</Form.Label>
                      <Form.Control
                        type="date"
                        value={leadForm.pax_date_of_expiry}
                        onChange={(e) => setLeadForm({ ...leadForm, pax_date_of_expiry: e.target.value })}
                      />
                    </Col>
                    <Col md={6} className="mb-3">
                      <Form.Label>Issuing Country</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Issuing country"
                        value={leadForm.pax_issuing_country}
                        onChange={(e) => setLeadForm({ ...leadForm, pax_issuing_country: e.target.value })}
                      />
                    </Col>
                    <Col md={6} className="mb-3">
                      <Form.Label>Nationality</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Nationality"
                        value={leadForm.pax_nationality}
                        onChange={(e) => setLeadForm({ ...leadForm, pax_nationality: e.target.value })}
                      />
                    </Col>
                    <Col md={6} className="mb-3">
                      <Form.Label>Phone</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Phone number"
                        value={leadForm.pax_phone}
                        onChange={(e) => setLeadForm({ ...leadForm, pax_phone: e.target.value })}
                      />
                    </Col>
                    <Col md={6} className="mb-3">
                      <Form.Label>WhatsApp</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="WhatsApp number"
                        value={leadForm.pax_whatsapp_number}
                        onChange={(e) => setLeadForm({ ...leadForm, pax_whatsapp_number: e.target.value })}
                      />
                    </Col>
                    <Col md={6} className="mb-3">
                      <Form.Label>Email</Form.Label>
                      <Form.Control
                        type="email"
                        placeholder="Email address"
                        value={leadForm.pax_email}
                        onChange={(e) => setLeadForm({ ...leadForm, pax_email: e.target.value })}
                      />
                    </Col>
                    <Col md={12} className="mb-3">
                      <Form.Label>Address</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={2}
                        placeholder="Full address"
                        value={leadForm.pax_address}
                        onChange={(e) => setLeadForm({ ...leadForm, pax_address: e.target.value })}
                      />
                    </Col>
                    <Col md={12} className="mb-3">
                      <Form.Label>Notes</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={2}
                        placeholder="Additional notes"
                        value={leadForm.pax_notes}
                        onChange={(e) => setLeadForm({ ...leadForm, pax_notes: e.target.value })}
                      />
                    </Col>
                  </Row>
                )}

                {passengers.length > 0 && (
                  <div className="mt-3">
                    <h6 className="mb-2">Added Passengers ({passengers.length})</h6>
                    <Table size="sm" bordered>
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Passport</th>
                          <th>DOB</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {passengers.map(pax => (
                          <tr key={pax.id} className={editingPassenger?.id === pax.id ? "table-active" : ""}>
                            <td>{pax.pax_first_name} {pax.pax_last_name}</td>
                            <td>{pax.pax_passport_number}</td>
                            <td>{pax.pax_date_of_birth || "-"}</td>
                            <td>
                              <Button
                                size="sm"
                                variant="outline-info"
                                className="me-1"
                                onClick={() => editPassenger(pax)}
                              >
                                <Edit2 size={14} />
                              </Button>
                              <Button size="sm" variant="outline-danger" onClick={() => removePassenger(pax.id)}>
                                <Trash2 size={14} />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}

                {showPaxFields && (
                  <div className="mt-3">
                    <Button
                      size="sm"
                      variant="success"
                      onClick={addPassengerToList}
                      className="me-2"
                    >
                      <Save size={16} className="me-1" />
                      {editingPassenger ? "Update Passenger" : "Save Passenger to List"}
                    </Button>
                    {editingPassenger && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setEditingPassenger(null);
                          setLeadForm({
                            ...leadForm,
                            pax_first_name: "",
                            pax_last_name: "",
                            pax_nickname: "",
                            pax_passport_number: "",
                            pax_date_of_birth: "",
                            pax_date_of_issue: "",
                            pax_date_of_expiry: "",
                            pax_issuing_country: "",
                            pax_nationality: "",
                            pax_address: "",
                            pax_email: "",
                            pax_phone: "",
                            pax_whatsapp_number: "",
                            pax_age: "",
                            pax_gender: "",
                            pax_notes: "",
                          });
                        }}
                      >
                        <X size={16} className="me-1" />
                        Cancel Edit
                      </Button>
                    )}
                  </div>
                )}
              </>
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowLeadModal(false)}>
            <X size={18} className="me-2" />
            Cancel
          </Button>
          <Button variant="primary" onClick={editMode ? updateLead : createLead} disabled={loading}>
            <Save size={18} className="me-2" />
            {editMode ? "Update Lead" : "Create Lead"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* View/Edit Lead Details Modal */}
      <Modal show={showViewModal} onHide={() => setShowViewModal(false)} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>Lead Details - {selectedLead?.customer_name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedLead && (
            <Tabs defaultActiveKey="details" className="mb-3">
              <Tab eventKey="details" title="Lead Information">
                <Row>
                  <Col md={6} className="mb-3">
                    <Form.Label>Customer Name *</Form.Label>
                    <Form.Control
                      type="text"
                      value={selectedLead.customer_name || ""}
                      onChange={(e) => setSelectedLead({ ...selectedLead, customer_name: e.target.value })}
                    />
                  </Col>
                  <Col md={6} className="mb-3">
                    <Form.Label>Phone *</Form.Label>
                    <Form.Control
                      type="text"
                      value={selectedLead.customer_phone || ""}
                      onChange={(e) => setSelectedLead({ ...selectedLead, customer_phone: e.target.value })}
                    />
                  </Col>
                  <Col md={6} className="mb-3">
                    <Form.Label>CNIC</Form.Label>
                    <Form.Control
                      type="text"
                      value={selectedLead.cnic || ""}
                      onChange={(e) => setSelectedLead({ ...selectedLead, cnic: e.target.value })}
                    />
                  </Col>
                  <Col md={6} className="mb-3">
                    <Form.Label>Passport Number</Form.Label>
                    <Form.Control
                      type="text"
                      value={selectedLead.passport_number || ""}
                      onChange={(e) => setSelectedLead({ ...selectedLead, passport_number: e.target.value })}
                    />
                  </Col>
                  <Col md={6} className="mb-3">
                    <Form.Label>City</Form.Label>
                    <Form.Control
                      type="text"
                      value={selectedLead.city || ""}
                      onChange={(e) => setSelectedLead({ ...selectedLead, city: e.target.value })}
                    />
                  </Col>
                  <Col md={6} className="mb-3">
                    <Form.Label>Lead Source</Form.Label>
                    <Form.Select
                      value={selectedLead.lead_source || "walk-in"}
                      onChange={(e) => setSelectedLead({ ...selectedLead, lead_source: e.target.value })}
                    >
                      <option value="walk-in">Walk-in</option>
                      <option value="phone">Phone</option>
                      <option value="email">Email</option>
                      <option value="referral">Referral</option>
                      <option value="website">Website</option>
                    </Form.Select>
                  </Col>
                  <Col md={6} className="mb-3">
                    <Form.Label>Pending Balance</Form.Label>
                    <Form.Control
                      type="number"
                      step="0.01"
                      value={selectedLead.pending_balance || "0.00"}
                      onChange={(e) => setSelectedLead({ ...selectedLead, pending_balance: e.target.value })}
                    />
                  </Col>
                  <Col md={6} className="mb-3">
                    <Form.Label>Assigned To</Form.Label>
                    <Form.Control
                      type="text"
                      value={selectedLead.assigned_to_name || selectedLead.assigned_to || ""}
                      onChange={(e) => setSelectedLead({ ...selectedLead, assigned_to_name: e.target.value })}
                    />
                  </Col>
                  <Col md={12} className="mb-3">
                    <Form.Label>Remarks</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={selectedLead.remarks || ""}
                      onChange={(e) => setSelectedLead({ ...selectedLead, remarks: e.target.value })}
                    />
                  </Col>
                </Row>
              </Tab>

              <Tab eventKey="followup" title="Follow-up">
                <Row>
                  <Col md={6} className="mb-3">
                    <Form.Label>Follow-up Status</Form.Label>
                    <Form.Select
                      value={selectedLead.followup_status || "pending"}
                      onChange={(e) => setSelectedLead({ ...selectedLead, followup_status: e.target.value })}
                    >
                      <option value="pending">Pending</option>
                      <option value="completed">Completed</option>
                      <option value="converted">Converted</option>
                      <option value="cancelled">Cancelled</option>
                    </Form.Select>
                  </Col>
                  <Col md={6} className="mb-3">
                    <Form.Label>Next Follow-up Date</Form.Label>
                    <Form.Control
                      type="date"
                      value={selectedLead.next_followup_date || ""}
                      onChange={(e) => setSelectedLead({ ...selectedLead, next_followup_date: e.target.value })}
                    />
                  </Col>
                  <Col md={12} className="mb-3">
                    <Form.Label>Follow-up Notes</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={4}
                      placeholder="Add follow-up notes here..."
                      value={selectedLead.followup_notes || ""}
                      onChange={(e) => setSelectedLead({ ...selectedLead, followup_notes: e.target.value })}
                    />
                  </Col>
                </Row>
              </Tab>

              <Tab eventKey="passengers" title={`Passengers (${selectedLead.pax_details?.length || selectedLead.pax?.length || 0})`}>
                <div className="mb-3">
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => {
                      setLeadForm({
                        ...leadForm,
                        pax_first_name: "",
                        pax_last_name: "",
                        pax_nickname: "",
                        pax_passport_number: "",
                        pax_date_of_birth: "",
                        pax_date_of_issue: "",
                        pax_date_of_expiry: "",
                        pax_issuing_country: "",
                        pax_nationality: "",
                        pax_address: "",
                        pax_email: "",
                        pax_phone: "",
                        pax_whatsapp_number: "",
                        pax_age: "",
                        pax_gender: "",
                        pax_notes: "",
                      });
                      setEditingPassenger(null);
                      setShowPaxFields(true);
                    }}
                  >
                    <Plus size={16} className="me-1" />
                    Add New Passenger
                  </Button>
                </div>

                {showPaxFields && (
                  <Card className="mb-3 border-primary">
                    <Card.Header className="bg-primary text-white">
                      {editingPassenger ? "Edit Passenger" : "Add New Passenger"}
                    </Card.Header>
                    <Card.Body>
                      <Row>
                        <Col md={6} className="mb-3">
                          <Form.Label>First Name *</Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="First name"
                            value={leadForm.pax_first_name}
                            onChange={(e) => setLeadForm({ ...leadForm, pax_first_name: e.target.value })}
                          />
                        </Col>
                        <Col md={6} className="mb-3">
                          <Form.Label>Last Name</Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="Last name"
                            value={leadForm.pax_last_name}
                            onChange={(e) => setLeadForm({ ...leadForm, pax_last_name: e.target.value })}
                          />
                        </Col>
                        <Col md={4} className="mb-3">
                          <Form.Label>Nickname</Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="Nickname"
                            value={leadForm.pax_nickname}
                            onChange={(e) => setLeadForm({ ...leadForm, pax_nickname: e.target.value })}
                          />
                        </Col>
                        <Col md={6} className="mb-3">
                          <Form.Label>Passport Number *</Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="Passport number"
                            value={leadForm.pax_passport_number}
                            onChange={(e) => setLeadForm({ ...leadForm, pax_passport_number: e.target.value })}
                          />
                        </Col>
                        <Col md={6} className="mb-3">
                          <Form.Label>Issuing Country</Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="Issuing country"
                            value={leadForm.pax_issuing_country}
                            onChange={(e) => setLeadForm({ ...leadForm, pax_issuing_country: e.target.value })}
                          />
                        </Col>
                        <Col md={4} className="mb-3">
                          <Form.Label>Date of Birth</Form.Label>
                          <Form.Control
                            type="date"
                            value={leadForm.pax_date_of_birth}
                            onChange={(e) => setLeadForm({ ...leadForm, pax_date_of_birth: e.target.value })}
                          />
                        </Col>
                        <Col md={4} className="mb-3">
                          <Form.Label>Date of Issue</Form.Label>
                          <Form.Control
                            type="date"
                            value={leadForm.pax_date_of_issue}
                            onChange={(e) => setLeadForm({ ...leadForm, pax_date_of_issue: e.target.value })}
                          />
                        </Col>
                        <Col md={4} className="mb-3">
                          <Form.Label>Date of Expiry</Form.Label>
                          <Form.Control
                            type="date"
                            value={leadForm.pax_date_of_expiry}
                            onChange={(e) => setLeadForm({ ...leadForm, pax_date_of_expiry: e.target.value })}
                          />
                        </Col>
                        <Col md={4} className="mb-3">
                          <Form.Label>Age</Form.Label>
                          <Form.Control
                            type="number"
                            placeholder="Age"
                            value={leadForm.pax_age}
                            onChange={(e) => setLeadForm({ ...leadForm, pax_age: e.target.value })}
                          />
                        </Col>
                        <Col md={4} className="mb-3">
                          <Form.Label>Gender</Form.Label>
                          <Form.Select
                            value={leadForm.pax_gender}
                            onChange={(e) => setLeadForm({ ...leadForm, pax_gender: e.target.value })}
                          >
                            <option value="">Select</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </Form.Select>
                        </Col>
                        <Col md={4} className="mb-3">
                          <Form.Label>Nationality</Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="Nationality"
                            value={leadForm.pax_nationality}
                            onChange={(e) => setLeadForm({ ...leadForm, pax_nationality: e.target.value })}
                          />
                        </Col>
                        <Col md={4} className="mb-3">
                          <Form.Label>Phone</Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="Phone number"
                            value={leadForm.pax_phone}
                            onChange={(e) => setLeadForm({ ...leadForm, pax_phone: e.target.value })}
                          />
                        </Col>
                        <Col md={4} className="mb-3">
                          <Form.Label>WhatsApp</Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="WhatsApp number"
                            value={leadForm.pax_whatsapp_number}
                            onChange={(e) => setLeadForm({ ...leadForm, pax_whatsapp_number: e.target.value })}
                          />
                        </Col>
                        <Col md={4} className="mb-3">
                          <Form.Label>Email</Form.Label>
                          <Form.Control
                            type="email"
                            placeholder="Email address"
                            value={leadForm.pax_email}
                            onChange={(e) => setLeadForm({ ...leadForm, pax_email: e.target.value })}
                          />
                        </Col>
                        <Col md={12} className="mb-3">
                          <Form.Label>Address</Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={2}
                            placeholder="Full address"
                            value={leadForm.pax_address}
                            onChange={(e) => setLeadForm({ ...leadForm, pax_address: e.target.value })}
                          />
                        </Col>
                        <Col md={12} className="mb-3">
                          <Form.Label>Notes</Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={2}
                            placeholder="Additional notes"
                            value={leadForm.pax_notes}
                            onChange={(e) => setLeadForm({ ...leadForm, pax_notes: e.target.value })}
                          />
                        </Col>
                      </Row>
                      <div className="d-flex gap-2">
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() => {
                            if (!leadForm.pax_first_name || !leadForm.pax_passport_number) {
                              showAlert("danger", "First name and passport number are required!");
                              return;
                            }

                            const newPax = {
                              id: editingPassenger?.id || `temp-${Date.now()}`,
                              first_name: leadForm.pax_first_name,
                              last_name: leadForm.pax_last_name,
                              nickname: leadForm.pax_nickname,
                              passport_number: leadForm.pax_passport_number,
                              date_of_birth: leadForm.pax_date_of_birth,
                              date_of_issue: leadForm.pax_date_of_issue,
                              date_of_expiry: leadForm.pax_date_of_expiry,
                              issuing_country: leadForm.pax_issuing_country,
                              nationality: leadForm.pax_nationality,
                              address: leadForm.pax_address,
                              email: leadForm.pax_email,
                              phone: leadForm.pax_phone,
                              whatsapp_number: leadForm.pax_whatsapp_number,
                              age: leadForm.pax_age,
                              gender: leadForm.pax_gender,
                              notes: leadForm.pax_notes,
                            };

                            if (editingPassenger) {
                              const paxList = selectedLead.pax_details || selectedLead.pax || [];
                              const updated = paxList.map(p => p.id === editingPassenger.id ? newPax : p);
                              setSelectedLead({ ...selectedLead, pax_details: updated, pax: updated });
                              showAlert("success", "Passenger updated!");
                            } else {
                              const paxList = selectedLead.pax_details || selectedLead.pax || [];
                              setSelectedLead({ ...selectedLead, pax_details: [...paxList, newPax], pax: [...paxList, newPax] });
                              showAlert("success", "Passenger added!");
                            }

                            setShowPaxFields(false);
                            setEditingPassenger(null);
                          }}
                        >
                          <Save size={16} className="me-1" />
                          {editingPassenger ? "Update" : "Add"}
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setShowPaxFields(false);
                            setEditingPassenger(null);
                          }}
                        >
                          <X size={16} className="me-1" />
                          Cancel
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                )}

                {(selectedLead.pax_details || selectedLead.pax) && (selectedLead.pax_details?.length > 0 || selectedLead.pax?.length > 0) ? (
                  <Table bordered hover responsive>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Customer ID</th>
                        <th>Customer Name</th>
                        <th>Nickname</th>
                        <th>Passport</th>
                        <th>Issuing Country</th>
                        <th>DOB</th>
                        <th>Issue Date</th>
                        <th>Expiry Date</th>
                        <th>Age</th>
                        <th>Gender</th>
                        <th>Nationality</th>
                        <th>Phone</th>
                        <th>WhatsApp</th>
                        <th>Email</th>
                        <th>Address</th>
                        <th>Notes</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedLead.pax_details || selectedLead.pax).map((pax, index) => (
                        <tr key={pax.id || index}>
                          <td>{index + 1}</td>
                          <td className="text-nowrap">{pax.first_name} {pax.last_name}</td>
                          <td>{pax.nickname || "-"}</td>
                          <td className="text-nowrap">{pax.passport_number}</td>
                          <td>{pax.issuing_country || "-"}</td>
                          <td className="text-nowrap">{pax.date_of_birth || "-"}</td>
                          <td className="text-nowrap">{pax.date_of_issue || "-"}</td>
                          <td className="text-nowrap">{pax.date_of_expiry || "-"}</td>
                          <td>{pax.age || "-"}</td>
                          <td>{pax.gender || "-"}</td>
                          <td>{pax.nationality || "-"}</td>
                          <td className="text-nowrap">{pax.phone || "-"}</td>
                          <td className="text-nowrap">{pax.whatsapp_number || "-"}</td>
                          <td>{pax.email || "-"}</td>
                          <td style={{ maxWidth: "200px", whiteSpace: "normal" }}>{pax.address || "-"}</td>
                          <td style={{ maxWidth: "200px", whiteSpace: "normal" }}>{pax.notes || "-"}</td>
                          <td className="text-nowrap">
                            <Button
                              size="sm"
                              variant="outline-info"
                              className="me-1"
                              onClick={() => {
                                setEditingPassenger(pax);
                                setLeadForm({
                                  ...leadForm,
                                  pax_first_name: pax.first_name || "",
                                  pax_last_name: pax.last_name || "",
                                  pax_nickname: pax.nickname || "",
                                  pax_passport_number: pax.passport_number || "",
                                  pax_date_of_birth: pax.date_of_birth || "",
                                  pax_date_of_issue: pax.date_of_issue || "",
                                  pax_date_of_expiry: pax.date_of_expiry || "",
                                  pax_issuing_country: pax.issuing_country || "",
                                  pax_nationality: pax.nationality || "",
                                  pax_address: pax.address || "",
                                  pax_email: pax.email || "",
                                  pax_phone: pax.phone || "",
                                  pax_whatsapp_number: pax.whatsapp_number || "",
                                  pax_age: pax.age || "",
                                  pax_gender: pax.gender || "",
                                  pax_notes: pax.notes || "",
                                });
                                setShowPaxFields(true);
                              }}
                            >
                              <Edit2 size={14} />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline-danger"
                              onClick={async () => {
                                const paxList = selectedLead.pax_details || selectedLead.pax || [];
                                const paxToDelete = paxList.find(p => p.id === pax.id);

                                // If it's an existing passenger (not temp), delete from backend
                                if (paxToDelete && !String(paxToDelete.id).startsWith('temp-')) {
                                  try {
                                    await axios.delete(`${API_BASE_URL}/pax/${paxToDelete.id}/`, {
                                      headers: { Authorization: `Bearer ${token}` }
                                    });
                                  } catch (error) {
                                    console.error("Error deleting passenger:", error);
                                    showAlert("danger", "Failed to delete passenger");
                                    return;
                                  }
                                }

                                // Remove from local state
                                const filtered = paxList.filter(p => p.id !== pax.id);
                                setSelectedLead({ ...selectedLead, pax_details: filtered, pax: filtered });
                                showAlert("success", "Passenger removed!");
                              }}
                            >
                              <Trash2 size={14} />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                ) : (
                  <div className="text-center py-4 text-muted">
                    <Users size={48} className="mb-2" />
                    <p>No passengers added to this lead</p>
                  </div>
                )}
              </Tab>
            </Tabs>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowViewModal(false)}>
            <X size={18} className="me-2" />
            Close
          </Button>
          <Button
            variant="primary"
            onClick={async () => {
              try {
                setLoading(true);

                // Update lead details
                const payload = {
                  branch_id: branchId,
                  organization_id: organizationId,
                  customer_name: selectedLead.customer_name,
                  customer_phone: selectedLead.customer_phone,
                  cnic: selectedLead.cnic || null,
                  passport_number: selectedLead.passport_number || null,
                  city: selectedLead.city || null,
                  remarks: selectedLead.remarks || null,
                  lead_source: selectedLead.lead_source,
                  followup_status: selectedLead.followup_status,
                  next_followup_date: selectedLead.next_followup_date || null,
                  pending_balance: selectedLead.pending_balance,
                  assigned_to_name: selectedLead.assigned_to_name || null,
                };

                await axios.put(`${API_BASE_URL}/passport-leads/${selectedLead.id}/`, payload, {
                  headers: { Authorization: `Bearer ${token}` }
                });

                // Handle passenger updates
                const currentPax = selectedLead.pax_details || selectedLead.pax || [];

                for (const pax of currentPax) {
                  // Check if it's a new passenger (temp ID) or existing
                  if (String(pax.id).startsWith('temp-')) {
                    // Create new passenger
                    const paxPayload = {
                      lead: selectedLead.id,
                      first_name: pax.first_name,
                      last_name: pax.last_name || "",
                      nickname: pax.nickname || "",
                      passport_number: pax.passport_number,
                      date_of_birth: pax.date_of_birth || null,
                      date_of_issue: pax.date_of_issue || null,
                      date_of_expiry: pax.date_of_expiry || null,
                      issuing_country: pax.issuing_country || "",
                      nationality: pax.nationality || "",
                      address: pax.address || "",
                      email: pax.email || "",
                      phone: pax.phone || "",
                      whatsapp_number: pax.whatsapp_number || "",
                      age: pax.age || null,
                      gender: pax.gender || "",
                      notes: pax.notes || "",
                    };

                    await axios.post(`${API_BASE_URL}/pax/`, paxPayload, {
                      headers: { Authorization: `Bearer ${token}` }
                    });
                  } else {
                    // Update existing passenger
                    const paxPayload = {
                      lead: selectedLead.id,
                      first_name: pax.first_name,
                      last_name: pax.last_name || "",
                      nickname: pax.nickname || "",
                      passport_number: pax.passport_number,
                      date_of_birth: pax.date_of_birth || null,
                      date_of_issue: pax.date_of_issue || null,
                      date_of_expiry: pax.date_of_expiry || null,
                      issuing_country: pax.issuing_country || "",
                      nationality: pax.nationality || "",
                      address: pax.address || "",
                      email: pax.email || "",
                      phone: pax.phone || "",
                      whatsapp_number: pax.whatsapp_number || "",
                      age: pax.age || null,
                      gender: pax.gender || "",
                      notes: pax.notes || "",
                    };

                    await axios.put(`${API_BASE_URL}/pax/${pax.id}/`, paxPayload, {
                      headers: { Authorization: `Bearer ${token}` }
                    });
                  }
                }

                showAlert("success", "Lead and passengers updated successfully!");
                setShowViewModal(false);
                fetchLeads();
              } catch (error) {
                console.error("Error updating lead:", error);
                showAlert("danger", "Failed to update lead: " + (error.response?.data?.detail || error.message));
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
          >
            <Save size={18} className="me-2" />
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Duplicate Customer Modal */}
      <Modal show={showDuplicateModal} onHide={() => setShowDuplicateModal(false)} centered>
        <Modal.Header closeButton className="bg-warning text-dark">
          <Modal.Title>
            <AlertCircle size={24} className="me-2" />
            Duplicate Customer Found!
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {duplicateCustomerData && (
            <div>
              <Alert variant="warning" className="mb-3">
                <strong>Duplicate Field:</strong> {duplicateCustomerData.duplicate_field}
              </Alert>

              <Card className="mb-3">
                <Card.Header className="bg-light">
                  <strong>Existing Customer Details</strong>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <p className="mb-2">
                        <strong>Customer ID:</strong>{" "}
                        <Badge bg="info">{duplicateCustomerData.customer_id}</Badge>
                      </p>
                      <p className="mb-2">
                        <strong>Name:</strong> {duplicateCustomerData.customer.full_name}
                      </p>
                      <p className="mb-2">
                        <strong>Phone:</strong> {duplicateCustomerData.customer.phone || "N/A"}
                      </p>
                    </Col>
                    <Col md={6}>
                      <p className="mb-2">
                        <strong>Email:</strong> {duplicateCustomerData.customer.email || "N/A"}
                      </p>
                      <p className="mb-2">
                        <strong>Passport:</strong> {duplicateCustomerData.customer.passport_number || "N/A"}
                      </p>
                      <p className="mb-2">
                        <strong>City:</strong> {duplicateCustomerData.customer.city || "N/A"}
                      </p>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              <p className="text-muted">
                What would you like to do?
              </p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDuplicateModal(false)}>
            <X size={18} className="me-2" />
            Cancel
          </Button>
          <Button variant="primary" onClick={handleAutoFill}>
            <RefreshCw size={18} className="me-2" />
            Auto-Fill Form
          </Button>
          <Button variant="success" onClick={handleContinueWithExisting}>
            <CheckCircle size={18} className="me-2" />
            Continue with Existing
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default PassportLeads;