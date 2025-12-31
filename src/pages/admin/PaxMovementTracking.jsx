import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Table, Form, Button, Badge, Modal, Spinner, Alert, Dropdown, Tabs, Tab } from "react-bootstrap";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import {
  Plane, MapPin, Users, Search, Edit, CheckCircle, XCircle, AlertCircle,
  Clock, Filter, Eye, Bell, Calendar, ArrowRight, Building2, User, FileText
} from "lucide-react";

const PaxMovementTracking = () => {
  const [passengers, setPassengers] = useState([]);
  const [filteredPassengers, setFilteredPassengers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");
  const [selectedPax, setSelectedPax] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showFlightModal, setShowFlightModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [alert, setAlert] = useState({ show: false, type: "", message: "" });
  const [activeTab, setActiveTab] = useState("all");

  const [flightFormData, setFlightFormData] = useState({
    flight_no: "",
    departure_airport: "",
    arrival_airport: "",
    departure_time: "",
    departure_date: "",
    arrival_time: "",
    arrival_date: "",
    current_city: ""
  });

  // Status options
  const statusOptions = [
    { value: "in_pakistan", label: "In Pakistan", color: "#6c757d", icon: "🇵🇰" },
    { value: "in_flight", label: "In Flight", color: "#17a2b8", icon: "✈️" },
    { value: "entered_ksa", label: "Entered KSA", color: "#ffc107", icon: "🛬" },
    { value: "in_ksa", label: "In KSA", color: "#0dcaf0", icon: "🕋" },
    { value: "in_makkah", label: "In Makkah", color: "#198754", icon: "🕋" },
    { value: "in_madina", label: "In Madina", color: "#20c997", icon: "🕌" },
    { value: "in_jeddah", label: "In Jeddah", color: "#0d6efd", icon: "🏙️" },
    { value: "exit_pending", label: "Exit Pending", color: "#fd7e14", icon: "⏳" },
    { value: "exited_ksa", label: "Exited KSA", color: "#198754", icon: "✅" },
  ];

  useEffect(() => {
    loadPassengers();
  }, []);

  useEffect(() => {
    filterPassengers();
  }, [passengers, searchQuery, statusFilter, cityFilter, activeTab]);

  const loadPassengers = async () => {
    setLoading(true);
    try {
      const orgData = JSON.parse(localStorage.getItem("selectedOrganization"));
      const organizationId = orgData?.id;
      const token = localStorage.getItem("accessToken");

      // Validate required data
      if (!organizationId) {
        console.error("❌ Organization ID not found in localStorage");
        showAlert("danger", "Organization not selected. Please select an organization first.");
        setLoading(false);
        return;
      }

      if (!token) {
        console.error("❌ Access token not found");
        showAlert("danger", "Authentication required. Please login again.");
        setLoading(false);
        return;
      }

      console.log("✅ Organization ID:", organizationId);

      // Fetch all bookings with Approved or Delivered status
      const response = await fetch(
        `http://127.0.0.1:8000/api/bookings/?organization=${organizationId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch bookings: ${response.status}`);
      }

      const allBookings = await response.json();

      // Filter for Approved or Delivered bookings
      const bookings = allBookings.filter(b =>
        b.status === 'Approved' || b.status === 'Delivered'
      );

      console.log("📦 Fetched Approved/Delivered Bookings:", bookings);

      // Transform bookings data to passenger format
      const transformedPassengers = [];

      // Helper function to determine passenger status based on dates and transport
      const determinePassengerStatus = (booking, person) => {
        const currentDate = new Date();
        let status = "in_pakistan";
        let current_city = "Pakistan";
        let last_updated = booking.updated_at || new Date().toISOString();

        // Get flight dates and times from trip_details
        const ticket = booking.ticket_details?.[0];
        const tripDetails = ticket?.trip_details?.[0]; // Get first trip (outbound flight)
        console.log('🔍 Status check for', booking.booking_number, ':', { ticket, tripDetails });

        if (!tripDetails) {
          // No flight information, passenger is in Pakistan
          return { status, current_city, last_updated };
        }

        // Parse departure and arrival datetime from trip_details
        const departureDatetime = tripDetails.departure_date_time ? new Date(tripDetails.departure_date_time) : null;
        const arrivalDatetime = tripDetails.arrival_date_time ? new Date(tripDetails.arrival_date_time) : null;

        // Get return flight info (usually second trip or from ticket fields)
        const returnTrip = ticket?.trip_details?.[1];
        const returnDatetime = returnTrip?.departure_date_time ? new Date(returnTrip.departure_date_time) : null;

        console.log('Flight times:', {
          booking: booking.booking_number,
          departure: departureDatetime,
          arrival: arrivalDatetime,
          return: returnDatetime,
          current: currentDate
        });

        // Check if passenger is in flight or has arrived
        if (departureDatetime && currentDate >= departureDatetime) {
          // Check if passenger is currently in flight
          if (arrivalDatetime && currentDate < arrivalDatetime) {
            status = "in_flight";
            current_city = "In Flight to KSA";
            last_updated = tripDetails.departure_date_time;
          } else if (arrivalDatetime) {
            // Passenger has arrived in KSA
            status = "entered_ksa";
            current_city = tripDetails.arrival_city || "KSA";
            last_updated = tripDetails.arrival_date_time;

            // Check if passenger has returned to Pakistan
            if (returnDatetime && currentDate >= returnDatetime) {
              status = "exited_ksa";
              current_city = "Pakistan";
              last_updated = returnTrip.departure_date_time;
            } else {
              // Passenger is in KSA, check transport sectors to determine location
              if (booking.transport_details && booking.transport_details.length > 0) {
                // Check the most recent transport sector based on current date
                for (const transport of booking.transport_details) {
                  if (transport.sector_details && transport.sector_details.length > 0) {
                    // Check each sector to find current location
                    for (const sector of transport.sector_details) {
                      const arrivalCity = sector.arrival_city?.toLowerCase() || "";

                      if (arrivalCity.includes("makkah") || arrivalCity.includes("mecca")) {
                        status = "in_makkah";
                        current_city = "Makkah";
                        break;
                      } else if (arrivalCity.includes("madinah") || arrivalCity.includes("madina")) {
                        status = "in_madina";
                        current_city = "Madina";
                        break;
                      } else if (arrivalCity.includes("jeddah") || arrivalCity.includes("jed")) {
                        status = "in_jeddah";
                        current_city = "Jeddah";
                        break;
                      }
                    }

                    // If we found a specific city, break
                    if (status !== "entered_ksa") {
                      break;
                    }
                  }
                }
              }

              // Check if return date is approaching (exit pending)
              if (returnDatetime) {
                const daysUntilReturn = Math.ceil((returnDatetime - currentDate) / (1000 * 60 * 60 * 24));
                if (daysUntilReturn <= 2 && daysUntilReturn >= 0) {
                  status = "exit_pending";
                  // Keep current_city as is
                }
              }
            }
          }
        }

        return { status, current_city, last_updated };
      };

      // Fetch agency data for all unique agencies
      const agencyCache = {};
      const fetchAgencyData = async (agencyId) => {
        if (!agencyId || !organizationId) return null;
        if (agencyCache[agencyId]) return agencyCache[agencyId];

        try {
          const agencyResponse = await fetch(
            `http://127.0.0.1:8000/api/agencies/?organization_id=${organizationId}&id=${agencyId}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              }
            }
          );

          if (agencyResponse.ok) {
            const agencyData = await agencyResponse.json();
            const agency = agencyData.results?.find(a => a.id === agencyId)
              || agencyData.find(a => a.id === agencyId)
              || null;
            agencyCache[agencyId] = agency;
            return agency;
          }
        } catch (error) {
          console.error(`Error fetching agency ${agencyId}:`, error);
        }
        return null;
      };

      for (const booking of bookings) {
        console.log('Processing booking:', booking.booking_number, {
          has_ticket_details: !!booking.ticket_details,
          ticket_count: booking.ticket_details?.length || 0,
          first_ticket: booking.ticket_details?.[0]
        });

        if (booking.person_details && booking.person_details.length > 0) {
          // Fetch agency data once per booking
          const agencyId = typeof booking.agency === 'object' ? booking.agency.id : booking.agency;
          const agencyData = await fetchAgencyData(agencyId);
          const agentName = agencyData?.ageny_name || agencyData?.name || "N/A";

          for (let index = 0; index < booking.person_details.length; index++) {
            const person = booking.person_details[index];

            // Log each passenger for debugging
            console.log(`   👤 Passenger ${index + 1}: ${person.first_name} ${person.last_name}`, {
              visa_status: person.visa_status,
              will_show: person.visa_status === "Approved"
            });

            // Only process passengers with approved visa status
            if (person.visa_status !== "Approved") {
              console.log(`   ❌ Skipping - Visa status is "${person.visa_status}", not "Approved"`);
              continue;
            }

            console.log(`   ✅ Adding approved passenger to list`);

            // Extract flight information from ticket_details if available
            const flights = [];
            if (booking.ticket_details && booking.ticket_details.length > 0) {
              const ticket = booking.ticket_details[0];
              console.log('Ticket structure for', booking.booking_number, ':', ticket);
              console.log('Has trip_details?', !!ticket.trip_details);
              if (ticket.departure_date) {
                flights.push({
                  flight_no: ticket.flight_number || "N/A",
                  departure_airport: ticket.departure_airport || "Pakistan",
                  arrival_airport: ticket.arrival_airport || "Jeddah (JED)",
                  departure_date: ticket.departure_date,
                  departure_time: ticket.departure_time || "N/A",
                  arrival_date: ticket.arrival_date || ticket.departure_date,
                  arrival_time: ticket.arrival_time || "N/A",
                  type: "entry"
                });
              }
              if (ticket.return_date) {
                flights.push({
                  flight_no: ticket.return_flight_number || "N/A",
                  departure_airport: ticket.arrival_airport || "Jeddah (JED)",
                  arrival_airport: ticket.departure_airport || "Pakistan",
                  departure_date: ticket.return_date,
                  departure_time: ticket.return_time || "N/A",
                  arrival_date: ticket.return_arrival_date || ticket.return_date,
                  arrival_time: ticket.return_arrival_time || "N/A",
                  type: "exit"
                });
              }
            }

            // Determine passenger status intelligently
            const { status, current_city, last_updated } = determinePassengerStatus(booking, person);

            transformedPassengers.push({
              id: `${booking.id}_${index}`,
              pax_id: `PAX${booking.booking_number}_${index + 1}`,
              name: `${person.first_name} ${person.last_name}`,
              passport_no: person.passport_number || "N/A",
              organization: booking.organization_name || "N/A",
              branch: booking.branch_name || "N/A",
              agent_id: agencyId,
              agent_name: agentName,
              booking_date: booking.created_at || new Date().toISOString(),
              booking_number: booking.booking_number,
              status: status,
              current_city: current_city,
              verified_exit: status === "exited_ksa",
              shirkat_reported: false,
              flights: flights,
              last_updated: last_updated,
              visa_status: person.visa_status,
              age_group: person.age_group || "Adult",
              date_of_birth: person.date_of_birth
            });
          }
        }
      }

      console.log("✅ Transformed Passengers:", transformedPassengers);
      setPassengers(transformedPassengers);
    } catch (error) {
      console.error("Error loading passengers:", error);
      showAlert("danger", "Failed to load passenger data");
    } finally {
      setLoading(false);
    }
  };

  const filterPassengers = () => {
    console.log("🔍 filterPassengers called with:", {
      total_passengers: passengers.length,
      activeTab,
      statusFilter,
      cityFilter,
      searchQuery
    });

    let filtered = [...passengers];

    // Filter by tab (active tab)
    if (activeTab !== "all") {
      filtered = filtered.filter(pax => pax.status === activeTab);
      console.log(`   After activeTab filter (${activeTab}):`, filtered.length);
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter(pax => pax.status === statusFilter);
      console.log(`   After statusFilter (${statusFilter}):`, filtered.length);
    }

    // Filter by city
    if (cityFilter !== "all") {
      filtered = filtered.filter(pax => pax.current_city === cityFilter);
      console.log(`   After cityFilter (${cityFilter}):`, filtered.length);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(pax =>
        pax.name.toLowerCase().includes(query) ||
        pax.passport_no.toLowerCase().includes(query) ||
        pax.pax_id.toLowerCase().includes(query) ||
        pax.agent_name.toLowerCase().includes(query)
      );
      console.log(`   After searchQuery (${searchQuery}):`, filtered.length);
    }

    console.log("✅ Final filtered passengers:", filtered.length, filtered);
    setFilteredPassengers(filtered);
  };

  const getStatusBadge = (status) => {
    const statusObj = statusOptions.find(s => s.value === status);
    if (!statusObj) return null;

    return (
      <Badge
        style={{
          backgroundColor: statusObj.color,
          padding: "6px 12px",
          fontSize: "13px",
          fontWeight: 500
        }}
      >
        <span className="me-1">{statusObj.icon}</span>
        {statusObj.label}
      </Badge>
    );
  };

  const getStatistics = () => {
    return {
      total: passengers.length,
      in_pakistan: passengers.filter(p => p.status === "in_pakistan").length,
      in_flight: passengers.filter(p => p.status === "in_flight").length,
      entered_ksa: passengers.filter(p => p.status === "entered_ksa").length,
      in_ksa: passengers.filter(p => p.status === "in_ksa").length,
      in_makkah: passengers.filter(p => p.status === "in_makkah").length,
      in_madina: passengers.filter(p => p.status === "in_madina").length,
      in_jeddah: passengers.filter(p => p.status === "in_jeddah").length,
      exit_pending: passengers.filter(p => p.status === "exit_pending").length,
      exited_ksa: passengers.filter(p => p.status === "exited_ksa").length,
      verified_exits: passengers.filter(p => p.verified_exit).length,
      shirkat_reported: passengers.filter(p => !p.shirkat_reported).length
    };
  };

  const stats = getStatistics();

  const handleViewDetails = (pax) => {
    setSelectedPax(pax);
    setShowDetailsModal(true);
  };

  const handleUpdateFlight = (pax) => {
    setSelectedPax(pax);
    const lastFlight = pax.flights[pax.flights.length - 1] || {};
    setFlightFormData({
      flight_no: lastFlight.flight_no || "",
      departure_airport: lastFlight.departure_airport || "",
      arrival_airport: lastFlight.arrival_airport || "",
      departure_time: lastFlight.departure_time || "",
      departure_date: lastFlight.departure_date || "",
      arrival_time: lastFlight.arrival_time || "",
      arrival_date: lastFlight.arrival_date || "",
      current_city: pax.current_city || ""
    });
    setShowFlightModal(true);
  };

  const handleFlightSubmit = async () => {
    try {
      // TODO: Replace with actual API call
      // await fetch(`/pax-movement/update/${selectedPax.id}`, {
      //   method: "PUT",
      //   body: JSON.stringify(flightFormData)
      // });

      // Update local state
      const updatedPassengers = passengers.map(pax =>
        pax.id === selectedPax.id
          ? {
            ...pax,
            flights: [...pax.flights, { ...flightFormData, type: "exit" }],
            current_city: flightFormData.current_city,
            status: "exit_pending",
            shirkat_reported: false,
            last_updated: new Date().toISOString()
          }
          : pax
      );
      setPassengers(updatedPassengers);

      showAlert("success", "Flight information updated successfully");
      setShowFlightModal(false);
    } catch (error) {
      console.error("Error updating flight:", error);
      showAlert("danger", "Failed to update flight information");
    }
  };

  const handleVerifyExit = (pax) => {
    setSelectedPax(pax);
    setShowVerifyModal(true);
  };

  const confirmVerifyExit = async (verified) => {
    try {
      // TODO: Replace with actual API call
      // await fetch(`/pax-movement/verify-exit/${selectedPax.id}`, {
      //   method: "POST",
      //   body: JSON.stringify({ verified })
      // });

      // Update local state
      const updatedPassengers = passengers.map(pax =>
        pax.id === selectedPax.id
          ? {
            ...pax,
            verified_exit: verified,
            status: verified ? "exited_ksa" : "exit_pending",
            current_city: verified ? "Pakistan" : pax.current_city,
            last_updated: new Date().toISOString()
          }
          : pax
      );
      setPassengers(updatedPassengers);

      if (!verified) {
        // Send notification to agent
        showAlert("info", "Notification sent to agent to update flight information");
      } else {
        showAlert("success", "Exit verified successfully");
      }

      setShowVerifyModal(false);
    } catch (error) {
      console.error("Error verifying exit:", error);
      showAlert("danger", "Failed to verify exit");
    }
  };

  const toggleShirkatReport = async (paxId) => {
    try {
      const updatedPassengers = passengers.map(pax =>
        pax.id === paxId
          ? { ...pax, shirkat_reported: !pax.shirkat_reported }
          : pax
      );
      setPassengers(updatedPassengers);

      showAlert("success", "Shirkat reporting status updated");
    } catch (error) {
      console.error("Error updating shirkat status:", error);
      showAlert("danger", "Failed to update shirkat status");
    }
  };

  const showAlert = (type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => {
      setAlert({ show: false, type: "", message: "" });
    }, 5000);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8f9fa" }}>
      <div className="row g-0">
        <div className="col-12 col-lg-2">
          <Sidebar />
        </div>

        <div className="col-12 col-lg-10">
          <Header />

          <Container fluid className="p-4">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h2 className="mb-1" style={{ fontWeight: 600, color: "#2c3e50" }}>
                  <Plane size={32} className="me-2" style={{ color: "#1B78CE" }} />
                  Pax Movement & Intimation
                </h2>
                <p className="text-muted mb-0">Track passenger entry/exit and verify KSA movements</p>
              </div>
              <Button
                variant="outline-primary"
                style={{
                  padding: "10px 20px",
                  borderRadius: "8px",
                  fontWeight: 500
                }}
                onClick={loadPassengers}
              >
                <Bell size={20} className="me-2" />
                Refresh Data
              </Button>
            </div>

            {/* Alert */}
            {alert.show && (
              <Alert
                variant={alert.type}
                dismissible
                onClose={() => setAlert({ show: false, type: "", message: "" })}
                className="mb-4"
              >
                {alert.message}
              </Alert>
            )}

            {/* Statistics Cards */}
            <Row className="mb-4">
              <Col md={6} lg={3} xl={2} className="mb-3">
                <Card className="border-0 shadow-sm h-100" style={{ cursor: "pointer" }} onClick={() => setActiveTab("all")}>
                  <Card.Body>
                    <div className="d-flex align-items-center justify-content-between">
                      <div>
                        <p className="text-muted mb-1" style={{ fontSize: "13px" }}>Total Passengers</p>
                        <h4 className="mb-0" style={{ fontWeight: 600 }}>{stats.total}</h4>
                      </div>
                      <div
                        style={{
                          width: "45px",
                          height: "45px",
                          borderRadius: "10px",
                          backgroundColor: "#1B78CE20",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}
                      >
                        <Users size={22} style={{ color: "#1B78CE" }} />
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>

              <Col md={6} lg={3} xl={2} className="mb-3">
                <Card className="border-0 shadow-sm h-100" style={{ cursor: "pointer" }} onClick={() => setActiveTab("in_pakistan")}>
                  <Card.Body>
                    <div className="d-flex align-items-center justify-content-between">
                      <div>
                        <p className="text-muted mb-1" style={{ fontSize: "13px" }}>In Pakistan 🇵🇰</p>
                        <h4 className="mb-0" style={{ fontWeight: 600 }}>{stats.in_pakistan}</h4>
                      </div>
                      <div
                        style={{
                          width: "45px",
                          height: "45px",
                          borderRadius: "10px",
                          backgroundColor: "#6c757d20",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}
                      >
                        <MapPin size={22} style={{ color: "#6c757d" }} />
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>

              <Col md={6} lg={3} xl={2} className="mb-3">
                <Card className="border-0 shadow-sm h-100" style={{ cursor: "pointer" }} onClick={() => setActiveTab("in_flight")}>
                  <Card.Body>
                    <div className="d-flex align-items-center justify-content-between">
                      <div>
                        <p className="text-muted mb-1" style={{ fontSize: "13px" }}>In Flight ✈️</p>
                        <h4 className="mb-0" style={{ fontWeight: 600 }}>{stats.in_flight}</h4>
                      </div>
                      <div
                        style={{
                          width: "45px",
                          height: "45px",
                          borderRadius: "10px",
                          backgroundColor: "#17a2b820",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}
                      >
                        <Plane size={22} style={{ color: "#17a2b8" }} />
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>

              <Col md={6} lg={3} xl={2} className="mb-3">
                <Card className="border-0 shadow-sm h-100" style={{ cursor: "pointer" }} onClick={() => setActiveTab("in_makkah")}>
                  <Card.Body>
                    <div className="d-flex align-items-center justify-content-between">
                      <div>
                        <p className="text-muted mb-1" style={{ fontSize: "13px" }}>In Makkah 🕋</p>
                        <h4 className="mb-0" style={{ fontWeight: 600 }}>{stats.in_makkah}</h4>
                      </div>
                      <div
                        style={{
                          width: "45px",
                          height: "45px",
                          borderRadius: "10px",
                          backgroundColor: "#19875420",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}
                      >
                        <MapPin size={22} style={{ color: "#198754" }} />
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>

              <Col md={6} lg={3} xl={2} className="mb-3">
                <Card className="border-0 shadow-sm h-100" style={{ cursor: "pointer" }} onClick={() => setActiveTab("in_madina")}>
                  <Card.Body>
                    <div className="d-flex align-items-center justify-content-between">
                      <div>
                        <p className="text-muted mb-1" style={{ fontSize: "13px" }}>In Madina 🕌</p>
                        <h4 className="mb-0" style={{ fontWeight: 600 }}>{stats.in_madina}</h4>
                      </div>
                      <div
                        style={{
                          width: "45px",
                          height: "45px",
                          borderRadius: "10px",
                          backgroundColor: "#20c99720",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}
                      >
                        <MapPin size={22} style={{ color: "#20c997" }} />
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>

              <Col md={6} lg={3} xl={2} className="mb-3">
                <Card className="border-0 shadow-sm h-100" style={{ cursor: "pointer" }} onClick={() => setActiveTab("exit_pending")}>
                  <Card.Body>
                    <div className="d-flex align-items-center justify-content-between">
                      <div>
                        <p className="text-muted mb-1" style={{ fontSize: "13px" }}>Exit Pending ⏳</p>
                        <h4 className="mb-0" style={{ fontWeight: 600 }}>{stats.exit_pending}</h4>
                      </div>
                      <div
                        style={{
                          width: "45px",
                          height: "45px",
                          borderRadius: "10px",
                          backgroundColor: "#fd7e1420",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}
                      >
                        <Clock size={22} style={{ color: "#fd7e14" }} />
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>

              <Col md={6} lg={3} xl={2} className="mb-3">
                <Card className="border-0 shadow-sm h-100" style={{ cursor: "pointer" }} onClick={() => setActiveTab("exited_ksa")}>
                  <Card.Body>
                    <div className="d-flex align-items-center justify-content-between">
                      <div>
                        <p className="text-muted mb-1" style={{ fontSize: "13px" }}>Exited KSA ✅</p>
                        <h4 className="mb-0" style={{ fontWeight: 600 }}>{stats.exited_ksa}</h4>
                      </div>
                      <div
                        style={{
                          width: "45px",
                          height: "45px",
                          borderRadius: "10px",
                          backgroundColor: "#19875420",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}
                      >
                        <CheckCircle size={22} style={{ color: "#198754" }} />
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* Search and Filter */}
            <Card className="border-0 shadow-sm mb-4">
              <Card.Body className="p-3">
                <Row className="align-items-center">
                  <Col md={6} className="mb-2 mb-md-0">
                    <div style={{ position: "relative" }}>
                      <Search
                        size={20}
                        style={{
                          position: "absolute",
                          left: "12px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          color: "#6c757d"
                        }}
                      />
                      <Form.Control
                        type="text"
                        placeholder="Search by name, passport, pax ID, or agent..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                          paddingLeft: "40px",
                          borderRadius: "8px",
                          border: "1px solid #dee2e6"
                        }}
                      />
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="d-flex gap-2 align-items-center">
                      <Filter size={20} className="text-muted" />
                      <Form.Select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        style={{ borderRadius: "8px", maxWidth: "180px" }}
                      >
                        <option value="all">All Status</option>
                        {statusOptions.map(status => (
                          <option key={status.value} value={status.value}>
                            {status.icon} {status.label}
                          </option>
                        ))}
                      </Form.Select>
                      <Form.Select
                        value={cityFilter}
                        onChange={(e) => setCityFilter(e.target.value)}
                        style={{ borderRadius: "8px", maxWidth: "180px" }}
                      >
                        <option value="all">All Cities</option>
                        <option value="Pakistan">Pakistan</option>
                        <option value="Makkah">Makkah</option>
                        <option value="Madina">Madina</option>
                        <option value="Jeddah">Jeddah</option>
                      </Form.Select>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Passengers Table */}
            <Card className="border-0 shadow-sm">
              <Card.Body className="p-0">
                {loading ? (
                  <div className="text-center py-5">
                    <Spinner animation="border" variant="primary" />
                    <p className="text-muted mt-3">Loading passenger data...</p>
                  </div>
                ) : filteredPassengers.length === 0 ? (
                  <div className="text-center py-5">
                    <Users size={64} className="text-muted mb-3" />
                    <h5 className="text-muted">No passengers found</h5>
                    <p className="text-muted">Try adjusting your search or filter criteria</p>
                  </div>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <Table hover className="mb-0" style={{ minWidth: "1400px" }}>
                      <thead style={{ backgroundColor: "#f8f9fa" }}>
                        <tr>
                          <th style={{ padding: "16px", fontWeight: 600, minWidth: "120px" }}>Pax ID</th>
                          <th style={{ padding: "16px", fontWeight: 600, minWidth: "180px" }}>Name</th>
                          <th style={{ padding: "16px", fontWeight: 600, minWidth: "140px" }}>Passport</th>
                          <th style={{ padding: "16px", fontWeight: 600, minWidth: "150px" }}>Agent</th>
                          <th style={{ padding: "16px", fontWeight: 600, minWidth: "160px" }}>Status</th>
                          <th style={{ padding: "16px", fontWeight: 600, minWidth: "120px" }}>City</th>
                          <th style={{ padding: "16px", fontWeight: 600, minWidth: "130px" }}>Exit Verified</th>
                          <th style={{ padding: "16px", fontWeight: 600, minWidth: "150px" }}>Shirkat Report</th>
                          <th style={{ padding: "16px", fontWeight: 600, minWidth: "180px" }}>Last Updated</th>
                          <th style={{ padding: "16px", fontWeight: 600, minWidth: "150px", textAlign: "center" }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPassengers.map((pax) => (
                          <tr key={pax.id}>
                            <td style={{ padding: "16px" }}>
                              <span style={{ fontWeight: 500, color: "#1B78CE" }}>{pax.pax_id}</span>
                            </td>
                            <td style={{ padding: "16px", fontWeight: 500 }}>
                              {pax.name}
                            </td>
                            <td style={{ padding: "16px" }}>
                              <span className="text-muted">{pax.passport_no}</span>
                            </td>
                            <td style={{ padding: "16px" }}>
                              <span className="text-muted">{pax.agent_name}</span>
                            </td>
                            <td style={{ padding: "16px" }}>
                              {getStatusBadge(pax.status)}
                            </td>
                            <td style={{ padding: "16px" }}>
                              <div className="d-flex align-items-center gap-2">
                                <MapPin size={16} className="text-muted" />
                                <span>{pax.current_city}</span>
                              </div>
                            </td>
                            <td style={{ padding: "16px" }}>
                              {pax.verified_exit ? (
                                <Badge bg="success">
                                  <CheckCircle size={14} className="me-1" />
                                  Verified
                                </Badge>
                              ) : (
                                <Badge bg="secondary">
                                  <XCircle size={14} className="me-1" />
                                  Pending
                                </Badge>
                              )}
                            </td>
                            <td style={{ padding: "16px" }}>
                              <Form.Check
                                type="switch"
                                checked={pax.shirkat_reported}
                                onChange={() => toggleShirkatReport(pax.id)}
                                label={pax.shirkat_reported ? "Reported" : "Not Reported"}
                              />
                            </td>
                            <td style={{ padding: "16px" }}>
                              <span className="text-muted" style={{ fontSize: "13px" }}>
                                {formatDate(pax.last_updated)}
                              </span>
                            </td>
                            <td style={{ padding: "16px", textAlign: "center" }}>
                              <div className="d-flex gap-2 justify-content-center">
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  onClick={() => handleViewDetails(pax)}
                                  style={{ borderRadius: "6px" }}
                                >
                                  <Eye size={16} />
                                </Button>
                                <Button
                                  variant="outline-warning"
                                  size="sm"
                                  onClick={() => handleUpdateFlight(pax)}
                                  style={{ borderRadius: "6px" }}
                                >
                                  <Edit size={16} />
                                </Button>
                                {pax.status === "exit_pending" && (
                                  <Button
                                    variant="outline-success"
                                    size="sm"
                                    onClick={() => handleVerifyExit(pax)}
                                    style={{ borderRadius: "6px" }}
                                  >
                                    <CheckCircle size={16} />
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Container>
        </div>
      </div>

      {/* Details Modal */}
      <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <User size={24} className="me-2" />
            Passenger Details
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedPax && (
            <div>
              {/* Passenger Info */}
              <h6 className="mb-3" style={{ fontWeight: 600 }}>Passenger Information</h6>
              <Row className="mb-4">
                <Col md={6} className="mb-3">
                  <p className="text-muted mb-1" style={{ fontSize: "14px" }}>Pax ID</p>
                  <p className="mb-0" style={{ fontWeight: 500 }}>{selectedPax.pax_id}</p>
                </Col>
                <Col md={6} className="mb-3">
                  <p className="text-muted mb-1" style={{ fontSize: "14px" }}>Name</p>
                  <p className="mb-0" style={{ fontWeight: 500 }}>{selectedPax.name}</p>
                </Col>
                <Col md={6} className="mb-3">
                  <p className="text-muted mb-1" style={{ fontSize: "14px" }}>Passport Number</p>
                  <p className="mb-0">{selectedPax.passport_no}</p>
                </Col>
                <Col md={6} className="mb-3">
                  <p className="text-muted mb-1" style={{ fontSize: "14px" }}>Current Status</p>
                  {getStatusBadge(selectedPax.status)}
                </Col>
                <Col md={6} className="mb-3">
                  <p className="text-muted mb-1" style={{ fontSize: "14px" }}>Current City</p>
                  <p className="mb-0">{selectedPax.current_city}</p>
                </Col>
                <Col md={6} className="mb-3">
                  <p className="text-muted mb-1" style={{ fontSize: "14px" }}>Organization</p>
                  <p className="mb-0">{selectedPax.organization}</p>
                </Col>
                <Col md={6} className="mb-3">
                  <p className="text-muted mb-1" style={{ fontSize: "14px" }}>Branch</p>
                  <p className="mb-0">{selectedPax.branch}</p>
                </Col>
                <Col md={6} className="mb-3">
                  <p className="text-muted mb-1" style={{ fontSize: "14px" }}>Agent</p>
                  <p className="mb-0">{selectedPax.agent_name}</p>
                </Col>
              </Row>

              {/* Flight Details */}
              <h6 className="mb-3" style={{ fontWeight: 600 }}>Flight Details</h6>
              {selectedPax.flights.map((flight, index) => (
                <Card key={index} className="mb-3" style={{ backgroundColor: "#f8f9fa" }}>
                  <Card.Body>
                    <div className="d-flex align-items-center mb-2">
                      <Badge bg={flight.type === "entry" ? "info" : "warning"} className="me-2">
                        {flight.type === "entry" ? "Entry Flight" : "Exit Flight"}
                      </Badge>
                      <span style={{ fontWeight: 500 }}>{flight.flight_no}</span>
                    </div>
                    <Row>
                      <Col md={6} className="mb-2">
                        <p className="text-muted mb-1" style={{ fontSize: "13px" }}>Departure</p>
                        <p className="mb-0" style={{ fontSize: "14px" }}>
                          {flight.departure_airport}
                          <br />
                          <span className="text-muted">{flight.departure_date} at {flight.departure_time}</span>
                        </p>
                      </Col>
                      <Col md={6} className="mb-2">
                        <p className="text-muted mb-1" style={{ fontSize: "13px" }}>Arrival</p>
                        <p className="mb-0" style={{ fontSize: "14px" }}>
                          {flight.arrival_airport}
                          <br />
                          <span className="text-muted">{flight.arrival_date} at {flight.arrival_time}</span>
                        </p>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              ))}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Update Flight Modal */}
      <Modal show={showFlightModal} onHide={() => setShowFlightModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <Plane size={24} className="me-2" />
            Update Flight Information
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6} className="mb-3">
                <Form.Group>
                  <Form.Label>Flight Number *</Form.Label>
                  <Form.Control
                    type="text"
                    value={flightFormData.flight_no}
                    onChange={(e) => setFlightFormData({ ...flightFormData, flight_no: e.target.value })}
                    placeholder="PK-740"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6} className="mb-3">
                <Form.Group>
                  <Form.Label>Current City *</Form.Label>
                  <Form.Select
                    value={flightFormData.current_city}
                    onChange={(e) => setFlightFormData({ ...flightFormData, current_city: e.target.value })}
                    required
                  >
                    <option value="">Select city...</option>
                    <option value="Makkah">Makkah</option>
                    <option value="Madina">Madina</option>
                    <option value="Jeddah">Jeddah</option>
                    <option value="Pakistan">Pakistan</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6} className="mb-3">
                <Form.Group>
                  <Form.Label>Departure Airport *</Form.Label>
                  <Form.Control
                    type="text"
                    value={flightFormData.departure_airport}
                    onChange={(e) => setFlightFormData({ ...flightFormData, departure_airport: e.target.value })}
                    placeholder="Jeddah (JED)"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6} className="mb-3">
                <Form.Group>
                  <Form.Label>Arrival Airport *</Form.Label>
                  <Form.Control
                    type="text"
                    value={flightFormData.arrival_airport}
                    onChange={(e) => setFlightFormData({ ...flightFormData, arrival_airport: e.target.value })}
                    placeholder="Lahore (LHE)"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6} className="mb-3">
                <Form.Group>
                  <Form.Label>Departure Date *</Form.Label>
                  <Form.Control
                    type="date"
                    value={flightFormData.departure_date}
                    onChange={(e) => setFlightFormData({ ...flightFormData, departure_date: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6} className="mb-3">
                <Form.Group>
                  <Form.Label>Departure Time *</Form.Label>
                  <Form.Control
                    type="time"
                    value={flightFormData.departure_time}
                    onChange={(e) => setFlightFormData({ ...flightFormData, departure_time: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6} className="mb-3">
                <Form.Group>
                  <Form.Label>Arrival Date *</Form.Label>
                  <Form.Control
                    type="date"
                    value={flightFormData.arrival_date}
                    onChange={(e) => setFlightFormData({ ...flightFormData, arrival_date: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6} className="mb-3">
                <Form.Group>
                  <Form.Label>Arrival Time *</Form.Label>
                  <Form.Control
                    type="time"
                    value={flightFormData.arrival_time}
                    onChange={(e) => setFlightFormData({ ...flightFormData, arrival_time: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowFlightModal(false)}>
            Cancel
          </Button>
          <Button
            style={{ background: "#1B78CE", border: "none" }}
            onClick={handleFlightSubmit}
          >
            <CheckCircle size={18} className="me-2" />
            Update Flight
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Verify Exit Modal */}
      <Modal show={showVerifyModal} onHide={() => setShowVerifyModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            <CheckCircle size={24} className="me-2" />
            Verify Exit
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedPax && (
            <div>
              <p>Verify exit status for:</p>
              <div className="p-3" style={{ backgroundColor: "#f8f9fa", borderRadius: "8px" }}>
                <p className="mb-1"><strong>Name:</strong> {selectedPax.name}</p>
                <p className="mb-1"><strong>Passport:</strong> {selectedPax.passport_no}</p>
                <p className="mb-0"><strong>Status:</strong> {selectedPax.status.replace("_", " ").toUpperCase()}</p>
              </div>
              <Alert variant="info" className="mt-3">
                <AlertCircle size={18} className="me-2" />
                Verify the passenger has exited KSA based on system records or manual verification.
              </Alert>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowVerifyModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={() => confirmVerifyExit(false)}>
            <XCircle size={18} className="me-2" />
            Reject & Notify Agent
          </Button>
          <Button variant="success" onClick={() => confirmVerifyExit(true)}>
            <CheckCircle size={18} className="me-2" />
            Confirm Exit
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default PaxMovementTracking;
