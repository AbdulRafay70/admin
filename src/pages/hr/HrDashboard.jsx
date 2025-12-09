import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Tabs, Tab, Badge, Button, Table, ProgressBar, Form, InputGroup } from 'react-bootstrap';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import './styles/hr.css';
import { EmployeeProvider } from './components/EmployeeContext';
import { ToastProvider, useToast } from './components/ToastProvider';
import api from './api';

import EmployeesPage from './EmployeesPage';
import AttendancePage from './AttendancePage';
import MovementsPage from './MovementsPage';
import CommissionsPage from './CommissionsPage';
import PunctualityPage from './PunctualityPage';
import ApprovalsPage from './ApprovalsPage';
import PaymentsPage from './PaymentsPage';
import { useLocation, useNavigate } from 'react-router-dom';

const InnerHrDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { show: toast } = useToast();

  const [stats, setStats] = useState({
    total_active_employees: 0,
    present_today: 0,
    open_movements_today: 0,
    unpaid_commissions_amount: 0,
    total_salaries_paid_this_month: 0,
    late_today: 0,
    absent_today: 0,
    average_checkin_time: '-',
    pending_approvals: 0,
    total_salary_pending: 0
  });
  const [notifications, setNotifications] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [actualPendingCount, setActualPendingCount] = useState(0);

  const routeToKey = (pathname) => {
    if (pathname.startsWith('/hr/employees')) return 'employees';
    if (pathname.startsWith('/hr/attendance')) return 'attendance';
    if (pathname.startsWith('/hr/movements')) return 'movements';
    if (pathname.startsWith('/hr/commissions')) return 'commissions';
    if (pathname.startsWith('/hr/punctuality')) return 'punctuality';
    if (pathname.startsWith('/hr/approvals')) return 'approvals';
    if (pathname.startsWith('/hr/payments')) return 'payments';
    return 'dashboard';
  };

  const [activeKey, setActiveKey] = useState(routeToKey(location.pathname));

  useEffect(() => {
    setActiveKey(routeToKey(location.pathname));
  }, [location.pathname]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const resp = await api.get('/hr/employees/dashboard_stats/');
        setStats(resp.data);
      } catch (e) {
        console.error('Failed to fetch dashboard stats', e);
        toast('warning', 'Stats unavailable', 'Could not load dashboard statistics');
      }
    };

    const fetchNotifications = async () => {
      try {
        // Fetch pending leave requests as notifications
        const leaveResp = await api.get('/hr/leave-requests/?status=pending');
        const leaveRequests = leaveResp.data.results || leaveResp.data || [];
        
        // Set the actual pending count
        setActualPendingCount(leaveRequests.length);
        
        const leaveNotifs = leaveRequests.map(lr => ({
          id: `leave-${lr.id}`,
          type: 'Leave Request',
          message: `${lr.employee_name} requested ${lr.request_type} leave for ${lr.date}`,
          time: lr.created_at || lr.date,
          badge: 'warning'
        }));

        // Fetch attendance requiring approval
        const attResp = await api.get('/hr/attendance/?is_approved=false');
        const attNotifs = (attResp.data.results || attResp.data || []).slice(0, 5).map(att => ({
          id: `att-${att.id}`,
          type: 'Early Checkout',
          message: `${att.employee_name} early checkout on ${att.date}`,
          time: att.check_out_time,
          badge: 'info'
        }));

        setNotifications([...leaveNotifs, ...attNotifs].slice(0, 10));
      } catch (e) {
        console.error('Failed to fetch notifications', e);
      }
    };

    if (activeKey === 'dashboard') {
      fetchStats();
      fetchNotifications();
    }
  }, [activeKey]);

  return (
    <EmployeeProvider>
      <ToastProvider>
        <div className="d-flex hr-root">
          <Sidebar />
          <div className="flex-grow-1">
            <Header />
            <Container fluid className="p-3">
              <h3 className="mb-3">HR</h3>

              <Tabs
                activeKey={activeKey}
                onSelect={(k) => {
                  setActiveKey(k);
                  // navigate to the corresponding route for each tab
                  switch (k) {
                    case 'employees':
                      navigate('/hr/employees');
                      break;
                    case 'attendance':
                      navigate('/hr/attendance');
                      break;
                    case 'movements':
                      navigate('/hr/movements');
                      break;
                    case 'commissions':
                      navigate('/hr/commissions');
                      break;
                    case 'punctuality':
                      navigate('/hr/punctuality');
                      break;
                    case 'approvals':
                      navigate('/hr/approvals');
                      break;
                    case 'payments':
                      navigate('/hr/payments');
                      break;
                    default:
                      navigate('/hr');
                  }
                }}
                className="mb-3"
              >
                <Tab eventKey="dashboard" title="Dashboard">
                  {/* Primary Stats Row - Employees & Attendance */}
                  <Row className="g-3 mb-3">
                    <Col xs={12} md={6} lg={3}>
                      <Card className="shadow-sm hr-panel">
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-start">
                            <div>
                              <h6 className="text-muted mb-2">Total Employees</h6>
                              <h3 className="mb-1">{stats.total_employees ?? 0}</h3>
                              <small className="text-success">Active workforce</small>
                            </div>
                            <div className="fs-2 text-primary">👥</div>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col xs={12} md={6} lg={3}>
                      <Card className="shadow-sm hr-panel">
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-start">
                            <div>
                              <h6 className="text-muted mb-2">Present Today</h6>
                              <h3 className="mb-1">{stats.present_today ?? 0}</h3>
                              <small className="text-muted">
                                {stats.total_employees > 0 ? Math.round((stats.present_today / stats.total_employees) * 100) : 0}% attendance
                              </small>
                            </div>
                            <div className="fs-2 text-success">✅</div>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col xs={12} md={6} lg={3}>
                      <Card className="shadow-sm hr-panel border-warning">
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-start">
                            <div>
                              <h6 className="text-muted mb-2">Late Today</h6>
                              <h3 className="mb-1 text-warning">{stats.late_today ?? 0}</h3>
                              <small className="text-muted">After grace period</small>
                            </div>
                            <div className="fs-2 text-warning">⚠️</div>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col xs={12} md={6} lg={3}>
                      <Card className="shadow-sm hr-panel border-danger">
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-start">
                            <div>
                              <h6 className="text-muted mb-2">Absent Today</h6>
                              <h3 className="mb-1 text-danger">{stats.absent_today ?? 0}</h3>
                              <small className="text-muted">No check-in</small>
                            </div>
                            <div className="fs-2 text-danger">❌</div>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>

                  {/* Financial Stats Row - Salaries & Commissions */}
                  <Row className="g-3 mb-3">
                    <Col xs={12} md={6} lg={3}>
                      <Card className="shadow-sm hr-panel bg-light">
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-start">
                            <div>
                              <h6 className="text-muted mb-2">Salaries Paid (Month)</h6>
                              <h3 className="mb-1 text-success">Rs {stats.total_salaries_paid_this_month?.toLocaleString() ?? 0}</h3>
                              <small className="text-muted">Successfully processed</small>
                            </div>
                            <div className="fs-2 text-success">💰</div>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col xs={12} md={6} lg={3}>
                      <Card className="shadow-sm hr-panel bg-light">
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-start">
                            <div>
                              <h6 className="text-muted mb-2">Pending Salaries</h6>
                              <h3 className="mb-1 text-warning">Rs {stats.total_salary_pending?.toLocaleString() ?? 0}</h3>
                              <small className="text-muted">Due this month</small>
                            </div>
                            <div className="fs-2 text-warning">⏳</div>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col xs={12} md={6} lg={3}>
                      <Card className="shadow-sm hr-panel">
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-start">
                            <div>
                              <h6 className="text-muted mb-2">Total Commissions</h6>
                              <h3 className="mb-1 text-info">Rs {stats.total_commissions?.toLocaleString() ?? 0}</h3>
                              <small className="text-info">This month</small>
                            </div>
                            <div className="fs-2 text-info">💵</div>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col xs={12} md={6} lg={3}>
                      <Card className="shadow-sm hr-panel">
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-start">
                            <div>
                              <h6 className="text-muted mb-2">Total Movements</h6>
                              <h3 className="mb-1">{stats.total_movements ?? 0}</h3>
                              <small className="text-warning">Today</small>
                            </div>
                            <div className="fs-2 text-primary">🚗</div>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>

                  {/* Performance & Approvals Row */}
                  <Row className="g-3 mb-3">
                    <Col xs={12} md={6} lg={4}>
                      <Card className="shadow-sm hr-panel">
                        <Card.Body>
                          <h6 className="text-muted mb-3">Avg Check-in Time</h6>
                          <div className="d-flex align-items-center">
                            <div className="fs-2 me-3">⏰</div>
                            <div>
                              <h3 className="mb-0">{stats.average_checkin_time ?? '--:--'}</h3>
                              <small className="text-muted">Company wide average</small>
                            </div>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col xs={12} md={6} lg={4}>
                      <Card className="shadow-sm hr-panel border-primary">
                        <Card.Body>
                          <h6 className="text-muted mb-3">Pending Approvals</h6>
                          <div className="d-flex align-items-center">
                            <div className="fs-2 me-3">📋</div>
                            <div>
                              <h3 className="mb-0 text-primary">{actualPendingCount}</h3>
                              <small className="text-muted">Requires attention</small>
                            </div>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col xs={12} md={6} lg={4}>
                      <Card className="shadow-sm hr-panel">
                        <Card.Body>
                          <h6 className="text-muted mb-3">Punctuality Score</h6>
                          <div className="mb-2">
                            <ProgressBar 
                              now={85} 
                              label="85%" 
                              variant="success" 
                              style={{ height: 25 }}
                            />
                          </div>
                          <small className="text-muted">Overall company punctuality</small>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>

                  <Row className="g-3">
                    <Col xs={12} md={8}>
                      <Card className="shadow-sm hr-panel">
                        <Card.Body>
                          <h6>Recent Activity</h6>
                          {recentActivity && recentActivity.length > 0 ? (
                            <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                              <Table hover size="sm" className="mb-0">
                                <thead>
                                  <tr>
                                    <th>Time</th>
                                    <th>Employee</th>
                                    <th>Action</th>
                                    <th>Status</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {recentActivity.map((activity, idx) => (
                                    <tr key={idx}>
                                      <td><small>{activity.time}</small></td>
                                      <td><small>{activity.employee}</small></td>
                                      <td><small>{activity.action}</small></td>
                                      <td>
                                        <Badge bg={activity.statusBadge || 'secondary'} size="sm">
                                          {activity.status}
                                        </Badge>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </Table>
                            </div>
                          ) : (
                            <div className="text-center text-muted py-4">
                              <div className="fs-3 mb-2">📋</div>
                              <p>No recent activity</p>
                              <small>Check-ins, movements, and approvals will appear here</small>
                            </div>
                          )}
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col xs={12} md={4}>
                      <Card className="shadow-sm hr-panel">
                        <Card.Body>
                          <h6>Notifications</h6>
                          {notifications.length === 0 ? (
                            <div className="text-muted small">No pending notifications</div>
                          ) : (
                            <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                              {notifications.map(notif => (
                                <div key={notif.id} className="mb-2 pb-2 border-bottom">
                                  <div className="d-flex justify-content-between align-items-start">
                                    <Badge bg={notif.badge} className="me-2">{notif.type}</Badge>
                                    <small className="text-muted">{notif.time ? new Date(notif.time).toLocaleTimeString() : ''}</small>
                                  </div>
                                  <div className="small mt-1">{notif.message}</div>
                                </div>
                              ))}
                            </div>
                          )}
                        </Card.Body>
                      </Card>
                      <Card className="shadow-sm hr-panel mt-3">
                        <Card.Body>
                          <h6>Quick Actions</h6>
                          <div className="d-flex flex-column gap-2">
                            <Button size="sm" variant="outline-primary" onClick={() => navigate('/hr/employees')}>👥 View All Employees</Button>
                            <Button size="sm" variant="outline-primary" onClick={() => navigate('/hr/attendance')}>📅 Open Attendance</Button>
                            <Button size="sm" variant="outline-primary" onClick={() => navigate('/hr/movements')}>🚗 Track Movements</Button>
                            <Button size="sm" variant="outline-success" onClick={() => handleTabSelect('payments')}>💰 Manage Payments</Button>
                            <Button size="sm" variant="outline-warning" onClick={() => handleTabSelect('approvals')}>📋 Review Approvals</Button>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                </Tab>
                <Tab eventKey="employees" title="Employees">
                  <div style={{ padding: 8 }}>
                    <EmployeesPage embedded />
                  </div>
                </Tab>
                <Tab eventKey="attendance" title="Attendance">
                  <div style={{ padding: 8 }}>
                    <AttendancePage embedded />
                  </div>
                </Tab>
                <Tab eventKey="movements" title="Movements">
                  <div style={{ padding: 8 }}>
                    <MovementsPage embedded />
                  </div>
                </Tab>
                <Tab eventKey="commissions" title="Commissions">
                  <div style={{ padding: 8 }}>
                    <CommissionsPage embedded />
                  </div>
                </Tab>
                <Tab eventKey="approvals" title="📋 Approvals">
                  <div style={{ padding: 8 }}>
                    <ApprovalsPage embedded />
                  </div>
                </Tab>
                <Tab eventKey="payments" title="💰 Payments">
                  <div style={{ padding: 8 }}>
                    <PaymentsPage embedded />
                  </div>
                </Tab>
                <Tab eventKey="punctuality" title="Punctuality">
                  <div style={{ padding: 8 }}>
                    <PunctualityPage embedded />
                  </div>
                </Tab>

              </Tabs>
            </Container>
          </div>
        </div>
      </ToastProvider>
    </EmployeeProvider>
  );
};

const HrDashboard = () => (
  <EmployeeProvider>
    <ToastProvider>
      <InnerHrDashboard />
    </ToastProvider>
  </EmployeeProvider>
);

export default HrDashboard;
