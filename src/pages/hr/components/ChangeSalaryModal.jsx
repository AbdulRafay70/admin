import React, { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import api from '../api';
import { useToast } from './ToastProvider';

const ChangeSalaryModal = ({ show, onHide, employee, onChanged }) => {
  const [newSalary, setNewSalary] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const { show: toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!employee) return;
    
    setSaving(true);
    try {
      await api.post('/hr/salary-history/', {
        employee: employee.id,
        new_salary: newSalary,
        reason: reason
      });
      toast('success', 'Salary Updated', `Salary changed to ${newSalary}`);
      onChanged && onChanged();
      setNewSalary('');
      setReason('');
    } catch (err) {
      console.error('Failed to change salary', err);
      toast('danger', 'Failed', err?.response?.data?.detail || 'Failed to change salary');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>Change Salary - {employee?.first_name} {employee?.last_name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Current Salary</Form.Label>
            <Form.Control value={employee?.salary || '0'} disabled />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>New Salary *</Form.Label>
            <Form.Control 
              type="number" 
              required 
              value={newSalary} 
              onChange={(e) => setNewSalary(e.target.value)}
              placeholder="Enter new salary amount"
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Reason</Form.Label>
            <Form.Control 
              as="textarea" 
              rows={2}
              value={reason} 
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason for salary change (optional)"
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? 'Updating...' : 'Update Salary'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default ChangeSalaryModal;
