import React, { useEffect, useState } from 'react';
import { Container, Button, Table, Form, Badge, Modal, Tabs, Tab } from 'react-bootstrap';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import HRTabs from '../../components/HRTabs';
import api from './api';
import { ToastProvider, useToast } from './components/ToastProvider';
import './styles/hr.css';
import { useLocation, useNavigate } from 'react-router-dom';

const InnerApprovalsPage = ({ embedded = false }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { show: toast } = useToast();

  const [leaveRequests, setLeaveRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');

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
    fetchLeaveRequests();
  }, [statusFilter]);

  const fetchLeaveRequests = async () => {
    try {
      const params = statusFilter ? { status: statusFilter } : {};
      const resp = await api.get('/hr/leave-requests/', { params });
      setLeaveRequests(resp.data.results || resp.data || []);
    } catch (e) {
      console.error(e);
      toast('warning', 'Fetch failed', 'Could not load leave requests');
    }
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;
    try {
      await api.post(`/hr/leave-requests/${selectedRequest.id}/approve/`, {
        approval_notes: approvalNotes.trim() || 'Approved'
      });
      toast('success', 'Approved', 'Leave request has been approved');
      setShowApproveModal(false);
      setSelectedRequest(null);
      setApprovalNotes('');
      fetchLeaveRequests();
    } catch (e) {
      console.error(e);
      toast('danger', 'Failed', e?.response?.data?.error || e?.message || 'Failed to approve');
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !approvalNotes.trim()) {
      toast('warning', 'Required', 'Please enter rejection reason');
      return;
    }
    try {
      await api.post(`/hr/leave-requests/${selectedRequest.id}/reject/`, {
        approval_notes: approvalNotes.trim()
      });
      toast('success', 'Rejected', 'Leave request has been rejected');
      setShowRejectModal(false);
      setSelectedRequest(null);
      setApprovalNotes('');
      fetchLeaveRequests();
    } catch (e) {
      console.error(e);
      toast('danger', 'Failed', e?.response?.data?.error || e?.message || 'Failed to reject');
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'pending') return <Badge bg="warning">{status}</Badge>;
    if (status === 'approved') return <Badge bg="success">{status}</Badge>;
    if (status === 'rejected') return <Badge bg="danger">{status}</Badge>;
    return <Badge bg="secondary">{status}</Badge>;
  };

  const getRequestTypeBadge = (type) => {
    const typeMap = {
      'early_checkout': { bg: 'warning', text: '🕐 Early Checkout' },
      'full_day': { bg: 'info', text: '📅 Full Day Leave' },
      'partial_day': { bg: 'primary', text: '⏰ Partial Day Leave' },
      'sick': { bg: 'danger', text: '🤒 Sick Leave' },
      'casual': { bg: 'secondary', text: '☕ Casual Leave' },
      'annual': { bg: 'success', text: '🏖️ Annual Leave' }
    };
    const t = typeMap[type] || { bg: 'light', text: type };
    return <Badge bg={t.bg}>{t.text}</Badge>;
  };

  const pendingCount = React.useMemo(() => {
    return leaveRequests.filter(lr => lr.status === 'pending').length;
  }, [leaveRequests]);

  const content = (
    <div className="hr-container">
      <div className="hr-topbar">
        <div>
          <div className="title">Approvals</div>
          <div className="subtitle">Manage leave requests, early checkouts, and approval workflows</div>
        </div>
        <div className="hr-actions">
          <Badge bg="warning" className="me-2">{pendingCount} Pending</Badge>
          <Button variant="outline-secondary" onClick={fetchLeaveRequests}>Refresh</Button>
        </div>
      </div>

      <div className="hr-cards mb-3">
        <div className="hr-card">
          <h4>Pending</h4>
          <p>{leaveRequests.filter(lr => lr.status === 'pending').length}</p>
        </div>
        <div className="hr-card">
          <h4>Approved</h4>
          <p>{leaveRequests.filter(lr => lr.status === 'approved').length}</p>
        </div>
        <div className="hr-card">
          <h4>Rejected</h4>
          <p>{leaveRequests.filter(lr => lr.status === 'rejected').length}</p>
        </div>
        <div className="hr-card">
          <h4>Total Records</h4>
          <p>{leaveRequests.length}</p>
        </div>
      </div>

      <div className="hr-panel">
        <div className="hr-filters mb-3">
          <Form.Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ minWidth: 150 }}>
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </Form.Select>
        </div>

        {leaveRequests.length === 0 ? (
          <div className="hr-empty">No leave requests found</div>
        ) : (
          <Table responsive hover className="hr-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Employee</th>
                <th>Type</th>
                <th>Date</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Approved By</th>
                <th>Notes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {leaveRequests.map((lr) => (
                <tr key={lr.id}>
                  <td>{lr.id}</td>
                  <td>{lr.employee_name || `Employee #${lr.employee}`}</td>
                  <td>{getRequestTypeBadge(lr.request_type)}</td>
                  <td>{lr.date}</td>
                  <td className="small text-muted">{lr.reason || '-'}</td>
                  <td>{getStatusBadge(lr.status)}</td>
                  <td className="small">{lr.approved_by_name || '-'}</td>
                  <td className="small text-muted">{lr.approval_notes || '-'}</td>
                  <td>
                    {lr.status === 'pending' ? (
                      <div className="d-flex gap-2">
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() => {
                            setSelectedRequest(lr);
                            setShowApproveModal(true);
                          }}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => {
                            setSelectedRequest(lr);
                            setShowRejectModal(true);
                          }}
                        >
                          Reject
                        </Button>
                      </div>
                    ) : (
                      <span className="text-muted small">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </div>

      {/* Approve Modal */}
      <Modal show={showApproveModal} onHide={() => setShowApproveModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Approve Leave Request</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedRequest && (
            <>
              <p>Approve leave request for <strong>{selectedRequest.employee_name}</strong>?</p>
              <div className="small mb-3">
                <div><strong>Type:</strong> {selectedRequest.request_type}</div>
                <div><strong>Date:</strong> {selectedRequest.date}</div>
                <div><strong>Reason:</strong> {selectedRequest.reason || '-'}</div>
              </div>
              <Form.Group>
                <Form.Label>Approval Notes (optional)</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  placeholder="Add any notes (optional)"
                />
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowApproveModal(false)}>Cancel</Button>
          <Button variant="success" onClick={handleApprove}>Approve</Button>
        </Modal.Footer>
      </Modal>

      {/* Reject Modal */}
      <Modal show={showRejectModal} onHide={() => setShowRejectModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Reject Leave Request</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedRequest && (
            <>
              <p>Reject leave request for <strong>{selectedRequest.employee_name}</strong>?</p>
              <div className="small mb-3">
                <div><strong>Type:</strong> {selectedRequest.request_type}</div>
                <div><strong>Date:</strong> {selectedRequest.date}</div>
                <div><strong>Reason:</strong> {selectedRequest.reason || '-'}</div>
              </div>
              <Form.Group>
                <Form.Label>Rejection Reason <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  placeholder="Enter reason for rejection (required)"
                />
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRejectModal(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleReject}>Reject</Button>
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
          <HRTabs activeName="Approvals" />
          {content}
        </Container>
      </div>
    </div>
  );
};

const ApprovalsPage = (props) => (
  <ToastProvider>
    <InnerApprovalsPage {...props} />
  </ToastProvider>
);

export default ApprovalsPage;
