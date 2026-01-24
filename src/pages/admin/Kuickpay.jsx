import React, { useState, useEffect } from "react";
import { Nav, Card, Row, Col, Form, Button, InputGroup, Table, Modal, Badge, Alert } from "react-bootstrap";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import { Settings, FileText, Server, Search, BarChart2, Users, Trash2, Eye } from "lucide-react";
import api from "../../utils/Api";

const demoTransactions = [
  { transaction_id: "KP-0001", booking_id: "BKG-101", amount: 120.0, currency: "PKR", status: "success", payment_method: "card", created_at: "2025-10-31T10:00:00Z", merchant_id: "M-123", reference: "ref-001", raw: { provider_response: { code: "00", message: "Approved" } } },
  { transaction_id: "KP-0002", booking_id: "BKG-102", amount: 200.0, currency: "PKR", status: "pending", payment_method: "bank", created_at: "2025-10-31T11:00:00Z", merchant_id: "M-123", reference: "ref-002", raw: { provider_response: { code: "01", message: "Pending" } } }
];

const demoWebhooks = [
  { id: 1, event: "payment.success", received_at: "2025-10-31T10:01:00Z", payload: { transaction_id: "KP-0001", status: "success" } },
  { id: 2, event: "payment.failed", received_at: "2025-10-31T11:02:00Z", payload: { transaction_id: "KP-0003", status: "failed" } }
];

