import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, Tabs, Tab, Table, Form, InputGroup, Badge, Modal, Alert } from 'react-bootstrap';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import HRTabs from '../../components/HRTabs';
import api from './api';
import { ToastProvider, useToast } from './components/ToastProvider';
import './styles/hr.css';
import { useLocation, useNavigate } from 'react-router-dom';

const InnerPaymentsPage = ({ embedded = false }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { show: toast } = useToast();

  const [salaryPayments, setSalaryPayments] = useState([]);
  const [commissions, setCommissions] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [salaryHistory, setSalaryHistory] = useState([]);
  
  // Filters
  const [salaryEmployeeFilter, setSalaryEmployeeFilter] = useState('');
  const [salaryStatusFilter, setSalaryStatusFilter] = useState('');
  const [salaryMonthFilter, setSalaryMonthFilter] = useState('');
  const [showOverdueOnly, setShowOverdueOnly] = useState(false);
  
  const [commEmployeeFilter, setCommEmployeeFilter] = useState('');
  const [commStatusFilter, setCommStatusFilter] = useState('');
  
  const [historyEmployeeFilter, setHistoryEmployeeFilter] = useState('');

  // Modal state
  const [showMarkPaid, setShowMarkPaid] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateMonth, setGenerateMonth] = useState(new Date().getMonth() + 1);
  const [generateYear, setGenerateYear] = useState(new Date().getFullYear());
  const [isGenerating, setIsGenerating] = useState(false);

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
  React.useEffect(() => { setLocalKey(routeToKey(location.pathname)); }, [location.pathname]);

  useEffect(() => {
    fetchEmployees();
    fetchSalaryPayments();
    fetchCommissions();
    fetchSalaryHistory();
  }, []);

  const fetchEmployees = async () => {
    try {
      const resp = await api.get('/hr/employees/');
      setEmployees(resp.data.results || resp.data || []);
    } catch (e) {
      console.error(e);
      toast('warning', 'Fetch failed', 'Could not load employees');
    }
  };

  const fetchSalaryPayments = async () => {
    try {
      const resp = await api.get('/hr/salary-payments/');
      setSalaryPayments(resp.data.results || resp.data || []);
    } catch (e) {
      console.error(e);
      toast('warning', 'Fetch failed', 'Could not load salary payments');
    }
  };

  const fetchCommissions = async () => {
    try {
      const resp = await api.get('/hr/commissions/');
      setCommissions(resp.data.results || resp.data || []);
    } catch (e) {
      console.error(e);
      toast('warning', 'Fetch failed', 'Could not load commissions');
    }
  };

  const fetchSalaryHistory = async () => {
    try {
      const resp = await api.get('/hr/salary-history/');
      setSalaryHistory(resp.data.results || resp.data || []);
    } catch (e) {
      console.error(e);
      toast('warning', 'Fetch failed', 'Could not load salary history');
    }
  };

  const handleMarkPaid = async () => {
    if (!selectedPayment) return;
    try {
      await api.post(`/hr/salary-payments/${selectedPayment.id}/mark_paid/`);
      toast('success', 'Marked Paid', 'Salary payment marked as paid');
      setShowMarkPaid(false);
      setSelectedPayment(null);
      fetchSalaryPayments();
    } catch (e) {
      console.error(e);
      toast('danger', 'Failed', e?.response?.data?.error || e?.message || 'Failed to mark as paid');
    }
  };

  const handleGenerateSalaries = async () => {
    setIsGenerating(true);
    try {
      const resp = await api.post('/hr/salary-payments/generate_monthly_salaries/', {
        month: generateMonth,
        year: generateYear
      });
      toast('success', 'Success', `Generated ${resp.data.created_count} salary payments for ${generateMonth}/${generateYear}`);
      setShowGenerateModal(false);
      fetchSalaryPayments(); // Refresh the list
    } catch (e) {
      console.error(e);
      const errorMsg = e?.response?.data?.detail || e?.message || 'Failed to generate salaries';
      toast('danger', 'Generation Failed', errorMsg);
    } finally {
      setIsGenerating(false);
    }
  };

  const filteredSalaryPayments = React.useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return salaryPayments.filter(sp => {
      if (salaryEmployeeFilter && sp.employee !== Number(salaryEmployeeFilter)) return false;
      if (salaryStatusFilter && sp.status !== salaryStatusFilter) return false;
      if (salaryMonthFilter && sp.month !== Number(salaryMonthFilter)) return false;
      
      // Overdue filter
      if (showOverdueOnly) {
        if (sp.status !== 'pending' || !sp.expected_payment_date) return false;
        const expected = new Date(sp.expected_payment_date);
        expected.setHours(0, 0, 0, 0);
        if (today <= expected) return false;
      }
      
      return true;
    });
  }, [salaryPayments, salaryEmployeeFilter, salaryStatusFilter, salaryMonthFilter, showOverdueOnly]);

  const filteredCommissions = React.useMemo(() => {
    return commissions.filter(c => {
      if (commEmployeeFilter && c.employee !== Number(commEmployeeFilter)) return false;
      if (commStatusFilter && c.status !== commStatusFilter) return false;
      return true;
    });
  }, [commissions, commEmployeeFilter, commStatusFilter]);

  const filteredSalaryHistory = React.useMemo(() => {
    let history = [...salaryHistory];
    if (historyEmployeeFilter) {
      history = history.filter(h => h.employee === Number(historyEmployeeFilter));
    }
    // Sort by effective_date descending
    history.sort((a, b) => new Date(b.effective_date) - new Date(a.effective_date));
    return history;
  }, [salaryHistory, historyEmployeeFilter]);

  const getEmployeeSalaryHistory = (employeeId) => {
    return salaryHistory
      .filter(h => h.employee === employeeId)
      .sort((a, b) => new Date(b.effective_date) - new Date(a.effective_date));
  };

  const totalSalaryPending = React.useMemo(() => {
    return filteredSalaryPayments
      .filter(sp => sp.status === 'pending')
      .reduce((sum, sp) => sum + parseFloat(sp.net_amount || 0), 0)
      .toFixed(2);
  }, [filteredSalaryPayments]);

  const totalSalaryPaid = React.useMemo(() => {
    return filteredSalaryPayments
      .filter(sp => sp.status === 'paid')
      .reduce((sum, sp) => sum + parseFloat(sp.net_amount || 0), 0)
      .toFixed(2);
  }, [filteredSalaryPayments]);

  const overduePayments = React.useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return filteredSalaryPayments.filter(sp => {
      if (sp.status !== 'pending' || !sp.expected_payment_date) return false;
      
      const expected = new Date(sp.expected_payment_date);
      expected.setHours(0, 0, 0, 0);
      
      return today > expected;
    });
  }, [filteredSalaryPayments]);

  const totalCommUnpaid = React.useMemo(() => {
    return filteredCommissions
      .filter(c => c.status === 'unpaid')
      .reduce((sum, c) => sum + parseFloat(c.amount || 0), 0)
      .toFixed(2);
  }, [filteredCommissions]);

  const totalCommPaid = React.useMemo(() => {
    return filteredCommissions
      .filter(c => c.status === 'paid')
      .reduce((sum, c) => sum + parseFloat(c.amount || 0), 0)
      .toFixed(2);
  }, [filteredCommissions]);

  const getStatusBadge = (status) => {
    if (status === 'pending' || status === 'unpaid') return <Badge bg="warning">{status}</Badge>;
    if (status === 'paid') return <Badge bg="success">{status}</Badge>;
    if (status === 'reversed') return <Badge bg="danger">{status}</Badge>;
    return <Badge bg="secondary">{status}</Badge>;
  };

  const resetSalaryFilters = () => {
    setSalaryEmployeeFilter('');
    setSalaryStatusFilter('');
    setSalaryMonthFilter('');
    setShowOverdueOnly(false);
  };

  const resetCommFilters = () => {
    setCommEmployeeFilter('');
    setCommStatusFilter('');
  };

  const content = (
    <div className="hr-container">
      <div className="hr-topbar">
        <div>
          <div className="title">Payments</div>
          <div className="subtitle">Manage salary payments and commission tracking</div>
        </div>
      </div>

      <Tabs defaultActiveKey="salaries" className="mb-3">
        <Tab eventKey="salaries" title="💰 Salaries">
          <div className="hr-cards mb-3">
            <div className="hr-card">
              <h4>Total Pending</h4>
              <p>Rs {totalSalaryPending.toLocaleString()}</p>
            </div>
            <div className="hr-card">
              <h4>Total Paid</h4>
              <p>Rs {totalSalaryPaid.toLocaleString()}</p>
            </div>
            <div className="hr-card">
              <h4>Total Records</h4>
              <p>{filteredSalaryPayments.length}</p>
            </div>
            <div className="hr-card" style={{ borderLeft: '4px solid #dc3545' }}>
              <h4>Overdue Payments</h4>
              <p className="text-danger">{overduePayments.length}</p>
              {overduePayments.length > 0 && (
                <small className="text-muted">Action required</small>
              )}
            </div>
          </div>

          {overduePayments.length > 0 && (
            <Alert variant="danger" className="mb-3">
              <strong>⚠️ {overduePayments.length} Overdue Payment{overduePayments.length !== 1 ? 's' : ''}</strong>
              <p className="mb-0 mt-2">
                You have pending salary payments that are past their expected payment date. 
                Please review and process these payments as soon as possible.
              </p>
            </Alert>
          )}

          <div className="hr-panel">
            <div className="hr-filters mb-3">
              <Form.Select value={salaryEmployeeFilter} onChange={e => setSalaryEmployeeFilter(e.target.value)} style={{ maxWidth: 180 }}>
                <option value="">All Employees</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.first_name} {emp.last_name}
                  </option>
                ))}
              </Form.Select>

              <Form.Select value={salaryStatusFilter} onChange={e => setSalaryStatusFilter(e.target.value)} style={{ maxWidth: 150 }}>
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
              </Form.Select>

              <Form.Select value={salaryMonthFilter} onChange={e => setSalaryMonthFilter(e.target.value)} style={{ maxWidth: 150 }}>
                <option value="">All Months</option>
                {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                  <option key={m} value={m}>{new Date(2000, m - 1).toLocaleString('default', { month: 'long' })}</option>
                ))}
              </Form.Select>

              <Form.Check
                type="checkbox"
                label="Overdue Only"
                checked={showOverdueOnly}
                onChange={e => setShowOverdueOnly(e.target.checked)}
                className="d-flex align-items-center"
                style={{ minWidth: 120 }}
              />

              <Button variant="outline-secondary" onClick={resetSalaryFilters}>Reset</Button>
            </div>

            {filteredSalaryPayments.length === 0 ? (
              <div className="hr-empty">No salary payment records found</div>
            ) : (
              <Table responsive hover className="hr-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Employee</th>
                    <th>Month/Year</th>
                    <th>Base Salary</th>
                    <th>Commission</th>
                    <th>Fines</th>
                    <th>Net Amount</th>
                    <th>Expected Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSalaryPayments.map((sp) => (
                    <tr key={sp.id} className={sp.is_late ? 'table-danger' : ''}>
                      <td>{sp.id}</td>
                      <td>{sp.employee_name || `Employee #${sp.employee}`}</td>
                      <td>{sp.month}/{sp.year}</td>
                      <td>{parseFloat(sp.base_salary || 0).toFixed(2)}</td>
                      <td className="text-success">+{parseFloat(sp.commission_total || 0).toFixed(2)}</td>
                      <td className="text-danger">-{parseFloat(sp.fine_deductions || 0).toFixed(2)}</td>
                      <td className="fw-bold text-primary">{parseFloat(sp.net_amount || 0).toFixed(2)}</td>
                      <td>
                        {sp.expected_payment_date ? (
                          <span className="small text-muted">
                            {new Date(sp.expected_payment_date).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="small text-muted">-</span>
                        )}
                      </td>
                      <td>
                        {getStatusBadge(sp.status)}
                        {sp.is_late && sp.status === 'paid' && (
                          <div className="mt-1">
                            <Badge bg="danger" className="small">
                              ⏰ {sp.days_late} day{sp.days_late !== 1 ? 's' : ''} late
                            </Badge>
                          </div>
                        )}
                        {sp.is_late && sp.status === 'pending' && (
                          <div className="mt-1">
                            <Badge bg="warning" text="dark" className="small">
                              ⚠️ Payment overdue
                            </Badge>
                          </div>
                        )}
                      </td>
                      <td>
                        {sp.status === 'pending' ? (
                          <Button size="sm" variant="primary" onClick={() => { setSelectedPayment(sp); setShowMarkPaid(true); }}>Mark Paid</Button>
                        ) : (
                          <div>
                            <span className="text-muted small">✓ Paid</span>
                            {sp.actual_payment_date && (
                              <div className="small text-muted">
                                {new Date(sp.actual_payment_date).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </div>
        </Tab>

        <Tab eventKey="commissions" title="💵 Commissions">
          <div className="hr-cards mb-3">
            <div className="hr-card">
              <h4>Total Unpaid</h4>
              <p>Rs {totalCommUnpaid.toLocaleString()}</p>
            </div>
            <div className="hr-card">
              <h4>Total Paid</h4>
              <p>Rs {totalCommPaid.toLocaleString()}</p>
            </div>
            <div className="hr-card">
              <h4>Total Records</h4>
              <p>{filteredCommissions.length}</p>
            </div>
          </div>

          <div className="hr-panel">
            <div className="hr-filters mb-3">
              <Form.Select value={commEmployeeFilter} onChange={e => setCommEmployeeFilter(e.target.value)} style={{ minWidth: 180 }}>
                <option value="">All Employees</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.first_name} {emp.last_name}
                  </option>
                ))}
              </Form.Select>

              <Form.Select value={commStatusFilter} onChange={e => setCommStatusFilter(e.target.value)} style={{ minWidth: 150 }}>
                <option value="">All Status</option>
                <option value="unpaid">Unpaid</option>
                <option value="paid">Paid</option>
                <option value="reversed">Reversed</option>
              </Form.Select>

              <Button variant="outline-secondary" onClick={resetCommFilters}>Reset</Button>
            </div>

            {filteredCommissions.length === 0 ? (
              <div className="hr-empty">No commission records found</div>
            ) : (
              <Table responsive hover className="hr-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Employee</th>
                    <th>Booking ID</th>
                    <th>Amount</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCommissions.map((c) => (
                    <tr key={c.id}>
                      <td>{c.id}</td>
                      <td>{c.employee_name || `Employee #${c.employee}`}</td>
                      <td className="text-muted">{c.booking_id || '-'}</td>
                      <td className="fw-bold">{parseFloat(c.amount || 0).toFixed(2)}</td>
                      <td>{c.date || '-'}</td>
                      <td>{getStatusBadge(c.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}

            <div className="text-muted small mt-3">
              <strong>Note:</strong> Commissions are automatically included in monthly salary payments. This tab provides a consolidated view of all commission records across employees.
            </div>
          </div>
        </Tab>

        <Tab eventKey="history" title="📊 Salary History">
          <div className="hr-panel">
            <div className="hr-filters mb-3">
              <Form.Select value={historyEmployeeFilter} onChange={e => setHistoryEmployeeFilter(e.target.value)} style={{ minWidth: 180 }}>
                <option value="">All Employees</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.first_name} {emp.last_name}
                  </option>
                ))}
              </Form.Select>
              <Button variant="outline-secondary" onClick={() => setHistoryEmployeeFilter('')}>Reset</Button>
            </div>

            {filteredSalaryHistory.length === 0 ? (
              <div className="hr-empty">No salary history records found</div>
            ) : (
              <Table responsive hover className="hr-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Effective Date</th>
                    <th>Previous Salary</th>
                    <th>New Salary</th>
                    <th>Increment</th>
                    <th>% Change</th>
                    <th>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSalaryHistory.map((h) => {
                    const prev = parseFloat(h.previous_salary || 0);
                    const newSal = parseFloat(h.new_salary || 0);
                    const increment = newSal - prev;
                    const percentChange = prev > 0 ? ((increment / prev) * 100).toFixed(1) : 0;
                    const isIncrease = increment > 0;
                    
                    return (
                      <tr key={h.id}>
                        <td>
                          <strong>{h.employee_name || `Employee #${h.employee}`}</strong>
                          <br/>
                          <small className="text-muted">
                            <Button 
                              size="sm" 
                              variant="link" 
                              className="p-0 text-primary" 
                              onClick={() => {
                                const emp = employees.find(e => e.id === h.employee);
                                setSelectedEmployee(emp);
                                setShowHistoryModal(true);
                              }}
                            >
                              View Full History
                            </Button>
                          </small>
                        </td>
                        <td>{new Date(h.effective_date).toLocaleDateString()}</td>
                        <td className="text-muted">Rs {prev.toFixed(2)}</td>
                        <td className="fw-bold">Rs {newSal.toFixed(2)}</td>
                        <td className={isIncrease ? 'text-success' : 'text-danger'}>
                          {isIncrease ? '+' : ''}{increment.toFixed(2)}
                        </td>
                        <td>
                          <Badge bg={isIncrease ? 'success' : 'danger'}>
                            {isIncrease ? '+' : ''}{percentChange}%
                          </Badge>
                        </td>
                        <td className="small text-muted">{h.reason || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            )}

            <div className="text-muted small mt-3">
              <strong>Tip:</strong> Click "View Full History" to see complete salary progression for an employee.
            </div>
          </div>
        </Tab>
      </Tabs>

      {/* Employee Salary History Modal */}
      <Modal show={showHistoryModal} onHide={() => setShowHistoryModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedEmployee ? `${selectedEmployee.first_name} ${selectedEmployee.last_name}` : 'Employee'} - Salary History
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedEmployee && (
            <>
              <div className="mb-3">
                <Row>
                  <Col>
                    <Card className="bg-light">
                      <Card.Body>
                        <small className="text-muted">Current Salary</small>
                        <h4 className="mb-0 text-primary">Rs {parseFloat(selectedEmployee.salary || 0).toLocaleString()}</h4>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col>
                    <Card className="bg-light">
                      <Card.Body>
                        <small className="text-muted">Payment Date</small>
                        <h4 className="mb-0">{selectedEmployee.salary_payment_date || '-'}</h4>
                        <small className="text-muted">Day of month</small>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </div>

              {(() => {
                const empHistory = getEmployeeSalaryHistory(selectedEmployee.id);
                if (empHistory.length === 0) {
                  return <div className="text-center text-muted py-4">No salary history found</div>;
                }
                
                return (
                  <Table size="sm" hover>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Previous</th>
                        <th>New</th>
                        <th>Change</th>
                        <th>Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {empHistory.map((h, idx) => {
                        const prev = parseFloat(h.previous_salary || 0);
                        const newSal = parseFloat(h.new_salary || 0);
                        const diff = newSal - prev;
                        const pct = prev > 0 ? ((diff / prev) * 100).toFixed(1) : 0;
                        
                        return (
                          <tr key={h.id}>
                            <td>{new Date(h.effective_date).toLocaleDateString()}</td>
                            <td className="text-muted">Rs {prev.toFixed(0)}</td>
                            <td className="fw-bold">Rs {newSal.toFixed(0)}</td>
                            <td>
                              <Badge bg={diff > 0 ? 'success' : 'danger'}>
                                {diff > 0 ? '+' : ''}{pct}%
                              </Badge>
                            </td>
                            <td className="small text-muted">{h.reason || '-'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                );
              })()}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowHistoryModal(false)}>Close</Button>
        </Modal.Footer>
      </Modal>

      {/* Mark Paid Modal */}
      <Modal show={showMarkPaid} onHide={() => setShowMarkPaid(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Mark as Paid</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedPayment && (
            <>
              <p>Mark salary payment as paid for <strong>{selectedPayment.employee_name}</strong>?</p>
              <div className="small mb-3">
                <div><strong>Month/Year:</strong> {selectedPayment.month}/{selectedPayment.year}</div>
                <div><strong>Net Amount:</strong> Rs {parseFloat(selectedPayment.net_amount || 0).toFixed(2)}</div>
                {selectedPayment.expected_payment_date && (
                  <div>
                    <strong>Expected Payment Date:</strong>{' '}
                    {new Date(selectedPayment.expected_payment_date).toLocaleDateString()}
                  </div>
                )}
                <div><strong>Today's Date:</strong> {new Date().toLocaleDateString()}</div>
              </div>
              
              {(() => {
                if (selectedPayment.expected_payment_date) {
                  const expected = new Date(selectedPayment.expected_payment_date);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  expected.setHours(0, 0, 0, 0);
                  const diffTime = today - expected;
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  
                  if (diffDays > 0) {
                    return (
                      <Alert variant="warning">
                        <strong>⚠️ Late Payment Warning</strong>
                        <p className="mb-0 mt-2">
                          This payment is <strong>{diffDays} day{diffDays !== 1 ? 's' : ''}</strong> overdue.
                          The expected payment date was{' '}
                          {new Date(selectedPayment.expected_payment_date).toLocaleDateString()}.
                        </p>
                      </Alert>
                    );
                  } else if (diffDays === 0) {
                    return (
                      <Alert variant="success">
                        <strong>✓ On Time</strong>
                        <p className="mb-0 mt-2">
                          Payment is being made on the expected date.
                        </p>
                      </Alert>
                    );
                  } else {
                    return (
                      <Alert variant="info">
                        <strong>ℹ️ Early Payment</strong>
                        <p className="mb-0 mt-2">
                          Payment is being made {Math.abs(diffDays)} day{Math.abs(diffDays) !== 1 ? 's' : ''} early.
                        </p>
                      </Alert>
                    );
                  }
                }
                return null;
              })()}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowMarkPaid(false)}>Cancel</Button>
          <Button variant="success" onClick={handleMarkPaid}>Confirm Payment</Button>
        </Modal.Footer>
      </Modal>

      {/* Generate Monthly Salaries Modal */}
      <Modal show={showGenerateModal} onHide={() => setShowGenerateModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Generate Monthly Salaries</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Generate salary payments for all active employees for a specific month.</p>
          <div className="mb-3">
            <Alert variant="info" className="small">
              <strong>📌 Note:</strong> This will:
              <ul className="mb-0 mt-2">
                <li>Create salary records for all active employees</li>
                <li>Auto-calculate commissions earned in the month</li>
                <li>Deduct any fines applied in the month</li>
                <li>Set status as "Pending" for payment approval</li>
              </ul>
            </Alert>
          </div>
          <Row>
            <Col>
              <Form.Group>
                <Form.Label>Month</Form.Label>
                <Form.Select 
                  value={generateMonth} 
                  onChange={e => setGenerateMonth(Number(e.target.value))}
                  disabled={isGenerating}
                >
                  {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                    <option key={m} value={m}>
                      {new Date(2000, m - 1).toLocaleString('default', { month: 'long' })}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col>
              <Form.Group>
                <Form.Label>Year</Form.Label>
                <Form.Control 
                  type="number" 
                  value={generateYear} 
                  onChange={e => setGenerateYear(Number(e.target.value))}
                  min={2020}
                  max={2030}
                  disabled={isGenerating}
                />
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowGenerateModal(false)} disabled={isGenerating}>
            Cancel
          </Button>
          <Button variant="success" onClick={handleGenerateSalaries} disabled={isGenerating}>
            {isGenerating ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Generating...
              </>
            ) : (
              '✓ Generate Salaries'
            )}
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
        <Container fluid className="py-4">
          <HRTabs activeName="Payments" />
          {content}
        </Container>
      </div>
    </div>
  );
};

const PaymentsPage = (props) => (
  <ToastProvider>
    <InnerPaymentsPage {...props} />
  </ToastProvider>
);

export default PaymentsPage;
