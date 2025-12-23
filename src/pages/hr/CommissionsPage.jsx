import React, { useEffect, useState, useMemo } from 'react';
import { Container, Row, Col, Card, Table, Button, Tabs, Tab, Form, InputGroup, Badge } from 'react-bootstrap';
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
  const fetch = async ()=>{
    try{
      const resp = await api.get('/hr/commissions/');
      setCommissions(resp.data || []);
    }catch(e){
      console.error(e); 
      toast('danger','Fetch failed', e?.message || ''); 
      setCommissions([]);
    }  
  };

  useEffect(()=>{fetch();},[]);

  const filteredCommissions = useMemo(() => {
    return commissions.filter(c => {
      const empName = c.employee_display || '';
      const empId = String(c.employee || '');
      const query = searchQuery.toLowerCase();
      const matchesSearch = !query || empName.toLowerCase().includes(query) || empId.includes(query);
      const matchesStatus = !statusFilter || c.status === statusFilter;
      const matchesEmployee = !employeeFilter || String(c.employee) === employeeFilter;
      return matchesSearch && matchesStatus && matchesEmployee;
    });
  }, [commissions, searchQuery, statusFilter, employeeFilter]);

  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
    setEmployeeFilter('');
  };

  const getTotalEarned = () => filteredCommissions.reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);
  const getTotalRedeemed = () => filteredCommissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);
  const getTotalPending = () => filteredCommissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);

  const location = useLocation();
  const navigate = useNavigate();

  const routeToKey = (pathname) => {
    if (pathname.startsWith('/hr/employees')) return 'employees';
    if (pathname.startsWith('/hr/attendance')) return 'attendance';
    if (pathname.startsWith('/hr/movements')) return 'movements';
    if (pathname.startsWith('/hr/commissions')) return 'commissions';
    if (pathname.startsWith('/hr/punctuality')) return 'punctuality';
    if (pathname.startsWith('/hr/approvals')) return 'approvals';
    return 'dashboard';
  };

  const [localKey, setLocalKey] = React.useState(routeToKey(location.pathname));
  React.useEffect(()=>{ setLocalKey(routeToKey(location.pathname)); }, [location.pathname]);

  const markPaid = async (c) => {
    try {
      const resp = await api.patch(`/hr/commissions/${c.id}/`, { status: 'paid' });
      if (resp && resp.data) {
        setCommissions(prev => prev.map(item => item.id === resp.data.id ? resp.data : item));
        toast('success','Updated','Commission marked paid');
      }
    } catch (e) { console.warn('Mark commission paid failed', e?.message); toast('danger','Update failed', e?.message || ''); }
  };

  const content = (
    <div className="hr-container">
      <div className="hr-topbar">
        <div>
          <div className="title">Commissions</div>
          <div className="subtitle">View earned, redeemed, and pending commissions</div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="hr-cards">
        <div className="hr-card">
          <h4>Total Earned</h4>
          <p>Rs. {getTotalEarned().toLocaleString()}</p>
        </div>
        <div className="hr-card">
          <h4>Total Redeemed</h4>
          <p>Rs. {getTotalRedeemed().toLocaleString()}</p>
        </div>
        <div className="hr-card">
          <h4>Total Pending</h4>
          <p>Rs. {getTotalPending().toLocaleString()}</p>
        </div>
      </div>

      <div className="hr-panel">
        {/* Filters */}
        <div className="d-flex gap-2 mb-3 align-items-center">
          <InputGroup style={{ maxWidth: 350 }}>
            <Form.Control 
              placeholder="Search employee..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
            />
          </InputGroup>
          <Form.Select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)} 
            style={{ maxWidth: 180 }}
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="redeemed">Redeemed</option>
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
          <Button variant="outline-danger" size="sm" onClick={resetFilters}>
            Reset
          </Button>
        </div>

        {/* Commissions Table */}
        <Table responsive hover className="hr-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Employee</th>
              <th>Booking</th>
              <th>Amount</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredCommissions.length === 0 ? (
              <tr><td colSpan={6} className="text-center text-muted">No commissions found</td></tr>
            ) : filteredCommissions.map((c, i) => (
              <tr key={c.id || i}>
                <td>{i + 1}</td>
                <td>
                  {(() => {
                    try {
                      if (c.employee && typeof c.employee === 'number') {
                        const emp = (employees || []).find(e => e.id === Number(c.employee));
                        return emp ? `${emp.first_name} ${emp.last_name}` : c.employee;
                      }
                      return c.employee_display || (c.employee && typeof c.employee === 'object' ? `${c.employee.first_name} ${c.employee.last_name}` : c.employee);
                    } catch (ee) {
                      return c.employee_display || c.employee;
                    }
                  })()}
                </td>
                <td>{c.booking || '-'}</td>
                <td>Rs. {parseFloat(c.amount || 0).toLocaleString()}</td>
                <td>{c.date}</td>
                <td>
                  <Badge bg={c.status === 'paid' ? 'success' : c.status === 'pending' ? 'warning' : 'info'}>
                    {c.status}
                  </Badge>
                </td>
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