const Kuickpay = () => {
  const [active, setActive] = useState("consumers");

  // Get logged-in user info from localStorage
  const [userInfo, setUserInfo] = useState({
    email: '',
    contact: '',
    name: ''
  });

  useEffect(() => {
    // Get user info from localStorage - try multiple possible keys
    let userEmail = '';
    let userContact = '';
    let userName = '';

    // Log all localStorage keys for debugging
    console.log('=== KuickPay - Checking localStorage ===');
    console.log('All localStorage keys:', Object.keys(localStorage));

    // Try different possible keys for user data
    const possibleUserKeys = ['user', 'currentUser', 'userData', 'authUser', 'loggedInUser'];

    for (const key of possibleUserKeys) {
      const userDataStr = localStorage.getItem(key);
      if (userDataStr) {
        console.log(`Found data in localStorage.${key}:`, userDataStr);
        try {
          const userData = JSON.parse(userDataStr);
          console.log(`Parsed ${key}:`, userData);

          // Check if it's an array (like your users array)
          if (Array.isArray(userData) && userData.length > 0) {
            // Use the first user or find the current user
            const currentUser = userData[0];
            userEmail = currentUser.email || '';
            userContact = currentUser.phone || currentUser.contact || currentUser.phone_number || '';
            userName = currentUser.first_name || currentUser.name || currentUser.username || '';
            if (currentUser.last_name) {
              userName = userName ? `${userName} ${currentUser.last_name}` : currentUser.last_name;
            }
            console.log('Using user from array:', { email: userEmail, contact: userContact, name: userName });
            break;
          } else if (userData && typeof userData === 'object') {
            // It's a single user object
            userEmail = userData.email || userData.user_email || '';
            userContact = userData.phone || userData.contact || userData.phone_number || '';
            userName = userData.first_name || userData.name || userData.username || '';
            if (userData.last_name) {
              userName = userName ? `${userName} ${userData.last_name}` : userData.last_name;
            }
            console.log('Using user object:', { email: userEmail, contact: userContact, name: userName });
            break;
          }
        } catch (e) {
          console.error(`Error parsing ${key}:`, e);
        }
      }
    }

    // Fallback to individual localStorage keys if user object didn't work
    if (!userEmail) {
      userEmail = localStorage.getItem('userEmail') || localStorage.getItem('email') || '';
      console.log('Fallback email from localStorage:', userEmail);
    }
    if (!userContact) {
      userContact = localStorage.getItem('userContact') || localStorage.getItem('phone') || localStorage.getItem('contact_number') || '';
      console.log('Fallback contact from localStorage:', userContact);
    }
    if (!userName) {
      userName = localStorage.getItem('userName') || localStorage.getItem('username') || '';
      console.log('Fallback name from localStorage:', userName);
    }

    // Set final values with defaults only if still empty
    const finalUserInfo = {
      email: userEmail || 'user@example.com',
      contact: userContact || '03000000000',
      name: userName || 'User'
    };

    setUserInfo(finalUserInfo);
    console.log('=== Final User Info Set ===', finalUserInfo);
  }, []);

  // settings state
  const [config, setConfig] = useState({ merchant_id: "M-123", api_key: "sk_test_XXXX", mode: "test", webhook_url: "https://example.com/webhooks/kuickpay" });

  // transactions state
  const [transactions] = useState(demoTransactions);
  const [txQuery, setTxQuery] = useState("");
  const [txSelected, setTxSelected] = useState(null);

  // webhooks state
  const [webhooks] = useState(demoWebhooks);
  const [whSelected, setWhSelected] = useState(null);

  // consumers state
  const [consumers, setConsumers] = useState([]);
  const [consumerForm, setConsumerForm] = useState({
    reason: '',
    expiry_date: '',
    amount: '',
    contact_number: ''
  });
  const [consumerAlert, setConsumerAlert] = useState(null);
  const [selectedConsumer, setSelectedConsumer] = useState(null);
  const [loading, setLoading] = useState(false);

  // Initialize contact_number when userInfo is loaded
  useEffect(() => {
    if (userInfo.contact) {
      setConsumerForm(prev => ({ ...prev, contact_number: userInfo.contact }));
    }
  }, [userInfo.contact]);

  // Fetch consumers from API
  const fetchConsumers = async () => {
    try {
      const response = await api.get('/consumers/');
      setConsumers(response.data);
    } catch (error) {
      console.error('Error fetching consumers:', error);
      setConsumerAlert({ type: 'danger', message: 'Failed to load consumers' });
    }
  };

  // Fetch consumers on mount
  useEffect(() => {
    fetchConsumers();
    const interval = setInterval(fetchConsumers, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const handleSaveSettings = (e) => {
    e.preventDefault();
    console.log("Save Kuickpay settings", config);
    alert("Settings saved (demo)");
  };

  // Generate consumer number from API
  const generateConsumerNumber = async () => {
    try {
      const response = await api.get('/consumers/next_consumer_number/');
      return response.data.next_consumer_number;
    } catch (error) {
      console.error('Error generating consumer number:', error);
      // Fallback to local generation
      const baseNumber = 95700000;
      if (consumers.length === 0) {
        return String(baseNumber);
      }
      const numbers = consumers.map(c => parseInt(c.consumer_number));
      const maxNumber = Math.max(...numbers);
      return String(maxNumber + 1);
    }
  };

  // Get bill status badge
  const getBillStatusBadge = (status) => {
    switch (status) {
      case 'P':
        return <Badge bg="success">Paid</Badge>;
      case 'U':
        return <Badge bg="warning">Unpaid</Badge>;
      case 'B':
        return <Badge bg="danger">Blocked (Expired)</Badge>;
      default:
        return <Badge bg="secondary">Unknown</Badge>;
    }
  };

  // Validate form
  const validateConsumerForm = () => {
    if (!consumerForm.reason.trim()) {
      setConsumerAlert({ type: 'danger', message: 'Reason is required' });
      return false;
    }
    if (!consumerForm.expiry_date) {
      setConsumerAlert({ type: 'danger', message: 'Expiry date is required' });
      return false;
    }
    if (!consumerForm.amount) {
      setConsumerAlert({ type: 'danger', message: 'Amount is required' });
      return false;
    }
    if (!consumerForm.contact_number.trim()) {
      setConsumerAlert({ type: 'danger', message: 'Contact number is required' });
      return false;
    }
    return true;
  };

  // Handle consumer form submission
  const handleSubmitConsumer = async (e) => {
    e.preventDefault();

    if (!validateConsumerForm()) {
      return;
    }

    setLoading(true);

    try {
      const consumerNumber = await generateConsumerNumber();

      const newConsumer = {
        consumer_number: consumerNumber,
        consumer_name: userInfo.name,
        reason: consumerForm.reason,
        expiry_date: consumerForm.expiry_date,
        email_address: userInfo.email,
        contact_number: consumerForm.contact_number,
        amount: parseFloat(consumerForm.amount),
        created_by: userInfo.name
      };

      const response = await api.post('/consumers/', newConsumer);

      setConsumerAlert({
        type: 'success',
        message: `Consumer ${response.data.consumer_number} created successfully!`
      });

      // Reset form
      setConsumerForm({
        reason: '',
        expiry_date: '',
        amount: '',
        contact_number: userInfo.contact
      });

      // Refresh consumers list
      fetchConsumers();

      // Clear alert after 5 seconds
      setTimeout(() => setConsumerAlert(null), 5000);
    } catch (error) {
      console.error('Error creating consumer:', error);
      setConsumerAlert({
        type: 'danger',
        message: error.response?.data?.detail || 'Failed to create consumer'
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle delete consumer
  const handleDeleteConsumer = async (consumerId) => {
    if (window.confirm(`Are you sure you want to delete this consumer?`)) {
      try {
        await api.delete(`/consumers/${consumerId}/`);

        setConsumerAlert({ type: 'info', message: 'Consumer deleted successfully' });
        fetchConsumers();
        setTimeout(() => setConsumerAlert(null), 3000);
      } catch (error) {
        console.error('Error deleting consumer:', error);
        setConsumerAlert({ type: 'danger', message: 'Failed to delete consumer' });
      }
    }
  };

  // Handle update bill status
  const handleUpdateBillStatus = async (consumerId, newStatus) => {
    try {
      await api.patch(`/consumers/${consumerId}/update_status/`,
        { bill_status: newStatus }
      );

      setConsumerAlert({
        type: 'success',
        message: `Bill status updated to ${newStatus === 'P' ? 'Paid' : newStatus === 'U' ? 'Unpaid' : 'Blocked'}`
      });
      fetchConsumers();
      setTimeout(() => setConsumerAlert(null), 3000);
    } catch (error) {
      console.error('Error updating bill status:', error);
      setConsumerAlert({ type: 'danger', message: 'Failed to update bill status' });
    }
  };

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
              <Card className="shadow-sm p-3">
                <Nav variant="tabs" activeKey={active} onSelect={(k) => setActive(k)} className="mb-3">
                  <Nav.Item>
                    <Nav.Link eventKey="consumers"><Users size={14} className="me-1" />Consumers</Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="settings"><Settings size={14} className="me-1" />Settings</Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="transactions"><FileText size={14} className="me-1" />Transactions</Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="webhooks"><Server size={14} className="me-1" />Webhooks</Nav.Link>
                  </Nav.Item>
                </Nav>

                {active === "consumers" && (
                  <div>
                    <Row className="align-items-center mb-3">
                      <Col><h5><Users size={18} className="me-2" />Consumer Management</h5></Col>
                      <Col className="text-end">
                        <small className="text-muted">
                          Logged in as: <strong>{userInfo.email}</strong>
                        </small>
                      </Col>
                    </Row>

                    {/* Consumer Creation Form */}
                    <Card className="mb-4 border-primary">
                      <Card.Header className="bg-primary text-white">
                        <h6 className="mb-0">Create New Consumer</h6>
                      </Card.Header>
                      <Card.Body>
                        {consumerAlert && (
                          <Alert variant={consumerAlert.type} dismissible onClose={() => setConsumerAlert(null)}>
                            {consumerAlert.message}
                          </Alert>
                        )}

                        <Form onSubmit={handleSubmitConsumer}>
                          <Row className="g-3">
                            {/* User Information Fields - Read Only */}
                            <Col md={4}>
                              <Form.Label>Name</Form.Label>
                              <Form.Control
                                type="text"
                                value={userInfo.name}
                                readOnly
                                className="bg-light"
                              />
                            </Col>
                            <Col md={4}>
                              <Form.Label>Email Address</Form.Label>
                              <Form.Control
                                type="email"
                                value={userInfo.email}
                                readOnly
                                className="bg-light"
                              />
                            </Col>
                            <Col md={4}>
                              <Form.Label>Contact Number *</Form.Label>
                              <Form.Control
                                type="tel"
                                placeholder="Enter contact number"
                                value={consumerForm.contact_number}
                                onChange={(e) => setConsumerForm({ ...consumerForm, contact_number: e.target.value })}
                              />
                              <Form.Text className="text-muted">
                                Enter the contact number for this bill
                              </Form.Text>
                            </Col>

                            {/* Consumer Bill Fields */}
                            <Col md={6}>
                              <Form.Label>Reason *</Form.Label>
                              <Form.Control
                                type="text"
                                placeholder="Enter reason for bill"
                                value={consumerForm.reason}
                                onChange={(e) => setConsumerForm({ ...consumerForm, reason: e.target.value })}
                              />
                            </Col>
                            <Col md={6}>
                              <Form.Label>Amount *</Form.Label>
                              <Form.Control
                                type="number"
                                step="0.01"
                                placeholder="Enter amount"
                                value={consumerForm.amount}
                                onChange={(e) => setConsumerForm({ ...consumerForm, amount: e.target.value })}
                              />
                            </Col>
                            <Col md={6}>
                              <Form.Label>Expiry Date *</Form.Label>
                              <Form.Control
                                type="date"
                                value={consumerForm.expiry_date}
                                onChange={(e) => setConsumerForm({ ...consumerForm, expiry_date: e.target.value })}
                              />
                              <Form.Text className="text-muted">
                                Bill will be blocked when expiry date passes
                              </Form.Text>
                            </Col>
                            <Col md={12} className="mt-3">
                              <div className="d-flex gap-2">
                                <Button type="submit" variant="primary" disabled={loading}>
                                  {loading ? 'Creating...' : 'Create Consumer'}
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline-secondary"
                                  onClick={() => setConsumerForm({
                                    reason: '',
                                    expiry_date: '',
                                    amount: '',
                                    contact_number: userInfo.contact
                                  })}
                                >
                                  Clear Form
                                </Button>
                              </div>
                            </Col>
                          </Row>
                        </Form>
                      </Card.Body>
                    </Card>

                    {/* Consumers Table */}
                    <Card>
                      <Card.Header>
                        <h6 className="mb-0">Consumer Records ({consumers.length})</h6>
                      </Card.Header>
                      <Card.Body>
                        {consumers.length === 0 ? (
                          <Alert variant="info" className="mb-0">
                            No consumers created yet. Use the form above to create your first consumer.
                          </Alert>
                        ) : (
                          <div className="table-responsive">
                            <Table hover striped size="sm">
                              <thead className="table-dark">
                                <tr>
                                  <th>Consumer Number</th>
                                  <th>Consumer Name</th>
                                  <th>Reason</th>
                                  <th>Expiry Date</th>
                                  <th>Email</th>
                                  <th>Contact</th>
                                  <th>Amount</th>
                                  <th>Bill Status</th>
                                  <th>Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {consumers.map((consumer) => (
                                  <tr key={consumer.id}>
                                    <td><Badge bg="primary">{consumer.consumer_number}</Badge></td>
                                    <td>{consumer.consumer_name}</td>
                                    <td>{consumer.reason}</td>
                                    <td>{consumer.expiry_date}</td>
                                    <td>{consumer.email_address}</td>
                                    <td>{consumer.contact_number}</td>
                                    <td><strong>{parseFloat(consumer.amount).toFixed(2)}</strong></td>
                                    <td>
                                      {getBillStatusBadge(consumer.bill_status)}
                                      {consumer.bill_status !== 'P' && (
                                        <div className="mt-1">
                                          <Form.Select
                                            size="sm"
                                            value={consumer.bill_status}
                                            onChange={(e) => handleUpdateBillStatus(consumer.id, e.target.value)}
                                            disabled={consumer.bill_status === 'B'}
                                          >
                                            <option value="U">Unpaid</option>
                                            <option value="P">Paid</option>
                                            <option value="B">Blocked</option>
                                          </Form.Select>
                                        </div>
                                      )}
                                    </td>
                                    <td>
                                      <div className="d-flex gap-1">
                                        <Button
                                          size="sm"
                                          variant="outline-info"
                                          onClick={() => setSelectedConsumer(consumer)}
                                        >
                                          <Eye size={14} />
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline-danger"
                                          onClick={() => handleDeleteConsumer(consumer.id)}
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

                    {/* View Consumer Modal */}
                    <Modal show={!!selectedConsumer} onHide={() => setSelectedConsumer(null)} size="lg">
                      <Modal.Header closeButton>
                        <Modal.Title>Consumer Details - {selectedConsumer?.consumer_number}</Modal.Title>
                      </Modal.Header>
                      <Modal.Body>
                        {selectedConsumer && (
                          <div>
                            <Row className="mb-2">
                              <Col md={6}><strong>Consumer Number:</strong></Col>
                              <Col md={6}><Badge bg="primary">{selectedConsumer.consumer_number}</Badge></Col>
                            </Row>
                            <Row className="mb-2">
                              <Col md={6}><strong>Consumer Name:</strong></Col>
                              <Col md={6}>{selectedConsumer.consumer_name}</Col>
                            </Row>
                            <Row className="mb-2">
                              <Col md={6}><strong>Reason:</strong></Col>
                              <Col md={6}>{selectedConsumer.reason}</Col>
                            </Row>
                            <Row className="mb-2">
                              <Col md={6}><strong>Expiry Date:</strong></Col>
                              <Col md={6}>{selectedConsumer.expiry_date}</Col>
                            </Row>
                            <Row className="mb-2">
                              <Col md={6}><strong>Email Address:</strong></Col>
                              <Col md={6}>{selectedConsumer.email_address}</Col>
                            </Row>
                            <Row className="mb-2">
                              <Col md={6}><strong>Contact Number:</strong></Col>
                              <Col md={6}>{selectedConsumer.contact_number}</Col>
                            </Row>
                            <Row className="mb-2">
                              <Col md={6}><strong>Amount:</strong></Col>
                              <Col md={6}><strong>{selectedConsumer.amount.toFixed(2)}</strong></Col>
                            </Row>
                            <Row className="mb-2">
                              <Col md={6}><strong>Bill Status:</strong></Col>
                              <Col md={6}>{getBillStatusBadge(selectedConsumer.bill_status)}</Col>
                            </Row>
                            <Row className="mb-2">
                              <Col md={6}><strong>Created By:</strong></Col>
                              <Col md={6}>{selectedConsumer.created_by}</Col>
                            </Row>
                            <Row className="mb-2">
                              <Col md={6}><strong>Created At:</strong></Col>
                              <Col md={6}>{new Date(selectedConsumer.created_at).toLocaleString()}</Col>
                            </Row>
                          </div>
                        )}
                      </Modal.Body>
                      <Modal.Footer>
                        <Button variant="secondary" onClick={() => setSelectedConsumer(null)}>Close</Button>
                      </Modal.Footer>
                    </Modal>
                  </div>
                )}

                {active === "settings" && (
                  <div>
                    <Row className="align-items-center mb-3">
                      <Col><h5><Settings size={18} className="me-2" />Kuickpay Settings <Badge bg="info">Demo</Badge></h5></Col>
                    </Row>
                    <form onSubmit={handleSaveSettings}>
                      <Row className="g-3">
                        <Col md={6}><Form.Label>Merchant ID</Form.Label><Form.Control value={config.merchant_id} onChange={(e) => setConfig(c => ({ ...c, merchant_id: e.target.value }))} /></Col>
                        <Col md={6}><Form.Label>API Key</Form.Label><Form.Control type="password" value={config.api_key} onChange={(e) => setConfig(c => ({ ...c, api_key: e.target.value }))} /></Col>
                        <Col md={4}><Form.Label>Mode</Form.Label><Form.Select value={config.mode} onChange={(e) => setConfig(c => ({ ...c, mode: e.target.value }))}><option value="test">Test</option><option value="live">Live</option></Form.Select></Col>
                        <Col md={8}><Form.Label>Webhook URL</Form.Label><Form.Control value={config.webhook_url} onChange={(e) => setConfig(c => ({ ...c, webhook_url: e.target.value }))} /></Col>
                        <Col md={12} className="mt-2"><div className="d-flex gap-2"><Button type="submit">Save</Button><Button variant="outline-secondary" onClick={() => setConfig({ merchant_id: "M-123", api_key: "sk_test_XXXX", mode: "test", webhook_url: "https://example.com/webhooks/kuickpay" })}>Reset</Button></div></Col>
                      </Row>
                    </form>
                  </div>
                )}

                {active === "transactions" && (
                  <div>
                    <Row className="align-items-center mb-3">
                      <Col><h5><FileText size={18} className="me-2" />Transactions</h5></Col>
                      <Col className="text-end"><Button variant="outline-secondary" size="sm"><BarChart2 size={14} className="me-1" />Export</Button></Col>
                    </Row>
                    <Row className="mb-3"><Col md={6}><InputGroup><InputGroup.Text><Search size={14} /></InputGroup.Text><Form.Control placeholder="Search transaction id, booking id, status" value={txQuery} onChange={(e) => setTxQuery(e.target.value)} /></InputGroup></Col></Row>
                    <Table hover responsive size="sm"><thead><tr><th>Transaction</th><th>Booking</th><th>Amount</th><th>Method</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead>
                      <tbody>
                        {transactions.filter(r => !txQuery || r.transaction_id.includes(txQuery) || r.booking_id.includes(txQuery) || r.status.includes(txQuery)).map(r => (
                          <tr key={r.transaction_id}><td>{r.transaction_id}</td><td>{r.booking_id}</td><td>{r.amount} {r.currency}</td><td>{r.payment_method}</td><td className="text-capitalize">{r.status}</td><td>{new Date(r.created_at).toLocaleString()}</td><td><Button size="sm" variant="outline-primary" onClick={() => setTxSelected(r)}>View</Button></td></tr>
                        ))}
                      </tbody>
                    </Table>

                    <Modal show={!!txSelected} onHide={() => setTxSelected(null)} size="lg">
                      <Modal.Header closeButton><Modal.Title>Transaction {txSelected?.transaction_id}</Modal.Title></Modal.Header>
                      <Modal.Body>{txSelected && <pre style={{ background: "#f8f9fa", padding: 12 }}>{JSON.stringify(txSelected, null, 2)}</pre>}</Modal.Body>
                      <Modal.Footer><Button variant="secondary" onClick={() => setTxSelected(null)}>Close</Button></Modal.Footer>
                    </Modal>
                  </div>
                )}

                {active === "webhooks" && (
                  <div>
                    <Row className="align-items-center mb-3"><Col><h5><Server size={18} className="me-2" />Webhook Logs</h5></Col><Col className="text-end"><small className="text-muted">Demo</small></Col></Row>
                    <Table hover responsive size="sm"><thead><tr><th>ID</th><th>Event</th><th>Received</th><th>Actions</th></tr></thead>
                      <tbody>
                        {webhooks.map(w => (
                          <tr key={w.id}><td>{w.id}</td><td>{w.event}</td><td>{new Date(w.received_at).toLocaleString()}</td><td><Button size="sm" onClick={() => setWhSelected(w)}>View</Button></td></tr>
                        ))}
                      </tbody>
                    </Table>

                    <Modal show={!!whSelected} onHide={() => setWhSelected(null)}>
                      <Modal.Header closeButton><Modal.Title>Webhook #{whSelected?.id}</Modal.Title></Modal.Header>
                      <Modal.Body><pre style={{ background: "#f8f9fa", padding: 12 }}>{JSON.stringify(whSelected, null, 2)}</pre></Modal.Body>
                      <Modal.Footer><Button variant="secondary" onClick={() => setWhSelected(null)}>Close</Button></Modal.Footer>
                    </Modal>
                  </div>
                )}

              </Card>
            </div>
          </div>
        </div>
      </div >
    </div >
  );
};

export default Kuickpay;
