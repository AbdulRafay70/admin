import React, { useState } from 'react';
import { Container, Row, Col, Card, Button, Table, Form, Badge, Modal, Alert } from 'react-bootstrap';
import { Plus, Edit2, Trash2, Eye, DollarSign, TrendingUp, CheckCircle, AlertCircle, Copy, Filter, Download, BarChart3 } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import CRMTabs from '../../components/CRMTabs';
import './styles/commission-management.css';

const CommissionManagement = () => {
  // Active Tab State
  const [activeTab, setActiveTab] = useState('rules');

  // Rules State
  const [rules, setRules] = useState([
    {
      id: 1,
      name: 'Lahore Branch - Group Tickets',
      organization_id: 1,
      branch_id: 1,
      receiver_type: 'branch',
      applied_on_type: 'ticket',
      commission_type: 'fixed',
      commission_value: 922,
      min_sale_amount: null,
      active: true,
      created_at: '2025-01-15',
    },
    {
      id: 2,
      name: 'Karachi Area Agent - Umrah Packages',
      organization_id: 1,
      branch_id: 2,
      receiver_type: 'area_agent',
      applied_on_type: 'umrah',
      commission_type: 'fixed',
      commission_value: 1000,
      min_sale_amount: 150000,
      active: true,
      created_at: '2025-01-10',
    },
    {
      id: 3,
      name: 'Employee - Hotels',
      organization_id: 1,
      branch_id: 1,
      receiver_type: 'employee',
      applied_on_type: 'hotel',
      commission_type: 'fixed',
      commission_value: 200,
      min_sale_amount: null,
      active: true,
      created_at: '2025-01-05',
    },
  ]);

  // Earnings State
  const [earnings, setEarnings] = useState([
    {
      id: 101,
      booking_no: 'BKG-2541',
      service_type: 'umrah',
      earned_by_type: 'branch',
      earned_by_name: 'Lahore Branch',
      sale_amount: 185000,
      commission_amount: 5000,
      status: 'earned',
      redeemed: false,
      created_at: '2025-10-20',
    },
    {
      id: 102,
      booking_no: 'BKG-2542',
      service_type: 'ticket',
      earned_by_type: 'area_agent',
      earned_by_name: 'Ali Khan (Area Agent)',
      sale_amount: 50000,
      commission_amount: 922,
      status: 'pending',
      redeemed: false,
      created_at: '2025-10-18',
    },
    {
      id: 103,
      booking_no: 'BKG-2543',
      service_type: 'hotel',
      earned_by_type: 'employee',
      earned_by_name: 'Hassan Ahmed (Employee)',
      sale_amount: 45000,
      commission_amount: 3000,
      status: 'earned',
      redeemed: true,
      created_at: '2025-10-15',
    },
    {
      id: 104,
      booking_no: 'BKG-2544',
      service_type: 'ticket',
      earned_by_type: 'branch',
      earned_by_name: 'Karachi Branch',
      sale_amount: 92000,
      commission_amount: 1844,
      status: 'earned',
      redeemed: false,
      created_at: '2025-10-12',
    },
    {
      id: 105,
      booking_no: 'BKG-2545',
      service_type: 'umrah',
      earned_by_type: 'area_agent',
      earned_by_name: 'Fatima Sheikh (Area Agent)',
      sale_amount: 210000,
      commission_amount: 7500,
      status: 'pending',
      redeemed: false,
      created_at: '2025-10-08',
    },
  ]);

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [selectedRule, setSelectedRule] = useState(null);
  const [selectedEarning, setSelectedEarning] = useState(null);

  // Form States
  const [formData, setFormData] = useState({
    name: '',
    receiver_type: 'branch',
    applied_on_type: 'ticket',
    commission_type: 'fixed',
    commission_value: '',
    min_sale_amount: '',
  });

  // Filter States
  const [rulesFilter, setRulesFilter] = useState('all');
  const [earningsFilter, setEarningsFilter] = useState('all');

  // Statistics Calculation
  const calculateStats = () => {
    const totalRules = rules.length;
    const activeRules = rules.filter(rule => rule.active).length;
    const totalEarnings = earnings.reduce((sum, earning) => sum + earning.commission_amount, 0);
    const pendingEarnings = earnings.filter(earning => earning.status === 'pending').reduce((sum, earning) => sum + earning.commission_amount, 0);
    const earnedCommissions = earnings.filter(earning => earning.status === 'earned' && !earning.redeemed).reduce((sum, earning) => sum + earning.commission_amount, 0);
    const redeemedCommissions = earnings.filter(earning => earning.redeemed).reduce((sum, earning) => sum + earning.commission_amount, 0);

    return {
      totalRules,
      activeRules,
      totalEarnings,
      pendingEarnings,
      earnedCommissions,
      redeemedCommissions
    };
  };

  const stats = calculateStats();

  // Handle Form Changes
  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle Add Rule
  const handleAddRule = () => {
    const newRule = {
      id: rules.length + 1,
      ...formData,
      commission_value: parseFloat(formData.commission_value),
      min_sale_amount: formData.min_sale_amount ? parseFloat(formData.min_sale_amount) : null,
      organization_id: 1,
      branch_id: 1,
      active: true,
      created_at: new Date().toISOString().split('T')[0],
    };

    setRules(prev => [...prev, newRule]);
    setShowAddModal(false);
    setFormData({
      name: '',
      receiver_type: 'branch',
      applied_on_type: 'ticket',
      commission_type: 'fixed',
      commission_value: '',
      min_sale_amount: '',
    });
  };

  // Handle Edit Rule
  const handleEditRule = (rule) => {
    setSelectedRule(rule);
    setFormData({
      name: rule.name,
      receiver_type: rule.receiver_type,
      applied_on_type: rule.applied_on_type,
      commission_type: rule.commission_type,
      commission_value: rule.commission_value.toString(),
      min_sale_amount: rule.min_sale_amount ? rule.min_sale_amount.toString() : '',
    });
    setShowEditModal(true);
  };

  // Handle Update Rule
  const handleUpdateRule = () => {
    setRules(prev => prev.map(rule => 
      rule.id === selectedRule.id 
        ? {
            ...rule,
            ...formData,
            commission_value: parseFloat(formData.commission_value),
            min_sale_amount: formData.min_sale_amount ? parseFloat(formData.min_sale_amount) : null,
          }
        : rule
    ));
    setShowEditModal(false);
    setSelectedRule(null);
  };

  // Handle Delete Rule
  const handleDeleteRule = (ruleId) => {
    if (window.confirm('Are you sure you want to delete this commission rule?')) {
      setRules(prev => prev.filter(rule => rule.id !== ruleId));
    }
  };

  // Handle Toggle Rule Status
  const handleToggleRuleStatus = (ruleId) => {
    setRules(prev => prev.map(rule => 
      rule.id === ruleId ? { ...rule, active: !rule.active } : rule
    ));
  };

  // Handle Redeem Commission
  const handleRedeemCommission = (earning) => {
    setSelectedEarning(earning);
    setShowRedeemModal(true);
  };

  // Confirm Redeem
  const confirmRedeem = () => {
    setEarnings(prev => prev.map(earning => 
      earning.id === selectedEarning.id 
        ? { ...earning, redeemed: true, status: 'redeemed' }
        : earning
    ));
    setShowRedeemModal(false);
    setSelectedEarning(null);
  };

  // Filter Rules
  const filteredRules = rules.filter(rule => {
    if (rulesFilter === 'all') return true;
    if (rulesFilter === 'active') return rule.active;
    if (rulesFilter === 'inactive') return !rule.active;
    return true;
  });

  // Filter Earnings
  const filteredEarnings = earnings.filter(earning => {
    if (earningsFilter === 'all') return true;
    if (earningsFilter === 'pending') return earning.status === 'pending';
    if (earningsFilter === 'earned') return earning.status === 'earned' && !earning.redeemed;
    if (earningsFilter === 'redeemed') return earning.redeemed;
    return true;
  });

  return (
    <>
    <div className="min-vh-100" style={{ fontFamily: "Poppins, sans-serif" }}>
      <div className="row g-0">
        <div className="col-12 col-lg-2">
          <Sidebar />
        </div>
        <div className="col-12 col-lg-10">
          <div className="container-fluid">
            <Header />
            <div className="px-3 px-lg-4 my-3">
              <CRMTabs />
              {/* Page Header */}
              <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                  <h2 className="fw-bold mb-1">Commission Management</h2>
                  <p className="text-muted mb-0">Manage commission rules, track earnings, and process redemptions</p>
                </div>
                <Button 
                  variant="primary"
                  onClick={() => setShowAddModal(true)}
                  className="d-flex align-items-center"
                >
                  <Plus size={16} className="me-2" />
                  Add Commission Rule
                </Button>
              </div>

              {/* Tab Navigation */}
              <div className="commission-tabs mb-4">
                <div className="d-flex border-bottom">
                  <button 
                    className={`tab-button ${activeTab === 'rules' ? 'active' : ''}`}
                    onClick={() => setActiveTab('rules')}
                  >
                    <DollarSign size={16} className="me-2" />
                    Commission Rules
                  </button>
                  <button 
                    className={`tab-button ${activeTab === 'earnings' ? 'active' : ''}`}
                    onClick={() => setActiveTab('earnings')}
                  >
                    <TrendingUp size={16} className="me-2" />
                    Commission Earnings
                  </button>
                  <button 
                    className={`tab-button ${activeTab === 'reports' ? 'active' : ''}`}
                    onClick={() => setActiveTab('reports')}
                  >
                    <BarChart3 size={16} className="me-2" />
                    Reports & Summary
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              {activeTab === 'rules' && (
                <div className="commission-rules-tab">
                  {/* Statistics Cards */}
                  <Row className="mb-4">
                    <Col md={3}>
                      <Card className="stats-card border-primary">
                        <Card.Body>
                          <div className="d-flex align-items-center">
                            <div className="stats-icon bg-primary bg-opacity-10 text-primary rounded-circle p-2 me-3">
                              <DollarSign size={24} />
                            </div>
                            <div>
                              <h3 className="mb-1">{stats.totalRules}</h3>
                              <p className="text-muted mb-0 small">Total Rules</p>
                            </div>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={3}>
                      <Card className="stats-card border-success">
                        <Card.Body>
                          <div className="d-flex align-items-center">
                            <div className="stats-icon bg-success bg-opacity-10 text-success rounded-circle p-2 me-3">
                              <CheckCircle size={24} />
                            </div>
                            <div>
                              <h3 className="mb-1">{stats.activeRules}</h3>
                              <p className="text-muted mb-0 small">Active Rules</p>
                            </div>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={3}>
                      <Card className="stats-card border-warning">
                        <Card.Body>
                          <div className="d-flex align-items-center">
                            <div className="stats-icon bg-warning bg-opacity-10 text-warning rounded-circle p-2 me-3">
                              <AlertCircle size={24} />
                            </div>
                            <div>
                              <h3 className="mb-1">{stats.totalRules - stats.activeRules}</h3>
                              <p className="text-muted mb-0 small">Inactive Rules</p>
                            </div>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={3}>
                      <Card className="stats-card border-info">
                        <Card.Body>
                          <div className="d-flex align-items-center">
                            <div className="stats-icon bg-info bg-opacity-10 text-info rounded-circle p-2 me-3">
                              <TrendingUp size={24} />
                            </div>
                            <div>
                              <h3 className="mb-1">PKR {stats.totalEarnings.toLocaleString()}</h3>
                              <p className="text-muted mb-0 small">Total Earned</p>
                            </div>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>

                  {/* Filter and Actions */}
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div className="d-flex align-items-center">
                      <Filter size={16} className="me-2 text-muted" />
                      <Form.Select 
                        size="sm" 
                        value={rulesFilter} 
                        onChange={(e) => setRulesFilter(e.target.value)}
                        style={{ width: 'auto' }}
                      >
                        <option value="all">All Rules</option>
                        <option value="active">Active Rules</option>
                        <option value="inactive">Inactive Rules</option>
                      </Form.Select>
                    </div>
                    <Button variant="outline-secondary" size="sm">
                      <Download size={16} className="me-2" />
                      Export Rules
                    </Button>
                  </div>

                  {/* Rules Table */}
                  <Card>
                    <Card.Body className="p-0">
                      <div className="table-responsive">
                        <Table striped hover className="mb-0">
                          <thead className="table-light">
                            <tr>
                              <th>Rule Name</th>
                              <th>Receiver Type</th>
                              <th>Applied On</th>
                              <th>Commission</th>
                              <th>Min Sale</th>
                              <th>Status</th>
                              <th>Created</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredRules.map(rule => (
                              <tr key={rule.id}>
                                <td>
                                  <div className="fw-medium">{rule.name}</div>
                                </td>
                                <td>
                                  <Badge bg="secondary" className="text-capitalize">
                                    {rule.receiver_type.replace('_', ' ')}
                                  </Badge>
                                </td>
                                <td>
                                  <Badge bg="info" className="text-capitalize">
                                    {rule.applied_on_type}
                                  </Badge>
                                </td>
                                <td>
                                  <span className="fw-medium">
                                    {rule.commission_type === 'fixed' ? 'PKR ' : '%'}{rule.commission_value}
                                  </span>
                                </td>
                                <td>
                                  {rule.min_sale_amount ? `PKR ${rule.min_sale_amount.toLocaleString()}` : '-'}
                                </td>
                                <td>
                                  <Badge bg={rule.active ? 'success' : 'danger'}>
                                    {rule.active ? 'Active' : 'Inactive'}
                                  </Badge>
                                </td>
                                <td>{rule.created_at}</td>
                                <td>
                                  <div className="d-flex gap-1">
                                    <Button
                                      variant="outline-primary"
                                      size="sm"
                                      onClick={() => handleEditRule(rule)}
                                    >
                                      <Edit2 size={14} />
                                    </Button>
                                    <Button
                                      variant={rule.active ? 'outline-warning' : 'outline-success'}
                                      size="sm"
                                      onClick={() => handleToggleRuleStatus(rule.id)}
                                    >
                                      {rule.active ? 'Deactivate' : 'Activate'}
                                    </Button>
                                    <Button
                                      variant="outline-danger"
                                      size="sm"
                                      onClick={() => handleDeleteRule(rule.id)}
                                    >
                                      <Trash2 size={14} />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </div>
                    </Card.Body>
                  </Card>
                </div>
              )}

              {activeTab === 'earnings' && (
                <div className="commission-earnings-tab">
                  {/* Statistics Cards */}
                  <Row className="mb-4">
                    <Col md={3}>
                      <Card className="stats-card border-warning">
                        <Card.Body>
                          <div className="d-flex align-items-center">
                            <div className="stats-icon bg-warning bg-opacity-10 text-warning rounded-circle p-2 me-3">
                              <AlertCircle size={24} />
                            </div>
                            <div>
                              <h3 className="mb-1">PKR {stats.pendingEarnings.toLocaleString()}</h3>
                              <p className="text-muted mb-0 small">Pending Commissions</p>
                            </div>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={3}>
                      <Card className="stats-card border-success">
                        <Card.Body>
                          <div className="d-flex align-items-center">
                            <div className="stats-icon bg-success bg-opacity-10 text-success rounded-circle p-2 me-3">
                              <CheckCircle size={24} />
                            </div>
                            <div>
                              <h3 className="mb-1">PKR {stats.earnedCommissions.toLocaleString()}</h3>
                              <p className="text-muted mb-0 small">Earned (Unredeemed)</p>
                            </div>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={3}>
                      <Card className="stats-card border-primary">
                        <Card.Body>
                          <div className="d-flex align-items-center">
                            <div className="stats-icon bg-primary bg-opacity-10 text-primary rounded-circle p-2 me-3">
                              <DollarSign size={24} />
                            </div>
                            <div>
                              <h3 className="mb-1">PKR {stats.redeemedCommissions.toLocaleString()}</h3>
                              <p className="text-muted mb-0 small">Redeemed</p>
                            </div>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={3}>
                      <Card className="stats-card border-info">
                        <Card.Body>
                          <div className="d-flex align-items-center">
                            <div className="stats-icon bg-info bg-opacity-10 text-info rounded-circle p-2 me-3">
                              <TrendingUp size={24} />
                            </div>
                            <div>
                              <h3 className="mb-1">{earnings.length}</h3>
                              <p className="text-muted mb-0 small">Total Earnings</p>
                            </div>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>

                  {/* Filter and Actions */}
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div className="d-flex align-items-center">
                      <Filter size={16} className="me-2 text-muted" />
                      <Form.Select 
                        size="sm" 
                        value={earningsFilter} 
                        onChange={(e) => setEarningsFilter(e.target.value)}
                        style={{ width: 'auto' }}
                      >
                        <option value="all">All Earnings</option>
                        <option value="pending">Pending</option>
                        <option value="earned">Earned</option>
                        <option value="redeemed">Redeemed</option>
                      </Form.Select>
                    </div>
                    <Button variant="outline-secondary" size="sm">
                      <Download size={16} className="me-2" />
                      Export Earnings
                    </Button>
                  </div>

                  {/* Earnings Table */}
                  <Card>
                    <Card.Body className="p-0">
                      <div className="table-responsive">
                        <Table striped hover className="mb-0">
                          <thead className="table-light">
                            <tr>
                              <th>Booking No</th>
                              <th>Service Type</th>
                              <th>Earned By</th>
                              <th>Sale Amount</th>
                              <th>Commission</th>
                              <th>Status</th>
                              <th>Date</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredEarnings.map(earning => (
                              <tr key={earning.id}>
                                <td>
                                  <div className="fw-medium">{earning.booking_no}</div>
                                </td>
                                <td>
                                  <Badge bg="info" className="text-capitalize">
                                    {earning.service_type}
                                  </Badge>
                                </td>
                                <td>
                                  <div>
                                    <div className="fw-medium">{earning.earned_by_name}</div>
                                    <small className="text-muted text-capitalize">
                                      {earning.earned_by_type.replace('_', ' ')}
                                    </small>
                                  </div>
                                </td>
                                <td>PKR {earning.sale_amount.toLocaleString()}</td>
                                <td>
                                  <span className="fw-medium text-success">
                                    PKR {earning.commission_amount.toLocaleString()}
                                  </span>
                                </td>
                                <td>
                                  <Badge bg={
                                    earning.redeemed ? 'primary' : 
                                    earning.status === 'earned' ? 'success' : 
                                    'warning'
                                  }>
                                    {earning.redeemed ? 'Redeemed' : earning.status.charAt(0).toUpperCase() + earning.status.slice(1)}
                                  </Badge>
                                </td>
                                <td>{earning.created_at}</td>
                                <td>
                                  {earning.status === 'earned' && !earning.redeemed && (
                                    <Button
                                      variant="success"
                                      size="sm"
                                      onClick={() => handleRedeemCommission(earning)}
                                    >
                                      Redeem
                                    </Button>
                                  )}
                                  {earning.redeemed && (
                                    <Badge bg="success">
                                      <CheckCircle size={14} className="me-1" />
                                      Redeemed
                                    </Badge>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </div>
                    </Card.Body>
                  </Card>
                </div>
              )}

              {activeTab === 'reports' && (
                <div className="commission-reports-tab">
                  {/* Summary Statistics */}
                  <Row className="mb-4">
                    <Col md={3}>
                      <Card className="stats-card border-primary">
                        <Card.Body>
                          <div className="d-flex align-items-center">
                            <div className="stats-icon bg-primary bg-opacity-10 text-primary rounded-circle p-2 me-3">
                              <DollarSign size={24} />
                            </div>
                            <div>
                              <h3 className="mb-1">PKR {stats.totalEarnings.toLocaleString()}</h3>
                              <p className="text-muted mb-0 small">Total Commission Earned</p>
                            </div>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={3}>
                      <Card className="stats-card border-success">
                        <Card.Body>
                          <div className="d-flex align-items-center">
                            <div className="stats-icon bg-success bg-opacity-10 text-success rounded-circle p-2 me-3">
                              <CheckCircle size={24} />
                            </div>
                            <div>
                              <h3 className="mb-1">{Math.round((stats.redeemedCommissions / stats.totalEarnings) * 100)}%</h3>
                              <p className="text-muted mb-0 small">Redemption Rate</p>
                            </div>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={3}>
                      <Card className="stats-card border-warning">
                        <Card.Body>
                          <div className="d-flex align-items-center">
                            <div className="stats-icon bg-warning bg-opacity-10 text-warning rounded-circle p-2 me-3">
                              <TrendingUp size={24} />
                            </div>
                            <div>
                              <h3 className="mb-1">{earnings.filter(e => e.earned_by_type === 'branch').length}</h3>
                              <p className="text-muted mb-0 small">Branch Commissions</p>
                            </div>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={3}>
                      <Card className="stats-card border-info">
                        <Card.Body>
                          <div className="d-flex align-items-center">
                            <div className="stats-icon bg-info bg-opacity-10 text-info rounded-circle p-2 me-3">
                              <BarChart3 size={24} />
                            </div>
                            <div>
                              <h3 className="mb-1">{earnings.filter(e => e.earned_by_type === 'area_agent').length}</h3>
                              <p className="text-muted mb-0 small">Agent Commissions</p>
                            </div>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>

                  {/* Commission Breakdown */}
                  <Row>
                    <Col md={6}>
                      <Card className="mb-4">
                        <Card.Header>
                          <h5 className="mb-0">Commission by Receiver Type</h5>
                        </Card.Header>
                        <Card.Body>
                          <div className="commission-breakdown">
                            {['branch', 'area_agent', 'employee'].map(type => {
                              const typeEarnings = earnings.filter(e => e.earned_by_type === type);
                              const totalAmount = typeEarnings.reduce((sum, e) => sum + e.commission_amount, 0);
                              const percentage = Math.round((totalAmount / stats.totalEarnings) * 100);
                              
                              return (
                                <div key={type} className="breakdown-item mb-3">
                                  <div className="d-flex justify-content-between mb-1">
                                    <span className="text-capitalize">{type.replace('_', ' ')}</span>
                                    <span className="fw-medium">PKR {totalAmount.toLocaleString()} ({percentage}%)</span>
                                  </div>
                                  <div className="progress" style={{ height: '6px' }}>
                                    <div 
                                      className="progress-bar" 
                                      style={{ width: `${percentage}%` }}
                                    ></div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={6}>
                      <Card className="mb-4">
                        <Card.Header>
                          <h5 className="mb-0">Commission by Service Type</h5>
                        </Card.Header>
                        <Card.Body>
                          <div className="commission-breakdown">
                            {['umrah', 'ticket', 'hotel'].map(service => {
                              const serviceEarnings = earnings.filter(e => e.service_type === service);
                              const totalAmount = serviceEarnings.reduce((sum, e) => sum + e.commission_amount, 0);
                              const percentage = Math.round((totalAmount / stats.totalEarnings) * 100);
                              
                              return (
                                <div key={service} className="breakdown-item mb-3">
                                  <div className="d-flex justify-content-between mb-1">
                                    <span className="text-capitalize">{service}</span>
                                    <span className="fw-medium">PKR {totalAmount.toLocaleString()} ({percentage}%)</span>
                                  </div>
                                  <div className="progress" style={{ height: '6px' }}>
                                    <div 
                                      className="progress-bar bg-info" 
                                      style={{ width: `${percentage}%` }}
                                    ></div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>

      {/* Add Commission Rule Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Add Commission Rule</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Rule Name *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleFormChange('name', e.target.value)}
                    placeholder="Enter rule name"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Receiver Type *</Form.Label>
                  <Form.Select
                    value={formData.receiver_type}
                    onChange={(e) => handleFormChange('receiver_type', e.target.value)}
                  >
                    <option value="branch">Branch</option>
                    <option value="area_agent">Area Agent</option>
                    <option value="employee">Employee</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Applied On *</Form.Label>
                  <Form.Select
                    value={formData.applied_on_type}
                    onChange={(e) => handleFormChange('applied_on_type', e.target.value)}
                  >
                    <option value="ticket">Ticket Booking</option>
                    <option value="umrah">Umrah Package</option>
                    <option value="hotel">Hotel Booking</option>
                    <option value="visa">Visa Service</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Commission Type *</Form.Label>
                  <Form.Select
                    value={formData.commission_type}
                    onChange={(e) => handleFormChange('commission_type', e.target.value)}
                  >
                    <option value="fixed">Fixed Amount</option>
                    <option value="percentage">Percentage</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Commission Value *</Form.Label>
                  <Form.Control
                    type="number"
                    value={formData.commission_value}
                    onChange={(e) => handleFormChange('commission_value', e.target.value)}
                    placeholder={formData.commission_type === 'fixed' ? 'Enter amount in PKR' : 'Enter percentage'}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Minimum Sale Amount</Form.Label>
                  <Form.Control
                    type="number"
                    value={formData.min_sale_amount}
                    onChange={(e) => handleFormChange('min_sale_amount', e.target.value)}
                    placeholder="Optional minimum sale amount"
                  />
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleAddRule}>
            Add Rule
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Commission Rule Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Edit Commission Rule</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Rule Name *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleFormChange('name', e.target.value)}
                    placeholder="Enter rule name"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Receiver Type *</Form.Label>
                  <Form.Select
                    value={formData.receiver_type}
                    onChange={(e) => handleFormChange('receiver_type', e.target.value)}
                  >
                    <option value="branch">Branch</option>
                    <option value="area_agent">Area Agent</option>
                    <option value="employee">Employee</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Applied On *</Form.Label>
                  <Form.Select
                    value={formData.applied_on_type}
                    onChange={(e) => handleFormChange('applied_on_type', e.target.value)}
                  >
                    <option value="ticket">Ticket Booking</option>
                    <option value="umrah">Umrah Package</option>
                    <option value="hotel">Hotel Booking</option>
                    <option value="visa">Visa Service</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Commission Type *</Form.Label>
                  <Form.Select
                    value={formData.commission_type}
                    onChange={(e) => handleFormChange('commission_type', e.target.value)}
                  >
                    <option value="fixed">Fixed Amount</option>
                    <option value="percentage">Percentage</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Commission Value *</Form.Label>
                  <Form.Control
                    type="number"
                    value={formData.commission_value}
                    onChange={(e) => handleFormChange('commission_value', e.target.value)}
                    placeholder={formData.commission_type === 'fixed' ? 'Enter amount in PKR' : 'Enter percentage'}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Minimum Sale Amount</Form.Label>
                  <Form.Control
                    type="number"
                    value={formData.min_sale_amount}
                    onChange={(e) => handleFormChange('min_sale_amount', e.target.value)}
                    placeholder="Optional minimum sale amount"
                  />
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleUpdateRule}>
            Update Rule
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Redeem Commission Modal */}
      <Modal show={showRedeemModal} onHide={() => setShowRedeemModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Redeem Commission</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedEarning && (
            <div>
              <Alert variant="info">
                <strong>Commission Details:</strong>
                <br />
                Booking: {selectedEarning.booking_no}
                <br />
                Amount: PKR {selectedEarning.commission_amount.toLocaleString()}
                <br />
                Earned by: {selectedEarning.earned_by_name}
              </Alert>
              <p>Are you sure you want to redeem this commission? This action will mark the commission as redeemed and update the ledger.</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRedeemModal(false)}>
            Cancel
          </Button>
          <Button variant="success" onClick={confirmRedeem}>
            Redeem Commission
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default CommissionManagement;