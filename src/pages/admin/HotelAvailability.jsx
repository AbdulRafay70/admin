import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Badge, Alert, Spinner, Modal } from 'react-bootstrap';
import { Calendar, Hotel, BedDouble, Users, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import HotelsTabs from '../../components/HotelsTabs';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './HotelAvailability.css'; // Custom CSS for calendar styling

const HotelAvailability = () => {
    const navigate = useNavigate();
    const [hotels, setHotels] = useState([]);
    const [selectedHotelId, setSelectedHotelId] = useState(null);
    const [selectedHotelName, setSelectedHotelName] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [availabilityData, setAvailabilityData] = useState(null);
    const [selectedFloor, setSelectedFloor] = useState(null);
    const [alert, setAlert] = useState(null);
    const [loading, setLoading] = useState(false);
    const [roomTypes, setRoomTypes] = useState([]);

    // Booking modal states
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [occupiedDates, setOccupiedDates] = useState([]);
    const [dateConflictError, setDateConflictError] = useState(null);
    const [bookingForm, setBookingForm] = useState({
        first_name: '',
        last_name: '',
        gender_type: 'Mr',
        document_type: 'CNIC',
        document_number: '',
        checkin_date: '',
        checkout_date: ''
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
        fetchHotels();
        fetchBedTypes();
        // Set default dates (today and 7 days from now)
        const today = new Date();
        const weekLater = new Date(today);
        weekLater.setDate(weekLater.getDate() + 7);
        setDateFrom(today.toISOString().split('T')[0]);
        setDateTo(weekLater.toISOString().split('T')[0]);
    }, []);

    const showAlert = (type, message) => {
        setAlert({ type, message });
        setTimeout(() => setAlert(null), 5000);
    };

    const fetchHotels = async () => {
        try {
            const res = await axios.get('http://127.0.0.1:8000/api/hotels/', {
                params: organizationId ? { organization: organizationId } : {},
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            const data = Array.isArray(res.data) ? res.data : Array.isArray(res.data?.results) ? res.data.results : [];
            setHotels(data);
        } catch (e) {
            console.error('Failed to load hotels', e);
            showAlert('danger', 'Failed to load hotels');
        }
    };

    const fetchBedTypes = async () => {
        try {
            const res = await axios.get('http://127.0.0.1:8000/api/bed-types/', {
                params: organizationId ? { organization: organizationId } : {},
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            const data = Array.isArray(res.data) ? res.data : Array.isArray(res.data?.results) ? res.data.results : [];

            // Extract unique room type names from bed types
            const uniqueTypes = [...new Set(data.map(bedType => bedType.name?.toLowerCase()).filter(Boolean))];
            setRoomTypes(uniqueTypes);
        } catch (e) {
            console.error('Failed to load bed types', e);
            // Fallback to common types if API fails
            setRoomTypes(['sharing', 'quint', 'quad', 'triple', 'double', 'single']);
        }
    };

    const fetchAvailability = async () => {
        if (!selectedHotelId || !dateFrom || !dateTo) {
            showAlert('warning', 'Please select hotel and date range');
            return;
        }

        setLoading(true);
        try {
            const res = await axios.get('http://127.0.0.1:8000/api/hotels/availability/', {
                params: {
                    hotel_id: selectedHotelId,
                    date_from: dateFrom,
                    date_to: dateTo,
                    owner_organization: organizationId
                },
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });

            setAvailabilityData(res.data);
            if (res.data.floors && res.data.floors.length > 0) {
                setSelectedFloor(res.data.floors[0]);
            }
            showAlert('success', 'Availability data loaded successfully');
        } catch (e) {
            console.error('Failed to load availability', e);
            const errorMsg = e.response?.data?.error || e.response?.data?.detail || 'Failed to load availability data';
            showAlert('danger', errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'available':
                return 'success';
            case 'occupied':
                return 'danger';
            case 'partially_occupied':
                return 'warning';
            default:
                return 'secondary';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'available':
                return '✓';
            case 'occupied':
                return '✕';
            case 'partially_occupied':
                return '◐';
            default:
                return '?';
        }
    };

    const handleHotelChange = (e) => {
        const hotelId = e.target.value;
        setSelectedHotelId(hotelId);
        const hotel = hotels.find(h => h.id === parseInt(hotelId));
        setSelectedHotelName(hotel?.name || '');
        setAvailabilityData(null);
        setSelectedFloor(null);
    };

    const fetchOccupiedDates = async (roomId) => {
        try {
            const res = await axios.get(`http://127.0.0.1:8000/api/hotel-rooms/${roomId}/occupied-dates/`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            setOccupiedDates(res.data.occupied_dates || []);
        } catch (error) {
            console.error('Failed to fetch occupied dates:', error);
            setOccupiedDates([]);
        }
    };

    const handleBookRoom = (room) => {
        setSelectedRoom(room);
        setBookingForm({
            first_name: '',
            last_name: '',
            gender_type: 'Mr',
            document_type: 'CNIC',
            document_number: '',
            checkin_date: dateFrom,
            checkout_date: dateTo
        });

        // Fetch occupied dates for this room
        if (room.id || room.room_id) {
            fetchOccupiedDates(room.id || room.room_id);
        }

        setShowBookingModal(true);
    };

    const checkDateConflict = (checkinDate, checkoutDate) => {
        // Check if selected dates conflict with any occupied dates
        for (const booking of occupiedDates) {
            const existingCheckin = new Date(booking.checkin_date);
            const existingCheckout = new Date(booking.checkout_date);
            const newCheckin = new Date(checkinDate);
            const newCheckout = new Date(checkoutDate);

            // Check for overlap: (existing_checkin < new_checkout) AND (existing_checkout > new_checkin)
            if (existingCheckin < newCheckout && existingCheckout > newCheckin) {
                return {
                    conflict: true,
                    message: `Dates conflict with existing booking: ${booking.checkin_date} to ${booking.checkout_date} (Bed ${booking.bed_number})`
                };
            }
        }
        return { conflict: false };
    };

    // Helper function to get all occupied dates as Date objects for DatePicker
    const getOccupiedDatesArray = () => {
        const occupiedDatesArray = [];
        occupiedDates.forEach(booking => {
            const start = new Date(booking.checkin_date);
            const end = new Date(booking.checkout_date);

            // Add all dates in the range
            for (let date = new Date(start); date < end; date.setDate(date.getDate() + 1)) {
                occupiedDatesArray.push(new Date(date));
            }
        });
        return occupiedDatesArray;
    };

    // Helper function to check if a date is occupied
    const isDateOccupied = (date) => {
        if (!date) return false;
        const checkDate = new Date(date);
        checkDate.setHours(0, 0, 0, 0);

        for (const booking of occupiedDates) {
            const start = new Date(booking.checkin_date);
            const end = new Date(booking.checkout_date);
            start.setHours(0, 0, 0, 0);
            end.setHours(0, 0, 0, 0);

            // Check if date is within occupied range
            if (checkDate >= start && checkDate < end) {
                return true;
            }
        }
        return false;
    };

    // Custom day class name function for DatePicker styling
    const getDayClassName = (date) => {
        if (isDateOccupied(date)) {
            return 'occupied-date'; // Red styling
        }
        return 'available-date'; // Green styling
    };

    const handleSubmitBooking = async () => {
        // Validate form
        if (!bookingForm.first_name || !bookingForm.last_name || !bookingForm.document_number ||
            !bookingForm.checkin_date || !bookingForm.checkout_date) {
            showAlert('warning', 'Please fill all required fields including dates');
            return;
        }

        // Validate room and hotel data
        if (!selectedHotelId || !selectedRoom) {
            showAlert('danger', 'Hotel or room information is missing');
            return;
        }

        // Validate check-out is after check-in
        if (new Date(bookingForm.checkout_date) <= new Date(bookingForm.checkin_date)) {
            showAlert('warning', 'Check-out date must be after check-in date');
            return;
        }

        // Check for date conflicts with occupied dates
        const conflictCheck = checkDateConflict(bookingForm.checkin_date, bookingForm.checkout_date);
        if (conflictCheck.conflict) {
            showAlert('danger', `Cannot book: ${conflictCheck.message}. Please select different dates.`);
            return;
        }

        console.log('Selected Room:', selectedRoom);
        console.log('Selected Hotel ID:', selectedHotelId);

        try {
            setLoading(true);

            // Create booking - this will update room status to occupied
            const bookingData = {
                hotel: parseInt(selectedHotelId),
                room: selectedRoom.id || selectedRoom.room_id,
                guest_first_name: bookingForm.first_name,
                guest_last_name: bookingForm.last_name,
                gender_type: bookingForm.gender_type,
                document_type: bookingForm.document_type,
                document_number: bookingForm.document_number,
                checkin_date: bookingForm.checkin_date,
                checkout_date: bookingForm.checkout_date
            };

            console.log('Booking data:', bookingData);

            await axios.post('http://127.0.0.1:8000/api/hotel-bookings/', bookingData, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });

            showAlert('success', `Room ${selectedRoom.room_no} booked successfully!`);
            setShowBookingModal(false);

            // Refresh availability to show updated room status
            await fetchAvailability();
        } catch (error) {
            console.error('Booking error:', error);
            console.error('Error response:', error.response?.data);
            const errorMsg = error.response?.data?.detail || error.response?.data?.error || 'Failed to book room. Please try again.';
            showAlert('danger', errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const RoomCard = ({ room }) => (
        <Card
            className={`mb-3 border-${getStatusColor(room.status)} shadow-sm`}
            style={{ cursor: 'pointer', transition: 'all 0.3s' }}
        >
            <Card.Body className="p-3">
                <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                        <h5 className="mb-1">
                            <BedDouble size={18} className="me-2" />
                            Room {room.room_no}
                        </h5>
                        <Badge bg={getStatusColor(room.status)} className="me-2">
                            {getStatusIcon(room.status)} {room.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                        <Badge bg="secondary">{room.room_type}</Badge>
                    </div>
                    <div className="text-end">
                        <div className="mb-1">
                            <small className="text-muted">Capacity:</small>
                            <strong className="ms-1">{room.capacity}</strong>
                        </div>
                        <div>
                            <Badge bg="success" className="me-1">
                                {room.available_beds} Available
                            </Badge>
                            <Badge bg="danger">
                                {room.occupied_beds} Occupied
                            </Badge>
                        </div>
                    </div>
                </div>

                {room.guest_names && room.guest_names.length > 0 && (
                    <div className="border-top pt-2 mt-2">
                        <small className="text-muted">Guests:</small>
                        <div className="mt-1">
                            {room.guest_names.map((guest, idx) => (
                                <Badge key={idx} bg="info" className="me-1 mb-1">
                                    <Users size={12} className="me-1" />
                                    {guest}
                                </Badge>
                            ))}
                        </div>
                        {room.checkin_date && room.checkout_date && (
                            <div className="mt-2">
                                <small className="text-muted">
                                    <Calendar size={12} className="me-1" />
                                    {room.checkin_date} to {room.checkout_date}
                                </small>
                            </div>
                        )}
                    </div>
                )}

                {/* Available Dates Display */}
                {(room.status === 'available' || room.status === 'partially_occupied') && room.available_beds > 0 && (
                    <div className="border-top pt-2 mt-2">
                        <small className="text-success">
                            <Calendar size={12} className="me-1" />
                            <strong>Available:</strong> {dateFrom} to {dateTo}
                        </small>
                    </div>
                )}

                {/* Book Room button for available rooms */}
                {(room.status === 'available' || room.status === 'partially_occupied') && room.available_beds > 0 && (
                    <div className="border-top pt-2 mt-2">
                        <Button
                            variant="primary"
                            size="sm"
                            className="w-100"
                            onClick={() => handleBookRoom(room)}
                        >
                            <BedDouble size={14} className="me-1" />
                            Book Room
                        </Button>
                    </div>
                )}
            </Card.Body>
        </Card>
    );

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
                            <HotelsTabs activeName="Hotel Availability" />
                        </Col>
                    </Row>

                    <Row className="mb-4">
                        <Col>
                            <h2 className="mb-1">
                                <Hotel size={28} className="me-2" />
                                Hotel Room Availability
                            </h2>
                            <p className="text-muted mb-0">
                                View real-time room and bed availability with visual floor maps
                            </p>
                        </Col>
                    </Row>

                    {/* Filter Section */}
                    <Card className="shadow-sm mb-4">
                        <Card.Body>
                            <Row className="g-3">
                                <Col md={4}>
                                    <Form.Group>
                                        <Form.Label className="fw-bold">
                                            <Hotel size={16} className="me-1" />
                                            Select Hotel *
                                        </Form.Label>
                                        <Form.Select
                                            value={selectedHotelId || ''}
                                            onChange={handleHotelChange}
                                        >
                                            <option value="">-- Select a hotel --</option>
                                            {hotels.map((h) => (
                                                <option key={h.id} value={h.id}>
                                                    {h.name} - {h.city}
                                                </option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                                <Col md={3}>
                                    <Form.Group>
                                        <Form.Label className="fw-bold">
                                            <Calendar size={16} className="me-1" />
                                            Check-in Date *
                                        </Form.Label>
                                        <Form.Control
                                            type="date"
                                            value={dateFrom}
                                            onChange={(e) => setDateFrom(e.target.value)}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={3}>
                                    <Form.Group>
                                        <Form.Label className="fw-bold">
                                            <Calendar size={16} className="me-1" />
                                            Check-out Date *
                                        </Form.Label>
                                        <Form.Control
                                            type="date"
                                            value={dateTo}
                                            onChange={(e) => setDateTo(e.target.value)}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={2} className="d-flex align-items-end">
                                    <Button
                                        variant="primary"
                                        className="w-100"
                                        onClick={fetchAvailability}
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <Spinner animation="border" size="sm" />
                                        ) : (
                                            <>
                                                <RefreshCw size={16} className="me-1" />
                                                Check Availability
                                            </>
                                        )}
                                    </Button>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>

                    {/* Availability Results */}
                    {availabilityData && (
                        <>
                            {/* Summary Cards */}
                            <Row className="mb-4">
                                <Col md={3}>
                                    <Card className="shadow-sm border-primary">
                                        <Card.Body className="text-center">
                                            <BedDouble size={32} className="text-primary mb-2" />
                                            <h3 className="mb-1">{availabilityData.total_rooms}</h3>
                                            <small className="text-muted">Total Rooms</small>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col md={3}>
                                    <Card className="shadow-sm border-success">
                                        <Card.Body className="text-center">
                                            <BedDouble size={32} className="text-success mb-2" />
                                            <h3 className="mb-1 text-success">{availabilityData.available_rooms}</h3>
                                            <small className="text-muted">Available Rooms</small>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col md={3}>
                                    <Card className="shadow-sm border-danger">
                                        <Card.Body className="text-center">
                                            <BedDouble size={32} className="text-danger mb-2" />
                                            <h3 className="mb-1 text-danger">{availabilityData.occupied_rooms}</h3>
                                            <small className="text-muted">Occupied Rooms</small>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col md={3}>
                                    <Card className="shadow-sm border-info">
                                        <Card.Body className="text-center">
                                            <Users size={32} className="text-info mb-2" />
                                            <h3 className="mb-1 text-info">{availabilityData.available_beds}</h3>
                                            <small className="text-muted">Available Beds</small>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>

                            {/* Room Type Breakdown */}
                            <Card className="shadow-sm mb-4">
                                <Card.Header className="bg-primary text-white">
                                    <h5 className="mb-0">Room Type Breakdown</h5>
                                </Card.Header>
                                <Card.Body>
                                    <Row>
                                        {roomTypes.map((type) => {
                                            const total = availabilityData[`total_${type}_rooms`] || 0;
                                            const available = availabilityData[`available_${type}_rooms`] || 0;

                                            if (total === 0) return null;

                                            return (
                                                <Col md={2} key={type} className="mb-3">
                                                    <Card className="text-center border">
                                                        <Card.Body className="p-3">
                                                            <h6 className="text-capitalize mb-2">{type}</h6>
                                                            <div className="mb-1">
                                                                <Badge bg="secondary">{total} Total</Badge>
                                                            </div>
                                                            <Badge bg="success">{available} Available</Badge>
                                                        </Card.Body>
                                                    </Card>
                                                </Col>
                                            );
                                        })}
                                    </Row>
                                </Card.Body>
                            </Card>

                            {/* Floor Selector */}
                            {availabilityData.floors && availabilityData.floors.length > 0 && (
                                <Card className="shadow-sm mb-4">
                                    <Card.Header className="bg-primary text-white">
                                        <h5 className="mb-0">Select Floor</h5>
                                    </Card.Header>
                                    <Card.Body>
                                        <div className="d-flex gap-2 flex-wrap">
                                            {availabilityData.floors.map((floor) => (
                                                <Button
                                                    key={floor.floor_no}
                                                    variant={selectedFloor?.floor_no === floor.floor_no ? 'primary' : 'outline-primary'}
                                                    onClick={() => setSelectedFloor(floor)}
                                                >
                                                    Floor {floor.floor_no} ({floor.rooms.length} rooms)
                                                </Button>
                                            ))}
                                        </div>
                                    </Card.Body>
                                </Card>
                            )}

                            {/* Room List */}
                            {selectedFloor && (
                                <Card className="shadow-sm">
                                    <Card.Header className="bg-info text-white">
                                        <h5 className="mb-0">
                                            <BedDouble size={20} className="me-2" />
                                            Room Details - Floor {selectedFloor.floor_no}
                                        </h5>
                                    </Card.Header>
                                    <Card.Body>
                                        <Row>
                                            {selectedFloor.rooms.map((room) => (
                                                <Col md={6} lg={4} key={room.room_id}>
                                                    <RoomCard room={room} />
                                                </Col>
                                            ))}
                                        </Row>
                                    </Card.Body>
                                </Card>
                            )}
                        </>
                    )}

                    {!availabilityData && !loading && (
                        <Card className="shadow-sm text-center py-5">
                            <Card.Body>
                                <Hotel size={64} className="text-muted mb-3" />
                                <h5 className="text-muted">Select a hotel and date range to view availability</h5>
                            </Card.Body>
                        </Card>
                    )}
                </Container>

                {/* Booking Modal */}
                <Modal show={showBookingModal} onHide={() => setShowBookingModal(false)} centered>
                    <Modal.Header closeButton>
                        <Modal.Title>Book Room {selectedRoom?.room_no}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form>
                            {/* Booking Period Section */}
                            <Card className="mb-3 bg-light border-primary">
                                <Card.Body>
                                    <h6 className="mb-3">
                                        <Calendar size={18} className="me-2" />
                                        Booking Period
                                    </h6>
                                    <Alert variant="info" className="mb-3 py-2">
                                        <small>
                                            <strong>Hotel Available:</strong> {dateFrom} to {dateTo}
                                        </small>
                                    </Alert>
                                    <Row>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Check-in Date *</Form.Label>
                                                <DatePicker
                                                    selected={bookingForm.checkin_date ? new Date(bookingForm.checkin_date) : null}
                                                    onChange={(date) => {
                                                        const dateStr = date ? date.toISOString().split('T')[0] : '';
                                                        const newForm = {
                                                            ...bookingForm,
                                                            checkin_date: dateStr
                                                        };
                                                        setBookingForm(newForm);

                                                        // Check for conflicts if both dates are set
                                                        if (newForm.checkout_date) {
                                                            const conflict = checkDateConflict(dateStr, newForm.checkout_date);
                                                            setDateConflictError(conflict.conflict ? conflict.message : null);
                                                        }
                                                    }}
                                                    minDate={new Date(dateFrom)}
                                                    maxDate={new Date(dateTo)}
                                                    excludeDates={getOccupiedDatesArray()}
                                                    dayClassName={getDayClassName}
                                                    dateFormat="yyyy-MM-dd"
                                                    className="form-control"
                                                    placeholderText="Select check-in date"
                                                    inline={false}
                                                />
                                                <Form.Text className="text-muted">
                                                    Select your arrival date
                                                </Form.Text>
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Check-out Date *</Form.Label>
                                                <DatePicker
                                                    selected={bookingForm.checkout_date ? new Date(bookingForm.checkout_date) : null}
                                                    onChange={(date) => {
                                                        const dateStr = date ? date.toISOString().split('T')[0] : '';
                                                        const newForm = {
                                                            ...bookingForm,
                                                            checkout_date: dateStr
                                                        };
                                                        setBookingForm(newForm);

                                                        // Check for conflicts if both dates are set
                                                        if (newForm.checkin_date) {
                                                            const conflict = checkDateConflict(newForm.checkin_date, dateStr);
                                                            setDateConflictError(conflict.conflict ? conflict.message : null);
                                                        }
                                                    }}
                                                    minDate={bookingForm.checkin_date ? new Date(bookingForm.checkin_date) : new Date(dateFrom)}
                                                    maxDate={new Date(dateTo)}
                                                    excludeDates={getOccupiedDatesArray()}
                                                    dayClassName={getDayClassName}
                                                    dateFormat="yyyy-MM-dd"
                                                    className="form-control"
                                                    placeholderText="Select check-out date"
                                                    inline={false}
                                                />
                                                <Form.Text className="text-muted">
                                                    Select your departure date
                                                </Form.Text>
                                            </Form.Group>
                                        </Col>
                                    </Row>

                                    {/* Occupied Dates Visual Indicator */}
                                    {occupiedDates.length > 0 ? (
                                        <Alert variant="danger" className="mt-3 mb-0">
                                            <small>
                                                <strong>⛔ Occupied Dates (Not Available):</strong>
                                                <div className="mt-2">
                                                    {occupiedDates.map((booking, idx) => (
                                                        <Badge key={idx} bg="danger" className="me-2 mb-1">
                                                            {booking.checkin_date} to {booking.checkout_date}
                                                            {booking.bed_number && ` (Bed ${booking.bed_number})`}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </small>
                                        </Alert>
                                    ) : (
                                        <Alert variant="success" className="mt-3 mb-0">
                                            <small>
                                                <strong>✓ All dates available for booking!</strong>
                                            </small>
                                        </Alert>
                                    )}

                                    {/* Real-time Conflict Warning */}
                                    {dateConflictError && (
                                        <Alert variant="warning" className="mt-2 mb-0">
                                            <small>
                                                <strong>⚠️ Date Conflict:</strong> {dateConflictError}
                                                <br />
                                                <em>Please select different dates to proceed.</em>
                                            </small>
                                        </Alert>
                                    )}
                                </Card.Body>
                            </Card>

                            {/* Guest Information Section */}
                            <h6 className="mb-3">
                                <Users size={18} className="me-2" />
                                Guest Information
                            </h6>
                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>First Name *</Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={bookingForm.first_name}
                                            onChange={(e) => setBookingForm({ ...bookingForm, first_name: e.target.value })}
                                            placeholder="Enter first name"
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Last Name *</Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={bookingForm.last_name}
                                            onChange={(e) => setBookingForm({ ...bookingForm, last_name: e.target.value })}
                                            placeholder="Enter last name"
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>

                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Gender Type *</Form.Label>
                                        <Form.Select
                                            value={bookingForm.gender_type}
                                            onChange={(e) => setBookingForm({ ...bookingForm, gender_type: e.target.value })}
                                        >
                                            <option value="Mr">Mr</option>
                                            <option value="Mrs">Mrs</option>
                                            <option value="Child">Child</option>
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Document Type *</Form.Label>
                                        <Form.Select
                                            value={bookingForm.document_type}
                                            onChange={(e) => setBookingForm({ ...bookingForm, document_type: e.target.value })}
                                        >
                                            <option value="CNIC">CNIC</option>
                                            <option value="Passport">Passport</option>
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                            </Row>

                            <Form.Group className="mb-3">
                                <Form.Label>Document Number *</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={bookingForm.document_number}
                                    onChange={(e) => setBookingForm({ ...bookingForm, document_number: e.target.value })}
                                    placeholder="Enter CNIC or Passport number"
                                />
                            </Form.Group>

                            <Alert variant="info" className="mb-0">
                                <small>
                                    <strong>Booking Details:</strong><br />
                                    Hotel: {selectedHotelName}<br />
                                    Room: {selectedRoom?.room_no}<br />
                                    Check-in: {dateFrom}<br />
                                    Check-out: {dateTo}
                                </small>
                            </Alert>
                        </Form>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowBookingModal(false)}>
                            Cancel
                        </Button>
                        <Button variant="primary" onClick={handleSubmitBooking} disabled={loading}>
                            {loading ? 'Booking...' : 'Confirm Booking'}
                        </Button>
                    </Modal.Footer>
                </Modal>
            </div>
        </div>
    );
};

export default HotelAvailability;
