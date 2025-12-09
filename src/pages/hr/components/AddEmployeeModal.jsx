import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';
import api from '../api';
import { useToast } from './ToastProvider';

const AddEmployeeModal = ({ show, onHide, onAdded }) => {
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone: '', whatsapp: '',
    address: '', other_contact_number: '', contact_name: '',
    role: '', branch: '', commission_group: '',
    check_in_time: '', check_out_time: '', grace_minutes: 0,
    salary: '', currency: 'PKR',
    salary_account_number: '', salary_account_title: '', salary_bank_name: '',
    salary_payment_date: '', joining_date: '', is_active: true
  });
  const [saving, setSaving] = useState(false);
  const [branches, setBranches] = useState([]);
  const [commissionGroups, setCommissionGroups] = useState([]);
  const { show: toast } = useToast();

  useEffect(() => {
    if (show) {
      // Fetch branches and commission groups
      const fetchData = async () => {
        try {
          const [branchResp, groupResp] = await Promise.all([
            api.get('/organization/branches/').catch(() => ({ data: [] })),
            api.get('/hr/commission-groups/').catch(() => ({ data: [] }))
          ]);
          setBranches(Array.isArray(branchResp.data) ? branchResp.data : branchResp.data.results || []);
          setCommissionGroups(Array.isArray(groupResp.data) ? groupResp.data : groupResp.data.results || []);
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
    try {
      const payload = { ...form };
      // Convert empty strings to null for optional FK fields
      if (!payload.branch) payload.branch = null;
      if (!payload.commission_group) payload.commission_group = null;
      if (!payload.salary_payment_date) payload.salary_payment_date = null;
      if (!payload.grace_minutes) payload.grace_minutes = 0;
      
      const resp = await api.post('/hr/employees/', payload);
      toast('success', 'Saved', 'Employee added successfully');
      onAdded && onAdded(resp.data);
      setForm({
        first_name: '', last_name: '', email: '', phone: '', whatsapp: '',
        address: '', other_contact_number: '', contact_name: '',
        role: '', branch: '', commission_group: '',
        check_in_time: '', check_out_time: '', grace_minutes: 0,
        salary: '', currency: 'PKR',
        salary_account_number: '', salary_account_title: '', salary_bank_name: '',
        salary_payment_date: '', joining_date: '', is_active: true
      });
    } catch (err) {
      console.error('Failed to add employee', err);
      toast('danger', 'Failed', err?.response?.data?.detail || err?.message || 'Failed to add employee');
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
            <Col md={6}>
              <Form.Group className="mb-2">
                <Form.Label>Role *</Form.Label>
                <Form.Control required placeholder="Enter role (e.g. Manager, Agent)" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-2">
                <Form.Label>Branch *</Form.Label>
                <Form.Select required value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })}>
                  <option value="">Select Branch</option>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </Form.Select>
                <Form.Text className="text-muted">Employees must belong to a branch</Form.Text>
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
