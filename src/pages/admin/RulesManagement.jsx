import React, { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Badge,
  Table,
  Button,
  Form,
  Modal,
  Alert,
  Spinner
} from "react-bootstrap";
import {
  FileText,
  Plus,
  Edit,
  Trash2,
  Eye,
  Save,
  X,
  Globe,
  CheckCircle,
  XCircle,
  Search,
  BookOpen
} from "lucide-react";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import api from "../../utils/Api";

const RulesManagement = () => {
  // State Management
  const [rules, setRules] = useState([]);
  const [filteredRules, setFilteredRules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showAllRulesModal, setShowAllRulesModal] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // create or edit
  const [selectedRule, setSelectedRule] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterPage, setFilterPage] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // Form State
  const [formData, setFormData] = useState({
    id: null,
    title: "",
    description: "",
    rule_type: "terms_and_conditions",
    pages_to_display: [],
    is_active: true,
    language: "en",
    created_by: "admin_001"
  });

  // Alert State
  const [alert, setAlert] = useState({ show: false, type: "", message: "" });

  // Rule Types Configuration
  const ruleTypes = [
    { value: "terms_and_conditions", label: "Terms & Conditions" },
    { value: "cancellation_policy", label: "Cancellation Policy" },
    { value: "refund_policy", label: "Refund Policy" },
    { value: "commission_policy", label: "Commission Policy" },
    { value: "transport_policy", label: "Transport Policy" },
    { value: "document_policy", label: "Document Policy" },
    { value: "hotel_policy", label: "Hotel Policy" },
    { value: "visa_policy", label: "Visa Policy" }
  ];

  // Pages Configuration
  const availablePages = [
    { value: "booking_page", label: "Booking Page" },
    { value: "hotel_page", label: "Hotel Page" },
    { value: "transport_page", label: "Transport Page" },
    { value: "visa_page", label: "Visa Page" },
    { value: "payment_page", label: "Payment Page" },
    { value: "dashboard", label: "Dashboard" }
  ];

  // Load rules from API on mount
  useEffect(() => {
    fetchRules();
  }, []);

  // API Functions
  const fetchRules = async () => {
    setLoading(true);
    try {
      const response = await api.get("/rules/list");
      setRules(response.data.rules || []);
      setAlert({ show: false, type: "", message: "" });
    } catch (error) {
      console.error("Error fetching rules:", error);
      showAlert("error", "Failed to load rules. Please try again.");
      setRules([]);
    } finally {
      setLoading(false);
    }
  };

  const createRule = async (ruleData) => {
    try {
      const response = await api.post("/rules/create", ruleData);
      if (response.data.success) {
        await fetchRules(); // Refresh the list
        showAlert("success", "Rule created successfully");
        return true;
      } else {
        showAlert("error", response.data.message || "Failed to create rule");
        return false;
      }
    } catch (error) {
      console.error("Error creating rule:", error);
      console.error("Error response:", error.response?.data);
      const errorMessage = error.response?.data?.message || error.response?.data?.detail || "Failed to create rule";
      showAlert("error", errorMessage);
      return false;
    }
  };

  const updateRule = async (ruleData) => {
    try {
      const response = await api.post("/rules/create", ruleData); // Same endpoint handles create/update
      if (response.data.success) {
        await fetchRules(); // Refresh the list
        showAlert("success", "Rule updated successfully");
        return true;
      } else {
        showAlert("error", response.data.message || "Failed to update rule");
        return false;
      }
    } catch (error) {
      console.error("Error updating rule:", error);
      const errorMessage = error.response?.data?.message || "Failed to update rule";
      showAlert("error", errorMessage);
      return false;
    }
  };

  const deleteRule = async (id) => {
    try {
      const response = await api.delete(`/rules/delete/${id}`);
      if (response.data.success) {
        await fetchRules(); // Refresh the list
        showAlert("success", "Rule deleted successfully");
        return true;
      } else {
        showAlert("error", response.data.message || "Failed to delete rule");
        return false;
      }
    } catch (error) {
      console.error("Error deleting rule:", error);
      const errorMessage = error.response?.data?.message || "Failed to delete rule";
      showAlert("error", errorMessage);
      return false;
    }
  };

  const toggleRuleStatus = async (id) => {
    try {
      // First get the current rule to toggle its status
      const rule = rules.find(r => r.id === id);
      if (!rule) return;

      const updatedRule = { ...rule, is_active: !rule.is_active };
      const response = await api.post("/rules/create", updatedRule);
      if (response.data.success) {
        await fetchRules(); // Refresh the list
        showAlert("success", "Rule status updated successfully");
      } else {
        showAlert("error", response.data.message || "Failed to update rule status");
      }
    } catch (error) {
      console.error("Error toggling rule status:", error);
      const errorMessage = error.response?.data?.message || "Failed to update rule status";
      showAlert("error", errorMessage);
    }
  };

  // Filter rules based on search and filters
  useEffect(() => {
    let result = [...rules];

    // Search filter
    if (searchQuery) {
      result = result.filter(rule =>
        rule.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rule.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Type filter
    if (filterType !== "all") {
      result = result.filter(rule => rule.rule_type === filterType);
    }

    // Page filter
    if (filterPage !== "all") {
      result = result.filter(rule => rule.pages_to_display.includes(filterPage));
    }

    // Status filter
    if (filterStatus !== "all") {
      const isActive = filterStatus === "active";
      result = result.filter(rule => rule.is_active === isActive);
    }

    setFilteredRules(result);
  }, [searchQuery, filterType, filterPage, filterStatus, rules]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  // Handle multi-select pages
  const handlePagesChange = (page) => {
    setFormData(prev => {
      const pages = [...prev.pages_to_display];
      const index = pages.indexOf(page);
      if (index > -1) {
        pages.splice(index, 1);
      } else {
        pages.push(page);
      }
      return { ...prev, pages_to_display: pages };
    });
  };

  // Open create modal
  const openCreateModal = () => {
    setModalMode("create");
    setFormData({
      id: null,
      title: "",
      description: "",
      rule_type: "terms_and_conditions",
      pages_to_display: [],
      is_active: true,
      language: "en",
      created_by: "admin_001"
    });
    setShowModal(true);
  };

  // Open edit modal
  const openEditModal = (rule) => {
    setModalMode("edit");
    setFormData({
      id: rule.id,
      title: rule.title,
      description: rule.description,
      rule_type: rule.rule_type,
      pages_to_display: [...rule.pages_to_display],
      is_active: rule.is_active,
      language: rule.language,
      created_by: rule.created_by
    });
    setShowModal(true);
  };

  // Open view modal
  const openViewModal = (rule) => {
    setSelectedRule(rule);
    setShowViewModal(true);
  };

  // Handle form submit (Create/Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validation
    if (!formData.title.trim() || !formData.description.trim()) {
      showAlert("error", "Title and description are required");
      setLoading(false);
      return;
    }

    if (formData.pages_to_display.length === 0) {
      showAlert("error", "Please select at least one page to display");
      setLoading(false);
      return;
    }

    // Prepare data for API - remove created_by as backend handles it from authenticated user
    const { created_by, ...apiData } = formData;

    let success = false;
    if (modalMode === "create") {
      success = await createRule(apiData);
    } else {
      success = await updateRule(apiData);
    }

    setLoading(false);
    if (success) {
      setShowModal(false);
    }
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this rule?")) {
      setLoading(true);
      const success = await deleteRule(id);
      setLoading(false);
    }
  };

  // Toggle active status
  const toggleActiveStatus = async (id) => {
    setLoading(true);
    await toggleRuleStatus(id);
    setLoading(false);
  };

  // Show alert helper
  const showAlert = (type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => {
      setAlert({ show: false, type: "", message: "" });
    }, 3000);
  };

  // Get rule type label
  const getRuleTypeLabel = (value) => {
    const type = ruleTypes.find(t => t.value === value);
    return type ? type.label : value;
  };

  // Get page label
  const getPageLabel = (value) => {
    const page = availablePages.find(p => p.value === value);
    return page ? page.label : value;
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-vh-100 bg-light">
      <div className="row g-0">
        {/* Sidebar */}
        <div className="col-12 col-lg-2">
          <Sidebar />
        </div>
        {/* Main Content */}
        <div className="col-12 col-lg-10">
          <div className="container-fluid">
            <Header />
            <div className="p-3 p-lg-4">
              {/* Header */}
              <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                <div>
                  <h3 className="mb-1">
                    <FileText size={28} className="me-2 text-primary" style={{ verticalAlign: "middle" }} />
                    Rules Management
                  </h3>
                  <small className="text-muted">
                    Manage Terms & Conditions, Policies, and Business Rules
                  </small>
                </div>
                <div className="d-flex gap-2">
                  <Button variant="outline-primary" onClick={() => setShowAllRulesModal(true)}>
                    <BookOpen size={18} className="me-2" />
                    All Rules
                  </Button>
                  <Button variant="primary" onClick={openCreateModal}>
                    <Plus size={18} className="me-2" />
                    Create New Rule
                  </Button>
                </div>
              </div>

              {/* Alert */}
              {alert.show && (
                <Alert variant={alert.type === "success" ? "success" : "danger"} dismissible onClose={() => setAlert({ ...alert, show: false })}>
                  {alert.message}
                </Alert>
              )}

              {/* Statistics Cards */}
              <Row className="mb-4">
                <Col xs={12} sm={6} lg={3} className="mb-3">
                  <Card className="shadow-sm border-0 h-100">
                    <Card.Body className="text-center">
                      <div className="text-primary mb-2">
                        <FileText size={32} />
                      </div>
                      <h4 className="mb-1">{rules.length}</h4>
                      <small className="text-muted">Total Rules</small>
                    </Card.Body>
                  </Card>
                </Col>
                <Col xs={12} sm={6} lg={3} className="mb-3">
                  <Card className="shadow-sm border-0 h-100">
                    <Card.Body className="text-center">
                      <div className="text-success mb-2">
                        <CheckCircle size={32} />
                      </div>
                      <h4 className="mb-1">{rules.filter(r => r.is_active).length}</h4>
                      <small className="text-muted">Active Rules</small>
                    </Card.Body>
                  </Card>
                </Col>
                <Col xs={12} sm={6} lg={3} className="mb-3">
                  <Card className="shadow-sm border-0 h-100">
                    <Card.Body className="text-center">
                      <div className="text-danger mb-2">
                        <XCircle size={32} />
                      </div>
                      <h4 className="mb-1">{rules.filter(r => !r.is_active).length}</h4>
                      <small className="text-muted">Inactive Rules</small>
                    </Card.Body>
                  </Card>
                </Col>
                <Col xs={12} sm={6} lg={3} className="mb-3">
                  <Card className="shadow-sm border-0 h-100">
                    <Card.Body className="text-center">
                      <div className="text-info mb-2">
                        <Globe size={32} />
                      </div>
                      <h4 className="mb-1">{rules.filter(r => r.language === "ur").length}</h4>
                      <small className="text-muted">Urdu Rules</small>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {/* Filters */}
              <Card className="shadow-sm mb-4">
                <Card.Body>
                  <Row className="g-3">
                    <Col xs={12} md={6} lg={3}>
                      <Form.Group>
                        <Form.Label className="small fw-bold">Search</Form.Label>
                        <div className="position-relative">
                          <Form.Control
                            type="text"
                            placeholder="Search rules..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="ps-5"
                          />
                          <Search size={16} className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
                        </div>
                      </Form.Group>
                    </Col>
                    <Col xs={12} md={6} lg={3}>
                      <Form.Group>
                        <Form.Label className="small fw-bold">Rule Type</Form.Label>
                        <Form.Select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                          <option value="all">All Types</option>
                          {ruleTypes.map(type => (
                            <option key={type.value} value={type.value}>{type.label}</option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col xs={12} md={6} lg={3}>
                      <Form.Group>
                        <Form.Label className="small fw-bold">Display Page</Form.Label>
                        <Form.Select value={filterPage} onChange={(e) => setFilterPage(e.target.value)}>
                          <option value="all">All Pages</option>
                          {availablePages.map(page => (
                            <option key={page.value} value={page.value}>{page.label}</option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col xs={12} md={6} lg={3}>
                      <Form.Group>
                        <Form.Label className="small fw-bold">Status</Form.Label>
                        <Form.Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                          <option value="all">All Status</option>
                          <option value="active">Active Only</option>
                          <option value="inactive">Inactive Only</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>
                  {(searchQuery || filterType !== "all" || filterPage !== "all" || filterStatus !== "all") && (
                    <div className="mt-3">
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => {
                          setSearchQuery("");
                          setFilterType("all");
                          setFilterPage("all");
                          setFilterStatus("all");
                        }}
                      >
                        <X size={14} className="me-1" />
                        Clear Filters
                      </Button>
                      <small className="text-muted ms-3">
                        Showing {filteredRules.length} of {rules.length} rules
                      </small>
                    </div>
                  )}
                </Card.Body>
              </Card>

              {/* Rules Table */}
              <Card className="shadow-sm">
                <Card.Body className="p-0">
                  <div className="table-responsive">
                    <Table hover className="mb-0">
                      <thead className="bg-light">
                        <tr>
                          <th>ID</th>
                          <th>Title</th>
                          <th>Type</th>
                          <th className="d-none d-lg-table-cell">Display Pages</th>
                          <th className="d-none d-md-table-cell">Language</th>
                          <th>Status</th>
                          <th className="d-none d-xl-table-cell">Updated</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRules.length === 0 ? (
                          <tr>
                            <td colSpan="8" className="text-center py-5">
                              <FileText size={48} className="text-muted mb-3" />
                              <p className="text-muted mb-0">No rules found</p>
                            </td>
                          </tr>
                        ) : (
                          filteredRules.map((rule) => (
                            <tr key={rule.id}>
                              <td>
                                <Badge bg="secondary">#{rule.id}</Badge>
                              </td>
                              <td>
                                <div className="fw-bold">{rule.title}</div>
                                <small className="text-muted d-lg-none">
                                  {rule.description.substring(0, 50)}...
                                </small>
                              </td>
                              <td>
                                <Badge bg="info" className="text-wrap">
                                  {getRuleTypeLabel(rule.rule_type)}
                                </Badge>
                              </td>
                              <td className="d-none d-lg-table-cell">
                                <div className="d-flex flex-wrap gap-1">
                                  {rule.pages_to_display.slice(0, 2).map((page, idx) => (
                                    <Badge key={idx} bg="secondary" className="text-wrap small">
                                      {getPageLabel(page)}
                                    </Badge>
                                  ))}
                                  {rule.pages_to_display.length > 2 && (
                                    <Badge bg="secondary" className="small">
                                      +{rule.pages_to_display.length - 2}
                                    </Badge>
                                  )}
                                </div>
                              </td>
                              <td className="d-none d-md-table-cell">
                                <Badge bg={rule.language === "en" ? "primary" : "warning"}>
                                  {rule.language === "en" ? "English" : "Urdu"}
                                </Badge>
                              </td>
                              <td>
                                <Form.Check
                                  type="switch"
                                  checked={rule.is_active}
                                  onChange={() => toggleActiveStatus(rule.id)}
                                  label={rule.is_active ? "Active" : "Inactive"}
                                />
                              </td>
                              <td className="d-none d-xl-table-cell">
                                <small className="text-muted">
                                  {formatDate(rule.updated_at)}
                                </small>
                              </td>
                              <td>
                                <div className="d-flex gap-1">
                                  <Button
                                    variant="outline-primary"
                                    size="sm"
                                    onClick={() => openViewModal(rule)}
                                    title="View"
                                  >
                                    <Eye size={14} />
                                  </Button>
                                  <Button
                                    variant="outline-warning"
                                    size="sm"
                                    onClick={() => openEditModal(rule)}
                                    title="Edit"
                                  >
                                    <Edit size={14} />
                                  </Button>
                                  <Button
                                    variant="outline-danger"
                                    size="sm"
                                    onClick={() => handleDelete(rule.id)}
                                    title="Delete"
                                  >
                                    <Trash2 size={14} />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </Table>
                  </div>
                </Card.Body>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {modalMode === "create" ? "Create New Rule" : "Edit Rule"}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={8} className="mb-3">
                <Form.Group>
                  <Form.Label>
                    Title <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Enter rule title"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4} className="mb-3">
                <Form.Group>
                  <Form.Label>Language</Form.Label>
                  <Form.Select
                    name="language"
                    value={formData.language}
                    onChange={handleInputChange}
                  >
                    <option value="en">English</option>
                    <option value="ur">Urdu</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>
                Description <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Enter rule description"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>
                Rule Type <span className="text-danger">*</span>
              </Form.Label>
              <Form.Select
                name="rule_type"
                value={formData.rule_type}
                onChange={handleInputChange}
              >
                {ruleTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>
                Display on Pages <span className="text-danger">*</span>
              </Form.Label>
              <div className="border rounded p-3" style={{ maxHeight: "200px", overflowY: "auto" }}>
                {availablePages.map((page) => (
                  <Form.Check
                    key={page.value}
                    type="checkbox"
                    id={`page-${page.value}`}
                    label={page.label}
                    checked={formData.pages_to_display.includes(page.value)}
                    onChange={() => handlePagesChange(page.value)}
                    className="mb-2"
                  />
                ))}
              </div>
              <Form.Text className="text-muted">
                Select one or more pages where this rule will be displayed
              </Form.Text>
            </Form.Group>

            <Form.Group>
              <Form.Check
                type="switch"
                id="is_active"
                name="is_active"
                label="Active (Rule will be displayed on selected pages)"
                checked={formData.is_active}
                onChange={handleInputChange}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)} disabled={loading}>
              <X size={16} className="me-2" />
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} className="me-2" />
                  {modalMode === "create" ? "Create Rule" : "Update Rule"}
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* View Modal */}
      <Modal show={showViewModal} onHide={() => setShowViewModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Rule Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedRule && (
            <>
              <Row className="mb-3">
                <Col md={6}>
                  <small className="text-muted d-block mb-1">Rule ID</small>
                  <Badge bg="secondary">#{selectedRule.id}</Badge>
                </Col>
                <Col md={6}>
                  <small className="text-muted d-block mb-1">Status</small>
                  <Badge bg={selectedRule.is_active ? "success" : "danger"}>
                    {selectedRule.is_active ? "Active" : "Inactive"}
                  </Badge>
                </Col>
              </Row>

              <hr />

              <div className="mb-3">
                <small className="text-muted d-block mb-1">Title</small>
                <h5>{selectedRule.title}</h5>
              </div>

              <div className="mb-3">
                <small className="text-muted d-block mb-1">Description</small>
                <p className="mb-0">{selectedRule.description}</p>
              </div>

              <Row className="mb-3">
                <Col md={6}>
                  <small className="text-muted d-block mb-1">Rule Type</small>
                  <Badge bg="info">{getRuleTypeLabel(selectedRule.rule_type)}</Badge>
                </Col>
                <Col md={6}>
                  <small className="text-muted d-block mb-1">Language</small>
                  <Badge bg={selectedRule.language === "en" ? "primary" : "warning"}>
                    {selectedRule.language === "en" ? "English" : "Urdu"}
                  </Badge>
                </Col>
              </Row>

              <div className="mb-3">
                <small className="text-muted d-block mb-2">Display on Pages</small>
                <div className="d-flex flex-wrap gap-2">
                  {selectedRule.pages_to_display.map((page, idx) => (
                    <Badge key={idx} bg="secondary">
                      {getPageLabel(page)}
                    </Badge>
                  ))}
                </div>
              </div>

              <hr />

              <Row>
                <Col md={6}>
                  <small className="text-muted d-block mb-1">Created At</small>
                  <small>{formatDate(selectedRule.created_at)}</small>
                </Col>
                <Col md={6}>
                  <small className="text-muted d-block mb-1">Last Updated</small>
                  <small>{formatDate(selectedRule.updated_at)}</small>
                </Col>
              </Row>

              <Row className="mt-3">
                <Col md={12}>
                  <small className="text-muted d-block mb-1">Created By</small>
                  <small>{selectedRule.created_by}</small>
                </Col>
              </Row>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowViewModal(false)}>
            Close
          </Button>
          {selectedRule && (
            <Button variant="warning" onClick={() => {
              setShowViewModal(false);
              openEditModal(selectedRule);
            }}>
              <Edit size={16} className="me-2" />
              Edit Rule
            </Button>
          )}
        </Modal.Footer>
      </Modal>

      {/* All Rules Reference Modal */}
      <Modal show={showAllRulesModal} onHide={() => setShowAllRulesModal(false)} size="xl" scrollable>
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>
            <BookOpen size={24} className="me-2" style={{ verticalAlign: "middle" }} />
            All Rules Reference Guide
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: "70vh", overflowY: "auto" }}>
          <Alert variant="info" className="mb-4">
            <strong>ℹ️ Reference Guide:</strong> Below are 20 predefined rule examples covering all available rule types. Use these as templates when creating your own rules.
          </Alert>

          {/* Terms & Conditions Rules */}
          <Card className="mb-4 shadow-sm">
            <Card.Header className="bg-light">
              <h5 className="mb-0"><Badge bg="info" className="me-2">Terms & Conditions</Badge> (4 Rules)</h5>
            </Card.Header>
            <Card.Body>
              <div className="rule-item mb-3 p-3 border-start border-4 border-primary bg-light">
                <h6 className="fw-bold text-primary">1. General Booking Terms</h6>
                <p className="mb-1 small">All bookings are subject to availability and confirmation. Customers must provide accurate information during booking. False information may result in booking cancellation without refund.</p>
                <small className="text-muted">Pages: Booking Page, Agent Portal, Dashboard</small>
              </div>

              <div className="rule-item mb-3 p-3 border-start border-4 border-primary bg-light">
                <h6 className="fw-bold text-primary">2. Payment Terms</h6>
                <p className="mb-1 small">Payment must be completed within 24 hours of booking confirmation. Partial payments are accepted as per package terms. Full payment must be received 7 days before departure.</p>
                <small className="text-muted">Pages: Payment Page, Booking Page</small>
              </div>

              <div className="rule-item mb-3 p-3 border-start border-4 border-primary bg-light">
                <h6 className="fw-bold text-primary">3. Customer Responsibilities</h6>
                <p className="mb-1 small">Customers are responsible for obtaining valid passports, visas, and required vaccinations. Failure to meet these requirements may result in denied boarding and no refund will be provided.</p>
                <small className="text-muted">Pages: Booking Page, Visa Page</small>
              </div>

              <div className="rule-item mb-3 p-3 border-start border-4 border-primary bg-light">
                <h6 className="fw-bold text-primary">4. Age Restrictions</h6>
                <p className="mb-1 small">Children under 18 must be accompanied by an adult. Infants under 2 years travel at reduced rates but do not occupy a seat. Senior citizens above 65 may require medical clearance.</p>
                <small className="text-muted">Pages: Booking Page, Dashboard</small>
              </div>
            </Card.Body>
          </Card>

          {/* Cancellation Policy Rules */}
          <Card className="mb-4 shadow-sm">
            <Card.Header className="bg-light">
              <h5 className="mb-0"><Badge bg="warning" className="me-2">Cancellation Policy</Badge> (4 Rules)</h5>
            </Card.Header>
            <Card.Body>
              <div className="rule-item mb-3 p-3 border-start border-4 border-warning bg-light">
                <h6 className="fw-bold text-warning">5. Standard Cancellation</h6>
                <p className="mb-1 small">Cancellations made 30+ days before departure: 90% refund. 15-29 days: 50% refund. 7-14 days: 25% refund. Less than 7 days: No refund. Processing fee of $50 applies to all cancellations.</p>
                <small className="text-muted">Pages: Booking Page, Payment Page</small>
              </div>

              <div className="rule-item mb-3 p-3 border-start border-4 border-warning bg-light">
                <h6 className="fw-bold text-warning">6. Emergency Cancellation</h6>
                <p className="mb-1 small">In case of medical emergencies or death in family, 75% refund provided with valid documentation. Medical certificate or death certificate must be submitted within 48 hours of cancellation request.</p>
                <small className="text-muted">Pages: Booking Page, Dashboard</small>
              </div>

              <div className="rule-item mb-3 p-3 border-start border-4 border-warning bg-light">
                <h6 className="fw-bold text-warning">7. Group Cancellation</h6>
                <p className="mb-1 small">For group bookings (10+ people), if 50% or more cancel, entire booking may be cancelled. Refund terms apply individually. Group leader is responsible for coordinating cancellations.</p>
                <small className="text-muted">Pages: Agent Portal, Booking Page</small>
              </div>

              <div className="rule-item mb-3 p-3 border-start border-4 border-warning bg-light">
                <h6 className="fw-bold text-warning">8. No-Show Policy</h6>
                <p className="mb-1 small">Failure to show up for departure without prior cancellation results in complete forfeiture of all payments. No refund or credit will be provided for no-show passengers.</p>
                <small className="text-muted">Pages: Booking Page, Dashboard</small>
              </div>
            </Card.Body>
          </Card>

          {/* Refund Policy Rules */}
          <Card className="mb-4 shadow-sm">
            <Card.Header className="bg-light">
              <h5 className="mb-0"><Badge bg="success" className="me-2">Refund Policy</Badge> (3 Rules)</h5>
            </Card.Header>
            <Card.Body>
              <div className="rule-item mb-3 p-3 border-start border-4 border-success bg-light">
                <h6 className="fw-bold text-success">9. Refund Processing Time</h6>
                <p className="mb-1 small">Approved refunds are processed within 14-21 business days. Refunds are issued to the original payment method. Bank processing may take additional 5-7 business days.</p>
                <small className="text-muted">Pages: Payment Page, Dashboard</small>
              </div>

              <div className="rule-item mb-3 p-3 border-start border-4 border-success bg-light">
                <h6 className="fw-bold text-success">10. Partial Refunds</h6>
                <p className="mb-1 small">If only certain services are cancelled (e.g., hotel upgrade, ziyarat tour), partial refunds are calculated based on service cost minus processing fee. Minimum $25 processing fee applies.</p>
                <small className="text-muted">Pages: Booking Page, Hotel Page</small>
              </div>

              <div className="rule-item mb-3 p-3 border-start border-4 border-success bg-light">
                <h6 className="fw-bold text-success">11. Non-Refundable Items</h6>
                <p className="mb-1 small">Visa processing fees, travel insurance, and service charges are non-refundable. Third-party bookings (flights, hotels) are subject to their respective cancellation policies.</p>
                <small className="text-muted">Pages: Visa Page, Payment Page</small>
              </div>
            </Card.Body>
          </Card>

          {/* Commission Policy Rules */}
          <Card className="mb-4 shadow-sm">
            <Card.Header className="bg-light">
              <h5 className="mb-0"><Badge bg="primary" className="me-2">Commission Policy</Badge> (2 Rules)</h5>
            </Card.Header>
            <Card.Body>
              <div className="rule-item mb-3 p-3 border-start border-4 border-primary bg-light">
                <h6 className="fw-bold text-primary">12. Agent Commission Structure</h6>
                <p className="mb-1 small">Agents earn 5-10% commission on package bookings based on volume. Monthly sales &lt; $10,000: 5%, $10,000-$25,000: 7%, &gt; $25,000: 10%. Commission paid within 30 days of customer payment.</p>
                <small className="text-muted">Pages: Agent Portal, Dashboard</small>
              </div>

              <div className="rule-item mb-3 p-3 border-start border-4 border-primary bg-light">
                <h6 className="fw-bold text-primary">13. Commission Clawback</h6>
                <p className="mb-1 small">If customer cancels and receives refund, agent commission is reversed. If commission already paid, amount will be deducted from next commission payment or invoiced separately.</p>
                <small className="text-muted">Pages: Agent Portal</small>
              </div>
            </Card.Body>
          </Card>

          {/* Transport, Hotel, Visa, Document Policies */}
          <Card className="mb-4 shadow-sm">
            <Card.Header className="bg-light">
              <h5 className="mb-0"><Badge bg="secondary" className="me-2">Other Policies</Badge> (7 Rules)</h5>
            </Card.Header>
            <Card.Body>
              <div className="rule-item mb-3 p-3 border-start border-4 border-secondary bg-light">
                <h6 className="fw-bold text-secondary">14. Transport Policy - Luggage</h6>
                <p className="mb-1 small">Each passenger allowed 1 check-in bag (23kg) and 1 carry-on (7kg). Excess baggage charged at $10/kg. Fragile items must be declared. Company not liable for lost/damaged luggage.</p>
                <small className="text-muted">Pages: Transport Page, Booking Page</small>
              </div>

              <div className="rule-item mb-3 p-3 border-start border-4 border-secondary bg-light">
                <h6 className="fw-bold text-secondary">15. Transport Policy - Delays</h6>
                <p className="mb-1 small">Company not responsible for delays due to weather, traffic, or force majeure. Alternative arrangements made when possible. No compensation for delays under 4 hours.</p>
                <small className="text-muted">Pages: Transport Page</small>
              </div>

              <div className="rule-item mb-3 p-3 border-start border-4 border-secondary bg-light">
                <h6 className="fw-bold text-secondary">16. Hotel Policy - Check-in/out</h6>
                <p className="mb-1 small">Standard check-in: 2 PM, check-out: 12 PM. Early check-in/late check-out subject to availability and additional charges. Guests must present valid ID and booking confirmation.</p>
                <small className="text-muted">Pages: Hotel Page, Booking Page</small>
              </div>

              <div className="rule-item mb-3 p-3 border-start border-4 border-secondary bg-light">
                <h6 className="fw-bold text-secondary">17. Hotel Policy - Damage</h6>
                <p className="mb-1 small">Guests liable for any damage to hotel property. Security deposit may be required. Smoking in non-smoking rooms: $200 fine. Lost key cards: $25 replacement fee.</p>
                <small className="text-muted">Pages: Hotel Page</small>
              </div>

              <div className="rule-item mb-3 p-3 border-start border-4 border-secondary bg-light">
                <h6 className="fw-bold text-secondary">18. Visa Policy - Processing</h6>
                <p className="mb-1 small">Visa processing takes 7-14 business days. Rush processing available for additional fee. Company assists with application but approval is at discretion of embassy. Visa fees non-refundable if rejected.</p>
                <small className="text-muted">Pages: Visa Page, Booking Page</small>
              </div>

              <div className="rule-item mb-3 p-3 border-start border-4 border-secondary bg-light">
                <h6 className="fw-bold text-secondary">19. Document Policy - Requirements</h6>
                <p className="mb-1 small">Passport must be valid for 6+ months from travel date. Provide clear scanned copies of passport, photos, and vaccination certificates. Incomplete documents delay processing.</p>
                <small className="text-muted">Pages: Visa Page, Dashboard</small>
              </div>

              <div className="rule-item mb-3 p-3 border-start border-4 border-secondary bg-light">
                <h6 className="fw-bold text-secondary">20. Document Policy - Verification</h6>
                <p className="mb-1 small">All documents verified for authenticity. Fraudulent documents result in immediate booking cancellation and legal action. Customers must ensure all information matches official documents exactly.</p>
                <small className="text-muted">Pages: Visa Page, Booking Page, Dashboard</small>
              </div>
            </Card.Body>
          </Card>

          <Alert variant="success" className="mt-4">
            <strong>✅ Total: 20 Predefined Rules</strong>
            <br />
            These rules cover all major aspects of Umrah travel business. Use them as templates to create your own customized rules.
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAllRulesModal(false)}>
            Close
          </Button>
          <Button variant="primary" onClick={() => {
            setShowAllRulesModal(false);
            openCreateModal();
          }}>
            <Plus size={16} className="me-2" />
            Create New Rule
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default RulesManagement;
