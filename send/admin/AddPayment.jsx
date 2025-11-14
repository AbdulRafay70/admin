import React, { useState } from "react";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import { Link, NavLink } from "react-router-dom";
import { Search } from "lucide-react";

const AddDepositForm = () => {
    const tabs = [
    { name: "Ledger", path: "/payment", isActive: true },
    { name: "Add Payment", path: "/payment/add-payment", isActive: false },
    { name: "Bank Accounts", path: "/payment/bank-accounts", isActive: false },
      { name: "Kuickpay", path: "/payment/kuickpay", isActive: false },
    { name: "Pending Payments", path: "/payment/pending-payments", isActive: false },
    { name: "Booking History", path: "/payment/booking-history", isActive: false },
  ];

  const [formData, setFormData] = useState({
    modeOfPayment: "1Bill",
    beneficiaryAccount: "1Bill",
    agentAccount: "1Bill",
    amount: "",
    date: "Fri 12/2023",
    notes: "",
    agencyCode: "",
  });

  const [searchTerm, setSearchTerm] = useState("");

  const [transactions] = useState([
    {
      date: "12-June-2024",
      transType: "SPKCS0",
      beneficiaryAc: "Mr. Ahsan Raza",
      agentAccount: "see",
      amount: "02-JUNE-2024",
      status: "Approved",
      slip: "see",
    },
    {
      date: "12-June-2024",
      transType: "SPKCS0",
      beneficiaryAc: "Mr. Ahsan Raza",
      agentAccount: "see",
      amount: "02-JUNE-2024",
      status: "Active",
      slip: "see",
    }, {
      date: "12-June-2024",
      transType: "SPKCS0",
      beneficiaryAc: "Mr. Ahsan Raza",
      agentAccount: "see",
      amount: "02-JUNE-2024",
      status: "Approved",
      slip: "see",
    }, {
      date: "12-June-2024",
      transType: "SPKCS0",
      beneficiaryAc: "Mr. Ahsan Raza",
      agentAccount: "see",
      amount: "02-JUNE-2024",
      status: "Inactive",
      slip: "see",
    },
  ]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
    // Add your form submission logic here
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Approved":
        return <span className="rounded-5 p-1" style={{ background: "#ECFDF3", color: "#037847" }}>● Approved</span>;
      case "Inactive":
        return <span className="rounded-5 p-1" style={{ background: "#F2F4F7", color: "#364254" }}>● Inactive</span>;
      case "Active":
        return <span className="rounded-5 p-1" style={{ background: "#ECFDF3", color: "#037847" }}>● Active</span>;
      default:
        return <span className="badge bg-light text-dark">{status}</span>;
    }
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
              {/* Navigation Tabs */}
              <nav className="nav flex-wrap gap-2">
                {tabs.map((tab, index) => (
                  <NavLink
                    key={index}
                    to={tab.path}
                    className={`nav-link btn btn-link text-decoration-none px-0 me-3 border-0 ${tab.name === "Add Payment"
                      ? "text-primary fw-semibold"
                      : "text-muted"
                      }`}
                    style={{ backgroundColor: "transparent" }}
                  >
                    {tab.name}
                  </NavLink>
                ))}
              </nav>

              {/* Action Buttons */}
              <div className="input-group" style={{ maxWidth: "300px" }}>
                <span className="input-group-text">
                  <Search />
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

          <div className="card shadow-sm border-0 rounded-3">
            <div className="card-header border-0 bg-white">
              <h4 className="mb-0">Add Deposit</h4>
            </div>

            <div className="card-body">
              <form>
                <div className="row mb-3">
                  <div className="col-md-2">
                    <label htmlFor="" className="form-label">
                      Mode Of Payment
                    </label>
                    <select
                      className="form-select shadow-none"
                      name="modeOfPayment"
                      value={formData.modeOfPayment}
                      onChange={handleInputChange}
                    >
                      <option value="1Bill">1Bill</option>
                      <option value="Cash">Cash</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                    </select>
                  </div>

                  <div className="col-md-3">
                    <label htmlFor="" className="form-label">
                      Beneficiary Account
                    </label>
                    <select
                      className="form-select shadow-none"
                      name="beneficiaryAccount"
                      value={formData.beneficiaryAccount}
                      onChange={handleInputChange}
                    >
                      <option value="1Bill">1Bill</option>
                      <option value="Account 2">Account 2</option>
                      <option value="Account 3">Account 3</option>
                    </select>
                  </div>

                  <div className="col-md-3">
                    <label htmlFor="" className="form-label">
                      Agent Account
                    </label>
                    <select
                      className="form-select shadow-none"
                      name="agentAccount"
                      value={formData.agentAccount}
                      onChange={handleInputChange}
                    >
                      <option value="1Bill">1Bill</option>
                      <option value="Agent 2">Agent 2</option>
                      <option value="Agent 3">Agent 3</option>
                    </select>
                  </div>

                  <div className="col-md-2">
                    <label htmlFor="" className="form-label">
                      Amount
                    </label>
                    <input
                      type="text"
                      className="form-control shadow-none"
                      name="amount"
                      placeholder="Type Rs.100,000/"
                      value={formData.amount}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="col-md-2 d-flex align-items-end">
                    <button type="button" className="btn btn-primary w-100">
                      Upload Slip
                    </button>
                  </div>
                </div>

                <div className="row mb-3">
                  <div className="col-md-3">
                    <label htmlFor="" className="form-label">
                      Date
                    </label>
                    <input
                      type="date"
                      className="form-control shadow-none"
                      name="date"
                      value={formData.date}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="col-md-5">
                    <label htmlFor="" className="form-label">
                      Notes
                    </label>
                    <textarea
                      className="form-control shadow-none"
                      name="notes"
                      rows="1"
                      placeholder="Type Note"
                      value={formData.notes}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="col-md-2">
                    <label htmlFor="" className="form-label">
                      Agency Code
                    </label>
                    <input
                      type="text"
                      className="form-control shadow-none"
                      name="agencyCode"
                      placeholder="Enter Agency Code"
                      value={formData.agencyCode}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="col-md-2 d-flex align-items-end">
                    <button
                      type="button"
                      className="btn btn-sm w-100"
                      id="btn"
                      onClick={handleSubmit}
                    >
                      Add Deposit
                    </button>
                  </div>
                </div>
              </form>

              {/* Rules Section */}
              <div className="mt-4">
                <ol className="list-unstyled">
                  <li>1. rules</li>
                  <li>2. rule 2</li>
                  <li>3. rules 3</li>
                  <li>4. adiqjk2cc</li>
                </ol>
              </div>
            </div>

            {/* Transaction Table */}

            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead className="table-light">
                    <tr>
                      <th className="fw-normal text-muted">Date</th>
                      <th className="fw-normal text-muted">Trans Type</th>
                      <th className="fw-normal text-muted">Beneficiary ac</th>
                      <th className="fw-normal text-muted">Agent Account</th>
                      <th className="fw-normal text-muted">Amount</th>
                      <th className="fw-normal text-muted">Status</th>
                      <th className="fw-normal text-muted">slip</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((transaction, index) => (
                      <tr key={index}>
                        <td>{transaction.date}</td>
                        <td>{transaction.transType}</td>
                        <td>{transaction.beneficiaryAc}</td>
                        <td>{transaction.agentAccount}</td>
                        <td>{transaction.amount}</td>
                        <td>{getStatusBadge(transaction.status)}</td>
                        <td>{transaction.slip}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div >
    </div >
    </div>
    </div>
  );
};

export default AddDepositForm;
