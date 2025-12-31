import React, { useState, useEffect } from "react";
import { Table, Button, Form, Badge, Row, Col, Alert, Spinner, InputGroup } from "react-bootstrap";
import { User as UserIcon, Edit3, Trash2 } from "lucide-react";
import PaxDetailsModal, { getPaxDetails } from "./PaxDetailsModal";
import axios from "axios";
import ConfirmationModal from "./ConfirmationModal";

const PaxSection = () => {
  const [paxData, setPaxData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [paxDetails, setPaxDetails] = useState(null);
  const [paxModalOpen, setPaxModalOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ show: false, paxId: null, statusField: null, newStatus: null });

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
        headers: { Authorization: `Bearer ${token} ` }
      });

      console.log('Pax Section API Response:', response.data);

      // Transform API data to show all passengers from delivered bookings
      const transformedData = {
        date: selectedDate,
        passengers: response.data.results.flatMap(booking =>
          booking.person_details?.map(person => ({
            pax_id: `PAX-${person.id}`,
            booking_id: booking.booking_number,
            first_name: person.first_name,
            last_name: person.last_name,
            passport_number: person.passport_number || 'N/A',
            age_group: person.age_group || 'N/A',
            contact_number: person.contact_number || 'N/A',
            visa_status: person.visa_status || 'Pending',
            ticket_status: person.ticket_status || 'Pending',
            is_family_head: person.is_family_head || false,
            booking_status: booking.status.toLowerCase()
          })) || []
        )
      };

      console.log('Transformed pax data:', transformedData);
      setPaxData(transformedData);
    } catch (err) {
      console.error('Error fetching pax data:', err);
      setError('Failed to load passenger data.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (paxId, statusField, newStatus) => {
    setConfirmModal({
      show: true,
      paxId,
      statusField,
      newStatus
    });
  };

  const confirmStatusUpdate = async () => {
    const { paxId, statusField, newStatus } = confirmModal;
    try {
      const token = localStorage.getItem('accessToken');
      await axios.patch('http://127.0.0.1:8000/api/daily-operations/update-status/', {
        model_type: 'pax',
        item_id: paxId.replace('PAX-', ''), // Remove 'PAX-' prefix for API
        status: newStatus,
        status_field: statusField
      }, {
        headers: { Authorization: `Bearer ${token} ` }
      });
      setConfirmModal({ ...confirmModal, show: false });
      fetchDeliveredBookings(); // Refresh data after successful update
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update status. Please try again.');
    }
  };

  const fetchPaxDetails = (paxId) => {
    // This function currently uses a mock getPaxDetails,
    // you might want to replace this with an actual API call
    // to fetch details for the given paxId.
    // For now, we'll simulate finding details from the current paxData.
    const details = paxData?.passengers.find(p => p.pax_id === paxId);
    setPaxDetails(details);
    setPaxModalOpen(true);
  };

  const statusVariant = (status) => {
    if (!status) return "secondary";
    const s = status.toLowerCase();
    if (s.includes("pending")) return "warning";
    if (s.includes("approved") || s.includes("confirmed") || s.includes("delivered")) return "success";
    if (s.includes("rejected") || s.includes("cancelled")) return "danger";
    return "secondary";
  };

  const matchesSearch = (text) => {
    if (!search) return true;
    return (text || "").toString().toLowerCase().includes(search.toLowerCase());
  };

  return (
    <div>
      <h5 className="mb-3"><UserIcon size={18} className="me-2" />Passenger Details (Delivered Bookings)</h5>

      {error && <Alert variant="danger">{error}</Alert>}

      <Row className="align-items-center mb-3">
        <Col md={3} className="mb-2 mb-md-0">
          <InputGroup>
            <InputGroup.Text>Date</InputGroup.Text>
            <Form.Control type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
          </InputGroup>
        </Col>
        <Col md={6} className="mb-2 mb-md-0">
          <Form.Control
            placeholder="Search by name, passport, booking ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
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
          <p className="mt-2">Loading passenger data...</p>
        </div>
      ) : (
        <>
          <div className="mb-2 text-muted">
            <small>Total Passengers: {paxData?.passengers?.length || 0}</small>
          </div>
          <Table hover responsive size="sm" className="align-middle">
            <thead>
              <tr>
                <th>Pax ID</th>
                <th>Booking ID</th>
                <th>Name</th>
                <th>Passport</th>
                <th>Age Group</th>
                <th>Contact</th>
                <th>Visa Status</th>
                <th className="bg-primary text-white">Ticket Status</th>
                <th className="bg-primary text-white">Role</th>
                <th className="bg-primary text-white">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(paxData?.passengers || []).filter(p => (
                matchesSearch(p.first_name) ||
                matchesSearch(p.last_name) ||
                matchesSearch(p.passport_number) ||
                matchesSearch(p.booking_id)
              )).map((p, i) => (
                <tr key={i}>
                  <td>
                    <a
                      href="#"
                      onClick={(e) => { e.preventDefault(); fetchPaxDetails(p.pax_id); }}
                      style={{ textDecoration: "none", fontWeight: "500" }}
                    >
                      {p.pax_id}
                    </a>
                  </td>
                  <td>{p.booking_id}</td>
                  <td>
                    <strong>{p.first_name} {p.last_name}</strong>
                  </td>
                  <td>{p.passport_number}</td>
                  <td>
                    <Badge bg="info" className="text-capitalize">
                      {p.age_group}
                    </Badge>
                  </td>
                  <td>{p.contact_number}</td>
                  <td>
                    <Form.Select
                      size="sm"
                      value={p.visa_status}
                      onChange={(e) => handleStatusChange(p.pax_id, 'visa_status', e.target.value)}
                      className={`text - capitalize border - 0 bg - ${statusVariant(p.visa_status)} text - white`}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Approved">Approved</option>
                      <option value="Rejected">Rejected</option>
                    </Form.Select>
                  </td>
                  <td>
                    <Form.Select
                      size="sm"
                      value={p.ticket_status}
                      onChange={(e) => handleStatusChange(p.pax_id, 'ticket_status', e.target.value)}
                      className={`text - capitalize border - 0 bg - ${statusVariant(p.ticket_status)} text - white`}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Cancelled">Cancelled</option>
                    </Form.Select>
                  </td>
                  <td>
                    {p.is_family_head ? (
                      <Badge bg="primary">Head</Badge>
                    ) : (
                      <span className="text-muted">-</span>
                    )}
                  </td>
                  <td>
                    <div className="d-flex gap-2">
                      <Button
                        size="sm"
                        variant="outline-primary"
                        onClick={() => fetchPaxDetails(p.pax_id)}
                      >
                        <UserIcon size={14} />
                      </Button>
                      <Button size="sm" variant="outline-secondary">
                        <Edit3 size={16} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </>
      )}

      <PaxDetailsModal
        show={paxModalOpen}
        onHide={() => setPaxModalOpen(false)}
        paxDetails={paxDetails}
      />
    </div>
  );
};

export default PaxSection;
