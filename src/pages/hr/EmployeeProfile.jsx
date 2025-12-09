import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, Tabs, Tab, Modal, Form, Badge, Table } from 'react-bootstrap';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import api from './api';
import { ToastProvider, useToast } from './components/ToastProvider';
import './styles/hr.css';
import { useParams, useNavigate, useLocation } from 'react-router-dom';

// Employee-specific embedded components
const EmployeeAttendance = ({ employeeId }) => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const resp = await api.get(`/hr/attendance/?employee=${employeeId}`);
        const data = Array.isArray(resp.data) ? resp.data : resp.data.results || [];
        setRecords(data.sort((a, b) => new Date(b.date) - new Date(a.date)));
      } catch (e) {
        console.error('Failed to fetch attendance:', e);
      } finally {
        setLoading(false);
      }
    };
    if (employeeId) fetch();
  }, [employeeId]);

  const getStatusBadge = (status) => {
    const badges = {
      on_time: <Badge bg="success">✓ On Time</Badge>,
      grace: <Badge bg="warning">⚠️ Grace</Badge>,
      late: <Badge bg="danger">🕐 Late</Badge>,
      present: <Badge bg="primary">Present</Badge>,
      absent: <Badge bg="dark">❌ Absent</Badge>,
      half_day: <Badge bg="info">Half Day</Badge>
    };
    return badges[status] || <Badge bg="secondary">{status}</Badge>;
  };

  if (loading) return <div className="text-center py-4">Loading...</div>;

  return (
    <div>
      <h5 className="mb-3">My Attendance History</h5>
      {records.length === 0 ? (
        <div className="text-center text-muted py-4">No attendance records found</div>
      ) : (
        <Table responsive hover>
          <thead>
            <tr>
              <th>Date</th>
              <th>Check-In</th>
              <th>Check-Out</th>
              <th>Working Hours</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {records.map(r => (
              <tr key={r.id}>
                <td><strong>{r.date}</strong></td>
                <td>{r.check_in ? new Date(r.check_in).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                <td>{r.check_out ? new Date(r.check_out).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                <td>{r.working_hours || '-'}</td>
                <td>{getStatusBadge(r.status)}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
};

const EmployeeMovements = ({ employeeId }) => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const resp = await api.get(`/hr/movements/?employee=${employeeId}`);
        const data = Array.isArray(resp.data) ? resp.data : resp.data.results || [];
        setRecords(data.sort((a, b) => new Date(b.start_time) - new Date(a.start_time)));
      } catch (e) {
        console.error('Failed to fetch movements:', e);
      } finally {
        setLoading(false);
      }
    };
    if (employeeId) fetch();
  }, [employeeId]);

  if (loading) return <div className="text-center py-4">Loading...</div>;

  return (
    <div>
      <h5 className="mb-3">My Movement Logs</h5>
      {records.length === 0 ? (
        <div className="text-center text-muted py-4">No movement records found</div>
      ) : (
        <Table responsive hover>
          <thead>
            <tr>
              <th>Start Time</th>
              <th>End Time</th>
              <th>Duration</th>
              <th>Reason</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {records.map(r => (
              <tr key={r.id}>
                <td>{new Date(r.start_time).toLocaleString()}</td>
                <td>{r.end_time ? new Date(r.end_time).toLocaleString() : <Badge bg="warning">In Progress</Badge>}</td>
                <td>{r.duration || '-'}</td>
                <td className="small">{r.reason}</td>
                <td>{r.end_time ? <Badge bg="success">Completed</Badge> : <Badge bg="warning">Active</Badge>}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
};

const EmployeeCommissions = ({ employeeId }) => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const resp = await api.get(`/hr/commissions/?employee=${employeeId}`);
        const data = Array.isArray(resp.data) ? resp.data : resp.data.results || [];
        setRecords(data.sort((a, b) => new Date(b.date) - new Date(a.date)));
      } catch (e) {
        console.error('Failed to fetch commissions:', e);
      } finally {
        setLoading(false);
      }
    };
    if (employeeId) fetch();
  }, [employeeId]);

  const totalEarned = records.reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);
  const totalPaid = records.filter(r => r.status === 'paid').reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);
  const totalUnpaid = records.filter(r => r.status === 'unpaid').reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);

  if (loading) return <div className="text-center py-4">Loading...</div>;

  return (
    <div>
      <h5 className="mb-3">My Commissions</h5>
      <Row className="mb-3 g-2">
        <Col md={4}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="text-muted small">Total Earned</div>
              <h4>PKR {totalEarned.toLocaleString()}</h4>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="border-0 shadow-sm bg-success text-white">
            <Card.Body>
              <div className="small">Paid</div>
              <h4>PKR {totalPaid.toLocaleString()}</h4>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="border-0 shadow-sm bg-warning">
            <Card.Body>
              <div className="small">Unpaid</div>
              <h4>PKR {totalUnpaid.toLocaleString()}</h4>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      {records.length === 0 ? (
        <div className="text-center text-muted py-4">No commission records found</div>
      ) : (
        <Table responsive hover>
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {records.map(r => (
              <tr key={r.id}>
                <td>{r.date}</td>
                <td className="small">{r.description || '-'}</td>
                <td><strong>PKR {parseFloat(r.amount).toLocaleString()}</strong></td>
                <td>
                  {r.status === 'paid' ? (
                    <Badge bg="success">✓ Paid</Badge>
                  ) : (
                    <Badge bg="warning">⏳ Unpaid</Badge>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
};

const EmployeeSalary = ({ employeeId, currentSalary }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const resp = await api.get(`/hr/salary-history/?employee=${employeeId}`);
        const data = Array.isArray(resp.data) ? resp.data : resp.data.results || [];
        setHistory(data.sort((a, b) => new Date(b.effective_date) - new Date(a.effective_date)));
      } catch (e) {
        console.error('Failed to fetch salary history:', e);
      } finally {
        setLoading(false);
      }
    };
    if (employeeId) fetch();
  }, [employeeId]);

  if (loading) return <div className="text-center py-4">Loading...</div>;

  return (
    <div>
      <h5 className="mb-3">My Salary</h5>
      <Card className="border-0 shadow-sm bg-primary text-white mb-3">
        <Card.Body>
          <div className="small mb-1">Current Salary</div>
          <h2 className="mb-0">PKR {currentSalary ? parseFloat(currentSalary).toLocaleString() : '0'}</h2>
        </Card.Body>
      </Card>
      <h6 className="mb-2">Salary History</h6>
      {history.length === 0 ? (
        <div className="text-center text-muted py-4">No salary history found</div>
      ) : (
        <Table responsive hover>
          <thead>
            <tr>
              <th>Effective Date</th>
              <th>Salary</th>
              <th>Reason</th>
            </tr>
          </thead>
          <tbody>
            {history.map(h => (
              <tr key={h.id}>
                <td><strong>{h.effective_date}</strong></td>
                <td>PKR {parseFloat(h.salary).toLocaleString()}</td>
                <td className="small text-muted">{h.reason || '-'}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
};

const InnerEmployeeProfile = ({ embedded = false }) => {
  const { id } = useParams();
  const [employee, setEmployee] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [localKey, setLocalKey] = useState('dashboard');
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showCheckOutModal, setShowCheckOutModal] = useState(false);
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [reason, setReason] = useState('');
  const [approvalNotice, setApprovalNotice] = useState('');
  const [pendingCheckoutRequest, setPendingCheckoutRequest] = useState(null);
  const [allCheckoutRequests, setAllCheckoutRequests] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const { show: toast } = useToast();


  
  useEffect(() => {
    const fetch = async () => {
      try {
        const resp = await api.get(`/hr/employees/${id}/`);
        setEmployee(resp.data);
        
        // Fetch today's attendance
        const today = new Date().toISOString().slice(0, 10);
        try {
          const attResp = await api.get(`/hr/attendance/?employee=${id}&date=${today}`);
          const attRecords = Array.isArray(attResp.data) ? attResp.data : attResp.data.results || [];
          setTodayAttendance(attRecords.length > 0 ? attRecords[0] : null);
        } catch (e) {
          console.warn('Could not fetch attendance:', e?.message);
          setTodayAttendance(null);
        }
        
        // Fetch all early checkout requests for this employee
        const leaveResp = await api.get(`/hr/leave-requests/?employee=${id}&request_type=early_checkout`);
        const requests = Array.isArray(leaveResp.data) ? leaveResp.data : leaveResp.data.results || [];
        setAllCheckoutRequests(requests);
        
        // Check for pending early checkout request for today
        const pendingToday = requests.find(r => r.status === 'pending' && r.date === today);
        
        if (pendingToday) {
          setPendingCheckoutRequest(pendingToday);
          setApprovalNotice('Early checkout request pending approval');
        } else {
          setPendingCheckoutRequest(null);
          setApprovalNotice('');
        }
      } catch (e) {
        console.error(e);
        toast('danger', 'Fetch failed', e?.message || 'Failed to fetch employee');
      }
    };
    if (id) fetch();
  }, [id]);

  const handleCheckIn = async () => {
    if (!employee) return;
    try {
      const resp = await api.post(`/hr/employees/${employee.id}/check_in/`);
      toast('success', 'Checked in', resp.data.message || 'Successfully checked in');
      setShowCheckInModal(false);
      
      // Refresh employee data and attendance
      const refresh = await api.get(`/hr/employees/${id}/`);
      setEmployee(refresh.data);
      
      const today = new Date().toISOString().slice(0, 10);
      const attResp = await api.get(`/hr/attendance/?employee=${id}&date=${today}`);
      const attRecords = Array.isArray(attResp.data) ? attResp.data : attResp.data.results || [];
      setTodayAttendance(attRecords.length > 0 ? attRecords[0] : null);
    } catch (e) {
      console.error(e);
      toast('danger', 'Check-in failed', e?.response?.data?.error || e?.message || 'Failed to check in');
    }
  };

  const handleCheckOut = async () => {
    if (!employee || !reason.trim()) {
      toast('warning', 'Required', 'Please enter a reason for checkout');
      return;
    }
    try {
      const resp = await api.post(`/hr/employees/${employee.id}/check_out/`, { reason: reason.trim() });
      if (resp.data.requires_approval) {
        setPendingCheckoutRequest({ id: resp.data.request_id, reason: reason.trim() });
        setApprovalNotice('Early checkout request submitted for approval');
        toast('info', 'Pending Approval', resp.data.message || 'Early checkout request submitted. You will be checked out once approved by manager.');
      } else {
        toast('success', 'Checked out', resp.data.message || 'Successfully checked out');
        setPendingCheckoutRequest(null);
        setApprovalNotice('');
      }
      setShowCheckOutModal(false);
      setReason('');
      
      // Refresh employee data and attendance
      const refresh = await api.get(`/hr/employees/${id}/`);
      setEmployee(refresh.data);
      
      const today = new Date().toISOString().slice(0, 10);
      const attResp = await api.get(`/hr/attendance/?employee=${id}&date=${today}`);
      const attRecords = Array.isArray(attResp.data) ? attResp.data : attResp.data.results || [];
      setTodayAttendance(attRecords.length > 0 ? attRecords[0] : null);
      
      // Refresh checkout requests
      const leaveResp = await api.get(`/hr/leave-requests/?employee=${id}&request_type=early_checkout`);
      const requests = Array.isArray(leaveResp.data) ? leaveResp.data : leaveResp.data.results || [];
      setAllCheckoutRequests(requests);
    } catch (e) {
      console.error(e);
      if (e?.response?.status === 400 && e?.response?.data?.detail?.includes('already pending')) {
        toast('warning', 'Already Pending', 'You already have a pending early checkout request');
      } else {
        toast('danger', 'Check-out failed', e?.response?.data?.detail || e?.response?.data?.error || e?.message || 'Failed to check out');
      }
    }
  };

  const handleStartMovement = async () => {
    if (!employee || !reason.trim()) {
      toast('warning', 'Required', 'Please enter a reason for movement');
      return;
    }
    try {
      await api.post('/hr/movements/start_movement/', {
        employee: employee.id,
        reason: reason.trim()
      });
      toast('success', 'Movement started', 'Movement has been logged with PKT timestamp');
      setShowMovementModal(false);
      setReason('');
    } catch (e) {
      console.error(e);
      toast('danger', 'Failed', e?.response?.data?.error || e?.message || 'Failed to start movement');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <Badge bg="warning" text="dark">⏳ Pending</Badge>;
      case 'approved':
        return <Badge bg="success">✅ Approved</Badge>;
      case 'rejected':
        return <Badge bg="danger">❌ Rejected</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };

  const content = (
    <Container fluid className="hr-container">
      <Row className="mb-3 align-items-center">
        <Col>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <Button className="btn-ghost" onClick={() => navigate('/hr?tab=employees')}>Back</Button>
            <h3 style={{margin:0}}>Employee Profile</h3>
          </div>
          
        </Col>
        <Col xs="auto">
          <Button className="btn-primary me-2">Save</Button>
          <Button className="btn-ghost">More</Button>
        </Col>
      </Row>
      

      <Row>
        <Col xs={12} md={4}>
          <Card className="mb-3 hr-panel">
            <Card.Body>
              <div style={{display:'flex',gap:12}}>
                <div className="avatar" style={{width:72,height:72,fontSize:20}}>{employee ? `${(employee.first_name||'')[0]}${(employee.last_name||'')[0]}` : 'NN'}</div>
                <div>
                  <h4 style={{margin:0}}>{employee ? `${employee.first_name} ${employee.last_name || ''}` : 'Employee'}</h4>
                  <div className="small-muted">Role: {employee?.role || '-'}</div>
                  <div className="small-muted">Joined: {employee?.joining_date || '-'}</div>
                </div>
              </div>

              <hr />
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                <div><strong>Salary</strong><div>PKR {employee?.salary || '50,000'}</div></div>
                <div><strong>Branch</strong><div>{employee?.branch_name || '-'}</div></div>
                <div><strong>Status</strong><div className="status-chip status-in" style={{display:'inline-block',marginTop:6}}>{employee?.is_active ? 'Active' : 'Inactive'}</div></div>
              </div>

              {approvalNotice && (
                <div className="alert alert-info mt-3 mb-0 small">
                  <strong>⏳ {approvalNotice}</strong>
                  {pendingCheckoutRequest && (
                    <div className="mt-2">
                      <div>Reason: {pendingCheckoutRequest.reason}</div>
                      <div className="text-muted small">Request ID: #{pendingCheckoutRequest.id}</div>
                    </div>
                  )}
                </div>
              )}

              <hr />
              <h6>Quick Actions</h6>
              <div style={{display:'flex',flexDirection:'column',gap:8,marginTop:8}}>
                {!todayAttendance || !todayAttendance.check_in ? (
                  // Not checked in - show Check In button
                  <Button className="btn-primary" onClick={() => setShowCheckInModal(true)}>
                    ✅ Check In
                  </Button>
                ) : !todayAttendance.check_out ? (
                  // Checked in but not checked out - show Check Out button
                  <Button 
                    className="btn-primary" 
                    onClick={() => setShowCheckOutModal(true)}
                    disabled={!!pendingCheckoutRequest}
                  >
                    {pendingCheckoutRequest ? '⏳ Checkout Pending Approval' : '🚪 Check Out'}
                  </Button>
                ) : (
                  // Already checked out today
                  <Button className="btn-secondary" disabled>
                    ✓ Already Checked Out Today
                  </Button>
                )}
                <Button className="btn-ghost" onClick={() => setShowMovementModal(true)}>🚶 Start Movement</Button>
              </div>

              <hr />
              <h6>Contact</h6>
              <div className="small-muted">Email: {employee?.email || '-'}</div>
              <div className="small-muted">Phone: {employee?.phone || '-'}</div>
              <div className="small-muted">WhatsApp: {employee?.whatsapp || '-'}</div>
              <div className="small-muted">Address: {employee?.address || '-'}</div>

              <hr />
              <h6>Office Schedule</h6>
              <div className="small-muted">Check-in: {employee?.check_in_time || '09:00'}</div>
              <div className="small-muted">Check-out: {employee?.check_out_time || '18:00'}</div>
              <div className="small-muted">Grace: {employee?.grace_minutes || 15} min</div>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} md={8}>
          <Card className="hr-panel">
            <Card.Body>
              <Tabs defaultActiveKey="info" id="employee-tabs" className="mb-3">
                <Tab eventKey="info" title="Info">
                  <div className="p-3">
                    <h5>Basic Info</h5>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                      <div>
                        <label>First name</label>
                        <input className="form-control" defaultValue={employee?.first_name || ''} />
                      </div>
                      <div>
                        <label>Last name</label>
                        <input className="form-control" defaultValue={employee?.last_name || ''} />
                      </div>
                      <div>
                        <label>Role</label>
                        <select className="form-control" defaultValue={employee?.role || ''}>
                          <option>Sales</option>
                          <option>HR</option>
                          <option>Admin</option>
                        </select>
                      </div>
                      <div>
                        <label>Joining date</label>
                        <input type="date" className="form-control" defaultValue={employee?.joining_date || ''} />
                      </div>
                    </div>
                    <hr />
                    <h6>Linked User</h6>
                    <div>Username: <strong>aisha.k</strong> <Button size="sm" className="btn-ghost">Unlink</Button></div>
                  </div>
                </Tab>
                <Tab eventKey="checkoutRequests" title={`🕐 Checkout Requests ${allCheckoutRequests.length > 0 ? `(${allCheckoutRequests.length})` : ''}`}>
                  <div className="p-3">
                    <h5 className="mb-3">Early Checkout Requests</h5>
                    {allCheckoutRequests.length === 0 ? (
                      <div className="text-center text-muted py-4">
                        No early checkout requests found
                      </div>
                    ) : (
                      <Table responsive hover>
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Reason</th>
                            <th>Status</th>
                            <th>Approved By</th>
                            <th>Notes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {allCheckoutRequests
                            .sort((a, b) => new Date(b.date) - new Date(a.date))
                            .map(req => (
                            <tr key={req.id}>
                              <td>
                                <strong>{req.date}</strong>
                                {req.date === new Date().toISOString().slice(0, 10) && (
                                  <Badge bg="info" className="ms-2">Today</Badge>
                                )}
                              </td>
                              <td className="small">{req.reason || '-'}</td>
                              <td>{getStatusBadge(req.status)}</td>
                              <td className="small text-muted">
                                {req.approved_by ? `User #${req.approved_by}` : '-'}
                              </td>
                              <td className="small text-muted">{req.approval_notes || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    )}
                  </div>
                </Tab>
                <Tab eventKey="salary" title="💰 Salary">
                  <div className="p-3">
                    <EmployeeSalary employeeId={id} currentSalary={employee?.salary} />
                  </div>
                </Tab>
                <Tab eventKey="commissions" title="💵 Commissions">
                  <div className="p-3">
                    <EmployeeCommissions employeeId={id} />
                  </div>
                </Tab>
                <Tab eventKey="attendance" title="📅 Attendance">
                  <div className="p-3">
                    <EmployeeAttendance employeeId={id} />
                  </div>
                </Tab>
                <Tab eventKey="movements" title="🚶 Movements">
                  <div className="p-3">
                    <EmployeeMovements employeeId={id} />
                  </div>
                </Tab>
              </Tabs>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Check In Modal */}
      <Modal show={showCheckInModal} onHide={() => setShowCheckInModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Check-In</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Check in <strong>{employee?.first_name} {employee?.last_name}</strong>?</p>
          <div className="text-muted small">Timestamp will be recorded in PKT timezone with status auto-determined based on office schedule.</div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCheckInModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleCheckIn}>Check In</Button>
        </Modal.Footer>
      </Modal>

      {/* Check Out Modal */}
      <Modal show={showCheckOutModal} onHide={() => setShowCheckOutModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Check Out</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Check out <strong>{employee?.first_name} {employee?.last_name}</strong></p>
          <Form.Group className="mb-3">
            <Form.Label>Reason <span className="text-danger">*</span></Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason for checkout (required for early checkout)"
            />
          </Form.Group>
          <div className="alert alert-warning small mb-0">
            <strong>⚠️ Important:</strong> If you checkout before your scheduled time ({employee?.check_out_time || '18:00'}), 
            a request will be created and sent to your manager for approval. You will only be checked out after the request is approved.
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCheckOutModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleCheckOut}>Submit Checkout</Button>
        </Modal.Footer>
      </Modal>

      {/* Start Movement Modal */}
      <Modal show={showMovementModal} onHide={() => setShowMovementModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Start Movement</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Start movement for <strong>{employee?.first_name} {employee?.last_name}</strong></p>
          <Form.Group className="mb-3">
            <Form.Label>Reason <span className="text-danger">*</span></Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason for movement (e.g., Client meeting, Bank visit)"
            />
          </Form.Group>
          <div className="text-muted small">Start time will be automatically recorded in PKT timezone.</div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowMovementModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleStartMovement}>Start Movement</Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );

  if (embedded) return <div className="hr-embedded">{content}</div>;

  return (
    <div className="d-flex hr-root">
      <Sidebar />
      <div className="flex-grow-1">
        <Header />
        {content}
      </div>
    </div>
  );
};

const EmployeeProfile = (props) => (
  <ToastProvider>
    <InnerEmployeeProfile {...props} />
  </ToastProvider>
);

export default EmployeeProfile;
