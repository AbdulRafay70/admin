import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Alert, Badge, Spinner } from 'react-bootstrap';
import { Save, ArrowLeft, Plus, Trash2, Upload } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import HotelsTabs from '../../components/HotelsTabs';

const EditHotelDetails = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [loading, setLoading] = useState(false);
    const [alert, setAlert] = useState(null);
    const [cities, setCities] = useState([]);
    const [categories, setCategories] = useState([]);
    
    const [formData, setFormData] = useState({
        city: '',
        name: '',
        address: '',
        category: '',
        distance: '',
        walking_distance: '',
        walking_time: '',
        is_active: true,
        contact_number: '',
        google_location: '',
        reselling_allowed: false,
        status: 'active'
    });

    const [organizationId, setOrganizationId] = useState(null);
    const [contacts, setContacts] = useState([]);
    const [photos, setPhotos] = useState([]);
    const [video, setVideo] = useState('');
    const [videoFile, setVideoFile] = useState(null);
    const [newPhotoFiles, setNewPhotoFiles] = useState([]);

    const token = localStorage.getItem('accessToken');

    const statusOptions = [
        { value: 'Active', label: 'Active' },
        { value: 'Inactive', label: 'Inactive' },
        { value: 'Pending', label: 'Pending' },
        { value: 'Maintenance', label: 'Maintenance' }
    ];

    useEffect(() => {
        fetchCities();
        fetchCategories();
        if (id) {
            fetchHotelDetails();
        }
    }, [id]);

    const showAlert = (type, message) => {
        setAlert({ type, message });
        setTimeout(() => setAlert(null), 3000);
    };

    const fetchCities = async () => {
        try {
            const res = await axios.get('http://127.0.0.1:8000/api/cities/', {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
            setCities(data);
        } catch (e) {
            console.error('Failed to load cities', e);
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await axios.get('http://127.0.0.1:8000/api/hotel-categories/', {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
            setCategories(data);
        } catch (e) {
            console.error('Failed to load categories', e);
            // Fallback to hardcoded categories if API fails
            setCategories([
                { id: 1, name: '2 Star' },
                { id: 2, name: '5 Star' },
                { id: 3, name: 'Economy' },
                { id: 4, name: 'Deluxe' }
            ]);
        }
    };

    const fetchHotelDetails = async () => {
        setLoading(true);
        try {
            const storedOrgId = localStorage.getItem('organizationId') || '11'; // Default to 11 for testing
            console.log('Fetching hotel with organization:', storedOrgId);
            const url = `http://127.0.0.1:8000/api/hotels/${id}/?organization=${storedOrgId}`;
            
            const res = await axios.get(url, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            const hotel = res.data;
            
            // Store organization ID from hotel data for future requests
            setOrganizationId(hotel.owner_organization_id);
            if (!localStorage.getItem('organizationId')) {
                localStorage.setItem('organizationId', hotel.owner_organization_id);
            }
            
            setFormData({
                city: hotel.city || '',
                name: hotel.name || '',
                address: hotel.address || '',
                category: hotel.category || '',
                distance: hotel.distance || '',
                walking_distance: hotel.walking_distance || '',
                walking_time: hotel.walking_time || '',
                is_active: hotel.is_active !== undefined ? hotel.is_active : true,
                contact_number: hotel.contact_number || '',
                google_location: hotel.google_location || '',
                reselling_allowed: hotel.reselling_allowed || false,
                status: hotel.status || 'active'
            });

            // Map contact_details to contacts format
            const mappedContacts = (hotel.contact_details || []).map(contact => ({
                id: contact.id,
                name: contact.contact_person || '',
                phone: contact.contact_number || '',
                email: contact.email || ''
            }));
            setContacts(mappedContacts);
            
            setPhotos(hotel.photos_data || []);
            setVideo(hotel.video || '');
        } catch (e) {
            console.error('Failed to load hotel details', e);
            showAlert('danger', 'Failed to load hotel details');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const addContact = () => {
        setContacts([...contacts, { name: '', phone: '', email: '' }]);
    };

    const updateContact = (index, field, value) => {
        const updatedContacts = [...contacts];
        updatedContacts[index][field] = value;
        setContacts(updatedContacts);
    };

    const removeContact = (index) => {
        setContacts(contacts.filter((_, i) => i !== index));
    };

    const handlePhotoUpload = (e) => {
        const files = Array.from(e.target.files);
        setNewPhotoFiles(prev => [...prev, ...files]);
        
        // Create preview URLs
        const newPhotoPreviews = files.map(file => ({
            id: `new-${Date.now()}-${Math.random()}`,
            url: URL.createObjectURL(file),
            file: file,
            isNew: true
        }));
        setPhotos(prev => [...prev, ...newPhotoPreviews]);
    };

    const removePhoto = (index) => {
        const photo = photos[index];
        if (photo.isNew && photo.url) {
            URL.revokeObjectURL(photo.url);
            // Also remove from newPhotoFiles array
            setNewPhotoFiles(prev => prev.filter(file => file !== photo.file));
        }
        setPhotos(photos.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const formDataToSend = new FormData();
            
            // Append basic fields
            Object.keys(formData).forEach(key => {
                formDataToSend.append(key, formData[key]);
            });

            // Append contacts as JSON (backend expects 'contact_details')
            const contactDetails = contacts.map(c => ({
                contact_person: c.name,
                contact_number: c.phone,
                email: c.email
            }));
            console.log('Sending contact_details:', contactDetails);
            formDataToSend.append('contact_details', JSON.stringify(contactDetails));

            // Append video file if selected
            if (videoFile) {
                formDataToSend.append('video', videoFile);
            }

            // Append new photo files
            newPhotoFiles.forEach((file, index) => {
                formDataToSend.append(`photos`, file);
            });

            const url = organizationId
                ? `http://127.0.0.1:8000/api/hotels/${id}/?organization=${organizationId}`
                : `http://127.0.0.1:8000/api/hotels/${id}/`;
            
            await axios.patch(url, formDataToSend, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                },
            });

            showAlert('success', 'Hotel details updated successfully!');
            setTimeout(() => navigate('/hotel-availability-manager'), 1500);
        } catch (e) {
            console.error('Failed to update hotel', e);
            const errorMsg = e.response?.data?.detail || e.response?.data?.error || 'Failed to update hotel details';
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
                <Container fluid className="py-4">
                    {alert && (
                        <Alert variant={alert.type} onClose={() => setAlert(null)} dismissible className="mb-4">
                            {alert.message}
                        </Alert>
                    )}

                    <Row className="mb-3">
                        <Col>
                            <HotelsTabs activeName="Hotels" />
                        </Col>
                    </Row>

                    <Row className="mb-4">
                        <Col>
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h2 className="mb-1">Edit Hotel (Details)</h2>
                                    <p className="text-muted mb-0">Update hotel information and details</p>
                                </div>
                                <Button variant="outline-secondary" size="sm" onClick={() => navigate('/hotel-availability-manager')}>
                                    <ArrowLeft size={16} className="me-1" /> Back to Hotels
                                </Button>
                            </div>
                        </Col>
                    </Row>

                    {loading && !formData.name ? (
                        <Card className="shadow-sm">
                            <Card.Body className="text-center py-5">
                                <Spinner animation="border" variant="primary" />
                                <p className="mt-3 text-muted">Loading hotel details...</p>
                            </Card.Body>
                        </Card>
                    ) : (
                        <Form onSubmit={handleSubmit}>
                            <Card className="shadow-sm mb-4">
                                <Card.Header className="bg-primary text-white">
                                    <h5 className="mb-0">Basic Information</h5>
                                </Card.Header>
                                <Card.Body>
                                    <Row>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>City *</Form.Label>
                                                <Form.Select
                                                    name="city"
                                                    value={formData.city}
                                                    onChange={handleInputChange}
                                                    required
                                                >
                                                    <option value="">Select City</option>
                                                    {cities.map((city) => (
                                                        <option key={city.id} value={city.id}>
                                                            {city.name}
                                                        </option>
                                                    ))}
                                                </Form.Select>
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Hotel Name *</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    name="name"
                                                    value={formData.name}
                                                    onChange={handleInputChange}
                                                    placeholder="Enter hotel name"
                                                    required
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>

                                    <Row>
                                        <Col md={12}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Address *</Form.Label>
                                                <Form.Control
                                                    as="textarea"
                                                    rows={2}
                                                    name="address"
                                                    value={formData.address}
                                                    onChange={handleInputChange}
                                                    placeholder="Enter hotel address"
                                                    required
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>

                                    <Row>
                                        <Col md={4}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Category</Form.Label>
                                                <Form.Select
                                                    name="category"
                                                    value={formData.category}
                                                    onChange={handleInputChange}
                                                >
                                                    <option value="">Select Category</option>
                                                    {categories.map((cat) => (
                                                        <option key={cat.id} value={cat.name}>
                                                            {cat.name}
                                                        </option>
                                                    ))}
                                                </Form.Select>
                                            </Form.Group>
                                        </Col>
                                        <Col md={4}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Distance (m)</Form.Label>
                                                <Form.Control
                                                    type="number"
                                                    name="distance"
                                                    value={formData.distance}
                                                    onChange={handleInputChange}
                                                    placeholder="Distance in meters"
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={4}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Walking Time (minutes)</Form.Label>
                                                <Form.Control
                                                    type="number"
                                                    name="walking_time"
                                                    value={formData.walking_time}
                                                    onChange={handleInputChange}
                                                    placeholder="Walking time in minutes"
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>

                                    <Row>
                                        <Col md={4}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Walking Distance (m)</Form.Label>
                                                <Form.Control
                                                    type="number"
                                                    name="walking_distance"
                                                    value={formData.walking_distance}
                                                    onChange={handleInputChange}
                                                    placeholder="Walking distance in meters"
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={4}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Contact Number</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    name="contact_number"
                                                    value={formData.contact_number}
                                                    onChange={handleInputChange}
                                                    placeholder="Contact number"
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={4}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Status</Form.Label>
                                                <Form.Select
                                                    name="status"
                                                    value={formData.status}
                                                    onChange={handleInputChange}
                                                >
                                                    {statusOptions.map((status) => (
                                                        <option key={status.value} value={status.value}>
                                                            {status.label}
                                                        </option>
                                                    ))}
                                                </Form.Select>
                                            </Form.Group>
                                        </Col>
                                    </Row>

                                    <Row>
                                        <Col md={12}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Google Location Link</Form.Label>
                                                <Form.Control
                                                    type="url"
                                                    name="google_location"
                                                    value={formData.google_location}
                                                    onChange={handleInputChange}
                                                    placeholder="https://maps.google.com/..."
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>

                                    <Row>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Check
                                                    type="checkbox"
                                                    name="is_active"
                                                    label="Active"
                                                    checked={formData.is_active}
                                                    onChange={handleInputChange}
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Check
                                                    type="checkbox"
                                                    name="reselling_allowed"
                                                    label="Allow Reselling"
                                                    checked={formData.reselling_allowed}
                                                    onChange={handleInputChange}
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>

                            {/* Contact Details */}
                            <Card className="shadow-sm mb-4">
                                <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
                                    <h5 className="mb-0">Contact Details</h5>
                                    <Button variant="light" size="sm" onClick={addContact}>
                                        <Plus size={16} className="me-1" /> Add Contact
                                    </Button>
                                </Card.Header>
                                <Card.Body>
                                    {contacts.length === 0 ? (
                                        <p className="text-muted text-center mb-0">No contacts added. Click "Add Contact" to add one.</p>
                                    ) : (
                                        contacts.map((contact, index) => (
                                            <Card key={index} className="mb-3 border">
                                                <Card.Body>
                                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                                        <Badge bg="secondary">Contact #{index + 1}</Badge>
                                                        <Button
                                                            variant="outline-danger"
                                                            size="sm"
                                                            onClick={() => removeContact(index)}
                                                        >
                                                            <Trash2 size={14} className="me-1" /> Remove
                                                        </Button>
                                                    </div>
                                                    <Row>
                                                        <Col md={4}>
                                                            <Form.Group className="mb-3">
                                                                <Form.Label className="small">Name</Form.Label>
                                                                <Form.Control
                                                                    type="text"
                                                                    value={contact.name}
                                                                    onChange={(e) => updateContact(index, 'name', e.target.value)}
                                                                    placeholder="Contact name"
                                                                />
                                                            </Form.Group>
                                                        </Col>
                                                        <Col md={4}>
                                                            <Form.Group className="mb-3">
                                                                <Form.Label className="small">Phone</Form.Label>
                                                                <Form.Control
                                                                    type="text"
                                                                    value={contact.phone}
                                                                    onChange={(e) => updateContact(index, 'phone', e.target.value)}
                                                                    placeholder="Phone number"
                                                                />
                                                            </Form.Group>
                                                        </Col>
                                                        <Col md={4}>
                                                            <Form.Group className="mb-3">
                                                                <Form.Label className="small">Email</Form.Label>
                                                                <Form.Control
                                                                    type="email"
                                                                    value={contact.email}
                                                                    onChange={(e) => updateContact(index, 'email', e.target.value)}
                                                                    placeholder="Email address"
                                                                />
                                                            </Form.Group>
                                                        </Col>
                                                    </Row>
                                                </Card.Body>
                                            </Card>
                                        ))
                                    )}
                                </Card.Body>
                            </Card>

                            {/* Photos */}
                            <Card className="shadow-sm mb-4">
                                <Card.Header className="bg-primary text-white">
                                    <h5 className="mb-0">Photos</h5>
                                </Card.Header>
                                <Card.Body>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Upload Photos</Form.Label>
                                        <Form.Control
                                            type="file"
                                            multiple
                                            accept="image/*"
                                            onChange={handlePhotoUpload}
                                        />
                                    </Form.Group>

                                    {photos.length > 0 && (
                                        <Row>
                                            {photos.map((photo, index) => (
                                                <Col md={3} key={index} className="mb-3">
                                                    <Card className="border">
                                                        <Card.Img
                                                            variant="top"
                                                            src={photo.url || photo.image}
                                                            style={{ height: '150px', objectFit: 'cover' }}
                                                        />
                                                        <Card.Body className="p-2">
                                                            <Button
                                                                variant="outline-danger"
                                                                size="sm"
                                                                className="w-100"
                                                                onClick={() => removePhoto(index)}
                                                            >
                                                                <Trash2 size={14} className="me-1" /> Remove
                                                            </Button>
                                                        </Card.Body>
                                                    </Card>
                                                </Col>
                                            ))}
                                        </Row>
                                    )}
                                </Card.Body>
                            </Card>

                            {/* Video */}
                            <Card className="shadow-sm mb-4">
                                <Card.Header className="bg-primary text-white">
                                    <h5 className="mb-0">Video</h5>
                                </Card.Header>
                                <Card.Body>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Upload Video</Form.Label>
                                        <Form.Control
                                            type="file"
                                            accept="video/*"
                                            onChange={(e) => setVideoFile(e.target.files && e.target.files[0] ? e.target.files[0] : null)}
                                        />
                                        {videoFile && (
                                            <div className="mt-2">
                                                <small className="text-muted">Selected: {videoFile.name}</small>
                                            </div>
                                        )}
                                    </Form.Group>
                                </Card.Body>
                            </Card>

                            {/* Action Buttons */}
                            <div className="d-flex justify-content-end gap-2 mb-4">
                                <Button variant="outline-secondary" onClick={() => navigate('/hotel-availability-manager')}>
                                    Cancel
                                </Button>
                                <Button variant="primary" type="submit" disabled={loading}>
                                    {loading ? (
                                        <>
                                            <Spinner animation="border" size="sm" className="me-2" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={16} className="me-1" /> Save Changes
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

export default EditHotelDetails;

