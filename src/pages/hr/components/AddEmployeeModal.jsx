import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';
import api from '../api';
import { useToast } from './ToastProvider';

const AddEmployeeModal = ({ show, onHide, onAdded }) => {
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone: '', whatsapp: '',
    address: '', other_contact_number: '', contact_name: '',
    role: '', commission_group: '',
    check_in_time: '', check_out_time: '', grace_minutes: 0,
    salary: '', currency: 'PKR',
    salary_account_number: '', salary_account_title: '', salary_bank_name: '',
    salary_payment_date: '', joining_date: '', is_active: true
  });
  const [saving, setSaving] = useState(false);
  const [commissionGroups, setCommissionGroups] = useState([]);
  const [userBranchId, setUserBranchId] = useState(null);
  const { show: toast } = useToast();

  useEffect(() => {
    if (show) {
      // Fetch user profile and commission groups
      const fetchData = async () => {
        try {
          // Get user's branch ID and organization ID from multiple sources
          let branchId = null;
          let organizationId = null;
          
          // First, try JWT token (most reliable source)
          try {
            const token = localStorage.getItem('accessToken');
            if (token) {
              const base64Url = token.split('.')[1];
              const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
              const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
              }).join(''));
              const decoded = JSON.parse(jsonPayload);
              console.log('FULL JWT TOKEN DATA:', decoded);
              branchId = decoded?.branch_id || decoded?.branch || null;
              organizationId = decoded?.organization_id || decoded?.org_id || decoded?.organization || null;
              console.log('From JWT token - branchId:', branchId, 'orgId:', organizationId);
            }
          } catch (e) {
            console.warn('Could not decode token', e);
          }
          
          // Fallback to localStorage for selectedOrganization
          if (!branchId || !organizationId) {
            try {
              const so = JSON.parse(localStorage.getItem('selectedOrganization') || 'null');
              console.log('FULL SELECTED ORGANIZATION DATA:', so);
              if (!branchId) branchId = so?.branch_id || so?.branch || null;
              if (!organizationId) organizationId = so?.id || so?.organization_id || so?.org || null;
              console.log('From selectedOrganization - branchId:', branchId, 'orgId:', organizationId);
            } catch (e) {
              console.warn('Could not get organization from localStorage', e);
            }
          }
          
          setUserBranchId(branchId);
          console.log('Final retrieved branch ID:', branchId);
          console.log('Final retrieved organization ID:', organizationId);
          
          // Fetch commission groups from CommissionRule API
          const groupResp = await api.get('/commissions/rules').catch(() => ({ data: [] }));
          
          // Filter commission groups by organization and receiver_type
          let groups = Array.isArray(groupResp.data) ? groupResp.data : groupResp.data.results || [];
          if (organizationId) {
            groups = groups.filter(g => {
              const groupOrgId = g.organization_id || g.organization || g.org;
              return String(groupOrgId) === String(organizationId);
            });
          }
          
          // Only show employee commission groups (filter by receiver_type = 'employee')
          groups = groups.filter(g => g.receiver_type === 'employee');
          
          setCommissionGroups(groups);
        } catch (err) {
          console.warn('Failed to fetch options', err);
        }
      };
      fetchData();
    }
  }, [show]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    // Ensure branch ID is set before submission
    let branchToUse = userBranchId;
    console.log('Initial branchToUse from state:', branchToUse);
    
    // If not in state, try to get user ID from JWT token and fetch user details
    if (!branchToUse) {
      try {
        const token = localStorage.getItem('accessToken');
        if (token) {
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          }).join(''));
          const decoded = JSON.parse(jsonPayload);
          console.log('SUBMIT - JWT decoded:', decoded);
          
          // Get user ID from token
          const userId = decoded?.user_id || decoded?.id || decoded?.sub;
          console.log('SUBMIT - User ID from JWT:', userId);
          
          if (userId) {
            // Fetch user details to get branch ID
            try {
              console.log('SUBMIT - Fetching user details for user ID:', userId);
              const userResp = await api.get(`/users/${userId}/`);
              console.log('SUBMIT - User details response:', userResp.data);
              console.log('SUBMIT - All keys in user data:', Object.keys(userResp.data));
              
              // Try multiple possible field names
              if (userResp.data?.branch_details && Array.isArray(userResp.data.branch_details) && userResp.data.branch_details.length > 0) {
                branchToUse = userResp.data.branch_details[0].id;
              } else {
                branchToUse = userResp.data?.branch || 
                             userResp.data?.branch_id || 
                             userResp.data?.branchId ||
                             userResp.data?.employee?.branch ||
                             userResp.data?.employee?.branch_id ||
                             null;
              }
              console.log('SUBMIT - Branch from user API:', branchToUse);
            } catch (apiErr) {
              console.error('SUBMIT - Could not fetch user details:', apiErr);
            }
          }
        }
      } catch (e) {
        console.error('SUBMIT - Could not decode token', e);
      }
    }
    
    // If still not found, try localStorage
    if (!branchToUse) {
      try {
        const so = JSON.parse(localStorage.getItem('selectedOrganization') || 'null');
        console.log('SUBMIT - selectedOrganization:', so);
        branchToUse = so?.branch_id || so?.branch || so?.branchId || null;
        console.log('SUBMIT - branch from localStorage:', branchToUse);
      } catch (e) {
        console.error('SUBMIT - Could not get from localStorage', e);
      }
    }
    
    console.log('===== FINAL BRANCH TO USE:', branchToUse, '=====');
    
    // Validate that we have a branch ID
    if (!branchToUse) {
      toast('danger', 'Error', 'Cannot determine branch ID. Please select an organization first.');
      setSaving(false);
      return;
    }
    
    try {
      const payload = { ...form };
      
      // Add user's branch ID to payload
      payload.branch = branchToUse;
      console.log('Submitting employee with branch ID:', branchToUse);
      
      // Handle commission_group - convert to integer or set to null
      if (payload.commission_group && payload.commission_group !== "") {
        const parsedCommissionGroup = parseInt(payload.commission_group, 10);
        payload.commission_group = !isNaN(parsedCommissionGroup) ? parsedCommissionGroup : null;
      } else {
        payload.commission_group = null;
      }
      
      // Convert empty strings to null for optional FK fields
      if (!payload.salary_payment_date) payload.salary_payment_date = null;
      if (!payload.grace_minutes) payload.grace_minutes = 0;
      
      console.log('Final payload:', payload);
      const resp = await api.post('/hr/employees/', payload);
      toast('success', 'Saved', 'Employee added successfully');
      onAdded && onAdded(resp.data);
      setForm({
        first_name: '', last_name: '', email: '', phone: '', whatsapp: '',
        address: '', other_contact_number: '', contact_name: '',
        role: '', commission_group: '',
        check_in_time: '', check_out_time: '', grace_minutes: 0,
        salary: '', currency: 'PKR',
        salary_account_number: '', salary_account_title: '', salary_bank_name: '',
        salary_payment_date: '', joining_date: '', is_active: true
      });
    } catch (err) {
      console.error('Failed to add employee', err);
      console.error('Error response:', err?.response?.data);
      const errorMsg = err?.response?.data?.commission_group?.[0] || 
                       err?.response?.data?.detail || 
                       err?.message || 
                       'Failed to add employee';
      toast('danger', 'Failed', errorMsg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton className="modal-header-accent">
          <Modal.Title>Add Employee</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          <h6 className="text-muted mb-3">Basic Information</h6>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-2">
                <Form.Label>First Name *</Form.Label>
                <Form.Control required value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-2">
                <Form.Label>Last Name</Form.Label>
                <Form.Control value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-2">
                <Form.Label>Email</Form.Label>
                <Form.Control type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-2">
                <Form.Label>Phone</Form.Label>
                <Form.Control value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-2">
                <Form.Label>WhatsApp Number</Form.Label>
                <Form.Control value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-2">
                <Form.Label>Other Contact Number</Form.Label>
                <Form.Control value={form.other_contact_number} onChange={(e) => setForm({ ...form, other_contact_number: e.target.value })} />
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-2">
            <Form.Label>Address</Form.Label>
            <Form.Control as="textarea" rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Emergency Contact Name</Form.Label>
            <Form.Control value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} />
          </Form.Group>

          <h6 className="text-muted mb-3 mt-4">Role & Organization</h6>
          <Row>
            <Col md={12}>
              <Form.Group className="mb-2">
                <Form.Label>Role *</Form.Label>
                <Form.Control required placeholder="Enter role (e.g. Manager, Agent)" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>Commission Group (if applicable)</Form.Label>
            <Form.Select value={form.commission_group} onChange={(e) => setForm({ ...form, commission_group: e.target.value })}>
              <option value="">None</option>
              {commissionGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </Form.Select>
          </Form.Group>

          <h6 className="text-muted mb-3 mt-4">Office Schedule</h6>
          <Row>
            <Col md={4}>
              <Form.Group className="mb-2">
                <Form.Label>Check-In Time</Form.Label>
                <Form.Control type="time" value={form.check_in_time} onChange={(e) => setForm({ ...form, check_in_time: e.target.value })} />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-2">
                <Form.Label>Check-Out Time</Form.Label>
                <Form.Control type="time" value={form.check_out_time} onChange={(e) => setForm({ ...form, check_out_time: e.target.value })} />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-2">
                <Form.Label>Grace Minutes</Form.Label>
                <Form.Control type="number" min="0" value={form.grace_minutes} onChange={(e) => setForm({ ...form, grace_minutes: e.target.value })} />
              </Form.Group>
            </Col>
          </Row>

          <h6 className="text-muted mb-3 mt-4">Salary Information</h6>
          <Row>
            <Col md={4}>
              <Form.Group className="mb-2">
                <Form.Label>Joining Date</Form.Label>
                <Form.Control type="date" value={form.joining_date} onChange={(e) => setForm({ ...form, joining_date: e.target.value })} />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-2">
                <Form.Label>Salary</Form.Label>
                <Form.Control type="number" value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-2">
                <Form.Label>Currency</Form.Label>
                <Form.Select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
                  <option value="PKR">PKR</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={4}>
              <Form.Group className="mb-2">
                <Form.Label>Account Number</Form.Label>
                <Form.Control value={form.salary_account_number} onChange={(e) => setForm({ ...form, salary_account_number: e.target.value })} />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-2">
                <Form.Label>Account Title</Form.Label>
                <Form.Control value={form.salary_account_title} onChange={(e) => setForm({ ...form, salary_account_title: e.target.value })} />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-2">
                <Form.Label>Bank Name</Form.Label>
                <Form.Control value={form.salary_bank_name} onChange={(e) => setForm({ ...form, salary_bank_name: e.target.value })} />
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-2">
            <Form.Label>Salary Payment Date (Day of Month)</Form.Label>
            <Form.Control type="number" min="1" max="31" placeholder="e.g. 25" value={form.salary_payment_date} onChange={(e) => setForm({ ...form, salary_payment_date: e.target.value })} />
            <Form.Text className="text-muted">Day of month (1-31) when salary is paid</Form.Text>
          </Form.Group>

          <Form.Group className="mb-2">
            <Form.Check type="checkbox" label="Active" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>Cancel</Button>
          <Button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Add Employee'}</Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};


export default AddEmployeeModal;
