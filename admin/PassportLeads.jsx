import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Badge,
  Modal,
  Alert,
  Spinner,
} from "react-bootstrap";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import CRMTabs from "../../components/CRMTabs";
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
  Download,
  MessageSquare,
  Users,
  TrendingUp,
} from "lucide-react";

const PassportLeads = () => {
  // State Management
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ show: false, type: "", message: "" });

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [urgencyFilter, setUrgencyFilter] = useState("all");
  const [agentFilter, setAgentFilter] = useState("all");

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);

  // Selected Items
  const [selectedLead, setSelectedLead] = useState(null);

  // Form State
  const [leadForm, setLeadForm] = useState({
    customer_name: "",
    customer_phone: "",
    customer_email: "",
    customer_cnic: "",
    agent_id: "",
    agent_name: "",
    passport_number: "",
    passport_status: "pending_collection",
    collection_date: "",
    expected_delivery_date: "",
    actual_delivery_date: "",
    urgency: "normal",
    notes: "",
    documents_received: false,
    documents_list: [],
  });

  // For follow-ups (missing in your code)
  const [followUpForm, setFollowUpForm] = useState({
    follow_up_date: "",
    follow_up_type: "phone",
    follow_up_notes: "",
    next_follow_up_date: "",
    status_update: "",
  });

  // Statistics mock (you referenced `statistics` but didn’t define it)
  const [statistics, setStatistics] = useState({
    total: 0,
    pending_collection: 0,
    in_process: 0,
    ready: 0,
    delivered: 0,
    urgent: 0,
    high: 0,
  });

  // Example derived data (you referenced filteredLeads)
  const filteredLeads = leads.filter((lead) => {
    return (
      lead.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.passport_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.customer_phone.includes(searchTerm)
    );
  });

  // Alert helper
  const showAlert = (type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => {
      setAlert({ show: false, type: "", message: "" });
    }, 5000);
  };

  // Dummy handlers
  const handleAddLead = () => {
    showAlert("success", "Lead added successfully!");
    setShowAddModal(false);
  };

  const openEditModal = (lead) => {
    setSelectedLead(lead);
    setShowEditModal(true);
  };

  const openViewModal = (lead) => {
    setSelectedLead(lead);
    setShowViewModal(true);
  };

  const openFollowUpModal = (lead) => {
    setSelectedLead(lead);
    setShowFollowUpModal(true);
  };

  // ✅ Fixed JSX return
  return (
    <div className="min-vh-100" style={{ fontFamily: "Poppins, sans-serif" }}>
      <div className="row g-0">
        <div className="col-12 col-lg-2">
          <Sidebar />
        </div>
        <div className="col-12 col-lg-10">
          <div className="container-fluid">
            <Header />
            <div className="px-3 px-lg-4 my-3">
              <CRMTabs />
              <Container fluid className="p-4">
                {alert.show && (
                  <Alert
                    variant={alert.type}
                    onClose={() => setAlert({ show: false })}
                    dismissible
                    className="mb-3"
                  >
                    {alert.message}
                  </Alert>
                )}

                <Row className="mb-4">
                  <Col>
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h2 className="mb-1 fw-bold">
                          <FileText size={32} className="me-2" />
                          Passport Leads & Follow-up
                        </h2>
                        <p className="text-muted">
                          Track and manage passport collection and delivery
                          process
                        </p>
                      </div>
                      <Button
                        variant="primary"
                        onClick={() => setShowAddModal(true)}
                      >
                        <Plus size={18} className="me-2" />
                        Add New Lead
                      </Button>
                    </div>
                  </Col>
                </Row>

                {/* Example Stat */}
                <Row>
                  <Col md={3}>
                    <Card className="h-100 shadow-sm border-0">
                      <Card.Body>
                        <p>Total Leads</p>
                        <h3>{statistics.total}</h3>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </Container>
            </div>
          </div>
        </div>
      </div>

      {/* Add Lead Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <Plus size={24} className="me-2" />
            Add New Passport Lead
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group>
              <Form.Label>Customer Name *</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter customer name"
                value={leadForm.customer_name}
                onChange={(e) =>
                  setLeadForm({ ...leadForm, customer_name: e.target.value })
                }
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleAddLead}>
            Add Lead
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default PassportLeads;
