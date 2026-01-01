import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Badge, Alert } from 'react-bootstrap';
import { Save, ArrowLeft } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import PartnersTabs from '../../components/PartnersTabs';
import axios from 'axios';

const MarkupAssignValues = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedGroupId = searchParams.get('group');

  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(preselectedGroupId || null);
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    applies_to: 'group_ticket',
    ticket_markup: 0,
    hotel_per_night_markup: 0,
    umrah_package_markup: 0,
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
      const res = await axios.get('https://api.saer.pk/api/markups/', {
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
      const res = await axios.get(`https://api.saer.pk/api/markups/${groupId}/`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = res.data || {};
      setFormData({
        name: data.name || '',
        applies_to: data.applies_to || 'group_ticket',
        ticket_markup: data.ticket_markup || 0,
        hotel_per_night_markup: data.hotel_per_night_markup || 0,
        umrah_package_markup: data.umrah_package_markup || 0,
      });
    } catch (e) {
      console.error('Failed to load group details', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedGroupId) {
      showAlert('danger', 'Please select a markup group first');
      return;
    }

    const payload = {
      name: formData.name,
      applies_to: formData.applies_to,
      ticket_markup: parseFloat(formData.ticket_markup) || 0,
      hotel_per_night_markup: parseFloat(formData.hotel_per_night_markup) || 0,
      umrah_package_markup: parseFloat(formData.umrah_package_markup) || 0,
      organization_id: organizationId,
    };

    try {
      await axios.patch(`https://api.saer.pk/api/markups/${selectedGroupId}/`, payload, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      showAlert('success', 'Markup values updated successfully');
    } catch (e) {
      console.error('Failed to update markup values', e);
      showAlert('danger', 'Failed to update markup values');
    }
  };

  const addHotelNightMarkup = () => {
    setFormData({
      ...formData,
      hotel_night_markup: [
        ...formData.hotel_night_markup,
        {
          quint_per_night_markup: '',
          quad_per_night_markup: '',
          triple_per_night_markup: '',
          double_per_night_markup: '',
          sharing_per_night_markup: '',
          other_per_night_markup: '',
          markup_hotels: [],
        },
      ],
    });
  };

  const removeHotelNightMarkup = (index) => {
    const updated = formData.hotel_night_markup.filter((_, i) => i !== index);
    setFormData({ ...formData, hotel_night_markup: updated });
  };

  const updateHotelNightMarkup = (index, field, value) => {
    const updated = [...formData.hotel_night_markup];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, hotel_night_markup: updated });
  };

  const selectedGroup = groups.find(g => g.id === parseInt(selectedGroupId));

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
              <PartnersTabs activeName="Markup" />
            </Col>
          </Row>

          <Row className="mb-4">
            <Col>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h2 className="mb-1">Assign Markup Values</h2>
                  <p className="text-muted mb-0">Set markup amounts for bookings, packages, and hotels</p>
                </div>
                <Button variant="outline-secondary" size="sm" onClick={() => navigate('/partners/markup')}>
                  <ArrowLeft size={16} className="me-1" /> Back to Groups
                </Button>
              </div>
            </Col>
          </Row>

          <Card className="shadow-sm mb-4">
            <Card.Body>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">Select Markup Group *</Form.Label>
                <Form.Select
                  value={selectedGroupId || ''}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                >
                  <option value="">-- Select a group --</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({g.applies_to})
                    </option>
                  ))}
                </Form.Select>
                {selectedGroup && (
                  <Form.Text className="text-muted">
                    <Badge bg="primary" className="me-2">{selectedGroup.applies_to}</Badge>
                  </Form.Text>
                )}
              </Form.Group>
            </Card.Body>
          </Card>

          {selectedGroupId && !loading && (
            <>
              <Card className="shadow-sm mb-4">
                <Card.Header className="bg-light">
                  <h5 className="mb-0">Markup Values</h5>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Ticket Markup</Form.Label>
                        <Form.Control
                          type="number"
                          placeholder="Enter ticket markup amount"
                          value={formData.ticket_markup}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              ticket_markup: e.target.value,
                            })
                          }
                        />
                        <Form.Text className="text-muted">
                          Markup amount for tickets
                        </Form.Text>
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Hotel Per Night Markup</Form.Label>
                        <Form.Control
                          type="number"
                          placeholder="Enter hotel per night markup"
                          value={formData.hotel_per_night_markup}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              hotel_per_night_markup: e.target.value,
                            })
                          }
                        />
                        <Form.Text className="text-muted">
                          Markup per hotel night
                        </Form.Text>
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Umrah Package Markup</Form.Label>
                        <Form.Control
                          type="number"
                          placeholder="Enter umrah package markup"
                          value={formData.umrah_package_markup}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              umrah_package_markup: e.target.value,
                            })
                          }
                        />
                        <Form.Text className="text-muted">
                          Markup for umrah packages
                        </Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              <div className="d-flex justify-content-end gap-2">
                <Button variant="secondary" onClick={() => navigate('/markup-management')}>
                  Cancel
                </Button>
                <Button variant="success" onClick={handleSave}>
                  <Save size={16} className="me-1" /> Save Markup Values
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

export default MarkupAssignValues;
