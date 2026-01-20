import React, { useState } from 'react';
import { Search, DollarSign, Package, User, Calendar, CreditCard, CheckCircle, Clock, XCircle, Eye, ChevronDown } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

const PublicUserDashboard = () => {
    // Mock users list for search dropdown
    const [allUsers] = useState([
        { id: 1, name: 'John Doe', email: 'john.doe@gmail.com', phone: '+92 300 1234567', address: '123 Main Street, Block A, Karachi' },
        { id: 2, name: 'Jane Smith', email: 'jane.smith@gmail.com', phone: '+92 301 2345678', address: '456 Park Avenue, Lahore' },
        { id: 3, name: 'Ahmed Khan', email: 'ahmed.khan@gmail.com', phone: '+92 302 3456789', address: '789 Garden Road, Islamabad' },
        { id: 4, name: 'Sara Ali', email: 'sara.ali@gmail.com', phone: '+92 303 4567890', address: '321 Lake View, Karachi' },
        { id: 5, name: 'Ali Raza', email: 'ali.raza@gmail.com', phone: '+92 304 5678901', address: '654 Hill Street, Rawalpindi' },
        { id: 6, name: 'Fatima Hassan', email: 'fatima.hassan@yahoo.com', phone: '+92 305 6789012', address: '987 Ocean Drive, Karachi' },
        { id: 7, name: 'Muhammad Usman', email: 'usman.m@hotmail.com', phone: '+92 306 7890123', address: '234 Valley Road, Multan' },
        { id: 8, name: 'Ayesha Malik', email: 'ayesha.malik@outlook.com', phone: '+92 307 8901234', address: '567 Mountain View, Peshawar' },
        { id: 9, name: 'Hassan Mahmood', email: 'hassan.m@gmail.com', phone: '+92 308 9012345', address: '890 River Side, Faisalabad' },
        { id: 10, name: 'Zainab Ahmed', email: 'zainab.ahmed@gmail.com', phone: '+92 309 0123456', address: '123 Sunset Boulevard, Lahore' },
        { id: 11, name: 'Omar Farooq', email: 'omar.farooq@yahoo.com', phone: '+92 310 1234567', address: '456 Green Avenue, Islamabad' },
        { id: 12, name: 'Mariam Khan', email: 'mariam.k@gmail.com', phone: '+92 311 2345678', address: '789 Palm Street, Karachi' },
        { id: 13, name: 'Bilal Sheikh', email: 'bilal.sheikh@hotmail.com', phone: '+92 312 3456789', address: '321 Rose Garden, Sialkot' },
        { id: 14, name: 'Hira Siddiqui', email: 'hira.siddiqui@outlook.com', phone: '+92 313 4567890', address: '654 Maple Road, Gujranwala' },
        { id: 15, name: 'Imran Malik', email: 'imran.malik@gmail.com', phone: '+92 314 5678901', address: '987 Cedar Lane, Quetta' },
    ]);


    const [selectedUser, setSelectedUser] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const [orderSearchQuery, setOrderSearchQuery] = useState('');

    // Mock data for demonstration (will be loaded after user selection)
    const [userActivities] = useState([
        { id: 1, action: 'Searched for Umrah packages', date: '2024-01-18 10:30 AM', details: 'Makkah to Madinah' },
        { id: 2, action: 'Viewed package details', date: '2024-01-18 10:45 AM', details: 'Premium Umrah Package' },
        { id: 3, action: 'Added to cart', date: '2024-01-18 11:00 AM', details: 'Package #1234' },
        { id: 4, action: 'Searched for hotels', date: '2024-01-17 03:20 PM', details: 'Makkah hotels near Haram' },
    ]);

    const [paymentRecords] = useState([
        { id: 1, amount: 'PKR 250,000', method: 'Credit Card', date: '2024-01-18', status: 'Completed', transactionId: 'TXN123456' },
        { id: 2, amount: 'PKR 150,000', method: 'Bank Transfer', date: '2024-01-15', status: 'Completed', transactionId: 'TXN123455' },
        { id: 3, amount: 'PKR 50,000', method: 'JazzCash', date: '2024-01-10', status: 'Pending', transactionId: 'TXN123454' },
    ]);

    const [orders] = useState([
        { id: 1, orderNumber: 'ORD-2024-001', package: 'Premium Umrah Package', date: '2024-01-18', status: 'Confirmed', amount: 'PKR 250,000' },
        { id: 2, orderNumber: 'ORD-2024-002', package: 'Economy Umrah Package', date: '2024-01-15', status: 'Pending', amount: 'PKR 150,000' },
        { id: 3, orderNumber: 'ORD-2024-003', package: 'Deluxe Umrah Package', date: '2024-01-10', status: 'Completed', amount: 'PKR 350,000' },
    ]);

    const [userDetails, setUserDetails] = useState(null);

    // Filter users based on search query
    const filteredUsers = allUsers.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.phone.includes(searchQuery) ||
        user.address.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Filter orders based on search query
    const filteredOrders = orders.filter(order =>
        order.orderNumber.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
        order.package.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
        order.amount.toLowerCase().includes(orderSearchQuery.toLowerCase())
    );

    const handleUserSelect = (user) => {
        setSelectedUser(user);
        setSearchQuery(user.name);
        setShowDropdown(false);

        // Load user data
        setUserDetails({
            name: user.name,
            email: user.email,
            phone: user.phone,
            address: user.address,
            city: 'Karachi',
            memberSince: 'January 2024',
            totalBookings: 3,
            totalSpent: 'PKR 750,000',
        });
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            Completed: { color: '#10b981', icon: CheckCircle, bg: '#d1fae5' },
            Confirmed: { color: '#3b82f6', icon: CheckCircle, bg: '#dbeafe' },
            Pending: { color: '#f59e0b', icon: Clock, bg: '#fef3c7' },
            Cancelled: { color: '#ef4444', icon: XCircle, bg: '#fee2e2' },
        };

        const config = statusConfig[status] || statusConfig.Pending;
        const Icon = config.icon;

        return (
            <span
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '13px',
                    fontWeight: '600',
                    backgroundColor: config.bg,
                    color: config.color,
                }}
            >
                <Icon size={14} />
                {status}
            </span>
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
                            <div style={{ padding: '2rem', background: '#f8f9fa', minHeight: '100vh' }}>
                                <style>{`
        .dashboard-header {
          margin-bottom: 2rem;
        }
        
        .dashboard-title {
          font-size: 2rem;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 0.5rem;
        }
        
        .dashboard-subtitle {
          color: #6c757d;
          font-size: 1rem;
        }
        
        .section-card {
          background: white;
          border-radius: 16px;
          padding: 1.5rem;
          margin-bottom: 2rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }
        
        .section-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid #f0f0f0;
        }
        
        .section-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: linear-gradient(135deg, #1B78CE 0%, #1557a0 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }
        
        .section-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: #2d3748;
          margin: 0;
        }
        
        .data-table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .data-table thead th {
          text-align: left;
          padding: 12px;
          font-size: 0.85rem;
          font-weight: 600;
          color: #6c757d;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 2px solid #e2e8f0;
        }
        
        .data-table tbody td {
          padding: 14px 12px;
          border-bottom: 1px solid #f0f0f0;
          color: #2d3748;
          font-size: 0.95rem;
        }
        
        .data-table tbody tr:hover {
          background: #f7fafc;
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
        }
        
        .info-item {
          background: #f7fafc;
          padding: 1.25rem;
          border-radius: 12px;
          border-left: 4px solid #1B78CE;
        }
        
        .info-label {
          font-size: 0.85rem;
          font-weight: 600;
          color: #718096;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 0.5rem;
        }
        
        .info-value {
          font-size: 1.05rem;
          color: #2d3748;
          font-weight: 500;
        }
        
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }
        
        .stat-card {
          background: white;
          padding: 1.5rem;
        //   border-radius: 12px;
        //   box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          border-left: 4px solid #1B78CE;
        }
        
        .stat-label {
          font-size: 0.85rem;
          color: #6c757d;
          margin-bottom: 0.5rem;
        }
        
        .stat-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1a1a1a;
        }
        
        .search-container {
          position: relative;
          max-width: 600px;
          margin-bottom: 2rem;
        }
        
        .search-input-wrapper {
          position: relative;
        }
        
        .search-input {
          width: 100%;
          padding: 14px 45px 14px 16px;
          font-size: 15px;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          outline: none;
          background: white;
          transition: all 0.3s ease;
        }
        
        .search-input:focus {
          border-color: #1B78CE;
          box-shadow: 0 0 0 3px rgba(27, 120, 206, 0.1);
        }
        
        .search-icon {
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: #718096;
        }
        
        .dropdown-menu-custom {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: white;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          margin-top: 8px;
          max-height: 300px;
          overflow-y: auto;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          z-index: 1000;
        }
        
        .dropdown-item-custom {
          padding: 12px 16px;
          cursor: pointer;
          border-bottom: 1px solid #f0f0f0;
          transition: background 0.2s ease;
        }
        
        .dropdown-item-custom:last-child {
          border-bottom: none;
        }
        
        .dropdown-item-custom:hover {
          background: #f7fafc;
        }
        
        .dropdown-item-name {
          font-weight: 600;
          color: #2d3748;
          margin-bottom: 4px;
        }
        
        .dropdown-item-details {
          font-size: 13px;
          color: #718096;
        }
        
        .no-results {
          padding: 20px;
          text-align: center;
          color: #718096;
        }
        
        .empty-state {
          text-align: center;
          padding: 4rem 2rem;
          background: white;
          border-radius: 16px;
          margin: 2rem 0;
        }
        
        .empty-state-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
          opacity: 0.3;
        }
        
        .empty-state-text {
          font-size: 1.2rem;
          color: #4a5568;
          font-weight: 500;
        }
        
        .order-search-wrapper {
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .order-search-input {
          flex: 1;
          max-width: 400px;
          padding: 10px 16px;
          font-size: 14px;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          outline: none;
          transition: all 0.3s ease;
        }
        
        .order-search-input:focus {
          border-color: #1B78CE;
          box-shadow: 0 0 0 3px rgba(27, 120, 206, 0.1);
        }
      `}</style>

                                {/* Search User Dropdown */}
                                <div className="search-container">
                                    <div className="search-input-wrapper">
                                        <input
                                            type="text"
                                            className="search-input"
                                            placeholder="Search user by name, email, phone, or address..."
                                            value={searchQuery}
                                            onChange={(e) => {
                                                setSearchQuery(e.target.value);
                                                setShowDropdown(true);
                                            }}
                                            onFocus={() => setShowDropdown(true)}
                                        />
                                        <Search className="search-icon" size={20} />
                                    </div>

                                    {showDropdown && searchQuery && (
                                        <div className="dropdown-menu-custom">
                                            {filteredUsers.length > 0 ? (
                                                filteredUsers.map((user) => (
                                                    <div
                                                        key={user.id}
                                                        className="dropdown-item-custom"
                                                        onClick={() => handleUserSelect(user)}
                                                    >
                                                        <div className="dropdown-item-name">{user.name}</div>
                                                        <div className="dropdown-item-details">
                                                            {user.email} • {user.phone}
                                                        </div>
                                                        <div className="dropdown-item-details">{user.address}</div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="no-results">No users found</div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {!selectedUser ? (
                                    <div className="empty-state">
                                        <div className="empty-state-icon">👤</div>
                                        <div className="empty-state-text">Please select a user to view their dashboard</div>
                                    </div>
                                ) : (
                                    <>
                                        {/* Header */}
                                        <div className="dashboard-header">
                                            <h1 className="dashboard-title">Public User Dashboard</h1>
                                            <p className="dashboard-subtitle">Complete overview of user activity and information</p>
                                        </div>

                                        {/* Quick Stats */}
                                        <div className="stats-grid">
                                            <div className="stat-card">
                                                <div className="stat-label">Total Bookings</div>
                                                <div className="stat-value">{userDetails?.totalBookings || 0}</div>
                                            </div>
                                            <div className="stat-card">
                                                <div className="stat-label">Total Spent</div>
                                                <div className="stat-value">{userDetails?.totalSpent || 'PKR 0'}</div>
                                            </div>
                                            <div className="stat-card">
                                                <div className="stat-label">Member Since</div>
                                                <div className="stat-value">{userDetails?.memberSince || 'N/A'}</div>
                                            </div>
                                        </div>

                                        {/* User Details Section */}
                                        <div className="section-card">
                                            <div className="section-header">
                                                <div className="section-icon">
                                                    <User size={22} />
                                                </div>
                                                <h2 className="section-title">User Details</h2>
                                            </div>
                                            <div className="info-grid">
                                                <div className="info-item">
                                                    <div className="info-label">Full Name</div>
                                                    <div className="info-value">{userDetails.name}</div>
                                                </div>
                                                <div className="info-item">
                                                    <div className="info-label">Email</div>
                                                    <div className="info-value">{userDetails.email}</div>
                                                </div>
                                                <div className="info-item">
                                                    <div className="info-label">Phone</div>
                                                    <div className="info-value">{userDetails.phone}</div>
                                                </div>
                                                <div className="info-item">
                                                    <div className="info-label">Address</div>
                                                    <div className="info-value">{userDetails.address}</div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* User Activity Records */}
                                        <div className="section-card">
                                            <div className="section-header">
                                                <div className="section-icon">
                                                    <Search size={22} />
                                                </div>
                                                <h2 className="section-title">User Activity Records</h2>
                                            </div>
                                            <table className="data-table">
                                                <thead>
                                                    <tr>
                                                        <th>Action</th>
                                                        <th>Details</th>
                                                        <th>Date & Time</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {userActivities.map((activity) => (
                                                        <tr key={activity.id}>
                                                            <td style={{ fontWeight: '500' }}>{activity.action}</td>
                                                            <td>{activity.details}</td>
                                                            <td>{activity.date}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Payment Records */}
                                        <div className="section-card">
                                            <div className="section-header">
                                                <div className="section-icon">
                                                    <DollarSign size={22} />
                                                </div>
                                                <h2 className="section-title">Payment Records</h2>
                                            </div>
                                            <table className="data-table">
                                                <thead>
                                                    <tr>
                                                        <th>Transaction ID</th>
                                                        <th>Amount</th>
                                                        <th>Payment Method</th>
                                                        <th>Date</th>
                                                        <th>Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {paymentRecords.map((payment) => (
                                                        <tr key={payment.id}>
                                                            <td style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>{payment.transactionId}</td>
                                                            <td style={{ fontWeight: '600' }}>{payment.amount}</td>
                                                            <td>{payment.method}</td>
                                                            <td>{payment.date}</td>
                                                            <td>{getStatusBadge(payment.status)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Order Status */}
                                        <div className="section-card">
                                            <div className="section-header">
                                                <div className="section-icon">
                                                    <Package size={22} />
                                                </div>
                                                <h2 className="section-title">Order Status</h2>
                                            </div>

                                            {/* Order Search */}
                                            <div className="order-search-wrapper">
                                                <Search size={18} style={{ color: '#718096' }} />
                                                <input
                                                    type="text"
                                                    className="order-search-input"
                                                    placeholder="Search by order number, package, or amount..."
                                                    value={orderSearchQuery}
                                                    onChange={(e) => setOrderSearchQuery(e.target.value)}
                                                />
                                            </div>

                                            <table className="data-table">
                                                <thead>
                                                    <tr>
                                                        <th>Order Number</th>
                                                        <th>Package</th>
                                                        <th>Amount</th>
                                                        <th>Date</th>
                                                        <th>Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {filteredOrders.length > 0 ? (
                                                        filteredOrders.map((order) => (
                                                            <tr key={order.id}>
                                                                <td style={{ fontFamily: 'monospace', fontSize: '0.9rem', fontWeight: '600' }}>{order.orderNumber}</td>
                                                                <td>{order.package}</td>
                                                                <td style={{ fontWeight: '600' }}>{order.amount}</td>
                                                                <td>{order.date}</td>
                                                                <td>{getStatusBadge(order.status)}</td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#718096' }}>
                                                                No orders found matching your search
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
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

export default PublicUserDashboard;
