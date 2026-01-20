import { ArrowBigLeft, ArrowLeft, ChevronLeft, ChevronRight, Search } from "lucide-react";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import ReactDOM from "react-dom";
import {
  Routes,
  Route,
  useNavigate,
  useParams,
  NavLink,
  useLocation,
  Link,
} from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import axios from "axios";
import { Dropdown } from 'react-bootstrap';
import { Funnel, Gear } from 'react-bootstrap-icons';
import TicketTravelBookingInvoice from './TicketOrderList';
import HotelVoucherInterfaceNew from '../../components/HotelVoucherNew';
import RejectNoteModal from '../../components/RejectNoteModal';



const TravelBookingInvoice = ({ isModal = false, orderNoProp = null }) => {
  const [showRejectNote, setShowRejectNote] = useState(false);
  const [rejectNote, setRejectNote] = useState('');
  const [showVisaInterface, setShowVisaInterface] = useState(false);
  const [bookingData, setBookingData] = useState(null);
  const [agencyData, setAgencyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const { orderNo: orderNoParam } = useParams();

  // Use prop if provided, otherwise use URL param
  const orderNo = orderNoProp || orderNoParam;

  // Fetch booking data
  useEffect(() => {
    const fetchBookingData = async () => {
      try {
        setLoading(true);
        const orgData = JSON.parse(localStorage.getItem("selectedOrganization"));
        const organizationId = orgData?.id;
        const token = localStorage.getItem("accessToken");

        let booking = null;

        // Try fetching from agent bookings API first
        try {
          console.log("🔍 Trying agent bookings API...");
          const response = await fetch(
            `http://127.0.0.1:8000/api/bookings/?booking_number=${orderNo}`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            }
          });

          if (response.ok) {
            const data = await response.json();
            console.log("📦 Agent API Response:", data);
            booking = Array.isArray(data)
              ? data.find(b => b.booking_number === orderNo)
              : data.results?.find(b => b.booking_number === orderNo);

            if (booking) {
              console.log("✅ Found in agent bookings!");
            }
          }
        } catch (err) {
          console.log("❌ Error fetching from agent API:", err);
        }

        // If not found in agent bookings, try public bookings API
        if (!booking) {
          try {
            console.log("🔍 Trying public bookings API...");
            const publicResponse = await fetch(
              `http://127.0.0.1:8000/api/admin/public-bookings/?organization=${organizationId}&booking_number=${orderNo}`, {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              }
            });

            if (publicResponse.ok) {
              const publicData = await publicResponse.json();
              console.log("📦 Public API Response:", publicData);

              const dataArray = Array.isArray(publicData)
                ? publicData
                : (publicData.results || []);

              booking = dataArray.find(b => b.booking_number === orderNo);

              if (booking) {
                console.log("✅ Found in public bookings!");
              }
            }
          } catch (err) {
            console.log("❌ Error fetching from public API:", err);
          }
        }

        if (!booking) {
          console.log("❌ Booking not found in either API");
          throw new Error("Booking not found");
        }

        console.log("✅ Final booking data:", booking);
        setBookingData(booking);

        // Now fetch agency data
        if (booking.agency) {
          // Extract agency ID - it might be an object or just an ID
          const agencyId = typeof booking.agency === 'object' ? booking.agency.id : booking.agency;
          console.log("🏢 Fetching agency for ID:", agencyId);

          const agencyResponse = await fetch(
            `http://127.0.0.1:8000/api/agencies/?organization_id=${organizationId}&id=${agencyId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            }
          }
          );

          if (agencyResponse.ok) {
            const agencyDataResponse = await agencyResponse.json();
            console.log("📋 Agency API Response:", agencyDataResponse);
            // Find the agency that matches the agency ID
            const agency = agencyDataResponse.results?.find(a => a.id === agencyId)
              || agencyDataResponse.find(a => a.id === agencyId)
              || null;
            console.log("✅ Found Agency:", agency);
            setAgencyData(agency);
          } else {
            console.error("❌ Agency API failed:", agencyResponse.status);
          }
        }
      } catch (err) {
        setError(err.message);
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBookingData();
  }, [orderNo]);

  const handleConfirmOrder = async () => {
    try {
      const orgData = JSON.parse(localStorage.getItem("selectedOrganization"));
      const organizationId = orgData?.id;
      const token = localStorage.getItem("accessToken");

      // Determine which API to use based on booking type
      const isPublicBooking = bookingData.booking_type === "Public Umrah Package" || bookingData.is_public_booking;

      let response;
      if (isPublicBooking) {
        // Use dedicated approve action for public bookings
        console.log('Approving public booking:', bookingData.booking_number);
        response = await axios.post(
          `http://127.0.0.1:8000/api/admin/public-bookings/${bookingData.id}/approve/`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );
      } else {
        // Use PATCH for agent bookings
        console.log('Approving agent booking:', bookingData.booking_number);
        response = await axios.patch(
          `http://127.0.0.1:8000/api/bookings/${bookingData.id}/`,
          {
            status: 'Approved',
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );
      }

      if (response.status === 200) {
        // Update local state to reflect the change
        setBookingData({ ...bookingData, status: 'Approved' });
        alert('Order approved successfully!');
        // Navigate to visa management page
        navigate(`/order-delivery/visa/${bookingData.booking_number}`);
      } else {
        throw new Error('Failed to approve order');
      }
    } catch (err) {
      console.error('Error approving order:', err);
      alert('Error approving order. Please try again.');
    }
  };

  // Handle rejecting an order with notes
  const handleRejectOrder = async () => {
    if (!rejectNote.trim()) {
      alert('Please enter a rejection note');
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");
      const userData = JSON.parse(localStorage.getItem("user"));
      const adminUserId = userData?.id;

      // Determine which API to use based on booking type
      const isPublicBooking = bookingData.booking_type === "Public Umrah Package" || bookingData.is_public_booking;

      let response;
      if (isPublicBooking) {
        // Use dedicated reject action for public bookings
        console.log('Rejecting public booking:', bookingData.booking_number);
        response = await axios.patch(
          `http://127.0.0.1:8000/api/admin/public-bookings/${bookingData.id}/`,
          {
            status: 'Rejected',
            rejected_notes: rejectNote,
            rejected_at: new Date().toISOString(),
            rejected_employer: adminUserId,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );
      } else {
        // Use PATCH for agent bookings
        console.log('Rejecting agent booking:', bookingData.booking_number);
        response = await axios.patch(
          `http://127.0.0.1:8000/api/bookings/${bookingData.id}/`,
          {
            status: 'Rejected',
            rejected_notes: rejectNote,
            rejected_at: new Date().toISOString(),
            rejected_employer: adminUserId,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );
      }

      if (response.status === 200) {
        // Update local state to reflect the change
        setBookingData({
          ...bookingData,
          status: 'Rejected',
          rejected_notes: rejectNote,
          rejected_at: new Date().toISOString(),
          rejected_employer: adminUserId,
        });
        setShowRejectNote(false);
        setRejectNote('');
        alert('Order rejected successfully!');
        // Navigate back to order list
        navigate('/order-delivery');
      } else {
        throw new Error('Failed to reject order');
      }
    } catch (err) {
      console.error('Error rejecting order:', err);
      alert('Error rejecting order. Please try again.');
    }
  };

  // Stable modal handlers to prevent re-renders
  const handleCloseModal = useCallback(() => {
    setShowRejectNote(false);
    setRejectNote('');
  }, []);

  const handleRejectNoteChange = useCallback((value) => {
    setRejectNote(value);
  }, []);

  // Render Visa Interface if needed
  // if (showVisaInterface) {
  //   return (
  //     <VisaApplicationInterface
  //       onClose={() => setShowVisaInterface(false)}
  //       orderNo={orderNo}
  //     />
  //   );
  // }

  if (bookingData && bookingData.status === "under-process") {
    return (
      <VisaApplicationInterface
        onClose={() => navigate("/order-delivery")}
        orderNo={orderNo}
      />
    );
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "50vh" }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger m-4" role="alert">
        <h4 className="alert-heading">Error Loading Data</h4>
        <p>{error}</p>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>
          Try Again
        </button>
      </div>
    );
  }

  if (!bookingData) {
    return (
      <div className="alert alert-warning m-4" role="alert">
        <h4 className="alert-heading">Booking Not Found</h4>
        <p>No booking found with number: {orderNo}</p>
        <button className="btn btn-secondary" onClick={() => navigate("/order-delivery")}>
          Go Back
        </button>
      </div>
    );
  }

  // Helper functions to extract data
  const getAgencyName = () => {
    return agencyData?.ageny_name || agencyData?.name || "N/A";
  };

  const getAgencyCode = () => {
    return agencyData?.agency_code || "N/A";
  };

  const getContactInfo = () => {
    if (agencyData?.contacts?.length > 0) {
      return agencyData.contacts[0].phone_number;
    }
    return agencyData?.phone_number || "N/A";
  };

  const getAgentName = () => {
    // if (agencyData?.contacts?.length > 0) {
    //   return agencyData.contacts[0].name;
    // }
    // return "N/A";
    return agencyData?.name || "N/A";
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      "un-approved": "primary",
      "approved": "success",
      "rejected": "danger",
      "pending": "warning",
      "confirmed": "info"
    };

    const color = statusColors[status] || "secondary";
    return `<span class="badge bg-${color}">${status}</span>`;
  };

  const calculateTotalNights = () => {
    if (!bookingData.hotel_details) return 0;
    return bookingData.hotel_details.reduce((total, hotel) => total + hotel.number_of_nights, 0);
  };

  const calculateTotalHotelAmount = () => {
    if (!bookingData.hotel_details) return 0;
    return bookingData.hotel_details.reduce((total, hotel) => total + hotel.total_price, 0);
  };

  const getPassengerTypeCount = (type) => {
    if (!bookingData.person_details) return 0;
    return bookingData.person_details.filter(person => person.age_group === type).length;
  };



  return (
    <div className="container-fluid py-4">
      <style>{`
        /* Remove table hover effects */
        .table tbody tr:hover,
        .table tbody tr:hover td,
        .table tbody tr:hover th,
        .table-hover tbody tr:hover,
        .table > tbody > tr:hover,
        .table > tbody > tr:hover > td,
        .table > tbody > tr:hover > th {
          background-color: transparent !important;
          --bs-table-hover-bg: transparent !important;
          --bs-table-accent-bg: transparent !important;
          box-shadow: none !important;
          transform: none !important;
          transition: none !important;
        }
        .table tbody tr {
          box-shadow: none !important;
          transform: none !important;
          transition: none !important;
        }

        /* Invoice Print Styles */
        .section-title {
          font-size: 13px;
          margin: 20px 0 12px;
          color: #222;
          font-weight: 600;
        }
        .invoice-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 6px;
          font-size: 13px;
        }
        .invoice-table th {
          font-weight: 600;
          text-align: left;
          padding: 10px 6px;
          color: #7a7a7a;
          border-bottom: 1px solid #e9e9e9;
        }
        .invoice-table td {
          padding: 10px 6px;
          border-bottom: 1px solid #f6f6f6;
          color: #444;
        }
        .section-divider {
          height: 1px;
          background: #efefef;
          margin: 12px 0;
        }
      `}</style>
      <div className="card shadow-sm">
        <div className="card-body">
          {/* Header Section */}
          {/* Header Section - Hidden in Modal */}
          {!isModal && (
            <div className="row mb-4">
              <div className="col-md-9">
                <div className="mb-3">
                  <ArrowBigLeft
                    size={"30px"}
                    onClick={() => navigate("/order-delivery")}
                    className="cursor-pointer mb-2"
                  />
                  <label className="me-2 form-label small text-muted">
                    Order Number (VOUCHER NO)
                  </label>
                  <h4 className="text-primary">{orderNo}</h4>

                  <div className="d-flex flex-wrap mt-3">
                    <div className="me-4 mb-2">
                      <div className="fw-bold">Agent Name:</div>
                      <div>{getAgentName()}</div>
                    </div>
                    <div className="me-4 mb-2">
                      <div className="fw-bold">Agency Name:</div>
                      <div>{getAgencyName()}</div>
                    </div>
                    <div className="me-4 mb-2">
                      <div className="fw-bold">Contact:</div>
                      <div>{getContactInfo()}</div>
                    </div>
                    <div className="mb-2">
                      <button className="btn btn-primary ms-2">Print</button>
                      <button className="btn btn-outline-primary ms-2">
                        Download
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="d-flex flex-column gap-2">
                  {/* Visa */}
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="small fw-bold">Visa:</span>
                    <div className={`badge ${bookingData.total_visa_amount_pkr > 0 ? 'bg-info' : 'bg-secondary'}`}>
                      {bookingData.total_visa_amount_pkr > 0 ? 'Included' : 'N/A'}
                    </div>
                  </div>

                  {/* Accommodation */}
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="small fw-bold">Accommodation:</span>
                    <div className={`badge ${bookingData.total_hotel_amount_pkr > 0 ? 'bg-info' : 'bg-secondary'}`}>
                      {bookingData.total_hotel_amount_pkr > 0 ? 'Included' : 'N/A'}
                    </div>
                  </div>

                  {/* Transport */}
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="small fw-bold">Transport:</span>
                    <div className={`badge ${bookingData.total_transport_amount_pkr > 0 ? 'bg-info' : 'bg-secondary'}`}>
                      {bookingData.total_transport_amount_pkr > 0 ? 'Included' : 'N/A'}
                    </div>
                  </div>

                  {/* Tickets */}
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="small fw-bold">Tickets:</span>
                    <div className={`badge ${bookingData.total_ticket_amount_pkr > 0 ? 'bg-info' : 'bg-secondary'}`}>
                      {bookingData.total_ticket_amount_pkr > 0 ? 'Included' : 'N/A'}
                    </div>
                  </div>

                  {/* Food */}
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="small fw-bold">Food:</span>
                    <div className={`badge ${bookingData.total_food_amount_pkr > 0 ? 'bg-info' : 'bg-secondary'}`}>
                      {bookingData.total_food_amount_pkr > 0 ? 'Included' : 'N/A'}
                    </div>
                  </div>

                  {/* Ziarat */}
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="small fw-bold">Ziarat:</span>
                    <div className={`badge ${bookingData.total_ziyarat_amount_pkr > 0 ? 'bg-info' : 'bg-secondary'}`}>
                      {bookingData.total_ziyarat_amount_pkr > 0 ? 'Included' : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Order Summary */}
          <div className="table-responsive mb-4">
            <table className="table table-sm text-center">
              <thead className="table-light">
                {bookingData.is_public_booking ? (
                  // Public Booking Header
                  <tr>
                    <th className="fw-normal">Order No</th>
                    <th className="fw-normal">Total Pax</th>
                    <th className="fw-normal">Status</th>
                    <th className="fw-normal">Name</th>
                    <th className="fw-normal">Email</th>
                    <th className="fw-normal">Phone</th>
                  </tr>
                ) : (
                  // Agent Booking Header (Original)
                  <tr>
                    <th className="fw-normal">Order No</th>
                    <th className="fw-normal">Agency Code</th>
                    <th className="fw-normal">Credit Remaining</th>
                    <th className="fw-normal">Credit Days</th>
                    <th className="fw-normal">Agreement Status</th>
                    <th className="fw-normal">Package No</th>
                    <th className="fw-normal">Total Pax</th>
                    <th className="fw-normal">Balance</th>
                    <th className="fw-normal">Status</th>
                  </tr>
                )}
              </thead>
              <tbody>
                {bookingData.is_public_booking ? (
                  // Public Booking Row
                  <tr>
                    <td>{orderNo}</td>
                    <td>{bookingData.total_pax}</td>
                    <td dangerouslySetInnerHTML={{ __html: getStatusBadge(bookingData.status) }}></td>
                    <td>{bookingData.contact_information?.[0]?.name || 'N/A'}</td>
                    <td>{bookingData.contact_information?.[0]?.email || 'N/A'}</td>
                    <td>{bookingData.contact_information?.[0]?.phone || 'N/A'}</td>
                  </tr>
                ) : (
                  // Agent Booking Row (Original)
                  <tr>
                    <td>{orderNo}</td>
                    <td>{getAgencyCode()}</td>
                    <td>
                      {agencyData ? (
                        <span className="text-success fw-bold">
                          PKR {((parseFloat(agencyData.credit_limit || 0) - parseFloat(agencyData.credit_used || 0))).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      ) : 'N/A'}
                    </td>
                    <td>
                      {agencyData?.credit_limit_days ? (
                        <span className="badge bg-info">
                          {agencyData.credit_limit_days} Days
                        </span>
                      ) : 'N/A'}
                    </td>
                    <td>{agencyData?.agreement_status ? "Active" : "Inactive"}</td>
                    <td>N/A</td>
                    <td>{bookingData.total_pax}</td>
                    <td>PKR {bookingData.remaining_amount || 0}</td>
                    <td dangerouslySetInnerHTML={{ __html: getStatusBadge(bookingData.status) }}></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Payment Summary - Only show for public bookings */}
          {bookingData.is_public_booking && (
            <div className="mb-4">
              <h6 className="fw-bold mb-2">Payment Summary</h6>
              <div className="table-responsive">
                <table className="table table-sm text-center">
                  <thead className="table-light">
                    <tr>
                      <th className="fw-normal">Total Payment</th>
                      <th className="fw-normal">Received Payment</th>
                      <th className="fw-normal">Remaining Payment</th>
                      <th className="fw-normal">Payment Method</th>
                      <th className="fw-normal">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>PKR {bookingData.total_amount || 0}</td>
                      <td>PKR {(bookingData.total_amount || 0) - (bookingData.remaining_amount || 0)}</td>
                      <td>PKR {bookingData.remaining_amount || 0}</td>
                      <td>
                        {bookingData.payments && bookingData.payments.length > 0
                          ? bookingData.payments[0].payment_method || 'N/A'
                          : 'N/A'}
                      </td>
                      <td>
                        <button className="btn btn-sm btn-primary">
                          Add Payment
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Booking Overview */}
          <h6 className="fw-bold mb-3">Booking Overview</h6>

          {/* Pax Information */}
          <h5 className="section-title">Pax Information</h5>
          <table className="invoice-table">
            <thead>
              <tr>
                <th>Passenger Name</th>
                <th>Passport No</th>
                <th>PAX</th>
                <th>DOB</th>
                <th>Total Pax</th>
              </tr>
            </thead>
            <tbody>
              {bookingData.person_details && bookingData.person_details.length > 0 ? (
                bookingData.person_details.map((person, index) => (
                  <tr key={index}>
                    <td>{`${person.first_name} ${person.last_name}`}</td>
                    <td>{person.passport_number || "N/A"}</td>
                    <td>{person.age_group || "Adult"}</td>
                    <td>{person.date_of_birth ? new Date(person.date_of_birth).toLocaleDateString() : "N/A"}</td>
                    <td>{index === 0 ? `${bookingData.total_adult} Adult & ${bookingData.total_child} Child` : ""}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center">No passenger data available</td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="section-divider" />

          {/* Accommodation */}
          {bookingData.hotel_details && bookingData.hotel_details.length > 0 && (
            <>
              <h5 className="section-title">Accommodation</h5>
              <table className="invoice-table">
                <thead>
                  <tr>
                    <th>Hotel Name</th>
                    <th>Check-in</th>
                    <th>Check-Out</th>
                    <th>Nights</th>
                    <th>Type</th>
                    <th>QTY</th>
                    <th>Rate</th>
                    <th>Net</th>
                  </tr>
                </thead>
                <tbody>
                  {bookingData.hotel_details.map((hotel, index) => (
                    <tr key={index}>
                      <td>{hotel.hotel_name || hotel.name || `Hotel ${index + 1}`}</td>
                      <td>{hotel.check_in_date || hotel.check_in_time ? new Date(hotel.check_in_date || hotel.check_in_time).toLocaleDateString() : "N/A"}</td>
                      <td>{hotel.check_out_date || hotel.check_out_time ? new Date(hotel.check_out_date || hotel.check_out_time).toLocaleDateString() : "N/A"}</td>
                      <td>{hotel.number_of_nights}</td>
                      <td>{hotel.room_type_name || hotel.room_type || "N/A"}</td>
                      <td>{hotel.quantity || 1}</td>
                      <td>{hotel.is_price_pkr ? `PKR ${hotel.price}` : `SAR ${hotel.price}`}</td>
                      <td>{hotel.is_price_pkr ? `PKR ${hotel.total_price}` : `SAR ${hotel.total_price}`}</td>
                    </tr>
                  ))}
                  <tr className="fw-bold">
                    <td colSpan="3">Total Accommodation</td>
                    <td>{calculateTotalNights()}</td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td>SAR {calculateTotalHotelAmount()}</td>
                  </tr>
                </tbody>
              </table>

              <div className="section-divider" />
            </>
          )}

          {/* Transportation */}
          {bookingData.transport_details && bookingData.transport_details.length > 0 && (
            <>
              <h5 className="section-title">Transportation</h5>
              <table className="invoice-table">
                <thead>
                  <tr>
                    <th>Vehicle type</th>
                    <th>Route</th>
                    <th>Rate</th>
                    <th>QTY</th>
                    <th>Net</th>
                  </tr>
                </thead>
                <tbody>
                  {bookingData.transport_details.map((transport, index) => {
                    // Build route string from sector_details
                    const buildRoute = () => {
                      if (!transport.sector_details || transport.sector_details.length === 0) {
                        return "Route Information";
                      }

                      // Check if it's a round trip by seeing if first and last locations match
                      const firstSector = transport.sector_details[0];
                      const lastSector = transport.sector_details[transport.sector_details.length - 1];
                      const isRoundTrip = transport.sector_details.length > 1 &&
                        firstSector.departure_city === lastSector.arrival_city;

                      // Build route string with sector types
                      const routeParts = [];
                      transport.sector_details.forEach((sector, idx) => {
                        if (idx === 0) {
                          // First sector - add departure city with type
                          const departureType = sector.is_airport_pickup ? '(A)' : '(H)';
                          routeParts.push(`${sector.departure_city}${departureType}`);
                        }
                        // Add arrival city with type
                        const arrivalType = sector.is_airport_drop ? '(A)' : '(H)';
                        routeParts.push(`${sector.arrival_city}${arrivalType}`);
                      });

                      const routeString = routeParts.join('-');
                      return isRoundTrip ? `R/T - ${routeString}` : routeString;
                    };

                    return (
                      <tr key={index}>
                        <td>{transport.vehicle_type_display || "N/A"}</td>
                        <td>{buildRoute()}</td>
                        <td>SAR {transport.price_in_sar || 0}</td>
                        <td>1</td>
                        <td>SAR {transport.price_in_sar || 0}</td>
                      </tr>
                    );
                  })}
                  <tr className="fw-bold">
                    <td colSpan="4">Total Transportation</td>
                    <td>SAR {bookingData.total_transport_amount_sar || 0}</td>
                  </tr>
                </tbody>
              </table>

              <div className="section-divider" />
            </>
          )}

          {/* Food Services */}
          {bookingData.food_details && bookingData.food_details.length > 0 && (
            <>
              <h5 className="section-title">Food Services</h5>
              <table className="invoice-table">
                <thead>
                  <tr>
                    <th>Adult Rate × Qty</th>
                    <th>Child Rate × Qty</th>
                    <th>Infant Rate × Qty</th>
                    <th>Net</th>
                  </tr>
                </thead>
                <tbody>
                  {bookingData.food_details.map((food, index) => (
                    <tr key={index}>
                      <td>SAR {food.adult_price} × {food.total_adults}</td>
                      <td>SAR {food.child_price} × {food.total_children}</td>
                      <td>SAR {food.infant_price} × {food.total_infants}</td>
                      <td>SAR {food.total_price_sar || (food.total_price_pkr / 50).toFixed(0) || 0}</td>
                    </tr>
                  ))}
                  <tr className="fw-bold">
                    <td colSpan="3">Total Food Services</td>
                    <td>SAR {bookingData.total_food_amount_sar || (bookingData.total_food_amount_pkr / 50).toFixed(0) || 0}</td>
                  </tr>
                </tbody>
              </table>

              <div className="section-divider" />
            </>
          )}

          {/* Ziarat Services */}
          {bookingData.ziyarat_details && bookingData.ziyarat_details.length > 0 && (
            <>
              <h5 className="section-title">Ziarat Services</h5>
              <table className="invoice-table">
                <thead>
                  <tr>
                    <th>Adult Rate × Qty</th>
                    <th>Child Rate × Qty</th>
                    <th>Infant Rate × Qty</th>
                    <th>Net</th>
                  </tr>
                </thead>
                <tbody>
                  {bookingData.ziyarat_details.map((ziarat, index) => (
                    <tr key={index}>
                      <td>SAR {ziarat.adult_price} × {ziarat.total_adults}</td>
                      <td>SAR {ziarat.child_price} × {ziarat.total_children}</td>
                      <td>SAR {ziarat.infant_price} × {ziarat.total_infants}</td>
                      <td>SAR {ziarat.total_price_sar || (ziarat.total_price_pkr / 50).toFixed(0) || 0}</td>
                    </tr>
                  ))}
                  <tr className="fw-bold">
                    <td colSpan="3">Total Ziarat Services</td>
                    <td>SAR {bookingData.total_ziyarat_amount_sar || (bookingData.total_ziyarat_amount_pkr / 50).toFixed(0) || 0}</td>
                  </tr>
                </tbody>
              </table>

              <div className="section-divider" />
            </>
          )}

          {/* Umrah Visa & Tickets Rates Details */}
          <div className="row">
            <div className="col-md-6">
              <h6 className="fw-bold mb-3 mt-5">
                Umrah Visa & Tickets Rates Details
              </h6>
              <div className="table-responsive mb-4">
                <table className="table table-sm">
                  <thead className="table-light">
                    <tr>
                      <th>Pax</th>
                      <th>Total Pax</th>
                      <th>Visa Rate</th>
                      <th>Ticket Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Adult</td>
                      <td>{getPassengerTypeCount("Adult")}</td>
                      <td>
                        SAR {bookingData.total_visa_amount || 0}
                      </td>
                      <td>
                        PKR{" "}
                        {getPassengerTypeCount("Adult") *
                          (bookingData?.ticket_details?.[0]?.adult_price || 0)}
                      </td>
                    </tr>
                    <tr>
                      <td>Child</td>
                      <td>{getPassengerTypeCount("Child")}</td>
                      <td>
                        SAR {bookingData.total_visa_amount || 0}
                      </td>
                      <td>
                        PKR{" "}
                        {getPassengerTypeCount("Child") *
                          (bookingData?.ticket_details?.[0]?.child_price || 0)}
                      </td>
                    </tr>
                    <tr>
                      <td>Infant</td>
                      <td>{getPassengerTypeCount("Infant")}</td>
                      <td>
                        SAR {bookingData.total_visa_amount || 0}
                      </td>
                      <td>
                        PKR{" "}
                        {getPassengerTypeCount("Infant") *
                          (bookingData?.ticket_details?.[0]?.infant_price || 0)}
                      </td>
                    </tr>
                    <tr>
                      <td>Total</td>
                      <td>{bookingData.total_pax}</td>
                      <td>SAR {bookingData.total_visa_amount || 0}</td>
                      <td>PKR {bookingData.total_ticket_amount || 0}</td>
                    </tr>
                  </tbody>

                </table>
              </div>
            </div>
          </div>

          {/* Invoice Details */}
          <h6 className="fw-bold mb-3 mt-5">Invoice Details</h6>
          <div className="row">
            {/* Left Column */}
            <div className="col-lg-8 col-md-7 col-12 mb-3">
              <div className="mb-2">
                <span>Booking Date: </span>
                <span className="fw-bold">{bookingData.date ? new Date(bookingData.date).toLocaleDateString() : "N/A"}</span>
                <span className="ms-4 d-block d-sm-inline">
                  Family Head:{" "}
                  <span className="fw-bold">
                    {bookingData.person_details?.find(p => p.is_family_head)?.first_name || "N/A"}
                  </span>
                </span>
              </div>
              <div className="mb-2">
                <span>Booking#: </span>
                <span className="fw-bold">{orderNo}</span>
                <span className="ms-4 d-block d-sm-inline">
                  Travel Date:{" "}
                  <span className="fw-bold">
                    {bookingData.ticket_details?.[0]?.trip_details?.[0]?.departure_date_time
                      ? new Date(bookingData.ticket_details[0].trip_details[0].departure_date_time).toLocaleString()
                      : "N/A"}
                  </span>
                </span>
              </div>
              <div className="mb-2">
                <span>Invoice Date: </span>
                <span className="fw-bold">{new Date().toLocaleDateString()}</span>
                <span className="ms-4 d-block d-sm-inline">
                  Return Date:{" "}
                  <span className="fw-bold">
                    {bookingData.ticket_details?.[0]?.trip_details?.[1]?.departure_date_time
                      ? new Date(bookingData.ticket_details[0].trip_details[1].departure_date_time).toLocaleString()
                      : "N/A"}
                  </span>
                </span>
              </div>
            </div>

            {/* Right Column */}
            <div className="col-lg-4 col-md-5 col-12">
              <div className="card h-100">
                <div className="card-body p-3">
                  <div className="d-flex justify-content-between mb-2">
                    <span>Total Pax:</span>
                    <strong>{bookingData.total_pax}</strong>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Visa Rate:</span>
                    <strong>PKR {bookingData.total_visa_amount_pkr || 0}</strong>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Tickets:</span>
                    <strong>PKR {bookingData.total_ticket_amount_pkr || 0}</strong>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Hotel:</span>
                    <strong>PKR {bookingData.total_hotel_amount_pkr || 0}</strong>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Transport:</span>
                    <strong>PKR {bookingData.total_transport_amount_pkr || 0}</strong>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Food:</span>
                    <strong>PKR {bookingData.total_food_amount_pkr || 0}</strong>
                  </div>
                  <div className="d-flex justify-content-between mb-3">
                    <span>Ziarat:</span>
                    <strong>PKR {bookingData.total_ziyarat_amount_pkr || 0}</strong>
                  </div>
                  <hr />
                  <div
                    className="d-flex justify-content-between align-items-center py-2 px-3 text-white rounded-3"
                    style={{ background: "#1B78CE" }}
                  >
                    <span>
                      <strong>Net PKR:</strong>
                    </span>
                    <strong>PKR {bookingData.total_amount || 0}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Availability Section - Hidden in Modal */}
          {!isModal && (
            <>
              <h6 className="fw-bold">
                Ticket Availability:{" "}
                <span className="fw-bold" style={{ color: "#8BD399" }}>
                  Available
                </span>
              </h6>
              <h6 className="fw-bold">
                Hotel Availability:{" "}
                <span className="fw-bold" style={{ color: "#8BD399" }}>
                  Available
                </span>
              </h6>

              {/* Action Buttons - Hidden in Modal */}
              <div className="d-flex flex-wrap gap-2 mt-5">
                <button
                  className="btn btn-primary"
                  onClick={handleConfirmOrder}
                >
                  Approve
                </button>

                <button
                  className="btn btn-outline-danger"
                  onClick={() => setShowRejectNote(true)}
                >
                  Reject With Note
                </button>

                <button
                  className="btn btn-outline-secondary"
                  onClick={() => navigate("/order-delivery")}
                >
                  Close
                </button>
              </div>
            </>
          )}

          {/* Reject Note Modal */}
          <RejectNoteModal
            isOpen={showRejectNote}
            onClose={() => setShowRejectNote(false)}
            onReject={async (note) => {
              // Set the note first
              setRejectNote(note);
              // Then call reject with the note
              try {
                const token = localStorage.getItem("accessToken");
                const userData = JSON.parse(localStorage.getItem("user"));
                const adminUserId = userData?.id;

                const isPublicBooking = bookingData.booking_type === "Public Umrah Package" || bookingData.is_public_booking;

                let response;
                if (isPublicBooking) {
                  response = await axios.patch(
                    `http://127.0.0.1:8000/api/admin/public-bookings/${bookingData.id}/`,
                    {
                      status: 'Rejected',
                      rejected_notes: note,
                      rejected_at: new Date().toISOString(),
                      rejected_employer: adminUserId,
                    },
                    {
                      headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                      },
                    }
                  );
                } else {
                  response = await axios.patch(
                    `http://127.0.0.1:8000/api/bookings/${bookingData.id}/`,
                    {
                      status: 'Rejected',
                      rejected_notes: note,
                      rejected_at: new Date().toISOString(),
                      rejected_employer: adminUserId,
                    },
                    {
                      headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                      },
                    }
                  );
                }

                if (response.status === 200) {
                  setBookingData({
                    ...bookingData,
                    status: 'Rejected',
                    rejected_notes: note,
                    rejected_at: new Date().toISOString(),
                    rejected_employer: adminUserId,
                  });
                  setShowRejectNote(false);
                  setRejectNote('');
                  alert('Order rejected successfully!');
                  navigate('/order-delivery');
                }
              } catch (err) {
                console.error('Error rejecting order:', err);
                alert('Error rejecting order. Please try again.');
              }
            }}
            bookingData={bookingData}
          />
        </div>
      </div>
    </div >
  );
};

// OLD HOTEL VOUCHER COMPONENT - REPLACED WITH HotelVoucherInterfaceNew


const TicketsInterface = ({ orderNo }) => {
  const [showRejectNote, setShowRejectNote] = useState(false);
  const [showChild, setShowChild] = useState(false);
  const [bookingData, setBookingData] = useState(null);
  const [agencyData, setAgencyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch booking data
        const bookingResponse = await fetch(`http://127.0.0.1:8000/api/bookings/?organization_id&booking_number=${orderNo}`);
        if (!bookingResponse.ok) {
          throw new Error('Failed to fetch booking data');
        }
        const bookingData = await bookingResponse.json();

        // Assuming the API returns an array, take the first item that matches our order number
        const booking = Array.isArray(bookingData)
          ? bookingData.find(item => item.booking_number === orderNo)
          : bookingData;

        setBookingData(booking);

        if (booking && booking.agency) {
          // Fetch agency data
          const agencyResponse = await fetch(`http://127.0.0.1:8000/api/agencies/?organization_id&id=${booking.agency}`);
          if (!agencyResponse.ok) {
            throw new Error('Failed to fetch agency data');
          }
          const agencyData = await agencyResponse.json();

          // Assuming the API returns an array, find the matching agency
          const agency = Array.isArray(agencyData)
            ? agencyData.find(item => item.id === booking.agency)
            : agencyData;

          setAgencyData(agency);
        }
      } catch (err) {
        setError(err.message);
        console.error('API Error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (orderNo) {
      fetchData();
    }
  }, [orderNo]);

  if (loading) {
    return <div className="text-center p-4">Loading booking data...</div>;
  }

  if (error) {
    return <div className="text-center p-4 text-danger">Error: {error}</div>;
  }

  if (!bookingData) {
    return <div className="text-center p-4">No booking data found for order #{orderNo}</div>;
  }

  // Extract ticket details if available
  const ticketDetails = bookingData.ticket_details && bookingData.ticket_details.length > 0
    ? bookingData.ticket_details[0]
    : null;

  // Extract trip details if available
  const tripDetails = ticketDetails && ticketDetails.trip_details && ticketDetails.trip_details.length > 0
    ? ticketDetails.trip_details[0]
    : null;

  // Extract stopover details if available
  const stopoverDetails = ticketDetails && ticketDetails.stopover_details && ticketDetails.stopover_details.length > 0
    ? ticketDetails.stopover_details[0]
    : null;

  // Format date and time functions
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return isNaN(date) ? 'Invalid Date' : date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch (e) {
      return 'Invalid Date';
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return isNaN(date) ? 'Invalid Time' : date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return 'Invalid Time';
    }
  };

  // Calculate fare based on age group
  const getFareForPerson = (person) => {
    if (!ticketDetails) return 'N/A';

    if (person.age_group === 'adult') {
      return ticketDetails.adult_price || 'N/A';
    } else if (person.age_group === 'child') {
      return ticketDetails.child_price || 'N/A';
    } else if (person.age_group === 'infant') {
      return ticketDetails.infant_price || 'N/A';
    }
    return 'N/A';
  };

  return (
    <div className="bg-white p-4">
      <h5 className="fw-bold mb-3">Passengers Details For Tickets</h5>

      {/* Order Summary Table */}
      <div className="table-responsive mb-4">
        <table className="table table-sm text-center">
          <thead className="table-light">
            <tr>
              <th>Order No</th>
              <th>Agency Code</th>
              <th>Agreement Status</th>
              <th>Package No</th>
              <th>Total Pax</th>
              <th>Balance</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{orderNo}</td>
              <td>{agencyData ? agencyData.id : 'N/A'}</td>
              <td>{agencyData ? (agencyData.agreement_status ? 'Active' : 'Inactive') : 'N/A'}</td>
              <td>{bookingData.id}</td>
              <td>{bookingData.total_pax || 0}</td>
              <td>PKR {bookingData.remaining_amount || 0}</td>
              <td>
                <span className="text-info">{bookingData.status || 'N/A'}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Ticket Details */}
      {ticketDetails ? (
        <div className="card mb-4">
          <div className="card-body">
            {/* Departure Header */}
            <div
              className="container p-4 rounded-4"
              style={{ background: "#E5F2FF" }}
            >
              <div className="d-flex justify-content-center align-items-center flex-wrap gap-3 mb-4">
                {/* Flight Route Section */}
                <div className="d-flex align-items-center gap-4 flex-wrap">
                  {/* Departure */}
                  {tripDetails && (
                    <>
                      <div className="text-center">
                        <h5 className="fw-bold">Depart</h5>
                        <h2 className="fw-bold">{formatTime(tripDetails.departure_date_time)}</h2>
                        <p className="mb-1">{formatDate(tripDetails.departure_date_time)}</p>
                        <p className="fw-bold">{tripDetails.departure_city || 'N/A'}</p>
                      </div>

                      {/* Stopover */}
                      {stopoverDetails && (
                        <div className="text-center">
                          <h6 className="mb-0">1st stop at</h6>
                          <p className="fw-bold">{stopoverDetails.stopover_city || 'N/A'}</p>
                        </div>
                      )}

                      {/* Arrival */}
                      <div className="text-center">
                        <h5 className="fw-bold">Arrive</h5>
                        <h2 className="fw-bold">{formatTime(tripDetails.arrival_date_time)}</h2>
                        <p className="mb-1">{formatDate(tripDetails.arrival_date_time)}</p>
                        <p className="fw-bold">{tripDetails.arrival_city || 'N/A'}</p>
                      </div>
                    </>
                  )}
                </div>
                <div
                  className="d-none d-sm-block"
                  style={{
                    borderLeft: "2px dashed rgba(0, 0, 0, 0.3)",
                    height: "140px",
                  }}
                ></div>

                {/* Status and Class Info */}
                <div className="d-flex flex-column flex-md-row gap-5 text-center">
                  <div>
                    <div>
                      <h6 className="fw-bold mb-1">{ticketDetails.status || 'N/A'}</h6>
                      <div className="small">Status</div>
                    </div>
                    <div>
                      <h6 className="fw-bold mb-1">{ticketDetails.trip_type || 'N/A'}</h6>
                      <div className="small">Class</div>
                    </div>
                  </div>
                  <div>
                    <div>
                      <h6 className="fw-bold mb-1">{ticketDetails.pnr || 'N/A'}</h6>
                      <div className="small">PNR</div>
                    </div>
                    <div>
                      <h6 className="fw-bold mb-1">{ticketDetails.weight || 'N/A'} KG</h6>
                      <div className="small">Baggage</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Passenger Details Tables */}
            <div className="mb-4 mt-5">
              <h5 className="fw-bold mb-3">Passenger Details</h5>
              {bookingData.person_details && bookingData.person_details.length > 0 ? (
                bookingData.person_details.map((person, index) => (
                  <div key={person.id || index} className="table-responsive mb-4">
                    <table className="table table-sm">
                      <thead>
                        <tr>
                          <th className="fw-normal">Pax NO</th>
                          <th className="fw-normal">Traveler Name</th>
                          <th className="fw-normal">Agency PNR</th>
                          <th className="fw-normal">Fare</th>
                          <th className="fw-normal">Age Group</th>
                          <th className="fw-normal">Passport No</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="fw-bold">
                            <strong>{(index + 1).toString().padStart(2, "0")}</strong>
                          </td>
                          <td className="fw-bold">{person.first_name || ''} {person.last_name || ''}</td>
                          <td className="fw-bold">{ticketDetails.pnr || 'N/A'}</td>
                          <td className="fw-bold">
                            Rs {getFareForPerson(person)}/-
                          </td>
                          <td className="text-capitalize">{person.age_group || 'N/A'}</td>
                          <td>{person.passport_number || 'N/A'}</td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Additional passenger details */}
                    <div className="mt-2 p-3 bg-light rounded">
                      <div className="row">
                        <div className="col-md-6">
                          <strong>Date of Birth:</strong> {formatDate(person.date_of_birth)}
                        </div>
                        <div className="col-md-6">
                          <strong>Passport Expiry:</strong> {formatDate(person.passport_expiry_date)}
                        </div>
                        <div className="col-md-6 mt-2">
                          <strong>Country:</strong> {person.country || 'N/A'}
                        </div>
                        <div className="col-md-6 mt-2">
                          <strong>Visa Status:</strong> {person.visa_status || 'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="alert alert-warning">
                  No passenger details available for this booking.
                </div>
              )}
            </div>

            {/* Total Balance Section */}
            <div className="row mb-4">
              <div
                className="col-md-6 p-4 rounded-4"
                style={{ background: "#E5F2FF" }}
              >
                <h6 className="fw-bold mb-3">Total Balance</h6>

                <div className="d-flex justify-content-between mb-2">
                  <h6 className="mb-0 fw-bold">Sub Total:</h6>
                  <h6 className="mb-0">Rs {bookingData.total_amount || 0}/-</h6>
                </div>

                <div className="d-flex justify-content-between mb-2">
                  <h6 className="mb-0 fw-bold">Paid:</h6>
                  <h6 className="mb-0 text-primary">
                    Rs {(bookingData.total_amount - bookingData.remaining_amount) || 0}/-
                  </h6>
                </div>

                <div className="d-flex justify-content-between">
                  <h6 className="mb-0 fw-bold">Pending:</h6>
                  <h6 className="mb-0">Rs {bookingData.remaining_amount || 0}/-</h6>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="alert alert-info">
          No ticket details available for this booking.
        </div>
      )}

      {/* Action Buttons */}
      <div className="d-flex flex-wrap gap-2 mb-4">
        <button className="btn btn-primary">Confirm Ticket</button>
        <button
          className="btn btn-primary"
          onClick={() => setShowChild(true)}
        >
          Set Infant And Child Fare
        </button>
        <button className="btn btn-outline-secondary">Remove from order</button>
        <button
          className="btn btn-outline-secondary"
          onClick={() => setShowRejectNote(true)}
        >
          Reject With Note
        </button>
        <button className="btn btn-outline-secondary">Close</button>
      </div>

      {/* Reject Note Modal */}
      {showRejectNote && (
        <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">Add Notes</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowRejectNote(false)}
                ></button>
              </div>

              <div className="modal-body">
                <fieldset className="border rounded p-3 mb-4 bg-light position-relative">
                  <legend className="float-none w-auto px-2 fs-6 fw-bold mb-0">
                    Notes
                  </legend>
                  <div className="text-muted">
                    Call 92 world tour tomorrow and he will pay all the money
                  </div>
                  <div className="mt-2">
                    <strong>Date Reminder</strong>
                    <div className="text-muted">18/01/2025</div>
                  </div>
                  <div className="mt-2">
                    <strong>Employer name</strong>
                    <div className="text-muted">id/name</div>
                  </div>
                </fieldset>

                <fieldset className="border border-secondary p-2 rounded mb-4">
                  <legend className="float-none w-auto px-1 fs-6">
                    Notes
                  </legend>
                  <textarea
                    className="form-control shadow-none"
                    rows={4}
                    placeholder="Enter Notes"
                  ></textarea>
                </fieldset>
              </div>

              <div className="modal-footer">
                <button className="btn btn-primary">Reject Order</button>
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowRejectNote(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Child Modal */}
      {showChild && (
        <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">
                  Child and Infant Fare
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowChild(false)}
                ></button>
              </div>

              <div className="modal-body">
                <fieldset className="border border-secondary p-2 rounded mb-4">
                  <legend className="float-none w-auto px-1 fs-6">
                    Child Fare
                  </legend>
                  <input
                    className="form-control shadow-none"
                    placeholder="Enter Child Fare"
                    defaultValue={ticketDetails?.child_price || ''}
                  />
                </fieldset>
                <fieldset className="border border-secondary p-2 rounded mb-4">
                  <legend className="float-none w-auto px-1 fs-6">
                    Infant Fare
                  </legend>
                  <input
                    className="form-control shadow-none"
                    placeholder="Enter Infant Fare"
                    defaultValue={ticketDetails?.infant_price || ''}
                  />
                </fieldset>
              </div>

              <div className="modal-footer">
                <button className="btn btn-primary">Set</button>
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowChild(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


const VisaApplicationInterface = ({ onClose }) => {
  const { orderNo } = useParams();
  const [activeTab, setActiveTab] = useState("visa");
  const [selectedShirka, setSelectedShirka] = useState("");
  const [selectedPassengers, setSelectedPassengers] = useState([]);
  const [bookingData, setBookingData] = useState(null);
  const [agencyData, setAgencyData] = useState(null);
  const [shirkaList, setShirkaList] = useState([]);
  const [shirkaLoading, setShirkaLoading] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch booking data
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
          console.log('🔍 Trying agent bookings API for visa page...');
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
          console.log("📦 Agent API Response:", bookingResponse.data);

          // API might return an array or a single object
          if (Array.isArray(bookingResponse.data)) {
            booking = bookingResponse.data[0];
          } else if (bookingResponse.data.results) {
            booking = bookingResponse.data.results[0];
          } else {
            booking = bookingResponse.data;
          }

          if (booking) {
            console.log("✅ Found in agent bookings!");
          }
        } catch (err) {
          console.log("❌ Not found in agent bookings, trying public bookings...");
        }

        // If not found in agent bookings, try public bookings API
        if (!booking) {
          try {
            console.log('🔍 Trying public bookings API for visa page...');
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
            console.log("📦 Public API Response:", publicResponse.data);

            const publicData = Array.isArray(publicResponse.data)
              ? publicResponse.data
              : (publicResponse.data?.results || []);

            booking = publicData[0];

            if (booking) {
              console.log("✅ Found in public bookings!");
            }
          } catch (err) {
            console.log("❌ Not found in public bookings either");
          }
        }

        console.log("Matched Booking:", booking);

        if (!booking) {
          throw new Error("Booking not found");
        }

        setBookingData(booking);


        setSelectedPassengers(new Array(booking.person_details?.length || 0).fill(false));

        // Fetch shirka data
        try {
          setShirkaLoading(true);
          const shirkaResponse = await axios.get(
            `http://127.0.0.1:8000/api/shirkas/`,
            {
              params: {
                organization: organizationId,
              },
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );

          // Handle different response formats
          let shirkas = [];
          if (Array.isArray(shirkaResponse.data)) {
            shirkas = shirkaResponse.data;
          } else if (shirkaResponse.data.results) {
            shirkas = shirkaResponse.data.results;
          }

          setShirkaList(shirkas);

          // Set first shirka as default if available
          if (shirkas.length > 0) {
            setSelectedShirka(shirkas[0].id.toString());
          }
        } catch (shirkaError) {
          console.error('Error fetching shirka data:', shirkaError);
          setShirkaList([]);
        } finally {
          setShirkaLoading(false);
        }

        // Fetch agency data
        if (booking.agency) {
          try {
            const agencyResponse = await axios.get(`http://127.0.0.1:8000/api/agencies/?organization=${organizationId}&id=${booking.agency}`, {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              }
            });
            const agency = agencyResponse.data.results?.find(agency => agency.id === booking.agency) || agencyResponse.data[0];
            setAgencyData(agency);
          } catch (agencyError) {
            console.error('Error fetching agency data:', agencyError);
            // Continue without agency data
          }
        }
      } catch (err) {
        setError(err.message);
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [orderNo]);

  const handlePassengerSelection = (index) => {
    const newSelection = [...selectedPassengers];
    newSelection[index] = !newSelection[index];
    setSelectedPassengers(newSelection);
  };

  if (loading) {
    return (
      <div className="container-fluid p-0" style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
        <div className="d-flex justify-content-center align-items-center" style={{ height: "80vh" }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <span className="ms-2">Loading booking data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid p-0" style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
        <div className="alert alert-danger m-4" role="alert">
          <h4 className="alert-heading">Error Loading Data</h4>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!bookingData) {
    return (
      <div className="container-fluid p-0" style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
        <div className="alert alert-warning m-4" role="alert">
          <h4 className="alert-heading">No Data Found</h4>
          <p>No booking data found for order number: {orderNo}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid p-0" style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
      <div className="bg-white shadow-sm p-4">
        {/* Header */}
        <div className="row align-items-center mb-4">
          <div className="col-auto">
            <Link
              to={'/order-delivery'}
              className="btn btn-link p-0 text-dark" >
              <ArrowLeft />
            </Link>
          </div>
          <div className="col">
            <div className="d-flex align-items-center">
              <strong className="text-muted me-2">Order Number</strong>
              <span>({orderNo})</span>
            </div>
          </div>
          <div className="col-auto">
            <div className="row g-2">
              <div className="d-flex flex-column">
                <div className="me-3 fw-bold">Agent Name:</div>
                <div className="">{agencyData?.name || "N/A"}</div>
              </div>
              <div className="d-flex flex-wrap">
                <div className="mt-1 me-3">
                  <div className="me-3 fw-bold">Agency Name:</div>
                  <div className="">{agencyData?.ageny_name || "N/A"}</div>
                </div>
                <div className="mt-1 me-3">
                  <div className="me-3 fw-bold">Contact:</div>
                  <div className="">{agencyData?.phone_number || "N/A"}</div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-auto">
            <div className="d-flex flex-column gap-2">
              {/* Visa */}
              <div className="d-flex justify-content-end align-items-center">
                <span className="small fw-bold">Visa:</span>
                <div
                  className="text-white rounded-5 px-2 py-1"
                  style={{ background: "#43ABFF", minWidth: "100px" }}
                >
                  {(bookingData.total_visa_amount > 0 || bookingData.total_visa_amount_pkr > 0) ? "Included" : "N/A"}
                </div>
              </div>

              {/* Accommodation */}
              <div className="d-flex justify-content-end align-items-center">
                <span className="small fw-bold">Accommodation:</span>
                <div
                  className="text-white rounded-5 px-2 py-1"
                  style={{ background: "#43ABFF", minWidth: "100px" }}
                >
                  {(bookingData.total_hotel_amount > 0 || bookingData.total_hotel_amount_pkr > 0) ? "Included" : "N/A"}
                </div>
              </div>

              {/* Transport */}
              <div className="d-flex justify-content-end align-items-center">
                <span className="small fw-bold">Transport:</span>
                <div
                  className="text-white rounded-5 px-2 py-1"
                  style={{ background: "#43ABFF", minWidth: "100px" }}
                >
                  {(bookingData.total_transport_amount > 0 || bookingData.total_transport_amount_pkr > 0) ? "Included" : "N/A"}
                </div>
              </div>

              {/* Tickets */}
              <div className="d-flex justify-content-end align-items-center">
                <span className="small fw-bold">Tickets:</span>
                <div
                  className="text-white rounded-5 px-2 py-1"
                  style={{ background: "#43ABFF", minWidth: "100px" }}
                >
                  {(bookingData.total_ticket_amount > 0 || bookingData.total_ticket_amount_pkr > 0) ? "Included" : "N/A"}
                </div>
              </div>

              {/* Food */}
              <div className="d-flex justify-content-end align-items-center">
                <span className="small fw-bold">Food:</span>
                <div
                  className="text-white rounded-5 px-2 py-1"
                  style={{ background: "#43ABFF", minWidth: "100px" }}
                >
                  {(bookingData.is_food_included || bookingData.total_food_amount_pkr > 0) ? "Included" : "N/A"}
                </div>
              </div>

              {/* Ziarat */}
              <div className="d-flex justify-content-end align-items-center">
                <span className="small fw-bold">Ziarat:</span>
                <div
                  className="text-white rounded-5 px-2 py-1"
                  style={{ background: "#43ABFF", minWidth: "100px" }}
                >
                  {(bookingData.is_ziyarat_included || bookingData.total_ziyarat_amount_pkr > 0) ? "Included" : "N/A"}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-4 d-flex justify-content-between">
          <div className="d-flex gap-2">
            <button
              className={`btn ${activeTab === "visa" ? "btn-primary" : "btn-outline-secondary"}`}
              onClick={() => setActiveTab("visa")}
            >
              Visa
            </button>
            <button
              className={`btn ${activeTab === "hotel" ? "btn-primary" : "btn-outline-secondary"}`}
              onClick={() => setActiveTab("hotel")}
            >
              Hotel Voucher
            </button>
            <button
              className={`btn ${activeTab === "tickets" ? "btn-primary" : "btn-outline-secondary"}`}
              onClick={() => setActiveTab("tickets")}
            >
              Tickets
            </button>
          </div>
          {/* Action Buttons */}
          <div className="row align-items-center">
            <div className="col-auto">
              <button className="btn btn-primary me-2">Print</button>
              <button className="btn btn-outline-primary me-2">Download</button>
              <button
                className="btn btn-info text-white"
                onClick={() => setShowInvoiceModal(true)}
              >
                See Invoice
              </button>
            </div>
          </div>
        </div>

        {activeTab === "visa" && (
          <>
            {/* Order Summary Table */}
            <div className="table-responsive mb-4">
              <table className="table table-sm text-center">
                <thead className="table-light">
                  {bookingData.is_public_booking ? (
                    // Public Booking Header
                    <tr>
                      <th>Order No</th>
                      <th>Total Pax</th>
                      <th>Status</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                    </tr>
                  ) : (
                    // Agent Booking Header (Original)
                    <tr>
                      <th>Order No</th>
                      <th>Agency Code</th>
                      <th>Agreement Status</th>
                      <th>Package No</th>
                      <th>Total Pax</th>
                      <th>Balance</th>
                      <th>Status</th>
                    </tr>
                  )}
                </thead>
                <tbody>
                  {bookingData.is_public_booking ? (
                    // Public Booking Row
                    <tr>
                      <td>{orderNo}</td>
                      <td>{bookingData.total_pax}</td>
                      <td>
                        <span className={bookingData.status === 'Approved' ? 'text-success' : 'text-info'}>{bookingData.status || "N/A"}</span>
                      </td>
                      <td>{bookingData.contact_information?.[0]?.name || 'N/A'}</td>
                      <td>{bookingData.contact_information?.[0]?.email || 'N/A'}</td>
                      <td>{bookingData.contact_information?.[0]?.phone || 'N/A'}</td>
                    </tr>
                  ) : (
                    // Agent Booking Row (Original)
                    <tr>
                      <td>{orderNo}</td>
                      <td>{bookingData?.agency?.agency_code || bookingData?.agency_id || "N/A"}</td>
                      <td>{agencyData?.agreement_status ? "Active" : "Inactive"}</td>
                      <td>{bookingData.id}</td>
                      <td>{bookingData.total_pax}</td>
                      <td>PKR {bookingData.remaining_amount || 0}</td>
                      <td>
                        <span className={bookingData.status === 'Approved' ? 'text-success' : 'text-info'}>{bookingData.status || "N/A"}</span>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Payment Summary - Only show for public bookings */}
            {bookingData.is_public_booking && (
              <div className="mb-4">
                <h6 className="fw-bold mb-2">Payment Summary</h6>
                <div className="table-responsive">
                  <table className="table table-sm text-center">
                    <thead className="table-light">
                      <tr>
                        <th className="fw-normal">Total Payment</th>
                        <th className="fw-normal">Received Payment</th>
                        <th className="fw-normal">Remaining Payment</th>
                        <th className="fw-normal">Payment Method</th>
                        <th className="fw-normal">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>PKR {bookingData.total_amount || 0}</td>
                        <td>PKR {(bookingData.total_amount || 0) - (bookingData.remaining_amount || 0)}</td>
                        <td>PKR {bookingData.remaining_amount || 0}</td>
                        <td>
                          {bookingData.payments && bookingData.payments.length > 0
                            ? bookingData.payments[0].payment_method || 'N/A'
                            : 'N/A'}
                        </td>
                        <td>
                          <button className="btn btn-sm btn-primary">
                            Add Payment
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Select Umrah Visa Shirka */}
            <div className="mb-4">
              <h5 className="fw-bold mb-3">Select Umrah Visa Shirka</h5>
              <div className="row">
                <div className="col-md-4">
                  <label htmlFor="shirka-select" className="form-label">Shirka</label>
                  {shirkaLoading ? (
                    <div className="form-control">
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Loading shirkas...
                    </div>
                  ) : (
                    <select
                      id="shirka-select"
                      className="form-select shadow-none"
                      name="shirka"
                      value={selectedShirka}
                      onChange={(e) => setSelectedShirka(e.target.value)}
                      disabled={shirkaList.length === 0}
                    >
                      {shirkaList.length === 0 ? (
                        <option value="">No Shirka Available</option>
                      ) : (
                        <>
                          <option value="">Select a Shirka</option>
                          {shirkaList.map((shirka) => (
                            <option key={shirka.id} value={shirka.id}>
                              {shirka.name}
                            </option>
                          ))}
                        </>
                      )}
                    </select>
                  )}
                </div>
              </div>
            </div>

            {/* Passengers Details */}
            <div className="mb-4">
              <h5 className="fw-bold mb-3">Passengers Details For Umrah Package</h5>

              <div className="d-flex flex-column gap-2">
                {bookingData.person_details?.map((passenger, index) => (
                  <div key={passenger.id} className="border rounded p-3 bg-white" style={{ borderColor: "#e0e0e0" }}>
                    <div className="d-flex align-items-center gap-3">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        style={{ width: "18px", height: "18px" }}
                        checked={selectedPassengers[index]}
                        onChange={() => handlePassengerSelection(index)}
                      />

                      <div style={{ minWidth: "70px" }}>
                        <span className="text-muted small">Pax No. <strong>{index + 1}</strong></span>
                      </div>

                      <div className="flex-grow-1">
                        <div className="row g-2 align-items-center">
                          <div className="col-auto">
                            <div className="text-muted small">Type</div>
                            <div className="fw-bold">{passenger.age_group || "Adult"}</div>
                          </div>
                          <div className="col-auto">
                            <div className="text-muted small">Bed</div>
                            <div className="fw-bold">Yes</div>
                          </div>
                          <div className="col">
                            <div className="text-muted small">Passenger Name</div>
                            <div className="fw-bold">{passenger.first_name} {passenger.last_name}</div>
                          </div>
                          <div className="col-auto">
                            <div className="text-muted small">Passport Number</div>
                            <div className="fw-bold">{passenger.passport_number || "N/A"}</div>
                          </div>
                          <div className="col-auto">
                            <div className="text-muted small">Passport Expiry</div>
                            <div className="fw-bold">{passenger.passport_expiry_date || "N/A"}</div>
                          </div>
                          <div className="col-auto">
                            <div className="text-muted small">Status</div>
                            <select
                              className={`form-select form-select-sm fw-bold ${passenger.visa_status === "Approved" ? "text-success" : passenger.visa_status === "Rejected" ? "text-danger" : "text-muted"}`}
                              style={{ border: 'none', background: 'transparent', padding: '0', width: 'auto' }}
                              value={passenger.visa_status || "Pending"}
                              onChange={async (e) => {
                                const newStatus = e.target.value;
                                try {
                                  const token = localStorage.getItem("accessToken");

                                  // Determine which API to use based on booking type
                                  const isPublicBooking = bookingData.booking_type === "Public Umrah Package" || bookingData.is_public_booking;
                                  const apiEndpoint = isPublicBooking
                                    ? `http://127.0.0.1:8000/api/admin/public-bookings/${bookingData.id}/`
                                    : `http://127.0.0.1:8000/api/bookings/${bookingData.id}/`;

                                  console.log(`Updating visa status for ${isPublicBooking ? 'public' : 'agent'} booking`);

                                  const response = await axios.patch(
                                    apiEndpoint,
                                    {
                                      agency_id: bookingData.agency?.id || bookingData.agency_id,
                                      user_id: bookingData.user?.id || bookingData.user_id,
                                      organization_id: bookingData.organization?.id || bookingData.organization_id,
                                      branch_id: bookingData.branch?.id || bookingData.branch_id,
                                      person_details: bookingData.person_details.map((p, idx) => {
                                        const { booking, ...personWithoutBooking } = p;
                                        return idx === index
                                          ? { ...personWithoutBooking, visa_status: newStatus }
                                          : personWithoutBooking;
                                      })
                                    },
                                    {
                                      headers: {
                                        Authorization: `Bearer ${token}`,
                                        'Content-Type': 'application/json',
                                      },
                                    }
                                  );

                                  if (response.status === 200) {
                                    // Update local state
                                    setBookingData({
                                      ...bookingData,
                                      person_details: bookingData.person_details.map((p, idx) =>
                                        idx === index ? { ...p, visa_status: newStatus } : p
                                      )
                                    });
                                    alert(`Visa status updated to ${newStatus} successfully!`);
                                  }
                                } catch (error) {
                                  console.error('Error updating visa status:', error);
                                  console.error('Backend error response:', error.response?.data);
                                  alert(`Error updating visa status: ${JSON.stringify(error.response?.data) || error.message}`);
                                }
                              }}
                            >
                              <option value="Pending">Pending</option>
                              <option value="Approved">Approved</option>
                              <option value="Rejected">Rejected</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      <div className="text-end" style={{ minWidth: "150px" }}>
                        <a href="#" className="text-primary text-decoration-none fw-normal">
                          Download Passport
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="d-flex gap-2 mt-4">
              <button className="btn btn-primary">Visa Applied</button>
              <button className="btn btn-primary">Send to Embassy</button>
              <button
                className="btn btn-primary"
                onClick={async () => {
                  const checkedPassengers = bookingData.person_details.filter((_, idx) => selectedPassengers[idx]);
                  if (checkedPassengers.length === 0) {
                    alert('Please select at least one passenger');
                    return;
                  }

                  try {
                    const token = localStorage.getItem("accessToken");

                    // Determine which API to use based on booking type
                    const isPublicBooking = bookingData.booking_type === "Public Umrah Package" || bookingData.is_public_booking;
                    const apiEndpoint = isPublicBooking
                      ? `http://127.0.0.1:8000/api/admin/public-bookings/${bookingData.id}/`
                      : `http://127.0.0.1:8000/api/bookings/${bookingData.id}/`;

                    console.log(`Approving visa for ${isPublicBooking ? 'public' : 'agent'} booking`);

                    const response = await axios.patch(
                      apiEndpoint,
                      {
                        agency_id: bookingData.agency?.id || bookingData.agency_id,
                        user_id: bookingData.user?.id || bookingData.user_id,
                        organization_id: bookingData.organization?.id || bookingData.organization_id,
                        branch_id: bookingData.branch?.id || bookingData.branch_id,
                        person_details: bookingData.person_details.map((p, idx) => {
                          const { booking, ...personWithoutBooking } = p;
                          return selectedPassengers[idx]
                            ? { ...personWithoutBooking, visa_status: 'Approved' }
                            : personWithoutBooking;
                        })
                      },
                      {
                        headers: {
                          Authorization: `Bearer ${token}`,
                          'Content-Type': 'application/json',
                        },
                      }
                    );

                    if (response.status === 200) {
                      setBookingData({
                        ...bookingData,
                        person_details: bookingData.person_details.map((p, idx) =>
                          selectedPassengers[idx] ? { ...p, visa_status: 'Approved' } : p
                        )
                      });
                      alert(`Visa approved for ${checkedPassengers.length} passenger(s)!`);
                      // Clear selections
                      setSelectedPassengers(new Array(bookingData.person_details.length).fill(false));
                    }
                  } catch (error) {
                    console.error('Error approving visa:', error);
                    console.error('Backend error response:', error.response?.data);
                    alert(`Error approving visa: ${JSON.stringify(error.response?.data) || error.message}`);
                  }
                }}
              >
                Visa approved
              </button>
              <button className="btn btn-outline-secondary">
                Application Reject
              </button>
            </div>
          </>
        )}
        {activeTab === "hotel" && (
          <HotelVoucherInterfaceNew onClose={onClose} orderNo={orderNo} />
        )}

        {activeTab === "tickets" && <TicketsInterface orderNo={orderNo} />}
      </div>

      {/* Invoice Modal */}
      {showInvoiceModal && (
        <div
          className="modal fade show"
          style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={() => setShowInvoiceModal(false)}
        >
          <div
            className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable"
            style={{ maxWidth: '90%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">Booking Invoice - {orderNo}</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowInvoiceModal(false)}
                ></button>
              </div>
              <div className="modal-body p-0" style={{ maxHeight: '85vh', overflowY: 'auto' }}>
                <TravelBookingInvoice isModal={true} orderNoProp={orderNo} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const OrderList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("Umrah Package");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Status options for dropdown
  const statusOptions = ["all", "Un-approved", "under-process", "Delivered", "Confirmed", "Canceled"];

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch orders from API
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const orgData = JSON.parse(localStorage.getItem("selectedOrganization"));
        const organizationId = orgData?.id;
        const token = localStorage.getItem("accessToken");

        // Fetch from both APIs in parallel
        const [agentResponse, publicResponse] = await Promise.all([
          // Agent bookings (excludes public bookings)
          axios.get(`http://127.0.0.1:8000/api/bookings/?organization=${organizationId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            }
          }),
          // Public bookings (filtered by organization)
          axios.get(`http://127.0.0.1:8000/api/admin/public-bookings/?organization=${organizationId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            }
          }).catch(err => {
            console.warn("Failed to fetch public bookings:", err);
            return { data: { results: [] } }; // Fallback to empty array if API fails
          })
        ]);

        // Combine agent bookings and public bookings
        const agentBookings = agentResponse.data || [];
        // Handle both array response and paginated response
        const publicBookings = Array.isArray(publicResponse.data)
          ? publicResponse.data
          : (publicResponse.data?.results || []);

        console.log('=== BOOKINGS FETCH DEBUG ===');
        console.log('Agent bookings count:', agentBookings.length);
        console.log('Public bookings count:', publicBookings.length);
        console.log('Public bookings data:', publicBookings);

        // Log each public booking details
        publicBookings.forEach(booking => {
          console.log(`Public Booking ${booking.booking_number}:`, {
            id: booking.id,
            status: booking.status,
            is_public_booking: booking.is_public_booking,
            booking_type: booking.booking_type
          });
        });

        // Combine both arrays
        const combinedOrders = [...agentBookings, ...publicBookings];
        console.log('Combined orders count:', combinedOrders.length);

        setOrders(combinedOrders);
        setError(null);
      } catch (err) {
        setError("Failed to fetch orders. Please try again later.");
        console.error("Error fetching orders:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, paymentFilter, searchTerm, activeTab]);

  // Handle tab switching
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    // Reset payment filter when switching tabs
    setPaymentFilter("all");
  };

  // For order link navigation based on activeTab and status
  const handleOrderClick = (order) => {
    // Navigate based on status and booking_type
    if (order.status === "Approved") {
      // Approved orders go to visa management page
      navigate(`/order-delivery/visa/${order.booking_number}`);
    } else if (order.status === "under-process") {
      navigate(`/order-delivery/visa/${order.booking_number}`);
    } else if (activeTab === "Umrah Package" && (order.booking_type === "Umrah Package" || order.booking_type === "Custom Package" || order.booking_type === "Public Umrah Package")) {
      // Navigate to order delivery page for all Umrah package types including public bookings
      navigate(`/order-delivery/${order.booking_number}`);
    } else if (activeTab === "Ticketing" && order.booking_type === "Group Ticket") {
      navigate(`/order-delivery/ticketing/${order.booking_number}`);
    } else {
      // Default: navigate to general booking details page
      navigate(`/order-delivery/${order.booking_number}`);
    }
  };

  // Handle confirming a booking (change status from Approved to Confirmed)
  const handleConfirmBooking = async (order) => {
    try {
      const token = localStorage.getItem("accessToken");

      // Determine which API to use based on booking type
      const isPublicBooking = order.booking_type === "Public Umrah Package" || order.is_public_booking;

      let response;
      if (isPublicBooking) {
        // Use dedicated confirm action for public bookings
        console.log('Confirming public booking:', order.booking_number);
        response = await axios.post(
          `http://127.0.0.1:8000/api/admin/public-bookings/${order.id}/confirm/`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );
      } else {
        // Use PATCH for agent bookings
        console.log('Confirming agent booking:', order.booking_number);
        response = await axios.patch(
          `http://127.0.0.1:8000/api/bookings/${order.id}/`,
          {
            status: 'Confirmed',
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );
      }

      if (response.status === 200) {
        // Update local state to reflect the change
        setOrders(orders.map(o =>
          o.id === order.id ? { ...o, status: 'Confirmed' } : o
        ));
        alert('Booking confirmed successfully!');
      }
    } catch (err) {
      console.error('Error confirming booking:', err);
      alert('Error confirming booking. Please try again.');
    }
  };

  // Filter orders based on active tab, payment status, and other filters
  const filteredOrders = orders.filter((order) => {
    // Filter by tab (booking_type)
    const matchesTab =
      (activeTab === "Umrah Package" && order.booking_type === "Umrah Package" && !order.is_public_booking) ||
      (activeTab === "Custom Package" && order.booking_type === "Custom Package" && !order.is_public_booking) ||
      (activeTab === "Ticketing" && order.booking_type === "Group Ticket") ||
      (activeTab === "Customer Orders" && order.is_public_booking === true);

    // Filter by payment status (now based on booking status)
    const matchesPayment =
      paymentFilter === "all" ||
      (paymentFilter === "paid" && order.status === "Confirmed") ||
      (paymentFilter === "unpaid" && order.status === "Un-approved");

    // Filter by status
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "un-approve" && (order.status === "Un-approved" || order.status === "Confirmed")) ||
      (statusFilter !== "un-approve" && order.status && order.status.toLowerCase().includes(statusFilter.toLowerCase()));

    // Filter by search term (booking number)
    const matchesSearch =
      searchTerm === "" ||
      (order.booking_number && order.booking_number.toLowerCase().includes(searchTerm.toLowerCase()));

    // Debug logging for public bookings
    if (order.is_public_booking === true) {
      console.log('Public booking filter check:', {
        booking_number: order.booking_number,
        booking_type: order.booking_type,
        is_public_booking: order.is_public_booking,
        status: order.status,
        activeTab,
        paymentFilter,
        matchesTab,
        matchesPayment,
        matchesStatus,
        matchesSearch,
        willShow: matchesTab && matchesPayment && matchesStatus && matchesSearch
      });
    }

    return matchesTab && matchesPayment && matchesStatus && matchesSearch;
  });

  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (loading) {
    return (
      <div className="px-3 px-lg-4 my-3">
        <div className="bg-white rounded shadow-sm p-4 text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-3 px-lg-4 my-3">
        <div className="bg-white rounded shadow-sm p-4 text-center text-danger">
          {error}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="px-3 px-lg-4 my-3">
        <div className="d-flex gap-4 mb-3">
          <Link
            className={`text-decoration-none ${paymentFilter === "paid" ? "text-primary" : "text-secondary"}`}
            onClick={() => setPaymentFilter("paid")}
          >
            Confirmed Orders
          </Link>
          <Link
            className={`text-decoration-none ${paymentFilter === "unpaid" ? "text-primary" : "text-secondary"}`}
            onClick={() => setPaymentFilter("unpaid")}
          >
            Un-Confirmed Orders
          </Link>
        </div>
        <div className="bg-white rounded shadow-sm p-4">
          {/* Payment Status Filter Tabs */}
          <div className="mb-4">
            <div className="d-flex justify-content-between align-items-center">
              {/* Main tabs on the left */}
              <div className="d-flex gap-2">
                <button
                  className={`btn ${activeTab === "Umrah Package" ? "btn-primary" : "btn-outline-secondary"}`}
                  onClick={() => handleTabChange("Umrah Package")}
                >
                  Umrah Package
                </button>

                <button
                  className={`btn ${activeTab === "Custom Package" ? "btn-primary" : "btn-outline-secondary"}`}
                  onClick={() => handleTabChange("Custom Package")}
                >
                  Custom Package
                </button>

                <button
                  className={`btn ${activeTab === "Ticketing" ? "btn-primary" : "btn-outline-secondary"}`}
                  onClick={() => handleTabChange("Ticketing")}
                >
                  Ticketing
                </button>

                <button
                  className={`btn ${activeTab === "Customer Orders" ? "btn-primary" : "btn-outline-secondary"}`}
                  onClick={() => handleTabChange("Customer Orders")}
                >
                  Customer Orders
                </button>
              </div>

              {/* Paid/Unpaid display buttons - only show for Customer Orders */}
              {activeTab === "Customer Orders" && (
                <div className="d-flex gap-2">
                  <button className="btn btn-outline-secondary">
                    Paid
                  </button>
                  <button className="btn btn-outline-secondary">
                    Unpaid
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
            {/* Show filters for all tabs */}
            <div className="d-flex gap-2 flex-wrap">
              {/* Show dropdown filters only for unpaid orders */}
              {paymentFilter === "unpaid" ? (
                <Dropdown>
                  <Dropdown.Toggle variant="outline-secondary">
                    <Funnel size={16} className="me-1" />
                    Filters
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    {statusOptions.map((status, idx) => (
                      <Dropdown.Item
                        key={idx}
                        onClick={() => setStatusFilter(status)}
                        active={statusFilter === status}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
                      </Dropdown.Item>
                    ))}
                  </Dropdown.Menu>
                </Dropdown>
              ) : (
                // Show regular button filters for paid orders
                <>
                  <button
                    className={`btn ${statusFilter === "all"
                      ? "btn-outline-primary"
                      : "btn-outline-secondary"
                      }`}
                    onClick={() => setStatusFilter("all")}
                  >
                    All
                  </button>
                  <button
                    className={`btn ${statusFilter === "un-approve"
                      ? "btn-primary"
                      : "btn-outline-secondary"
                      }`}
                    onClick={() => setStatusFilter("un-approve")}
                  >
                    Un-Approved
                  </button>
                  <button
                    className={`btn ${statusFilter === "under-process"
                      ? "btn-primary"
                      : "btn-outline-secondary"
                      }`}
                    onClick={() => setStatusFilter("under-process")}
                  >
                    Under Process
                  </button>
                  <button
                    className={`btn ${statusFilter === "Delivered"
                      ? "btn-primary"
                      : "btn-outline-secondary"
                      }`}
                    onClick={() => setStatusFilter("Delivered")}
                  >
                    Delivered
                  </button>
                  <button
                    className={`btn ${statusFilter === "Confirmed"
                      ? "btn-primary"
                      : "btn-outline-secondary"
                      }`}
                    onClick={() => setStatusFilter("Confirmed")}
                  >
                    Confirmed
                  </button>
                  <button
                    className={`btn ${statusFilter === "Canceled"
                      ? "btn-primary"
                      : "btn-outline-secondary"
                      }`}
                    onClick={() => setStatusFilter("Canceled")}
                  >
                    Canceled
                  </button>
                </>
              )}
            </div>

            <div className="input-group" style={{ width: "250px" }}>
              <input
                type="text"
                className="form-control"
                placeholder="Order Number"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <span className="input-group-text">
                <Search size={16} />
              </span>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-hover">
              <thead className="table-light">
                <tr>
                  <th>Order No</th>
                  <th>Agency Code</th>
                  <th>Agreement</th>
                  <th>Package No</th>
                  <th>Passport</th>
                  <th>Total Pax</th>
                  <th>Status</th>
                  {/* Add Action column for unpaid orders */}
                  {paymentFilter === "unpaid" && <th>Action</th>}
                </tr>
              </thead>
              <tbody>
                {currentItems.length > 0 ? (
                  currentItems.map((order, index) => (
                    <tr key={index}>
                      <td>
                        <button
                          className="btn btn-link p-0 text-decoration-underline text-primary"
                          onClick={() => handleOrderClick(order)}
                        >
                          {order.booking_number}
                        </button>
                      </td>
                      <td>{order.agency?.agency_code || order.agency_id || 'N/A'}</td>
                      <td>{order.agreement || 'N/A'}</td>
                      <td>{order.packageNo || order.id || 'N/A'}</td>
                      <td>
                        <span className="text-decoration-none">
                          Download
                        </span>
                      </td>
                      <td>{order.total_pax}</td>
                      <td style={{ position: 'relative' }}>
                        <span
                          className={`badge bg-${order.status === 'Approved' ? 'success' : order.status === 'Confirmed' ? 'primary' : order.status === 'Rejected' ? 'danger' : 'secondary'}`}
                          style={{
                            cursor: order.status === 'Rejected' && order.rejected_notes ? 'help' : 'default',
                            position: 'relative',
                          }}
                          onMouseEnter={(e) => {
                            if (order.status === 'Rejected' && order.rejected_notes) {
                              const popup = document.getElementById(`rejection-popup-${order.id}`);
                              if (popup) {
                                const rect = e.currentTarget.getBoundingClientRect();
                                popup.style.display = 'block';
                                popup.style.left = `${rect.left + rect.width / 2 - 150}px`;
                                popup.style.top = `${rect.top - 130}px`;
                              }
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (order.status === 'Rejected' && order.rejected_notes) {
                              const popup = document.getElementById(`rejection-popup-${order.id}`);
                              if (popup) popup.style.display = 'none';
                            }
                          }}
                        >
                          {order.status || 'N/A'}
                        </span>
                        {order.status === 'Rejected' && order.rejected_notes && ReactDOM.createPortal(
                          <div
                            id={`rejection-popup-${order.id}`}
                            style={{
                              display: 'none',
                              position: 'fixed',
                              backgroundColor: '#fff',
                              border: '2px solid #dc3545',
                              borderRadius: '8px',
                              padding: '16px',
                              boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
                              zIndex: 99999,
                              minWidth: '300px',
                              maxWidth: '500px',
                              whiteSpace: 'normal',
                              pointerEvents: 'none',
                            }}
                          >
                            <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#dc3545', marginBottom: '8px', borderBottom: '1px solid #ddd', paddingBottom: '6px' }}>
                              📝 Rejection Note
                            </div>
                            <div style={{ fontSize: '14px', color: '#333', lineHeight: '1.6' }}>
                              {order.rejected_notes}
                            </div>
                          </div>,
                          document.body
                        )}
                      </td>
                      {/* Add Action column with dropdown for unpaid orders */}
                      {paymentFilter === "unpaid" && (
                        <td>
                          <Dropdown>
                            <Dropdown.Toggle
                              variant="link"
                              className="text-decoration-none p-0"
                            >
                              <Gear size={18} />
                            </Dropdown.Toggle>
                            <Dropdown.Menu>
                              <Dropdown.Item
                                className="text-success fw-bold"
                                onClick={() => handleConfirmBooking(order)}
                              >
                                Confirm Booking
                              </Dropdown.Item>
                              <Dropdown.Item className="text-primary">
                                Edit
                              </Dropdown.Item>
                              <Dropdown.Item className="text-info">
                                Add Notes
                              </Dropdown.Item>
                              <Dropdown.Item className="text-danger">
                                Call done
                              </Dropdown.Item>
                              <Dropdown.Item>Cancel</Dropdown.Item>
                            </Dropdown.Menu>
                          </Dropdown>
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={paymentFilter === "unpaid" ? 8 : 7} className="text-center py-4">
                      No orders found matching your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {filteredOrders.length > itemsPerPage && (
            <div className="d-flex justify-content-between align-items-center mt-4">
              <div>
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredOrders.length)} of {filteredOrders.length} entries
              </div>
              <nav>
                <ul className="pagination mb-0">
                  <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={() => paginate(currentPage - 1)}>
                      <ChevronLeft size={14} />
                    </button>
                  </li>

                  {[...Array(totalPages)].map((_, i) => {
                    const pageNumber = i + 1;
                    // Show limited page numbers with ellipsis
                    if (
                      pageNumber === 1 ||
                      pageNumber === totalPages ||
                      (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                    ) {
                      return (
                        <li key={i} className={`page-item ${currentPage === pageNumber ? 'active' : ''}`}>
                          <button className="page-link" onClick={() => paginate(pageNumber)}>
                            {pageNumber}
                          </button>
                        </li>
                      );
                    } else if (
                      pageNumber === currentPage - 2 ||
                      pageNumber === currentPage + 2
                    ) {
                      return (
                        <li key={i} className="page-item disabled">
                          <span className="page-link">...</span>
                        </li>
                      );
                    }
                    return null;
                  })}

                  <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={() => paginate(currentPage + 1)}>
                      <ChevronRight size={14} />
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

const OrderDeliverySystem = () => {
  return (
    <div className="min-vh-100" style={{ fontFamily: "Poppins, sans-serif" }}>
      <div className="row g-0">
        {/* Sidebar */}
        <div className="col-12 col-lg-2">
          <Sidebar />
        </div>
        {/* Main Content */}
        <div className="col-12 col-lg-10">
          <div className="container">
            <Header />

            <Routes>
              <Route index element={<OrderList />} />
              <Route path=":orderNo" element={<TravelBookingInvoice />} />
              <Route path="ticketing/:orderNo" element={<TicketTravelBookingInvoice />} />
              <Route path="visa/:orderNo" element={<VisaApplicationInterface onClose={() => navigate("/order-delivery")} />} />
            </Routes>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDeliverySystem;

