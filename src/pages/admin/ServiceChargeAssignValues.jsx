import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Badge, Alert, Nav, Tab } from 'react-bootstrap';
import { Save, ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Select from 'react-select';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import PartnersTabs from '../../components/PartnersTabs';
import axios from 'axios';

const ServiceChargeAssignValues = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedGroupId = searchParams.get('group');

  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(preselectedGroupId || null);
  const [hotels, setHotels] = useState([]);
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('tickets');

  const [formData, setFormData] = useState({
    // Tickets - applied to ALL tickets
    ticket_charge_type: 'fixed',
    ticket_charge_value: '',

    // Packages - applied to ALL packages (fixed only)
    package_charge_value: '',

    // Hotels - room type based, can select specific hotels
    hotel_charges: [
      {
        quint_charge: '',
        quad_charge: '',
        triple_charge: '',
        double_charge: '',
        sharing_charge: '',
        other_charge: '',
        hotel_ids: [],
      },
    ],
  });

  const token = localStorage.getItem('accessToken');
  const orgDataRaw = localStorage.getItem('selectedOrganization');
  let organizationId = null;
  try {
    const parsed = orgDataRaw ? JSON.parse(orgDataRaw) : null;
    organizationId = parsed?.id ?? null;
  } catch (e) {
    organizationId = null;
  }

  useEffect(() => {
    fetchGroups();
    fetchHotels();
  }, []);

  useEffect(() => {
    if (selectedGroupId) {
      loadGroupDetails(selectedGroupId);
    }
  }, [selectedGroupId]);

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 3000);
  };

  const fetchGroups = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:8000/api/service-charges/service-charges/', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = Array.isArray(res.data) ? res.data : Array.isArray(res.data?.results) ? res.data.results : [];
      setGroups(data);
    } catch (e) {
      console.error('Failed to load groups', e);
      setGroups([]);
    }
  };

  const fetchHotels = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:8000/api/hotels/', {
        params: organizationId ? { organization: organizationId } : {},
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = Array.isArray(res.data) ? res.data : Array.isArray(res.data?.results) ? res.data.results : [];
      const options = data.map((h) => ({ value: h.id, label: h.name || h.title || `Hotel ${h.id}` }));
      setHotels(options);
    } catch (e) {
      console.error('Failed to load hotels', e);
      setHotels([]);
    }
  };

  const loadGroupDetails = async (groupId) => {
    if (!groupId) return;
    setLoading(true);
    try {
      // Load service charge rule
      const ruleRes = await axios.get(`http://127.0.0.1:8000/api/service-charges/service-charges/${groupId}/`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const ruleData = ruleRes.data || {};

      // Load hotel charges for this rule
      const hotelRes = await axios.get('http://127.0.0.1:8000/api/service-charges/hotel-charges/', {
        params: { service_charge_rule: groupId },
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const hotelCharges = Array.isArray(hotelRes.data) ? hotelRes.data :
        Array.isArray(hotelRes.data?.results) ? hotelRes.data.results : [];

      setFormData({
        ticket_charge_type: ruleData.ticket_charge_type || 'fixed',
        ticket_charge_value: parseInt(ruleData.ticket_charge_value) || '',
        package_charge_value: parseInt(ruleData.package_charge_value) || '',
        hotel_charges: hotelCharges.length > 0 ? hotelCharges.map(hc => ({
          id: hc.id,
          quint_charge: parseInt(hc.quint_charge) || '',
          quad_charge: parseInt(hc.quad_charge) || '',
          triple_charge: parseInt(hc.triple_charge) || '',
          double_charge: parseInt(hc.double_charge) || '',
          sharing_charge: parseInt(hc.sharing_charge) || '',
          other_charge: parseInt(hc.other_charge) || '',
          hotel_ids: hc.hotel_ids || [],
        })) : [{
          quint_charge: '',
          quad_charge: '',
          triple_charge: '',
          double_charge: '',
          sharing_charge: '',
          other_charge: '',
          hotel_ids: [],
        }],
      });
    } catch (e) {
      console.error('Failed to load group details', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedGroupId) {
      showAlert('danger', 'Please select a service charge group first');
      return;
    }

    try {
      // Update service charge rule (tickets and packages)
      await axios.patch(`http://127.0.0.1:8000/api/service-charges/service-charges/${selectedGroupId}/`, {
        ticket_charge_type: formData.ticket_charge_type,
        ticket_charge_value: parseInt(formData.ticket_charge_value) || 0,
        package_charge_value: parseInt(formData.package_charge_value) || 0,
      }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      // Delete existing hotel charges and create new ones
      const existingHotelCharges = formData.hotel_charges.filter(hc => hc.id);
      if (existingHotelCharges.length > 0) {
        await axios.delete('http://127.0.0.1:8000/api/service-charges/hotel-charges/bulk_delete/', {
          data: { ids: existingHotelCharges.map(hc => hc.id) },
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
      }

      // Create new hotel charges
      for (const hotelCharge of formData.hotel_charges) {
        if (hotelCharge.hotel_ids.length > 0) {
          await axios.post('http://127.0.0.1:8000/api/service-charges/hotel-charges/', {
            service_charge_rule: selectedGroupId,
            quint_charge: parseFloat(hotelCharge.quint_charge) || 0,
            quad_charge: parseFloat(hotelCharge.quad_charge) || 0,
            triple_charge: parseFloat(hotelCharge.triple_charge) || 0,
            double_charge: parseFloat(hotelCharge.double_charge) || 0,
            sharing_charge: parseFloat(hotelCharge.sharing_charge) || 0,
            other_charge: parseFloat(hotelCharge.other_charge) || 0,
            hotel_ids: hotelCharge.hotel_ids,
            active: true,
          }, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
        }
      }

      showAlert('success', 'Service charge values saved successfully');
      loadGroupDetails(selectedGroupId); // Reload to get IDs
    } catch (e) {
      console.error('Failed to save service charges', e);
      showAlert('danger', 'Failed to save service charge values');
    }
  };

  const addHotelGroup = () => {
    setFormData({
      ...formData,
      hotel_charges: [
        ...formData.hotel_charges,
        {
          quint_charge: '',
          quad_charge: '',
          triple_charge: '',
          double_charge: '',
          sharing_charge: '',
          other_charge: '',
          hotel_ids: [],
        },
      ],
    });
  };

  const removeHotelGroup = (index) => {
    const updated = formData.hotel_charges.filter((_, i) => i !== index);
    setFormData({ ...formData, hotel_charges: updated });
  };

  const updateHotelCharge = (index, field, value) => {
    const updated = [...formData.hotel_charges];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, hotel_charges: updated });
  };

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="flex-grow-1">
        <Header />
        <Container fluid className="py-4">
          {alert && (
            <Alert variant={alert.type} onClose={() => setAlert(null)} dismissible className="mb-4">
              {alert.message}
            </Alert>
          )}

          <Row className="mb-3">
            <Col>
              <PartnersTabs activeName="Service Charges" />
            </Col>
          </Row>

          <Row className="mb-4">
            <Col>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h2 className="mb-1">Assign Service Charge Values</h2>
                  <p className="text-muted mb-0">Set service charges for tickets, packages, and hotels</p>
                </div>
                <Button variant="outline-secondary" size="sm" onClick={() => navigate('/partners/service-charges')}>
                  <ArrowLeft size={16} className="me-1" /> Back to Groups
                </Button>
              </div>
            </Col>
          </Row>

          <Card className="shadow-sm mb-4">
            <Card.Body>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">Select Service Charge Group *</Form.Label>
                <Form.Select
                  value={selectedGroupId || ''}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                >
                  <option value="">-- Select a group --</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Card.Body>
          </Card>

          {selectedGroupId && !loading && (
            <>
              <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
                <Card className="shadow-sm mb-4">
                  <Card.Header className="bg-light">
                    <Nav variant="tabs" className="border-0">
                      <Nav.Item>
                        <Nav.Link eventKey="tickets">Tickets</Nav.Link>
                      </Nav.Item>
                      <Nav.Item>
                        <Nav.Link eventKey="packages">Packages</Nav.Link>
                      </Nav.Item>
                      <Nav.Item>
                        <Nav.Link eventKey="hotels">
                          Hotels
                          {formData.hotel_charges.length > 0 && (
                            <Badge bg="primary" className="ms-2">{formData.hotel_charges.length}</Badge>
                          )}
                        </Nav.Link>
                      </Nav.Item>
                    </Nav>
                  </Card.Header>
                  <Card.Body>
                    <Tab.Content>
                      {/* Tickets Tab - Applied to ALL tickets */}
                      <Tab.Pane eventKey="tickets">
                        <Alert variant="info" className="mb-3">
                          <strong>Note:</strong> These charges will be applied to ALL tickets automatically.
                        </Alert>
                        <Row>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>Charge Type *</Form.Label>
                              <Form.Select
                                value={formData.ticket_charge_type}
                                onChange={(e) =>
                                  setFormData({ ...formData, ticket_charge_type: e.target.value })
                                }
                              >
                                <option value="fixed">Fixed Amount</option>
                                <option value="percentage">Percentage</option>
                              </Form.Select>
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>Charge Value *</Form.Label>
                              <Form.Control
                                type="number"
                                placeholder={formData.ticket_charge_type === 'percentage' ? 'e.g. 5' : 'e.g. 500'}
                                value={formData.ticket_charge_value}
                                onChange={(e) =>
                                  setFormData({ ...formData, ticket_charge_value: e.target.value })
                                }
                              />
                              <Form.Text className="text-muted">
                                {formData.ticket_charge_type === 'percentage' ? 'Enter percentage (e.g., 5 for 5%)' : 'Enter amount in PKR'}
                              </Form.Text>
                            </Form.Group>
                          </Col>
                        </Row>
                      </Tab.Pane>

                      {/* Packages Tab - Applied to ALL packages, fixed only */}
                      <Tab.Pane eventKey="packages">
                        <Alert variant="info" className="mb-3">
                          <strong>Note:</strong> This fixed charge will be applied to ALL packages automatically.
                        </Alert>
                        <Row>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>Package Charge (Fixed Amount) *</Form.Label>
                              <Form.Control
                                type="number"
                                placeholder="e.g. 1000"
                                value={formData.package_charge_value}
                                onChange={(e) =>
                                  setFormData({ ...formData, package_charge_value: e.target.value })
                                }
                              />
                              <Form.Text className="text-muted">
                                Enter fixed amount in PKR
                              </Form.Text>
                            </Form.Group>
                          </Col>
                        </Row>
                      </Tab.Pane>

                      {/* Hotels Tab - Room type based, select specific hotels */}
                      <Tab.Pane eventKey="hotels">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <Alert variant="info" className="mb-0 flex-grow-1 me-3">
                            <strong>Note:</strong> Create hotel groups with room type charges. You can add multiple groups for different hotels.
                          </Alert>
                          <Button variant="primary" size="sm" onClick={addHotelGroup}>
                            <Plus size={16} className="me-1" /> Add Hotel Group
                          </Button>
                        </div>

                        {formData.hotel_charges.map((hotelCharge, index) => (
                          <Card key={index} className="mb-3 border">
                            <Card.Body>
                              <div className="d-flex justify-content-between align-items-center mb-3">
                                <Badge bg="secondary">Hotel Group #{index + 1}</Badge>
                                {formData.hotel_charges.length > 1 && (
                                  <Button
                                    variant="outline-danger"
                                    size="sm"
                                    onClick={() => removeHotelGroup(index)}
                                  >
                                    <Trash2 size={14} className="me-1" /> Remove
                                  </Button>
                                )}
                              </div>

                              <Row className="mb-3">
                                <Col md={4}>
                                  <Form.Group>
                                    <Form.Label>Quint Charge</Form.Label>
                                    <Form.Control
                                      type="number"
                                      placeholder="0"
                                      value={hotelCharge.quint_charge}
                                      onChange={(e) =>
                                        updateHotelCharge(index, 'quint_charge', e.target.value)
                                      }
                                    />
                                  </Form.Group>
                                </Col>
                                <Col md={4}>
                                  <Form.Group>
                                    <Form.Label>Quad Charge</Form.Label>
                                    <Form.Control
                                      type="number"
                                      placeholder="0"
                                      value={hotelCharge.quad_charge}
                                      onChange={(e) =>
                                        updateHotelCharge(index, 'quad_charge', e.target.value)
                                      }
                                    />
                                  </Form.Group>
                                </Col>
                                <Col md={4}>
                                  <Form.Group>
                                    <Form.Label>Triple Charge</Form.Label>
                                    <Form.Control
                                      type="number"
                                      placeholder="0"
                                      value={hotelCharge.triple_charge}
                                      onChange={(e) =>
                                        updateHotelCharge(index, 'triple_charge', e.target.value)
                                      }
                                    />
                                  </Form.Group>
                                </Col>
                              </Row>

                              <Row className="mb-3">
                                <Col md={4}>
                                  <Form.Group>
                                    <Form.Label>Double Charge</Form.Label>
                                    <Form.Control
                                      type="number"
                                      placeholder="0"
                                      value={hotelCharge.double_charge}
                                      onChange={(e) =>
                                        updateHotelCharge(index, 'double_charge', e.target.value)
                                      }
                                    />
                                  </Form.Group>
                                </Col>
                                <Col md={4}>
                                  <Form.Group>
                                    <Form.Label>Sharing Charge</Form.Label>
                                    <Form.Control
                                      type="number"
                                      placeholder="0"
                                      value={hotelCharge.sharing_charge}
                                      onChange={(e) =>
                                        updateHotelCharge(index, 'sharing_charge', e.target.value)
                                      }
                                    />
                                  </Form.Group>
                                </Col>
                                <Col md={4}>
                                  <Form.Group>
                                    <Form.Label>Other Charge</Form.Label>
                                    <Form.Control
                                      type="number"
                                      placeholder="0"
                                      value={hotelCharge.other_charge}
                                      onChange={(e) =>
                                        updateHotelCharge(index, 'other_charge', e.target.value)
                                      }
                                    />
                                  </Form.Group>
                                </Col>
                              </Row>

                              <Form.Group>
                                <Form.Label>Select Hotels for this Group *</Form.Label>
                                <Select
                                  isMulti
                                  options={hotels.filter((h) => {
                                    // Exclude hotels already selected in OTHER groups
                                    const selectedInOtherGroups = formData.hotel_charges
                                      .filter((_, i) => i !== index) // Exclude current group
                                      .flatMap(hc => hc.hotel_ids);
                                    return !selectedInOtherGroups.includes(h.value);
                                  })}
                                  value={hotels.filter((h) => hotelCharge.hotel_ids.includes(h.value))}
                                  onChange={(selected) => {
                                    const hotelIds = selected ? selected.map((s) => s.value) : [];
                                    updateHotelCharge(index, 'hotel_ids', hotelIds);
                                  }}
                                  placeholder="Select hotels..."
                                />
                                <Form.Text className="text-muted">
                                  These room type charges will apply to the selected hotels. Hotels already assigned to other groups are not shown.
                                </Form.Text>
                              </Form.Group>
                            </Card.Body>
                          </Card>
                        ))}
                      </Tab.Pane>
                    </Tab.Content>
                  </Card.Body>
                </Card>
              </Tab.Container>

              <div className="d-flex justify-content-end gap-2">
                <Button variant="secondary" onClick={() => navigate('/partners/service-charges')}>
                  Cancel
                </Button>
                <Button variant="success" onClick={handleSave}>
                  <Save size={16} className="me-1" /> Save Service Charge Values
                </Button>
              </div>
            </>
          )}

          {loading && (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          )}
        </Container>
      </div>
    </div>
  );
};

export default ServiceChargeAssignValues;
