import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Table, Badge, InputGroup, Row, Col, Card, Spinner, Alert, Toast, ToastContainer } from 'react-bootstrap';
import { User, Users, Database, GitBranch, BookOpen, Phone, Mail, MapPin, Search, Download, Plus, Edit, Trash2, Eye, FileText, Upload, CheckCircle, XCircle } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import CRMTabs from '../../components/CRMTabs';
import { usePermission } from '../../contexts/EnhancedPermissionContext';
import LeadManagement from './LeadManagement';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

const CustomerManagement = () => {
  // Permission hook
  const { hasPermission } = usePermission();

  // Get auth token
  const token = localStorage.getItem('accessToken');

  // State management
  const [crmActive, setCrmActive] = useState('Customers');
  const [activeMainTab, setActiveMainTab] = useState('walk-in');
  const [activeSubTab, setActiveSubTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Toast notification state
  const [toast, setToast] = useState({ show: false, message: '', variant: 'success' });

  // Sorting state
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  // Form state
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    city: '',
    source: 'Walk-in'
  });

  // Walk-in customers data
  const [customers, setCustomers] = useState([]);

  // Auto-collected customers data (from APIs)
  const [allCustomers, setAllCustomers] = useState([]);

  // Statistics
  const stats = {
    totalCustomers: customers.length,
    activeCustomers: customers.filter(c => c.is_active).length,
    inactiveCustomers: customers.filter(c => !c.is_active).length,
    totalRevenue: 0 // Can be calculated from bookings if needed
  };

  const dbStats = {
    totalCustomers: allCustomers.length,
    fromBookings: allCustomers.filter(c => c.source?.includes('Booking')).length,
    fromLeads: allCustomers.filter(c => c.source === 'Passport Lead').length,
    fromBranch: allCustomers.filter(c => c.source === 'Area Branch').length,
    fromWalkIn: allCustomers.filter(c => c.source === 'Walk-in').length
  };

  // Filter functions
  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = 
      (customer.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (customer.phone || '').includes(searchTerm) ||
      (customer.email?.toLowerCase() || '').includes(searchTerm.toLowerCase());

    if (activeSubTab === 'all') return matchesSearch;
    if (activeSubTab === 'active') return matchesSearch && customer.is_active;
    if (activeSubTab === 'inactive') return matchesSearch && !customer.is_active;
    return matchesSearch;
  });

  const filteredAllCustomers = allCustomers
    .filter(customer => {
      const matchesSearch = 
        (customer.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (customer.phone || '').includes(searchTerm) ||
        (customer.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (customer.city?.toLowerCase() || '').includes(searchTerm.toLowerCase());

      if (activeSubTab === 'all') return matchesSearch;
      if (activeSubTab === 'booking') return matchesSearch && customer.source?.includes('Booking');
      if (activeSubTab === 'leads') return matchesSearch && (customer.source === 'Passport Lead' || customer.source === 'Lead');
      if (activeSubTab === 'branch') return matchesSearch && (customer.source === 'Area Branch' || customer.source?.includes('Branch'));
      return matchesSearch;
    })
    .sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];
      
      // Handle null/undefined values
      if (!aVal) aVal = '';
      if (!bVal) bVal = '';
      
      // Date sorting
      if (sortBy === 'created_at' || sortBy === 'updated_at' || sortBy === 'last_activity') {
        aVal = new Date(aVal).getTime() || 0;
        bVal = new Date(bVal).getTime() || 0;
      }
      
      // String comparison
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortOrder === 'asc' 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      
      // Numeric comparison
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });

  // Event handlers
  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const resetForm = () => {
    setFormData({
      full_name: '',
      phone: '',
      email: '',
      city: '',
      source: 'Walk-in'
    });
  };

  // Show toast notification
  const showToast = (message, variant = 'success') => {
    setToast({ show: true, message, variant });
    setTimeout(() => setToast({ show: false, message: '', variant: 'success' }), 3000);
  };

  // API Functions
  const fetchWalkInCustomers = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/customers/`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { source: 'Walk-in' }
      });
      setCustomers(response.data || []);
    } catch (error) {
      console.error('Error fetching walk-in customers:', error);
      showToast('Failed to fetch walk-in customers', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerDatabase = async () => {
    setLoading(true);
    try {
      // Fetch from customers auto-collection endpoint
      const customersResponse = await axios.get(`${API_BASE_URL}/customers/auto_collection/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Fetch passport leads
      const passportLeadsResponse = await axios.get(`${API_BASE_URL}/passport-leads/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Fetch bookings with passenger details
      const bookingsResponse = await axios.get(`${API_BASE_URL}/bookings/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Map customers data
      const customersData = (customersResponse.data.customers || []).map(customer => ({
        id: customer.id,
        full_name: customer.full_name || 'N/A',
        phone: customer.phone || '-',
        email: customer.email || '-',
        city: customer.city || '-',
        source: customer.source || 'Unknown',
        branch: customer.branch,
        organization: customer.organization,
        is_active: customer.is_active !== undefined ? customer.is_active : true,
        last_activity: customer.last_activity,
        created_at: customer.created_at,
        updated_at: customer.updated_at,
        passport_number: customer.passport_number,
        service_type: customer.service_type
      }));
      
      // Map passport leads data to customer format
      const passportLeadsData = (passportLeadsResponse.data.results || passportLeadsResponse.data || [])
        .filter(lead => !lead.is_deleted)
        .map(lead => ({
          id: `PL-${lead.id}`,
          full_name: lead.customer_name || 'N/A',
          phone: lead.customer_phone || '-',
          email: lead.pax?.[0]?.email || '-',
          city: lead.city || '-',
          source: 'Passport Lead',
          branch: lead.branch_id,
          organization: lead.organization_id,
          is_active: lead.followup_status !== 'converted',
          last_activity: lead.next_followup_date || lead.updated_at,
          created_at: lead.created_at,
          updated_at: lead.updated_at,
          passport_number: lead.passport_number,
          followup_status: lead.followup_status,
          pending_balance: lead.pending_balance,
          pax_count: lead.pax?.length || 0,
          lead_source: lead.lead_source
        }));
      
      // Map booking passenger details to customers
      const bookingCustomersData = [];
      (bookingsResponse.data || []).forEach(booking => {
        // Determine booking source from created_by_user_type, agency, branch, or user type
        let bookingSource = 'Booking';
        if (booking.created_by_user_type === 'agent' || (booking.agency && !booking.branch?.name?.toLowerCase().includes('main'))) {
          bookingSource = 'Agent Booking';
        } else if (booking.created_by_user_type === 'branch' || (booking.branch && booking.branch.name)) {
          bookingSource = `Branch Booking (${booking.branch.name || 'Branch'})`;
        } else if (booking.created_by_user_type === 'customer') {
          bookingSource = 'Public Booking';
        }
        
        // Store all PAX details for this booking
        const allPaxDetails = (booking.person_details || []).map(person => ({
          id: person.id,
          first_name: person.first_name,
          last_name: person.last_name,
          full_name: `${person.first_name || ''} ${person.last_name || ''}`.trim() || 'N/A',
          contact_number: person.contact_number,
          passport_number: person.passport_number,
          age_group: person.age_group,
          date_of_birth: person.date_of_birth,
          country: person.country,
          passport_issue_date: person.passpoet_issue_date,
          passport_expiry_date: person.passport_expiry_date,
          is_family_head: person.is_family_head,
          visa_status: person.visa_status,
          ticket_status: person.ticket_status,
          hotel_status: person.hotel_status,
          visa_price: person.visa_price,
          ticket_price: person.ticket_price,
          visa_remarks: person.visa_remarks,
          ticket_remarks: person.ticket_remarks
        }));
        
        // Add each passenger as a separate customer entry
        (booking.person_details || []).forEach((person, index) => {
          bookingCustomersData.push({
            id: `BK-${booking.id}-P${person.id || index}`,
            full_name: `${person.first_name || ''} ${person.last_name || ''}`.trim() || 'N/A',
            phone: person.contact_number || booking.customer_contact || '-',
            email: booking.customer_email || '-',
            city: person.country || '-',
            source: bookingSource,
            booking_id: booking.id,
            booking_number: booking.booking_number,
            branch: booking.branch?.name || '-',
            organization: booking.organization?.name || '-',
            is_active: ['Confirmed', 'Under-process', 'Approved', 'Delivered'].includes(booking.status),
            last_activity: booking.updated_at || booking.created_at,
            created_at: booking.created_at,
            updated_at: booking.updated_at,
            passport_number: person.passport_number,
            age_group: person.age_group,
            date_of_birth: person.date_of_birth,
            total_pax: booking.total_pax,
            booking_status: booking.status,
            booking_amount: booking.total_amount,
            pending_payment: booking.pending_payment || 0,
            all_pax_details: allPaxDetails // Store all PAX details from this booking
          });
        });
      });
      
      // Merge all datasets
      const allCustomersData = [...customersData, ...passportLeadsData, ...bookingCustomersData];
      
      setAllCustomers(allCustomersData);
      console.log('Fetched customers:', customersData.length);
      console.log('Fetched passport leads:', passportLeadsData.length);
      console.log('Fetched booking passengers:', bookingCustomersData.length);
      console.log('Total:', allCustomersData.length);
    } catch (error) {
      console.error('Error fetching customer database:', error);
      showToast('Failed to fetch customer database', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomer = async () => {
    if (!formData.full_name || !formData.phone) {
      showToast('Please fill in all required fields', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/customers/manual-add/`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      showToast('Customer added successfully!', 'success');
      setShowAddModal(false);
      resetForm();
      fetchWalkInCustomers();
    } catch (error) {
      console.error('Error adding customer:', error);
      showToast(error.response?.data?.detail || 'Failed to add customer', 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateCustomer = async () => {
    if (!selectedCustomer || !formData.full_name || !formData.phone) {
      showToast('Please fill in all required fields', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/customers/${selectedCustomer.id}/`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      showToast('Customer updated successfully!', 'success');
      setShowEditModal(false);
      setSelectedCustomer(null);
      resetForm();
      fetchWalkInCustomers();
    } catch (error) {
      console.error('Error updating customer:', error);
      showToast(error.response?.data?.detail || 'Failed to update customer', 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCustomer = async () => {
    if (!selectedCustomer) return;

    setSubmitting(true);
    try {
      await axios.delete(
        `${API_BASE_URL}/customers/${selectedCustomer.id}/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      showToast('Customer deleted successfully!', 'success');
      setShowDeleteModal(false);
      setSelectedCustomer(null);
      fetchWalkInCustomers();
    } catch (error) {
      console.error('Error deleting customer:', error);
      showToast(error.response?.data?.detail || 'Failed to delete customer', 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSyncNow = async () => {
    setSyncing(true);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/customers/auto_collection/`,
        { cutoff_days: 30 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      showToast(
        `Sync completed! Created: ${response.data.created}, Updated: ${response.data.updated}`,
        'success'
      );
      fetchCustomerDatabase();
    } catch (error) {
      console.error('Error syncing customers:', error);
      showToast(error.response?.data?.detail || 'Failed to sync customers', 'danger');
    } finally {
      setSyncing(false);
    }
  };

  // Fetch booking details with all PAX when viewing a booking customer
  const fetchBookingDetails = async (bookingId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/bookings/${bookingId}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const booking = response.data;
      
      // Map all PAX details from the booking
      const allPaxDetails = (booking.person_details || []).map(person => ({
        id: person.id,
        first_name: person.first_name,
        last_name: person.last_name,
        full_name: `${person.first_name || ''} ${person.last_name || ''}`.trim() || 'N/A',
        contact_number: person.contact_number,
        passport_number: person.passport_number,
        age_group: person.age_group,
        date_of_birth: person.date_of_birth,
        country: person.country,
        passport_issue_date: person.passpoet_issue_date,
        passport_expiry_date: person.passport_expiry_date,
        is_family_head: person.is_family_head,
        visa_status: person.visa_status,
        ticket_status: person.ticket_status,
        hotel_status: person.hotel_status,
        visa_price: person.visa_price,
        ticket_price: person.ticket_price,
        visa_remarks: person.visa_remarks,
        ticket_remarks: person.ticket_remarks
      }));
      
      return allPaxDetails;
    } catch (error) {
      console.error('Error fetching booking details:', error);
      return [];
    }
  };

  // Handle viewing a customer - fetch booking PAX details if it's a booking customer
  const handleViewCustomer = async (customer) => {
    setSelectedCustomer(customer);
    
    // If customer is from a booking, fetch the full booking details
    if (customer.booking_id && customer.source?.includes('Booking')) {
      setLoading(true);
      const paxDetails = await fetchBookingDetails(customer.booking_id);
      setSelectedCustomer({
        ...customer,
        all_pax_details: paxDetails
      });
      setLoading(false);
    }
    
    setShowViewModal(true);
  };

  // Handle sorting
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Fetch data on component mount and tab changes
  useEffect(() => {
    if (activeMainTab === 'walk-in') {
      fetchWalkInCustomers();
    } else if (activeMainTab === 'database') {
      fetchCustomerDatabase();
    }
  }, [activeMainTab]);

  const handleSplitClick = (booking) => {
    setSelectedBooking(booking);
    setShowSplitModal(true);
  };

  const handleSplitBooking = () => {
    // Handle booking split logic here
    console.log('Splitting booking:', selectedBooking);
    setShowSplitModal(false);
    setSelectedBooking(null);
  };

  // Table styles
  const tableStyles = `
    .customer-management-table th,
    .customer-management-table td {
      white-space: nowrap;
      vertical-align: middle;
    }
    
    .customer-management-table th:first-child,
    .customer-management-table td:first-child {
      position: sticky;
      left: 0;
      background-color: white;
      z-index: 1;
    }
    
    .customer-management-table thead th:first-child {
      z-index: 2;
    }
    
    .customer-management-table th {
      background: #1B78CE !important;
      color: white !important;
      font-weight: 600 !important;
      padding: 12px !important;
      border: none !important;
      font-size: 0.9rem !important;
    }
    
    .customer-management-table td {
      padding: 12px !important;
      border-bottom: 1px solid #dee2e6 !important;
      font-size: 0.85rem !important;
    }
    
    .customer-management-table tbody tr:hover {
      background-color: #f8fafc !important;
    }
    
    .customer-management-table tbody tr:hover td:first-child {
      background-color: #f8fafc !important;
    }
  `;

  return (
    <div className="min-vh-100" style={{ fontFamily: "Poppins, sans-serif" }}>
      <style dangerouslySetInnerHTML={{ __html: tableStyles }} />

      <div className="row g-0">
        {/* Sidebar */}
        <div className="col-12 col-lg-2">
          <Sidebar />
        </div>

        {/* Main Content */}
        <div className="col-12 col-lg-10">
          <div className="container-fluid">
            <Header />

            <div className="px-3 px-lg-4 my-3">
              <CRMTabs activeName={crmActive} onSelect={(name) => setCrmActive(name)} />
              {crmActive === 'Follow Ups' && (
                <div className="mb-4">
                  <LeadManagement embedded={true} />
                </div>
              )}
              <div style={{ display: crmActive === 'Follow Ups' ? 'none' : 'block' }}>
                {/* Page Header */}
                <div className="row mb-4">
                  <div className="col-12">
                    <h4 className="mb-1" style={{ color: '#1B78CE', fontWeight: '600' }}>
                      Customer Management
                    </h4>
                    <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>
                      Manage walk-in customers and customer database
                    </p>
                  </div>
                </div>

                {/* Main Navigation Tabs */}
                <div className="row mb-4">
                  <div className="col-12">
                    <nav>
                      <div className="nav d-flex flex-wrap gap-2">
                        <button
                          className={`nav-link btn btn-link ${activeMainTab === 'walk-in' ? 'fw-bold' : ''}`}
                          onClick={() => { setActiveMainTab('walk-in'); setSearchTerm(''); setActiveSubTab('all'); }}
                          style={{
                            color: activeMainTab === 'walk-in' ? '#1B78CE' : '#6c757d',
                            textDecoration: 'none',
                            padding: '0.5rem 1rem',
                            border: 'none',
                            background: 'transparent',
                            fontFamily: 'Poppins, sans-serif',
                            borderBottom: activeMainTab === 'walk-in' ? '2px solid #1B78CE' : '2px solid transparent'
                          }}
                        >
                          <User size={16} className="me-2" />
                          Walk-in Customers
                        </button>
                        {(hasPermission('view_customer_database_admin') || hasPermission('add_customer_database_admin') || hasPermission('edit_customer_database_admin') || hasPermission('delete_customer_database_admin')) && (
                          <button
                            className={`nav-link btn btn-link ${activeMainTab === 'database' ? 'fw-bold' : ''}`}
                            onClick={() => { setActiveMainTab('database'); setSearchTerm(''); setActiveSubTab('all'); }}
                            style={{
                              color: activeMainTab === 'database' ? '#1B78CE' : '#6c757d',
                              textDecoration: 'none',
                              padding: '0.5rem 1rem',
                              border: 'none',
                              background: 'transparent',
                              fontFamily: 'Poppins, sans-serif',
                              borderBottom: activeMainTab === 'database' ? '2px solid #1B78CE' : '2px solid transparent'
                            }}
                          >
                            <Database size={16} className="me-2" />
                            Customer Database
                          </button>
                        )}
                      </div>
                    </nav>
                  </div>
                </div>

                {/* Tab Content */}
                {activeMainTab === 'walk-in' && (
                  <div>
                    {/* Statistics Cards */}
                    <div className="row mb-4">
                      <div className="col-xl-3 col-lg-6 col-md-6 col-sm-6 col-12 mb-3">
                        <Card style={{ borderLeft: '4px solid #1B78CE' }}>
                          <Card.Body>
                            <div className="d-flex justify-content-between align-items-center">
                              <div>
                                <h6 className="text-muted mb-1">Total Customers</h6>
                                <h4 className="mb-0" style={{ color: '#1B78CE' }}>{stats.totalCustomers}</h4>
                              </div>
                              <Users size={32} style={{ color: '#1B78CE', opacity: 0.7 }} />
                            </div>
                          </Card.Body>
                        </Card>
                      </div>
                      <div className="col-xl-3 col-lg-6 col-md-6 col-sm-6 col-12 mb-3">
                        <Card style={{ borderLeft: '4px solid #28a745' }}>
                          <Card.Body>
                            <div className="d-flex justify-content-between align-items-center">
                              <div>
                                <h6 className="text-muted mb-1">Active Customers</h6>
                                <h4 className="mb-0" style={{ color: '#28a745' }}>{stats.activeCustomers}</h4>
                              </div>
                              <User size={32} style={{ color: '#28a745', opacity: 0.7 }} />
                            </div>
                          </Card.Body>
                        </Card>
                      </div>
                      <div className="col-xl-3 col-lg-6 col-md-6 col-sm-6 col-12 mb-3">
                        <Card style={{ borderLeft: '4px solid #ffc107' }}>
                          <Card.Body>
                            <div className="d-flex justify-content-between align-items-center">
                              <div>
                                <h6 className="text-muted mb-1">Inactive Customers</h6>
                                <h4 className="mb-0" style={{ color: '#ffc107' }}>{stats.inactiveCustomers}</h4>
                              </div>
                              <User size={32} style={{ color: '#ffc107', opacity: 0.7 }} />
                            </div>
                          </Card.Body>
                        </Card>
                      </div>
                      <div className="col-xl-3 col-lg-6 col-md-6 col-sm-6 col-12 mb-3">
                        <Card style={{ borderLeft: '4px solid #17a2b8' }}>
                          <Card.Body>
                            <div className="d-flex justify-content-between align-items-center">
                              <div>
                                <h6 className="text-muted mb-1">Total Revenue</h6>
                                <h4 className="mb-0" style={{ color: '#17a2b8' }}>PKR {stats.totalRevenue.toLocaleString()}</h4>
                              </div>
                              <BookOpen size={32} style={{ color: '#17a2b8', opacity: 0.7 }} />
                            </div>
                          </Card.Body>
                        </Card>
                      </div>
                    </div>

                    {/* Filter Section */}
                    <div className="row mb-4">
                      <div className="col-12">
                        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
                          {/* Sub-navigation */}
                          <nav>
                            <div className="nav d-flex flex-wrap gap-2">
                              {['all', 'active', 'inactive'].map((tab) => (
                                <button
                                  key={tab}
                                  className={`nav-link btn btn-link ${activeSubTab === tab ? 'fw-bold' : ''}`}
                                  onClick={() => setActiveSubTab(tab)}
                                  style={{
                                    color: activeSubTab === tab ? '#1B78CE' : '#6c757d',
                                    textDecoration: 'none',
                                    padding: '0.375rem 0.75rem',
                                    border: 'none',
                                    background: 'transparent',
                                    fontSize: '0.875rem',
                                    borderBottom: activeSubTab === tab ? '2px solid #1B78CE' : '2px solid transparent'
                                  }}
                                >
                                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                </button>
                              ))}
                            </div>
                          </nav>

                          {/* Action buttons */}
                          <div className="d-flex flex-wrap gap-2">
                            <InputGroup style={{ maxWidth: '250px' }}>
                              <InputGroup.Text style={{ background: '#f8f9fa', border: '1px solid #dee2e6' }}>
                                <Search size={16} />
                              </InputGroup.Text>
                              <Form.Control
                                type="text"
                                placeholder="Search customers..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ border: '1px solid #dee2e6' }}
                              />
                            </InputGroup>
                            <Button
                              variant="outline-primary"
                              onClick={() => { }}
                              style={{ whiteSpace: 'nowrap' }}
                            >
                              <Download size={16} className="me-1" />
                              Export
                            </Button>
                            {hasPermission('add_walking_customer_admin') && (
                              <Button
                                style={{ backgroundColor: '#1B78CE', border: 'none', whiteSpace: 'nowrap' }}
                                onClick={() => setShowAddModal(true)}
                              >
                                <Plus size={16} className="me-1" />
                                Add Customer
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Table */}
                    <div className="row">
                      <div className="col-12">
                        <div style={{ overflowX: 'auto', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                          <Table className="customer-management-table mb-0" style={{ minWidth: '800px' }}>
                            <thead>
                              <tr>
                                <th>Customer ID</th>
                                <th>Name</th>
                                <th>Phone</th>
                                <th>Email</th>
                                <th>City</th>
                                <th>Status</th>
                                <th>Total Spent</th>
                                <th>Last Visit</th>
                                {(hasPermission('edit_walking_customer_admin') || hasPermission('delete_walking_customer_admin') || hasPermission('view_walking_customer_admin')) && <th>Actions</th>}
                              </tr>
                            </thead>
                            <tbody>
                              {filteredCustomers.length === 0 ? (
                                <tr>
                                  <td colSpan="9" className="text-center py-4">
                                    <div className="text-muted">
                                      <User size={48} className="mb-2" style={{ opacity: 0.5 }} />
                                      <p className="mb-0">No customers found</p>
                                    </div>
                                  </td>
                                </tr>
                              ) : (
                                filteredCustomers.map((customer) => (
                                  <tr key={customer.id}>
                                    <td>{customer.id}</td>
                                    <td style={{ fontWeight: '500' }}>{customer.full_name}</td>
                                    <td>{customer.phone}</td>
                                    <td>{customer.email || '-'}</td>
                                    <td>{customer.city || '-'}</td>
                                    <td>
                                      <Badge bg={customer.is_active ? 'success' : 'warning'}>
                                        {customer.is_active ? 'Active' : 'Inactive'}
                                      </Badge>
                                    </td>
                                    <td style={{ fontWeight: '500' }}>-</td>
                                    <td>{customer.last_activity ? new Date(customer.last_activity).toLocaleDateString() : '-'}</td>
                                    {(hasPermission('edit_walking_customer_admin') || hasPermission('delete_walking_customer_admin') || hasPermission('view_walking_customer_admin')) && (
                                      <td>
                                        <div className="d-flex gap-1">
                                          {hasPermission('view_walking_customer_admin') && (
                                            <Button
                                              size="sm"
                                              variant="outline-info"
                                              onClick={() => handleViewCustomer(customer)}
                                            >
                                              <Eye size={14} />
                                            </Button>
                                          )}
                                          {hasPermission('edit_walking_customer_admin') && (
                                            <Button
                                              size="sm"
                                              variant="outline-primary"
                                              onClick={() => { 
                                                setSelectedCustomer(customer); 
                                                setFormData({
                                                  full_name: customer.full_name,
                                                  phone: customer.phone,
                                                  email: customer.email || '',
                                                  city: customer.city || '',
                                                  source: customer.source || 'Walk-in'
                                                });
                                                setShowEditModal(true); 
                                              }}
                                            >
                                              <Edit size={14} />
                                            </Button>
                                          )}
                                          {hasPermission('delete_walking_customer_admin') && (
                                            <Button
                                              size="sm"
                                              variant="outline-danger"
                                              onClick={() => { setSelectedCustomer(customer); setShowDeleteModal(true); }}
                                            >
                                              <Trash2 size={14} />
                                            </Button>
                                          )}
                                        </div>
                                      </td>
                                    )}
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </Table>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeMainTab === 'database' && (
                  <div>
                    {/* Customer Database Tab Content - Auto-collection functionality */}
                    <div className="alert alert-info mb-4">
                      <div className="d-flex align-items-center">
                        <Database size={20} className="me-2" />
                        <strong>Customer Database</strong> - Auto-collection from booking APIs, passport leads, and area branches
                      </div>
                    </div>

                    {/* Statistics for Database */}
                    <div className="row mb-4">
                      <div className="col-xl-3 col-lg-6 col-md-6 col-sm-6 col-12 mb-3">
                        <Card style={{ borderLeft: '4px solid #1B78CE' }}>
                          <Card.Body>
                            <div className="d-flex justify-content-between align-items-center">
                              <div>
                                <h6 className="text-muted mb-1">Total Collected</h6>
                                <h4 className="mb-0" style={{ color: '#1B78CE' }}>{dbStats.totalCustomers}</h4>
                              </div>
                              <Database size={32} style={{ color: '#1B78CE', opacity: 0.7 }} />
                            </div>
                          </Card.Body>
                        </Card>
                      </div>
                      <div className="col-xl-3 col-lg-6 col-md-6 col-sm-6 col-12 mb-3">
                        <Card style={{ borderLeft: '4px solid #28a745' }}>
                          <Card.Body>
                            <div className="d-flex justify-content-between align-items-center">
                              <div>
                                <h6 className="text-muted mb-1">From Bookings (PAX)</h6>
                                <h4 className="mb-0" style={{ color: '#28a745' }}>{dbStats.fromBookings}</h4>
                                <small className="text-muted" style={{ fontSize: '0.7rem' }}>Agent, Branch & Public</small>
                              </div>
                              <BookOpen size={32} style={{ color: '#28a745', opacity: 0.7 }} />
                            </div>
                          </Card.Body>
                        </Card>
                      </div>
                      <div className="col-xl-3 col-lg-6 col-md-6 col-sm-6 col-12 mb-3">
                        <Card style={{ borderLeft: '4px solid #ffc107' }}>
                          <Card.Body>
                            <div className="d-flex justify-content-between align-items-center">
                              <div>
                                <h6 className="text-muted mb-1">From Leads</h6>
                                <h4 className="mb-0" style={{ color: '#ffc107' }}>{dbStats.fromLeads}</h4>
                              </div>
                              <FileText size={32} style={{ color: '#ffc107', opacity: 0.7 }} />
                            </div>
                          </Card.Body>
                        </Card>
                      </div>
                      <div className="col-xl-3 col-lg-6 col-md-6 col-sm-6 col-12 mb-3">
                        <Card style={{ borderLeft: '4px solid #17a2b8' }}>
                          <Card.Body>
                            <div className="d-flex justify-content-between align-items-center">
                              <div>
                                <h6 className="text-muted mb-1">From Branches</h6>
                                <h4 className="mb-0" style={{ color: '#17a2b8' }}>{dbStats.fromBranch}</h4>
                              </div>
                              <MapPin size={32} style={{ color: '#17a2b8', opacity: 0.7 }} />
                            </div>
                          </Card.Body>
                        </Card>
                      </div>
                    </div>

                    {/* Database actions and filters */}
                    <div className="row mb-4">
                      <div className="col-12">
                        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
                          <nav>
                            <div className="nav d-flex flex-wrap gap-2">
                              {['all', 'booking', 'leads', 'branch'].map((tab) => (
                                <button
                                  key={tab}
                                  className={`nav-link btn btn-link ${activeSubTab === tab ? 'fw-bold' : ''}`}
                                  onClick={() => setActiveSubTab(tab)}
                                  style={{
                                    color: activeSubTab === tab ? '#1B78CE' : '#6c757d',
                                    textDecoration: 'none',
                                    padding: '0.375rem 0.75rem',
                                    border: 'none',
                                    background: 'transparent',
                                    fontSize: '0.875rem',
                                    borderBottom: activeSubTab === tab ? '2px solid #1B78CE' : '2px solid transparent'
                                  }}
                                >
                                  {tab === 'all' ? 'All Sources' :
                                    tab === 'booking' ? 'From Bookings' :
                                      tab === 'leads' ? 'From Leads' : 'From Branches'}
                                </button>
                              ))}
                            </div>
                          </nav>

                          <div className="d-flex flex-wrap gap-2">
                            <InputGroup style={{ maxWidth: '250px' }}>
                              <InputGroup.Text style={{ background: '#f8f9fa', border: '1px solid #dee2e6' }}>
                                <Search size={16} />
                              </InputGroup.Text>
                              <Form.Control
                                type="text"
                                placeholder="Search database..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ border: '1px solid #dee2e6' }}
                              />
                            </InputGroup>
                            <Button
                              style={{ backgroundColor: '#28a745', border: 'none', whiteSpace: 'nowrap' }}
                              onClick={handleSyncNow}
                              disabled={syncing}
                            >
                              {syncing ? (
                                <>
                                  <Spinner animation="border" size="sm" className="me-1" />
                                  Syncing...
                                </>
                              ) : (
                                <>
                                  <Upload size={16} className="me-1" />
                                  Sync Now
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Info Alert */}
                    <div className="row mb-3">
                      <div className="col-12">
                        <Alert variant="info" className="mb-0">
                          <div className="d-flex align-items-center justify-content-between">
                            <div className="d-flex align-items-center">
                              <Database size={20} className="me-2" />
                              <div>
                                <strong>Auto-Collection Sources:</strong>
                                <span className="ms-2">
                                  • Bookings (with passenger details) 
                                  • Passport Leads 
                                  • Area Branches
                                  • Walk-in Customers
                                </span>
                              </div>
                            </div>
                            <Badge bg="primary" className="ms-2">
                              Showing {filteredAllCustomers.length} of {allCustomers.length} customers
                            </Badge>
                          </div>
                        </Alert>
                      </div>
                    </div>

                    {/* Database table */}
                    <div className="row">
                      <div className="col-12">
                        <div style={{ overflowX: 'auto', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                          <Table className="customer-management-table mb-0" style={{ minWidth: '900px' }}>
                            <thead>
                              <tr>
                                <th onClick={() => handleSort('id')} style={{ cursor: 'pointer' }}>
                                  ID {sortBy === 'id' && (sortOrder === 'asc' ? '↑' : '↓')}
                                </th>
                                <th onClick={() => handleSort('full_name')} style={{ cursor: 'pointer' }}>
                                  Name {sortBy === 'full_name' && (sortOrder === 'asc' ? '↑' : '↓')}
                                </th>
                                <th onClick={() => handleSort('phone')} style={{ cursor: 'pointer' }}>
                                  Phone {sortBy === 'phone' && (sortOrder === 'asc' ? '↑' : '↓')}
                                </th>
                                <th>Email</th>
                                <th>City</th>
                                <th onClick={() => handleSort('source')} style={{ cursor: 'pointer' }}>
                                  Source {sortBy === 'source' && (sortOrder === 'asc' ? '↑' : '↓')}
                                </th>
                                <th onClick={() => handleSort('created_at')} style={{ cursor: 'pointer' }}>
                                  Collected At {sortBy === 'created_at' && (sortOrder === 'asc' ? '↑' : '↓')}
                                </th>
                                <th>Status</th>
                                {(hasPermission('view_customer_database_admin') || hasPermission('edit_customer_database_admin') || hasPermission('delete_customer_database_admin')) && <th>Actions</th>}
                              </tr>
                            </thead>
                            <tbody>
                              {loading ? (
                                <tr>
                                  <td colSpan="9" className="text-center py-4">
                                    <Spinner animation="border" variant="primary" />
                                    <p className="mt-2 text-muted">Loading customer database...</p>
                                  </td>
                                </tr>
                              ) : filteredAllCustomers.length === 0 ? (
                                <tr>
                                  <td colSpan="9" className="text-center py-4">
                                    <div className="text-muted">
                                      <Database size={48} className="mb-2" style={{ opacity: 0.5 }} />
                                      <p className="mb-0">No auto-collected customers found</p>
                                    </div>
                                  </td>
                                </tr>
                              ) : (
                                filteredAllCustomers.map((customer) => (
                                  <tr key={`${customer.source}-${customer.id}`}>
                                    <td>{customer.id}</td>
                                    <td style={{ fontWeight: '500' }}>
                                      {customer.full_name}
                                      {customer.passport_number && (
                                        <div style={{ fontSize: '0.75rem', color: '#6c757d' }}>
                                          Passport: {customer.passport_number}
                                        </div>
                                      )}
                                    </td>
                                    <td>{customer.phone}</td>
                                    <td>{customer.email}</td>
                                    <td>{customer.city}</td>
                                    <td>
                                      <Badge bg={
                                        customer.source?.includes('Booking') ? 'primary' :
                                        customer.source === 'Passport Lead' || customer.source === 'Lead' ? 'warning' :
                                        customer.source === 'Area Branch' || customer.source?.includes('Branch') ? 'info' :
                                        customer.source === 'Walk-in' ? 'success' : 'secondary'
                                      }>
                                        {customer.source}
                                      </Badge>
                                      {customer.pax_count > 0 && (
                                        <Badge bg="secondary" className="ms-1">
                                          {customer.pax_count} PAX
                                        </Badge>
                                      )}
                                      {customer.total_pax > 0 && (
                                        <Badge bg="secondary" className="ms-1">
                                          {customer.total_pax} PAX
                                        </Badge>
                                      )}
                                      {customer.booking_number && (
                                        <div style={{ fontSize: '0.7rem', color: '#6c757d' }}>
                                          {customer.booking_number}
                                        </div>
                                      )}
                                    </td>
                                    <td>
                                      {customer.created_at 
                                        ? new Date(customer.created_at).toLocaleDateString('en-US', { 
                                            year: 'numeric', 
                                            month: 'short', 
                                            day: 'numeric' 
                                          })
                                        : '-'
                                      }
                                    </td>
                                    <td>
                                      <Badge bg={
                                        customer.booking_status ? (
                                          ['Confirmed', 'Approved', 'Delivered'].includes(customer.booking_status) ? 'success' :
                                          ['Under-process', 'Pending'].includes(customer.booking_status) ? 'warning' :
                                          ['Canceled', 'Rejected'].includes(customer.booking_status) ? 'danger' : 'secondary'
                                        ) : (
                                          customer.is_active ? 'success' : 'secondary'
                                        )
                                      }>
                                        {customer.booking_status 
                                          ? customer.booking_status
                                          : customer.followup_status 
                                            ? customer.followup_status.charAt(0).toUpperCase() + customer.followup_status.slice(1)
                                            : (customer.is_active ? 'Active' : 'Inactive')
                                        }
                                      </Badge>
                                      {customer.pending_balance > 0 && (
                                        <div style={{ fontSize: '0.75rem', color: '#dc3545', fontWeight: '500' }}>
                                          Balance: PKR {parseFloat(customer.pending_balance).toLocaleString()}
                                        </div>
                                      )}
                                      {customer.pending_payment > 0 && (
                                        <div style={{ fontSize: '0.75rem', color: '#dc3545', fontWeight: '500' }}>
                                          Pending: PKR {parseFloat(customer.pending_payment).toLocaleString()}
                                        </div>
                                      )}
                                    </td>
                                    {(hasPermission('view_customer_database_admin') || hasPermission('edit_customer_database_admin') || hasPermission('delete_customer_database_admin')) && (
                                      <td>
                                        <div className="d-flex gap-1">
                                          {hasPermission('view_customer_database_admin') && (
                                            <Button size="sm" variant="outline-info" onClick={() => handleViewCustomer(customer)}>
                                              <Eye size={14} />
                                            </Button>
                                          )}
                                        </div>
                                      </td>
                                    )}
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </Table>
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

      {/* Add Customer Modal */}
      <Modal show={showAddModal} onHide={() => { setShowAddModal(false); resetForm(); }} size="lg">
        <Modal.Header closeButton style={{ backgroundColor: '#1B78CE', color: 'white' }}>
          <Modal.Title style={{ fontSize: '1.1rem' }}>Add New Walk-in Customer</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Customer Name *</Form.Label>
                  <Form.Control
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    placeholder="Enter customer name"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Phone Number *</Form.Label>
                  <Form.Control
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+92-300-1234567"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email Address</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="customer@email.com"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>City</Form.Label>
                  <Form.Control
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="Enter city"
                  />
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => { setShowAddModal(false); resetForm(); }}>
            Cancel
          </Button>
          <Button 
            style={{ backgroundColor: '#1B78CE', border: 'none' }}
            onClick={handleAddCustomer}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Spinner animation="border" size="sm" className="me-1" />
                Adding...
              </>
            ) : (
              <>
                <Plus size={16} className="me-1" />
                Add Customer
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Customer Modal */}
      <Modal show={showEditModal} onHide={() => { setShowEditModal(false); setSelectedCustomer(null); resetForm(); }} size="lg">
        <Modal.Header closeButton style={{ backgroundColor: '#ffc107', color: 'white' }}>
          <Modal.Title style={{ fontSize: '1.1rem' }}>Edit Customer - {selectedCustomer?.full_name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Customer Name *</Form.Label>
                  <Form.Control
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    placeholder="Enter customer name"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Phone Number *</Form.Label>
                  <Form.Control
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+92-300-1234567"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email Address</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="customer@email.com"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>City</Form.Label>
                  <Form.Control
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="Enter city"
                  />
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => { setShowEditModal(false); setSelectedCustomer(null); resetForm(); }}>
            Cancel
          </Button>
          <Button 
            style={{ backgroundColor: '#ffc107', border: 'none' }}
            onClick={handleUpdateCustomer}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Spinner animation="border" size="sm" className="me-1" />
                Updating...
              </>
            ) : (
              <>
                <Edit size={16} className="me-1" />
                Update Customer
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* View Customer Modal */}
      <Modal show={showViewModal} onHide={() => { setShowViewModal(false); setSelectedCustomer(null); }} size="lg">
        <Modal.Header closeButton style={{ backgroundColor: '#17a2b8', color: 'white' }}>
          <Modal.Title style={{ fontSize: '1.1rem' }}>Customer Details - {selectedCustomer?.full_name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedCustomer && (
            <div>
              {/* Debug log */}
              {console.log('Selected Customer:', selectedCustomer)}
              {console.log('All PAX Details:', selectedCustomer.all_pax_details)}
              <Row className="mb-3">
                <Col md={6}>
                  <strong>Customer ID:</strong> {selectedCustomer.id}
                </Col>
                <Col md={6}>
                  <strong>Status:</strong>{' '}
                  <Badge bg={
                    selectedCustomer.booking_status ? (
                      ['Confirmed', 'Approved', 'Delivered'].includes(selectedCustomer.booking_status) ? 'success' :
                      ['Under-process', 'Pending'].includes(selectedCustomer.booking_status) ? 'warning' :
                      ['Canceled', 'Rejected'].includes(selectedCustomer.booking_status) ? 'danger' : 'secondary'
                    ) : (
                      selectedCustomer.is_active ? 'success' : 'warning'
                    )
                  }>
                    {selectedCustomer.booking_status || (selectedCustomer.is_active ? 'Active' : 'Inactive')}
                  </Badge>
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={6}>
                  <strong>Name:</strong> {selectedCustomer.full_name}
                </Col>
                <Col md={6}>
                  <strong>Phone:</strong> {selectedCustomer.phone}
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={6}>
                  <strong>Email:</strong> {selectedCustomer.email || '-'}
                </Col>
                <Col md={6}>
                  <strong>City:</strong> {selectedCustomer.city || '-'}
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={6}>
                  <strong>Source:</strong> {selectedCustomer.source}
                </Col>
                <Col md={6}>
                  <strong>Last Activity:</strong> {selectedCustomer.last_activity ? new Date(selectedCustomer.last_activity).toLocaleDateString() : '-'}
                </Col>
              </Row>
              
              {/* Booking-specific information */}
              {selectedCustomer.booking_number && (
                <>
                  <hr />
                  <h6 className="text-muted mb-3">Booking Information</h6>
                  <Row className="mb-3">
                    <Col md={6}>
                      <strong>Booking Number:</strong> {selectedCustomer.booking_number}
                    </Col>
                    <Col md={6}>
                      <strong>Branch:</strong> {selectedCustomer.branch || '-'}
                    </Col>
                  </Row>
                  <Row className="mb-3">
                    <Col md={6}>
                      <strong>Organization:</strong> {selectedCustomer.organization || '-'}
                    </Col>
                    <Col md={6}>
                      <strong>Total PAX:</strong> {selectedCustomer.total_pax || 0}
                    </Col>
                  </Row>
                  {selectedCustomer.age_group && (
                    <Row className="mb-3">
                      <Col md={6}>
                        <strong>Age Group:</strong> {selectedCustomer.age_group}
                      </Col>
                      <Col md={6}>
                        <strong>Date of Birth:</strong> {selectedCustomer.date_of_birth ? new Date(selectedCustomer.date_of_birth).toLocaleDateString() : '-'}
                      </Col>
                    </Row>
                  )}
                  {selectedCustomer.booking_amount > 0 && (
                    <Row className="mb-3">
                      <Col md={12}>
                        <Alert variant="info" className="mb-0">
                          <strong>Total Booking Amount:</strong> PKR {parseFloat(selectedCustomer.booking_amount).toLocaleString()}
                        </Alert>
                      </Col>
                    </Row>
                  )}
                  {selectedCustomer.pending_payment > 0 && (
                    <Row className="mb-3">
                      <Col md={12}>
                        <Alert variant="warning" className="mb-0">
                          <strong>Pending Payment:</strong> PKR {parseFloat(selectedCustomer.pending_payment).toLocaleString()}
                        </Alert>
                      </Col>
                    </Row>
                  )}
                  
                  {/* All PAX Details from Booking */}
                  <hr />
                  <h6 className="text-muted mb-3">
                    <Users size={18} className="me-2" />
                    All Passengers (PAX) Details
                  </h6>
                  {selectedCustomer.all_pax_details && selectedCustomer.all_pax_details.length > 0 ? (
                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                      {selectedCustomer.all_pax_details.map((pax, index) => (
                        <Card key={pax.id || index} className="mb-3" style={{ borderLeft: pax.is_family_head ? '4px solid #28a745' : '4px solid #6c757d' }}>
                          <Card.Body className="p-3">
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <h6 className="mb-0">
                                {index + 1}. {pax.full_name}
                                {pax.is_family_head && <Badge bg="success" className="ms-2">Family Head</Badge>}
                              </h6>
                              <Badge bg="secondary">{pax.age_group || 'Adult'}</Badge>
                            </div>
                            
                            <Row className="mt-2" style={{ fontSize: '0.9rem' }}>
                              <Col md={6} className="mb-2">
                                <Phone size={14} className="me-1" />
                                <strong>Contact:</strong> {pax.contact_number || '-'}
                              </Col>
                              <Col md={6} className="mb-2">
                                <FileText size={14} className="me-1" />
                                <strong>Passport:</strong> {pax.passport_number || '-'}
                              </Col>
                            </Row>
                            
                            <Row style={{ fontSize: '0.9rem' }}>
                              <Col md={6} className="mb-2">
                                <MapPin size={14} className="me-1" />
                                <strong>Country:</strong> {pax.country || '-'}
                              </Col>
                              <Col md={6} className="mb-2">
                                <strong>DOB:</strong> {pax.date_of_birth ? new Date(pax.date_of_birth).toLocaleDateString() : '-'}
                              </Col>
                            </Row>
                            
                            {pax.passport_expiry_date && (
                              <Row style={{ fontSize: '0.9rem' }}>
                                <Col md={12} className="mb-2">
                                  <strong>Passport Expiry:</strong> {new Date(pax.passport_expiry_date).toLocaleDateString()}
                                </Col>
                              </Row>
                            )}
                            
                            <Row className="mt-2">
                              <Col md={4}>
                                <Badge bg={
                                  pax.visa_status === 'Approved' ? 'success' :
                                  pax.visa_status === 'Rejected' ? 'danger' : 'warning'
                                } style={{ fontSize: '0.75rem' }}>
                                  Visa: {pax.visa_status || 'Pending'}
                                </Badge>
                              </Col>
                              <Col md={4}>
                                <Badge bg={
                                  pax.ticket_status === 'Confirmed' ? 'success' :
                                  pax.ticket_status === 'Cancelled' ? 'danger' : 'warning'
                                } style={{ fontSize: '0.75rem' }}>
                                  Ticket: {pax.ticket_status || 'Pending'}
                                </Badge>
                              </Col>
                              <Col md={4}>
                                <Badge bg={
                                  pax.hotel_status === 'Checked Out' ? 'success' :
                                  pax.hotel_status === 'Checked In' ? 'info' : 'warning'
                                } style={{ fontSize: '0.75rem' }}>
                                  Hotel: {pax.hotel_status || 'Pending'}
                                </Badge>
                              </Col>
                            </Row>
                            
                            {(pax.visa_price > 0 || pax.ticket_price > 0) && (
                              <Row className="mt-2" style={{ fontSize: '0.85rem' }}>
                                {pax.visa_price > 0 && (
                                  <Col md={6}>
                                    <strong>Visa Price:</strong> PKR {parseFloat(pax.visa_price).toLocaleString()}
                                  </Col>
                                )}
                                {pax.ticket_price > 0 && (
                                  <Col md={6}>
                                    <strong>Ticket Price:</strong> PKR {parseFloat(pax.ticket_price).toLocaleString()}
                                  </Col>
                                )}
                              </Row>
                            )}
                            
                            {(pax.visa_remarks || pax.ticket_remarks) && (
                              <Row className="mt-2" style={{ fontSize: '0.85rem' }}>
                                {pax.visa_remarks && (
                                  <Col md={12} className="mb-1">
                                    <strong>Visa Remarks:</strong> <span className="text-muted">{pax.visa_remarks}</span>
                                  </Col>
                                )}
                                {pax.ticket_remarks && (
                                  <Col md={12}>
                                    <strong>Ticket Remarks:</strong> <span className="text-muted">{pax.ticket_remarks}</span>
                                  </Col>
                                )}
                              </Row>
                            )}
                          </Card.Body>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Alert variant="info" className="mb-0">
                      <strong>Note:</strong> PAX details are being loaded. If you don't see them, please refresh the customer database.
                    </Alert>
                  )}
                </>
              )}
              
              {/* Passport information */}
              {selectedCustomer.passport_number && (
                <Row className="mb-3">
                  <Col md={12}>
                    <strong>Passport Number:</strong> {selectedCustomer.passport_number}
                  </Col>
                </Row>
              )}
              
              {/* Passport Lead specific information */}
              {selectedCustomer.followup_status && (
                <>
                  <hr />
                  <h6 className="text-muted mb-3">Lead Information</h6>
                  <Row className="mb-3">
                    <Col md={6}>
                      <strong>Follow-up Status:</strong>{' '}
                      <Badge bg={
                        selectedCustomer.followup_status === 'converted' ? 'success' :
                        selectedCustomer.followup_status === 'completed' ? 'info' : 'warning'
                      }>
                        {selectedCustomer.followup_status.charAt(0).toUpperCase() + selectedCustomer.followup_status.slice(1)}
                      </Badge>
                    </Col>
                    <Col md={6}>
                      <strong>PAX Count:</strong> {selectedCustomer.pax_count || 0}
                    </Col>
                  </Row>
                </>
              )}
              
              {selectedCustomer.pending_balance > 0 && (
                <Row className="mb-3">
                  <Col md={12}>
                    <Alert variant="warning" className="mb-0">
                      <strong>Pending Balance:</strong> PKR {parseFloat(selectedCustomer.pending_balance).toLocaleString()}
                    </Alert>
                  </Col>
                </Row>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => { setShowViewModal(false); setSelectedCustomer(null); }}>
            Close
          </Button>
          {hasPermission('edit_walking_customer_admin') && (
            <Button
              style={{ backgroundColor: '#ffc107', border: 'none' }}
              onClick={() => {
                setFormData({
                  full_name: selectedCustomer.full_name,
                  phone: selectedCustomer.phone,
                  email: selectedCustomer.email || '',
                  city: selectedCustomer.city || '',
                  source: selectedCustomer.source || 'Walk-in'
                });
                setShowViewModal(false);
                setShowEditModal(true);
              }}
            >
              <Edit size={16} className="me-1" />
              Edit Customer
            </Button>
          )}
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => { setShowDeleteModal(false); setSelectedCustomer(null); }}>
        <Modal.Header closeButton style={{ backgroundColor: '#dc3545', color: 'white' }}>
          <Modal.Title style={{ fontSize: '1.1rem' }}>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center">
            <Trash2 size={48} className="text-danger mb-3" />
            <h5>Are you sure you want to delete this customer?</h5>
            <p className="text-muted">
              Customer: <strong>{selectedCustomer?.full_name}</strong><br />
              This action will deactivate the customer record.
            </p>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => { setShowDeleteModal(false); setSelectedCustomer(null); }}>
            Cancel
          </Button>
          <Button 
            variant="danger"
            onClick={handleDeleteCustomer}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Spinner animation="border" size="sm" className="me-1" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 size={16} className="me-1" />
                Delete Customer
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Toast Notifications */}
      <ToastContainer position="top-end" className="p-3" style={{ zIndex: 9999 }}>
        <Toast 
          show={toast.show} 
          onClose={() => setToast({ ...toast, show: false })}
          bg={toast.variant}
          autohide
          delay={3000}
        >
          <Toast.Header>
            <strong className="me-auto">
              {toast.variant === 'success' && <CheckCircle size={16} className="me-1" />}
              {toast.variant === 'danger' && <XCircle size={16} className="me-1" />}
              {toast.variant === 'success' ? 'Success' : 'Error'}
            </strong>
          </Toast.Header>
          <Toast.Body className={toast.variant === 'success' || toast.variant === 'danger' ? 'text-white' : ''}>
            {toast.message}
          </Toast.Body>
        </Toast>
      </ToastContainer>
    </div>
  );
};

export default CustomerManagement;