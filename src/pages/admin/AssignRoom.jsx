import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Badge, Alert } from 'react-bootstrap';
import { Save, ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Select from 'react-select';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import HotelsTabs from '../../components/HotelsTabs';
import axios from 'axios';

const AssignRoom = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const preselectedHotelId = searchParams.get('hotel');
    const preselectedFloorId = searchParams.get('floor');

    const [hotels, setHotels] = useState([]);
    const [floors, setFloors] = useState([]);
    const [roomTypesForHotel, setRoomTypesForHotel] = useState([]);
    const [bedTypesData, setBedTypesData] = useState([]); // Store bed types with capacity
    const [selectedHotelId, setSelectedHotelId] = useState(preselectedHotelId || null);
    const [selectedHotelName, setSelectedHotelName] = useState('');
    const [isHotelPreselected, setIsHotelPreselected] = useState(!!preselectedHotelId);
    const [alert, setAlert] = useState(null);
    const [loading, setLoading] = useState(false);

    // Store rooms by floor: { floorId: [rooms] }
    const [floorRooms, setFloorRooms] = useState({});
    const [editingFloorId, setEditingFloorId] = useState(null);
    const [editFloorTitle, setEditFloorTitle] = useState('');
    const [editFloorNo, setEditFloorNo] = useState('');

    const token = localStorage.getItem('accessToken');
    const orgDataRaw = localStorage.getItem('selectedOrganization');
    let organizationId = null;
    try {
        const parsed = orgDataRaw ? JSON.parse(orgDataRaw) : null;
        organizationId = parsed?.id ?? null;
    } catch (e) {
        organizationId = null;
    }

    // Default fallback room types if none found in database
    const defaultRoomTypes = [
        { value: 'single', label: 'Single' },
        { value: 'double', label: 'Double' },
        { value: 'triple', label: 'Triple' },
        { value: 'quad', label: 'Quad' },
        { value: 'quint', label: 'Quint' },
        { value: 'suite', label: 'Suite' },
        { value: 'deluxe', label: 'Deluxe' },
        { value: 'executive', label: 'Executive' },
    ];

    const statusOptions = [
        { value: 'AVAILABLE', label: 'Available' },
        { value: 'OCCUPIED', label: 'Occupied' },
        { value: 'NEED_CLEANING', label: 'Need Cleaning' },
        { value: 'UNDER_MAINTENANCE', label: 'Under Maintenance' },
    ];

    useEffect(() => {
        if (preselectedHotelId) {
            // If hotel is preselected, only fetch that hotel's data
            fetchSingleHotel(preselectedHotelId);
            fetchFloors(preselectedHotelId);
            fetchRoomTypesForHotel(preselectedHotelId);
        } else {
            // Otherwise fetch all hotels
            fetchHotels();
        }
    }, []);

    useEffect(() => {
        if (selectedHotelId && !isHotelPreselected) {
            fetchFloors(selectedHotelId);
            fetchRoomTypesForHotel(selectedHotelId);
        } else if (!selectedHotelId) {
            setFloors([]);
            setRoomTypesForHotel([]);
        }
    }, [selectedHotelId]);

    const showAlert = (type, message) => {
        setAlert({ type, message });
        setTimeout(() => setAlert(null), 3000);
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
            setHotels([]);
        }
    };

    const fetchSingleHotel = async (hotelId) => {
        try {
            const res = await axios.get(`http://127.0.0.1:8000/api/hotels/${hotelId}/`, {
                params: organizationId ? { organization: organizationId } : {},
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            const hotel = res.data;
            setSelectedHotelName(hotel.name || 'Unknown Hotel');
            setHotels([hotel]);
        } catch (e) {
            console.error('Failed to load hotel', e);
            setSelectedHotelName('Unknown Hotel');
        }
    };

    const fetchFloors = async (hotelId) => {
        try {
            const res = await axios.get(`http://127.0.0.1:8000/api/hotel-floors/`, {
                params: {
                    hotel: hotelId,
                    organization: organizationId
                },
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });

            // API returns { hotels: [...] } structure
            const data = res.data.results || res.data;
            const hotelsArray = data.hotels || data || [];

            // Find the specific hotel in the array and get its floors
            let filteredFloors = [];
            if (Array.isArray(hotelsArray)) {
                const selectedHotelData = hotelsArray.find(h => h.id === parseInt(hotelId));
                if (selectedHotelData && selectedHotelData.floors) {
                    // Map API floor structure to component format
                    filteredFloors = selectedHotelData.floors.map(floor => ({
                        // Use floor.id if it exists from API, otherwise use floor_no as unique identifier
                        id: floor.id || `floor_${floor.floor_no}`,
                        floor_no: floor.floor_no,
                        floor_title: floor.floor_display || `Floor ${floor.floor_no}`,
                        total_rooms: floor.total_rooms || 0,
                        total_beds: floor.total_beds || 0,
                    }));
                }
            }

            console.log('Selected Hotel ID:', hotelId);
            console.log('Filtered floors:', filteredFloors.length);
            console.log('Floors data:', filteredFloors);

            setFloors(filteredFloors);

            // Fetch existing rooms for each floor
            await fetchExistingRoomsForFloors(filteredFloors, hotelId);
        } catch (e) {
            console.error('Failed to load floors', e);
            setFloors([]);
        }
    };

    const fetchExistingRoomsForFloors = async (floors, hotelId) => {
        try {
            // Fetch all rooms for this hotel
            const res = await axios.get(`http://127.0.0.1:8000/api/hotel-rooms/`, {
                params: {
                    hotel: hotelId,
                    hotel_id: hotelId
                },
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });

            const allRooms = Array.isArray(res.data) ? res.data : Array.isArray(res.data?.results) ? res.data.results : [];
            console.log('Fetched existing rooms for hotel', hotelId, ':', allRooms);

            // Group rooms by floor
            const roomsByFloor = {};

            for (const floor of floors) {
                // Filter rooms that belong to BOTH this hotel AND this floor
                const floorRooms = allRooms.filter(room => {
                    // Skip placeholder rooms
                    const roomNumber = room.room_number || room.room_no || '';
                    if (roomNumber.includes('PLACEHOLDER') || room.total_beds === 0) {
                        console.log(`Skipping placeholder room: ${roomNumber}`);
                        return false;
                    }

                    // Check hotel match
                    const roomHotelId = typeof room.hotel === 'object' ? room.hotel.id : room.hotel;
                    const hotelMatch = parseInt(roomHotelId) === parseInt(hotelId);

                    // Check floor match
                    const roomFloor = room.floor || room.floor_id || room.floor_no;
                    const floorMatch = String(roomFloor) === String(floor.floor_no);

                    console.log(`Room ${room.id}: hotel ${roomHotelId} === ${hotelId}? ${hotelMatch}, floor ${roomFloor} === ${floor.floor_no}? ${floorMatch}`);

                    return hotelMatch && floorMatch;
                });

                console.log(`Floor ${floor.floor_no} has ${floorRooms.length} rooms`);

                // Transform backend room format to component format
                const transformedRooms = floorRooms.map(room => ({
                    id: room.id, // Include room ID for updates
                    room_no: room.room_number || room.room_no || '',
                    room_type: room.room_type || 'double',
                    capacity: room.total_beds || room.capacity || 2,
                    room_availability_status: room.status || room.room_availability_status || 'AVAILABLE',
                    map_x_coordinate: room.map_x_coordinate || 0,
                    map_y_coordinate: room.map_y_coordinate || 0,
                    beds: (room.details || room.beds || []).map((bed, idx) => {
                        // Map is_assigned to status for compatibility
                        let bedStatus = bed.status || 'AVAILABLE';
                        if (!bed.status && bed.is_assigned !== undefined) {
                            bedStatus = bed.is_assigned ? 'OCCUPIED' : 'AVAILABLE';
                        }
                        return {
                            id: bed.id || bed.bed_id, // Include bed ID
                            bed_no: bed.bed_number || bed.bed_no || String(idx + 1),
                            status: bedStatus
                        };
                    })
                }));

                roomsByFloor[floor.id] = transformedRooms;
            }

            console.log('Rooms grouped by floor:', roomsByFloor);
            setFloorRooms(roomsByFloor);
        } catch (e) {
            console.error('Failed to fetch existing rooms:', e);
        }
    };

    const fetchRoomTypesForHotel = async (hotelId) => {
        try {
            // Fetch bed types using organization parameter
            const res = await axios.get(`http://127.0.0.1:8000/api/bed-types/`, {
                params: { organization: organizationId },
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });

            const data = Array.isArray(res.data) ? res.data : Array.isArray(res.data?.results) ? res.data.results : [];

            // Store full bed types data for capacity lookup
            setBedTypesData(data);

            // Extract unique room types from bed types
            const uniqueTypes = [...new Set(data.map(bedType => bedType.name))].filter(Boolean);

            // Format for dropdown
            const formattedTypes = uniqueTypes.map(type => ({
                value: type.toLowerCase(),
                label: type.charAt(0).toUpperCase() + type.slice(1)
            }));

            // If no room types found, use default fallback
            if (formattedTypes.length === 0) {
                setRoomTypesForHotel(defaultRoomTypes);
                setBedTypesData([]);
                console.log('No room types found for organization, using defaults');
            } else {
                setRoomTypesForHotel(formattedTypes);
                console.log('Loaded room types for organization:', formattedTypes);
            }
        } catch (e) {
            console.error('Failed to load room types', e);
            setRoomTypesForHotel(defaultRoomTypes);
            setBedTypesData([]);
        }
    };

    const startEditingFloor = (floor) => {
        setEditingFloorId(floor.id);
        setEditFloorTitle(floor.floor_title);
        setEditFloorNo(floor.floor_no);
    };

    const cancelEditingFloor = () => {
        setEditingFloorId(null);
        setEditFloorTitle('');
        setEditFloorNo('');
    };

    const saveFloorDetails = async (floorId) => {
        try {
            const currentFloor = floors.find(f => f.id === floorId);
            const oldFloorNo = currentFloor?.floor_no;
            const newFloorNo = parseInt(editFloorNo);

            // Update floor details
            await axios.patch(
                `http://127.0.0.1:8000/api/hotel-floors/${floorId}/`,
                {
                    floor_title: editFloorTitle,
                    floor_no: newFloorNo
                },
                { headers: token ? { Authorization: `Bearer ${token}` } : {} }
            );

            // If floor number changed, update all rooms on this floor with the new floor number
            if (oldFloorNo !== newFloorNo) {
                const roomsOnFloor = floorRooms[floorId] || [];
                for (const room of roomsOnFloor) {
                    if (room.id) {
                        await axios.patch(
                            `http://127.0.0.1:8000/api/hotel-rooms/${room.id}/`,
                            { floor: String(newFloorNo) },
                            { headers: token ? { Authorization: `Bearer ${token}` } : {} }
                        );
                    }
                }
            }

            // Update local state
            setFloors(floors.map(f =>
                f.id === floorId ? { ...f, floor_title: editFloorTitle, floor_no: newFloorNo } : f
            ));

            showAlert('success', 'Floor details updated successfully');
            cancelEditingFloor();

            // Refresh to reflect changes
            if (selectedHotelId) {
                await fetchFloors(selectedHotelId);
            }
        } catch (e) {
            console.error('Failed to update floor details', e);
            showAlert('danger', 'Failed to update floor details');
        }
    };

    const deleteFloor = async (floorId, floorNo, floorTitle) => {
        const roomsInFloor = floorRooms[floorId] || [];

        if (roomsInFloor.length > 0) {
            showAlert('danger', `Cannot delete floor with existing rooms. Please remove all ${roomsInFloor.length} room(s) first.`);
            return;
        }

        if (!window.confirm(`Are you sure you want to delete Floor ${floorNo} - ${floorTitle}? This action cannot be undone.`)) {
            return;
        }

        try {
            await axios.delete(`http://127.0.0.1:8000/api/hotel-floors/${floorId}/`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });

            // Remove from local state
            setFloors(floors.filter(f => f.id !== floorId));

            // Remove floor rooms from state
            setFloorRooms(prev => {
                const updated = { ...prev };
                delete updated[floorId];
                return updated;
            });

            showAlert('success', `Floor ${floorNo} deleted successfully`);
        } catch (e) {
            console.error('Failed to delete floor', e);
            const errorMsg = e.response?.data?.detail || e.response?.data?.error || 'Failed to delete floor';
            showAlert('danger', errorMsg);
        }
    };

    const addRoom = (floorId) => {
        console.log('Adding room to floor ID:', floorId);
        console.log('Current floorRooms state:', floorRooms);

        setFloorRooms(prev => {
            const updated = {
                ...prev,
                [floorId]: [
                    ...(prev[floorId] || []),
                    {
                        room_no: '',
                        room_type: 'double',
                        capacity: 2,
                        room_availability_status: 'AVAILABLE',
                        map_x_coordinate: 0,
                        map_y_coordinate: 0,
                        beds: [
                            { bed_no: '1', status: 'AVAILABLE', bed_type: 'single' },
                            { bed_no: '2', status: 'AVAILABLE', bed_type: 'single' },
                        ],
                    },
                ]
            };

            console.log('Updated floorRooms state:', updated);
            return updated;
        });
    };

    const removeRoom = async (floorId, roomIndex) => {
        const room = floorRooms[floorId]?.[roomIndex];

        // If room has an ID, it exists in the database and needs to be deleted
        if (room?.id) {
            if (!window.confirm(`Are you sure you want to delete room ${room.room_no}? This action cannot be undone.`)) {
                return;
            }

            try {
                await axios.delete(`http://127.0.0.1:8000/api/hotel-rooms/${room.id}/`, {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                });
                showAlert('success', `Room ${room.room_no} deleted successfully`);
            } catch (e) {
                console.error('Failed to delete room', e);
                showAlert('danger', 'Failed to delete room from database');
                return; // Don't remove from UI if backend deletion failed
            }
        }

        // Remove from local state
        setFloorRooms(prev => ({
            ...prev,
            [floorId]: (prev[floorId] || []).filter((_, i) => i !== roomIndex)
        }));
    };

    const updateRoom = (floorId, roomIndex, field, value) => {
        setFloorRooms(prev => {
            // Deep clone the floor rooms array
            const floorRoomsCopy = (prev[floorId] || []).map(room => ({
                ...room,
                beds: [...(room.beds || [])]
            }));

            // Deep clone the specific room being updated
            floorRoomsCopy[roomIndex] = {
                ...floorRoomsCopy[roomIndex],
                beds: [...(floorRoomsCopy[roomIndex].beds || [])],
                [field]: value
            };

            // When room type changes, auto-set capacity from bed type data
            if (field === 'room_type') {
                const bedType = bedTypesData.find(bt => bt.name.toLowerCase() === value.toLowerCase());
                if (bedType && bedType.capacity) {
                    const newCapacity = parseInt(bedType.capacity) || 2;
                    floorRoomsCopy[roomIndex].capacity = newCapacity;

                    // Update beds based on new capacity with numeric labels
                    const newBeds = [];
                    for (let i = 0; i < newCapacity; i++) {
                        newBeds.push({ bed_no: `${i + 1}`, status: 'AVAILABLE', bed_type: 'single' });
                    }
                    floorRoomsCopy[roomIndex].beds = newBeds;
                }
            }

            // Update beds count when capacity changes manually
            if (field === 'capacity') {
                const newCapacity = parseInt(value) || 0;
                const currentBeds = floorRoomsCopy[roomIndex].beds.length;

                if (newCapacity > currentBeds) {
                    // Create new beds array with additional beds
                    const newBeds = [...floorRoomsCopy[roomIndex].beds];
                    for (let i = currentBeds; i < newCapacity; i++) {
                        newBeds.push({ bed_no: `${i + 1}`, status: 'AVAILABLE', bed_type: 'single' });
                    }
                    floorRoomsCopy[roomIndex].beds = newBeds;
                } else if (newCapacity < currentBeds) {
                    // Remove beds by creating new sliced array
                    floorRoomsCopy[roomIndex].beds = floorRoomsCopy[roomIndex].beds.slice(0, newCapacity);
                }
            }

            return {
                ...prev,
                [floorId]: floorRoomsCopy
            };
        });
    };

    const updateBed = (floorId, roomIndex, bedIndex, field, value) => {
        setFloorRooms(prev => {
            // Deep clone the floor rooms array
            const floorRoomsCopy = (prev[floorId] || []).map(room => ({
                ...room,
                beds: [...(room.beds || [])]
            }));

            // Deep clone the specific room's beds array
            floorRoomsCopy[roomIndex] = {
                ...floorRoomsCopy[roomIndex],
                beds: floorRoomsCopy[roomIndex].beds.map((bed, idx) =>
                    idx === bedIndex ? { ...bed, [field]: value } : bed
                )
            };

            return {
                ...prev,
                [floorId]: floorRoomsCopy
            };
        });
    };

    const handleSave = async () => {
        if (!selectedHotelId) {
            showAlert('danger', 'Please select a hotel first');
            return;
        }

        setLoading(true);
        try {
            // Create or update rooms with beds for each floor
            for (const [floorId, rooms] of Object.entries(floorRooms)) {
                if (!rooms || rooms.length === 0) continue;

                // Get the floor object to access floor_no
                const floorObj = floors.find(f => f.id === parseInt(floorId));
                const floorNumber = floorObj?.floor_no ? String(floorObj.floor_no) : '1';

                for (const room of rooms) {
                    // Build the details array for beds
                    const details = room.beds.map((bed, index) => ({
                        bed_number: parseInt(bed.bed_no) || (index + 1),
                        status: bed.status || 'AVAILABLE',
                        ...(bed.id && { id: bed.id }) // Include bed ID if it exists for updates
                    }));

                    const roomPayload = {
                        hotel: parseInt(selectedHotelId),
                        floor: floorNumber,
                        room_type: room.room_type,
                        room_number: room.room_no,
                        total_beds: parseInt(room.capacity) || 1,
                        status: room.room_availability_status || 'AVAILABLE',
                        details: details
                    };

                    // Check if this is an existing room (has ID) or a new room
                    if (room.id) {
                        // Update existing room
                        await axios.patch(`http://127.0.0.1:8000/api/hotel-rooms/${room.id}/`, roomPayload, {
                            headers: token ? { Authorization: `Bearer ${token}` } : {},
                        });
                        console.log(`Updated existing room ${room.id}`);
                    } else {
                        // Create new room
                        await axios.post('http://127.0.0.1:8000/api/hotel-rooms/', roomPayload, {
                            headers: token ? { Authorization: `Bearer ${token}` } : {},
                        });
                        console.log(`Created new room ${room.room_no}`);
                    }
                }
            }

            showAlert('success', 'Rooms saved successfully');
            // Refresh the floor data to show updated rooms
            await fetchFloors(selectedHotelId);
        } catch (e) {
            console.error('Failed to save rooms', e);
            const errorMsg = e.response?.data?.detail || e.response?.data?.error || 'Failed to save rooms';
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
                            <HotelsTabs activeName="Hotel Floor Management" />
                        </Col>
                    </Row>

                    <Row className="mb-4">
                        <Col>
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h2 className="mb-1">Assign Rooms to Floor</h2>
                                    <p className="text-muted mb-0">Add multiple rooms with beds to a hotel floor</p>
                                </div>
                                <Button variant="outline-secondary" size="sm" onClick={() => navigate('/hotel-floor-management')}>
                                    <ArrowLeft size={16} className="me-1" /> Back to Floor Management
                                </Button>
                            </div>
                        </Col>
                    </Row>

                    <Card className="shadow-sm mb-4">
                        <Card.Body>
                            {isHotelPreselected ? (
                                <div className="p-3 bg-light rounded">
                                    <small className="text-muted d-block mb-1">Managing Floors & Rooms for:</small>
                                    <h5 className="mb-0 text-primary">{selectedHotelName}</h5>
                                </div>
                            ) : (
                                <Form.Group>
                                    <Form.Label className="fw-bold">Select Hotel *</Form.Label>
                                    <Form.Select
                                        value={selectedHotelId || ''}
                                        onChange={(e) => setSelectedHotelId(e.target.value)}
                                    >
                                        <option value="">-- Select a hotel --</option>
                                        {hotels.map((h) => (
                                            <option key={h.id} value={h.id}>
                                                {h.name} - {h.city}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            )}
                        </Card.Body>
                    </Card>

                    {selectedHotelId && floors.length > 0 ? (
                        <>
                            {floors.map((floor) => {
                                const roomsInFloor = floorRooms[floor.id] || [];
                                const isEditing = editingFloorId === floor.id;

                                // Debug logging
                                console.log(`Rendering floor ${floor.floor_no} with ID: ${floor.id}, rooms:`, roomsInFloor.length);

                                return (
                                    <Card key={floor.id} className="shadow-sm mb-4">
                                        <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
                                            <div className="flex-grow-1 me-3">
                                                {isEditing ? (
                                                    <div className="d-flex align-items-center gap-2">
                                                        <Form.Control
                                                            type="number"
                                                            value={editFloorNo}
                                                            onChange={(e) => setEditFloorNo(e.target.value)}
                                                            size="sm"
                                                            placeholder="Floor No"
                                                            style={{ maxWidth: '100px' }}
                                                            min="1"
                                                        />
                                                        <Form.Control
                                                            type="text"
                                                            value={editFloorTitle}
                                                            onChange={(e) => setEditFloorTitle(e.target.value)}
                                                            size="sm"
                                                            placeholder="Floor Title"
                                                            style={{ maxWidth: '300px' }}
                                                        />
                                                        <Button
                                                            variant="success"
                                                            size="sm"
                                                            onClick={() => saveFloorDetails(floor.id)}
                                                        >
                                                            <Save size={14} /> Save
                                                        </Button>
                                                        <Button
                                                            variant="secondary"
                                                            size="sm"
                                                            onClick={cancelEditingFloor}
                                                        >
                                                            Cancel
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <div className="d-flex align-items-center gap-2">
                                                        <div>
                                                            <h5 className="mb-0">Floor {floor.floor_no} - {floor.floor_title}</h5>
                                                            <small>{roomsInFloor.length} room{roomsInFloor.length !== 1 ? 's' : ''}</small>
                                                        </div>
                                                        <Button
                                                            variant="outline-light"
                                                            size="sm"
                                                            onClick={() => startEditingFloor(floor)}
                                                        >
                                                            Edit Floor
                                                        </Button>
                                                        <Button
                                                            variant="outline-danger"
                                                            size="sm"
                                                            onClick={() => deleteFloor(floor.id, floor.floor_no, floor.floor_title)}
                                                            title={roomsInFloor.length > 0 ? 'Remove all rooms before deleting floor' : 'Delete floor'}
                                                        >
                                                            <Trash2 size={14} />
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                            <Button
                                                variant="light"
                                                size="sm"
                                                onClick={() => addRoom(floor.id)}
                                            >
                                                <Plus size={16} className="me-1" /> Add Room
                                            </Button>
                                        </Card.Header>
                                        <Card.Body>
                                            {roomsInFloor.length === 0 ? (
                                                <p className="text-muted text-center mb-0">No rooms added yet. Click "Add Room" to create rooms for this floor.</p>
                                            ) : (
                                                roomsInFloor.map((room, roomIndex) => (
                                                    <Card key={roomIndex} className="mb-3 border">
                                                        <Card.Body>
                                                            <div className="d-flex justify-content-between align-items-center mb-3">
                                                                <div>
                                                                    <Badge bg="secondary" className="me-2">Room #{roomIndex + 1}</Badge>
                                                                    {room.id ? (
                                                                        <Badge bg="success">Existing Room</Badge>
                                                                    ) : (
                                                                        <Badge bg="info">New Room</Badge>
                                                                    )}
                                                                </div>
                                                                <Button
                                                                    variant="outline-danger"
                                                                    size="sm"
                                                                    onClick={() => removeRoom(floor.id, roomIndex)}
                                                                >
                                                                    Remove Room
                                                                </Button>
                                                            </div>

                                                            <Row className="mb-3">
                                                                <Col md={3}>
                                                                    <Form.Group>
                                                                        <Form.Label>Room Number *</Form.Label>
                                                                        <Form.Control
                                                                            type="text"
                                                                            placeholder="e.g., 101"
                                                                            value={room.room_no}
                                                                            onChange={(e) => updateRoom(floor.id, roomIndex, 'room_no', e.target.value)}
                                                                        />
                                                                    </Form.Group>
                                                                </Col>
                                                                <Col md={3}>
                                                                    <Form.Group>
                                                                        <Form.Label>Room Type</Form.Label>
                                                                        <Form.Select
                                                                            value={room.room_type}
                                                                            onChange={(e) => updateRoom(floor.id, roomIndex, 'room_type', e.target.value)}
                                                                        >
                                                                            {roomTypesForHotel.map((type) => (
                                                                                <option key={type.value} value={type.value}>
                                                                                    {type.label}
                                                                                </option>
                                                                            ))}
                                                                        </Form.Select>
                                                                    </Form.Group>
                                                                </Col>
                                                                <Col md={3}>
                                                                    <Form.Group>
                                                                        <Form.Label>Capacity (Beds)</Form.Label>
                                                                        <Form.Control
                                                                            type="number"
                                                                            min="1"
                                                                            max="10"
                                                                            value={room.capacity}
                                                                            onChange={(e) => updateRoom(floor.id, roomIndex, 'capacity', e.target.value)}
                                                                            readOnly={room.room_type?.toLowerCase() !== 'sharing'}
                                                                            disabled={room.room_type?.toLowerCase() !== 'sharing'}
                                                                            style={room.room_type?.toLowerCase() !== 'sharing' ? { backgroundColor: '#e9ecef', cursor: 'not-allowed' } : {}}
                                                                        />
                                                                    </Form.Group>
                                                                </Col>
                                                                <Col md={3}>
                                                                    <Form.Group>
                                                                        <Form.Label>Status</Form.Label>
                                                                        <Form.Select
                                                                            value={room.room_availability_status}
                                                                            onChange={(e) => updateRoom(floor.id, roomIndex, 'room_availability_status', e.target.value)}
                                                                        >
                                                                            {statusOptions.map((opt) => (
                                                                                <option key={opt.value} value={opt.value}>
                                                                                    {opt.label}
                                                                                </option>
                                                                            ))}
                                                                        </Form.Select>
                                                                    </Form.Group>
                                                                </Col>
                                                            </Row>

                                                            <div className="border-top pt-3">
                                                                <h6 className="text-muted mb-3">Beds in this Room</h6>
                                                                <Row>
                                                                    {room.beds.map((bed, bedIndex) => (
                                                                        <Col md={4} key={bedIndex} className="mb-2">
                                                                            <Card className="border">
                                                                                <Card.Body className="p-2">
                                                                                    <Form.Group className="mb-2">
                                                                                        <Form.Label className="small">Bed Number</Form.Label>
                                                                                        <Form.Control
                                                                                            size="sm"
                                                                                            type="text"
                                                                                            value={bed.bed_no}
                                                                                            onChange={(e) => updateBed(floor.id, roomIndex, bedIndex, 'bed_no', e.target.value)}
                                                                                        />
                                                                                    </Form.Group>
                                                                                    <Form.Group>
                                                                                        <Form.Label className="small">Status</Form.Label>
                                                                                        <Form.Select
                                                                                            size="sm"
                                                                                            value={bed.status}
                                                                                            onChange={(e) => updateBed(floor.id, roomIndex, bedIndex, 'status', e.target.value)}
                                                                                            disabled={room.room_type?.toLowerCase() !== 'sharing'}
                                                                                        >
                                                                                            {statusOptions.map((opt) => (
                                                                                                <option key={opt.value} value={opt.value}>
                                                                                                    {opt.label}
                                                                                                </option>
                                                                                            ))}
                                                                                        </Form.Select>
                                                                                    </Form.Group>
                                                                                </Card.Body>
                                                                            </Card>
                                                                        </Col>
                                                                    ))}
                                                                </Row>
                                                            </div>
                                                        </Card.Body>
                                                    </Card>
                                                ))
                                            )}
                                        </Card.Body>
                                    </Card>
                                );
                            })}

                            <div className="d-flex justify-content-end gap-2">
                                <Button variant="outline-secondary" onClick={() => navigate('/hotel-floor-management')}>
                                    Cancel
                                </Button>
                                <Button variant="primary" onClick={handleSave} disabled={loading}>
                                    {loading ? 'Saving...' : 'Save All Rooms'}
                                </Button>
                            </div>
                        </>
                    ) : selectedHotelId ? (
                        <Card className="shadow-sm">
                            <Card.Body className="text-center py-5">
                                <p className="text-muted mb-0">No floors found for this hotel. Please add floors first from the Floor Management page.</p>
                            </Card.Body>
                        </Card>
                    ) : null}
                </Container>
            </div>
        </div>
    );
};

export default AssignRoom;
