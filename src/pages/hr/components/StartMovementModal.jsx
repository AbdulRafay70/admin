import React, { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import api from '../api';
import { useToast } from './ToastProvider';

// Props:
// - show, onHide: modal visibility
// - employeeId: optional preselected employee id
// - employees: optional array of employee objects to choose from when employeeId is not provided
// - onCreated: optional callback(createdMovement) called after successful create
const StartMovementModal = ({ show, onHide, employeeId, employees = [], onCreated }) => {
  const [form, setForm] = useState({ reason: '', start_time: '', employee: employeeId || '' });
  const [saving, setSaving] = useState(false);

  const { show: toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { employee: form.employee || employeeId, reason: form.reason, start_time: form.start_time || undefined };
      const resp = await api.post('/hr/movements/', payload);
      // If server returns created movement object, call onCreated
      if (resp && resp.data) {
        onCreated && onCreated(resp.data);
      }
      toast('success', 'Started', 'Movement started');
    } catch (err) {
      console.warn('Start movement backend failed', err?.message);
      toast('danger', 'Failed', err?.response?.data?.detail || err?.message || 'Failed to start movement');
    } finally {
      setSaving(false);
      onHide && onHide();
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton className="modal-header-accent">
          <Modal.Title>Start Movement</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {!employeeId && (
            <Form.Group className="mb-2">
              <Form.Label>Employee</Form.Label>
              <Form.Control as="select" required value={form.employee} onChange={(e)=>setForm({...form, employee: e.target.value})}>
                <option value="">Select employee</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>
                ))}
              </Form.Control>
            </Form.Group>
          )}
          <Form.Group className="mb-2">
            <Form.Label>Reason</Form.Label>
            <Form.Control required value={form.reason} onChange={(e)=>setForm({...form, reason:e.target.value})} />
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Label>Start Time</Form.Label>
            <Form.Control type="datetime-local" value={form.start_time} onChange={(e)=>setForm({...form, start_time:e.target.value})} />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="btn-ghost" onClick={onHide}>Cancel</Button>
          <Button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Starting...' : 'Start'}</Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default StartMovementModal;
