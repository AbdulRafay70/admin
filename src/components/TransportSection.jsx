import React, { useState, useEffect } from "react";
import { Table, Button, Form, Badge, Row, Col, Alert, Spinner, InputGroup } from "react-bootstrap";
import { Truck, Edit3, Trash2 } from "lucide-react";
import PaxDetailsModal, { getPaxDetails } from "./PaxDetailsModal";
import AllPassengersModal from "./AllPassengersModal";
import axios from "axios";

const TransportSection = () => {
  const [transportData, setTransportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [paxDetails, setPaxDetails] = useState(null);
  const [paxModalOpen, setPaxModalOpen] = useState(false);

  useEffect(() => {
    fetchDeliveredBookings();
  }, [selectedDate]);

  const fetchDeliveredBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get('http://127.0.0.1:8000/api/daily-operations/', {
        params: { date: selectedDate },
        headers: { Authorization: `Bearer ${token}` }
      });

      const transformedData = {
        date: selectedDate,
        transports: response.data.results.flatMap(booking =>
          booking.transport_details?.map(transport => ({
            id: transport.id, // Capture Transport ID
            booking_id: booking.booking_number,
            pickup: transport.pickup_location || transport.from_location || 'N/A',
            drop: transport.drop_location || transport.to_location || 'N/A',
            sector: transport.sector || `${transport.pickup_location || transport.from_location || 'N/A'} → ${transport.drop_location || transport.to_location || 'N/A'}`,
            vehicle: transport.vehicle_name || 'N/A',
            vehicle_description: transport.vehicle_description || 'N/A',
            driver_name: transport.driver_name || 'N/A',
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
              transport_status: person.transport_status || 'Pending',
              activity_statuses: person.activity_statuses || [],
              status: person.transport_status || 'Pending'
            })) || []
          })) || []
        )
      };

      setTransportData(transformedData);
    } catch (err) {
      console.error('Error fetching transport data:', err);
      setError('Failed to load transport data.');
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
        vehicle: booking.vehicle,
        pickup: booking.pickup,
        drop: booking.drop,
        sector: booking.sector || `${booking.pickup} → ${booking.drop}`,
        driver_name: booking.driver_name,
        vehicle_description: booking.vehicle_description
      }
    });
    setPaxModalOpen(true);
  };

  const statusVariant = (status) => {
    if (!status) return "secondary";
    const s = status.toLowerCase();
    if (s.includes("pending")) return "warning";
    if (s.includes("departed")) return "info";
    if (s.includes("arrived") || s.includes("delivered")) return "success";
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

      await axios.patch('http://127.0.0.1:8000/api/daily-operations/update-status/', {
        model_type: 'pax',
        item_id: cleanPaxId,
        status: status,
        status_field: 'transport_status',
        activity_id: activityId,
        activity_type: 'transport'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setTransportData((prev) => {
        const updatedTransports = prev.transports.map((t) => {
          if (t.booking_id === bookingId && t.id === activityId) {
            return {
              ...t,
              pax_list: t.pax_list.map(p => {
                if (p.pax_id === paxId) {
                  const updatedActivityStatuses = [
                    ...(p.activity_statuses || []).filter(s => s.activity_id !== activityId || s.activity_type !== 'bookingtransportsector'),
                    { activity_type: 'bookingtransportsector', activity_id: activityId, status: status }
                  ];
                  return { ...p, status, activity_statuses: updatedActivityStatuses };
                }
                return p;
              })
            };
          }
          return t;
        });

        if (paxDetails && paxDetails.booking_id === bookingId) {
          setPaxDetails(prev => ({
            ...prev,
            passengers: prev.passengers.map(p => {
              if (p.pax_id === paxId) {
                const updatedActivityStatuses = [
                  ...(p.activity_statuses || []).filter(s => s.activity_id !== activityId || s.activity_type !== 'bookingtransportsector'),
                  { activity_type: 'bookingtransportsector', activity_id: activityId, status: status }
                ];
                return { ...p, status, activity_statuses: updatedActivityStatuses };
              }
              return p;
            })
          }));
        }

        return { ...prev, transports: updatedTransports };
      });
    } catch (err) {
      console.error('Error updating transport status:', err);
      alert('Failed to update status. Please try again.');
    }
  };

  return (
    <div>
      <h5 className="mb-3"><Truck size={18} className="me-2" />Transport (Delivered Bookings)</h5>

      {error && <Alert variant="danger">{error}</Alert>}

      <Row className="align-items-center mb-3">
        <Col md={3} className="mb-2 mb-md-0">
          <InputGroup>
            <InputGroup.Text>Date</InputGroup.Text>
            <Form.Control type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
          </InputGroup>
        </Col>
        <Col md={6} className="mb-2 mb-md-0">
          <Form.Control placeholder="Search by booking id, vehicle..." value={search} onChange={(e) => setSearch(e.target.value)} />
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
          <p className="mt-2">Loading transport data...</p>
        </div>
      ) : (
        <Table hover responsive size="sm" className="align-middle">
          <thead>
            <tr>
              <th>Booking ID</th>
              <th>Vehicle</th>
              <th>Sectors</th>
              <th>Status</th>
              <th>Pax</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(transportData?.transports || []).filter(t => (
              matchesSearch(t.booking_id) || matchesSearch(t.vehicle) || matchesSearch(t.sector) || (t.pax_list || []).some(p => matchesSearch(p.first_name) || matchesSearch(p.last_name))
            )).map((t, i) => (
              <tr key={i}>
                <td>{t.booking_id}</td>
                <td>{t.vehicle}</td>
                <td>
                  <div className="d-flex align-items-center">
                    <Badge bg="primary" className="me-1">{t.pickup}</Badge>
                    <span className="mx-1">→</span>
                    <Badge bg="info">{t.drop}</Badge>
                  </div>
                </td>
                <td>
                  {(() => {
                    const familyHead = (t.pax_list || []).find(p => p.is_family_head) || (t.pax_list || [])[0];
                    const granularStatus = familyHead?.activity_statuses?.find(s => s.activity_id === t.id && s.activity_type === 'bookingtransportsector')?.status;
                    const status = granularStatus || familyHead?.transport_status || 'Pending';
                    return <Badge bg={statusVariant(status)} className="text-capitalize">{status}</Badge>;
                  })()}
                </td>
                <td>
                  {(() => {
                    const familyHead = (t.pax_list || []).find(p => p.is_family_head) || (t.pax_list || [])[0];
                    if (!familyHead) return <span className="text-muted">No passengers</span>;

                    return (
                      <div className="d-flex align-items-center gap-2">
                        <a
                          href="#"
                          onClick={(e) => { e.preventDefault(); showAllPassengers(t); }}
                          style={{ textDecoration: "none", fontWeight: "500", color: "#0d6efd" }}
                        >
                          {familyHead.first_name} {familyHead.last_name}
                        </a>
                        {(t.pax_list || []).length > 1 && (
                          <Badge bg="secondary" pill>{(t.pax_list || []).length}</Badge>
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
        sectionType="transport"
        onStatusUpdate={handleStatusUpdate}
      />
    </div>
  );
};

export default TransportSection;
