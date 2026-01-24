import React, { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import {
  Search,
  Funnel,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { Dropdown } from "react-bootstrap";
import { Gear } from "react-bootstrap-icons";
import axios from "axios";

const PendingPayments = () => {
  const location = useLocation();
  const tabs = [
    { name: "Ledger", path: "/payment", isActive: true },
    { name: "Add Payment", path: "/payment/add-payment", isActive: false },
    { name: "Bank Accounts", path: "/payment/bank-accounts", isActive: false },
    { name: "Pending Payments", path: "/payment/pending-payments", isActive: false },
    { name: "Booking History", path: "/payment/booking-history", isActive: false },
  ];

  const statusOptions = ["Pending", "Reminders", "Cancel"];
  const [statusFilter, setStatusFilter] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch pending payments from API
  useEffect(() => {
    const fetchPendingPayments = async () => {
      try {
        const orgData = localStorage.getItem("selectedOrganization");
        const organizationId = orgData ? JSON.parse(orgData).id : null;
        const token = localStorage.getItem("accessToken");

        if (!organizationId || !token) {
          console.error("Missing organization ID or token");
          setLoading(false);
          return;
        }

        console.log("🔍 Fetching pending payments for organization:", organizationId);

        const response = await axios.get(
          `http://127.0.0.1:8000/api/bookings/unpaid/${organizationId}/`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        console.log("✅ Pending Payments API Response:", response.data);

        // Transform data to match the UI structure
        const transformedPayments = (response.data.unpaid_bookings || []).map(booking => ({
          id: booking.booking_id,
          bookingNo: booking.booking_no,
          agentId: booking.agency_code || "N/A",
          agencyName: booking.agency_name || "N/A",
          agentName: booking.customer_name || "N/A",
          pendingBalance: `PKR ${(booking.pending_payment || 0).toLocaleString()}`,
          totalAmount: booking.total_amount || 0,
          paidAmount: booking.paid_payment || 0,
          pendingAmount: booking.pending_payment || 0,
          status: booking.status || "pending",
          expiryTime: booking.expiry_time,
          callStatus: booking.call_status,
          clientNote: booking.client_note
        }));

        setPayments(transformedPayments);
        setError(null);
      } catch (error) {
        console.error("❌ Error fetching pending payments:", error);
        setError("Failed to load pending payments. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchPendingPayments();
  }, []);

  const filteredPayments = payments.filter((payment) => {
    const matchesStatus =
      selectedFilter === "all" || payment.status === selectedFilter;
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      payment.agentId.toString().includes(searchLower) ||
      payment.agencyName.toLowerCase().includes(searchLower) ||
      payment.agentName.toLowerCase().includes(searchLower) ||
      payment.bookingNo.toLowerCase().includes(searchLower);

    return matchesStatus && matchesSearch;
  });

  const handleFilterChange = (filterValue) => setSelectedFilter(filterValue);

  const handleAction = (action, paymentId = null) => {
    console.log(
      `${action} action triggered`,
      paymentId ? `for payment ${paymentId}` : ""
    );
  };

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
            <div className="px-3 px-lg-4 my-3">
              {/* Navigation Tabs */}
              <div className="row ">
                <div className="d-flex flex-wrap justify-content-between align-items-center w-100">
                  <nav className="nav flex-wrap gap-2">
                    {tabs.map((tab, index) => (
                      <NavLink
                        key={index}
                        to={tab.path}
                        className={`nav-link btn btn-link text-decoration-none px-0 me-3 ${tab.name === "Pending Payments"
                          ? "text-primary fw-semibold"
                          : "text-muted"
                          }`}
                        style={{ backgroundColor: "transparent" }}
                      >
                        {tab.name}
                      </NavLink>
                    ))}
                  </nav>

                  <div className="input-group" style={{ maxWidth: "300px" }}>
                    <span className="input-group-text">
                      <Search size={16} />
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search agent ID, agency, name, etc"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="container-fluid p-4 rounded-4 shadow-sm">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h3 className="mb-0">All Pending Payments</h3>

                  <div className="dropdown border border-black rounded">
                    <Dropdown>
                      <Dropdown.Toggle variant="">
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
                            {status}
                          </Dropdown.Item>
                        ))}
                      </Dropdown.Menu>
                    </Dropdown>
                  </div>
                </div>

                {loading ? (
                  <div className="text-center py-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="text-muted mt-2">Loading pending payments...</p>
                  </div>
                ) : error ? (
                  <div className="alert alert-danger" role="alert">
                    {error}
                  </div>
                ) : (
                  <>
                    <div className="table-responsive">
                      <table className="table table-hover text-center">
                        <thead className="">
                          <tr>
                            <th>Booking No.</th>
                            <th>Agency Code</th>
                            <th>Agency Name</th>
                            <th>Customer Name</th>
                            <th>Total Amount</th>
                            <th>Paid Amount</th>
                            <th>Pending Balance</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredPayments.map((payment) => (
                            <tr key={payment.id}>
                              <td className="fw-bold text-primary">{payment.bookingNo}</td>
                              <td>{payment.agentId}</td>
                              <td>{payment.agencyName}</td>
                              <td>{payment.agentName}</td>
                              <td>PKR {payment.totalAmount.toLocaleString()}</td>
                              <td className="text-success">PKR {payment.paidAmount.toLocaleString()}</td>
                              <td className="fw-bold text-danger">
                                {payment.pendingBalance}
                              </td>
                              <td>
                                <Dropdown>
                                  <Dropdown.Toggle
                                    variant="link"
                                    className="text-decoration-none p-0"
                                  >
                                    <Gear size={18} />
                                  </Dropdown.Toggle>
                                  <Dropdown.Menu>
                                    <Dropdown.Item className="text-primary">
                                      Add payment
                                    </Dropdown.Item>
                                    <Dropdown.Item className="text-primary">
                                      Add Notes
                                    </Dropdown.Item>
                                    <Dropdown.Item className="text-danger">Cancel</Dropdown.Item>
                                  </Dropdown.Menu>
                                </Dropdown>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {filteredPayments.length === 0 && (
                      <div className="text-center py-4">
                        <p className="text-muted">
                          No pending payments found for the selected filter.
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PendingPayments;
