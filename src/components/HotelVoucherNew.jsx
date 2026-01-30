import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Gear, Pencil, Trash } from 'react-bootstrap-icons';



const HotelVoucherInterfaceNew = ({ onClose, orderNo }) => {
    // State management
    const [bookingData, setBookingData] = useState(null);
    const [agencyData, setAgencyData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Editable data states
    const [editableData, setEditableData] = useState({
        passengers: [],
        hotels: [],
        flights: { departure: {}, return: {} },
        transport: [],
        food: [],
        ziarat: [],
    });

    const [hotelsList, setHotelsList] = useState([]);
    const [roomTypesList, setRoomTypesList] = useState([]);
    const [vehicleTypesList, setVehicleTypesList] = useState([]);
    const [sectorsList, setSectorsList] = useState([]);
    const [foodsList, setFoodsList] = useState([]);
    const [ziyaratsList, setZiyaratsList] = useState([]);

    // Edit mode states for each section
    // Unified Modal State
    const [activeModal, setActiveModal] = useState(null); // 'passenger', 'hotel', 'flight', 'transport', 'food', 'ziarat'
    const [editingIndex, setEditingIndex] = useState(null); // Index of item being edited, or -1 for new
    const [tempItemData, setTempItemData] = useState({}); // Temporary data for the modal inputs

    // Delete Modal State
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteSection, setDeleteSection] = useState(null);

    const handleOpenDeleteModal = (section) => {
        setDeleteSection(section);
        setShowDeleteModal(true);
    };

    const handleCloseDeleteModal = () => {
        setShowDeleteModal(false);
        setDeleteSection(null);
    };

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

    // Helper to open modal for Add or Edit
    const handleOpenModal = (section, index = -1, data = {}) => {
        setActiveModal(section);
        setEditingIndex(index);

        // If adding new (index -1), initialize with empty/default object
        // If editing, clone the data
        if (index === -1) {
            let defaultData = {};
            if (section === 'hotels') defaultData = { quantity: 1, nights: 0 };
            if (section === 'hotel') defaultData = { quantity: 1, nights: 0 };
            if (section === 'passenger') defaultData = { age_group: "Adult", person_title: "" };
            // Add other defaults as needed
            setTempItemData(defaultData);
        } else {
            setTempItemData({ ...data }); // Shallow clone sufficient for simple objects
        }
    };

    const handleCloseModal = () => {
        setActiveModal(null);
        setEditingIndex(null);
        setTempItemData({});
    };

    const handleSaveModal = () => {
        // Validation logic can go here

        setEditableData(prev => {
            const sectionMap = {
                'passenger': 'passengers',
                'hotel': 'hotels',
                'flight': 'flights', // handled differently usually
                'transport': 'transport',
                'food': 'food',
                'ziarat': 'ziarat'
            };

            const dataKey = sectionMap[activeModal];
            if (!dataKey) return prev;

            // Special handling for flights (object, not array)
            if (activeModal === 'flight') {
                // Assuming tempItemData structure matches flights object structure
                return { ...prev, flights: tempItemData };
            }

            const newList = [...(prev[dataKey] || [])];

            if (editingIndex === -1) {
                // Add new
                newList.push(tempItemData);
            } else {
                // Update existing
                newList[editingIndex] = tempItemData;
            }

            return { ...prev, [dataKey]: newList };
        });

        // Trigger API update immediately (or user can click 'Save All' later? 
        // User requested "Apply" like buttons usually imply immediate save, but let's check existing logic.
        // Existing logic had a 'Save Section' button. Let's trigger that same logic using the updated editableData
        // We might need to wait for state update or pass the new data directly to handleSaveSection equivalent.
        // For now, let's just update local state and call the API update in a useEffect or separate function 
        // that handles the actual API call with the LATEST editableData.
        // Actually, to keep it simple and consistent with previous "Save Section" flow:
        // We will call handleGlobalSave(activeModal) which sends the specific updated section.
        // BUT `setEditableData` is async. So we pass the `newList` directly to the save function.

        saveDataToBackend(activeModal, editingIndex, tempItemData);

        handleCloseModal();
    };

    const saveDataToBackend = async (section, index, data) => {
        // Logic to prepare payload and call API
        // This re-uses the logic from 'handleSaveSection' but adapted for the new flow
        // We'll need to reconstruct the full list for the API payload

        // NOTE: Since state update is async, we need to construct the 'next state' data here to send to API
        let currentList = [];
        let dataKey = '';

        if (section === 'passenger') { dataKey = 'passengers'; currentList = [...editableData.passengers]; }
        else if (section === 'hotel') { dataKey = 'hotels'; currentList = [...editableData.hotels]; }
        else if (section === 'transport') { dataKey = 'transport'; currentList = [...editableData.transport]; }
        else if (section === 'food') { dataKey = 'food'; currentList = [...editableData.food]; }
        else if (section === 'ziarat') { dataKey = 'ziarat'; currentList = [...editableData.ziarat]; }
        else if (section === 'flight') {
            // Flights logic
            handleSaveSection('flights', data); // Pass data directly if possible or update state then call
            return;
        }

        if (index === -1) currentList.push(data);
        else currentList[index] = data;

        // Now call the API with this 'currentList'
        // We can adapt 'handleSaveSection' to accept data argument
        handleSaveSection(dataKey, currentList);
    };

    const handleDeleteItem = async (section, index) => {
        if (!window.confirm("Are you sure you want to delete this item?")) return;

        let currentList = [];
        let dataKey = '';

        if (section === 'passengers') { dataKey = 'passengers'; currentList = [...editableData.passengers]; }
        else if (section === 'hotels') { dataKey = 'hotels'; currentList = [...editableData.hotels]; }
        else if (section === 'transport') { dataKey = 'transport'; currentList = [...editableData.transport]; }
        else if (section === 'food') { dataKey = 'food'; currentList = [...editableData.food]; }
        else if (section === 'ziarat') { dataKey = 'ziarat'; currentList = [...editableData.ziarat]; }

        // Remove item at index
        currentList.splice(index, 1);

        // Update local state
        setEditableData(prev => ({
            ...prev,
            [dataKey]: currentList
        }));

        // Trigger backend update
        handleSaveSection(dataKey, currentList);

        // If list empty, close modal
        if (currentList.length === 0) {
            handleCloseDeleteModal();
        }
    };

    const handleDeleteAllItemsInSection = async () => {
        let dataKey = '';
        if (deleteSection === 'passengers') dataKey = 'passengers';
        else if (deleteSection === 'hotels') dataKey = 'hotels';
        else if (deleteSection === 'transport') dataKey = 'transport';
        else if (deleteSection === 'food') dataKey = 'food';
        else if (deleteSection === 'ziarat') dataKey = 'ziarat';

        // Update local state to empty array for the section
        setEditableData(prev => ({
            ...prev,
            [dataKey]: []
        }));

        // Trigger backend update with an empty list
        await handleSaveSection(dataKey, []);
        handleCloseDeleteModal();
    };


    const handleSaveAllChanges = async () => {
        try {
            const token = localStorage.getItem("accessToken");
            let voucherStatus = "Draft";
            if (serviceOptions.approve) voucherStatus = "Approved";
            else if (serviceOptions.draft) voucherStatus = "Draft";

            // Determine API endpoint
            const isPublicBooking = bookingData.booking_type === "Public Umrah Package" || bookingData.is_public_booking;
            const apiEndpoint = isPublicBooking
                ? `http://127.0.0.1:8000/api/admin/public-bookings/${bookingData.id}/`
                : `http://127.0.0.1:8000/api/bookings/${bookingData.id}/`;

            await axios.patch(
                apiEndpoint,
                { voucher_status: voucherStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            alert("Voucher status updated successfully!");
        } catch (error) {
            console.error("Error saving voucher status:", error);
            alert("Failed to save voucher status.");
        }
    };


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

                // Initialize service options based on voucher_status
                if (booking.voucher_status) {
                    setServiceOptions(prev => ({
                        ...prev,
                        approve: booking.voucher_status === 'Approved',
                        draft: booking.voucher_status === 'Draft'
                    }));
                }

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

                // Fetch Hotels List
                try {
                    const hotelsResponse = await axios.get(
                        `http://127.0.0.1:8000/api/hotels/`,
                        {
                            headers: {
                                Authorization: `Bearer ${token}`,
                                "Content-Type": "application/json",
                            },
                        }
                    );
                    const hotels = Array.isArray(hotelsResponse.data) ? hotelsResponse.data : (hotelsResponse.data.results || []);
                    setHotelsList(hotels);
                } catch (hotelErr) {
                    console.error("Error fetching hotels:", hotelErr);
                }

                // Fetch Vehicle Types List
                try {
                    const vehicleTypesResponse = await axios.get(
                        `http://127.0.0.1:8000/api/vehicle-types/`,
                        {
                            headers: {
                                Authorization: `Bearer ${token}`,
                                "Content-Type": "application/json",
                            },
                        }
                    );
                    const vehicleTypes = Array.isArray(vehicleTypesResponse.data) ? vehicleTypesResponse.data : (vehicleTypesResponse.data.results || []);
                    setVehicleTypesList(vehicleTypes);
                } catch (vehicleErr) {
                    console.error("Error fetching vehicle types:", vehicleErr);
                }

                // Fetch Sectors List
                try {
                    const sectorsResponse = await axios.get(
                        `http://127.0.0.1:8000/api/small-sectors/`,
                        {
                            headers: {
                                Authorization: `Bearer ${token}`,
                                "Content-Type": "application/json",
                            },
                        }
                    );
                    const sectors = Array.isArray(sectorsResponse.data) ? sectorsResponse.data : (sectorsResponse.data.results || []);
                    setSectorsList(sectors);
                } catch (sectorErr) {
                    console.error("Error fetching sectors:", sectorErr);
                }

                // Fetch Foods List
                try {
                    const foodsResponse = await axios.get(
                        `http://127.0.0.1:8000/api/food-prices/?organization=${organizationId}`,
                        {
                            headers: { Authorization: `Bearer ${token}` }
                        }
                    );
                    const foods = Array.isArray(foodsResponse.data) ? foodsResponse.data : (foodsResponse.data.results || []);
                    setFoodsList(foods);
                } catch (err) {
                    console.error("Error fetching foods:", err);
                }

                // Fetch Ziyarats List
                try {
                    const ziyaratsResponse = await axios.get(
                        `http://127.0.0.1:8000/api/ziarat-prices/?organization=${organizationId}`,
                        {
                            headers: { Authorization: `Bearer ${token}` }
                        }
                    );
                    const ziyarats = Array.isArray(ziyaratsResponse.data) ? ziyaratsResponse.data : (ziyaratsResponse.data.results || []);
                    setZiyaratsList(ziyarats);
                } catch (err) {
                    console.error("Error fetching ziyarats:", err);
                }
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
    // Modified to accept 'overrideData' for immediate updates from Modals
    const handleSaveSection = async (section, overrideData = null) => {
        try {
            const token = localStorage.getItem("accessToken");
            const orgData = JSON.parse(localStorage.getItem("selectedOrganization"));
            const organizationId = orgData?.id;

            // Prepare the data to send based on section
            let updateData = {};

            // Helper to get data: use overrideData if provided, else fall back to state
            // Note: overrideData is expected to be the FULL LIST for that section
            const getData = (key) => overrideData || editableData[key];

            if (section === 'passengers') {
                const passengers = getData('passengers');
                updateData = {
                    person_details: passengers,
                    total_pax: passengers.length,
                    total_adult: passengers.filter(p => p.age_group === 'Adult').length,
                    total_child: passengers.filter(p => p.age_group === 'Child').length,
                    total_infant: passengers.filter(p => p.age_group === 'Infant').length
                };
            } else if (section === 'hotels') {
                const hotels = getData('hotels');
                // Sanitize hotel data - remove read-only fields and ensure correct structure
                const sanitizedHotels = hotels.map(hotel => {
                    const cleanHotel = { ...hotel };
                    // Remove read-only fields that backend doesn't accept in PATCH
                    delete cleanHotel.id;
                    delete cleanHotel.booking;
                    delete cleanHotel.created_at;
                    delete cleanHotel.updated_at;
                    delete cleanHotel.hotel_name; // This is derived from hotel FK
                    delete cleanHotel.city_name; // This is derived from city FK
                    delete cleanHotel.room_type_name; // This is derived from room_type FK

                    return cleanHotel;
                });

                console.log('Sanitized hotel data being sent:', sanitizedHotels);

                updateData = {
                    hotel_details: sanitizedHotels
                };
            } else if (section === 'flights') {
                const flights = getData('flights');
                updateData = {
                    ticket_details: [{
                        airline: flights.departure?.airline || flights.return?.airline,
                        flight_number: flights.departure?.flight_number || flights.return?.flight_number,
                        trip_details: [
                            {
                                trip_type: 'Departure',
                                departure_city_name: flights.departure?.from_sector,
                                arrival_city_name: flights.departure?.to_sector,
                                departure_date_time: flights.departure?.travel_date,
                                arrival_date_time: flights.departure?.return_date
                            },
                            {
                                trip_type: 'Return',
                                departure_city_name: flights.return?.from_sector,
                                arrival_city_name: flights.return?.to_sector,
                                departure_date_time: flights.return?.travel_date,
                                arrival_date_time: flights.return?.return_date
                            }
                        ]
                    }]
                };
            } else if (section === 'transport') {
                updateData = {
                    transport_details: getData('transport')
                };
            } else if (section === 'food') {
                updateData = {
                    food_details: getData('food')
                };
            } else if (section === 'ziarat') {
                updateData = {
                    ziyarat_details: getData('ziarat')
                };
            }

            // Log the data being sent for debugging
            console.log('Update data being sent:', updateData);

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
                // alert(`${section.charAt(0).toUpperCase() + section.slice(1)} saved successfully!`);
            }
        } catch (error) {
            console.error("Error saving section:", error);
            console.error("Error response data:", error.response?.data);
            console.error("Error status:", error.response?.status);

            let errorMsg = "Failed to save changes.";
            if (error.response && error.response.data) {
                // Formatting error details
                if (typeof error.response.data === 'object') {
                    errorMsg += "\n" + JSON.stringify(error.response.data, null, 2);
                } else {
                    errorMsg += "\n" + error.response.data;
                }
            }
            alert(errorMsg);
            // Don't exit edit mode if there's an error
            return;
        }

        // Close dropdown if any
        setOpenDropdown(null);
    };

    // Handle cancel edit is now simple modal close
    const handleCancelEdit = (section) => {
        handleCloseModal();
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

    const getTitleOptions = (passengerType) => {
        const type = passengerType || "Adult";
        switch (type) {
            case "Adult":
                return (
                    <>
                        <option value="">Select Title</option>
                        <option value="MR">MR</option>
                        <option value="MRS">MRS</option>
                        <option value="MS">MS</option>
                    </>
                );
            case "Child":
            case "Infant":
                return (
                    <>
                        <option value="">Select Title</option>
                        <option value="MSTR">MSTR</option>
                        <option value="MISS">MISS</option>
                    </>
                );
            default:
                return (
                    <>
                        <option value="">Select Title</option>
                        <option value="MR">MR</option>
                        <option value="MRS">MRS</option>
                        <option value="MS">MS</option>
                    </>
                );
        }
    };

    if (!bookingData) {
        return (
            <div className="alert alert-warning m-4" role="alert">
                <h4 className="alert-heading">No Data Found</h4>
                <p>No booking data found for order number: {orderNo}</p>
            </div>
        );
    }

    return (
        <div className="container-fluid p-4" style={{ backgroundColor: "#f0f2f5", minHeight: "100vh", fontFamily: "'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" }}>
            <div className="card shadow-sm border-0" style={{ borderRadius: "12px", overflow: "hidden" }}>
                <div className="card-header bg-white py-3 border-bottom">
                    <h5 className="mb-0 fw-bold text-primary"><i className="bi bi-receipt me-2"></i>Hotel Voucher Details</h5>
                </div>
                <div className="card-body p-4">
                    {/* Passenger Details Section */}
                    <div className="mb-4">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h6 className="fw-bold mb-0">Passenger Details</h6>
                            <div>
                                {bookingData.person_details?.length > 0 && (
                                    <button
                                        className="btn btn-sm btn-outline-danger me-2"
                                        onClick={() => handleOpenDeleteModal('passengers')}
                                    >
                                        <i className="bi bi-trash me-1"></i> Delete All
                                    </button>
                                )}
                                <button
                                    className="btn btn-sm btn-outline-primary"
                                    onClick={() => handleOpenModal('passenger', -1)}
                                >
                                    <i className="bi bi-person-plus me-1"></i> Add Passenger
                                </button>
                            </div>
                        </div>

                        <div className="table-responsive border rounded" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                            <table
                                className="table table-bordered mb-0"
                                style={{
                                    pointerEvents: 'auto',
                                    minWidth: '100%'
                                }}
                            >
                                <thead className="table-light" style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                                    <tr>
                                        <th className="py-3">Type</th>
                                        <th className="py-3">Title</th>
                                        <th className="py-3">Passenger Name</th>
                                        <th className="py-3">Passport No</th>
                                        <th className="py-3">DOB</th>
                                        <th className="py-3">Passport Issue</th>
                                        <th className="py-3">Passport Expiry</th>
                                        <th className="py-3">Passport Image</th>
                                        <th className="py-3" style={{ width: '100px' }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {bookingData.person_details?.map((passenger, index) => (
                                        <tr key={index} style={{ transition: 'none', transform: 'none', boxShadow: 'none' }}>
                                            <td>{passenger.age_group || "Adult"}</td>
                                            <td>{passenger.person_title || "N/A"}</td>
                                            <td>
                                                {passenger.first_name} {passenger.last_name}
                                            </td>
                                            <td>{passenger.passport_number || "N/A"}</td>
                                            <td>{passenger.date_of_birth || "N/A"}</td>
                                            <td>{passenger.passpoet_issue_date || passenger.passport_issue_date || "N/A"}</td>
                                            <td>{passenger.passport_expiry_date || "N/A"}</td>
                                            <td>
                                                {/* Placeholder for Passport Image view */}
                                                <i className="bi bi-image text-muted" title="Passport Image"></i>
                                            </td>
                                            <td>
                                                <div className="d-flex gap-2">
                                                    <button className="btn btn-sm btn-outline-secondary" onClick={() => handleOpenModal('passenger', index, passenger)} title="Edit">
                                                        <Pencil size={14} />
                                                    </button>
                                                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteItem('passengers', index)} title="Delete">
                                                        <Trash size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}


                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Hotel Details Section */}
                    <div className="mb-4">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h6 className="fw-bold mb-0">Hotel Details</h6>
                            <div>
                                {bookingData.hotel_details?.length > 0 && (
                                    <button
                                        className="btn btn-sm btn-outline-danger me-2"
                                        onClick={() => handleOpenDeleteModal('hotels')}
                                    >
                                        <i className="bi bi-trash me-1"></i> Delete All
                                    </button>
                                )}
                                <button
                                    className="btn btn-sm btn-outline-primary"
                                    onClick={() => handleOpenModal('hotel', -1)}
                                >
                                    <i className="bi bi-plus-lg me-1"></i> Add Hotel
                                </button>
                            </div>
                        </div>

                        {/* View Mode Only - Editing via Modal */}
                        <div className="table-responsive border rounded" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                            <table className="table table-bordered mb-0" style={{ pointerEvents: 'auto' }}>
                                <thead className="table-light" style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                                    <tr>
                                        <th className="py-3">Hotel Name</th>
                                        <th className="py-3">Check In</th>
                                        <th className="py-3">Check Out</th>
                                        <th className="py-3">Room Type</th>
                                        <th className="py-3">Qty</th>
                                        <th className="py-3">Sharing</th>
                                        <th className="py-3">Special Request</th>
                                        <th className="py-3">BRN</th>
                                        <th className="py-3">Voucher No</th>
                                        <th className="py-3" style={{ width: '100px' }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {bookingData.hotel_details?.map((hotel, index) => (
                                        <tr key={index} style={{ transition: 'none', transform: 'none', boxShadow: 'none' }}>
                                            <td>{hotel.hotel_name || hotel.hotel || "N/A"}</td>
                                            <td>{hotel.check_in_date || hotel.check_in_time || "N/A"}</td>
                                            <td>{hotel.check_out_date || hotel.check_out_time || "N/A"}</td>
                                            <td>{hotel.room_type || "N/A"}</td>
                                            <td>{hotel.quantity || 1}</td>
                                            <td>{hotel.sharing_type || "N/A"}</td>
                                            <td>{hotel.special_request || "N/A"}</td>
                                            <td>{hotel.hotel_brn || "N/A"}</td>
                                            <td>{hotel.hotel_voucher_number || "N/A"}</td>
                                            <td>
                                                <div className="d-flex gap-2">
                                                    <button className="btn btn-sm btn-outline-secondary" onClick={() => handleOpenModal('hotel', index, hotel)} title="Edit">
                                                        <Pencil size={14} />
                                                    </button>
                                                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteItem('hotels', index)} title="Delete">
                                                        <Trash size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Flight Details Section */}
                    <div className="mb-4">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h6 className="fw-bold mb-0">Flight Details</h6>
                            <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => handleOpenModal('flight', 0, editableData.flights)}
                            >
                                <i className="bi bi-pencil me-1"></i> Edit Flights
                            </button>
                        </div>

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
                                        <div className="table-responsive mb-4 border rounded" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                            <table className="table table-bordered mb-0" style={{ pointerEvents: 'auto' }}>
                                                <thead className="table-light" style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                                                    <tr>
                                                        <th className="py-3">Airline</th>
                                                        <th className="py-3">Flight Number</th>
                                                        <th className="py-3">From</th>
                                                        <th className="py-3">To</th>
                                                        <th className="py-3">Departure Date & Time</th>
                                                        <th className="py-3">Arrival Date & Time</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <tr style={{ transition: 'none', transform: 'none', boxShadow: 'none' }}>
                                                        <td>{departureTrip.airline || editableData.flights.departure?.airline || "N/A"}</td>
                                                        <td>{departureTrip.flight_number || editableData.flights.departure?.flight_number || "N/A"}</td>
                                                        <td>{departureTrip.departure_city || editableData.flights.departure?.from_sector || "N/A"}</td>
                                                        <td>{departureTrip.arrival_city || editableData.flights.departure?.to_sector || "N/A"}</td>
                                                        <td>{departureTrip.departure_date_time ? new Date(departureTrip.departure_date_time).toLocaleString() : editableData.flights.departure?.travel_date || "N/A"}</td>
                                                        <td>{departureTrip.arrival_date_time ? new Date(departureTrip.arrival_date_time).toLocaleString() : editableData.flights.departure?.return_date || "N/A"}</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Return Flight Table */}
                                        <h6 className="fw-semibold mb-2 mt-3">Return Flight</h6>
                                        <div className="table-responsive border rounded" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                            <table className="table table-bordered mb-0" style={{ pointerEvents: 'auto' }}>
                                                <thead className="table-light" style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                                                    <tr>
                                                        <th className="py-3">Airline</th>
                                                        <th className="py-3">Flight Number</th>
                                                        <th className="py-3">From</th>
                                                        <th className="py-3">To</th>
                                                        <th className="py-3">Departure Date & Time</th>
                                                        <th className="py-3">Arrival Date & Time</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <tr style={{ transition: 'none', transform: 'none', boxShadow: 'none' }}>
                                                        <td>{returnTrip.airline || editableData.flights.return?.airline || "N/A"}</td>
                                                        <td>{returnTrip.flight_number || editableData.flights.return?.flight_number || "N/A"}</td>
                                                        <td>{returnTrip.departure_city || editableData.flights.return?.from_sector || "N/A"}</td>
                                                        <td>{returnTrip.arrival_city || editableData.flights.return?.to_sector || "N/A"}</td>
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
                    </div>

                    {/* Transport Details Section */}
                    {bookingData.transport_details && (
                        <div className="mb-4">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h6 className="fw-bold mb-0">Transportation Details</h6>
                                <div>
                                    {bookingData.transport_details?.length > 0 && (
                                        <button
                                            className="btn btn-sm btn-outline-danger me-2"
                                            onClick={() => handleOpenDeleteModal('transport')}
                                        >
                                            <i className="bi bi-trash me-1"></i> Delete All
                                        </button>
                                    )}
                                    <button
                                        className="btn btn-sm btn-outline-primary"
                                        onClick={() => handleOpenModal('transport', -1)}
                                    >
                                        <i className="bi bi-plus-lg me-1"></i> Add Transport
                                    </button>
                                </div>
                            </div>

                            <div className="table-responsive border rounded" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                                <table className="table table-bordered mb-0" style={{ pointerEvents: 'auto' }}>
                                    <thead className="table-light" style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                                        <tr>
                                            <th className="py-3">Transport Type</th>
                                            <th className="py-3">Transport Sector</th>
                                            <th className="py-3">BRN</th>
                                            <th className="py-3">Voucher Number</th>
                                            <th className="py-3" style={{ width: '100px' }}>Action</th>
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
                                                    <td>{transport.sector_display || fullRoute || "N/A"}</td>
                                                    <td>{transport.brn_no || "N/A"}</td>
                                                    <td>{transport.voucher_no || "N/A"}</td>
                                                    <td>
                                                        <div className="d-flex gap-2">
                                                            <button className="btn btn-sm btn-outline-secondary" onClick={() => handleOpenModal('transport', index, transport)} title="Edit">
                                                                <Pencil size={14} />
                                                            </button>
                                                            <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteItem('transport', index)} title="Delete">
                                                                <Trash size={14} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Food Services Section */}
                    {bookingData.food_details && (
                        <div className="mb-4">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h6 className="fw-bold mb-0">Food Details</h6>
                                <div>
                                    {bookingData.food_details?.length > 0 && (
                                        <button
                                            className="btn btn-sm btn-outline-danger me-2"
                                            onClick={() => handleOpenDeleteModal('food')}
                                        >
                                            <i className="bi bi-trash me-1"></i> Delete All
                                        </button>
                                    )}
                                    <button
                                        className="btn btn-sm btn-outline-primary"
                                        onClick={() => handleOpenModal('food', -1)}
                                    >
                                        <i className="bi bi-plus-lg me-1"></i> Add Food
                                    </button>
                                </div>
                            </div>
                            <div className="table-responsive border rounded" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                                <table className="table table-bordered mb-0">
                                    <thead className="table-light" style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                                        <tr>
                                            <th className="py-3">Food / Menu</th>
                                            <th className="py-3">BRN</th>
                                            <th className="py-3">Voucher No</th>
                                            <th className="py-3" style={{ width: '100px' }}>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {bookingData.food_details?.map((food, index) => (
                                            <tr key={index}>
                                                <td>{food.food_display || food.food || "N/A"}</td>
                                                <td>{food.food_brn || "N/A"}</td>
                                                <td>{food.food_voucher_number || "N/A"}</td>
                                                <td>
                                                    <div className="d-flex gap-2">
                                                        <button className="btn btn-sm btn-outline-secondary" onClick={() => handleOpenModal('food', index, food)} title="Edit">
                                                            <Pencil size={14} />
                                                        </button>
                                                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteItem('food', index)} title="Delete">
                                                            <Trash size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Ziarat Services Section */}
                    {bookingData.ziyarat_details && (
                        <div className="mb-4">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h6 className="fw-bold mb-0">Ziarat Details</h6>
                                <div>
                                    {bookingData.ziyarat_details?.length > 0 && (
                                        <button
                                            className="btn btn-sm btn-outline-danger me-2"
                                            onClick={() => handleOpenDeleteModal('ziarat')}
                                        >
                                            <i className="bi bi-trash me-1"></i> Delete All
                                        </button>
                                    )}
                                    <button
                                        className="btn btn-sm btn-outline-primary"
                                        onClick={() => handleOpenModal('ziarat', -1)}
                                    >
                                        <i className="bi bi-plus-lg me-1"></i> Add Ziarat
                                    </button>
                                </div>
                            </div>
                            <div className="table-responsive border rounded" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                                <table className="table table-bordered mb-0">
                                    <thead className="table-light" style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                                        <tr>
                                            <th className="py-3">Ziarat Name</th>
                                            <th className="py-3">Contact Person</th>
                                            <th className="py-3">Contact Number</th>
                                            <th className="py-3">BRN</th>
                                            <th className="py-3">Voucher No</th>
                                            <th className="py-3" style={{ width: '100px' }}>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {bookingData.ziyarat_details?.map((ziarat, index) => (
                                            <tr key={index}>
                                                <td>{ziarat.ziarat_display || ziarat.ziarat || ziarat.ziyarat || "N/A"}</td>
                                                <td>{ziarat.contact_person_name || "N/A"}</td>
                                                <td>{ziarat.contact_number || "N/A"}</td>
                                                <td>{ziarat.ziyarat_brn || "N/A"}</td>
                                                <td>{ziarat.ziyarat_voucher_number || "N/A"}</td>
                                                <td>
                                                    <div className="d-flex gap-2">
                                                        <button className="btn btn-sm btn-outline-secondary" onClick={() => handleOpenModal('ziarat', index, ziarat)} title="Edit">
                                                            <Pencil size={14} />
                                                        </button>
                                                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteItem('ziarat', index)} title="Delete">
                                                            <Trash size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
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
                            <div className="col-md-12">
                                <label className="form-label small">Notes</label>
                                <textarea
                                    className="form-control"
                                    rows={2}
                                    placeholder="Enter Notes"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="d-flex gap-2 justify-content-end">
                        <button className="btn btn-primary" onClick={handleSaveAllChanges}>
                            <i className="bi bi-save me-1"></i> Save All Changes
                        </button>
                        <button className="btn btn-secondary" onClick={onClose}>
                            <i className="bi bi-x-lg me-1"></i> Close
                        </button>
                    </div>
                </div>
                {/* Unified Modals */}

                {/* Passenger Modal */}
                {activeModal === 'passenger' && (
                    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                        <div className="modal-dialog modal-lg modal-dialog-centered">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">{editingIndex === -1 ? 'Add New' : 'Edit'} Passenger</h5>
                                    <button type="button" className="btn-close" onClick={handleCloseModal}></button>
                                </div>
                                <div className="modal-body">
                                    <div className="row g-3">
                                        <div className="col-md-6">
                                            <label className="form-label">Type (Age Group)</label>
                                            <select
                                                className="form-select"
                                                value={tempItemData.age_group || "Adult"}
                                                onChange={(e) => setTempItemData({ ...tempItemData, age_group: e.target.value })}
                                            >
                                                <option value="Adult">Adult</option>
                                                <option value="Child">Child</option>
                                                <option value="Infant">Infant</option>
                                            </select>
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label">Title</label>
                                            <select
                                                className="form-select"
                                                value={tempItemData.person_title || ""}
                                                onChange={(e) => setTempItemData({ ...tempItemData, person_title: e.target.value })}
                                            >
                                                {getTitleOptions(tempItemData.age_group)}
                                            </select>
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label">First Name</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={tempItemData.first_name || ""}
                                                onChange={(e) => setTempItemData({ ...tempItemData, first_name: e.target.value })}
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label">Last Name</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={tempItemData.last_name || ""}
                                                onChange={(e) => setTempItemData({ ...tempItemData, last_name: e.target.value })}
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label">Passport Number</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={tempItemData.passport_number || ""}
                                                onChange={(e) => setTempItemData({ ...tempItemData, passport_number: e.target.value })}
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label">Date of Birth</label>
                                            <input type="date" className="form-control"
                                                value={tempItemData.date_of_birth || ""}
                                                onChange={(e) => setTempItemData({ ...tempItemData, date_of_birth: e.target.value })}
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label">Passport Issue Date</label>
                                            <input type="date" className="form-control"
                                                value={tempItemData.passport_issue_date || ""}
                                                onChange={(e) => setTempItemData({ ...tempItemData, passport_issue_date: e.target.value })}
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label">Passport Expiry Date</label>
                                            <input type="date" className="form-control"
                                                value={tempItemData.passport_expiry_date || ""}
                                                onChange={(e) => setTempItemData({ ...tempItemData, passport_expiry_date: e.target.value })}
                                            />
                                        </div>
                                        <div className="col-md-12">
                                            <label className="form-label">Passport Image</label>
                                            <input type="file" className="form-control"
                                                onChange={(e) => {
                                                    console.log("File selected", e.target.files[0]);
                                                }}
                                            />
                                            <small className="text-muted">Upload Passport Image</small>
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>Cancel</button>
                                    <button type="button" className="btn btn-primary" onClick={handleSaveModal}>Save Changes</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Hotel Modal */}
                {activeModal === 'hotel' && (
                    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                        <div className="modal-dialog modal-lg modal-dialog-centered">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">{editingIndex === -1 ? 'Add New' : 'Edit'} Hotel</h5>
                                    <button type="button" className="btn-close" onClick={handleCloseModal}></button>
                                </div>
                                <div className="modal-body">
                                    <div className="row g-2 p-3 border rounded bg-light">
                                        <div className="col-md-4">
                                            <label className="form-label">Hotel Name</label>
                                            <select
                                                className="form-select"
                                                value={tempItemData.hotel || ""}
                                                onChange={(e) => {
                                                    const selectedHotel = hotelsList.find(h => h.id.toString() === e.target.value);
                                                    setTempItemData({
                                                        ...tempItemData,
                                                        hotel: e.target.value,
                                                        hotel_name: selectedHotel ? selectedHotel.name : ""
                                                    });
                                                }}
                                            >
                                                <option value="">Select Hotel</option>
                                                {hotelsList.map((hotel) => (
                                                    <option key={hotel.id} value={hotel.id}>
                                                        {hotel.name} {hotel.city ? `(${hotel.city})` : ''}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-md-3">
                                            <label className="form-label">Check In</label>
                                            <input
                                                type="date"
                                                className="form-control"
                                                value={tempItemData.check_in_time || tempItemData.check_in_date || ""}
                                                onChange={(e) => setTempItemData({ ...tempItemData, check_in_time: e.target.value, check_in_date: e.target.value })}
                                            />
                                        </div>
                                        <div className="col-md-3">
                                            <label className="form-label">Check Out</label>
                                            <input
                                                type="date"
                                                className="form-control"
                                                value={tempItemData.check_out_time || tempItemData.check_out_date || ""}
                                                onChange={(e) => setTempItemData({ ...tempItemData, check_out_time: e.target.value, check_out_date: e.target.value })}
                                            />
                                        </div>
                                        <div className="col-md-4">
                                            <label className="form-label">Room Type</label>
                                            <select
                                                className="form-select"
                                                value={tempItemData.room_type || ""}
                                                onChange={(e) => {
                                                    setTempItemData({
                                                        ...tempItemData,
                                                        room_type: e.target.value,
                                                        // Clear sharing type if not sharing room
                                                        sharing_type: e.target.value?.toLowerCase() === 'sharing' ? tempItemData.sharing_type : ""
                                                    });
                                                }}
                                            >
                                                <option value="">Select Room Type</option>
                                                <option value="single">Single</option>
                                                <option value="double">Double</option>
                                                <option value="triple">Triple</option>
                                                <option value="quad">Quad</option>
                                                <option value="sharing">Sharing</option>
                                                <option value="suite">Suite</option>
                                                {/* If current room type is not in the list, add it */}
                                                {tempItemData.room_type &&
                                                    !['single', 'double', 'triple', 'quad', 'sharing', 'suite', ''].includes(tempItemData.room_type.toLowerCase()) && (
                                                        <option value={tempItemData.room_type}>{tempItemData.room_type}</option>
                                                    )}
                                            </select>
                                        </div>
                                        <div className="col-md-4">
                                            <label className="form-label">Sharing Type</label>
                                            <select
                                                className="form-select"
                                                value={tempItemData.sharing_type || ""}
                                                onChange={(e) => setTempItemData({ ...tempItemData, sharing_type: e.target.value })}
                                                disabled={tempItemData.room_type?.toLowerCase() !== 'sharing'}
                                            >
                                                <option value="">Select Sharing Type</option>
                                                <option value="Family Sharing">Family Sharing</option>
                                                <option value="Gender Sharing">Gender Sharing</option>
                                                <option value="Gender or Family">Gender or Family</option>
                                            </select>
                                            {tempItemData.room_type?.toLowerCase() !== 'sharing' && <small className="text-muted">Only for sharing rooms</small>}
                                        </div>
                                        <div className="col-md-4">
                                            <label className="form-label">Quantity</label>
                                            <input
                                                type="number"
                                                className="form-control"
                                                value={tempItemData.quantity || 1}
                                                onChange={(e) => setTempItemData({ ...tempItemData, quantity: e.target.value })}
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label">Voucher Number</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={tempItemData.hotel_voucher_number || ""}
                                                onChange={(e) => setTempItemData({ ...tempItemData, hotel_voucher_number: e.target.value })}
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label">BRN</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={tempItemData.brn_number || ""}
                                                onChange={(e) => setTempItemData({ ...tempItemData, brn_number: e.target.value })}
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label">Special Request</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={tempItemData.special_request || ""}
                                                onChange={(e) => setTempItemData({ ...tempItemData, special_request: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>Cancel</button>
                                    <button type="button" className="btn btn-primary" onClick={handleSaveModal}>Save Changes</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Transport Modal */}
                {activeModal === 'transport' && (
                    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                        <div className="modal-dialog modal-dialog-centered">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">{editingIndex === -1 ? 'Add New' : 'Edit'} Transport</h5>
                                    <button type="button" className="btn-close" onClick={handleCloseModal}></button>
                                </div>
                                <div className="modal-body">
                                    <div className="row g-3">
                                        <div className="col-md-6">
                                            <label className="form-label">Vehicle Type</label>
                                            <select
                                                className="form-select"
                                                value={tempItemData.vehicle_type?.id || tempItemData.vehicle_type || ""}
                                                onChange={(e) => setTempItemData({ ...tempItemData, vehicle_type: e.target.value })}
                                            >
                                                <option value="">Select Vehicle Type</option>
                                                {vehicleTypesList.map((vehicle) => (
                                                    <option key={vehicle.id} value={vehicle.id}>
                                                        {vehicle.name || vehicle.vehicle_type}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label">Sector</label>
                                            <select
                                                className="form-select"
                                                value={tempItemData.sector?.id || tempItemData.sector || ""}
                                                onChange={(e) => setTempItemData({ ...tempItemData, sector: e.target.value })}
                                            >
                                                <option value="">Select Sector</option>
                                                {sectorsList.map((sector) => (
                                                    <option key={sector.id} value={sector.id}>
                                                        {sector.name || `${sector.departure_city} - ${sector.arrival_city}`}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label">Voucher Number</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={tempItemData.voucher_no || ""}
                                                onChange={(e) => setTempItemData({ ...tempItemData, voucher_no: e.target.value })}
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label">BRN</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={tempItemData.brn_no || tempItemData.brn_number || ""}
                                                onChange={(e) => setTempItemData({ ...tempItemData, brn_no: e.target.value, brn_number: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>Cancel</button>
                                    <button type="button" className="btn btn-primary" onClick={handleSaveModal}>Save Changes</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Food Modal */}
                {activeModal === 'food' && (
                    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                        <div className="modal-dialog modal-dialog-centered">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">{editingIndex === -1 ? 'Add New' : 'Edit'} Food</h5>
                                    <button type="button" className="btn-close" onClick={handleCloseModal}></button>
                                </div>
                                <div className="modal-body">
                                    <div className="row g-3">
                                        <div className="col-md-6">
                                            <label className="form-label">Food / Menu</label>
                                            <select
                                                className="form-select"
                                                value={tempItemData.food_price || (tempItemData.food && !isNaN(tempItemData.food) ? tempItemData.food : "")}
                                                onChange={(e) => {
                                                    const selected = foodsList.find(f => f.id == e.target.value);
                                                    setTempItemData({
                                                        ...tempItemData,
                                                        food_price: e.target.value,
                                                        food: selected ? selected.title : tempItemData.food,
                                                        food_display: selected ? selected.title : ""
                                                    });
                                                }}
                                            >
                                                <option value="">Select Food</option>
                                                {foodsList.map((food) => (
                                                    <option key={food.id} value={food.id}>
                                                        {food.title} {food.city ? `(${food.city.name || food.city})` : ''}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-md-6">

                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label">City</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={tempItemData.city || ""}
                                                onChange={(e) => setTempItemData({ ...tempItemData, city: e.target.value })}
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label">Voucher Number</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={tempItemData.food_voucher_number || ""}
                                                onChange={(e) => setTempItemData({ ...tempItemData, food_voucher_number: e.target.value })}
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label">BRN</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={tempItemData.food_brn || ""}
                                                onChange={(e) => setTempItemData({ ...tempItemData, food_brn: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>Cancel</button>
                                    <button type="button" className="btn btn-primary" onClick={handleSaveModal}>Save Changes</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Ziarat Modal */}
                {activeModal === 'ziarat' && (
                    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                        <div className="modal-dialog modal-lg modal-dialog-centered">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">{editingIndex === -1 ? 'Add New' : 'Edit'} Ziarat</h5>
                                    <button type="button" className="btn-close" onClick={handleCloseModal}></button>
                                </div>
                                <div className="modal-body">
                                    <div className="row g-3">
                                        <div className="col-md-6">
                                            <label className="form-label">Ziarat / Sightseeing</label>
                                            <select
                                                className="form-select"
                                                value={tempItemData.ziarat_price || (tempItemData.ziarat && !isNaN(tempItemData.ziarat) ? tempItemData.ziarat : "")}
                                                onChange={(e) => {
                                                    const selected = ziyaratsList.find(z => z.id == e.target.value);
                                                    setTempItemData({
                                                        ...tempItemData,
                                                        ziarat_price: e.target.value,
                                                        ziarat: selected ? selected.ziarat_title : tempItemData.ziarat,
                                                        ziarat_display: selected ? selected.ziarat_title : ""
                                                    });
                                                }}
                                            >
                                                <option value="">Select Ziarat</option>
                                                {ziyaratsList.map((ziarat) => (
                                                    <option key={ziarat.id} value={ziarat.id}>
                                                        {ziarat.ziarat_title} {ziarat.city ? `(${ziarat.city.name || ziarat.city})` : ''}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label">Voucher Number</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={tempItemData.ziyarat_voucher_number || ""}
                                                onChange={(e) => setTempItemData({ ...tempItemData, ziyarat_voucher_number: e.target.value })}
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label">BRN</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={tempItemData.ziyarat_brn || ""}
                                                onChange={(e) => setTempItemData({ ...tempItemData, ziyarat_brn: e.target.value })}
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label">Contact Person</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={tempItemData.contact_person_name || ""}
                                                onChange={(e) => setTempItemData({ ...tempItemData, contact_person_name: e.target.value })}
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label">Contact Number</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={tempItemData.contact_number || ""}
                                                onChange={(e) => setTempItemData({ ...tempItemData, contact_number: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>Cancel</button>
                                    <button type="button" className="btn btn-primary" onClick={handleSaveModal}>Save Changes</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Flight Modal */}
                {activeModal === 'flight' && (
                    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                        <div className="modal-dialog modal-xl modal-dialog-centered">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">Edit Flight Details</h5>
                                    <button type="button" className="btn-close" onClick={handleCloseModal}></button>
                                </div>
                                <div className="modal-body">
                                    {/* Departure Flight Edit */}
                                    <h6 className="fw-semibold mb-2">Departure Flight</h6>
                                    <div className="row g-2 mb-4 p-3 border rounded bg-light">
                                        <div className="col-md-3">
                                            <label className="form-label small mb-1">Airline Name or Code</label>
                                            <input
                                                type="text"
                                                className="form-control form-control-sm"
                                                placeholder="Airline"
                                                value={tempItemData.departure?.airline || ""}
                                                onChange={(e) => setTempItemData({ ...tempItemData, departure: { ...tempItemData.departure, airline: e.target.value } })}
                                            />
                                        </div>
                                        <div className="col-md-3">
                                            <label className="form-label small mb-1">Flight Number</label>
                                            <input
                                                type="text"
                                                className="form-control form-control-sm"
                                                placeholder="Flight Number"
                                                value={tempItemData.departure?.flight_number || ""}
                                                onChange={(e) => setTempItemData({ ...tempItemData, departure: { ...tempItemData.departure, flight_number: e.target.value } })}
                                            />
                                        </div>
                                        <div className="col-md-3">
                                            <label className="form-label small mb-1">From Sector</label>
                                            <input
                                                type="text"
                                                className="form-control form-control-sm"
                                                placeholder="From"
                                                value={tempItemData.departure?.from_sector || ""}
                                                onChange={(e) => setTempItemData({ ...tempItemData, departure: { ...tempItemData.departure, from_sector: e.target.value } })}
                                            />
                                        </div>
                                        <div className="col-md-3">
                                            <label className="form-label small mb-1">To Sector</label>
                                            <input
                                                type="text"
                                                className="form-control form-control-sm"
                                                placeholder="To"
                                                value={tempItemData.departure?.to_sector || ""}
                                                onChange={(e) => setTempItemData({ ...tempItemData, departure: { ...tempItemData.departure, to_sector: e.target.value } })}
                                            />
                                        </div>
                                        <div className="col-md-3">
                                            <label className="form-label small mb-1">Travel Date And Time</label>
                                            <input
                                                type="datetime-local"
                                                className="form-control form-control-sm"
                                                value={tempItemData.departure?.travel_date || ""}
                                                onChange={(e) => setTempItemData({ ...tempItemData, departure: { ...tempItemData.departure, travel_date: e.target.value } })}
                                            />
                                        </div>
                                        <div className="col-md-3">
                                            <label className="form-label small mb-1">Return Date And Time</label>
                                            <input
                                                type="datetime-local"
                                                className="form-control form-control-sm"
                                                value={tempItemData.departure?.return_date || ""}
                                                onChange={(e) => setTempItemData({ ...tempItemData, departure: { ...tempItemData.departure, return_date: e.target.value } })}
                                            />
                                        </div>
                                    </div>

                                    {/* Return Flight Edit */}
                                    <h6 className="fw-semibold mb-2">Return Flight</h6>
                                    <div className="row g-2 p-3 border rounded bg-light">
                                        <div className="col-md-3">
                                            <label className="form-label small mb-1">Airline Name or Code</label>
                                            <input
                                                type="text"
                                                className="form-control form-control-sm"
                                                placeholder="Airline"
                                                value={tempItemData.return?.airline || ""}
                                                onChange={(e) => setTempItemData({ ...tempItemData, return: { ...tempItemData.return, airline: e.target.value } })}
                                            />
                                        </div>
                                        <div className="col-md-3">
                                            <label className="form-label small mb-1">Flight Number</label>
                                            <input
                                                type="text"
                                                className="form-control form-control-sm"
                                                placeholder="Flight Number"
                                                value={tempItemData.return?.flight_number || ""}
                                                onChange={(e) => setTempItemData({ ...tempItemData, return: { ...tempItemData.return, flight_number: e.target.value } })}
                                            />
                                        </div>
                                        <div className="col-md-3">
                                            <label className="form-label small mb-1">From Sector</label>
                                            <input
                                                type="text"
                                                className="form-control form-control-sm"
                                                placeholder="From"
                                                value={tempItemData.return?.from_sector || ""}
                                                onChange={(e) => setTempItemData({ ...tempItemData, return: { ...tempItemData.return, from_sector: e.target.value } })}
                                            />
                                        </div>
                                        <div className="col-md-3">
                                            <label className="form-label small mb-1">To Sector</label>
                                            <input
                                                type="text"
                                                className="form-control form-control-sm"
                                                placeholder="To"
                                                value={tempItemData.return?.to_sector || ""}
                                                onChange={(e) => setTempItemData({ ...tempItemData, return: { ...tempItemData.return, to_sector: e.target.value } })}
                                            />
                                        </div>
                                        <div className="col-md-3">
                                            <label className="form-label small mb-1">Travel Date And Time</label>
                                            <input
                                                type="datetime-local"
                                                className="form-control form-control-sm"
                                                value={tempItemData.return?.travel_date || ""}
                                                onChange={(e) => setTempItemData({ ...tempItemData, return: { ...tempItemData.return, travel_date: e.target.value } })}
                                            />
                                        </div>
                                        <div className="col-md-3">
                                            <label className="form-label small mb-1">Return Date And Time</label>
                                            <input
                                                type="datetime-local"
                                                className="form-control form-control-sm"
                                                value={tempItemData.return?.return_date || ""}
                                                onChange={(e) => setTempItemData({ ...tempItemData, return: { ...tempItemData.return, return_date: e.target.value } })}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>Cancel</button>
                                    <button type="button" className="btn btn-primary" onClick={handleSaveModal}>Save Changes</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Delete Selection Modal */}
                {showDeleteModal && (
                    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                        <div className="modal-dialog modal-dialog-centered">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">Delete {deleteSection?.charAt(0).toUpperCase() + deleteSection?.slice(1)}</h5>
                                    <button type="button" className="btn-close" onClick={handleCloseDeleteModal}></button>
                                </div>
                                <div className="modal-body">
                                    <p className="text-muted small">Select the item you want to delete:</p>
                                    <div className="list-group">
                                        {deleteSection === 'passengers' && bookingData.person_details?.map((item, idx) => (
                                            <button key={idx} className="list-group-item list-group-item-action d-flex justify-content-between align-items-center" onClick={() => handleDeleteItem('passengers', idx)}>
                                                <span>{item.first_name} {item.last_name} ({item.person_title})</span>
                                                <i className="bi bi-trash text-danger"></i>
                                            </button>
                                        ))}
                                        {deleteSection === 'hotels' && bookingData.hotel_details?.map((item, idx) => (
                                            <button key={idx} className="list-group-item list-group-item-action d-flex justify-content-between align-items-center" onClick={() => handleDeleteItem('hotels', idx)}>
                                                <span>{item.hotel_name || item.hotel} ({item.check_in_date})</span>
                                                <i className="bi bi-trash text-danger"></i>
                                            </button>
                                        ))}
                                        {deleteSection === 'transport' && bookingData.transport_details?.map((item, idx) => (
                                            <button key={idx} className="list-group-item list-group-item-action d-flex justify-content-between align-items-center" onClick={() => handleDeleteItem('transport', idx)}>
                                                <span>{item.vehicle_type_display || item.vehicle_type}</span>
                                                <i className="bi bi-trash text-danger"></i>
                                            </button>
                                        ))}
                                        {deleteSection === 'food' && bookingData.food_details?.map((item, idx) => (
                                            <button key={idx} className="list-group-item list-group-item-action d-flex justify-content-between align-items-center" onClick={() => handleDeleteItem('food', idx)}>
                                                <span>{item.food}</span>
                                                <i className="bi bi-trash text-danger"></i>
                                            </button>
                                        ))}
                                        {deleteSection === 'ziarat' && bookingData.ziyarat_details?.map((item, idx) => (
                                            <button key={idx} className="list-group-item list-group-item-action d-flex justify-content-between align-items-center" onClick={() => handleDeleteItem('ziarat', idx)}>
                                                <span>{item.ziarat || item.ziyarat}</span>
                                                <i className="bi bi-trash text-danger"></i>
                                            </button>
                                        ))}
                                    </div>
                                    {((!bookingData.person_details?.length && deleteSection === 'passengers') ||
                                        (!bookingData.hotel_details?.length && deleteSection === 'hotels') ||
                                        (!bookingData.transport_details?.length && deleteSection === 'transport') ||
                                        (!bookingData.food_details?.length && deleteSection === 'food') ||
                                        (!bookingData.ziyarat_details?.length && deleteSection === 'ziarat')) ? (
                                        <div className="text-center p-3 text-muted">No items to delete.</div>
                                    ) : null}
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={handleCloseDeleteModal}>Close</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};


export default HotelVoucherInterfaceNew;
