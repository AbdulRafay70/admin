import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Button, Form, Badge, Alert } from 'react-bootstrap';
import { Save, ArrowLeft, X } from 'lucide-react';
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
  const [hotels, setHotels] = useState([]); // NEW: Store hotels
  const [selectedHotels, setSelectedHotels] = useState([]); // Array of hotel objects {id, name}
  const [isHotelDropdownOpen, setIsHotelDropdownOpen] = useState(false);
  const hotelDropdownRef = useRef(null);

  const [selectedGroupId, setSelectedGroupId] = useState(preselectedGroupId || null);
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    applies_to: 'group_ticket',
    ticket_markup: 0,
    hotel_per_night_markup: 0,
    umrah_package_markup: 0,
    // Single set of detailed markup values for ALL selected hotels
    quint_per_night_markup: 0,
    quad_per_night_markup: 0,
    triple_per_night_markup: 0,
    double_per_night_markup: 0,
    sharing_per_night_markup: 0,
    other_per_night_markup: 0,
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
    fetchHotels(); // NEW
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
      const res = await axios.get('http://127.0.0.1:8000/api/markups/', {
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
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = Array.isArray(res.data) ? res.data : (Array.isArray(res.data?.results) ? res.data.results : []);
      setHotels(data);
    } catch (e) {
      console.error('Failed to load hotels', e);
    }
  };

  const loadGroupDetails = async (groupId) => {
    if (!groupId) return;
    setLoading(true);
    try {
      const res = await axios.get(`http://127.0.0.1:8000/api/markups/${groupId}/`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = res.data || {};
      // Extract existing hotel markups
      const hotelMarkups = data.hotel_markups || [];
      const firstMarkup = hotelMarkups.length > 0 ? hotelMarkups[0] : {};

      // Collect all hotels involved
      const existingHotels = hotelMarkups.map(hm => ({
        id: hm.hotel,
        name: hm.hotel_name || `Hotel ${hm.hotel}` // Fallback name if needed
      }));
      // Remove duplicates just in case
      const uniqueHotels = Array.from(new Map(existingHotels.map(item => [item.id, item])).values());

      setSelectedHotels(uniqueHotels);

      setFormData({
        name: data.name || '',
        applies_to: data.applies_to || 'group_ticket',
        ticket_markup: data.ticket_markup || 0,
        hotel_per_night_markup: data.hotel_per_night_markup || 0,
        umrah_package_markup: data.umrah_package_markup || 0,
        // Load details from the first entry (assuming uniform) or default to 0
        quint_per_night_markup: firstMarkup.quint || 0,
        quad_per_night_markup: firstMarkup.quad || 0,
        triple_per_night_markup: firstMarkup.triple || 0,
        double_per_night_markup: firstMarkup.double || 0,
        sharing_per_night_markup: firstMarkup.sharing || 0,
        other_per_night_markup: firstMarkup.other || 0,
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
      // Create a MarkupHotel entry for EACH selected hotel with SAME values
      hotel_markups: selectedHotels.map(h => ({
        hotel: h.id,
        quint: parseFloat(formData.quint_per_night_markup) || 0,
        quad: parseFloat(formData.quad_per_night_markup) || 0,
        triple: parseFloat(formData.triple_per_night_markup) || 0,
        double: parseFloat(formData.double_per_night_markup) || 0,
        sharing: parseFloat(formData.sharing_per_night_markup) || 0,
        other: parseFloat(formData.other_per_night_markup) || 0,
      }))
    };

    try {
      await axios.patch(`http://127.0.0.1:8000/api/markups/${selectedGroupId}/`, payload, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      showAlert('success', 'Markup values updated successfully');
    } catch (e) {
      console.error('Failed to update markup values', e);
      showAlert('danger', 'Failed to update markup values');
    }
  };

  const toggleHotelSelection = (hotel) => {
    const exists = selectedHotels.find(h => h.id === hotel.id);
    if (exists) {
      setSelectedHotels(selectedHotels.filter(h => h.id !== hotel.id));
    } else {
      setSelectedHotels([...selectedHotels, { id: hotel.id, name: hotel.name }]);
    }
  };

  const removeHotel = (id) => {
    setSelectedHotels(selectedHotels.filter(h => h.id !== id));
  };

  useEffect(() => {
    fetchGroups();
    fetchHotels();

    // Click outside handler for dropdown
    const handleClickOutside = (event) => {
      if (hotelDropdownRef.current && !hotelDropdownRef.current.contains(event.target)) {
        setIsHotelDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (preselectedGroupId) {
      loadGroupDetails(preselectedGroupId);
    }
  }, [preselectedGroupId]);

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
                  <Row className="mb-4 text-muted border-bottom pb-4">
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Group Name</Form.Label>
                        <Form.Control
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Applies To</Form.Label>
                        <Form.Control
                          type="text"
                          value={formData.applies_to}
                          onChange={(e) => setFormData({ ...formData, applies_to: e.target.value })}
                          placeholder="e.g. group_ticket, hotel, umrah_package"
                        />
                        <Form.Text className="text-muted">
                          Tag what this group is for (optional)
                        </Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Ticket Markup</Form.Label>
                        <Form.Control
                          type="number"
                          placeholder="0"
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
                        <Form.Label>Umrah Package Markup</Form.Label>
                        <Form.Control
                          type="number"
                          placeholder="0"
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

                  {/* Detailed Hotel Markups Section - Multi Select */}
                  <div className="mt-5 border-top pt-4">
                    <h6 className="mb-3 fw-bold">Hotel Night Discounts (Applies to Selected Hotels)</h6>

                    <Row className="g-3">
                      <Col md={12}>
                        <Form.Group ref={hotelDropdownRef} className="position-relative">
                          <Form.Label className="fw-bold">Select Hotels</Form.Label>

                          {/* Custom Multi-Select Trigger */}
                          <div
                            className="form-control d-flex flex-wrap gap-2 align-items-center"
                            style={{ minHeight: '38px', cursor: 'text' }}
                            onClick={() => setIsHotelDropdownOpen(true)}
                          >
                            {selectedHotels.length === 0 && <span className="text-muted small">Select hotels...</span>}
                            {selectedHotels.map(h => (
                              <Badge key={h.id} bg="primary" className="d-flex align-items-center gap-1 py-2 px-3">
                                {h.name}
                                <X
                                  size={14}
                                  style={{ cursor: 'pointer' }}
                                  onClick={(e) => { e.stopPropagation(); removeHotel(h.id); }}
                                />
                              </Badge>
                            ))}
                          </div>

                          {/* Dropdown Menu */}
                          {isHotelDropdownOpen && (
                            <div className="position-absolute w-100 bg-white border rounded shadow-sm mt-1 z-3" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                              {hotels.length > 0 ? (
                                hotels.map(h => {
                                  const isSelected = selectedHotels.some(sh => sh.id === h.id);
                                  return (
                                    <div
                                      key={h.id}
                                      className={`px-3 py-2 cursor-pointer ${isSelected ? 'bg-light' : ''}`}
                                      style={{ cursor: 'pointer' }}
                                      onClick={() => toggleHotelSelection(h)}
                                    >
                                      <div className="d-flex align-items-center gap-2">
                                        <input type="checkbox" checked={isSelected} readOnly />
                                        <span>{h.name} <span className="text-muted small">({h.city_name || h.city})</span></span>
                                      </div>
                                    </div>
                                  );
                                })
                              ) : (
                                <div className="px-3 py-2 text-muted">No hotels found</div>
                              )}
                            </div>
                          )}
                        </Form.Group>
                      </Col>

                      <Col md={4}>
                        <Form.Group>
                          <Form.Label className="small">Quint Per Night Discount</Form.Label>
                          <Form.Control
                            type="number"
                            value={formData.quint_per_night_markup}
                            onChange={(e) => setFormData({ ...formData, quint_per_night_markup: e.target.value })}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group>
                          <Form.Label className="small">Quad Per Night Discount</Form.Label>
                          <Form.Control
                            type="number"
                            value={formData.quad_per_night_markup}
                            onChange={(e) => setFormData({ ...formData, quad_per_night_markup: e.target.value })}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group>
                          <Form.Label className="small">Triple Per Night Discount</Form.Label>
                          <Form.Control
                            type="number"
                            value={formData.triple_per_night_markup}
                            onChange={(e) => setFormData({ ...formData, triple_per_night_markup: e.target.value })}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group>
                          <Form.Label className="small">Double Per Night Discount</Form.Label>
                          <Form.Control
                            type="number"
                            value={formData.double_per_night_markup}
                            onChange={(e) => setFormData({ ...formData, double_per_night_markup: e.target.value })}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group>
                          <Form.Label className="small">Sharing Per Night Discount</Form.Label>
                          <Form.Control
                            type="number"
                            value={formData.sharing_per_night_markup}
                            onChange={(e) => setFormData({ ...formData, sharing_per_night_markup: e.target.value })}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group>
                          <Form.Label className="small">Other Per Night Discount</Form.Label>
                          <Form.Control
                            type="number"
                            value={formData.other_per_night_markup}
                            onChange={(e) => setFormData({ ...formData, other_per_night_markup: e.target.value })}
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  </div>

                </Card.Body>
              </Card>

              <div className="d-flex justify-content-end gap-2 mt-4 border-top pt-3">
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
