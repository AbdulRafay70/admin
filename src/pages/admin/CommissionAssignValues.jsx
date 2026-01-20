import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Badge, Alert, Table } from 'react-bootstrap';
import { Save, ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Select from 'react-select';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import PartnersTabs from '../../components/PartnersTabs';
import axios from 'axios';

const CommissionAssignValues = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedGroupId = searchParams.get('group');

  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(preselectedGroupId || null);
  const [hotelsList, setHotelsList] = useState([]);
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    commission: {
      group_ticket_commission_amount: '',
      umrah_package_commission_amount: '',
    },
    hotel_night_commission: [
      {
        quint_per_night_commission: '',
        quad_per_night_commission: '',
        triple_per_night_commission: '',
        double_per_night_commission: '',
        sharing_per_night_commission: '',
        other_per_night_commission: '',
        commission_hotels: [],
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

  const fetchHotels = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:8000/api/hotels/', {
        params: organizationId ? { organization: organizationId } : {},
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = Array.isArray(res.data) ? res.data : Array.isArray(res.data?.results) ? res.data.results : [];
      const options = data.map((h) => ({ value: h.id, label: h.name || h.title || `Hotel ${h.id}` }));
      setHotelsList(options);
    } catch (e) {
      console.error('Failed to load hotels', e);
      setHotelsList([]);
    }
  };

  const fetchGroups = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:8000/api/commissions/rules', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = Array.isArray(res.data) ? res.data : Array.isArray(res.data?.results) ? res.data.results : [];
      setGroups(data);
    } catch (e) {
      console.error('Failed to load groups', e);
      setGroups([]);
    }
  };

  const loadGroupDetails = async (groupId) => {
    if (!groupId) return;
    setLoading(true);
    try {
      const res = await axios.get(`http://127.0.0.1:8000/api/commissions/rules/${groupId}/`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = res.data || {};
      setFormData({
        commission: {
          group_ticket_commission_amount: data.commission?.group_ticket_commission_amount || '',
          umrah_package_commission_amount: data.commission?.umrah_package_commission_amount || '',
        },
        hotel_night_commission:
          data.hotel_night_commission && data.hotel_night_commission.length > 0
            ? data.hotel_night_commission
            : [
              {
                quint_per_night_commission: '',
                quad_per_night_commission: '',
                triple_per_night_commission: '',
                double_per_night_commission: '',
                sharing_per_night_commission: '',
                other_per_night_commission: '',
                commission_hotels: [],
              },
            ],
      });
    } catch (e) {
      console.error('Failed to load group details', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedGroupId) {
      showAlert('danger', 'Please select a commission group first');
      return;
    }

    const payload = {
      commission: formData.commission,
      hotel_night_commission: formData.hotel_night_commission,
    };

    try {
      await axios.patch(`http://127.0.0.1:8000/api/commissions/rules/${selectedGroupId}/`, payload, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      showAlert('success', 'Commission values updated successfully');
    } catch (e) {
      console.error('Failed to update commission values', e);
      showAlert('danger', 'Failed to update commission values');
    }
  };

  const addHotelNightCommission = () => {
    setFormData({
      ...formData,
      hotel_night_commission: [
        ...formData.hotel_night_commission,
        {
          quint_per_night_commission: '',
          quad_per_night_commission: '',
          triple_per_night_commission: '',
          double_per_night_commission: '',
          sharing_per_night_commission: '',
          other_per_night_commission: '',
          commission_hotels: [],
        },
      ],
    });
  };

  const removeHotelNightCommission = (index) => {
    const updated = formData.hotel_night_commission.filter((_, i) => i !== index);
    setFormData({ ...formData, hotel_night_commission: updated });
  };

  const updateHotelNightCommission = (index, field, value) => {
    const updated = [...formData.hotel_night_commission];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, hotel_night_commission: updated });
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
              <PartnersTabs activeName="Commission Rules" />
            </Col>
          </Row>
          <Row className="mb-4">
            <Col>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h2 className="mb-1">Assign Commission Values</h2>
                  <p className="text-muted mb-0">Set commission amounts for groups and hotels</p>
                </div>
                <Button variant="outline-secondary" size="sm" onClick={() => navigate('/commission-management')}>
                  <ArrowLeft size={16} className="me-1" /> Back to Groups
                </Button>
              </div>
            </Col>
          </Row>

          <Card className="shadow-sm mb-4">
            <Card.Body>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">Select Commission Group *</Form.Label>
                <Form.Select
                  value={selectedGroupId || ''}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                >
                  <option value="">-- Select a group --</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({g.receiver_type})
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Card.Body>
          </Card>

          {selectedGroupId && !loading && (
            <>
              <Card className="shadow-sm mb-4">
                <Card.Header className="bg-light">
                  <h5 className="mb-0">Basic Commission</h5>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Group Ticket Commission Amount</Form.Label>
                        <Form.Control
                          type="number"
                          placeholder="Enter amount"
                          value={formData.commission.group_ticket_commission_amount}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              commission: { ...formData.commission, group_ticket_commission_amount: e.target.value },
                            })
                          }
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Umrah Package Commission Amount</Form.Label>
                        <Form.Control
                          type="number"
                          placeholder="Enter amount"
                          value={formData.commission.umrah_package_commission_amount}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              commission: { ...formData.commission, umrah_package_commission_amount: e.target.value },
                            })
                          }
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              <Card className="shadow-sm mb-4">
                <Card.Header className="bg-light d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Hotel Night Commission</h5>
                  <Button variant="primary" size="sm" onClick={addHotelNightCommission}>
                    <Plus size={16} className="me-1" /> Add Hotel Group
                  </Button>
                </Card.Header>
                <Card.Body>
                  {formData.hotel_night_commission.map((hnc, index) => (
                    <Card key={index} className="mb-3 border">
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <Badge bg="secondary">Hotel Group #{index + 1}</Badge>
                          {formData.hotel_night_commission.length > 1 && (
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => removeHotelNightCommission(index)}
                            >
                              <Trash2 size={14} className="me-1" /> Remove
                            </Button>
                          )}
                        </div>

                        <Row className="mb-3">
                          <Col md={4}>
                            <Form.Group>
                              <Form.Label>Quint Per Night</Form.Label>
                              <Form.Control
                                type="number"
                                placeholder="0"
                                value={hnc.quint_per_night_commission}
                                onChange={(e) =>
                                  updateHotelNightCommission(index, 'quint_per_night_commission', e.target.value)
                                }
                              />
                            </Form.Group>
                          </Col>
                          <Col md={4}>
                            <Form.Group>
                              <Form.Label>Quad Per Night</Form.Label>
                              <Form.Control
                                type="number"
                                placeholder="0"
                                value={hnc.quad_per_night_commission}
                                onChange={(e) =>
                                  updateHotelNightCommission(index, 'quad_per_night_commission', e.target.value)
                                }
                              />
                            </Form.Group>
                          </Col>
                          <Col md={4}>
                            <Form.Group>
                              <Form.Label>Triple Per Night</Form.Label>
                              <Form.Control
                                type="number"
                                placeholder="0"
                                value={hnc.triple_per_night_commission}
                                onChange={(e) =>
                                  updateHotelNightCommission(index, 'triple_per_night_commission', e.target.value)
                                }
                              />
                            </Form.Group>
                          </Col>
                        </Row>

                        <Row className="mb-3">
                          <Col md={4}>
                            <Form.Group>
                              <Form.Label>Double Per Night</Form.Label>
                              <Form.Control
                                type="number"
                                placeholder="0"
                                value={hnc.double_per_night_commission}
                                onChange={(e) =>
                                  updateHotelNightCommission(index, 'double_per_night_commission', e.target.value)
                                }
                              />
                            </Form.Group>
                          </Col>
                          <Col md={4}>
                            <Form.Group>
                              <Form.Label>Sharing Per Night</Form.Label>
                              <Form.Control
                                type="number"
                                placeholder="0"
                                value={hnc.sharing_per_night_commission}
                                onChange={(e) =>
                                  updateHotelNightCommission(index, 'sharing_per_night_commission', e.target.value)
                                }
                              />
                            </Form.Group>
                          </Col>
                          <Col md={4}>
                            <Form.Group>
                              <Form.Label>Other Per Night</Form.Label>
                              <Form.Control
                                type="number"
                                placeholder="0"
                                value={hnc.other_per_night_commission}
                                onChange={(e) =>
                                  updateHotelNightCommission(index, 'other_per_night_commission', e.target.value)
                                }
                              />
                            </Form.Group>
                          </Col>
                        </Row>

                        <Form.Group>
                          <Form.Label>Select Hotels for this Commission Group</Form.Label>
                          <Select
                            isMulti
                            options={hotelsList}
                            value={hotelsList.filter((h) => hnc.commission_hotels.includes(h.value))}
                            onChange={(selected) => {
                              const hotelIds = selected ? selected.map((s) => s.value) : [];
                              updateHotelNightCommission(index, 'commission_hotels', hotelIds);
                            }}
                            placeholder="Select hotels..."
                          />
                          <Form.Text className="text-muted">
                            These commission rates will apply to the selected hotels
                          </Form.Text>
                        </Form.Group>
                      </Card.Body>
                    </Card>
                  ))}
                </Card.Body>
              </Card>

              <div className="d-flex justify-content-end gap-2">
                <Button variant="secondary" onClick={() => navigate('/commission-management')}>
                  Cancel
                </Button>
                <Button variant="success" onClick={handleSave}>
                  <Save size={16} className="me-1" /> Save Commission Values
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

export default CommissionAssignValues;
