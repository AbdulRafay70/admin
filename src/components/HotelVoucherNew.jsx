import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Gear } from 'react-bootstrap-icons';



const HotelVoucherInterfaceNew = ({ onClose, orderNo }) => {
    // State management
    const [bookingData, setBookingData] = useState(null);
    const [agencyData, setAgencyData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Edit mode states for each section
    const [editMode, setEditMode] = useState({
        passengers: false,
        hotels: false,
        flights: false,
        transport: false,
        food: false,
        ziarat: false,
    });

    // Editable data states
    const [editableData, setEditableData] = useState({
        passengers: [],
        hotels: [],
        flights: { departure: {}, return: {} },
        transport: [],
        food: [],
        ziarat: [],
    });

    // Service options states (checkboxes)
    const [serviceOptions, setServiceOptions] = useState({
        longTermVisa: false,
        oneSideTransport: false,
        fullTransport: false,
        onlyVisa: false,
        meccaZiarat: false,
        medinaZiarat: false,
        approve: false,
        draft: false,
    });

    const [notes, setNotes] = useState("");
    const [selectedShirka, setSelectedShirka] = useState("Rushd al Majd");
    const [openDropdown, setOpenDropdown] = useState(null); // Track which dropdown is open


    // Fetch booking and agency data
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const orgData = JSON.parse(localStorage.getItem("selectedOrganization"));
                const organizationId = orgData?.id;
                const token = localStorage.getItem("accessToken");

                let booking = null;

                // Try fetching from agent bookings API first
                try {
                    console.log('🔍 Hotel Voucher: Trying agent bookings API...');
                    const bookingResponse = await axios.get(
                        `http://127.0.0.1:8000/api/bookings/`,
                        {
                            params: {
                                booking_number: orderNo,
                                organization: organizationId,
                            },
                            headers: {
                                Authorization: `Bearer ${token}`,
                                "Content-Type": "application/json",
                            },
                        }
                    );

                    if (Array.isArray(bookingResponse.data)) {
                        booking = bookingResponse.data[0];
                    } else if (bookingResponse.data.results) {
                        booking = bookingResponse.data.results[0];
                    } else {
                        booking = bookingResponse.data;
                    }

                    if (booking) {
                        console.log('✅ Hotel Voucher: Found in agent bookings!');
                    }
                } catch (err) {
                    console.log('❌ Hotel Voucher: Not found in agent bookings, trying public bookings...');
                }

                // If not found in agent bookings, try public bookings API
                if (!booking) {
                    try {
                        console.log('🔍 Hotel Voucher: Trying public bookings API...');
                        const publicResponse = await axios.get(
                            `http://127.0.0.1:8000/api/admin/public-bookings/`,
                            {
                                params: {
                                    booking_number: orderNo,
                                    organization: organizationId,
                                },
                                headers: {
                                    Authorization: `Bearer ${token}`,
                                    "Content-Type": "application/json",
                                },
                            }
                        );

                        const publicData = Array.isArray(publicResponse.data)
                            ? publicResponse.data
                            : (publicResponse.data?.results || []);

                        booking = publicData[0];

                        if (booking) {
                            console.log('✅ Hotel Voucher: Found in public bookings!');
                        }
                    } catch (err) {
                        console.log('❌ Hotel Voucher: Not found in public bookings either');
                    }
                }

                if (!booking) {
                    throw new Error("Booking not found");
                }

                setBookingData(booking);

                // Initialize editable data from booking
                // Extract flight details from ticket_details -> trip_details
                const ticketDetails = booking.ticket_details || [];
                const firstTicket = ticketDetails[0] || {};
                const tripDetails = firstTicket.trip_details || [];

                const departureTrip = tripDetails.find(t => t.trip_type === 'Departure') || {};
                const returnTrip = tripDetails.find(t => t.trip_type === 'Return') || {};

                setEditableData({
                    passengers: booking.person_details || [],
                    hotels: booking.hotel_details || [],
                    flights: {
                        departure: {
                            airline: departureTrip.airline || "",
                            flight_number: departureTrip.flight_number || "",
                            from_sector: departureTrip.departure_city_name || "",
                            to_sector: departureTrip.arrival_city_name || "",
                            travel_date: departureTrip.departure_date_time || "",
                            return_date: departureTrip.arrival_date_time || ""
                        },
                        return: {
                            airline: returnTrip.airline || "",
                            flight_number: returnTrip.flight_number || "",
                            from_sector: returnTrip.departure_city_name || "",
                            to_sector: returnTrip.arrival_city_name || "",
                            travel_date: returnTrip.departure_date_time || "",
                            return_date: returnTrip.arrival_date_time || ""
                        }
                    },
                    transport: booking.transport_details || [],
                    food: booking.food_details || [],
                    ziarat: booking.ziyarat_details || [],
                });

                // Fetch agency data
                if (booking.agency) {
                    try {
                        const agencyResponse = await axios.get(
                            `http://127.0.0.1:8000/api/agencies/?organization=${organizationId}&id=${booking.agency}`,
                            {
                                headers: {
                                    Authorization: `Bearer ${token}`,
                                    "Content-Type": "application/json",
                                },
                            }
                        );
                        const agency =
                            agencyResponse.data.results?.find(
                                (agency) => agency.id === booking.agency
                            ) || agencyResponse.data[0];
                        setAgencyData(agency);
                    } catch (agencyError) {
                        console.error("Error fetching agency data:", agencyError);
                    }
                }

                setLoading(false);
            } catch (err) {
                console.error("Error fetching data:", err);
                setError(err.message);
                setLoading(false);
            }
        };

        if (orderNo) {
            fetchData();
        }
    }, [orderNo]);

    // Toggle edit mode for a section
    const toggleEditMode = (section) => {
        setEditMode((prev) => ({
            ...prev,
            [section]: !prev[section],
        }));
    };

    // Handle save for a section
    const handleSaveSection = async (section) => {
        try {
            const token = localStorage.getItem("accessToken");
            const orgData = JSON.parse(localStorage.getItem("selectedOrganization"));
            const organizationId = orgData?.id;

            // Prepare the data to send based on section
            let updateData = {};

            if (section === 'passengers') {
                updateData = {
                    person_details: editableData.passengers,
                    total_pax: editableData.passengers.length,
                    total_adult: editableData.passengers.filter(p => p.age_group === 'Adult').length,
                    total_child: editableData.passengers.filter(p => p.age_group === 'Child').length,
                    total_infant: editableData.passengers.filter(p => p.age_group === 'Infant').length
                };
            } else if (section === 'hotels') {
                updateData = {
                    hotel_details: editableData.hotels
                };
            } else if (section === 'flights') {
                updateData = {
                    ticket_details: [{
                        airline: editableData.flights.departure?.airline || editableData.flights.return?.airline,
                        flight_number: editableData.flights.departure?.flight_number || editableData.flights.return?.flight_number,
                        trip_details: [
                            {
                                trip_type: 'Departure',
                                departure_city_name: editableData.flights.departure?.from_sector,
                                arrival_city_name: editableData.flights.departure?.to_sector,
                                departure_date_time: editableData.flights.departure?.travel_date,
                                arrival_date_time: editableData.flights.departure?.return_date
                            },
                            {
                                trip_type: 'Return',
                                departure_city_name: editableData.flights.return?.from_sector,
                                arrival_city_name: editableData.flights.return?.to_sector,
                                departure_date_time: editableData.flights.return?.travel_date,
                                arrival_date_time: editableData.flights.return?.return_date
                            }
                        ]
                    }]
                };
            } else if (section === 'transport') {
                updateData = {
                    transport_details: editableData.transport
                };
            } else if (section === 'food') {
                updateData = {
                    food_details: editableData.food
                };
            } else if (section === 'ziarat') {
                updateData = {
                    ziyarat_details: editableData.ziarat
                };
            }

            // Make API call to update booking
            const response = await axios.patch(
                `http://127.0.0.1:8000/api/bookings/${bookingData.id}/`,
                updateData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (response.status === 200) {
                console.log(`${section} saved successfully!`, response.data);

                // Update bookingData with the response data
                setBookingData(prev => ({
                    ...prev,
                    ...response.data
                }));

                // Show success message (you can add a toast notification here)
                alert(`${section.charAt(0).toUpperCase() + section.slice(1)} saved successfully!`);
            }
        } catch (error) {
            console.error(`Error saving ${section}:`, error);
            alert(`Error saving ${section}. Please try again.`);
            // Don't exit edit mode if there's an error
            return;
        }

        // Close dropdown
        setOpenDropdown(null);

        // For passengers, exit edit mode for the specific row
        if (section === 'passengers') {
            setEditMode((prev) => ({ ...prev, passengers: false }));
        } else {
            toggleEditMode(section);
        }
    };

    // Handle cancel edit
    const handleCancelEdit = (section) => {
        // Close dropdown
        setOpenDropdown(null);

        // Reset editable data to original booking data
        const originalData = {
            passengers: bookingData.person_details || [],
            hotels: bookingData.hotel_details || [],
            flights: { departure: {}, return: {} },
            transport: bookingData.transport_details || [],
            food: bookingData.food_details || [],
            ziarat: bookingData.ziyarat_details || [],
        };
        setEditableData(prev => ({
            ...prev,
            [section]: originalData[section]
        }));

        // For passengers, exit edit mode for the specific row
        if (section === 'passengers') {
            setEditMode((prev) => ({ ...prev, passengers: false }));
        } else {
            toggleEditMode(section);
        }
    };

    if (loading) {
        return (
            <div className="text-center p-4">
                <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="alert alert-danger m-4" role="alert">
                <h4 className="alert-heading">Error</h4>
                <p>Error loading booking data: {error}</p>
            </div>
        );
    }

    if (!bookingData) {
        return (
            <div className="alert alert-warning m-4" role="alert">
                <h4 className="alert-heading">No Data Found</h4>
                <p>No booking data found for order number: {orderNo}</p>
            </div>
        );
    }

    return (
        <div className="container-fluid p-4" style={{ backgroundColor: "#f8f9fa" }}>
            <div className="card shadow-sm">
                <div className="card-body">
                    {/* Passenger Details Section */}
                    <div className="mb-4">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h6 className="fw-bold mb-0">Passenger Details</h6>
                        </div>

                        <div className="table-responsive">
                            <table
                                className="table table-sm table-bordered"
                                style={{
                                    pointerEvents: 'auto',
                                    width: editMode.passengers !== false ? '150%' : '100%',
                                    minWidth: '100%'
                                }}
                            >
                                <thead className="table-light">
                                    <tr>
                                        <th>Passenger Name</th>
                                        <th>Passport No</th>
                                        <th>PAX</th>
                                        <th>DOB</th>
                                        <th>Passport Issue Date</th>
                                        <th>Passport Expiry Date</th>
                                        <th>Country</th>
                                        <th>Family Head</th>
                                        <th>Family No</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {bookingData.person_details?.map((passenger, index) => (
                                        editMode.passengers === index ? (
                                            // Edit Mode for this row
                                            <tr key={index}>
                                                <td>
                                                    <div className="d-flex gap-1">
                                                        <select
                                                            className="form-select form-select-sm"
                                                            style={{ width: '70px' }}
                                                            value={editableData.passengers[index]?.person_title || ""}
                                                            onChange={(e) => {
                                                                const updated = [...editableData.passengers];
                                                                updated[index].person_title = e.target.value;
                                                                setEditableData({ ...editableData, passengers: updated });
                                                            }}
                                                        >
                                                            <option value="">-</option>
                                                            <option value="MR">Mr</option>
                                                            <option value="MRS">Mrs</option>
                                                            <option value="MS">Ms</option>
                                                            <option value="MISS">Miss</option>
                                                            <option value="DR">Dr</option>
                                                        </select>
                                                        <input
                                                            type="text"
                                                            className="form-control form-control-sm"
                                                            placeholder="First"
                                                            value={editableData.passengers[index]?.first_name || ""}
                                                            onChange={(e) => {
                                                                const updated = [...editableData.passengers];
                                                                updated[index].first_name = e.target.value;
                                                                setEditableData({ ...editableData, passengers: updated });
                                                            }}
                                                        />
                                                        <input
                                                            type="text"
                                                            className="form-control form-control-sm"
                                                            placeholder="Last"
                                                            value={editableData.passengers[index]?.last_name || ""}
                                                            onChange={(e) => {
                                                                const updated = [...editableData.passengers];
                                                                updated[index].last_name = e.target.value;
                                                                setEditableData({ ...editableData, passengers: updated });
                                                            }}
                                                        />
                                                    </div>
                                                </td>
                                                <td>
                                                    <input
                                                        type="text"
                                                        className="form-control form-control-sm"
                                                        value={editableData.passengers[index]?.passport_number || ""}
                                                        onChange={(e) => {
                                                            const updated = [...editableData.passengers];
                                                            updated[index].passport_number = e.target.value;
                                                            setEditableData({ ...editableData, passengers: updated });
                                                        }}
                                                    />
                                                </td>
                                                <td>
                                                    <select
                                                        className="form-select form-select-sm"
                                                        value={editableData.passengers[index]?.age_group || "Adult"}
                                                        onChange={(e) => {
                                                            const updated = [...editableData.passengers];
                                                            updated[index].age_group = e.target.value;
                                                            setEditableData({ ...editableData, passengers: updated });
                                                        }}
                                                    >
                                                        <option value="Adult">Adult</option>
                                                        <option value="Child">Child</option>
                                                        <option value="Infant">Infant</option>
                                                    </select>
                                                </td>
                                                <td>
                                                    <input
                                                        type="date"
                                                        className="form-control form-control-sm"
                                                        value={editableData.passengers[index]?.date_of_birth || ""}
                                                        onChange={(e) => {
                                                            const updated = [...editableData.passengers];
                                                            updated[index].date_of_birth = e.target.value;
                                                            setEditableData({ ...editableData, passengers: updated });
                                                        }}
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        type="date"
                                                        className="form-control form-control-sm"
                                                        value={editableData.passengers[index]?.passpoet_issue_date || editableData.passengers[index]?.passport_issue_date || ""}
                                                        onChange={(e) => {
                                                            const updated = [...editableData.passengers];
                                                            updated[index].passport_issue_date = e.target.value;
                                                            updated[index].passpoet_issue_date = e.target.value;
                                                            setEditableData({ ...editableData, passengers: updated });
                                                        }}
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        type="date"
                                                        className="form-control form-control-sm"
                                                        value={editableData.passengers[index]?.passport_expiry_date || ""}
                                                        onChange={(e) => {
                                                            const updated = [...editableData.passengers];
                                                            updated[index].passport_expiry_date = e.target.value;
                                                            setEditableData({ ...editableData, passengers: updated });
                                                        }}
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        type="text"
                                                        className="form-control form-control-sm"
                                                        value={editableData.passengers[index]?.country || ""}
                                                        onChange={(e) => {
                                                            const updated = [...editableData.passengers];
                                                            updated[index].country = e.target.value;
                                                            setEditableData({ ...editableData, passengers: updated });
                                                        }}
                                                    />
                                                </td>
                                                <td>
                                                    <div className="form-check">
                                                        <input
                                                            type="checkbox"
                                                            className="form-check-input"
                                                            checked={editableData.passengers[index]?.is_family_head || false}
                                                            onChange={(e) => {
                                                                const updated = [...editableData.passengers];
                                                                updated[index].is_family_head = e.target.checked;
                                                                setEditableData({ ...editableData, passengers: updated });
                                                            }}
                                                        />
                                                    </div>
                                                </td>
                                                <td>
                                                    <input
                                                        type="number"
                                                        className="form-control form-control-sm"
                                                        value={editableData.passengers[index]?.family_number || ""}
                                                        onChange={(e) => {
                                                            const updated = [...editableData.passengers];
                                                            updated[index].family_number = e.target.value;
                                                            setEditableData({ ...editableData, passengers: updated });
                                                        }}
                                                    />
                                                </td>
                                                <td>
                                                    <div className="position-relative">
                                                        <button
                                                            className="btn btn-sm btn-light"
                                                            type="button"
                                                            onClick={(e) => {
                                                                const rect = e.currentTarget.getBoundingClientRect();
                                                                setOpenDropdown(openDropdown === `edit-${index}` ? null : {
                                                                    id: `edit-${index}`,
                                                                    top: rect.bottom,
                                                                    left: rect.left
                                                                });
                                                            }}
                                                            title="Actions"
                                                        >
                                                            <Gear size={16} />
                                                        </button>
                                                        {openDropdown?.id === `edit-${index}` && (
                                                            <div
                                                                className="dropdown-menu show"
                                                                style={{
                                                                    position: 'fixed',
                                                                    top: `${openDropdown.top}px`,
                                                                    left: `${openDropdown.left}px`,
                                                                    zIndex: 9999,
                                                                    minWidth: 'auto',
                                                                    width: 'fit-content'
                                                                }}
                                                            >
                                                                <button
                                                                    className="dropdown-item"
                                                                    onClick={() => {
                                                                        handleSaveSection('passengers');
                                                                        setOpenDropdown(null);
                                                                    }}
                                                                >
                                                                    <i className="bi bi-check-lg me-2 text-success"></i>
                                                                    Save
                                                                </button>
                                                                <button
                                                                    className="dropdown-item"
                                                                    onClick={() => {
                                                                        handleCancelEdit('passengers');
                                                                        setOpenDropdown(null);
                                                                    }}
                                                                >
                                                                    <i className="bi bi-x-lg me-2 text-secondary"></i>
                                                                    Cancel
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            // View Mode for this row
                                            <tr key={index} style={{ transition: 'none', transform: 'none', boxShadow: 'none' }}>
                                                <td>
                                                    {passenger.person_title ? `${passenger.person_title}. ` : ''}
                                                    {passenger.first_name} {passenger.last_name}
                                                </td>
                                                <td>{passenger.passport_number || "N/A"}</td>
                                                <td>{passenger.age_group || "Adult"}</td>
                                                <td>{passenger.date_of_birth || "N/A"}</td>
                                                <td>{passenger.passpoet_issue_date || passenger.passport_issue_date || "N/A"}</td>
                                                <td>{passenger.passport_expiry_date || "N/A"}</td>
                                                <td>{passenger.country || "N/A"}</td>
                                                <td>
                                                    {passenger.is_family_head ? (
                                                        <span className="badge bg-success">Yes</span>
                                                    ) : (
                                                        <span className="badge bg-secondary">No</span>
                                                    )}
                                                </td>
                                                <td>{passenger.family_number || "N/A"}</td>
                                                <td>
                                                    <div className="position-relative">
                                                        <button
                                                            className="btn btn-sm btn-light"
                                                            type="button"
                                                            onClick={(e) => {
                                                                const rect = e.currentTarget.getBoundingClientRect();
                                                                setOpenDropdown(openDropdown?.id === `view-${index}` ? null : {
                                                                    id: `view-${index}`,
                                                                    top: rect.bottom,
                                                                    left: rect.left
                                                                });
                                                            }}
                                                            title="Actions"
                                                        >
                                                            <Gear size={16} />
                                                        </button>
                                                        {openDropdown?.id === `view-${index}` && (
                                                            <div
                                                                className="dropdown-menu show"
                                                                style={{
                                                                    position: 'fixed',
                                                                    top: `${openDropdown.top}px`,
                                                                    left: `${openDropdown.left}px`,
                                                                    zIndex: 9999,
                                                                    minWidth: 'auto',
                                                                    width: 'fit-content'
                                                                }}
                                                            >
                                                                <button
                                                                    className="dropdown-item"
                                                                    onClick={() => {
                                                                        setEditMode({ ...editMode, passengers: index });
                                                                        setOpenDropdown(null);
                                                                    }}
                                                                >
                                                                    <i className="bi bi-pencil me-2 text-primary"></i>
                                                                    Edit
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Hotel Details Section */}
                    <div className="mb-4">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h6 className="fw-bold mb-0">Hotel Details</h6>
                            {!editMode.hotels ? (
                                <button
                                    className="btn btn-sm btn-primary"
                                    onClick={() => toggleEditMode('hotels')}
                                >
                                    <i className="bi bi-pencil me-1"></i> Edit
                                </button>
                            ) : (
                                <div className="d-flex gap-2">
                                    <button
                                        className="btn btn-sm btn-success"
                                        onClick={() => handleSaveSection('hotels')}
                                    >
                                        <i className="bi bi-check-lg me-1"></i> Save
                                    </button>
                                    <button
                                        className="btn btn-sm btn-secondary"
                                        onClick={() => handleCancelEdit('hotels')}
                                    >
                                        <i className="bi bi-x-lg me-1"></i> Cancel
                                    </button>
                                </div>
                            )}
                        </div>

                        {!editMode.hotels ? (
                            // View Mode
                            <div className="table-responsive">
                                <table className="table table-sm table-bordered" style={{ pointerEvents: 'auto' }}>
                                    <thead className="table-light">
                                        <tr>
                                            <th>Hotel Name</th>
                                            <th>Check-in</th>
                                            <th>Check-Out</th>
                                            <th>Nights</th>
                                            <th>Type</th>
                                            <th>Sharing Type</th>
                                            <th>QTY</th>
                                            <th>Special Request</th>
                                            <th>Voucher No</th>
                                            <th>Rate</th>
                                            <th>Net</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {bookingData.hotel_details?.map((hotel, index) => (
                                            <tr key={index} style={{ transition: 'none', transform: 'none', boxShadow: 'none' }}>
                                                <td>{hotel.hotel_name || hotel.hotel || "N/A"}</td>
                                                <td>{hotel.check_in_date || hotel.check_in_time || "N/A"}</td>
                                                <td>{hotel.check_out_date || hotel.check_out_time || "N/A"}</td>
                                                <td>{hotel.number_of_nights || hotel.nights || 0}</td>
                                                <td>{hotel.room_type || "N/A"}</td>
                                                <td>{hotel.sharing_type || "N/A"}</td>
                                                <td>{hotel.quantity || 1}</td>
                                                <td>{hotel.special_request || "N/A"}</td>
                                                <td>{hotel.hotel_voucher_number || "N/A"}</td>
                                                <td>SAR {hotel.price || hotel.price_in_sar || 0}</td>
                                                <td>SAR {hotel.total_price || hotel.total_price_sar || 0}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            // Edit Mode
                            <div>
                                {editableData.hotels.map((hotel, index) => (
                                    <div key={index} className="row g-2 mb-3 p-3 border rounded bg-light">
                                        <div className="col-md-4">
                                            <label className="form-label small mb-1">Hotel Name</label>
                                            <input
                                                type="text"
                                                className="form-control form-control-sm"
                                                placeholder="Hotel Name"
                                                value={hotel.hotel || ""}
                                                onChange={(e) => {
                                                    const updated = [...editableData.hotels];
                                                    updated[index].hotel = e.target.value;
                                                    setEditableData({ ...editableData, hotels: updated });
                                                }}
                                            />
                                        </div>
                                        <div className="col-md-2">
                                            <label className="form-label small mb-1">Check-in</label>
                                            <input
                                                type="date"
                                                className="form-control form-control-sm"
                                                value={hotel.check_in_date || hotel.check_in_time || ""}
                                                onChange={(e) => {
                                                    const updated = [...editableData.hotels];
                                                    updated[index].check_in_date = e.target.value;
                                                    updated[index].check_in_time = e.target.value;
                                                    setEditableData({ ...editableData, hotels: updated });
                                                }}
                                            />
                                        </div>
                                        <div className="col-md-2">
                                            <label className="form-label small mb-1">Check-out</label>
                                            <input
                                                type="date"
                                                className="form-control form-control-sm"
                                                value={hotel.check_out_date || hotel.check_out_time || ""}
                                                onChange={(e) => {
                                                    const updated = [...editableData.hotels];
                                                    updated[index].check_out_date = e.target.value;
                                                    updated[index].check_out_time = e.target.value;
                                                    setEditableData({ ...editableData, hotels: updated });
                                                }}
                                            />
                                        </div>
                                        <div className="col-md-2">
                                            <label className="form-label small mb-1">Nights</label>
                                            <input
                                                type="number"
                                                className="form-control form-control-sm"
                                                placeholder="Nights"
                                                value={hotel.number_of_nights || hotel.nights || 0}
                                                onChange={(e) => {
                                                    const updated = [...editableData.hotels];
                                                    updated[index].number_of_nights = e.target.value;
                                                    updated[index].nights = e.target.value;
                                                    setEditableData({ ...editableData, hotels: updated });
                                                }}
                                            />
                                        </div>
                                        <div className="col-md-2">
                                            <label className="form-label small mb-1">Room Type</label>
                                            <input
                                                type="text"
                                                className="form-control form-control-sm"
                                                placeholder="Room Type"
                                                value={hotel.room_type || ""}
                                                onChange={(e) => {
                                                    const updated = [...editableData.hotels];
                                                    updated[index].room_type = e.target.value;
                                                    setEditableData({ ...editableData, hotels: updated });
                                                }}
                                            />
                                        </div>
                                        <div className="col-md-2">
                                            <label className="form-label small mb-1">Quantity</label>
                                            <input
                                                type="number"
                                                className="form-control form-control-sm"
                                                placeholder="Qty"
                                                value={hotel.quantity || 1}
                                                onChange={(e) => {
                                                    const updated = [...editableData.hotels];
                                                    updated[index].quantity = e.target.value;
                                                    setEditableData({ ...editableData, hotels: updated });
                                                }}
                                            />
                                        </div>
                                        <div className="col-md-3">
                                            <label className="form-label small mb-1">Sharing Type</label>
                                            <input
                                                type="text"
                                                className="form-control form-control-sm"
                                                placeholder="Sharing Type"
                                                value={hotel.sharing_type || ""}
                                                onChange={(e) => {
                                                    const updated = [...editableData.hotels];
                                                    updated[index].sharing_type = e.target.value;
                                                    setEditableData({ ...editableData, hotels: updated });
                                                }}
                                            />
                                        </div>
                                        <div className="col-md-3">
                                            <label className="form-label small mb-1">Special Request</label>
                                            <input
                                                type="text"
                                                className="form-control form-control-sm"
                                                placeholder="Special Request"
                                                value={hotel.special_request || ""}
                                                onChange={(e) => {
                                                    const updated = [...editableData.hotels];
                                                    updated[index].special_request = e.target.value;
                                                    setEditableData({ ...editableData, hotels: updated });
                                                }}
                                            />
                                        </div>
                                        <div className="col-md-2">
                                            <label className="form-label small mb-1">Voucher Number</label>
                                            <input
                                                type="text"
                                                className="form-control form-control-sm"
                                                placeholder="Voucher No"
                                                value={hotel.hotel_voucher_number || ""}
                                                onChange={(e) => {
                                                    const updated = [...editableData.hotels];
                                                    updated[index].hotel_voucher_number = e.target.value;
                                                    setEditableData({ ...editableData, hotels: updated });
                                                }}
                                            />
                                        </div>
                                        <div className="col-md-2">
                                            <label className="form-label small mb-1">Rate (SAR)</label>
                                            <input
                                                type="number"
                                                className="form-control form-control-sm"
                                                placeholder="Rate"
                                                value={hotel.price || hotel.price_in_sar || 0}
                                                onChange={(e) => {
                                                    const updated = [...editableData.hotels];
                                                    updated[index].price = e.target.value;
                                                    updated[index].price_in_sar = e.target.value;
                                                    setEditableData({ ...editableData, hotels: updated });
                                                }}
                                            />
                                        </div>
                                        <div className="col-md-2">
                                            <label className="form-label small mb-1">Net (SAR)</label>
                                            <input
                                                type="number"
                                                className="form-control form-control-sm"
                                                placeholder="Net"
                                                value={hotel.total_price || hotel.total_price_sar || 0}
                                                onChange={(e) => {
                                                    const updated = [...editableData.hotels];
                                                    updated[index].total_price = e.target.value;
                                                    updated[index].total_price_sar = e.target.value;
                                                    setEditableData({ ...editableData, hotels: updated });
                                                }}
                                            />
                                        </div>
                                        <div className="col-md-2 d-flex align-items-end">
                                            <button
                                                className="btn btn-sm btn-danger w-100"
                                                onClick={() => {
                                                    const updated = editableData.hotels.filter((_, i) => i !== index);
                                                    setEditableData({ ...editableData, hotels: updated });
                                                }}
                                            >
                                                <i className="bi bi-trash"></i>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                <button
                                    className="btn btn-sm btn-outline-primary mt-2"
                                    onClick={() => {
                                        setEditableData({
                                            ...editableData,
                                            hotels: [...editableData.hotels, {
                                                hotel: "",
                                                check_in_time: "",
                                                check_out_time: "",
                                                room_type: "",
                                                quantity: 1
                                            }]
                                        });
                                    }}
                                >
                                    <i className="bi bi-plus-lg me-1"></i> Add Hotel
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Flight Details Section */}
                    <div className="mb-4">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h6 className="fw-bold mb-0">Flight Details</h6>
                            {!editMode.flights ? (
                                <button
                                    className="btn btn-sm btn-primary"
                                    onClick={() => toggleEditMode('flights')}
                                >
                                    <i className="bi bi-pencil me-1"></i> Edit
                                </button>
                            ) : (
                                <button
                                    className="btn btn-sm btn-success"
                                    onClick={() => toggleEditMode('flights')}
                                >
                                    <i className="bi bi-check-lg me-1"></i> Done
                                </button>
                            )}
                        </div>

                        {!editMode.flights ? (
                            // View Mode
                            <div>
                                {(() => {
                                    const ticketDetails = bookingData.ticket_details || [];
                                    const firstTicket = ticketDetails[0] || {};
                                    const tripDetails = firstTicket.trip_details || [];

                                    const departureTrip = tripDetails.find(t => t.trip_type === 'Departure') || {};
                                    const returnTrip = tripDetails.find(t => t.trip_type === 'Return') || {};

                                    return (
                                        <>
                                            {/* Departure Flight Table */}
                                            <h6 className="fw-semibold mb-2">Departure Flight</h6>
                                            <div className="table-responsive mb-4">
                                                <table className="table table-sm table-bordered" style={{ pointerEvents: 'auto' }}>
                                                    <thead className="table-light">
                                                        <tr>
                                                            <th>Airline</th>
                                                            <th>Flight Number</th>
                                                            <th>From</th>
                                                            <th>To</th>
                                                            <th>Departure Date & Time</th>
                                                            <th>Arrival Date & Time</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        <tr style={{ transition: 'none', transform: 'none', boxShadow: 'none' }}>
                                                            <td>{departureTrip.airline || editableData.flights.departure?.airline || "N/A"}</td>
                                                            <td>{departureTrip.flight_number || editableData.flights.departure?.flight_number || "N/A"}</td>
                                                            <td>{departureTrip.departure_city_name || editableData.flights.departure?.from_sector || "N/A"}</td>
                                                            <td>{departureTrip.arrival_city_name || editableData.flights.departure?.to_sector || "N/A"}</td>
                                                            <td>{departureTrip.departure_date_time ? new Date(departureTrip.departure_date_time).toLocaleString() : editableData.flights.departure?.travel_date || "N/A"}</td>
                                                            <td>{departureTrip.arrival_date_time ? new Date(departureTrip.arrival_date_time).toLocaleString() : editableData.flights.departure?.return_date || "N/A"}</td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>

                                            {/* Return Flight Table */}
                                            <h6 className="fw-semibold mb-2 mt-3">Return Flight</h6>
                                            <div className="table-responsive">
                                                <table className="table table-sm table-bordered" style={{ pointerEvents: 'auto' }}>
                                                    <thead className="table-light">
                                                        <tr>
                                                            <th>Airline</th>
                                                            <th>Flight Number</th>
                                                            <th>From</th>
                                                            <th>To</th>
                                                            <th>Departure Date & Time</th>
                                                            <th>Arrival Date & Time</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        <tr style={{ transition: 'none', transform: 'none', boxShadow: 'none' }}>
                                                            <td>{returnTrip.airline || editableData.flights.return?.airline || "N/A"}</td>
                                                            <td>{returnTrip.flight_number || editableData.flights.return?.flight_number || "N/A"}</td>
                                                            <td>{returnTrip.departure_city_name || editableData.flights.return?.from_sector || "N/A"}</td>
                                                            <td>{returnTrip.arrival_city_name || editableData.flights.return?.to_sector || "N/A"}</td>
                                                            <td>{returnTrip.departure_date_time ? new Date(returnTrip.departure_date_time).toLocaleString() : editableData.flights.return?.travel_date || "N/A"}</td>
                                                            <td>{returnTrip.arrival_date_time ? new Date(returnTrip.arrival_date_time).toLocaleString() : editableData.flights.return?.return_date || "N/A"}</td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                        ) : (
                            // Edit Mode
                            <div>
                                {/* Departure Flight Edit */}
                                <h6 className="fw-semibold mb-2 mt-3">Flight Details (Departure Flight)</h6>
                                <div className="row g-2 mb-3 p-3 border rounded bg-light">
                                    <div className="col-md-3">
                                        <label className="form-label small mb-1">Airline Name or Code</label>
                                        <input
                                            type="text"
                                            className="form-control form-control-sm"
                                            placeholder="Airline"
                                            value={editableData.flights.departure?.airline || ""}
                                            onChange={(e) => {
                                                setEditableData({
                                                    ...editableData,
                                                    flights: {
                                                        ...editableData.flights,
                                                        departure: {
                                                            ...editableData.flights.departure,
                                                            airline: e.target.value
                                                        }
                                                    }
                                                });
                                            }}
                                        />
                                    </div>
                                    <div className="col-md-3">
                                        <label className="form-label small mb-1">Flight Number</label>
                                        <input
                                            type="text"
                                            className="form-control form-control-sm"
                                            placeholder="Flight Number"
                                            value={editableData.flights.departure?.flight_number || ""}
                                            onChange={(e) => {
                                                setEditableData({
                                                    ...editableData,
                                                    flights: {
                                                        ...editableData.flights,
                                                        departure: {
                                                            ...editableData.flights.departure,
                                                            flight_number: e.target.value
                                                        }
                                                    }
                                                });
                                            }}
                                        />
                                    </div>
                                    <div className="col-md-3">
                                        <label className="form-label small mb-1">From Sector</label>
                                        <input
                                            type="text"
                                            className="form-control form-control-sm"
                                            placeholder="From"
                                            value={editableData.flights.departure?.from_sector || ""}
                                            onChange={(e) => {
                                                setEditableData({
                                                    ...editableData,
                                                    flights: {
                                                        ...editableData.flights,
                                                        departure: {
                                                            ...editableData.flights.departure,
                                                            from_sector: e.target.value
                                                        }
                                                    }
                                                });
                                            }}
                                        />
                                    </div>
                                    <div className="col-md-3">
                                        <label className="form-label small mb-1">To Sector</label>
                                        <input
                                            type="text"
                                            className="form-control form-control-sm"
                                            placeholder="To"
                                            value={editableData.flights.departure?.to_sector || ""}
                                            onChange={(e) => {
                                                setEditableData({
                                                    ...editableData,
                                                    flights: {
                                                        ...editableData.flights,
                                                        departure: {
                                                            ...editableData.flights.departure,
                                                            to_sector: e.target.value
                                                        }
                                                    }
                                                });
                                            }}
                                        />
                                    </div>
                                    <div className="col-md-3">
                                        <label className="form-label small mb-1">Travel Date And Time</label>
                                        <input
                                            type="datetime-local"
                                            className="form-control form-control-sm"
                                            value={editableData.flights.departure?.travel_date || ""}
                                            onChange={(e) => {
                                                setEditableData({
                                                    ...editableData,
                                                    flights: {
                                                        ...editableData.flights,
                                                        departure: {
                                                            ...editableData.flights.departure,
                                                            travel_date: e.target.value
                                                        }
                                                    }
                                                });
                                            }}
                                        />
                                    </div>
                                    <div className="col-md-3">
                                        <label className="form-label small mb-1">Return Date And Time</label>
                                        <input
                                            type="datetime-local"
                                            className="form-control form-control-sm"
                                            value={editableData.flights.departure?.return_date || ""}
                                            onChange={(e) => {
                                                setEditableData({
                                                    ...editableData,
                                                    flights: {
                                                        ...editableData.flights,
                                                        departure: {
                                                            ...editableData.flights.departure,
                                                            return_date: e.target.value
                                                        }
                                                    }
                                                });
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Return Flight Edit */}
                                <h6 className="fw-semibold mb-2 mt-4">Flight Details (Return Flight)</h6>
                                <div className="row g-2 p-3 border rounded bg-light">
                                    <div className="col-md-3">
                                        <label className="form-label small mb-1">Airline Name or Code</label>
                                        <input
                                            type="text"
                                            className="form-control form-control-sm"
                                            placeholder="Airline"
                                            value={editableData.flights.return?.airline || ""}
                                            onChange={(e) => {
                                                setEditableData({
                                                    ...editableData,
                                                    flights: {
                                                        ...editableData.flights,
                                                        return: {
                                                            ...editableData.flights.return,
                                                            airline: e.target.value
                                                        }
                                                    }
                                                });
                                            }}
                                        />
                                    </div>
                                    <div className="col-md-3">
                                        <label className="form-label small mb-1">Flight Number</label>
                                        <input
                                            type="text"
                                            className="form-control form-control-sm"
                                            placeholder="Flight Number"
                                            value={editableData.flights.return?.flight_number || ""}
                                            onChange={(e) => {
                                                setEditableData({
                                                    ...editableData,
                                                    flights: {
                                                        ...editableData.flights,
                                                        return: {
                                                            ...editableData.flights.return,
                                                            flight_number: e.target.value
                                                        }
                                                    }
                                                });
                                            }}
                                        />
                                    </div>
                                    <div className="col-md-3">
                                        <label className="form-label small mb-1">From Sector</label>
                                        <input
                                            type="text"
                                            className="form-control form-control-sm"
                                            placeholder="From"
                                            value={editableData.flights.return?.from_sector || ""}
                                            onChange={(e) => {
                                                setEditableData({
                                                    ...editableData,
                                                    flights: {
                                                        ...editableData.flights,
                                                        return: {
                                                            ...editableData.flights.return,
                                                            from_sector: e.target.value
                                                        }
                                                    }
                                                });
                                            }}
                                        />
                                    </div>
                                    <div className="col-md-3">
                                        <label className="form-label small mb-1">To Sector</label>
                                        <input
                                            type="text"
                                            className="form-control form-control-sm"
                                            placeholder="To"
                                            value={editableData.flights.return?.to_sector || ""}
                                            onChange={(e) => {
                                                setEditableData({
                                                    ...editableData,
                                                    flights: {
                                                        ...editableData.flights,
                                                        return: {
                                                            ...editableData.flights.return,
                                                            to_sector: e.target.value
                                                        }
                                                    }
                                                });
                                            }}
                                        />
                                    </div>
                                    <div className="col-md-3">
                                        <label className="form-label small mb-1">Travel Date And Time</label>
                                        <input
                                            type="datetime-local"
                                            className="form-control form-control-sm"
                                            value={editableData.flights.return?.travel_date || ""}
                                            onChange={(e) => {
                                                setEditableData({
                                                    ...editableData,
                                                    flights: {
                                                        ...editableData.flights,
                                                        return: {
                                                            ...editableData.flights.return,
                                                            travel_date: e.target.value
                                                        }
                                                    }
                                                });
                                            }}
                                        />
                                    </div>
                                    <div className="col-md-3">
                                        <label className="form-label small mb-1">Return Date And Time</label>
                                        <input
                                            type="datetime-local"
                                            className="form-control form-control-sm"
                                            value={editableData.flights.return?.return_date || ""}
                                            onChange={(e) => {
                                                setEditableData({
                                                    ...editableData,
                                                    flights: {
                                                        ...editableData.flights,
                                                        return: {
                                                            ...editableData.flights.return,
                                                            return_date: e.target.value
                                                        }
                                                    }
                                                });
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Transport Details Section */}
                    <div className="mb-4">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h6 className="fw-bold mb-0">Transportation</h6>
                            {!editMode.transport ? (
                                <button
                                    className="btn btn-sm btn-primary"
                                    onClick={() => toggleEditMode('transport')}
                                >
                                    <i className="bi bi-pencil me-1"></i> Edit
                                </button>
                            ) : (
                                <div className="d-flex gap-2">
                                    <button
                                        className="btn btn-sm btn-success"
                                        onClick={() => handleSaveSection('transport')}
                                    >
                                        <i className="bi bi-check-lg me-1"></i> Save
                                    </button>
                                    <button
                                        className="btn btn-sm btn-secondary"
                                        onClick={() => handleCancelEdit('transport')}
                                    >
                                        <i className="bi bi-x-lg me-1"></i> Cancel
                                    </button>
                                </div>
                            )}
                        </div>

                        {!editMode.transport ? (
                            // View Mode
                            <div className="table-responsive">
                                <table className="table table-sm table-bordered" style={{ pointerEvents: 'auto' }}>
                                    <thead className="table-light">
                                        <tr>
                                            <th>Transport Type</th>
                                            <th>Transport Sector</th>
                                            <th>Voucher Number</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {bookingData.transport_details?.map((transport, index) => {
                                            // Build the big sector route from all sectors
                                            const bigSectorRoute = transport.sector_details?.map(sector =>
                                                `${sector.departure_city}(${sector.is_airport_pickup ? 'A' : sector.is_airport_drop ? 'A' : 'H'})`
                                            ).join('-');

                                            // Add the final arrival city
                                            const lastSector = transport.sector_details?.[transport.sector_details.length - 1];
                                            const fullRoute = lastSector
                                                ? `${bigSectorRoute}-${lastSector.arrival_city}(${lastSector.is_airport_drop ? 'A' : 'H'})`
                                                : bigSectorRoute;

                                            return (
                                                <tr key={index} style={{ transition: 'none', transform: 'none', boxShadow: 'none' }}>
                                                    <td>{transport.vehicle_type_display || transport.vehicle_type || "N/A"}</td>
                                                    <td>{fullRoute || "N/A"}</td>
                                                    <td>{transport.voucher_no || transport.brn_no || "N/A"}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            // Edit Mode - Note: Transport has nested sectors
                            <div className="alert alert-info">
                                <strong>Note:</strong> Transport editing is complex due to nested sectors. Please use the main booking form to edit transport details.
                            </div>
                        )}
                    </div>

                    {/* Food Services Section */}
                    {bookingData.food_details && bookingData.food_details.length > 0 && (
                        <div className="mb-4">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h6 className="fw-bold mb-0">Food Services</h6>
                                {!editMode.food ? (
                                    <button
                                        className="btn btn-sm btn-primary"
                                        onClick={() => toggleEditMode('food')}
                                    >
                                        <i className="bi bi-pencil me-1"></i> Edit
                                    </button>
                                ) : (
                                    <div className="d-flex gap-2">
                                        <button
                                            className="btn btn-sm btn-success"
                                            onClick={() => handleSaveSection('food')}
                                        >
                                            <i className="bi bi-check-lg me-1"></i> Save
                                        </button>
                                        <button
                                            className="btn btn-sm btn-secondary"
                                            onClick={() => handleCancelEdit('food')}
                                        >
                                            <i className="bi bi-x-lg me-1"></i> Cancel
                                        </button>
                                    </div>
                                )}
                            </div>

                            {!editMode.food ? (
                                // View Mode
                                <div className="table-responsive">
                                    <table className="table table-sm table-bordered" style={{ pointerEvents: 'auto' }}>
                                        <thead className="table-light">
                                            <tr>
                                                <th>Food</th>
                                                <th>Contact Person</th>
                                                <th>Contact Number</th>
                                                <th>Voucher Number</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {bookingData.food_details.map((food, index) => (
                                                <tr key={index} style={{ transition: 'none', transform: 'none', boxShadow: 'none' }}>
                                                    <td>{food.food || "N/A"}</td>
                                                    <td>{food.contact_person_name || "N/A"}</td>
                                                    <td>{food.contact_number || "N/A"}</td>
                                                    <td>{food.food_voucher_number || food.food_brn || "N/A"}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                // Edit Mode
                                <div>
                                    {editableData.food.map((food, index) => (
                                        <div key={index} className="row g-2 mb-3 p-3 border rounded bg-light">
                                            <div className="col-md-4">
                                                <label className="form-label small mb-1">Food</label>
                                                <input
                                                    type="text"
                                                    className="form-control form-control-sm"
                                                    placeholder="Food Name"
                                                    value={food.food || ""}
                                                    onChange={(e) => {
                                                        const updated = [...editableData.food];
                                                        updated[index].food = e.target.value;
                                                        setEditableData({ ...editableData, food: updated });
                                                    }}
                                                />
                                            </div>
                                            <div className="col-md-3">
                                                <label className="form-label small mb-1">Contact Person</label>
                                                <input
                                                    type="text"
                                                    className="form-control form-control-sm"
                                                    placeholder="Contact Person"
                                                    value={food.contact_person_name || ""}
                                                    onChange={(e) => {
                                                        const updated = [...editableData.food];
                                                        updated[index].contact_person_name = e.target.value;
                                                        setEditableData({ ...editableData, food: updated });
                                                    }}
                                                />
                                            </div>
                                            <div className="col-md-2">
                                                <label className="form-label small mb-1">Contact Number</label>
                                                <input
                                                    type="text"
                                                    className="form-control form-control-sm"
                                                    placeholder="Contact Number"
                                                    value={food.contact_number || ""}
                                                    onChange={(e) => {
                                                        const updated = [...editableData.food];
                                                        updated[index].contact_number = e.target.value;
                                                        setEditableData({ ...editableData, food: updated });
                                                    }}
                                                />
                                            </div>
                                            <div className="col-md-2">
                                                <label className="form-label small mb-1">Voucher Number</label>
                                                <input
                                                    type="text"
                                                    className="form-control form-control-sm"
                                                    placeholder="Voucher No"
                                                    value={food.food_voucher_number || ""}
                                                    onChange={(e) => {
                                                        const updated = [...editableData.food];
                                                        updated[index].food_voucher_number = e.target.value;
                                                        setEditableData({ ...editableData, food: updated });
                                                    }}
                                                />
                                            </div>
                                            <div className="col-md-1 d-flex align-items-end">
                                                <button
                                                    className="btn btn-sm btn-danger w-100"
                                                    onClick={() => {
                                                        const updated = editableData.food.filter((_, i) => i !== index);
                                                        setEditableData({ ...editableData, food: updated });
                                                    }}
                                                >
                                                    <i className="bi bi-trash"></i>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    <button
                                        className="btn btn-sm btn-outline-primary mt-2"
                                        onClick={() => {
                                            setEditableData({
                                                ...editableData,
                                                food: [...editableData.food, {
                                                    food: "",
                                                    contact_person_name: "",
                                                    contact_number: "",
                                                    food_voucher_number: ""
                                                }]
                                            });
                                        }}
                                    >
                                        <i className="bi bi-plus-lg me-1"></i> Add Food Item
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Ziarat Services Section */}
                    {bookingData.ziyarat_details && bookingData.ziyarat_details.length > 0 && (
                        <div className="mb-4">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h6 className="fw-bold mb-0">Ziarat Services</h6>
                                {!editMode.ziarat ? (
                                    <button
                                        className="btn btn-sm btn-primary"
                                        onClick={() => toggleEditMode('ziarat')}
                                    >
                                        <i className="bi bi-pencil me-1"></i> Edit
                                    </button>
                                ) : (
                                    <div className="d-flex gap-2">
                                        <button
                                            className="btn btn-sm btn-success"
                                            onClick={() => handleSaveSection('ziarat')}
                                        >
                                            <i className="bi bi-check-lg me-1"></i> Save
                                        </button>
                                        <button
                                            className="btn btn-sm btn-secondary"
                                            onClick={() => handleCancelEdit('ziarat')}
                                        >
                                            <i className="bi bi-x-lg me-1"></i> Cancel
                                        </button>
                                    </div>
                                )}
                            </div>

                            {!editMode.ziarat ? (
                                // View Mode
                                <div className="table-responsive">
                                    <table className="table table-sm table-bordered" style={{ pointerEvents: 'auto' }}>
                                        <thead className="table-light">
                                            <tr>
                                                <th>Ziarat</th>
                                                <th>Contact Person</th>
                                                <th>Contact Number</th>
                                                <th>Voucher Number</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {bookingData.ziyarat_details.map((ziarat, index) => (
                                                <tr key={index} style={{ transition: 'none', transform: 'none', boxShadow: 'none' }}>
                                                    <td>{ziarat.ziarat || ziarat.ziyarat || "N/A"}</td>
                                                    <td>{ziarat.contact_person_name || "N/A"}</td>
                                                    <td>{ziarat.contact_number || "N/A"}</td>
                                                    <td>{ziarat.ziarat_voucher_number || ziarat.ziarat_brn || "N/A"}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                // Edit Mode
                                <div>
                                    {editableData.ziarat.map((ziarat, index) => (
                                        <div key={index} className="row g-2 mb-3 p-3 border rounded bg-light">
                                            <div className="col-md-4">
                                                <label className="form-label small mb-1">Ziarat</label>
                                                <input
                                                    type="text"
                                                    className="form-control form-control-sm"
                                                    placeholder="Ziarat Name"
                                                    value={ziarat.ziarat || ziarat.ziyarat || ""}
                                                    onChange={(e) => {
                                                        const updated = [...editableData.ziarat];
                                                        updated[index].ziarat = e.target.value;
                                                        updated[index].ziyarat = e.target.value;
                                                        setEditableData({ ...editableData, ziarat: updated });
                                                    }}
                                                />
                                            </div>
                                            <div className="col-md-3">
                                                <label className="form-label small mb-1">Contact Person</label>
                                                <input
                                                    type="text"
                                                    className="form-control form-control-sm"
                                                    placeholder="Contact Person"
                                                    value={ziarat.contact_person_name || ""}
                                                    onChange={(e) => {
                                                        const updated = [...editableData.ziarat];
                                                        updated[index].contact_person_name = e.target.value;
                                                        setEditableData({ ...editableData, ziarat: updated });
                                                    }}
                                                />
                                            </div>
                                            <div className="col-md-2">
                                                <label className="form-label small mb-1">Contact Number</label>
                                                <input
                                                    type="text"
                                                    className="form-control form-control-sm"
                                                    placeholder="Contact Number"
                                                    value={ziarat.contact_number || ""}
                                                    onChange={(e) => {
                                                        const updated = [...editableData.ziarat];
                                                        updated[index].contact_number = e.target.value;
                                                        setEditableData({ ...editableData, ziarat: updated });
                                                    }}
                                                />
                                            </div>
                                            <div className="col-md-2">
                                                <label className="form-label small mb-1">Voucher Number</label>
                                                <input
                                                    type="text"
                                                    className="form-control form-control-sm"
                                                    placeholder="Voucher No"
                                                    value={ziarat.ziarat_voucher_number || ""}
                                                    onChange={(e) => {
                                                        const updated = [...editableData.ziarat];
                                                        updated[index].ziarat_voucher_number = e.target.value;
                                                        setEditableData({ ...editableData, ziarat: updated });
                                                    }}
                                                />
                                            </div>
                                            <div className="col-md-1 d-flex align-items-end">
                                                <button
                                                    className="btn btn-sm btn-danger w-100"
                                                    onClick={() => {
                                                        const updated = editableData.ziarat.filter((_, i) => i !== index);
                                                        setEditableData({ ...editableData, ziarat: updated });
                                                    }}
                                                >
                                                    <i className="bi bi-trash"></i>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    <button
                                        className="btn btn-sm btn-outline-primary mt-2"
                                        onClick={() => {
                                            setEditableData({
                                                ...editableData,
                                                ziarat: [...editableData.ziarat, {
                                                    ziarat: "",
                                                    ziyarat: "",
                                                    contact_person_name: "",
                                                    contact_number: "",
                                                    ziarat_voucher_number: ""
                                                }]
                                            });
                                        }}
                                    >
                                        <i className="bi bi-plus-lg me-1"></i> Add Ziarat Item
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Service Options (Checkboxes) */}
                    <div className="mb-4">
                        <h6 className="fw-bold mb-3">Service Options</h6>
                        <div className="row g-3">
                            <div className="col-md-3">
                                <div className="form-check">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        id="longTermVisa"
                                        checked={serviceOptions.longTermVisa}
                                        onChange={(e) => setServiceOptions({ ...serviceOptions, longTermVisa: e.target.checked })}
                                    />
                                    <label className="form-check-label" htmlFor="longTermVisa">
                                        Long term Visa
                                    </label>
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="form-check">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        id="oneSideTransport"
                                        checked={serviceOptions.oneSideTransport}
                                        onChange={(e) => setServiceOptions({ ...serviceOptions, oneSideTransport: e.target.checked })}
                                    />
                                    <label className="form-check-label" htmlFor="oneSideTransport">
                                        with one side transport
                                    </label>
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="form-check">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        id="fullTransport"
                                        checked={serviceOptions.fullTransport}
                                        onChange={(e) => setServiceOptions({ ...serviceOptions, fullTransport: e.target.checked })}
                                    />
                                    <label className="form-check-label" htmlFor="fullTransport">
                                        with full transport
                                    </label>
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="form-check">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        id="onlyVisa"
                                        checked={serviceOptions.onlyVisa}
                                        onChange={(e) => setServiceOptions({ ...serviceOptions, onlyVisa: e.target.checked })}
                                    />
                                    <label className="form-check-label" htmlFor="onlyVisa">
                                        Only Visa
                                    </label>
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="form-check">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        id="meccaZiarat"
                                        checked={serviceOptions.meccaZiarat}
                                        onChange={(e) => setServiceOptions({ ...serviceOptions, meccaZiarat: e.target.checked })}
                                    />
                                    <label className="form-check-label" htmlFor="meccaZiarat">
                                        Mecca Ziarat
                                    </label>
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="form-check">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        id="medinaZiarat"
                                        checked={serviceOptions.medinaZiarat}
                                        onChange={(e) => setServiceOptions({ ...serviceOptions, medinaZiarat: e.target.checked })}
                                    />
                                    <label className="form-check-label" htmlFor="medinaZiarat">
                                        Medina Ziarat
                                    </label>
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="form-check">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        id="approve"
                                        checked={serviceOptions.approve}
                                        onChange={(e) => setServiceOptions({ ...serviceOptions, approve: e.target.checked })}
                                    />
                                    <label className="form-check-label" htmlFor="approve">
                                        APPROVE
                                    </label>
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="form-check">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        id="draft"
                                        checked={serviceOptions.draft}
                                        onChange={(e) => setServiceOptions({ ...serviceOptions, draft: e.target.checked })}
                                    />
                                    <label className="form-check-label" htmlFor="draft">
                                        DRAFT
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Notes Section */}
                    <div className="mb-4">
                        <h6 className="fw-bold mb-3">Notes</h6>
                        <div className="row g-2">
                            <div className="col-md-6">
                                <label className="form-label small">Notes</label>
                                <textarea
                                    className="form-control"
                                    rows={2}
                                    placeholder="Enter Notes"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label small">Shirka</label>
                                <select
                                    className="form-select"
                                    value={selectedShirka}
                                    onChange={(e) => setSelectedShirka(e.target.value)}
                                >
                                    <option value="Rushd al Majd">Rushd al Majd</option>
                                    <option value="Other Option">Other Option</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="d-flex gap-2 justify-content-end">
                        <button className="btn btn-primary">
                            <i className="bi bi-save me-1"></i> Save All Changes
                        </button>
                        <button className="btn btn-secondary" onClick={onClose}>
                            <i className="bi bi-x-lg me-1"></i> Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HotelVoucherInterfaceNew;



