import React, { useEffect, useState, useMemo } from 'react';
import { Container, Row, Col, Card, Table, Button, Tabs, Tab, Form, InputGroup, Modal } from 'react-bootstrap';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import api from './api';
import { ToastProvider, useToast } from './components/ToastProvider';
import { EmployeeProvider, useEmployees } from './components/EmployeeContext';
import './styles/hr.css';
import { useLocation, useNavigate } from 'react-router-dom';

const MovementsInner = ({ embedded = false }) => {
  const [movements, setMovements] = useState([]);
  const { show: toast } = useToast();
  const { employees } = useEmployees();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showStartModal, setShowStartModal] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedMovement, setSelectedMovement] = useState(null);
  const [startReason, setStartReason] = useState('');

  // Helper function to format duration
  const formatDuration = (duration) => {
    if (!duration) return '-';
    
    // If duration is already formatted (like "2 hours 30 minutes"), return it
    if (typeof duration === 'string' && duration.includes('hour')) return duration;
    
    let totalMinutes = 0;
    
    if (typeof duration === 'string') {
      const parts = duration.split(':');
      if (parts.length === 3) {
        // Format: HH:MM:SS
        totalMinutes = parseInt(parts[0]) * 60 + parseInt(parts[1]);
      } else if (parts.length === 2) {
        // Format: HH:MM
        totalMinutes = parseInt(parts[0]) * 60 + parseInt(parts[1]);
      } else {
        // Try parsing as float (seconds or minutes)
        const num = parseFloat(duration);
        if (!isNaN(num)) {
          // Assume it's seconds if > 60, otherwise minutes
          totalMinutes = num > 60 ? Math.floor(num / 60) : Math.floor(num);
        }
      }
    } else if (typeof duration === 'number') {
      // If it's a large number, likely seconds; if small, likely hours
      if (duration > 60) {
        // Assume seconds
        totalMinutes = Math.floor(duration / 60);
      } else {
        // Assume hours (convert to minutes)
        totalMinutes = Math.floor(duration * 60);
      }
    }
    
    if (totalMinutes === 0) return '< 1m';
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (hours > 0 && minutes > 0) {
      return `${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${minutes}m`;
    }
  };

  const fetch = async () => {
    try {
      const resp = await api.get('/hr/movements/');
      if (Array.isArray(resp.data)) setMovements(resp.data);
      else if (resp.data && Array.isArray(resp.data.results)) setMovements(resp.data.results);
      else setMovements([]);
    } catch (e) { 
      console.warn('Movements fetch failed', e?.message); 
      toast('danger', 'Movements fetch failed', e?.message || ''); 
      setMovements([]);
    }
  };

  useEffect(()=>{ fetch(); }, []);

  const startMovement = async (employee) => {
    if (!startReason.trim()) {
      toast('danger', 'Please enter a reason');
      return;
    }
    try {
      const payload = {
        employee: employee.id,
        reason: startReason,
        start_time: new Date().toISOString()
      };
      const resp = await api.post('/hr/movements/start_movement/', payload);
      toast('success', 'Movement started');
      setMovements(prev => [resp.data, ...prev]);
      setShowStartModal(false);
      setStartReason('');
      setSelectedEmployee(null);
    } catch (e) { 
      console.warn('Start movement failed', e?.message); 
      toast('danger', 'Start movement failed', e?.message || ''); 
    }
  };

  const endMovement = async (m) => {
    try {
      const resp = await api.post(`/hr/movements/${m.id}/end_movement/`, {
        end_time: new Date().toISOString()
      });
      toast('success', 'Movement ended');
      setMovements(prev => prev.map(x => x.id === resp.data.id ? resp.data : x));
      setShowEndModal(false);
      setSelectedMovement(null);
    } catch (e) { 
      console.warn('End movement failed', e?.message); 
      toast('danger', 'End movement failed', e?.message || ''); 
    }
  };

  const filteredMovements = useMemo(() => {
    return movements.filter(m => {
      const empName = m.employee_name || '';
      const empId = String(m.employee || '');
      const emp = employees.find(e => e.id === m.employee);
      const empPhone = emp?.phone || '';
      const query = searchQuery.toLowerCase();
      const matchesSearch = !query || empName.toLowerCase().includes(query) || empId.includes(query) || empPhone.includes(query);
      const matchesStatus = !statusFilter || (statusFilter === 'ongoing' && !m.end_time) || (statusFilter === 'completed' && m.end_time);
      return matchesSearch && matchesStatus;
    });
  }, [movements, searchQuery, statusFilter, employees]);

  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
  };

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

  const content = (
    <div className="hr-container">
      <div className="hr-topbar">
        <div>
          <div className="title">Movement Logs</div>
          <div className="subtitle">Track out-of-office movements for employees</div>
        </div>
      </div>

      <div className="hr-panel">
        {/* Search and Filters */}
        <div className="d-flex gap-2 mb-3 align-items-center">
          <InputGroup style={{ maxWidth: 350 }}>
            <Form.Control 
              placeholder="Search by ID, name, or phone..." 
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
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
          </Form.Select>
          <Button variant="outline-danger" size="sm" onClick={resetFilters}>
            Reset
          </Button>
        </div>

        <Table responsive className="hr-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Phone</th>
              <th>Start</th>
              <th>End</th>
              <th>Duration</th>
              <th>Reason</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredMovements.length === 0 ? (
              <tr><td colSpan={7} className="text-center text-muted">No movements</td></tr>
            ) : filteredMovements.map((m,i)=> {
              // Find employee from employees list to get phone number
              const emp = employees.find(e => e.id === m.employee);
              return (
              <tr key={m.id||i}>
                <td>{m.employee_name || `Employee #${m.employee}`}</td>
                <td>{emp?.phone || '-'}</td>
                <td>{m.start_time ? new Date(m.start_time).toLocaleString('en-PK', { timeZone: 'Asia/Karachi' }) : '-'}</td>
                <td>{m.end_time ? new Date(m.end_time).toLocaleString('en-PK', { timeZone: 'Asia/Karachi' }) : '-'}</td>
                <td>{formatDuration(m.duration)}</td>
                <td>{m.reason}</td>
                <td>
                  {m.end_time ? (
                    <span className="text-muted">Completed</span>
                  ) : (
                    <Button 
                      size="sm" 
                      variant="outline-danger" 
                      onClick={() => {
                        setSelectedMovement(m);
                        setShowEndModal(true);
                      }}
                    >
                      End Movement
                    </Button>
                  )}
                </td>
              </tr>
              );
            })}
          </tbody>
        </Table>

        {/* Employee List for Starting Movement */}
        <div className="mt-4">
          <h6 className="mb-3">Start Movement for Employees</h6>
          <Table responsive className="hr-table" size="sm">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Role</th>
                <th>Phone</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 ? (
                <tr><td colSpan={5} className="text-center text-muted">No employees</td></tr>
              ) : employees.filter(e => e.is_active).map((e) => (
                <tr key={e.id}>
                  <td>{e.id}</td>
                  <td>{e.first_name} {e.last_name}</td>
                  <td>{e.role || '-'}</td>
                  <td>{e.phone || '-'}</td>
                  <td>
                    <Button 
                      size="sm" 
                      variant="outline-primary"
                      onClick={() => {
                        setSelectedEmployee(e);
                        setShowStartModal(true);
                      }}
                    >
                      Start Movement
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </div>

      {/* Start Movement Modal */}
      <Modal show={showStartModal} onHide={() => { setShowStartModal(false); setStartReason(''); setSelectedEmployee(null); }} centered>
        <Modal.Header closeButton>
          <Modal.Title>Start Movement</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p><strong>Employee:</strong> {selectedEmployee?.first_name} {selectedEmployee?.last_name}</p>
          <Form.Group className="mb-3">
            <Form.Label>Reason for Movement *</Form.Label>
            <Form.Control 
              as="textarea" 
              rows={3} 
              value={startReason} 
              onChange={(e) => setStartReason(e.target.value)}
              placeholder="Enter reason for out-of-office movement..."
            />
          </Form.Group>
          <p className="text-muted small">Start time will be recorded automatically using current PKT date and time.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => { setShowStartModal(false); setStartReason(''); setSelectedEmployee(null); }}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => startMovement(selectedEmployee)}>
            Start Movement
          </Button>
        </Modal.Footer>
      </Modal>

      {/* End Movement Confirmation Modal */}
      <Modal show={showEndModal} onHide={() => { setShowEndModal(false); setSelectedMovement(null); }} centered>
        <Modal.Header closeButton>
          <Modal.Title>End Movement</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to close this movement? </p>
          <p><strong>Employee:</strong> {selectedMovement?.employee_name || `Employee #${selectedMovement?.employee}`}</p>
          <p><strong>Reason:</strong> {selectedMovement?.reason}</p>
          <p className="text-muted small">End time will be recorded automatically using current PKT date and time.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => { setShowEndModal(false); setSelectedMovement(null); }}>
            No
          </Button>
          <Button variant="danger" onClick={() => endMovement(selectedMovement)}>
            Yes, End Movement
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );

  if (embedded) return <div className="hr-embedded">{content}</div>;

  return (
    <div className="d-flex hr-root">
      <Sidebar />
      <div className="flex-grow-1">
        <Header />
        <Tabs
          activeKey={localKey}
          onSelect={(k) => {
            setLocalKey(k);
            switch (k) {
              case 'employees': navigate('/hr/employees'); break;
              case 'attendance': navigate('/hr/attendance'); break;
              case 'movements': navigate('/hr/movements'); break;
              case 'commissions': navigate('/hr/commissions'); break;
              case 'punctuality': navigate('/hr/punctuality'); break;
              case 'approvals': navigate('/hr/approvals'); break;
              case 'payments': navigate('/hr/payments'); break;
              default: navigate('/hr');
            }
          }}
          className="mb-3"
        >
          <Tab eventKey="dashboard" title="Dashboard" />
          <Tab eventKey="employees" title="Employees" />
          <Tab eventKey="attendance" title="Attendance" />
          <Tab eventKey="movements" title="Movements" />
          <Tab eventKey="commissions" title="Commissions" />
          <Tab eventKey="approvals" title="Approvals" />
          <Tab eventKey="payments" title="Payments" />
          <Tab eventKey="punctuality" title="Punctuality" />
        </Tabs>
        {content}
      </div>
    </div>
  );
};

const MovementsPage = (props) => (
  <EmployeeProvider>
    <ToastProvider>
      <MovementsInner {...props} />
    </ToastProvider>
  </EmployeeProvider>
);

export default MovementsPage;
