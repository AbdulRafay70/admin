import React, { useState } from "react";
import { Modal, Button, Table, Badge, Card, Form } from "react-bootstrap";
import { User, Phone, Mail, MapPin, Calendar, CreditCard, Users, Hotel, Plane, Truck, Coffee } from "lucide-react";
import ConfirmationModal from "./ConfirmationModal";

const AllPassengersModal = ({ show, onHide, paxDetails, sectionType, onStatusUpdate }) => {
    const [confirmModal, setConfirmModal] = useState({ show: false, bookingId: null, paxId: null, status: null, activityId: null });

    if (!paxDetails || !paxDetails.passengers) return null;

    const { booking_id, passengers, booking_data, activityId } = paxDetails;

    // Helper function to format date
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        } catch {
            return dateString;
        }
    };

    // Helper function to derive gender from person_title
    const getGenderFromTitle = (title) => {
        if (!title) return 'N/A';
        const lowerTitle = title.toLowerCase();
        if (lowerTitle === 'mr' || lowerTitle === 'master') return 'Male';
        if (lowerTitle === 'mrs' || lowerTitle === 'miss' || lowerTitle === 'ms') return 'Female';
        return 'N/A';
    };

    // Helper function to get email from contact_details
    const getEmailFromContactDetails = (passenger) => {
        if (passenger.contact_details && passenger.contact_details.length > 0) {
            // Check if any contact detail has an email field
            const emailContact = passenger.contact_details.find(contact => contact.email);
            if (emailContact && emailContact.email) return emailContact.email;
        }
        return 'N/A';
    };

    // Helper function to render a data row
    const DataRow = ({ icon: Icon, label, value, variant = "primary" }) => (
        <tr>
            <td style={{ width: "40%", backgroundColor: "#f8f9fa", fontWeight: "500" }}>
                <Icon size={16} className="me-2" style={{ color: `var(--bs-${variant})` }} />
                {label}
            </td>
            <td>{value || 'N/A'}</td>
        </tr>
    );

    // Get section-specific icon and title
    const getSectionIcon = () => {
        switch (sectionType) {
            case 'hotel': return <Hotel size={24} className="me-2" />;
            case 'ziyarat': return <MapPin size={24} className="me-2" />;
            case 'transport': return <Truck size={24} className="me-2" />;
            case 'airport': return <Plane size={24} className="me-2" />;
            case 'food': return <Coffee size={24} className="me-2" />;
            default: return <Users size={24} className="me-2" />;
        }
    };

    const getSectionTitle = () => {
        switch (sectionType) {
            case 'hotel': return 'Hotel';
            case 'ziyarat': return 'Ziyarat';
            case 'transport': return 'Transport';
            case 'airport': return 'Airport/Flight';
            case 'food': return 'Food';
            default: return 'Passengers';
        }
    };

    // Get status options based on section type
    const getStatusOptions = () => {
        switch (sectionType) {
            case 'hotel':
                return [
                    { value: 'pending', label: 'Pending' },
                    { value: 'checked_in', label: 'Checked In' },
                    { value: 'checked_out', label: 'Checked Out' }
                ];
            case 'ziyarat':
                return [
                    { value: 'pending', label: 'Pending' },
                    { value: 'started', label: 'Started' },
                    { value: 'completed', label: 'Completed' },
                    { value: 'canceled', label: 'Canceled' }
                ];
            case 'transport':
                return [
                    { value: 'pending', label: 'Pending' },
                    { value: 'departed', label: 'Departed' },
                    { value: 'arrived', label: 'Arrived' },
                    { value: 'canceled', label: 'Canceled' }
                ];
            case 'airport':
                return [
                    { value: 'waiting', label: 'Waiting' },
                    { value: 'departed', label: 'Departed' },
                    { value: 'arrived', label: 'Arrived' },
                    { value: 'not_picked', label: 'Not Picked' }
                ];
            case 'food':
                return [
                    { value: 'pending', label: 'Pending' },
                    { value: 'served', label: 'Served' },
                    { value: 'canceled', label: 'Canceled' }
                ];
            default:
                return [{ value: 'pending', label: 'Pending' }];
        }
    };

    // Render section-specific details table
    const renderSectionDetails = () => {
        if (!booking_data) return null;

        switch (sectionType) {
            case 'hotel':
                return (
                    <Card className="mb-3 shadow-sm">
                        <Card.Header className="bg-info text-white">
                            <h6 className="mb-0"><Hotel size={18} className="me-2" />Hotel Details</h6>
                        </Card.Header>
                        <Card.Body>
                            <Table bordered size="sm" className="mb-0">
                                <tbody>
                                    <DataRow icon={Hotel} label="Hotel Name" value={booking_data.hotel_name} variant="primary" />
                                    <DataRow icon={MapPin} label="City" value={booking_data.city} variant="info" />
                                    <DataRow icon={Calendar} label="Check-In Date" value={formatDate(booking_data.check_in)} variant="success" />
                                    <DataRow icon={Calendar} label="Check-Out Date" value={formatDate(booking_data.check_out)} variant="warning" />
                                    <DataRow icon={Phone} label="Contact" value={booking_data.contact} variant="danger" />
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                );

            case 'ziyarat':
                return (
                    <Card className="mb-3 shadow-sm">
                        <Card.Header className="bg-info text-white">
                            <h6 className="mb-0"><MapPin size={18} className="me-2" />Ziyarat Details</h6>
                        </Card.Header>
                        <Card.Body>
                            <Table bordered size="sm" className="mb-0">
                                <tbody>
                                    <DataRow icon={MapPin} label="Location" value={booking_data.location} variant="primary" />
                                    <DataRow icon={MapPin} label="City" value={booking_data.city} variant="info" />
                                    <DataRow icon={Calendar} label="Date/Time" value={formatDate(booking_data.pickup_time)} variant="success" />
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                );

            case 'transport':
                return (
                    <Card className="mb-3 shadow-sm">
                        <Card.Header className="bg-info text-white">
                            <h6 className="mb-0"><Truck size={18} className="me-2" />Transport Details</h6>
                        </Card.Header>
                        <Card.Body>
                            <Table bordered size="sm" className="mb-0">
                                <tbody>
                                    <DataRow icon={Truck} label="Vehicle" value={booking_data.vehicle} variant="primary" />
                                    <tr>
                                        <td style={{ width: "40%", backgroundColor: "#f8f9fa", fontWeight: "500" }}>
                                            <MapPin size={16} className="me-2" style={{ color: "var(--bs-primary)" }} />
                                            Sector Route
                                        </td>
                                        <td>
                                            <div className="d-flex align-items-center">
                                                <Badge bg="primary" className="me-2">{booking_data.pickup}</Badge>
                                                <span className="mx-1">→</span>
                                                <Badge bg="info">{booking_data.drop}</Badge>
                                            </div>
                                        </td>
                                    </tr>
                                    {booking_data.vehicle_description && booking_data.vehicle_description !== 'N/A' && (
                                        <DataRow icon={Truck} label="Vehicle Description" value={booking_data.vehicle_description} variant="info" />
                                    )}
                                    <DataRow icon={User} label="Driver" value={booking_data.driver_name} variant="primary" />
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                );

            case 'airport':
                return (
                    <Card className="mb-3 shadow-sm">
                        <Card.Header className="bg-info text-white">
                            <h6 className="mb-0"><Plane size={18} className="me-2" />Flight Details</h6>
                        </Card.Header>
                        <Card.Body>
                            <Table bordered size="sm" className="mb-0">
                                <tbody>
                                    <DataRow icon={Plane} label="PNR/Flight Number" value={booking_data.flight_number} variant="primary" />
                                    <DataRow icon={Calendar} label="Flight Time" value={booking_data.flight_time} variant="info" />
                                    <DataRow icon={MapPin} label="From" value={booking_data.pickup_point} variant="success" />
                                    <DataRow icon={MapPin} label="To" value={booking_data.drop_point} variant="warning" />
                                    <DataRow icon={CreditCard} label="Transfer Type" value={booking_data.transfer_type} variant="danger" />
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                );

            case 'food':
                return (
                    <Card className="mb-3 shadow-sm">
                        <Card.Header className="bg-info text-white">
                            <h6 className="mb-0"><Coffee size={18} className="me-2" />Food Details</h6>
                        </Card.Header>
                        <Card.Body>
                            <Table bordered size="sm" className="mb-0">
                                <tbody>
                                    <DataRow icon={Coffee} label="Meal Type" value={booking_data.meal_type} variant="primary" />
                                    <DataRow icon={Calendar} label="Time" value={booking_data.time} variant="info" />
                                    <DataRow icon={Coffee} label="Menu" value={booking_data.menu} variant="success" />
                                    <DataRow icon={MapPin} label="Location" value={booking_data.location} variant="warning" />
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                );

            default:
                return null;
        }
    };

    return (
        <Modal show={show} onHide={onHide} size="xl" scrollable>
            <Modal.Header closeButton className="bg-primary text-white">
                <Modal.Title>
                    {getSectionIcon()}
                    {getSectionTitle()} - All Passengers - {booking_id}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ maxHeight: "70vh", overflowY: "auto" }}>
                <div className="mb-3">
                    <Badge bg="primary" className="me-2">Total Passengers: {passengers.length}</Badge>
                    <Badge bg="info">
                        Family Head: {passengers.find(p => p.is_family_head)?.first_name || passengers[0]?.first_name || 'N/A'}
                    </Badge>
                </div>

                {/* Section-specific details */}
                {renderSectionDetails()}

                {/* Passenger Details */}
                <h5 className="mt-4 mb-3">Passenger Information</h5>
                {passengers.map((passenger, index) => (
                    <Card key={passenger.pax_id || index} className="mb-4 shadow-sm">
                        <Card.Header className={passenger.is_family_head ? "bg-primary text-white" : "bg-info text-white"}>
                            <div className="d-flex justify-content-between align-items-center">
                                <h5 className="mb-0">
                                    <User size={20} className="me-2" />
                                    Passenger {index + 1}: {passenger.first_name} {passenger.last_name}
                                </h5>
                                {passenger.is_family_head && (
                                    <Badge bg="light" text="primary">Family Head</Badge>
                                )}
                            </div>
                        </Card.Header>
                        <Card.Body>
                            <Table bordered hover size="sm" className="mb-0">
                                <tbody>
                                    <DataRow
                                        icon={CreditCard}
                                        label="Passenger ID"
                                        value={passenger.pax_id}
                                        variant="primary"
                                    />
                                    <DataRow
                                        icon={User}
                                        label="Full Name"
                                        value={`${passenger.first_name || ''} ${passenger.last_name || ''}`}
                                        variant="info"
                                    />
                                    <DataRow
                                        icon={Phone}
                                        label="Contact Number"
                                        value={passenger.contact || passenger.contact_number}
                                        variant="success"
                                    />
                                    <DataRow
                                        icon={Mail}
                                        label="Email"
                                        value={getEmailFromContactDetails(passenger)}
                                        variant="info"
                                    />
                                    <DataRow
                                        icon={CreditCard}
                                        label="Passport Number"
                                        value={passenger.passport_number}
                                        variant="danger"
                                    />
                                    <DataRow
                                        icon={Calendar}
                                        label="Date of Birth"
                                        value={formatDate(passenger.date_of_birth)}
                                        variant="primary"
                                    />
                                    <DataRow
                                        icon={User}
                                        label="Age Group"
                                        value={passenger.age_group ? passenger.age_group.toUpperCase() : 'N/A'}
                                        variant="info"
                                    />
                                    <DataRow
                                        icon={User}
                                        label="Gender"
                                        value={getGenderFromTitle(passenger.person_title)}
                                        variant="success"
                                    />
                                    <DataRow
                                        icon={MapPin}
                                        label="Nationality"
                                        value={passenger.country || 'N/A'}
                                        variant="warning"
                                    />
                                    <DataRow
                                        icon={Users}
                                        label="Family Role"
                                        value={passenger.is_family_head ? "Family Head" : "Family Member"}
                                        variant="info"
                                    />
                                    {sectionType === 'hotel' && passenger.room_no && (
                                        <DataRow
                                            icon={MapPin}
                                            label="Room Number"
                                            value={passenger.room_no}
                                            variant="success"
                                        />
                                    )}
                                    {sectionType === 'hotel' && passenger.bed_no && (
                                        <DataRow
                                            icon={MapPin}
                                            label="Bed Number"
                                            value={passenger.bed_no}
                                            variant="warning"
                                        />
                                    )}

                                    {/* Status Dropdown */}
                                    <tr>
                                        <td style={{ width: "40%", backgroundColor: "#f8f9fa", fontWeight: "500" }}>
                                            <CreditCard size={16} className="me-2" style={{ color: "var(--bs-danger)" }} />
                                            {getSectionTitle()} Status
                                        </td>
                                        <td>
                                            <Form.Select
                                                size="sm"
                                                // If granular activity logic applies, check activity_statuses
                                                value={(() => {
                                                    if (activityId && passenger.activity_statuses) {
                                                        const granular = passenger.activity_statuses.find(s => s.activity_id === activityId);
                                                        if (granular) return granular.status;
                                                    }
                                                    return passenger.status || 'pending';
                                                })()}
                                                onChange={(e) => {
                                                    setConfirmModal({
                                                        show: true,
                                                        bookingId: booking_id,
                                                        paxId: passenger.pax_id,
                                                        status: e.target.value,
                                                        activityId: activityId // Pass activity ID to modal state
                                                    });
                                                }}
                                                style={{ maxWidth: '200px' }}
                                            >
                                                {getStatusOptions().map(option => (
                                                    <option key={option.value} value={option.value}>
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </Form.Select>
                                        </td>
                                    </tr>
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                ))}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>
                    Close
                </Button>
            </Modal.Footer>

            <ConfirmationModal
                show={confirmModal.show}
                onHide={() => setConfirmModal({ ...confirmModal, show: false })}
                onConfirm={() => {
                    onStatusUpdate && onStatusUpdate(confirmModal.bookingId, confirmModal.paxId, confirmModal.status, confirmModal.activityId);
                    setConfirmModal({ ...confirmModal, show: false });
                }}
                title="Confirm Status Update"
                message={`Are you sure you want to update the status to ${confirmModal.status}?`}
                variant="primary"
            />
        </Modal>
    );
};

export default AllPassengersModal;
