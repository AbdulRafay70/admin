import React, { useState, useEffect } from "react";
import { Table, Button, Form, Badge, Row, Col, Alert, Spinner, InputGroup, Modal, Card } from "react-bootstrap";
import { MapPin, Edit3, Trash2 } from "lucide-react";
import PaxDetailsModal, { getPaxDetails } from "./PaxDetailsModal";
import AllPassengersModal from "./AllPassengersModal";
import axios from "axios";

const ZiyaratSection = () => {
  const [ziyaratData, setZiyaratData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [paxDetails, setPaxDetails] = useState(null);
  const [paxModalOpen, setPaxModalOpen] = useState(false);
  const [ziyaratDetailsModal, setZiyaratDetailsModal] = useState({ show: false, data: null });

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
        ziyarats: response.data.results.flatMap(booking =>
          booking.ziyarat_details?.map(ziyarat => ({
            id: ziyarat.id, // Capture Ziyarat ID
            booking_id: booking.booking_number,
            location: ziyarat.ziarat || 'N/A',
            city: ziyarat.city || 'N/A',
            pickup_time: ziyarat.date || 'N/A',
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
              ziyarat_status: person.ziyarat_status || 'Pending',
              activity_statuses: person.activity_statuses || [], // Capture distinct activity statuses
              status: person.ziyarat_status || 'Pending'
            })) || []
          })) || []
        )
      };

      setZiyaratData(transformedData);
    } catch (err) {
      console.error('Error fetching ziyarat data:', err);
      setError('Failed to load ziyarat data.');
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
      activityId: booking.id, // Pass activity ID to modal
      passengers: booking.pax_list || [],
      booking_data: {
        location: booking.location,
        city: booking.city,
        pickup_time: booking.pickup_time
      }
    });
    setPaxModalOpen(true);
  };

  const statusVariant = (status) => {
    if (!status) return "secondary";
    const s = status.toLowerCase();
    if (s.includes("pending")) return "warning";
    if (s.includes("started")) return "info";
    if (s.includes("completed") || s.includes("delivered")) return "success";
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
        status_field: 'ziyarat_status',
        activity_id: activityId, // Pass activity ID
        activity_type: 'ziyarat' // Pass activity type
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setZiyaratData((prev) => {
        const updatedZiyarats = prev.ziyarats.map((z) => {
          if (z.booking_id === bookingId && z.id === activityId) {
            return {
              ...z,
              pax_list: z.pax_list.map(p => {
                if (p.pax_id === paxId) {
                  // Update local activity status list
                  const updatedActivityStatuses = [
                    ...(p.activity_statuses || []).filter(s => s.activity_id !== activityId || s.activity_type !== 'bookingziyaratdetails'),
                    { activity_type: 'bookingziyaratdetails', activity_id: activityId, status: status }
                  ];
                  return { ...p, status, activity_statuses: updatedActivityStatuses };
                }
                return p;
              })
            };
          }
          return z;
        });

        if (paxDetails && paxDetails.booking_id === bookingId) {
          setPaxDetails(prev => ({
            ...prev,
            passengers: prev.passengers.map(p => {
              if (p.pax_id === paxId) {
                const updatedActivityStatuses = [
                  ...(p.activity_statuses || []).filter(s => s.activity_id !== activityId || s.activity_type !== 'bookingziyaratdetails'),
                  { activity_type: 'bookingziyaratdetails', activity_id: activityId, status: status }
                ];
                return { ...p, status, activity_statuses: updatedActivityStatuses };
              }
              return p;
            })
          }));
        }

        return { ...prev, ziyarats: updatedZiyarats };
      });
    } catch (err) {
      console.error('Error updating ziyarat status:', err);
      alert('Failed to update status. Please try again.');
    }
  };

  return (
    <div>
      <h5 className="mb-3"><MapPin size={18} className="me-2" />Ziyarat (Delivered Bookings)</h5>

      {error && <Alert variant="danger">{error}</Alert>}

      <Row className="align-items-center mb-3">
        <Col md={3} className="mb-2 mb-md-0">
          <InputGroup>
            <InputGroup.Text>Date</InputGroup.Text>
            <Form.Control type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
          </InputGroup>
        </Col>
        <Col md={6} className="mb-2 mb-md-0">
          <Form.Control placeholder="Search by booking id, location, pax..." value={search} onChange={(e) => setSearch(e.target.value)} />
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
          <p className="mt-2">Loading ziyarat data...</p>
        </div>
      ) : (
        <Table hover responsive size="sm" className="align-middle">
          <thead>
            <tr>
              <th>Booking ID</th>
              <th>Location</th>
              <th>City</th>
              <th>Date</th>
              <th>Status</th>
              <th>Pax</th>
            </tr>
          </thead>
          <tbody>
            {(ziyaratData?.ziyarats || []).filter(z => (
              matchesSearch(z.booking_id) || matchesSearch(z.location) || (z.pax_list || []).some(p => matchesSearch(p.first_name) || matchesSearch(p.last_name))
            )).map((z, i) => (
              <tr key={i}>
                <td>{z.booking_id}</td>
                <td>
                  <span
                    onClick={() => setZiyaratDetailsModal({ show: true, data: z })}
                    style={{
                      color: '#0d6efd',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      fontWeight: '500'
                    }}
                  >
                    {z.location}
                  </span>
                </td>
                <td>{z.city}</td>
                <td>{z.pickup_time}</td>
                <td>
                  {(() => {
                    const familyHead = (z.pax_list || []).find(p => p.is_family_head) || (z.pax_list || [])[0];
                    // Find granular status for THIS ziyarat (z.id)
                    const granularStatus = familyHead?.activity_statuses?.find(s => s.activity_id === z.id && s.activity_type === 'bookingziyaratdetails')?.status;
                    const status = granularStatus || familyHead?.ziyarat_status || 'Pending';
                    return <Badge bg={statusVariant(status)} className="text-capitalize">{status}</Badge>;
                  })()}
                </td>
                <td>
                  {(() => {
                    const familyHead = (z.pax_list || []).find(p => p.is_family_head) || (z.pax_list || [])[0];
                    if (!familyHead) return <span className="text-muted">No passengers</span>;

                    return (
                      <div className="d-flex align-items-center gap-2">
                        <a
                          href="#"
                          onClick={(e) => { e.preventDefault(); showAllPassengers(z); }}
                          style={{ textDecoration: "none", fontWeight: "500", color: "#0d6efd" }}
                        >
                          {familyHead.first_name} {familyHead.last_name}
                        </a>
                        {(z.pax_list || []).length > 1 && (
                          <Badge bg="secondary" pill>{(z.pax_list || []).length}</Badge>
                        )}
                      </div>
                    );
                  })()}
                </td>
                <td>
                  <div className="d-flex gap-2">
                    <Button size="sm" variant="outline-secondary"><Edit3 size={14} /></Button>
                  </div>
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
        sectionType="ziyarat"
        onStatusUpdate={handleStatusUpdate}
      />

      {/* Ziyarat Details Modal */}
      <Modal
        show={ziyaratDetailsModal.show}
        onHide={() => setZiyaratDetailsModal({ show: false, data: null })}
        size="lg"
      >
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>
            <MapPin size={24} className="me-2" />
            Ziyarat Details
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {ziyaratDetailsModal.data && (
            <Card className="border-0">
              <Card.Body>
                <Table bordered hover>
                  <tbody>
                    <tr>
                      <td style={{ width: "35%", backgroundColor: "#f8f9fa", fontWeight: "600" }}>
                        <MapPin size={18} className="me-2 text-primary" />
                        Booking ID
                      </td>
                      <td>{ziyaratDetailsModal.data.booking_id}</td>
                    </tr>
                    <tr>
                      <td style={{ backgroundColor: "#f8f9fa", fontWeight: "600" }}>
                        <MapPin size={18} className="me-2 text-primary" />
                        Ziyarat Location
                      </td>
                      <td>
                        <Badge bg="primary" className="fs-6">{ziyaratDetailsModal.data.location}</Badge>
                      </td>
                    </tr>
                    <tr>
                      <td style={{ backgroundColor: "#f8f9fa", fontWeight: "600" }}>
                        <MapPin size={18} className="me-2 text-primary" />
                        City
                      </td>
                      <td>{ziyaratDetailsModal.data.city}</td>
                    </tr>
                    <tr>
                      <td style={{ backgroundColor: "#f8f9fa", fontWeight: "600" }}>
                        <MapPin size={18} className="me-2 text-primary" />
                        Date/Time
                      </td>
                      <td>{ziyaratDetailsModal.data.pickup_time}</td>
                    </tr>
                    <tr>
                      <td style={{ backgroundColor: "#f8f9fa", fontWeight: "600" }}>
                        <MapPin size={18} className="me-2 text-primary" />
                        Status
                      </td>
                      <td>
                        {(() => {
                          const familyHead = (ziyaratDetailsModal.data.pax_list || []).find(p => p.is_family_head) || (ziyaratDetailsModal.data.pax_list || [])[0];
                          const status = familyHead?.ziyarat_status || 'Pending';
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
                        <MapPin size={18} className="me-2 text-primary" />
                        Total Passengers
                      </td>
                      <td>
                        <Badge bg="info">{ziyaratDetailsModal.data.pax_list?.length || 0}</Badge>
                      </td>
                    </tr>
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setZiyaratDetailsModal({ show: false, data: null })}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ZiyaratSection;
