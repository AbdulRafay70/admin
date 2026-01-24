import React, { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import api from '../api';
import { useToast } from './ToastProvider';

const ChangeCommissionModal = ({ show, onHide, employee, onChanged }) => {
  const [commissionGroup, setCommissionGroup] = useState('');
  const [groups, setGroups] = useState([]);
  const [saving, setSaving] = useState(false);
  const { show: toast } = useToast();

  useEffect(() => {
    if (show && employee) {
      // commission_group might be an object or ID depending on serializer, usually ID in edit form
      // but EmployeeSerializer has commission_group as ID and commission_group_name as string
      setCommissionGroup(employee.commission_group || '');

      // Fetch commission rules (using the commissions app API)
      const fetchGroups = async () => {
        try {
          // Check if we can filter by receiver_type via query param, if not we filter in JS
          const resp = await api.get('/commissions/rules/');
          const allRules = Array.isArray(resp.data) ? resp.data : resp.data.results || [];

          // Filter for employee rules
          const employeeRules = allRules.filter(r => r.receiver_type === 'employee');
          setGroups(employeeRules);
        } catch (err) {
          console.warn('Failed to fetch commission rules', err);
        }
      };
      fetchGroups();
    }
  }, [show, employee]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!employee) return;

    setSaving(true);
    try {
      await api.patch(`/hr/employees/${employee.id}/`, {
        commission_group: commissionGroup || null
      });
      toast('success', 'Commission Group Updated', 'Commission group changed successfully');
      onChanged && onChanged();
    } catch (err) {
      console.error('Failed to change commission group', err);
      toast('danger', 'Failed', err?.response?.data?.detail || 'Failed to change commission group');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>Change Commission - {employee?.first_name} {employee?.last_name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Commission Group</Form.Label>
            <Form.Select value={commissionGroup} onChange={(e) => setCommissionGroup(e.target.value)}>
              <option value="">None (Remove Commission)</option>
              {groups.map(g => (
                <option key={g.id} value={g.id}>{g.name} {g.commission_rate ? `(${g.commission_rate}%)` : ''}</option>
              ))}
            </Form.Select>
            <Form.Text className="text-muted">
              Select a commission group or choose "None" to remove commission eligibility
            </Form.Text>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? 'Updating...' : 'Update Commission'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default ChangeCommissionModal;
