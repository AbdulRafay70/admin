import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Alert,
  Badge,
  Spinner,
  Modal,
  Table,
  InputGroup,
  Pagination,
  Tabs,
  Tab,
} from "react-bootstrap";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import CRMTabs from "../../components/CRMTabs";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  Phone,
  Mail,
  AlertCircle,
  Clock,
  BarChart3,
  TrendingUp,
  Fingerprint,
  Users,
} from "lucide-react";
import axios from "axios";
import "./styles/leads.css";

const UnifiedLeadManagement = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [leads, setLeads] = useState([]);
  const [filteredLeads, setFilteredLeads] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ show: false, type: "", message: "" });
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const itemsPerPage = 10;

  const demoLeads = [
    {
      id: 1,
      name: "Ahmed Hassan",
      email: "ahmed@example.com",
      phone: "+92-300-1234567",
      type: "customer",
      status: "new",
      source: "website",
      branch: "Karachi",
      created: "2025-01-15",
      notes: "Interested in Umrah package",
      budget: "50000-100000",
    },
    {
      id: 2,
      name: "Fatima Khan",
      email: "fatima@example.com",
      phone: "+92-301-7654321",
      type: "passport",
      status: "contacted",
      source: "referral",
      branch: "Lahore",
      created: "2025-01-14",
      notes: "Passport application inquiry",
      passportType: "New",
    },
    {
      id: 3,
      name: "Muhammad Ali",
      email: "mali@example.com",
      phone: "+92-302-5555555",
      type: "customer",
      status: "qualified",
      source: "form",
      branch: "Islamabad",
      created: "2025-01-13",
      notes: "High priority customer",
      budget: "100000-200000",
    },
    {
      id: 4,
      name: "Zainab Ahmed",
      email: "zainab@example.com",
      phone: "+92-303-9999999",
      type: "passport",
      status: "new",
      source: "website",
      branch: "Karachi",
      created: "2025-01-12",
      notes: "Visa services inquiry",
      passportType: "Renewal",
    },
    {
      id: 5,
      name: "Hassan Khan",
      email: "hassan@example.com",
      phone: "+92-304-1111111",
      type: "customer",
      status: "converted",
      source: "email",
      branch: "Lahore",
      created: "2025-01-11",
      notes: "Successfully booked package",
      budget: "75000-150000",
    },
    {
      id: 6,
      name: "Aisha Malik",
      email: "aisha@example.com",
      phone: "+92-305-2222222",
      type: "passport",
      status: "contacted",
      source: "phone",
      branch: "Islamabad",
      created: "2025-01-10",
      notes: "Waiting for documentation",
      passportType: "New",
    },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setLeads(demoLeads);
        setBranches(["Karachi", "Lahore", "Islamabad", "Peshawar", "Quetta"]);
        setAlert({ show: true, type: "success", message: "Leads loaded successfully" });
      } catch (err) {
        console.error("Error fetching leads:", err);
        setAlert({ show: true, type: "danger", message: "Failed to load leads" });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    let filtered = leads;

    if (activeTab === "customer") filtered = filtered.filter((lead) => lead.type === "customer");
    else if (activeTab === "passport") filtered = filtered.filter((lead) => lead.type === "passport");

    if (searchTerm) {
      filtered = filtered.filter(
        (lead) =>
          lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lead.phone.includes(searchTerm)
      );
    }

    if (selectedBranch) filtered = filtered.filter((lead) => lead.branch === selectedBranch);
    if (statusFilter) filtered = filtered.filter((lead) => lead.status === statusFilter);

    setFilteredLeads(filtered);
    setCurrentPage(1);
  }, [activeTab, leads, searchTerm, selectedBranch, statusFilter]);

  const getStats = () => {
    let statLeads = leads;
    if (activeTab === "customer") statLeads = leads.filter((l) => l.type === "customer");
    else if (activeTab === "passport") statLeads = leads.filter((l) => l.type === "passport");

    return {
      total: statLeads.length,
      new: statLeads.filter((l) => l.status === "new").length,
      contacted: statLeads.filter((l) => l.status === "contacted").length,
      qualified: statLeads.filter((l) => l.status === "qualified").length,
      converted: statLeads.filter((l) => l.status === "converted").length,
    };
  };

  const stats = getStats();
  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const paginatedLeads = filteredLeads.slice(startIdx, startIdx + itemsPerPage);

  const getStatusBadge = (status) => {
    const variants = {
      new: "warning",
      contacted: "info",
      qualified: "primary",
      converted: "success",
      lost: "danger",
    };
    const labels = {
      new: "New",
      contacted: "Contacted",
      qualified: "Qualified",
      converted: "Converted",
      lost: "Lost",
    };
    return <Badge bg={variants[status] || "secondary"}>{labels[status] || status}</Badge>;
  };

  const getSourceBadge = (source) => {
    const variants = {
      website: "info",
      form: "primary",
      phone: "success",
      email: "secondary",
      referral: "warning",
    };
    return <Badge bg={variants[source] || "secondary"}>{source.toUpperCase()}</Badge>;
  };

  const renderLeadsTable = () => (
    <div style={{ overflowX: "auto" }}>
      <Table hover responsive>
        <thead style={{ backgroundColor: "#f8f9fa" }}>
          <tr>
            <th>Name</th>
            <th>Contact</th>
            <th>Type</th>
            <th>Status</th>
            <th>Source</th>
            <th>Branch</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {paginatedLeads.map((lead) => (
            <tr key={lead.id}>
              <td>
                <strong>{lead.name}</strong>
              </td>
              <td style={{ fontSize: "0.85rem", color: "#6c757d" }}>
                <div className="d-flex align-items-center gap-1">
                  <Mail size={14} /> {lead.email}
                </div>
                <div className="d-flex align-items-center gap-1 mt-1">
                  <Phone size={14} /> {lead.phone}
                </div>
              </td>
              <td>
                <Badge bg={lead.type === "customer" ? "primary" : "info"}>
                  {lead.type === "customer" ? "Customer" : "Passport"}
                </Badge>
              </td>
              <td>{getStatusBadge(lead.status)}</td>
              <td>{getSourceBadge(lead.source)}</td>
              <td>{lead.branch}</td>
              <td><small>{lead.created}</small></td>
              <td>
                <div className="d-flex gap-1">
                  <Button variant="outline-primary" size="sm"><Eye size={14} /></Button>
                  <Button variant="outline-warning" size="sm"><Edit2 size={14} /></Button>
                  <Button variant="outline-danger" size="sm"><Trash2 size={14} /></Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );

  if (loading) {
    return (
      <div className="min-vh-100" style={{ fontFamily: "Poppins, sans-serif" }}>
        <div className="row g-0">
          <div className="col-12 col-lg-2"><Sidebar /></div>
          <div className="col-12 col-lg-10">
            <div className="container-fluid">
              <Header title="Lead Management" />
              <div className="d-flex justify-content-center align-items-center" style={{ height: "80vh" }}>
                <Spinner animation="border" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100" style={{ fontFamily: "Poppins, sans-serif" }}>
      <div className="row g-0">
        <div className="col-12 col-lg-2">
          <Sidebar />
        </div>
        <div className="col-12 col-lg-10">
          <div className="container">
            <Header />
            <div className="px-3 px-lg-4 my-3">
              <CRMTabs />
              
              <Container fluid className="p-0">
                {alert.show && (
                  <Alert variant={alert.type} dismissible onClose={() => setAlert({ ...alert, show: false })}>
                    {alert.message}
                  </Alert>
                )}

                {/* Stats Cards */}
                <Row className="mb-4">
                  <Col xs={12} sm={6} lg={3} className="mb-3">
                    <Card className="h-100">
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <p className="text-muted mb-1">Total Leads</p>
                            <h3 className="mb-0">{stats.total}</h3>
                          </div>
                          <BarChart3 size={40} className="text-primary opacity-50" />
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col xs={12} sm={6} lg={3} className="mb-3">
                    <Card className="h-100">
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <p className="text-muted mb-1">New</p>
                            <h3 className="mb-0">{stats.new}</h3>
                          </div>
                          <AlertCircle size={40} className="text-warning opacity-50" />
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col xs={12} sm={6} lg={3} className="mb-3">
                    <Card className="h-100">
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <p className="text-muted mb-1">Qualified</p>
                            <h3 className="mb-0">{stats.qualified}</h3>
                          </div>
                          <Users size={40} className="text-info opacity-50" />
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col xs={12} sm={6} lg={3} className="mb-3">
                    <Card className="h-100">
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <p className="text-muted mb-1">Converted</p>
                            <h3 className="mb-0">{stats.converted}</h3>
                          </div>
                          <TrendingUp size={40} className="text-success opacity-50" />
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>

                {/* Filters & Actions */}
                <Card className="mb-4">
                  <Card.Body>
                    <Row className="align-items-end">
                      <Col md={3} className="mb-3">
                        <Form.Group>
                          <Form.Label>Search</Form.Label>
                          <InputGroup>
                            <InputGroup.Text>
                              <Search size={16} />
                            </InputGroup.Text>
                            <Form.Control
                              type="text"
                              placeholder="Search leads..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                            />
                          </InputGroup>
                        </Form.Group>
                      </Col>
                      <Col md={2} className="mb-3">
                        <Form.Group>
                          <Form.Label>Status</Form.Label>
                          <Form.Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                            <option value="">All Status</option>
                            <option value="new">New</option>
                            <option value="contacted">Contacted</option>
                            <option value="qualified">Qualified</option>
                            <option value="converted">Converted</option>
                            <option value="lost">Lost</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={2} className="mb-3">
                        <Form.Group>
                          <Form.Label>Branch</Form.Label>
                          <Form.Select value={selectedBranch} onChange={(e) => setSelectedBranch(e.target.value)}>
                            <option value="">All Branches</option>
                            <option value="Karachi">Karachi</option>
                            <option value="Lahore">Lahore</option>
                            <option value="Islamabad">Islamabad</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={5} className="mb-3 text-end">
                        <Button variant="primary">
                          <Plus size={18} className="me-2" />
                          Add Lead
                        </Button>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>

                {/* Tabs */}
                <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-3">
                  <Tab eventKey="all" title="All Leads">
                    {renderLeadsTable()}
                  </Tab>
                  <Tab eventKey="customer" title="Customer Leads">
                    {renderLeadsTable()}
                  </Tab>
                  <Tab eventKey="passport" title="Passport Leads">
                    {renderLeadsTable()}
                  </Tab>
                </Tabs>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="d-flex justify-content-center mt-4">
                    <Pagination>
                      <Pagination.First onClick={() => setCurrentPage(1)} disabled={currentPage === 1} />
                      <Pagination.Prev onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1} />
                      {[...Array(totalPages)].map((_, i) => (
                        <Pagination.Item key={i + 1} active={i + 1 === currentPage} onClick={() => setCurrentPage(i + 1)}>
                          {i + 1}
                        </Pagination.Item>
                      ))}
                      <Pagination.Next onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages} />
                      <Pagination.Last onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} />
                    </Pagination>
                  </div>
                )}
              </Container>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnifiedLeadManagement;
