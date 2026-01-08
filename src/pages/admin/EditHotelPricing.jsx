import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Alert, Badge, Spinner, Table } from 'react-bootstrap';
import { Save, ArrowLeft, Plus, Trash2, Calendar } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import HotelsTabs from '../../components/HotelsTabs';

const EditHotelPricing = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [loading, setLoading] = useState(false);
    const [alert, setAlert] = useState(null);
    const [hotelName, setHotelName] = useState('');
    const [organizationId, setOrganizationId] = useState(null);

    const [formData, setFormData] = useState({
        available_start_date: '',
        available_end_date: ''
    });

    // Group prices by date range for better display
    const [priceRanges, setPriceRanges] = useState([]);

    const token = localStorage.getItem('accessToken');

    const bedTypes = [
        { value: 'room', label: 'Room', capacity: 1 },
        { value: 'sharing', label: 'Sharing', capacity: 2 },
        { value: 'single', label: 'Single', capacity: 1 },
        { value: 'double', label: 'Double', capacity: 2 },
        { value: 'triple', label: 'Triple', capacity: 3 },
        { value: 'quad', label: 'Quad', capacity: 4 },
        { value: 'quint', label: 'Quint', capacity: 5 },
        { value: '6-bed', label: '6 Bed', capacity: 6 },
        { value: '7-bed', label: '7 Bed', capacity: 7 },
        { value: '8-bed', label: '8 Bed', capacity: 8 },
        { value: '9-bed', label: '9 Bed', capacity: 9 },
        { value: '10-bed', label: '10 Bed', capacity: 10 }
    ];

    useEffect(() => {
        if (id) {
            fetchHotelPricing();
        }
    }, [id]);

    const showAlert = (type, message) => {
        setAlert({ type, message });
        setTimeout(() => setAlert(null), 3000);
    };

    const fetchHotelPricing = async () => {
        setLoading(true);
        try {
            const storedOrgId = localStorage.getItem('organizationId') || '11';
            const res = await axios.get(`http://127.0.0.1:8000/api/hotels/${id}/?organization=${storedOrgId}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            const hotel = res.data;

            setHotelName(hotel.name || '');
            setOrganizationId(hotel.owner_organization_id);
            localStorage.setItem('organizationId', hotel.owner_organization_id);

            setFormData({
                available_start_date: hotel.available_start_date || '',
                available_end_date: hotel.available_end_date || ''
            });

            // Group prices by date range
            if (hotel.prices && hotel.prices.length > 0) {
                const grouped = {};
                hotel.prices.forEach(price => {
                    const key = `${price.start_date}_${price.end_date}`;
                    if (!grouped[key]) {
                        grouped[key] = {
                            start_date: price.start_date,
                            end_date: price.end_date,
                            prices: {}
                        };
                    }
                    grouped[key].prices[price.room_type] = {
                        id: price.id,
                        selling: price.price || price.selling_price || 0,
                        purchase: price.purchase_price || 0
                    };
                });
                setPriceRanges(Object.values(grouped));
            } else {
                // Initialize with one empty range
                setPriceRanges([{
                    start_date: '',
                    end_date: '',
                    prices: {}
                }]);
            }
        } catch (e) {
            console.error('Failed to load hotel pricing', e);
            showAlert('danger', 'Failed to load hotel pricing');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const addPriceRange = () => {
        setPriceRanges([...priceRanges, {
            start_date: '',
            end_date: '',
            prices: {}
        }]);
    };

    const removePriceRange = (index) => {
        if (priceRanges.length === 1) return;
        setPriceRanges(priceRanges.filter((_, i) => i !== index));
    };

    const updatePriceRange = (index, field, value) => {
        const updated = [...priceRanges];
        updated[index][field] = value;
        setPriceRanges(updated);
    };

    const updateBedPrice = (rangeIndex, bedType, priceType, value) => {
        const updated = [...priceRanges];
        if (!updated[rangeIndex].prices[bedType]) {
            updated[rangeIndex].prices[bedType] = { selling: 0, purchase: 0 };
        }
        updated[rangeIndex].prices[bedType][priceType] = value;
        setPriceRanges(updated);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Convert grouped prices back to flat array
            const allPrices = [];
            priceRanges.forEach(range => {
                Object.entries(range.prices).forEach(([bedType, priceData]) => {
                    if (priceData.selling > 0 || priceData.purchase > 0) {
                        allPrices.push({
                            id: priceData.id || null,
                            start_date: range.start_date,
                            end_date: range.end_date,
                            room_type: bedType,
                            price: parseFloat(priceData.selling) || 0,
                            purchase_price: parseFloat(priceData.purchase) || 0
                        });
                    }
                });
            });

            const payload = {
                available_start_date: formData.available_start_date,
                available_end_date: formData.available_end_date,
                prices: allPrices
            };

            const storedOrgId = localStorage.getItem('organizationId') || '11';
            const url = organizationId
                ? `http://127.0.0.1:8000/api/hotels/${id}/?organization=${organizationId}`
                : `http://127.0.0.1:8000/api/hotels/${id}/?organization=${storedOrgId}`;

            await axios.patch(url, payload, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
            });

            showAlert('success', 'Hotel pricing updated successfully!');
            setTimeout(() => navigate('/hotel-availability-manager'), 1500);
        } catch (e) {
            console.error('Failed to update hotel pricing', e);
            const errorMsg = e.response?.data?.detail || e.response?.data?.error || 'Failed to update hotel pricing';
            showAlert('danger', errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="d-flex">
            <Sidebar />
            <div className="flex-grow-1">
                <Header />
                <Container fluid className="py-3" style={{ maxWidth: '1400px' }}>
                    {alert && (
                        <Alert variant={alert.type} onClose={() => setAlert(null)} dismissible className="mb-3">
                            {alert.message}
                        </Alert>
                    )}

                    <Row className="mb-2">
                        <Col>
                            <HotelsTabs activeName="Hotels" />
                        </Col>
                    </Row>

                    <Row className="mb-3">
                        <Col>
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h4 className="mb-0">Edit Hotel Pricing</h4>
                                    <small className="text-muted">{hotelName}</small>
                                </div>
                                <Button variant="outline-secondary" size="sm" onClick={() => navigate('/hotel-availability-manager')}>
                                    <ArrowLeft size={14} className="me-1" /> Back
                                </Button>
                            </div>
                        </Col>
                    </Row>

                    {loading && !hotelName ? (
                        <Card className="shadow-sm">
                            <Card.Body className="text-center py-4">
                                <Spinner animation="border" variant="primary" size="sm" />
                                <p className="mt-2 mb-0 small text-muted">Loading...</p>
                            </Card.Body>
                        </Card>
                    ) : (
                        <Form onSubmit={handleSubmit}>
                            {/* Availability Dates - Compact */}
                            <Card className="shadow-sm mb-3">
                                <Card.Header className="bg-light py-2">
                                    <small className="fw-bold"><Calendar size={14} className="me-1" />Availability Period</small>
                                </Card.Header>
                                <Card.Body className="py-2">
                                    <Row className="g-2">
                                        <Col md={6}>
                                            <Form.Group>
                                                <Form.Label className="small mb-1">From</Form.Label>
                                                <Form.Control
                                                    type="date"
                                                    size="sm"
                                                    name="available_start_date"
                                                    value={formData.available_start_date}
                                                    onChange={handleInputChange}
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group>
                                                <Form.Label className="small mb-1">Until</Form.Label>
                                                <Form.Control
                                                    type="date"
                                                    size="sm"
                                                    name="available_end_date"
                                                    value={formData.available_end_date}
                                                    onChange={handleInputChange}
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>

                            {/* Hotel Prices - Table Format */}
                            <Card className="shadow-sm mb-3">
                                <Card.Header className="bg-light py-2 d-flex justify-content-between align-items-center">
                                    <small className="fw-bold">Hotel Prices by Date Range</small>
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        onClick={addPriceRange}
                                        style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                                    >
                                        <Plus size={12} className="me-1" /> Add Date Range
                                    </Button>
                                </Card.Header>
                                <Card.Body className="p-0">
                                    {priceRanges.map((range, rangeIndex) => (
                                        <div key={rangeIndex} className="border-bottom">
                                            <div className="p-2 bg-light d-flex justify-content-between align-items-center">
                                                <div className="d-flex gap-2 align-items-center flex-grow-1">
                                                    <small className="fw-bold">Range {rangeIndex + 1}:</small>
                                                    <Form.Control
                                                        type="date"
                                                        size="sm"
                                                        value={range.start_date}
                                                        onChange={(e) => updatePriceRange(rangeIndex, 'start_date', e.target.value)}
                                                        style={{ width: '140px', fontSize: '0.75rem' }}
                                                    />
                                                    <small>to</small>
                                                    <Form.Control
                                                        type="date"
                                                        size="sm"
                                                        value={range.end_date}
                                                        onChange={(e) => updatePriceRange(rangeIndex, 'end_date', e.target.value)}
                                                        style={{ width: '140px', fontSize: '0.75rem' }}
                                                    />
                                                </div>
                                                {priceRanges.length > 1 && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline-danger"
                                                        onClick={() => removePriceRange(rangeIndex)}
                                                        style={{ fontSize: '0.7rem', padding: '0.2rem 0.4rem' }}
                                                    >
                                                        <Trash2 size={12} />
                                                    </Button>
                                                )}
                                            </div>
                                            <div className="p-2" style={{ overflowX: 'auto' }}>
                                                <Table size="sm" bordered className="mb-0" style={{ fontSize: '0.8rem' }}>
                                                    <thead className="table-light">
                                                        <tr>
                                                            <th style={{ width: '100px' }}>Bed Type</th>
                                                            <th style={{ width: '100px' }}>Selling Price</th>
                                                            <th style={{ width: '100px' }}>Purchase Price</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {bedTypes.map((bedType) => (
                                                            <tr key={bedType.value}>
                                                                <td className="align-middle">
                                                                    <small className="fw-medium">{bedType.label}</small>
                                                                    <Badge bg="secondary" className="ms-1" style={{ fontSize: '0.65rem' }}>{bedType.capacity}p</Badge>
                                                                </td>
                                                                <td>
                                                                    <Form.Control
                                                                        type="number"
                                                                        size="sm"
                                                                        placeholder="0"
                                                                        value={range.prices[bedType.value]?.selling || ''}
                                                                        onChange={(e) => updateBedPrice(rangeIndex, bedType.value, 'selling', e.target.value)}
                                                                        style={{ fontSize: '0.75rem' }}
                                                                    />
                                                                </td>
                                                                <td>
                                                                    <Form.Control
                                                                        type="number"
                                                                        size="sm"
                                                                        placeholder="0"
                                                                        value={range.prices[bedType.value]?.purchase || ''}
                                                                        onChange={(e) => updateBedPrice(rangeIndex, bedType.value, 'purchase', e.target.value)}
                                                                        style={{ fontSize: '0.75rem' }}
                                                                    />
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </Table>
                                            </div>
                                        </div>
                                    ))}
                                </Card.Body>
                            </Card>

                            {/* Action Buttons */}
                            <div className="d-flex justify-content-end gap-2 mb-3">
                                <Button variant="outline-secondary" size="sm" onClick={() => navigate('/hotel-availability-manager')}>
                                    Cancel
                                </Button>
                                <Button variant="primary" size="sm" type="submit" disabled={loading}>
                                    {loading ? (
                                        <>
                                            <Spinner animation="border" size="sm" className="me-1" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={14} className="me-1" /> Save Changes
                                        </>
                                    )}
                                </Button>
                            </div>
                        </Form>
                    )}
                </Container>
            </div>
        </div>
    );
};

export default EditHotelPricing;
