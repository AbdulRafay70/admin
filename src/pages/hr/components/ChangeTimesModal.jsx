import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';
import api from '../api';
import { useToast } from './ToastProvider';

const ChangeTimesModal = ({ show, onHide, employee, onChanged }) => {
  const [form, setForm] = useState({
    check_in_time: '',
    check_out_time: '',
    grace_minutes: 0
  });
  const [saving, setSaving] = useState(false);
  const { show: toast } = useToast();

  useEffect(() => {
    if (show && employee) {
      setForm({
        check_in_time: employee.check_in_time || '',
        check_out_time: employee.check_out_time || '',
        grace_minutes: employee.grace_minutes || 0
      });
    }
  }, [show, employee]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!employee) return;
    
    setSaving(true);
    try {
      await api.patch(`/hr/employees/${employee.id}/`, form);
      toast('success', 'Office Times Updated', 'Check-in/out times updated successfully');
      onChanged && onChanged();
    } catch (err) {
      console.error('Failed to update times', err);
      toast('danger', 'Failed', err?.response?.data?.detail || 'Failed to update times');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>Change Office Times - {employee?.first_name} {employee?.last_name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Check-In Time</Form.Label>
                <Form.Control 
                  type="time" 
                  value={form.check_in_time} 
                  onChange={(e) => setForm({ ...form, check_in_time: e.target.value })}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Check-Out Time</Form.Label>
                <Form.Control 
                  type="time" 
                  value={form.check_out_time} 
                  onChange={(e) => setForm({ ...form, check_out_time: e.target.value })}
                />
              </Form.Group>
            </Col>
          </Row>
          <Form.Group className="mb-3">
            <Form.Label>Grace Period (minutes)</Form.Label>
            <Form.Control 
              type="number" 
              min="0"
              value={form.grace_minutes} 
              onChange={(e) => setForm({ ...form, grace_minutes: e.target.value })}
            />
            <Form.Text className="text-muted">
              Number of minutes after check-in time before marking late
            </Form.Text>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? 'Updating...' : 'Update Times'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default ChangeTimesModal;
