import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Badge, Alert, Spinner } from 'react-bootstrap';
import { Calendar, Hotel, BedDouble, Users, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import HotelsTabs from '../../components/HotelsTabs';
import axios from 'axios';

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
            const res = await axios.get('https://api.saer.pk/api/hotels/', {
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
            const res = await axios.get('https://api.saer.pk/api/bed-types/', {
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
            const res = await axios.get('https://api.saer.pk/api/hotels/availability/', {
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
            </div>
        </div>
    );
};

export default HotelAvailability;
