import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Form, Badge, Modal, Alert } from 'react-bootstrap';
import { Plus, Edit2, Trash2, Eye, MapPin, Bed, DoorOpen, Image as ImageIcon, Save, X, AlertCircle } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import HotelsTabs from '../../components/HotelsTabs';
import api from '../../utils/Api';
import { toast } from 'react-toastify';
import '../../styles/hotel-floor-management.css';
import { usePermission } from '../../contexts/EnhancedPermissionContext';

const HotelFloorManagement = () => {
  const { hasPermission } = usePermission();
  // Active Tab State
  const [activeTab, setActiveTab] = useState('floors');

  // State Management
  const [hotels, setHotels] = useState([]);
  const [hotelFloors, setHotelFloors] = useState({}); // {hotelId: [floors]}
  const [floors, setFloors] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [beds, setBeds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);

  // Modal States
  const [showFloorModal, setShowFloorModal] = useState(false);
  const [showBulkFloorsModal, setShowBulkFloorsModal] = useState(false);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [showBedModal, setShowBedModal] = useState(false);
  const [showBulkCreateModal, setShowBulkCreateModal] = useState(false);
  const [editMode, setEditMode] = useState(false);

  // Form States
  const [bulkFloorsForm, setBulkFloorsForm] = useState({
    hotel_id: '',
    number_of_floors: 1,
  });

  const [floorForm, setFloorForm] = useState({
    hotel_id: '',
    floor_no: '',
    floor_title: '',
    map_image: null,
  });

  const [roomForm, setRoomForm] = useState({
    floor: '',
    room_no: '',
    room_type: 'STANDARD',
    capacity: 1,
    room_availability_status: 'AVAILABLE',
    map_x_coordinate: 0,
    map_y_coordinate: 0,
  });

  const [bedForm, setBedForm] = useState({
    room: '',
    bed_no: '',
    status: 'AVAILABLE',
    assigned_guest: '',
    booking_reference: '',
  });

  const [bulkCreateForm, setBulkCreateForm] = useState({
    hotel_id: '',
    floor_no: '',
    floor_title: '',
    rooms: [
      {
        room_no: '',
        room_type: 'STANDARD',
        capacity: 2,
        room_availability_status: 'AVAILABLE',
        beds: [
          { bed_no: 'A', status: 'AVAILABLE' },
          { bed_no: 'B', status: 'AVAILABLE' },
        ],
      },
    ],
  });

  // Organization & Auth
  const getOrganizationId = () => {
    try {
      const orgData = localStorage.getItem('selectedOrganization');
      if (orgData) {
        const parsed = JSON.parse(orgData);
        return parsed.id;
      }
    } catch (e) {
      console.error('Error parsing organization:', e);
    }
    return null;
  };

  const organizationId = getOrganizationId();

  // Room Type Choices
  const roomTypes = [
    'STANDARD',
    'DELUXE',
    'SUITE',
    'EXECUTIVE',
    'PRESIDENTIAL',
    'FAMILY',
    'TWIN',
    'SINGLE',
    'DOUBLE',
  ];

  // Status Choices
  const statusChoices = ['AVAILABLE', 'OCCUPIED', 'NEED CLEANING', 'UNDER MAINTENANCE'];

  // Fetch Hotels
  useEffect(() => {
    if (organizationId) {
      fetchHotels();
      fetchAllFloors(); // Fetch all floors on load
    }
  }, [organizationId]);

  // Fetch Floors when hotel is selected
  useEffect(() => {
    if (selectedHotel && hotelFloors[selectedHotel]) {
      setFloors(hotelFloors[selectedHotel]);
    } else if (selectedHotel) {
      fetchFloors(selectedHotel);
    }
  }, [selectedHotel]);

  // Fetch Floors when floor is selected (for rooms tab)
  useEffect(() => {
    if (selectedFloor) {
      fetchRooms(selectedFloor);
    }
  }, [selectedFloor]);

  // Fetch Beds when room is selected
  useEffect(() => {
    if (selectedRoom) {
      fetchBeds(selectedRoom);
    }
  }, [selectedRoom]);

  const fetchHotels = async () => {
    try {
      setLoading(true);
      // Fetch hotels from hotels API and floors from hotel-floors API
      const [hotelsResponse, floorsResponse] = await Promise.all([
        api.get(`hotels/?organization=${organizationId}`),
        api.get(`hotel-floors/?organization=${organizationId}`)
      ]);

      // Get hotels from hotels API
      const hotelsData = hotelsResponse.data.results || hotelsResponse.data || [];

      // Get floors data
      const floorsData = floorsResponse.data.results || floorsResponse.data;
      const hotelsWithFloors = floorsData.hotels || floorsData || [];

      // Extract floors grouped by hotel
      const floorsByHotel = {};

      // Create a map of hotel ID to city name from hotel-floors API
      const hotelCityMap = {};

      if (Array.isArray(hotelsWithFloors)) {
        hotelsWithFloors.forEach(hotel => {
          // Store floors by hotel ID (use string keys)
          floorsByHotel[hotel.id.toString()] = hotel.floors || [];
          // Store city name from hotel-floors API
          hotelCityMap[hotel.id.toString()] = hotel.city;
        });
      }

      // Merge city names into hotels data
      const hotelsWithCityNames = hotelsData.map(hotel => ({
        ...hotel,
        city: hotelCityMap[hotel.id.toString()] || hotel.city
      }));

      setHotels(hotelsWithCityNames);
      setHotelFloors(floorsByHotel);
    } catch (error) {
      console.error('Error fetching hotels:', error);
      toast.error('Failed to fetch hotels');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllFloors = async () => {
    try {
      setLoading(true);
      const response = await api.get(`hotel-floors/?organization=${organizationId}`);
      setFloors(response.data.results || response.data || []);
    } catch (error) {
      console.error('Error fetching floors:', error);
      toast.error('Failed to fetch floors');
    } finally {
      setLoading(false);
    }
  };

  const fetchFloors = async (hotelId) => {
    try {
      setLoading(true);
      const response = await api.get(`hotel-floors/?organization=${organizationId}&hotel=${hotelId}`);
      const data = response.data.results || response.data;

      // API returns { hotels: [...] } even when filtered by hotel
      const hotelsArray = data.hotels || data || [];

      // Find the specific hotel in the array
      if (Array.isArray(hotelsArray)) {
        const selectedHotelData = hotelsArray.find(h => h.id === parseInt(hotelId));
        if (selectedHotelData && selectedHotelData.floors) {
          setFloors(selectedHotelData.floors);
          // Update hotelFloors state as well (use string key to match selectedHotel)
          setHotelFloors(prev => ({
            ...prev,
            [hotelId.toString()]: selectedHotelData.floors
          }));
        } else {
          setFloors([]);
        }
      } else {
        setFloors([]);
      }
    } catch (error) {
      console.error('Error fetching floors:', error);
      toast.error('Failed to fetch floors');
    } finally {
      setLoading(false);
    }
  };

  const fetchRooms = async (floorId) => {
    try {
      setLoading(true);
      const response = await api.get(`floor-rooms/?floor=${floorId}`);
      setRooms(response.data.results || response.data || []);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      toast.error('Failed to fetch rooms');
    } finally {
      setLoading(false);
    }
  };

  const fetchBeds = async (roomId) => {
    try {
      setLoading(true);
      const response = await api.get(`room-beds/?room=${roomId}`);
      setBeds(response.data.results || response.data || []);
    } catch (error) {
      console.error('Error fetching beds:', error);
      toast.error('Failed to fetch beds');
    } finally {
      setLoading(false);
    }
  };

  // Handle Floor CRUD
  const handleBulkCreateFloors = async () => {
    try {
      const numberOfFloors = parseInt(bulkFloorsForm.number_of_floors);
      if (!bulkFloorsForm.hotel_id || numberOfFloors < 1) {
        toast.error('Please select a hotel and enter a valid number of floors');
        return;
      }

      setLoading(true);

      // Create multiple floors
      for (let i = 1; i <= numberOfFloors; i++) {
        const formData = new FormData();
        formData.append('hotel', bulkFloorsForm.hotel_id);
        formData.append('floor_no', i);
        formData.append('floor_title', `Floor ${i}`);

        await api.post('/hotel-floors/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      toast.success(`${numberOfFloors} floors created successfully`);
      setShowBulkFloorsModal(false);
      setBulkFloorsForm({ hotel_id: '', number_of_floors: 1 });

      // Refresh floors - both all hotels and the specific hotel if one is selected
      await fetchHotels();
      if (selectedHotel) {
        await fetchFloors(selectedHotel);
      }
    } catch (error) {
      console.error('Error creating floors:', error);
      toast.error(error.response?.data?.message || 'Failed to create floors');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveFloor = async () => {
    try {
      const formData = new FormData();
      formData.append('hotel', floorForm.hotel_id);
      formData.append('floor_no', floorForm.floor_no);
      formData.append('floor_title', floorForm.floor_title);
      if (floorForm.map_image) {
        formData.append('map_image', floorForm.map_image);
      }

      if (editMode && selectedFloor) {
        await api.patch(`/hotel-floors/${selectedFloor}/`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Floor updated successfully');
      } else {
        await api.post('/hotel-floors/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Floor created successfully');
      }

      setShowFloorModal(false);
      resetFloorForm();

      // Refresh floors - both all floors and the specific hotel if one is selected
      await fetchHotels(); // This refreshes all hotels and their floor counts
      if (selectedHotel) {
        await fetchFloors(selectedHotel); // Refresh the selected hotel's floors
      }
    } catch (error) {
      console.error('Error saving floor:', error);
      toast.error(error.response?.data?.message || 'Failed to save floor');
    }
  };

  const handleDeleteFloor = async (floorId) => {
    if (!window.confirm('Are you sure you want to delete this floor?')) return;

    try {
      await api.delete(`/hotel-floors/${floorId}/`);
      toast.success('Floor deleted successfully');

      // Refresh floors - both all hotels and the specific hotel if one is selected
      await fetchHotels();
      if (selectedHotel) {
        await fetchFloors(selectedHotel);
      }
    } catch (error) {
      console.error('Error deleting floor:', error);
      toast.error('Failed to delete floor');
    }
  };

  // Handle Room CRUD
  const handleSaveRoom = async () => {
    try {
      const payload = {
        floor: roomForm.floor,
        room_no: roomForm.room_no,
        room_type: roomForm.room_type,
        capacity: roomForm.capacity,
        room_availability_status: roomForm.room_availability_status,
        map_x_coordinate: roomForm.map_x_coordinate,
        map_y_coordinate: roomForm.map_y_coordinate,
      };

      if (editMode && selectedRoom) {
        await api.put(`/floor-rooms/${selectedRoom}/`, payload);
        toast.success('Room updated successfully');
      } else {
        await api.post('/floor-rooms/', payload);
        toast.success('Room created successfully');
      }

      setShowRoomModal(false);
      resetRoomForm();
      if (selectedFloor) fetchRooms(selectedFloor);
    } catch (error) {
      console.error('Error saving room:', error);
      toast.error(error.response?.data?.message || 'Failed to save room');
    }
  };

  const handleDeleteRoom = async (roomId) => {
    if (!window.confirm('Are you sure you want to delete this room?')) return;

    try {
      await api.delete(`/floor-rooms/${roomId}/`);
      toast.success('Room deleted successfully');
      if (selectedFloor) fetchRooms(selectedFloor);
    } catch (error) {
      console.error('Error deleting room:', error);
      toast.error('Failed to delete room');
    }
  };

  // Handle Bed CRUD
  const handleSaveBed = async () => {
    try {
      const payload = {
        room: bedForm.room,
        bed_no: bedForm.bed_no,
        status: bedForm.status,
        assigned_guest: bedForm.assigned_guest || null,
        booking_reference: bedForm.booking_reference || null,
      };

      if (editMode && selectedRoom) {
        await api.put(`/room-beds/${selectedRoom}/`, payload);
        toast.success('Bed updated successfully');
      } else {
        await api.post('/room-beds/', payload);
        toast.success('Bed created successfully');
      }

      setShowBedModal(false);
      resetBedForm();
      if (selectedRoom) fetchBeds(selectedRoom);
    } catch (error) {
      console.error('Error saving bed:', error);
      toast.error(error.response?.data?.message || 'Failed to save bed');
    }
  };

  const handleDeleteBed = async (bedId) => {
    if (!window.confirm('Are you sure you want to delete this bed?')) return;

    try {
      await api.delete(`/room-beds/${bedId}/`);
      toast.success('Bed deleted successfully');
      if (selectedRoom) fetchBeds(selectedRoom);
    } catch (error) {
      console.error('Error deleting bed:', error);
      toast.error('Failed to delete bed');
    }
  };

  // Handle Bulk Create
  const handleBulkCreate = async () => {
    try {
      await api.post('/room-map/', bulkCreateForm);
      toast.success('Floor with rooms and beds created successfully');
      setShowBulkCreateModal(false);
      resetBulkCreateForm();
      fetchAllFloors(); // Refresh all floors
    } catch (error) {
      console.error('Error bulk creating:', error);
      toast.error(error.response?.data?.message || 'Failed to create floor');
    }
  };

  // Reset Forms
  const resetFloorForm = () => {
    setFloorForm({
      hotel_id: '',
      floor_no: '',
      floor_title: '',
      map_image: null,
    });
    setEditMode(false);
  };

  const resetRoomForm = () => {
    setRoomForm({
      floor: '',
      room_no: '',
      room_type: 'STANDARD',
      capacity: 1,
      room_availability_status: 'AVAILABLE',
      map_x_coordinate: 0,
      map_y_coordinate: 0,
    });
    setEditMode(false);
  };

  const resetBedForm = () => {
    setBedForm({
      room: '',
      bed_no: '',
      status: 'AVAILABLE',
      assigned_guest: '',
      booking_reference: '',
    });
    setEditMode(false);
  };

  const resetBulkCreateForm = () => {
    setBulkCreateForm({
      hotel_id: '',
      floor_no: '',
      floor_title: '',
      rooms: [
        {
          room_no: '',
          room_type: 'STANDARD',
          capacity: 2,
          room_availability_status: 'AVAILABLE',
          beds: [
            { bed_no: 'A', status: 'AVAILABLE' },
            { bed_no: 'B', status: 'AVAILABLE' },
          ],
        },
      ],
    });
  };

  // Open Modals
  const openAddFloorModal = () => {
    resetFloorForm();
    setEditMode(false);
    setShowFloorModal(true);
  };

  const openEditFloorModal = (floor) => {
    setFloorForm({
      hotel_id: floor.hotel,
      floor_no: floor.floor_no,
      floor_title: floor.floor_title,
      map_image: null,
    });
    setSelectedFloor(floor.id);
    setEditMode(true);
    setShowFloorModal(true);
  };

  const openAddRoomModal = () => {
    resetRoomForm();
    setRoomForm({ ...roomForm, floor: selectedFloor });
    setEditMode(false);
    setShowRoomModal(true);
  };

  const openEditRoomModal = (room) => {
    setRoomForm({
      floor: room.floor,
      room_no: room.room_no,
      room_type: room.room_type,
      capacity: room.capacity,
      room_availability_status: room.room_availability_status,
      map_x_coordinate: room.map_x_coordinate || 0,
      map_y_coordinate: room.map_y_coordinate || 0,
    });
    setSelectedRoom(room.id);
    setEditMode(true);
    setShowRoomModal(true);
  };

  const openAddBedModal = () => {
    resetBedForm();
    setBedForm({ ...bedForm, room: selectedRoom });
    setEditMode(false);
    setShowBedModal(true);
  };

  const openEditBedModal = (bed) => {
    setBedForm({
      room: bed.room,
      bed_no: bed.bed_no,
      status: bed.status,
      assigned_guest: bed.assigned_guest || '',
      booking_reference: bed.booking_reference || '',
    });
    setEditMode(true);
    setShowBedModal(true);
  };

  const openBulkCreateModal = () => {
    resetBulkCreateForm();
    setShowBulkCreateModal(true);
  };

  // Bulk Form Handlers
  const addRoomToBulk = () => {
    setBulkCreateForm({
      ...bulkCreateForm,
      rooms: [
        ...bulkCreateForm.rooms,
        {
          room_no: '',
          room_type: 'STANDARD',
          capacity: 2,
          room_availability_status: 'AVAILABLE',
          beds: [
            { bed_no: 'A', status: 'AVAILABLE' },
            { bed_no: 'B', status: 'AVAILABLE' },
          ],
        },
      ],
    });
  };

  const removeRoomFromBulk = (index) => {
    const newRooms = bulkCreateForm.rooms.filter((_, i) => i !== index);
    setBulkCreateForm({ ...bulkCreateForm, rooms: newRooms });
  };

  const updateBulkRoom = (index, field, value) => {
    const newRooms = [...bulkCreateForm.rooms];
    newRooms[index][field] = value;
    setBulkCreateForm({ ...bulkCreateForm, rooms: newRooms });
  };

  const addBedToBulkRoom = (roomIndex) => {
    const newRooms = [...bulkCreateForm.rooms];
    const bedLetter = String.fromCharCode(65 + newRooms[roomIndex].beds.length); // A, B, C, ...
    newRooms[roomIndex].beds.push({ bed_no: bedLetter, status: 'AVAILABLE' });
    setBulkCreateForm({ ...bulkCreateForm, rooms: newRooms });
  };

  const removeBedFromBulkRoom = (roomIndex, bedIndex) => {
    const newRooms = [...bulkCreateForm.rooms];
    newRooms[roomIndex].beds = newRooms[roomIndex].beds.filter((_, i) => i !== bedIndex);
    setBulkCreateForm({ ...bulkCreateForm, rooms: newRooms });
  };

  const updateBulkBed = (roomIndex, bedIndex, field, value) => {
    const newRooms = [...bulkCreateForm.rooms];
    newRooms[roomIndex].beds[bedIndex][field] = value;
    setBulkCreateForm({ ...bulkCreateForm, rooms: newRooms });
  };

  // Get status badge color
  const getStatusBadge = (status) => {
    const colors = {
      AVAILABLE: 'success',
      OCCUPIED: 'danger',
      'NEED CLEANING': 'warning',
      'UNDER MAINTENANCE': 'secondary',
    };
    return colors[status] || 'secondary';
  };

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="flex-grow-1">
        <Header />
        <Container fluid className="p-4">
          <Row className="mb-3">
            <Col>
              <HotelsTabs activeName="Hotel Floor Management" />
            </Col>
          </Row>

          <Row className="mb-4">
            <Col>
              <h2 className="mb-0">
                <MapPin className="me-2" size={28} />
                Hotel Floor Management
              </h2>
              <p className="text-muted">Create floors first, then assign rooms and beds</p>
            </Col>
            <Col className="text-end">
              {hasPermission('add_floor_management_admin') && (
                <>
                  <Button variant="primary" onClick={() => setShowBulkFloorsModal(true)} className="me-2">
                    <Plus size={18} className="me-1" />
                    Add Floors to Hotel
                  </Button>
                  <Button variant="outline-primary" onClick={openAddFloorModal}>
                    <Plus size={18} className="me-1" />
                    Add Single Floor
                  </Button>
                </>
              )}
            </Col>
          </Row>

          {/* Tabs */}
          <Row className="mb-3">
            <Col>
              <div className="nav-tabs-custom">
                <Button
                  variant={activeTab === 'floors' ? 'primary' : 'outline-primary'}
                  onClick={() => setActiveTab('floors')}
                  className="me-2"
                >
                  <MapPin size={18} className="me-1" />
                  Floors ({floors.length})
                </Button>
              </div>
            </Col>
          </Row>

          {activeTab === 'floors' && (
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Filter by Hotel</Form.Label>
                  <Form.Select
                    value={selectedHotel || ''}
                    onChange={(e) => {
                      const hotelId = e.target.value;
                      setSelectedHotel(hotelId);
                      if (hotelId) {
                        fetchFloors(hotelId);
                      } else {
                        setFloors([]);
                      }
                    }}
                  >
                    <option value="">-- All Hotels --</option>
                    {hotels.map((hotel) => (
                      <option key={hotel.id} value={hotel.id}>
                        {hotel.name} - {hotel.city}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6} className="d-flex align-items-end">
                {selectedHotel && (
                  <Button
                    variant="success"
                    onClick={() => window.location.href = `/assign-room?hotel=${selectedHotel}`}
                    className="me-2"
                  >
                    <DoorOpen size={18} className="me-1" />
                    Assign Rooms to Floor
                  </Button>
                )}
                <Button
                  variant="outline-secondary"
                  onClick={() => {
                    setSelectedHotel(null);
                    setFloors([]);
                  }}
                >
                  Clear Filter
                </Button>
              </Col>
            </Row>
          )}

          {/* Floors Tab */}
          {activeTab === 'floors' && (
            <Card>
              <Card.Body>
                {!selectedHotel ? (
                  // Show all hotels with floor counts
                  <Table hover responsive>
                    <thead>
                      <tr>
                        <th>Hotel Name</th>
                        <th>City</th>
                        <th>Total Floors</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan="4" className="text-center">
                            Loading...
                          </td>
                        </tr>
                      ) : Object.keys(hotelFloors).length === 0 ? (
                        <tr>
                          <td colSpan="4" className="text-center">
                            No hotels with floors found. Click "Add Floors to Hotel" to create floors.
                          </td>
                        </tr>
                      ) : (
                        hotels
                          .filter(hotel => hotelFloors[hotel.id.toString()] && hotelFloors[hotel.id.toString()].length > 0)
                          .map((hotel) => {
                            const floors = hotelFloors[hotel.id.toString()];
                            const floorCount = floors.length;

                            return (
                              <tr key={hotel.id}>
                                <td>{hotel.name}</td>
                                <td>{hotel.city}</td>
                                <td>
                                  <Badge bg="primary">{floorCount} Floor{floorCount !== 1 ? 's' : ''}</Badge>
                                </td>
                                <td>
                                  <Button
                                    variant="outline-primary"
                                    size="sm"
                                    onClick={() => setSelectedHotel(hotel.id.toString())}
                                    className="me-2"
                                  >
                                    <Eye size={16} className="me-1" />
                                    View Floors
                                  </Button>
                                  <Button
                                    variant="outline-success"
                                    size="sm"
                                    onClick={() => {
                                      window.location.href = `/assign-room?hotel=${hotel.id}`;
                                    }}
                                  >
                                    <DoorOpen size={16} className="me-1" />
                                    Manage Rooms
                                  </Button>
                                </td>
                              </tr>
                            );
                          })
                      )}
                    </tbody>
                  </Table>
                ) : (
                  // Show floors for selected hotel
                  <>
                    <div className="mb-3">
                      <h5>
                        Floors for: {hotels.find(h => h.id.toString() === selectedHotel)?.name}
                      </h5>
                    </div>
                    <Table hover responsive>
                      <thead>
                        <tr>
                          <th>Floor Number</th>
                          <th>Floor Title</th>
                          <th>Total Rooms</th>
                          <th>Total Beds</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loading ? (
                          <tr>
                            <td colSpan="5" className="text-center">
                              Loading...
                            </td>
                          </tr>
                        ) : !floors || floors.length === 0 ? (
                          <tr>
                            <td colSpan="5" className="text-center">
                              No floors found for this hotel.
                            </td>
                          </tr>
                        ) : (
                          (Array.isArray(floors) ? floors : []).map((floor) => (
                            <tr key={floor.floor_no}>
                              <td>
                                <Badge bg="info">Floor {floor.floor_no}</Badge>
                              </td>
                              <td>{floor.floor_title || `Floor ${floor.floor_no}`}</td>
                              <td>
                                <Badge bg="secondary">{floor.total_rooms} Room{floor.total_rooms !== 1 ? 's' : ''}</Badge>
                              </td>
                              <td>
                                <Badge bg="secondary">{floor.total_beds} Bed{floor.total_beds !== 1 ? 's' : ''}</Badge>
                              </td>
                              <td>
                                <Button
                                  variant="outline-success"
                                  size="sm"
                                  onClick={() => {
                                    window.location.href = `/assign-room?hotel=${selectedHotel}&floor=${floor.floor_no}`;
                                  }}
                                  className="me-2"
                                >
                                  <DoorOpen size={16} className="me-1" />
                                  Manage Rooms
                                </Button>
                                {hasPermission('edit_floor_management_admin') && (
                                  <Button
                                    variant="outline-primary"
                                    size="sm"
                                    onClick={() => openEditFloorModal(floor)}
                                    className="me-2"
                                  >
                                    <Edit2 size={16} className="me-1" />
                                    Edit
                                  </Button>
                                )}
                                {hasPermission('delete_floor_management_admin') && (
                                  <Button
                                    variant="outline-danger"
                                    size="sm"
                                    onClick={() => handleDeleteFloor(floor.id)}
                                  >
                                    <Trash2 size={16} className="me-1" />
                                    Delete
                                  </Button>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </Table>
                  </>
                )}
              </Card.Body>
            </Card>
          )}

          {/* Bulk Floors Modal */}
          <Modal show={showBulkFloorsModal} onHide={() => setShowBulkFloorsModal(false)} size="md">
            <Modal.Header closeButton>
              <Modal.Title>Add Multiple Floors to Hotel</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Select Hotel *</Form.Label>
                  <Form.Select
                    value={bulkFloorsForm.hotel_id}
                    onChange={(e) => setBulkFloorsForm({ ...bulkFloorsForm, hotel_id: e.target.value })}
                    required
                  >
                    <option value="">-- Select Hotel --</option>
                    {hotels.map((hotel) => (
                      <option key={hotel.id} value={hotel.id}>
                        {hotel.name} - {hotel.city}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Number of Floors *</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    max="50"
                    value={bulkFloorsForm.number_of_floors}
                    onChange={(e) => setBulkFloorsForm({ ...bulkFloorsForm, number_of_floors: e.target.value })}
                    placeholder="e.g., 5"
                  />
                  <Form.Text className="text-muted">
                    Enter the number of floors to create (e.g., 5 will create Floor 1, Floor 2, ... Floor 5)
                  </Form.Text>
                </Form.Group>
              </Form>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowBulkFloorsModal(false)}>
                <X size={18} className="me-1" />
                Cancel
              </Button>
              <Button variant="primary" onClick={handleBulkCreateFloors} disabled={loading}>
                <Save size={18} className="me-1" />
                {loading ? 'Creating...' : 'Create Floors'}
              </Button>
            </Modal.Footer>
          </Modal>

          {/* Floor Modal */}
          <Modal show={showFloorModal} onHide={() => setShowFloorModal(false)} size="lg">
            <Modal.Header closeButton>
              <Modal.Title>{editMode ? 'Edit Floor' : 'Add Floor'}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Select Hotel *</Form.Label>
                  <Form.Select
                    value={floorForm.hotel_id}
                    onChange={(e) => setFloorForm({ ...floorForm, hotel_id: e.target.value })}
                    required
                  >
                    <option value="">-- Select Hotel --</option>
                    {hotels.map((hotel) => (
                      <option key={hotel.id} value={hotel.id}>
                        {hotel.name} - {hotel.city}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Floor Number *</Form.Label>
                  <Form.Control
                    type="number"
                    value={floorForm.floor_no}
                    onChange={(e) => setFloorForm({ ...floorForm, floor_no: e.target.value })}
                    placeholder="e.g., 1, 2, 3"
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Floor Title *</Form.Label>
                  <Form.Control
                    type="text"
                    value={floorForm.floor_title}
                    onChange={(e) => setFloorForm({ ...floorForm, floor_title: e.target.value })}
                    placeholder="e.g., Ground Floor, First Floor"
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Floor Map Image</Form.Label>
                  <Form.Control
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setFloorForm({ ...floorForm, map_image: e.target.files[0] })
                    }
                  />
                  <Form.Text className="text-muted">Upload a floor plan image (optional)</Form.Text>
                </Form.Group>
              </Form>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowFloorModal(false)}>
                <X size={18} className="me-1" />
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSaveFloor}>
                <Save size={18} className="me-1" />
                {editMode ? 'Update' : 'Create'}
              </Button>
            </Modal.Footer>
          </Modal>

          {/* Room Modal */}
          <Modal show={showRoomModal} onHide={() => setShowRoomModal(false)} size="lg">
            <Modal.Header closeButton>
              <Modal.Title>{editMode ? 'Edit Room' : 'Add Room'}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Room Number *</Form.Label>
                      <Form.Control
                        type="text"
                        value={roomForm.room_no}
                        onChange={(e) => setRoomForm({ ...roomForm, room_no: e.target.value })}
                        placeholder="e.g., 101, 102"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Room Type *</Form.Label>
                      <Form.Select
                        value={roomForm.room_type}
                        onChange={(e) => setRoomForm({ ...roomForm, room_type: e.target.value })}
                      >
                        {roomTypes.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Capacity *</Form.Label>
                      <Form.Control
                        type="number"
                        value={roomForm.capacity}
                        onChange={(e) => setRoomForm({ ...roomForm, capacity: e.target.value })}
                        min="1"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Status *</Form.Label>
                      <Form.Select
                        value={roomForm.room_availability_status}
                        onChange={(e) =>
                          setRoomForm({ ...roomForm, room_availability_status: e.target.value })
                        }
                      >
                        {statusChoices.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Map X Coordinate</Form.Label>
                      <Form.Control
                        type="number"
                        value={roomForm.map_x_coordinate}
                        onChange={(e) =>
                          setRoomForm({ ...roomForm, map_x_coordinate: e.target.value })
                        }
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Map Y Coordinate</Form.Label>
                      <Form.Control
                        type="number"
                        value={roomForm.map_y_coordinate}
                        onChange={(e) =>
                          setRoomForm({ ...roomForm, map_y_coordinate: e.target.value })
                        }
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Form>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowRoomModal(false)}>
                <X size={18} className="me-1" />
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSaveRoom}>
                <Save size={18} className="me-1" />
                {editMode ? 'Update' : 'Create'}
              </Button>
            </Modal.Footer>
          </Modal>

          {/* Bed Modal */}
          <Modal show={showBedModal} onHide={() => setShowBedModal(false)}>
            <Modal.Header closeButton>
              <Modal.Title>{editMode ? 'Edit Bed' : 'Add Bed'}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Bed Number *</Form.Label>
                  <Form.Control
                    type="text"
                    value={bedForm.bed_no}
                    onChange={(e) => setBedForm({ ...bedForm, bed_no: e.target.value })}
                    placeholder="e.g., A, B, C"
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Status *</Form.Label>
                  <Form.Select
                    value={bedForm.status}
                    onChange={(e) => setBedForm({ ...bedForm, status: e.target.value })}
                  >
                    {statusChoices.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Assigned Guest</Form.Label>
                  <Form.Control
                    type="text"
                    value={bedForm.assigned_guest}
                    onChange={(e) => setBedForm({ ...bedForm, assigned_guest: e.target.value })}
                    placeholder="Guest name"
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Booking Reference</Form.Label>
                  <Form.Control
                    type="text"
                    value={bedForm.booking_reference}
                    onChange={(e) =>
                      setBedForm({ ...bedForm, booking_reference: e.target.value })
                    }
                    placeholder="Booking reference number"
                  />
                </Form.Group>
              </Form>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowBedModal(false)}>
                <X size={18} className="me-1" />
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSaveBed}>
                <Save size={18} className="me-1" />
                {editMode ? 'Update' : 'Create'}
              </Button>
            </Modal.Footer>
          </Modal>

          {/* Bulk Create Modal */}
          <Modal show={showBulkCreateModal} onHide={() => setShowBulkCreateModal(false)} size="xl">
            <Modal.Header closeButton>
              <Modal.Title>Bulk Create Floor with Rooms</Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Select Hotel *</Form.Label>
                  <Form.Select
                    value={bulkCreateForm.hotel_id}
                    onChange={(e) =>
                      setBulkCreateForm({ ...bulkCreateForm, hotel_id: e.target.value })
                    }
                    required
                  >
                    <option value="">-- Select Hotel --</option>
                    {hotels.map((hotel) => (
                      <option key={hotel.id} value={hotel.id}>
                        {hotel.name} - {hotel.city}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Floor Number *</Form.Label>
                      <Form.Control
                        type="number"
                        value={bulkCreateForm.floor_no}
                        onChange={(e) =>
                          setBulkCreateForm({ ...bulkCreateForm, floor_no: e.target.value })
                        }
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Floor Title *</Form.Label>
                      <Form.Control
                        type="text"
                        value={bulkCreateForm.floor_title}
                        onChange={(e) =>
                          setBulkCreateForm({ ...bulkCreateForm, floor_title: e.target.value })
                        }
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <hr />
                <h5 className="mb-3">Rooms</h5>

                {bulkCreateForm.rooms.map((room, roomIndex) => (
                  <Card key={roomIndex} className="mb-3">
                    <Card.Body>
                      <div className="d-flex justify-content-between mb-3">
                        <h6>Room {roomIndex + 1}</h6>
                        {bulkCreateForm.rooms.length > 1 && (
                          <Button
                            variant="link"
                            size="sm"
                            className="text-danger"
                            onClick={() => removeRoomFromBulk(roomIndex)}
                          >
                            <Trash2 size={16} />
                          </Button>
                        )}
                      </div>
                      <Row>
                        <Col md={3}>
                          <Form.Group className="mb-3">
                            <Form.Label>Room No</Form.Label>
                            <Form.Control
                              type="text"
                              value={room.room_no}
                              onChange={(e) =>
                                updateBulkRoom(roomIndex, 'room_no', e.target.value)
                              }
                            />
                          </Form.Group>
                        </Col>
                        <Col md={3}>
                          <Form.Group className="mb-3">
                            <Form.Label>Type</Form.Label>
                            <Form.Select
                              value={room.room_type}
                              onChange={(e) =>
                                updateBulkRoom(roomIndex, 'room_type', e.target.value)
                              }
                            >
                              {roomTypes.map((type) => (
                                <option key={type} value={type}>
                                  {type}
                                </option>
                              ))}
                            </Form.Select>
                          </Form.Group>
                        </Col>
                        <Col md={3}>
                          <Form.Group className="mb-3">
                            <Form.Label>Capacity</Form.Label>
                            <Form.Control
                              type="number"
                              value={room.capacity}
                              onChange={(e) =>
                                updateBulkRoom(roomIndex, 'capacity', e.target.value)
                              }
                            />
                          </Form.Group>
                        </Col>
                        <Col md={3}>
                          <Form.Group className="mb-3">
                            <Form.Label>Status</Form.Label>
                            <Form.Select
                              value={room.room_availability_status}
                              onChange={(e) =>
                                updateBulkRoom(roomIndex, 'room_availability_status', e.target.value)
                              }
                            >
                              {statusChoices.map((status) => (
                                <option key={status} value={status}>
                                  {status}
                                </option>
                              ))}
                            </Form.Select>
                          </Form.Group>
                        </Col>
                      </Row>

                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <small className="text-muted">Beds:</small>
                        <Button
                          variant="link"
                          size="sm"
                          onClick={() => addBedToBulkRoom(roomIndex)}
                        >
                          <Plus size={16} className="me-1" />
                          Add Bed
                        </Button>
                      </div>

                      {room.beds.map((bed, bedIndex) => (
                        <Row key={bedIndex} className="mb-2">
                          <Col md={5}>
                            <Form.Control
                              type="text"
                              placeholder="Bed No"
                              value={bed.bed_no}
                              onChange={(e) =>
                                updateBulkBed(roomIndex, bedIndex, 'bed_no', e.target.value)
                              }
                            />
                          </Col>
                          <Col md={5}>
                            <Form.Select
                              value={bed.status}
                              onChange={(e) =>
                                updateBulkBed(roomIndex, bedIndex, 'status', e.target.value)
                              }
                            >
                              {statusChoices.map((status) => (
                                <option key={status} value={status}>
                                  {status}
                                </option>
                              ))}
                            </Form.Select>
                          </Col>
                          <Col md={2}>
                            {room.beds.length > 1 && (
                              <Button
                                variant="link"
                                size="sm"
                                className="text-danger"
                                onClick={() => removeBedFromBulkRoom(roomIndex, bedIndex)}
                              >
                                <Trash2 size={16} />
                              </Button>
                            )}
                          </Col>
                        </Row>
                      ))}
                    </Card.Body>
                  </Card>
                ))}

                <Button variant="outline-primary" onClick={addRoomToBulk} className="w-100">
                  <Plus size={18} className="me-1" />
                  Add Another Room
                </Button>
              </Form>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowBulkCreateModal(false)}>
                <X size={18} className="me-1" />
                Cancel
              </Button>
              <Button variant="primary" onClick={handleBulkCreate}>
                <Save size={18} className="me-1" />
                Create Floor with Rooms
              </Button>
            </Modal.Footer>
          </Modal>
        </Container>
      </div>
    </div>
  );
};

export default HotelFloorManagement;
