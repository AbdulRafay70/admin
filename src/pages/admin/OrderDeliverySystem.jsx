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
  const [hotelAvailabilityStatus, setHotelAvailabilityStatus] = useState('Checking...');

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

        // Debugging status for button visibility
        console.log('DEBUG: Booking Status:', booking.status);
        console.log('DEBUG: Is Under Process?', booking.status?.toLowerCase().includes("under") && booking.status?.toLowerCase().includes("process"));
        console.log('DEBUG: Is Confirmed?', booking.status === 'Confirmed');

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

  // Check hotel availability when booking data is loaded
  useEffect(() => {
    const checkHotelAvailability = async () => {
      if (!bookingData || !bookingData.hotel_details || bookingData.hotel_details.length === 0) {
        setHotelAvailabilityStatus('N/A');
        return;
      }

      try {
        const token = localStorage.getItem("accessToken");
        const orgData = JSON.parse(localStorage.getItem("selectedOrganization"));
        const organizationId = orgData?.id;

        // Check availability for all hotels
        const availabilityChecks = await Promise.all(
          bookingData.hotel_details.map(async (hotel) => {
            try {
              // Skip if hotel doesn't have required data
              if (!hotel.hotel_id && !hotel.hotel) {
                return { available: true }; // Assume available if no hotel ID
              }

              const hotelId = hotel.hotel_id || hotel.hotel;
              const checkIn = hotel.check_in_date || hotel.check_in_time;
              const checkOut = hotel.check_out_date || hotel.check_out_time;

              if (!checkIn || !checkOut) {
                return { available: true }; // Assume available if no dates
              }

              // Format dates to YYYY-MM-DD
              const formatDate = (dateStr) => {
                const date = new Date(dateStr);
                return date.toISOString().split('T')[0];
              };

              const params = new URLSearchParams({
                hotel_id: hotelId,
                date_from: formatDate(checkIn),
                date_to: formatDate(checkOut),
                ...(organizationId && { owner_organization: organizationId })
              });

              const response = await fetch(
                `http://127.0.0.1:8000/api/hotel-availability/?${params}`,
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                  }
                }
              );

              if (response.ok) {
                const data = await response.json();
                // Hotel is available if there are available rooms
                return { available: data.available_rooms > 0, data };
              } else {
                // If API fails, assume available (don't block on API errors)
                return { available: true };
              }
            } catch (err) {
              console.error('Error checking hotel availability:', err);
              return { available: true }; // Assume available on error
            }
          })
        );

        // Determine overall availability
        const allAvailable = availabilityChecks.every(check => check.available);
        setHotelAvailabilityStatus(allAvailable ? 'Available' : 'Not Available');
      } catch (err) {
        console.error('Error in hotel availability check:', err);
        setHotelAvailabilityStatus('N/A');
      }
    };

    checkHotelAvailability();
  }, [bookingData]);

  const handleConfirmOrder = async () => {
    try {
      const orgData = JSON.parse(localStorage.getItem("selectedOrganization"));
      const organizationId = orgData?.id;
      const token = localStorage.getItem("accessToken");

      // Determine which API to use based on booking type
      const isPublicBooking = bookingData.booking_type === "Public Umrah Package" || bookingData.is_public_booking;

      let response;
      if (isPublicBooking) {
        // Use dedicated confirm action for public bookings if available, or just update status
        console.log('Confirming public booking:', bookingData.booking_number);
        response = await axios.post(
          `http://127.0.0.1:8000/api/admin/public-bookings/${bookingData.id}/confirm/`,
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
        console.log('Confirming agent booking:', bookingData.booking_number);
        response = await axios.patch(
          `http://127.0.0.1:8000/api/bookings/${bookingData.id}/`,
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
        setBookingData({ ...bookingData, status: 'Confirmed' });
        alert('Order Confirmed successfully!');
        window.location.reload();
      } else {
        throw new Error('Failed to confirm order');
      }
    } catch (err) {
      console.error('Error confirming order:', err);
      alert('Error confirming order. Please try again.');
    }
  };

  const handleApproveOrder = async () => {
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
                      <td>PKR {hotel.price}</td>
                      <td>PKR {hotel.total_price}</td>
                    </tr>
                  ))}
                  <tr className="fw-bold">
                    <td colSpan="3">Total Accommodation</td>
                    <td>{calculateTotalNights()}</td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td>PKR {calculateTotalHotelAmount()}</td>
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
                        <td>PKR {transport.price_in_pkr || transport.price || 0}</td>
                        <td>1</td>
                        <td>PKR {transport.price_in_pkr || transport.price || 0}</td>
                      </tr>
                    );
                  })}
                  <tr className="fw-bold">
                    <td colSpan="4">Total Transportation</td>
                    <td>PKR {bookingData.total_transport_amount_pkr || 0}</td>
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
                      <td>PKR {food.adult_price} × {food.total_adults}</td>
                      <td>PKR {food.child_price} × {food.total_children}</td>
                      <td>PKR {food.infant_price} × {food.total_infants}</td>
                      <td>PKR {food.total_price_pkr || 0}</td>
                    </tr>
                  ))}
                  <tr className="fw-bold">
                    <td colSpan="3">Total Food Services</td>
                    <td>PKR {bookingData.total_food_amount_pkr || 0}</td>
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
                      <td>PKR {ziarat.adult_price} × {ziarat.total_adults}</td>
                      <td>PKR {ziarat.child_price} × {ziarat.total_children}</td>
                      <td>PKR {ziarat.infant_price} × {ziarat.total_infants}</td>
                      <td>PKR {ziarat.total_price_pkr || 0}</td>
                    </tr>
                  ))}
                  <tr className="fw-bold">
                    <td colSpan="3">Total Ziarat Services</td>
                    <td>PKR {bookingData.total_ziyarat_amount_pkr || 0}</td>
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
                        PKR {bookingData.total_visa_amount_pkr || 0}
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
                        PKR {bookingData.total_visa_amount_pkr || 0}
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
                        PKR {bookingData.total_visa_amount_pkr || 0}
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
                      <td>PKR {bookingData.total_visa_amount_pkr || 0}</td>
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
                <span
                  className="fw-bold"
                  style={{
                    color: hotelAvailabilityStatus === 'Available'
                      ? "#8BD399"
                      : hotelAvailabilityStatus === 'Not Available'
                        ? "#FF6B6B"
                        : "#999"
                  }}
                >
                  {hotelAvailabilityStatus}
                </span>
              </h6>

              {/* Action Buttons - Hidden in Modal */}
              <div className="d-flex flex-wrap gap-2 mt-5">
                {(bookingData.status === 'under-process' || bookingData.status === 'Un-approved' || (bookingData.status && bookingData.status.toLowerCase().includes("under") && bookingData.status.toLowerCase().includes("process"))) && (
                  <button
                    className="btn btn-primary"
                    onClick={handleConfirmOrder}
                  >
                    Confirm Order
                  </button>
                )}

                {(bookingData.status === 'Confirmed') && (
                  <button
                    className="btn btn-primary"
                    onClick={handleApproveOrder}
                  >
                    Approve
                  </button>
                )}

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

  const handleConfirmOrder = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const isPublicBooking = bookingData.booking_type === "Public Umrah Package" || bookingData.is_public_booking;

      if (isPublicBooking) {
        await axios.post(
          `http://127.0.0.1:8000/api/admin/public-bookings/${bookingData.id}/confirm/`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        await axios.patch(
          `http://127.0.0.1:8000/api/bookings/${bookingData.id}/`,
          { status: 'Confirmed' },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      window.location.reload();
    } catch (error) {
      console.error("Error confirming order:", error);
      alert("Failed to confirm order.");
    }
  };

  const handleApproveOrder = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      await axios.patch(
        `http://127.0.0.1:8000/api/bookings/${bookingData.id}/`,
        { status: 'Approved' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      window.location.reload();
    } catch (error) {
      console.error("Error approving order:", error);
      alert("Failed to approve order.");
    }
  };

  const handleCancelOrder = async () => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;
    try {
      const token = localStorage.getItem("accessToken");
      await axios.patch(
        `http://127.0.0.1:8000/api/bookings/${bookingData.id}/`,
        { status: 'Cancelled' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      window.location.reload();
    } catch (error) {
      console.error("Error canceling order:", error);
      alert("Failed to cancel order.");
    }
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
      {/* Action Buttons */}
      <div className="d-flex flex-wrap gap-2 mb-4">
        {/* Conditional Confirm/Approve Buttons */}
        {(bookingData.status === 'under-process' || bookingData.status === 'Un-approved') && (
          <button
            className="btn btn-primary"
            onClick={handleConfirmOrder}
          >
            Confirm Order
          </button>
        )}

        {bookingData.status === 'Confirmed' && (
          <button
            className="btn btn-primary"
            onClick={handleApproveOrder}
          >
            Approve
          </button>
        )}

        <button
          className="btn btn-outline-primary"
          onClick={() => setShowChild(true)}
        >
          Set Infant And Child Fare
        </button>

        <button className="btn btn-outline-secondary">Remove from order</button>

        <button
          className="btn btn-danger"
          onClick={handleCancelOrder}
        >
          Cancel Order
        </button>

        <button
          className="btn btn-outline-danger"
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

  const handleApplyShirka = async () => {
    if (!selectedShirka) {
      alert("Please select a Shirka first.");
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");

      // Determine which API to use based on booking type
      const isPublicBooking = bookingData.booking_type === "Public Umrah Package" || bookingData.is_public_booking;
      const apiEndpoint = isPublicBooking
        ? `http://127.0.0.1:8000/api/admin/public-bookings/${bookingData.id}/`
        : `http://127.0.0.1:8000/api/bookings/${bookingData.id}/`;

      console.log(`Applying shirka ${selectedShirka} to all passengers in ${isPublicBooking ? 'public' : 'agent'} booking`);

      const response = await axios.patch(
        apiEndpoint,
        {
          agency_id: bookingData.agency?.id || bookingData.agency_id,
          user_id: bookingData.user?.id || bookingData.user_id,
          organization_id: bookingData.organization?.id || bookingData.organization_id,
          branch_id: bookingData.branch?.id || bookingData.branch_id,
          person_details: bookingData.person_details.map(p => {
            const { booking, ...personWithoutBooking } = p;
            return { ...personWithoutBooking, shirka: selectedShirka };
          })
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.status === 200) {
        setBookingData({
          ...bookingData,
          person_details: bookingData.person_details.map(p => ({ ...p, shirka: selectedShirka }))
        });
        alert("Shirka applied successfully to all passengers!");
      }
    } catch (error) {
      console.error("Error applying shirka:", error);
      alert("Failed to apply Shirka.");
    }
  };

  const handleUpdateVisaStatus = async (newStatus) => {
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

      console.log(`Updating visa status to ${newStatus} for ${isPublicBooking ? 'public' : 'agent'} booking`);

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
        setBookingData({
          ...bookingData,
          person_details: bookingData.person_details.map((p, idx) =>
            selectedPassengers[idx] ? { ...p, visa_status: newStatus } : p
          )
        });
        alert(`Visa status updated to '${newStatus}' for ${checkedPassengers.length} passenger(s)!`);
        // Clear selections
        setSelectedPassengers(new Array(bookingData.person_details.length).fill(false));
      }
    } catch (error) {
      console.error('Error updating visa status:', error);
      console.error('Backend error response:', error.response?.data);
      alert(`Error updating visa status: ${JSON.stringify(error.response?.data) || error.message}`);
    }
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
                  <div className="d-flex gap-2">
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
                    <button
                      className="btn btn-primary"
                      onClick={handleApplyShirka}
                      disabled={!selectedShirka || shirkaLoading}
                    >
                      Apply
                    </button>
                  </div>
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
                              <option value="Visa Applied">Visa Applied</option>
                              <option value="Sent to Embassy">Sent to Embassy</option>
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
            {/* Action Buttons */}
            <div className="d-flex gap-2 mt-4">
              <button
                className="btn btn-primary"
                onClick={() => handleUpdateVisaStatus("Visa Applied")}
              >
                Visa Applied
              </button>
              <button
                className="btn btn-primary"
                onClick={() => handleUpdateVisaStatus("Sent to Embassy")}
              >
                Send to Embassy
              </button>
              <button
                className="btn btn-primary"
                onClick={() => handleUpdateVisaStatus("Approved")}
              >
                Visa approved
              </button>
              <button
                className="btn btn-outline-secondary"
                onClick={() => handleUpdateVisaStatus("Rejected")}
              >
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

  // View mode: "orders" or "agencies"
  const [viewMode, setViewMode] = useState("orders");
  const [mainTab, setMainTab] = useState("unconfirmed"); // "confirmed" or "unconfirmed"

  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("Agent Orders"); // Level 2 tab
  const [packageType, setPackageType] = useState("Umrah Packages"); // Level 3 tab
  const [orders, setOrders] = useState([]);
  const [agencies, setAgencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Branch Filter State
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");

  // Status options for dropdown
  const statusOptions = ["all", "Un-approved", "under-process", "Delivered", "Confirmed", "Canceled"];

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch orders and agencies from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const orgData = JSON.parse(localStorage.getItem("selectedOrganization"));
        const organizationId = orgData?.id;
        const token = localStorage.getItem("accessToken");

        // Fetch from all APIs in parallel
        const [agentResponse, publicResponse, agenciesResponse, branchesResponse] = await Promise.all([
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
          }),
          // Agencies (for Zero Order Agencies view)
          axios.get(`http://127.0.0.1:8000/api/agencies/?organization=${organizationId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            }
          }).catch(err => {
            console.warn("Failed to fetch agencies:", err);
            return { data: [] }; // Fallback to empty array if API fails
          }),
          // Fetch branches
          axios.get(`http://127.0.0.1:8000/api/branches/?organization=${organizationId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            }
          }).catch(err => {
            console.warn("Failed to fetch branches:", err);
            return { data: [] };
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

        // Handle agencies data
        const agenciesData = Array.isArray(agenciesResponse.data)
          ? agenciesResponse.data
          : (agenciesResponse.data?.results || []);
        console.log('Agencies count:', agenciesData.length);


        if (branchesResponse?.data) {
          setBranches(Array.isArray(branchesResponse.data) ? branchesResponse.data : branchesResponse.data.results || []);
        }

        setOrders(combinedOrders);
        setAgencies(agenciesResponse.data?.results || agenciesResponse.data || []);
        setError(null);
      } catch (err) {
        setError("Failed to fetch data. Please try again later.");
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, mainTab, searchTerm, activeTab, packageType]);

  // Handle tab switching
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  // For order link navigation based on packageType and status
  const handleOrderClick = (order) => {
    // Navigate based on status and booking_type
    if (order.status === "Approved") {
      // Approved orders go to visa management page
      navigate(`/order-delivery/visa/${order.booking_number}`);
    } else if (packageType === "Group Tickets" && order.booking_type === "Group Ticket") {
      // Group ticket bookings go to ticketing page
      navigate(`/order-delivery/ticketing/${order.booking_number}`);
    } else if (packageType === "Umrah Packages" || packageType === "Custom Packages") {
      // Umrah and Custom packages go to order delivery page
      navigate(`/order-delivery/${order.booking_number}`);
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

  // Filter orders based on 3-level filter system: Order Type + Package Type + Status
  const filteredOrders = orders.filter((order) => {
    // LEVEL 1: Main Tab (Confirmed/Unconfirmed)
    const matchesMainTab =
      (mainTab === "confirmed" &&
        (order.status === "Confirmed" || order.status === "Approved" || order.status === "Delivered" || order.status === "Finished" ||
          order.status === "Un-approved" || order.status === "Pending" ||
          order.status === "Rejected" || order.status === "Cancelled" || order.status === "Canceled")) ||
      (mainTab === "unconfirmed" &&
        ((order.status && order.status.toLowerCase().includes("under") && order.status.toLowerCase().includes("process")) ||
          order.status === "Cancelled" || order.status === "Canceled" || order.status === "Rejected"));

    if (!matchesMainTab) return false;

    // LEVEL 2: Order Type (Agent/Area Agent/Customer/Branch/All Orders)
    let matchesOrderType = false;

    if (activeTab === "All Orders") {
      matchesOrderType = true; // Show everything
    } else if (activeTab === "Agent Orders") {
      // Full agent orders: has agency AND (agency_type contains "full" OR is standard agent type)
      if (order.agency) {
        const agencyType = (order.agency.agency_type || order.agency.type || "").toLowerCase();
        matchesOrderType =
          agencyType.includes("full") ||  // "Full Agency"
          agencyType === "agent" ||
          agencyType === "full_agency" ||
          (!order.is_public_booking && !agencyType.includes("area")); // Fallback: any agent that's not area/public
      }

      // Debug logging for agent orders
      if (order.agency) {
        console.log('🔍 Agent Order Debug:', {
          booking_number: order.booking_number,
          has_agency: !!order.agency,
          agency_id: order.agency?.id || order.agency,
          agency_type: order.agency?.type,
          agency_agency_type: order.agency?.agency_type,
          is_public: order.is_public_booking,
          matchesOrderType,
          agency_object: order.agency
        });
      }
    } else if (activeTab === "Area Agent Orders") {
      // Area agent orders: has agency AND agency_type contains "area"
      if (order.agency) {
        const agencyType = (order.agency.agency_type || order.agency.type || "").toLowerCase();
        matchesOrderType = agencyType.includes("area");
      }
    } else if (activeTab === "Customer Orders") {
      // Public/customer orders: is_public_booking = true
      matchesOrderType = order.is_public_booking === true;
    } else if (activeTab === "Branch Orders") {
      // Employee/branch orders: has employee field OR no agency
      matchesOrderType = order.employee || (!order.agency && !order.is_public_booking);

      // Filter by selected branch if set
      if (matchesOrderType && selectedBranch) {
        // Check if order belongs to the selected branch
        // The API response structure for 'branch' might be an ID or an object
        // Based on typical response: order.branch (ID) or order.branch.id (Object)
        const orderBranchId = typeof order.branch === 'object' ? order.branch?.id : order.branch;
        matchesOrderType = String(orderBranchId) === String(selectedBranch);
      }
    }

    // LEVEL 3: Package Type (Umrah/Custom/Group Tickets)
    let matchesPackageType = false;

    // Normalize booking type for comparison (case-insensitive, handle variations)
    const bookingType = (order.booking_type || "").toLowerCase().trim();

    if (packageType === "Umrah Packages") {
      matchesPackageType = bookingType.includes("umrah");
    } else if (packageType === "Custom Packages") {
      matchesPackageType = bookingType.includes("custom");
    } else if (packageType === "Group Tickets") {
      matchesPackageType = bookingType.includes("group") || bookingType.includes("ticket");
    }

    // Debug logging for package type
    console.log('📦 Package Type Debug:', {
      booking_number: order.booking_number,
      booking_type: order.booking_type,
      normalized: bookingType,
      selected_package: packageType,
      matchesPackageType
    });

    // LEVEL 4: Status Filter
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "un-approve" && (
        (mainTab === "confirmed" && order.status === "Confirmed") ||
        (mainTab !== "confirmed" && (order.status === "Un-approved" || order.status === "Pending"))
      )) ||
      (statusFilter === "under-process" && (
        (mainTab === "confirmed" && order.status === "Approved") ||
        (mainTab !== "confirmed" && (order.status?.toLowerCase().includes("under") && order.status?.toLowerCase().includes("process")))
      )) ||
      (statusFilter === "Delivered" && order.status === "Delivered") ||
      (statusFilter === "Confirmed" && order.status === "Confirmed") ||
      (statusFilter === "Cancelled" && (order.status === "Cancelled" || order.status === "Canceled" || order.status === "Rejected"));

    // Filter by search term (booking number)
    const matchesSearch =
      searchTerm === "" ||
      (order.booking_number && order.booking_number.toLowerCase().includes(searchTerm.toLowerCase()));

    // Combine all filters with AND logic
    return matchesOrderType && matchesPackageType && matchesStatus && matchesSearch;
  });

  // Calculate status counts for badges (based on current filters excluding status filter)
  const statusCounts = useMemo(() => {
    const counts = {
      all: 0,
      unapproved: 0,
      underProcess: 0,
      delivered: 0,
      confirmed: 0,
      cancelled: 0
    };

    orders.forEach((order) => {
      // Apply all filters EXCEPT status filter
      const matchesMainTab =
        (mainTab === "confirmed" &&
          (order.status === "Confirmed" || order.status === "Approved" || order.status === "Delivered" || order.status === "Finished" ||
            order.status === "Un-approved" || order.status === "Pending" ||
            order.status === "Rejected" || order.status === "Cancelled" || order.status === "Canceled")) ||
        (mainTab === "unconfirmed" &&
          ((order.status && order.status.toLowerCase().includes("under") && order.status.toLowerCase().includes("process")) ||
            order.status === "Cancelled" || order.status === "Canceled" || order.status === "Rejected"));

      let matchesOrderType = false;
      if (activeTab === "All Orders") {
        matchesOrderType = true;
      } else if (activeTab === "Agent Orders") {
        if (order.agency) {
          const agencyType = (order.agency.agency_type || order.agency.type || "").toLowerCase();
          matchesOrderType = agencyType.includes("full") || agencyType === "agent" || agencyType === "full_agency" || (!order.is_public_booking && !agencyType.includes("area"));
        }
      } else if (activeTab === "Area Agent Orders") {
        if (order.agency) {
          const agencyType = (order.agency.agency_type || order.agency.type || "").toLowerCase();
          matchesOrderType = agencyType.includes("area");
        }
      } else if (activeTab === "Customer Orders") {
        matchesOrderType = order.is_public_booking === true;
      } else if (activeTab === "Branch Orders") {
        matchesOrderType = order.employee || (!order.agency && !order.is_public_booking);
      }

      const bookingType = (order.booking_type || "").toLowerCase().trim();
      let matchesPackageType = false;
      if (packageType === "Umrah Packages") {
        matchesPackageType = bookingType.includes("umrah");
      } else if (packageType === "Custom Packages") {
        matchesPackageType = bookingType.includes("custom");
      } else if (packageType === "Group Tickets") {
        matchesPackageType = bookingType.includes("group") || bookingType.includes("ticket");
      }

      const matchesSearch = searchTerm === "" || (order.booking_number && order.booking_number.toLowerCase().includes(searchTerm.toLowerCase()));

      // Only count if matches all other filters
      if (matchesMainTab && matchesOrderType && matchesPackageType && matchesSearch) {
        counts.all++;
        if (mainTab === "confirmed" && order.status === "Confirmed") {
          counts.unapproved++; // Count confirmed as un-approved for confirmed tab
        } else if (mainTab !== "confirmed" && (order.status === "Un-approved" || order.status === "Pending")) {
          counts.unapproved++;
        } else if (mainTab === "confirmed" && order.status === "Approved") {
          counts.underProcess++; // Count approved as under-process for confirmed tab
        } else if (mainTab !== "confirmed" && (order.status?.toLowerCase().includes("under") && order.status?.toLowerCase().includes("process"))) {
          counts.underProcess++;
        } else if (order.status === "Delivered") {
        } else if (order.status === "Delivered") {
          counts.delivered++;
        } else if (order.status === "Confirmed") {
          counts.confirmed++;
        } else if (order.status === "Cancelled" || order.status === "Canceled" || order.status === "Rejected") {
          counts.cancelled++;
        }
      }
    });

    return counts;
  }, [orders, mainTab, activeTab, packageType, searchTerm]);

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
        {/* Level 1: Confirmed / Un-Confirmed Orders / Zero Order Agencies */}
        <div className="d-flex gap-4 mb-3">
          <Link
            className={`text-decoration-none fw-bold ${viewMode === "orders" && mainTab === "confirmed" ? "text-primary" : "text-secondary"}`}
            onClick={() => {
              setViewMode("orders");
              setMainTab("confirmed");
            }}
            style={{ cursor: 'pointer' }}
          >
            Confirmed Orders
          </Link>
          <Link
            className={`text-decoration-none fw-bold ${viewMode === "orders" && mainTab === "unconfirmed" ? "text-primary" : "text-secondary"}`}
            onClick={() => {
              setViewMode("orders");
              setMainTab("unconfirmed");
            }}
            style={{ cursor: 'pointer' }}
          >
            Un-Confirmed Orders
          </Link>
          <Link
            className={`text-decoration-none fw-bold ${viewMode === "agencies" ? "text-primary" : "text-secondary"}`}
            onClick={() => setViewMode("agencies")}
            style={{ cursor: 'pointer' }}
          >
            Zero Order Agencies
          </Link>
        </div>

        <div className="bg-white rounded shadow-sm p-4">
          {/* Orders View - Show only when viewMode is "orders" */}
          {viewMode === "orders" && (
            <>
              {/* Level 2: Order Types (Agent Orders, Area Agent, Customer, Branch, All) */}
              <div className="mb-3">
                <div className="d-flex gap-2 flex-wrap">
                  <button
                    className={`btn ${activeTab === "Agent Orders" ? "btn-primary" : "btn-outline-secondary"}`}
                    onClick={() => handleTabChange("Agent Orders")}
                  >
                    Agent Orders
                  </button>
                  <button
                    className={`btn ${activeTab === "Area Agent Orders" ? "btn-primary" : "btn-outline-secondary"}`}
                    onClick={() => handleTabChange("Area Agent Orders")}
                  >
                    Area Agent Orders
                  </button>
                  <button
                    className={`btn ${activeTab === "Customer Orders" ? "btn-primary" : "btn-outline-secondary"}`}
                    onClick={() => handleTabChange("Customer Orders")}
                  >
                    Customer Orders
                  </button>
                  <button
                    className={`btn ${activeTab === "Branch Orders" ? "btn-primary" : "btn-outline-secondary"}`}
                    onClick={() => handleTabChange("Branch Orders")}
                  >
                    Branch Orders
                  </button>

                  {/* Branch Selection Dropdown */}
                  {activeTab === "Branch Orders" && (
                    <select
                      className="form-select d-inline-block w-auto"
                      value={selectedBranch}
                      onChange={(e) => setSelectedBranch(e.target.value)}
                      style={{ minWidth: '150px' }}
                    >
                      <option value="">All Branches</option>
                      {branches.map((branch) => (
                        <option key={branch.id} value={branch.id}>
                          {branch.branch_name || branch.name}
                        </option>
                      ))}
                    </select>
                  )}

                  <button
                    className={`btn ${activeTab === "All Orders" ? "btn-primary" : "btn-outline-secondary"}`}
                    onClick={() => handleTabChange("All Orders")}
                  >
                    All Orders
                  </button>
                </div>
              </div>

              {/* Level 3: Package Types (Umrah, Custom, Group Tickets) */}
              <div className="mb-3">
                <div className="d-flex gap-2 flex-wrap">
                  <button
                    className={`btn btn-sm ${packageType === "Umrah Packages" ? "btn-primary" : "btn-outline-secondary"}`}
                    onClick={() => setPackageType("Umrah Packages")}
                  >Umrah Packages
                  </button>
                  <button
                    className={`btn btn-sm ${packageType === "Custom Packages" ? "btn-primary" : "btn-outline-secondary"}`}
                    onClick={() => setPackageType("Custom Packages")}
                  >
                    Custom Packages
                  </button>
                  <button
                    className={`btn btn-sm ${packageType === "Group Tickets" ? "btn-primary" : "btn-outline-secondary"}`}
                    onClick={() => setPackageType("Group Tickets")}
                  >
                    Group Tickets
                  </button>
                </div>
              </div>

              {/* Level 4: Status Filters */}
              <div className="mb-4">
                <div className="d-flex gap-2 flex-wrap">
                  <button
                    className={`btn btn-sm position-relative ${statusFilter === "all" ? "btn-primary" : "btn-outline-secondary"}`}
                    onClick={() => setStatusFilter("all")}
                  >
                    All
                    {statusCounts.all > 0 && (
                      <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-secondary" style={{ fontSize: '0.65rem' }}>
                        {statusCounts.all}
                      </span>
                    )}
                  </button>

                  {/* Un-Confirmed Tab Buttons */}
                  {mainTab === 'unconfirmed' && (
                    <>
                      <button
                        className={`btn btn-sm position-relative ${statusFilter === "under-process" ? "btn-primary" : "btn-outline-secondary"}`}
                        onClick={() => setStatusFilter("under-process")}
                      >
                        Under-process
                        {statusCounts.underProcess > 0 && (
                          <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '0.65rem' }}>
                            {statusCounts.underProcess}
                          </span>
                        )}
                      </button>

                      <button
                        className={`btn btn-sm position-relative ${statusFilter === "Cancelled" ? "btn-danger text-white" : "btn-outline-danger"}`}
                        onClick={() => setStatusFilter("Cancelled")}
                      >
                        Cancelled
                        {statusCounts.cancelled > 0 && (
                          <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-dark" style={{ fontSize: '0.65rem' }}>
                            {statusCounts.cancelled}
                          </span>
                        )}
                      </button>
                    </>
                  )}

                  {/* Confirmed Tab Buttons */}
                  {mainTab === 'confirmed' && (
                    <>
                      <button
                        className={`btn btn-sm position-relative ${statusFilter === "under-process" ? "btn-primary" : "btn-outline-secondary"}`}
                        onClick={() => setStatusFilter("under-process")}
                      >
                        Under-process
                        {statusCounts.underProcess > 0 && (
                          <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-secondary" style={{ fontSize: '0.65rem' }}>
                            {statusCounts.underProcess}
                          </span>
                        )}
                      </button>

                      <button
                        className={`btn btn-sm position-relative ${statusFilter === "un-approve" ? "btn-primary" : "btn-outline-secondary"}`}
                        onClick={() => setStatusFilter("un-approve")}
                      >
                        Un-approved
                        {statusCounts.unapproved > 0 && (
                          <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-secondary" style={{ fontSize: '0.65rem' }}>
                            {statusCounts.unapproved}
                          </span>
                        )}
                      </button>



                      <button
                        className={`btn btn-sm position-relative ${statusFilter === "Delivered" ? "btn-primary" : "btn-outline-secondary"}`}
                        onClick={() => setStatusFilter("Delivered")}
                      >
                        Delivered
                        {statusCounts.delivered > 0 && (
                          <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-success" style={{ fontSize: '0.65rem' }}>
                            {statusCounts.delivered}
                          </span>
                        )}
                      </button>

                      <button
                        className={`btn btn-sm position-relative ${statusFilter === "Cancelled" ? "btn-danger text-white" : "btn-outline-danger"}`}
                        onClick={() => setStatusFilter("Cancelled")}
                      >
                        Rejected
                        {statusCounts.cancelled > 0 && (
                          <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-dark" style={{ fontSize: '0.65rem' }}>
                            {statusCounts.cancelled}
                          </span>
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Search Box */}
              <div className="d-flex justify-content-end mb-4">
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

              {/* Booking Split Tab Content */}
              {activeTab === "Booking Split" && (
                <div className="mt-4">
                  <div className="alert alert-info mb-4">
                    <h5 className="mb-2">📋 Booking Split Management</h5>
                    <p className="mb-0">Split bookings functionality for managing passenger allocations and creating separate bookings from existing ones.</p>
                  </div>

                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead className="table-light">
                        <tr>
                          <th>Booking ID</th>
                          <th>Customer Name</th>
                          <th>Total PAX</th>
                          <th>Total Amount</th>
                          <th>Booking Date</th>
                          <th>Package Type</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredOrders.length > 0 ? (
                          paginatedOrders.map((order, index) => (
                            <tr key={index}>
                              <td className="fw-bold">{order.booking_number}</td>
                              <td>{order.person_details?.[0]?.first_name + ' ' + order.person_details?.[0]?.last_name || '-'}</td>
                              <td>
                                <span className="badge bg-info">{order.total_pax || 0} PAX</span>
                              </td>
                              <td className="fw-semibold">PKR {order.total_amount?.toLocaleString() || 0}</td>
                              <td>{order.created_at ? new Date(order.created_at).toLocaleDateString() : '-'}</td>
                              <td>
                                <span className="badge bg-secondary">{order.booking_type || 'N/A'}</span>
                              </td>
                              <td>
                                <span className={`badge ${order.status === 'Confirmed' || order.status === 'Approved' || order.status === 'Delivered' ? 'bg-success' :
                                  order.status === 'under-process' || order.status === 'Pending' ? 'bg-warning' :
                                    order.status === 'Canceled' || order.status === 'Rejected' ? 'bg-danger' : 'bg-secondary'
                                  }`}>
                                  {order.status}
                                </span>
                              </td>
                              <td>
                                <button className="btn btn-sm btn-primary me-2" onClick={() => handleOrderClick(order)}>
                                  View
                                </button>
                                <button className="btn btn-sm btn-outline-secondary" title="Split Booking">
                                  Split
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="8" className="text-center py-4">
                              No bookings available for splitting
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination for Booking Split */}
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
              )}

              {/* Regular Order List Table - Hide when Booking Split is active */}
              {activeTab !== "Booking Split" && (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead className="table-light">
                      <tr>
                        <th style={{ whiteSpace: 'nowrap' }}>Order ID</th>
                        <th>Order Type</th>
                        <th>Customer/Agent</th>
                        <th>Pax Count</th>
                        <th>Order Status</th>
                        <th>Payment Status</th>
                        <th>Delivery Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentItems.length > 0 ? (
                        currentItems.map((order, index) => (
                          <tr key={index}>
                            {/* Order ID */}
                            <td style={{ whiteSpace: 'nowrap' }}>
                              <button
                                className="btn btn-link p-0 text-decoration-underline text-primary fw-bol"
                                onClick={() => handleOrderClick(order)}
                              >
                                {order.booking_number}
                              </button>
                            </td>

                            {/* Order Type */}
                            <td>
                              <span className={`badge ${order.booking_type?.toLowerCase().includes('umrah') ? 'bg-primary' :
                                order.booking_type?.toLowerCase().includes('custom') ? 'bg-info' :
                                  order.booking_type?.toLowerCase().includes('group') ? 'bg-success' :
                                    order.booking_type?.toLowerCase().includes('ticket') ? 'bg-warning' : 'bg-secondary'
                                }`}>
                                {order.booking_type || 'N/A'}
                              </span>
                            </td>

                            {/* Customer / Agent / Branch Name */}
                            <td>
                              {order.is_public_booking ? (
                                <span className="text-primary">
                                  {order.contact_information?.[0]?.name || order.person_details?.[0]?.first_name || 'Customer'}
                                </span>
                              ) : order.agency ? (
                                <span className="text-success">
                                  {order.agency.ageny_name || order.agency.name || 'Agent'}
                                </span>
                              ) : order.employee ? (
                                <span className="text-info">
                                  {order.employee.name || 'Branch'}
                                </span>
                              ) : (
                                'N/A'
                              )}
                            </td>

                            {/* Pax Count (Adults / Children / Infants) */}
                            <td>
                              <div className="d-flex flex-column small">
                                <span>{order.total_pax || 0}</span>
                              </div>
                            </td>

                            {/* Order Status */}
                            <td>
                              <span
                                className={`badge bg-${order.status === 'Approved' ? 'success' :
                                  order.status === 'Confirmed' ? 'primary' :
                                    order.status === 'Delivered' ? 'info' :
                                      order.status === 'Rejected' ? 'danger' :
                                        order.status === 'under-process' ? 'warning' :
                                          'secondary'
                                  }`}
                                style={{ cursor: order.rejected_notes ? 'help' : 'default' }}
                                title={order.rejected_notes || ''}
                              >
                                {order.status || 'Pending'}
                              </span>
                            </td>

                            {/* Payment Status */}
                            <td>
                              <span className={`badge ${order.payment_status === 'Paid' || order.status === 'Confirmed' || order.status === 'Approved' ? 'bg-success' :
                                order.payment_status === 'Partial' ? 'bg-warning' :
                                  'bg-danger'
                                }`}>
                                {(order.status === 'Confirmed' || order.status === 'Approved') ? 'Paid' : (order.payment_status || 'Unpaid')}
                              </span>
                            </td>

                            {/* Delivery Status */}
                            <td>
                              <span className={`badge ${order.delivery_status === 'Delivered' || order.status === 'Delivered' ? 'bg-success' :
                                order.delivery_status === 'In Progress' ? 'bg-warning' :
                                  'bg-secondary'
                                }`}>
                                {order.delivery_status || (order.status === 'Delivered' ? 'Delivered' : 'Pending')}
                              </span>
                            </td>

                            {/* Actions */}
                            <td>
                              <Dropdown>
                                <Dropdown.Toggle variant="outline-primary" size="sm" className="py-0">
                                  <span style={{ fontSize: '0.85rem' }}>⚙️</span>
                                </Dropdown.Toggle>
                                <Dropdown.Menu>
                                  <Dropdown.Item onClick={() => handleOrderClick(order)}>
                                    View Details
                                  </Dropdown.Item>
                                  <Dropdown.Item className="text-primary">
                                    Reprice
                                  </Dropdown.Item>
                                  <Dropdown.Item className="text-info">
                                    Add Remark
                                  </Dropdown.Item>
                                  <Dropdown.Item className="text-warning">
                                    Follow Up
                                  </Dropdown.Item>
                                  <Dropdown.Item
                                    className="text-danger"
                                    onClick={() => {
                                      // Implement cancel logic or call a handler
                                      // Here we just use a placeholder for now or reuse logic if accessible
                                    }}
                                  >
                                    Cancel
                                  </Dropdown.Item>
                                </Dropdown.Menu>
                              </Dropdown>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="8" className="text-center py-4">
                            No orders found matching your filters.
                          </td>
                        </tr>
                      )}  </tbody>
                  </table>
                </div>
              )}

              {/* Pagination Controls */}
              {activeTab !== "Booking Split" && filteredOrders.length > itemsPerPage && (
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
            </>
          )}

          {/* Agencies View - Show only when viewMode is "agencies" */}
          {viewMode === "agencies" && (
            <>
              <h5 className="mb-4">Agency Order Statistics</h5>

              {/* Search by Agency Name */}
              <div className="mb-3">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by agency name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Agency Statistics Table */}
              <div className="table-responsive">
                <table className="table">
                  <thead className="table-light">
                    <tr>
                      <th>Agency Name</th>
                      <th>Contact Number</th>
                      <th>Agency Type</th>
                      <th>Total Bookings</th>
                      <th>Paid Bookings</th>
                      <th>Unpaid Bookings</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      // Calculate agency statistics
                      const agencyStats = agencies.map(agency => {
                        const agencyOrders = orders.filter(order => order.agency?.id === agency.id);
                        const totalBookings = agencyOrders.length;
                        const paidBookings = agencyOrders.filter(o =>
                          ["Confirmed", "Approved", "Delivered"].includes(o.status)
                        ).length;
                        const unpaidBookings = agencyOrders.filter(o =>
                          ["Un-approved", "Pending"].includes(o.status) ||
                          (o.status?.toLowerCase().includes("under") && o.status?.toLowerCase().includes("process"))
                        ).length;

                        return { ...agency, totalBookings, paidBookings, unpaidBookings };
                      });

                      // Filter by search term
                      const filteredAgencies = agencyStats.filter(agency =>
                        searchTerm === "" ||
                        (agency.name && agency.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                        (agency.agency_name && agency.agency_name.toLowerCase().includes(searchTerm.toLowerCase()))
                      );

                      // Pagination
                      const indexOfLastItem = currentPage * itemsPerPage;
                      const indexOfFirstItem = indexOfLastItem - itemsPerPage;
                      const currentAgencies = filteredAgencies.slice(indexOfFirstItem, indexOfLastItem);
                      const totalPages = Math.ceil(filteredAgencies.length / itemsPerPage);

                      if (currentAgencies.length === 0) {
                        return (
                          <tr>
                            <td colSpan="7" className="text-center py-4">
                              No agencies found
                            </td>
                          </tr>
                        );
                      }

                      return currentAgencies.map((agency) => (
                        <tr key={agency.id} style={agency.totalBookings === 0 ? { backgroundColor: '#ffe6e6' } : {}}>
                          <td>{agency.name || agency.agency_name || 'N/A'}</td>
                          <td>{agency.contact || agency.phone || 'N/A'}</td>
                          <td>
                            {(() => {
                              const agencyType = (agency.agency_type || agency.type || '').toLowerCase();
                              if (agencyType.includes('full') || agencyType === 'agent') {
                                return <span className="badge bg-primary">Full Agent</span>;
                              } else if (agencyType.includes('area')) {
                                return <span className="badge bg-info">Area Agent</span>;
                              } else {
                                return <span className="badge bg-secondary">Unknown</span>;
                              }
                            })()}
                          </td>
                          <td>
                            <span className={agency.totalBookings === 0 ? "badge bg-danger" : "badge bg-secondary"}>
                              {agency.totalBookings}
                            </span>
                          </td>
                          <td>
                            <span className="badge bg-success">{agency.paidBookings}</span>
                          </td>
                          <td>
                            <span className="badge bg-warning">{agency.unpaidBookings}</span>
                          </td>
                          <td>
                            <button
                              className="btn btn-sm btn-outline-primary me-2"
                              onClick={() => alert('Remarks feature coming soon!')}
                            >
                              Remarks
                            </button>
                            <button
                              className="btn btn-sm btn-outline-secondary"
                              onClick={() => alert('Follow-up feature coming soon!')}
                            >
                              Follow-up
                            </button>
                          </td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>

              {/* Pagination for Agencies */}
              {(() => {
                const agencyStats = agencies.map(agency => {
                  const agencyOrders = orders.filter(order => order.agency?.id === agency.id);
                  return { ...agency, totalBookings: agencyOrders.length };
                });
                const filteredAgencies = agencyStats.filter(agency =>
                  searchTerm === "" ||
                  (agency.name && agency.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                  (agency.agency_name && agency.agency_name.toLowerCase().includes(searchTerm.toLowerCase()))
                );
                const totalPages = Math.ceil(filteredAgencies.length / itemsPerPage);

                if (totalPages > 1) {
                  return (
                    <div className="d-flex justify-content-between align-items-center mt-4">
                      <div className="text-muted">
                        Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredAgencies.length)} of {filteredAgencies.length} agencies
                      </div>
                      <nav>
                        <ul className="pagination mb-0">
                          <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                            <button className="page-link" onClick={() => paginate(currentPage - 1)}>
                              <ChevronLeft size={14} />
                            </button>
                          </li>

                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber, i) => {
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
                  );
                }
                return null;
              })()}
            </>
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

