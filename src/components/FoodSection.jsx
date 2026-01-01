import React, { useState, useEffect } from "react";
import { Table, Button, Form, Badge, Row, Col, Alert, Spinner, InputGroup, Modal, Card } from "react-bootstrap";
import { Coffee, Edit3, Trash2 } from "lucide-react";
import PaxDetailsModal, { getPaxDetails } from "./PaxDetailsModal";
import AllPassengersModal from "./AllPassengersModal";
import axios from "axios";

const FoodSection = () => {
  const [foodData, setFoodData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [paxDetails, setPaxDetails] = useState(null);
  const [paxModalOpen, setPaxModalOpen] = useState(false);
  const [foodDetailsModal, setFoodDetailsModal] = useState({ show: false, data: null });

  useEffect(() => {
    fetchDeliveredBookings();
  }, [selectedDate]);

  const fetchDeliveredBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get('https://api.saer.pk/api/daily-operations/', {
        params: { date: selectedDate },
        headers: { Authorization: `Bearer ${token}` }
      });

      const transformedData = {
        date: selectedDate,
        meals: response.data.results.flatMap(booking =>
          booking.food_details?.map(food => ({
            id: food.id, // Capture Food ID
            booking_id: booking.booking_number,
            meal_type: food.food || 'N/A',
            time: 'N/A',
            menu: food.food || 'N/A',
            location: 'N/A',
            status: booking.status.toLowerCase(),
            pax_list: booking.person_details?.map(person => ({
              pax_id: `PAX-${person.id}`,
              first_name: person.first_name,
              last_name: person.last_name,
              contact: person.contact_number || '',
              contact_number: person.contact_number || '',
              person_title: person.person_title || '',
              country: person.country || '',
              contact_details: person.contact_details || [],
              passport_number: person.passport_number || '',
              date_of_birth: person.date_of_birth || '',
              age_group: person.age_group || '',
              is_family_head: person.is_family_head || false,
              food_status: person.food_status || 'Pending',
              activity_statuses: person.activity_statuses || [], // Capture distinct statuses
              status: person.food_status || 'Pending'
            })) || []
          })) || []
        )
      };

      setFoodData(transformedData);
    } catch (err) {
      console.error('Error fetching food data:', err);
      setError('Failed to load food data.');
    } finally {
      setLoading(false);
    }
  };

  const fetchPaxDetails = (paxId) => {
    const details = getPaxDetails(paxId);
    setPaxDetails(details);
    setPaxModalOpen(true);
  };

  const showAllPassengers = (booking) => {
    setPaxDetails({
      booking_id: booking.booking_id,
      activityId: booking.id, // Pass activity ID
      passengers: booking.pax_list || [],
      booking_data: {
        meal_type: booking.meal_type,
        time: booking.time,
        menu: booking.menu,
        location: booking.location
      }
    });
    setPaxModalOpen(true);
  };

  const statusVariant = (status) => {
    if (!status) return "secondary";
    const s = status.toLowerCase();
    if (s.includes("pending")) return "warning";
    if (s.includes("served") || s.includes("delivered")) return "success";
    if (s.includes("canceled")) return "danger";
    return "secondary";
  };

  const matchesSearch = (text) => {
    if (!search) return true;
    return (text || "").toString().toLowerCase().includes(search.toLowerCase());
  };

  const handleStatusUpdate = async (bookingId, paxId, status, activityId) => {
    try {
      const token = localStorage.getItem('accessToken');
      const cleanPaxId = paxId.replace('PAX-', '');

      await axios.patch('https://api.saer.pk/api/daily-operations/update-status/', {
        model_type: 'pax',
        item_id: cleanPaxId,
        status: status,
        status_field: 'food_status',
        activity_id: activityId,
        activity_type: 'food'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setFoodData((prev) => {
        const updatedMeals = prev.meals.map((f) => {
          if (f.booking_id === bookingId && f.id === activityId) {
            return {
              ...f,
              pax_list: f.pax_list.map(p => {
                if (p.pax_id === paxId) {
                  const updatedActivityStatuses = [
                    ...(p.activity_statuses || []).filter(s => s.activity_id !== activityId || s.activity_type !== 'bookingfooddetails'),
                    { activity_type: 'bookingfooddetails', activity_id: activityId, status: status }
                  ];
                  return { ...p, status, activity_statuses: updatedActivityStatuses };
                }
                return p;
              })
            };
          }
          return f;
        });

        if (paxDetails && paxDetails.booking_id === bookingId) {
          setPaxDetails(prev => ({
            ...prev,
            passengers: prev.passengers.map(p => {
              if (p.pax_id === paxId) {
                const updatedActivityStatuses = [
                  ...(p.activity_statuses || []).filter(s => s.activity_id !== activityId || s.activity_type !== 'bookingfooddetails'),
                  { activity_type: 'bookingfooddetails', activity_id: activityId, status: status }
                ];
                return { ...p, status, activity_statuses: updatedActivityStatuses };
              }
              return p;
            })
          }));
        }

        return { ...prev, meals: updatedMeals };
      });
    } catch (err) {
      console.error('Error updating food status:', err);
      alert('Failed to update status. Please try again.');
    }
  };

  return (
    <div>
      <h5 className="mb-3"><Coffee size={18} className="me-2" />Food / Meals (Delivered Bookings)</h5>

      {error && <Alert variant="danger">{error}</Alert>}

      <Row className="align-items-center mb-3">
        <Col md={3} className="mb-2 mb-md-0">
          <InputGroup>
            <InputGroup.Text>Date</InputGroup.Text>
            <Form.Control type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
          </InputGroup>
        </Col>
        <Col md={6} className="mb-2 mb-md-0">
          <Form.Control placeholder="Search by booking id, meal type..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </Col>
        <Col md={3} className="mb-2 mb-md-0">
          <Button variant="primary" onClick={fetchDeliveredBookings} disabled={loading} className="w-100">
            {loading ? <Spinner size="sm" /> : 'Refresh'}
          </Button>
        </Col>
      </Row>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" />
          <p className="mt-2">Loading food data...</p>
        </div>
      ) : (
        <Table hover responsive size="sm" className="align-middle">
          <thead>
            <tr>
              <th>Booking ID</th>
              <th>Food Item</th>
              <th>Status</th>
              <th>Pax</th>
            </tr>
          </thead>
          <tbody>
            {(foodData?.meals || []).filter(f => (
              matchesSearch(f.booking_id) || matchesSearch(f.meal_type) || (f.pax_list || []).some(p => matchesSearch(p.first_name) || matchesSearch(p.last_name))
            )).map((f, i) => (
              <tr key={i}>
                <td>{f.booking_id}</td>
                <td>
                  <span
                    onClick={() => setFoodDetailsModal({ show: true, data: f })}
                    style={{
                      color: '#0d6efd',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      fontWeight: '500'
                    }}
                  >
                    {f.meal_type}
                  </span>
                </td>
                <td>
                  {(() => {
                    const familyHead = (f.pax_list || []).find(p => p.is_family_head) || (f.pax_list || [])[0];
                    const granularStatus = familyHead?.activity_statuses?.find(s => s.activity_id === f.id && s.activity_type === 'bookingfooddetails')?.status;
                    const status = granularStatus || familyHead?.food_status || 'Pending';
                    return <Badge bg={statusVariant(status)} className="text-capitalize">{status}</Badge>;
                  })()}
                </td>
                <td>
                  {(() => {
                    const familyHead = (f.pax_list || []).find(p => p.is_family_head) || (f.pax_list || [])[0];
                    if (!familyHead) return <span className="text-muted">No passengers</span>;

                    return (
                      <div className="d-flex align-items-center gap-2">
                        <a
                          href="#"
                          onClick={(e) => { e.preventDefault(); showAllPassengers(f); }}
                          style={{ textDecoration: "none", fontWeight: "500", color: "#0d6efd" }}
                        >
                          {familyHead.first_name} {familyHead.last_name}
                        </a>
                        {(f.pax_list || []).length > 1 && (
                          <Badge bg="secondary" pill>{(f.pax_list || []).length}</Badge>
                        )}
                      </div>
                    );
                  })()}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <AllPassengersModal
        show={paxModalOpen}
        onHide={() => setPaxModalOpen(false)}
        paxDetails={paxDetails}
        sectionType="food"
        onStatusUpdate={handleStatusUpdate}
      />

      {/* Food Details Modal */}
      <Modal
        show={foodDetailsModal.show}
        onHide={() => setFoodDetailsModal({ show: false, data: null })}
        size="lg"
      >
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>
            <Coffee size={24} className="me-2" />
            Food Details
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {foodDetailsModal.data && (
            <Card className="border-0">
              <Card.Body>
                <Table bordered hover>
                  <tbody>
                    <tr>
                      <td style={{ width: "35%", backgroundColor: "#f8f9fa", fontWeight: "600" }}>
                        <Coffee size={18} className="me-2 text-primary" />
                        Booking ID
                      </td>
                      <td>{foodDetailsModal.data.booking_id}</td>
                    </tr>
                    <tr>
                      <td style={{ backgroundColor: "#f8f9fa", fontWeight: "600" }}>
                        <Coffee size={18} className="me-2 text-primary" />
                        Meal Type
                      </td>
                      <td>
                        <Badge bg="primary" className="fs-6">{foodDetailsModal.data.meal_type}</Badge>
                      </td>
                    </tr>
                    <tr>
                      <td style={{ backgroundColor: "#f8f9fa", fontWeight: "600" }}>
                        <Coffee size={18} className="me-2 text-primary" />
                        Time
                      </td>
                      <td>{foodDetailsModal.data.time || 'N/A'}</td>
                    </tr>
                    <tr>
                      <td style={{ backgroundColor: "#f8f9fa", fontWeight: "600" }}>
                        <Coffee size={18} className="me-2 text-primary" />
                        Menu
                      </td>
                      <td>{foodDetailsModal.data.menu || 'N/A'}</td>
                    </tr>
                    <tr>
                      <td style={{ backgroundColor: "#f8f9fa", fontWeight: "600" }}>
                        <Coffee size={18} className="me-2 text-primary" />
                        Location
                      </td>
                      <td>{foodDetailsModal.data.location || 'N/A'}</td>
                    </tr>
                    <tr>
                      <td style={{ backgroundColor: "#f8f9fa", fontWeight: "600" }}>
                        <Coffee size={18} className="me-2 text-primary" />
                        Status
                      </td>
                      <td>
                        {(() => {
                          const familyHead = (foodDetailsModal.data.pax_list || []).find(p => p.is_family_head) || (foodDetailsModal.data.pax_list || [])[0];
                          const status = familyHead?.food_status || 'Pending';
                          return (
                            <Badge bg={statusVariant(status)} className="text-capitalize">
                              {status}
                            </Badge>
                          );
                        })()}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ backgroundColor: "#f8f9fa", fontWeight: "600" }}>
                        <Coffee size={18} className="me-2 text-primary" />
                        Total Passengers
                      </td>
                      <td>
                        <Badge bg="info">{foodDetailsModal.data.pax_list?.length || 0}</Badge>
                      </td>
                    </tr>
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setFoodDetailsModal({ show: false, data: null })}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default FoodSection;
