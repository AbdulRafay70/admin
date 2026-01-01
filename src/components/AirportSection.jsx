import React, { useState, useEffect } from "react";
import { Table, Button, Form, Badge, Row, Col, Alert, Spinner, InputGroup } from "react-bootstrap";
import { Plane, Edit3, Trash2 } from "lucide-react";
import PaxDetailsModal, { getPaxDetails } from "./PaxDetailsModal";
import AllPassengersModal from "./AllPassengersModal";
import axios from "axios";

const AirportSection = () => {
  const [airportData, setAirportData] = useState(null);
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
      const response = await axios.get('https://api.saer.pk/api/daily-operations/', {
        params: { date: selectedDate },
        headers: { Authorization: `Bearer ${token}` }
      });

      const transformedData = {
        date: selectedDate,
        airport_transfers: response.data.results.flatMap(booking =>
          booking.ticket_details?.map(ticket => ({
            id: ticket.id, // Capture Ticket ID
            booking_id: booking.booking_number,
            transfer_type: 'Flight',
            flight_number: ticket.pnr || 'N/A',
            flight_time: ticket.trip_details?.[0]?.departure_date_time || 'N/A',
            pickup_point: ticket.trip_details?.[0]?.departure_city || 'N/A',
            drop_point: ticket.trip_details?.[0]?.arrival_city || 'N/A',
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
              ticket_status: person.ticket_status || 'Pending',
              activity_statuses: person.activity_statuses || [], // Capture distinct activity statuses
              status: person.ticket_status || 'Pending'
            })) || []
          })) || []
        )
      };

      setAirportData(transformedData);
    } catch (err) {
      console.error('Error fetching airport data:', err);
      setError('Failed to load airport data.');
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
        transfer_type: booking.transfer_type,
        flight_number: booking.flight_number,
        flight_time: booking.flight_time,
        pickup_point: booking.pickup_point,
        drop_point: booking.drop_point
      }
    });
    setPaxModalOpen(true);
  };

  const statusVariant = (status) => {
    if (!status) return "secondary";
    const s = status.toLowerCase();
    if (s.includes("waiting") || s.includes("pending")) return "warning";
    if (s.includes("departed")) return "info";
    if (s.includes("arrived") || s.includes("delivered")) return "success";
    if (s.includes("not_picked") || s.includes("canceled")) return "danger";
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
        status_field: 'ticket_status',
        activity_id: activityId,
        activity_type: 'ticket'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setAirportData((prev) => {
        const updatedTransfers = prev.airport_transfers.map((a) => {
          if (a.booking_id === bookingId && a.id === activityId) {
            return {
              ...a,
              pax_list: a.pax_list.map(p => {
                if (p.pax_id === paxId) {
                  const updatedActivityStatuses = [
                    ...(p.activity_statuses || []).filter(s => s.activity_id !== activityId || s.activity_type !== 'bookingticketdetails'),
                    { activity_type: 'bookingticketdetails', activity_id: activityId, status: status }
                  ];
                  return { ...p, status, activity_statuses: updatedActivityStatuses };
                }
                return p;
              })
            };
          }
          return a;
        });

        if (paxDetails && paxDetails.booking_id === bookingId) {
          setPaxDetails(prev => ({
            ...prev,
            passengers: prev.passengers.map(p => {
              if (p.pax_id === paxId) {
                const updatedActivityStatuses = [
                  ...(p.activity_statuses || []).filter(s => s.activity_id !== activityId || s.activity_type !== 'bookingticketdetails'),
                  { activity_type: 'bookingticketdetails', activity_id: activityId, status: status }
                ];
                return { ...p, status, activity_statuses: updatedActivityStatuses };
              }
              return p;
            })
          }));
        }

        return { ...prev, airport_transfers: updatedTransfers };
      });
    } catch (err) {
      console.error('Error updating airport status:', err);
      alert('Failed to update status. Please try again.');
    }
  };

  return (
    <div>
      <h5 className="mb-3"><Plane size={18} className="me-2" />Airport / Flights (Delivered Bookings)</h5>

      {error && <Alert variant="danger">{error}</Alert>}

      <Row className="align-items-center mb-3">
        <Col md={3} className="mb-2 mb-md-0">
          <InputGroup>
            <InputGroup.Text>Date</InputGroup.Text>
            <Form.Control type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
          </InputGroup>
        </Col>
        <Col md={6} className="mb-2 mb-md-0">
          <Form.Control placeholder="Search by booking id, flight..." value={search} onChange={(e) => setSearch(e.target.value)} />
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
          <p className="mt-2">Loading flight data...</p>
        </div>
      ) : (
        <Table hover responsive size="sm" className="align-middle">
          <thead>
            <tr>
              <th>Booking ID</th>
              <th>PNR</th>
              <th>Flight Time</th>
              <th>From</th>
              <th>To</th>
              <th>Status</th>
              <th>Pax</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(airportData?.airport_transfers || []).filter(a => (
              matchesSearch(a.booking_id) || matchesSearch(a.flight_number) || matchesSearch(a.pickup_point) || matchesSearch(a.drop_point) || (a.pax_list || []).some(p => matchesSearch(p.first_name) || matchesSearch(p.last_name))
            )).map((a, i) => (
              <tr key={i}>
                <td>{a.booking_id}</td>
                <td>{a.flight_number}</td>
                <td>{a.flight_time}</td>
                <td>{a.pickup_point}</td>
                <td>{a.drop_point}</td>
                <td>
                  {(() => {
                    const familyHead = (a.pax_list || []).find(p => p.is_family_head) || (a.pax_list || [])[0];
                    const granularStatus = familyHead?.activity_statuses?.find(s => s.activity_id === a.id && s.activity_type === 'bookingticketdetails')?.status;
                    const status = granularStatus || familyHead?.ticket_status || 'Pending';
                    return <Badge bg={statusVariant(status)} className="text-capitalize">{status}</Badge>;
                  })()}
                </td>
                <td>
                  {(() => {
                    const familyHead = (a.pax_list || []).find(p => p.is_family_head) || (a.pax_list || [])[0];
                    if (!familyHead) return <span className="text-muted">No passengers</span>;

                    return (
                      <div className="d-flex align-items-center gap-2">
                        <a
                          href="#"
                          onClick={(e) => { e.preventDefault(); showAllPassengers(a); }}
                          style={{ textDecoration: "none", fontWeight: "500", color: "#0d6efd" }}
                        >
                          {familyHead.first_name} {familyHead.last_name}
                        </a>
                        {(a.pax_list || []).length > 1 && (
                          <Badge bg="secondary" pill>{(a.pax_list || []).length}</Badge>
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
        sectionType="airport"
        onStatusUpdate={handleStatusUpdate}
      />
    </div>
  );
};

export default AirportSection;
