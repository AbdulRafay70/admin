import React, { useState } from "react";
import Sidebar from "../../components/Sidebar";
import { Link, NavLink } from "react-router-dom";
import Header from "../../components/Header";
import { Search } from "lucide-react";
import { Gear } from "react-bootstrap-icons";
import { Button } from "react-bootstrap";

const BankAccountsScreen = () => {
  const tabs = [
    { name: "Ledger", path: "/payment", isActive: true },
    { name: "Add Payment", path: "/payment/add-payment", isActive: false },
    { name: "Bank Accounts", path: "/payment/bank-accounts", isActive: false },
    { name: "Kuickpay", path: "/payment/kuickpay", isActive: false },
    { name: "Pending Payments", path: "/payment/pending-payments", isActive: false },
    { name: "Booking History", path: "/payment/booking-history", isActive: false },
  ];

  const [searchTerm, setSearchTerm] = useState("");

  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    bankName: "",
    accountTitle: "",
    accountNumber: "",
    iban: "",
  });
  const bankAccounts = [
    {
      id: 1,
      bankName: "Faysal bank",
      accountTitle: "Saer.pk",
      accountNumber: "3302237082738",
      iban: "PK32022932037829 36",
    },
    {
      id: 2,
      bankName: "Meezan Bank",
      accountTitle: "Saer.pk",
      accountNumber: "3302237082738",
      iban: "PK32022932037829 36",
    },
    {
      id: 3,
      bankName: "Alfalah Bank",
      accountTitle: "Saer.pk",
      accountNumber: "3302237082738",
      iban: "PK32022932037829 36",
    },
  ];

  const toggleDropdown = (accountId) => {
    setDropdownOpen(dropdownOpen === accountId ? null : accountId);
  };

  const handleAction = (action, accountId) => {
    console.log(`${action} action for account ID: ${accountId}`);
    setDropdownOpen(null);
    // Add your action logic here
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("New bank account data:", formData);
    // Add your submit logic here
    setShowModal(false);
    setFormData({
      bankName: "",
      accountTitle: "",
      accountNumber: "",
      iban: "",
    });
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({
      bankName: "",
      accountTitle: "",
      accountNumber: "",
      iban: "",
    });
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
                        className={`nav-link btn btn-link text-decoration-none px-0 me-3 border-0 ${tab.name === "Bank Accounts"
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
              <div className="min-vh-100">
                <div className="row">
                  <div className="col-12 col-xl-12">
                    <div
                      className="card shadow-sm border-0"
                      onClick={() => setDropdownOpen(null)}
                    >
                      <div
                        className="card-body p-4"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <h4 className="card-title mb-4 fw-bold text-dark">
                          Bank Accounts Information
                        </h4>

                        <div className="table-responsive">
                          <table className="table table-borderless">
                            <thead>
                              <tr className="border-bottom">
                                <th className="fw-normal text-muted pb-3">
                                  Bank Name
                                </th>
                                <th className="fw-normal text-muted pb-3">
                                  Account Title
                                </th>
                                <th className="fw-normal text-muted pb-3">
                                  Account Number
                                </th>
                                <th className="fw-normal text-muted pb-3">IBAN</th>
                                <th className="fw-normal text-muted pb-3">
                                  Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {bankAccounts.map((account) => (
                                <tr key={account.id} className="border-bottom">
                                  <td className="py-3">
                                    <span
                                      className="fw-bold text-dark text-decoration-underline"
                                      style={{ cursor: "pointer" }}
                                    >
                                      {account.bankName}
                                    </span>
                                  </td>
                                  <td className="py-3 text-muted">
                                    {account.accountTitle}
                                  </td>
                                  <td className="py-3 text-dark">
                                    {account.accountNumber}
                                  </td>
                                  <td className="py-3 text-dark">{account.iban}</td>
                                  <td className="py-3">
                                    <div className="dropdown">
                                      <button
                                        className="btn btn-link p-0 text-primary"
                                        style={{ textDecoration: "none" }}
                                        onClick={() => toggleDropdown(account.id)}
                                      >
                                        <Gear />
                                      </button>
                                      {dropdownOpen === account.id && (
                                        <div
                                          className="dropdown-menu show position-absolute bg-white border rounded shadow-sm py-1"
                                          style={{
                                            right: 0,
                                            top: "100%",
                                            minWidth: "120px",
                                            zIndex: 1000,
                                          }}
                                        >
                                          <button
                                            className="dropdown-item py-2 px-3 border-0 bg-transparent w-100 text-start"
                                            onClick={() =>
                                              handleAction("edit", account.id)
                                            }
                                            style={{ color: "#1B78CE" }}
                                          >
                                            Edit
                                          </button>
                                          <button
                                            className="dropdown-item py-2 px-3 border-0 bg-transparent w-100 text-start text-danger"
                                            onClick={() =>
                                              handleAction("remove", account.id)
                                            }
                                          >
                                            Remove
                                          </button>
                                          <button
                                            className="dropdown-item py-2 px-3 border-0 bg-transparent w-100 text-start text-secondary"
                                            onClick={() =>
                                              handleAction("cancel", account.id)
                                            }
                                          >
                                            Cancel
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        <div className="d-flex justify-content-end mt-4">
                          <button
                            className="btn btn-primary px-4 py-2"
                            onClick={() => setShowModal(true)}
                          >
                            Add Bank Account
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modal */}
                {showModal && (
                  <div
                    className="modal show d-block"
                    tabIndex="-1"
                    style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
                  >
                    <div className="modal-dialog modal-dialog-centered">
                      <div className="modal-content">
                        <div className="modal-header border-bottom">
                          <h5 className="modal-title text-center fw-bold">
                            Add Bank Account
                          </h5>
                        </div>

                        <div className="modal-body p-4">
                          <form onSubmit={handleSubmit}>
                            <label htmlFor="" className="form-label">
                              Bank Name
                            </label>
                            <input
                              type="text"
                              className="form-control  shadow-none"
                              id="bankName"
                              name="bankName"
                              value={formData.bankName}
                              onChange={handleInputChange}
                              required
                              placeholder="Meezan Bank "
                            />

                            <label htmlFor="" className="form-label">
                              Account Title
                            </label>
                            <input
                              type="text"
                              className="form-control  shadow-none"
                              id="accountTitle"
                              name="accountTitle"
                              value={formData.accountTitle}
                              onChange={handleInputChange}
                              required
                              placeholder="Saer.pk"
                            />

                            <label htmlFor="" className="form-label">
                              Account Number
                            </label>
                            <input
                              type="text"
                              className="form-control  shadow-none"
                              id="accountNumber"
                              name="accountNumber"
                              value={formData.accountNumber}
                              onChange={handleInputChange}
                              required
                              placeholder="3302237082738"
                            />

                            <label htmlFor="" className="form-label">

                              IBAN
                            </label>
                            <input
                              type="text"
                              className="form-control  shadow-none"
                              id="iban"
                              name="iban"
                              value={formData.iban}
                              onChange={handleInputChange}
                              required
                              placeholder=" Pk3202293203782936"
                            />

                            <div className="d-flex justify-content-end mt-3 gap-2">
                              <button
                                type="submit"
                                className="btn btn-primary px-4"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                className="btn btn-light text-muted px-4"
                                onClick={handleCloseModal}
                              >
                                Cancel
                              </button>
                            </div>
                          </form>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BankAccountsScreen;
