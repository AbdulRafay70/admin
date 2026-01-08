import React, { useState, useEffect } from "react";
import { Table, Button, Modal, Form, Badge, Row, Col, InputGroup, Alert, Spinner, Card } from "react-bootstrap";
import { Bed, Edit3, Trash2, Hotel } from "lucide-react";
import PaxDetailsModal, { getPaxDetails } from "./PaxDetailsModal";
import AllPassengersModal from "./AllPassengersModal";
import axios from "axios";

const mockHotels = [
  { id: "H1", name: "Hilton Makkah", rooms: [{ id: "204", beds: ["B1", "B2"] }, { id: "205", beds: ["A1"] }] },
  { id: "H2", name: "Makkah Grand", rooms: [{ id: "101", beds: ["A1", "A2"] }] },
];

const HotelSection = () => {
  const [hotelData, setHotelData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [hotelFilter, setHotelFilter] = useState("");
  const [checkInFilter, setCheckInFilter] = useState("");
  const [checkOutFilter, setCheckOutFilter] = useState("");
  const [quickFilter, setQuickFilter] = useState(""); // 'today_checkin', 'tomorrow_checkin', 'today_checkout'
  const [showAssign, setShowAssign] = useState(false);

  // Helper functions for date calculations
  const getTodayDate = () => new Date().toISOString().split('T')[0];
  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedHotel, setSelectedHotel] = useState("");
  const [selectedRoom, setSelectedRoom] = useState("");
  const [selectedBed, setSelectedBed] = useState("");
  const [selectedPaxId, setSelectedPaxId] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusModalInfo, setStatusModalInfo] = useState({ bookingId: null, paxId: null, status: "", updatedBy: "" });
  const [paxDetails, setPaxDetails] = useState(null);
  const [paxModalOpen, setPaxModalOpen] = useState(false);

  // Fetch delivered bookings from API
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

      console.log('Daily Operations API Response:', response.data);
      console.log('Number of delivered bookings:', response.data.count);
      console.log('Bookings data:', response.data.results);

      // Transform API data to match component structure
      const transformedData = {
        date: selectedDate,
        hotels: response.data.results.flatMap(booking => booking.hotel_details?.map(hotel => ({
          id: hotel.id, // Capture Hotel ID
          booking_id: booking.booking_number,
          contact: booking.person_details?.[0]?.contact_number || '',
          hotel_name: hotel.hotel_name || hotel.self_hotel_name || 'N/A',
          city: (typeof hotel.hotel?.city === 'string' ? hotel.hotel.city : hotel.hotel?.city?.name) || 'N/A',
          check_in: hotel.check_in_date || '',
          check_out: hotel.check_out_date || '',
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
            room_no: '',
            bed_no: '',
            hotel_status: person.hotel_status || 'Pending',
            activity_statuses: person.activity_statuses || [], // Capture distinct activity statuses
            status: person.hotel_status || 'Pending'
          })) || []
        })) || [])
      };

      console.log('Transformed hotel data:', transformedData);
      setHotelData(transformedData);
    } catch (err) {
      console.error('Error fetching delivered bookings:', err);
      setError('Failed to load booking data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const statusVariant = (status) => {
    if (!status) return "secondary";
    const s = status.toLowerCase();
    if (s.includes("pending") || s.includes("waiting")) return "warning";
    if (s.includes("checked_in") || s.includes("arrived") || s.includes("served")) return "success";
    if (s.includes("checked_out") || s.includes("completed")) return "primary";
    if (s.includes("canceled") || s.includes("not_picked")) return "danger";
    return "secondary";
  };

  const matchesSearch = (text) => {
    if (!search) return true;
    return (text || "").toString().toLowerCase().includes(search.toLowerCase());
  };

  const fetchPaxDetails = (paxId) => {
    const details = getPaxDetails(paxId);
    setPaxDetails(details);
    setPaxModalOpen(true);
  };

  const showAllPassengers = (booking) => {
    // Show all passengers for this booking with hotel-specific data
    setPaxDetails({
      booking_id: booking.booking_id,
      activityId: booking.id, // Pass activity ID
      passengers: booking.pax_list || [],
      booking_data: {
        hotel_name: booking.hotel_name,
        city: booking.city,
        check_in: booking.check_in,
        check_out: booking.check_out,
        contact: booking.contact
      }
    });
    setPaxModalOpen(true);
  };

  const openAssign = (booking, pax) => {
    setSelectedBooking(booking);
    setSelectedPaxId(pax?.pax_id || null);
    const hotelId = mockHotels.find((h) => h.name === booking.hotel_name)?.id || "";
    setSelectedHotel(hotelId);
    setSelectedRoom(pax?.room_no || "");
    setSelectedBed(pax?.bed_no || "");
    setShowAssign(true);
  };

  const handleSave = async () => {
    if (selectedBooking && selectedPaxId) {
      try {
        const token = localStorage.getItem('accessToken');
        const cleanPaxId = selectedPaxId.replace('PAX-', '');

        await axios.patch('http://127.0.0.1:8000/api/daily-operations/update-status/', {
          model_type: 'pax',
          item_id: cleanPaxId,
          fields: {
            room_no: selectedRoom,
            bed_no: selectedBed,
            hotel_status: 'checked_in'
          }
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });

        setHotelData((prev) => ({
          ...prev,
          hotels: (prev.hotels || []).map((h) => {
            if (h.booking_id !== selectedBooking.booking_id) return h;
            return {
              ...h,
              pax_list: (h.pax_list || []).map((p) => p.pax_id === selectedPaxId ? ({ ...p, room_no: selectedRoom, bed_no: selectedBed, hotel_status: 'checked_in' }) : p)
            };
          })
        }));
      } catch (err) {
        console.error('Error saving hotel assignment:', err);
        alert('Failed to save assignment. Please try again.');
      }
    }
    setShowAssign(false);
  };

  const roomsForHotel = (hotelId) => {
    const h = mockHotels.find((x) => x.id === hotelId);
    return h ? h.rooms : [];
  };

  const openStatusModal = (bookingId, paxId, status) => {
    setStatusModalInfo({ bookingId, paxId, status, updatedBy: "" });
    setShowStatusModal(true);
  };

  const handleConfirmStatusUpdate = async () => {
    const { bookingId, paxId, status } = statusModalInfo;
    try {
      const token = localStorage.getItem('accessToken');
      const cleanPaxId = paxId.replace('PAX-', '');

      await axios.patch('http://127.0.0.1:8000/api/daily-operations/update-status/', {
        model_type: 'pax',
        item_id: cleanPaxId,
        status: status,
        status_field: 'hotel_status'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setHotelData((prev) => ({
        ...prev,
        hotels: prev.hotels.map((h) => h.booking_id === bookingId ? ({ ...h, pax_list: h.pax_list.map(p => p.pax_id === paxId ? ({ ...p, status }) : p) }) : h)
      }));
    } catch (err) {
      console.error('Error updating hotel status:', err);
      alert('Failed to update status. Please try again.');
    }
    setShowStatusModal(false);
  };

  const clearFilters = () => {
    setSearch("");
    setHotelFilter("");
    setCheckInFilter("");
    setCheckOutFilter("");
    setQuickFilter("");
  };

  // Quick filter handlers
  const applyQuickFilter = (filterType) => {
    setQuickFilter(filterType);
    switch (filterType) {
      case 'today_checkin':
        setCheckInFilter(getTodayDate());
        setCheckOutFilter("");
        break;
      case 'tomorrow_checkin':
        setCheckInFilter(getTomorrowDate());
        setCheckOutFilter("");
        break;
      case 'today_checkout':
        setCheckInFilter("");
        setCheckOutFilter(getTodayDate());
        break;
      default:
        break;
    }
  };

  // Calculate counts for summary cards
  const getTodayCheckInCount = () => {
    return (hotelData?.hotels || []).filter(h => h.check_in === getTodayDate()).length;
  };

  const getTomorrowCheckInCount = () => {
    return (hotelData?.hotels || []).filter(h => h.check_in === getTomorrowDate()).length;
  };

  const getTodayCheckOutCount = () => {
    return (hotelData?.hotels || []).filter(h => h.check_out === getTodayDate()).length;
  };

  return (
    <div>
      {error && <Alert variant="danger">{error}</Alert>}

      {/* Summary Cards */}
      {!loading && hotelData && (
        <>
          <Row className="mb-3">
            <Col md={4} className="mb-3">
              <Card
                className={`text-center shadow-sm ${quickFilter === 'today_checkin' ? 'border-primary border-2' : ''}`}
                style={{ cursor: 'pointer', transition: 'all 0.3s' }}
                onClick={() => applyQuickFilter('today_checkin')}
              >
                <Card.Body>
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="text-start">
                      <h6 className="text-muted mb-1">Today's Check-ins</h6>
                      <h2 className="mb-0 text-primary">{getTodayCheckInCount()}</h2>
                      <small className="text-muted">{getTodayDate()}</small>
                    </div>
                    <div className="bg-primary bg-opacity-10 p-3 rounded-circle" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Hotel size={32} color="#0d6efd" strokeWidth={2.5} />
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4} className="mb-3">
              <Card
                className={`text-center shadow-sm ${quickFilter === 'tomorrow_checkin' ? 'border-primary border-2' : ''}`}
                style={{ cursor: 'pointer', transition: 'all 0.3s' }}
                onClick={() => applyQuickFilter('tomorrow_checkin')}
              >
                <Card.Body>
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="text-start">
                      <h6 className="text-muted mb-1">Tomorrow's Check-ins</h6>
                      <h2 className="mb-0 text-primary">{getTomorrowCheckInCount()}</h2>
                      <small className="text-muted">{getTomorrowDate()}</small>
                    </div>
                    <div className="bg-primary bg-opacity-10 p-3 rounded-circle" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Hotel size={32} color="#0d6efd" strokeWidth={2.5} />
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4} className="mb-3">
              <Card
                className={`text-center shadow-sm ${quickFilter === 'today_checkout' ? 'border-primary border-2' : ''}`}
                style={{ cursor: 'pointer', transition: 'all 0.3s' }}
                onClick={() => applyQuickFilter('today_checkout')}
              >
                <Card.Body>
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="text-start">
                      <h6 className="text-muted mb-1">Today's Check-outs</h6>
                      <h2 className="mb-0 text-primary">{getTodayCheckOutCount()}</h2>
                      <small className="text-muted">{getTodayDate()}</small>
                    </div>
                    <div className="bg-primary bg-opacity-10 p-3 rounded-circle" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Hotel size={32} color="#0d6efd" strokeWidth={2.5} />
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Clear Filter Button - Only shows when a card is selected */}
          {quickFilter && (
            <Row className="mb-3">
              <Col>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={() => {
                    setQuickFilter("");
                    setCheckInFilter("");
                    setCheckOutFilter("");
                  }}
                >
                  Clear Filters
                </Button>
              </Col>
            </Row>
          )}
        </>
      )}

      {/* Filter Row 1 - Date Filters */}
      <Row className="align-items-center mb-2">
        <Col lg={3} md={4} className="mb-2 mb-md-0">
          <Form.Group>
            <Form.Label className="small mb-1">Date</Form.Label>
            <Form.Control
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{ minWidth: '150px' }}
            />
          </Form.Group>
        </Col>
        <Col lg={3} md={4} className="mb-2 mb-md-0">
          <Form.Group>
            <Form.Label className="small mb-1">Check-In Date</Form.Label>
            <Form.Control
              type="date"
              value={checkInFilter}
              onChange={(e) => setCheckInFilter(e.target.value)}
              placeholder="Filter by check-in"
              style={{ minWidth: '150px' }}
            />
          </Form.Group>
        </Col>
        <Col lg={3} md={4} className="mb-2 mb-md-0">
          <Form.Group>
            <Form.Label className="small mb-1">Check-Out Date</Form.Label>
            <Form.Control
              type="date"
              value={checkOutFilter}
              onChange={(e) => setCheckOutFilter(e.target.value)}
              placeholder="Filter by check-out"
              style={{ minWidth: '150px' }}
            />
          </Form.Group>
        </Col>
        <Col lg={3} md={12} className="mb-2 mb-md-0">
          <Form.Group>
            <Form.Label className="small mb-1">Hotel</Form.Label>
            <Form.Select value={hotelFilter} onChange={(e) => setHotelFilter(e.target.value)}>
              <option value="">All hotels</option>
              {mockHotels.map((h) => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>

      {/* Filter Row 2 - Search and Actions */}
      <Row className="align-items-center mb-3">
        <Col md={10} className="mb-2 mb-md-0">
          <Form.Control
            placeholder="Search by booking id, hotel, city, pax name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="md"
          />
        </Col>
        <Col md={2} className="mb-2 mb-md-0">
          <Button variant="primary" onClick={fetchDeliveredBookings} disabled={loading} className="w-100">
            {loading ? <Spinner size="sm" /> : 'Refresh'}
          </Button>
        </Col>
      </Row>

      {/* Clear Filters Row */}
      {(search || hotelFilter || checkInFilter || checkOutFilter) && (
        <Row className="mb-2">
          <Col>
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={clearFilters}
            >
              Clear All Filters
            </Button>
            <span className="ms-3 text-muted">
              Active filters: {[search, hotelFilter, checkInFilter, checkOutFilter].filter(f => f).length}
            </span>
          </Col>
        </Row>
      )}

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" />
          <p className="mt-2">Loading delivered bookings...</p>
        </div>
      ) : (
        <Table hover responsive size="sm" className="align-middle">
          <thead>
            <tr>
              <th>Booking ID</th>
              <th>Hotel</th>
              <th>City</th>
              <th>Check In</th>
              <th>Check Out</th>
              <th>Status</th>
              <th>Pax</th>
            </tr>
          </thead>
          <tbody>
            {(hotelData?.hotels || []).filter(h => {
              // Search filter
              const matchesSearchFilter = matchesSearch(h.booking_id) ||
                matchesSearch(h.hotel_name) ||
                matchesSearch(h.city) ||
                (h.pax_list || []).some(p => matchesSearch(p.first_name) || matchesSearch(p.last_name));

              // Hotel filter
              const matchesHotelFilter = hotelFilter === "" ||
                h.hotel_name === (mockHotels.find(hh => hh.id === hotelFilter)?.name || "");

              // Check-in date filter
              const matchesCheckInFilter = checkInFilter === "" || h.check_in === checkInFilter;

              // Check-out date filter
              const matchesCheckOutFilter = checkOutFilter === "" || h.check_out === checkOutFilter;

              return matchesSearchFilter && matchesHotelFilter && matchesCheckInFilter && matchesCheckOutFilter;
            }).map((h, idx) => (
              <tr key={idx}>
                <td>{h.booking_id}</td>
                <td>{h.hotel_name}</td>
                <td>{h.city}</td>
                <td>{h.check_in}</td>
                <td>{h.check_out}</td>
                <td>
                  {(() => {
                    const familyHead = (h.pax_list || []).find(p => p.is_family_head) || (h.pax_list || [])[0];
                    const granularStatus = familyHead?.activity_statuses?.find(s => s.activity_id === h.id && s.activity_type === 'bookinghoteldetails')?.status;
                    const status = granularStatus || familyHead?.hotel_status || 'Pending';
                    return <Badge bg={statusVariant(status)} className="text-capitalize">{status}</Badge>;
                  })()}
                </td>
                <td>
                  {(() => {
                    const familyHead = (h.pax_list || []).find(p => p.is_family_head) || (h.pax_list || [])[0];
                    if (!familyHead) return <span className="text-muted">No passengers</span>;

                    return (
                      <div className="d-flex align-items-center gap-2">
                        <a
                          href="#"
                          onClick={(e) => { e.preventDefault(); showAllPassengers(h); }}
                          style={{ textDecoration: "none", fontWeight: "500", color: "#0d6efd" }}
                        >
                          {familyHead.first_name} {familyHead.last_name}
                        </a>
                        {(h.pax_list || []).length > 1 && (
                          <Badge bg="secondary" pill>{(h.pax_list || []).length}</Badge>
                        )}
                      </div>
                    );
                  })()}
                </td>
              </tr>
            ))}
          </tbody>
        </Table >
      )}

      <Modal show={showAssign} onHide={() => setShowAssign(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Assign Room & Bed</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Hotel</Form.Label>
              <Form.Select value={selectedHotel} onChange={(e) => { setSelectedHotel(e.target.value); setSelectedRoom(""); setSelectedBed(""); }}>
                <option value="">Select hotel</option>
                {mockHotels.map((h) => (
                  <option key={h.id} value={h.id}>{h.name}</option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Room</Form.Label>
              <Form.Select value={selectedRoom} onChange={(e) => { setSelectedRoom(e.target.value); setSelectedBed(""); }}>
                <option value="">Select room</option>
                {roomsForHotel(selectedHotel).map((r) => (
                  <option key={r.id} value={r.id}>{r.id}</option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Bed</Form.Label>
              <Form.Select value={selectedBed} onChange={(e) => setSelectedBed(e.target.value)}>
                <option value="">Select bed</option>
                {roomsForHotel(selectedHotel).find((r) => r.id === selectedRoom)?.beds?.map((bed) => (
                  <option key={bed} value={bed}>{bed}</option>
                ))}
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAssign(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleSave}>Save</Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showStatusModal} onHide={() => setShowStatusModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Update Check-in / Check-out</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-2">
              <Form.Label>Booking ID</Form.Label>
              <Form.Control readOnly value={statusModalInfo.bookingId || ""} />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Pax ID</Form.Label>
              <Form.Control readOnly value={statusModalInfo.paxId || ""} />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Status</Form.Label>
              <Form.Select value={statusModalInfo.status} onChange={(e) => setStatusModalInfo(s => ({ ...s, status: e.target.value }))}>
                <option value="pending">pending</option>
                <option value="checked_in">checked_in</option>
                <option value="checked_out">checked_out</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Updated By (Employee ID)</Form.Label>
              <Form.Control placeholder="EMP-12" value={statusModalInfo.updatedBy} onChange={(e) => setStatusModalInfo(s => ({ ...s, updatedBy: e.target.value }))} />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowStatusModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleConfirmStatusUpdate}>Confirm</Button>
        </Modal.Footer>
      </Modal>

      <AllPassengersModal
        show={paxModalOpen}
        onHide={() => setPaxModalOpen(false)}
        paxDetails={paxDetails}
        sectionType="hotel"
        onStatusUpdate={async (bookingId, paxId, status, activityId) => {
          try {
            const token = localStorage.getItem('accessToken');
            const cleanPaxId = paxId.replace('PAX-', '');

            await axios.patch('http://127.0.0.1:8000/api/daily-operations/update-status/', {
              model_type: 'pax',
              item_id: cleanPaxId,
              status: status,
              status_field: 'hotel_status',
              activity_id: activityId,
              activity_type: 'hotel'
            }, {
              headers: { Authorization: `Bearer ${token}` }
            });

            setHotelData((prev) => {
              const updatedHotels = prev.hotels.map((h) => {
                if (h.booking_id === bookingId && h.id === activityId) {
                  return {
                    ...h,
                    pax_list: h.pax_list.map(p => {
                      if (p.pax_id === paxId) {
                        const updatedActivityStatuses = [
                          ...(p.activity_statuses || []).filter(s => s.activity_id !== activityId || s.activity_type !== 'bookinghoteldetails'),
                          { activity_type: 'bookinghoteldetails', activity_id: activityId, status: status }
                        ];
                        return { ...p, status, activity_statuses: updatedActivityStatuses };
                      }
                      return p;
                    })
                  };
                }
                return h;
              });

              // Also update the open modal data if it matches
              if (paxDetails && paxDetails.booking_id === bookingId) {
                setPaxDetails(prev => ({
                  ...prev,
                  passengers: prev.passengers.map(p => {
                    if (p.pax_id === paxId) {
                      const updatedActivityStatuses = [
                        ...(p.activity_statuses || []).filter(s => s.activity_id !== activityId || s.activity_type !== 'bookinghoteldetails'),
                        { activity_type: 'bookinghoteldetails', activity_id: activityId, status: status }
                      ];
                      return { ...p, status, activity_statuses: updatedActivityStatuses };
                    }
                    return p;
                  })
                }));
              }

              return { ...prev, hotels: updatedHotels };
            });
          } catch (err) {
            console.error('Error updating hotel status:', err);
            alert('Failed to update status. Please try again.');
          }
        }}
      />
    </div >
  );
};

export default HotelSection;
