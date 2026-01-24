import React, { useState, useEffect } from "react";
import { Dropdown, Table, Button, Form, Modal } from "react-bootstrap";
import { Gear } from "react-bootstrap-icons";
import { ArrowBigLeft, Funnel, Search, UploadCloudIcon, Download } from "lucide-react";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import PaymentTabs from "../../components/PaymentTabs";
import { NavLink } from "react-router-dom";
import axios from "axios";

const Payment = () => {


  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    agencyCode: '',
    orderNo: '',
    fromDate: '',
    toDate: ''
  });

  // API Integration
  const [transactions, setTransactions] = useState([]);
  const [summaryData, setSummaryData] = useState({
    totalUmrah: 0,
    totalTickets: 0,
    totalNights: 0,
    shuttleNights: 0,
    closingBalance: 'PKR 0'
  });
  const [loading, setLoading] = useState(true);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Fetch ledger data from API
  useEffect(() => {
    const fetchLedger = async () => {
      try {
        const orgData = localStorage.getItem("selectedOrganization");
        const organizationId = orgData ? JSON.parse(orgData).id : null;
        const token = localStorage.getItem("accessToken");

        if (!organizationId || !token) {
          console.error("Missing organization ID or token");
          setLoading(false);
          return;
        }

        console.log("🔍 Fetching ledger for organization:", organizationId);

        const response = await axios.get(
          `http://127.0.0.1:8000/api/ledger/organization/${organizationId}/`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        console.log("✅ Organization Ledger API Response:", response.data);

        // Transform data
        const transformedTransactions = (response.data.entries || []).map(entry => {
          // Special handling for inter-org transactions
          let displayLine;

          if (entry.seller_organization_name && entry.inventory_owner_organization_name) {
            // This is an inter-org entry
            // If seller_organization matches current org, show the PAYABLE line (credit)
            // If inventory_owner matches current org, show the RECEIVABLE line (debit)
            if (entry.seller_organization === organizationId) {
              // This org is the reseller - show payable (credit) line
              displayLine = entry.lines?.find(line =>
                line.account.account_type === 'PAYABLE' && line.credit > 0
              );
            } else if (entry.inventory_owner_organization === organizationId) {
              // This org is the owner - show receivable (debit) line  
              displayLine = entry.lines?.find(line =>
                line.account.account_type === 'RECEIVABLE' && line.debit > 0
              );
            }
          }

          // Fallback to original logic if not inter-org or line not found
          if (!displayLine) {
            displayLine = entry.lines?.find(line => line.account.organization === organizationId) || entry.lines?.[0] || {};
          }

          return {
            date: new Date(entry.creation_datetime).toLocaleDateString('en-GB'),
            orderNo: entry.booking_no || entry.reference_no || '-------',
            type: entry.service_type || 'N/A',
            narration: entry.narration || 'No description',
            debit: displayLine.debit > 0 ? `PKR ${displayLine.debit.toLocaleString()}` : '-------',
            credit: displayLine.credit > 0 ? `PKR ${displayLine.credit.toLocaleString()}` : '-------',
            balance: `PKR ${(displayLine.final_balance || 0).toLocaleString()}`
          };
        });

        setTransactions(transformedTransactions);

        const summary = response.data.summary || {};
        setSummaryData({
          totalUmrah: response.data.service_breakdown?.find(s => s.service_type === 'umrah_package')?.count || 0,
          totalTickets: response.data.service_breakdown?.find(s => s.service_type === 'ticket')?.count || 0,
          totalNights: (response.data.entries || []).reduce((sum, e) => sum + (e.hotel_nights_count || 0), 0),
          shuttleNights: 0,
          closingBalance: `PKR ${(summary.net_balance || 0).toLocaleString()}`
        });

      } catch (error) {
        console.error("❌ Error fetching ledger:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLedger();
  }, []);

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
              <div className="row">
                <div className="d-flex flex-wrap justify-content-between align-items-center w-100">
                  <PaymentTabs activeName="Ledger" />

                  {/* Search Input */}
                  <div className="input-group" style={{ maxWidth: "300px" }}>
                    <span className="input-group-text">
                      <Search size={16} />
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search name, address, job, etc"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className=" min-vh-100">
                {/* Header */}
                <div className="bg-white rounded shadow-sm p-4 mb-4">
                  <h2 className="mb-4 fw-bold">Ledger</h2>

                  {/* Search Form */}
                  <div className="row g-3">
                    <div className="col-md-3">
                      <label htmlFor="" className="form-label">Agency Code</label>
                      <input
                        type="text"
                        className="form-control rounded shadow-none px-1 py-2"
                        name="agencyCode"
                        placeholder="Enter Agency Code"
                        value={formData.agencyCode}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="col-md-2">
                      <label htmlFor="" className="form-label">Order No.</label>
                      <input
                        type="text"
                        className="form-control rounded shadow-none px-1 py-2"
                        name="orderNo"
                        placeholder="Type Order No."
                        value={formData.orderNo}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="col-md-2">
                      <label htmlFor="" className="form-label">From Date</label>
                      <input
                        type="date"
                        className="form-control rounded shadow-none px-1 py-2"
                        name="fromDate"
                        value={formData.fromDate}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="col-md-2">
                      <label htmlFor="" className="form-label">To Date </label>
                      <input
                        type="date"
                        className="form-control rounded shadow-none px-1 py-2"
                        name="toDate"
                        value={formData.toDate}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="col-md-2">
                      <label className="form-label text-muted small">&nbsp;</label>
                      <button className="btn btn-primary w-100 d-block" style={{ background: "#09559B" }}>
                        Search
                      </button>
                    </div>
                  </div>
                </div>

                {/* Ledger Content */}
                <div className="bg-white rounded shadow-sm p-4">
                  {/* Ledger Header */}
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div>
                      <h4 className="mb-1">
                        Ledger <span className="text-primary fs-6 ms-3 small">Seer.pk</span>
                      </h4>
                      <p className="text-muted small mb-0">
                        12-jun-2023 to 15-april-2024
                      </p>
                    </div>
                    <div className="d-flex flex-wrap gap-2">
                      <button className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1">
                        <Download size={14} />
                        Export
                      </button>
                      <button className="btn btn-outline-secondary btn-sm">
                        Add Transaction
                      </button>
                      <button className="btn btn-outline-secondary btn-sm">
                        Edit Transaction
                      </button>
                    </div>
                  </div>

                  {/* Transaction Table */}
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead className="table-light">
                        <tr>
                          <th scope="col" className="text-muted small fw-normal">
                            Date
                          </th>
                          <th scope="col" className="text-muted small fw-normal">
                            Order No.
                          </th>
                          <th scope="col" className="text-muted small fw-normal">
                            Type
                          </th>
                          <th scope="col" className="text-muted small fw-normal">
                            Narration
                          </th>
                          <th scope="col" className="text-muted small fw-normal">
                            Debit
                          </th>
                          <th scope="col" className="text-muted small fw-normal">
                            Credit
                          </th>
                          <th scope="col" className="text-muted small fw-normal">
                            Balance
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map((transaction, index) => (
                          <tr key={index}>
                            <td className="small">{transaction.date}</td>
                            <td className="small">{transaction.orderNo}</td>
                            <td className="small">{transaction.type}</td>
                            <td className="small">{transaction.narration}</td>
                            <td className="small">{transaction.debit}</td>
                            <td className="small">{transaction.credit}</td>
                            <td className="small">{transaction.balance}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Summary Footer */}
                  <div className="row mt-4 pt-3 border-top">
                    <div className="col-md-8">
                      <div className="row text-center">
                        <div className="col-3">
                          <div className="text-muted small">Total Umrah</div>
                          <div className="fw-bold">{summaryData.totalUmrah}</div>
                        </div>
                        <div className="col-3">
                          <div className="text-muted small">Total Tickets</div>
                          <div className="fw-bold">{summaryData.totalTickets}</div>
                        </div>
                        <div className="col-3">
                          <div className="text-muted small">Total Nights</div>
                          <div className="fw-bold">{summaryData.totalNights}</div>
                        </div>
                        <div className="col-3">
                          <div className="text-muted small">Shuttle Nights</div>
                          <div className="fw-bold">{summaryData.shuttleNights}</div>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-4 text-end">
                      <div className="text-muted small">Closing Balance</div>
                      <div className="fw-bold fs-5">
                        {summaryData.closingBalance}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div >
  );
};

export default Payment;