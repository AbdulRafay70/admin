import React, { useEffect, useState, useMemo } from 'react';
import { Container, Row, Col, Card, Table, Button, Form, InputGroup, Badge } from 'react-bootstrap';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import HRTabs from '../../components/HRTabs';
import api from './api';
import './styles/hr.css';
import { EmployeeProvider, useEmployees } from './components/EmployeeContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { ToastProvider, useToast } from './components/ToastProvider';

const CommissionsInner = ({ embedded = false }) => {
  const [commissions, setCommissions] = useState([]);
  const { show: toast } = useToast();
  const { employees } = useEmployees();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [employeeFilter, setEmployeeFilter] = useState('');

  const fetch = async () => {
    try {
      const resp = await api.get('/hr/commissions/');
      setCommissions(resp.data || []);
    } catch (e) {
      console.error(e);
      // toast('danger','Fetch failed', e?.message || ''); 
      setCommissions([]);
    }
  };

  useEffect(() => { fetch(); }, []);

  const filteredCommissions = useMemo(() => {
    return commissions.filter(c => {
      // commission.employee is usually an ID, but serializer might return object in some setups.
      // HR CommissionSerializer returns employee ID primarily, but we can look it up.
      let empName = '';
      if (c.employee_name) empName = c.employee_name;
      else if (employees.length > 0) {
        const e = employees.find(ep => ep.id === c.employee);
        if (e) empName = e.first_name + ' ' + e.last_name;
      }

      const query = searchQuery.toLowerCase();
      const bookingRef = (c.booking_id || '').toLowerCase();

      const matchesSearch = !query ||
        empName.toLowerCase().includes(query) ||
        bookingRef.includes(query) ||
        String(c.id).includes(query);

      const matchesStatus = !statusFilter || c.status === statusFilter;
      const matchesEmployee = !employeeFilter || String(c.employee) === employeeFilter;

      return matchesSearch && matchesStatus && matchesEmployee;
    });
  }, [commissions, searchQuery, statusFilter, employeeFilter, employees]);

  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
    setEmployeeFilter('');
  };

  const getTotalEarned = () => filteredCommissions.reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);
  const getTotalPaid = () => filteredCommissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);
  const getTotalPending = () => filteredCommissions.filter(c => c.status === 'unpaid' || c.status === 'pending').reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);

  const location = useLocation();

  const getStatusBadge = (status) => {
    switch (status) {
      case 'paid': return <Badge bg="success">✓ Paid</Badge>;
      case 'unpaid': return <Badge bg="warning" text="dark">⏳ Unpaid</Badge>;
      case 'pending': return <Badge bg="warning" text="dark">⏳ Pending</Badge>;
      case 'reversed': return <Badge bg="danger">Reversed</Badge>;
      default: return <Badge bg="secondary">{status}</Badge>;
    }
  };

  const getEmployeeName = (c) => {
    if (c.employee_name) return c.employee_name;
    const emp = employees.find(e => e.id === c.employee);
    return emp ? `${emp.first_name} ${emp.last_name}` : `Employee #${c.employee}`;
  };

  const content = (
    <div className="hr-container">
      <div className="hr-topbar">
        <div>
          <div className="title">Commissions</div>
          <div className="subtitle">Track employee commission earnings and payments</div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="hr-cards">
        <div className="hr-card">
          <h4>Total Earned</h4>
          <p>PKR {getTotalEarned().toLocaleString()}</p>
        </div>
        <div className="hr-card" style={{ borderLeft: '4px solid #198754' }}>
          <h4>Paid</h4>
          <p className="text-success">PKR {getTotalPaid().toLocaleString()}</p>
        </div>
        <div className="hr-card" style={{ borderLeft: '4px solid #ffc107' }}>
          <h4>Unpaid</h4>
          <p className="text-warning">PKR {getTotalPending().toLocaleString()}</p>
        </div>
      </div>

      <div className="hr-panel">
        {/* Filters */}
        <div className="d-flex gap-2 mb-3 align-items-center flex-wrap">
          <InputGroup style={{ maxWidth: 300 }}>
            <Form.Control
              placeholder="Search by name, booking #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </InputGroup>
          <Form.Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ maxWidth: 150 }}
          >
            <option value="">All Status</option>
            <option value="unpaid">Unpaid</option>
            <option value="paid">Paid</option>
          </Form.Select>
          <Form.Select
            value={employeeFilter}
            onChange={(e) => setEmployeeFilter(e.target.value)}
            style={{ maxWidth: 200 }}
          >
            <option value="">All Employees</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>
                {emp.first_name} {emp.last_name}
              </option>
            ))}
          </Form.Select>
          <Button variant="outline-dark" size="sm" onClick={resetFilters}>
            Reset
          </Button>
          <div className="ms-auto text-muted small">
            Expecting <strong>{filteredCommissions.length}</strong> records
          </div>
        </div>

        {/* Commissions Table */}
        <Table responsive hover className="hr-table align-middle">
          <thead className="bg-light">
            <tr>
              <th>Comm #</th>
              <th>Date</th>
              <th>Employee</th>
              <th>Booking Details</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredCommissions.length === 0 ? (
              <tr><td colSpan={6} className="text-center text-muted py-5">No commissions found</td></tr>
            ) : filteredCommissions.map((c) => (
              <tr key={c.id}>
                <td><small className="text-muted">#{c.id}</small></td>
                <td>{c.date}</td>
                <td>
                  <div className="fw-bold">{getEmployeeName(c)}</div>
                </td>
                <td>
                  <div><strong>{c.booking_id || 'N/A'}</strong></div>
                  <div className="small text-muted" style={{ fontSize: '0.85em' }}>
                    {c.service_type ? c.service_type.replace('_', ' ').toUpperCase() : 'BOOKING'}
                  </div>
                </td>
                <td><strong>PKR {parseFloat(c.amount || 0).toLocaleString()}</strong></td>
                <td>{getStatusBadge(c.status)}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </div>
  );

  if (embedded) return <div className="hr-embedded">{content}</div>;

  return (
    <div className="d-flex hr-root">
      <Sidebar />
      <div className="flex-grow-1">
        <Header />
        <Container fluid className="py-4">
          <HRTabs activeName="Commissions" />
          {content}
        </Container>
      </div>
    </div>
  );
};

const CommissionsPage = (props) => (
  <EmployeeProvider>
    <ToastProvider>
      <CommissionsInner {...props} />
    </ToastProvider>
  </EmployeeProvider>
);

export default CommissionsPage;
