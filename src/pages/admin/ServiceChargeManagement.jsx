import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Form, Badge, Modal, Alert } from 'react-bootstrap';
import { Plus, Edit2, Trash2, DollarSign, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import PartnersTabs from '../../components/PartnersTabs';
import axios from 'axios';
import './styles/commission-management.css';

const ServiceChargeManagement = () => {
  // State
  const [charges, setCharges] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [alert, setAlert] = useState(null);

  // Form state
  const [name, setName] = useState('');

  // Get organization and branch from localStorage
  const orgDataRaw = localStorage.getItem('selectedOrganization');
  const token = localStorage.getItem('accessToken');
  let organizationId = 0;
  let branchId = 0;

  try {
    const parsed = orgDataRaw ? JSON.parse(orgDataRaw) : null;
    organizationId = parsed?.id ?? 0;
    branchId = parsed?.branch_id ?? 0;
  } catch (e) {
    organizationId = 0;
    branchId = 0;
  }

  useEffect(() => {
    fetchCharges();
  }, []);

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 3000);
  };

  const fetchCharges = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://127.0.0.1:8000/api/service-charges/service-charges/', {
        params: organizationId ? { organization_id: organizationId } : {},
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = Array.isArray(res.data) ? res.data : (Array.isArray(res.data?.results) ? res.data.results : []);
      setCharges(data);
    } catch (e) {
      console.error('Failed to fetch service charges', e);
      setCharges([]);
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditing(null);
    setName('');
    setShowModal(true);
  };

  const openEdit = (charge) => {
    setEditing(charge);
    setName(charge.name || '');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const submit = async () => {
    if (!name.trim()) {
      showAlert('danger', 'Please enter a group name');
      return;
    }

    const payload = {
      name: name.trim(),
      organization_id: organizationId,
      branch_id: branchId,
      ticket_charge_type: 'fixed',  // Default value
      ticket_charge_value: 0,        // Default value
      package_charge_value: 0,       // Default value
      active: true,
    };

    try {
      if (editing && editing.id) {
        await axios.patch(
          `http://127.0.0.1:8000/api/service-charges/service-charges/${editing.id}/`,
          { name: name.trim() },
          { headers: token ? { Authorization: `Bearer ${token}` } : {} }
        );
        showAlert('success', 'Service charge group updated successfully');
      } else {
        await axios.post('http://127.0.0.1:8000/api/service-charges/service-charges/', payload, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        showAlert('success', 'Service charge group created successfully');
      }
      closeModal();
      fetchCharges();
    } catch (e) {
      console.error('Failed to save service charge group', e);
      showAlert('danger', 'Failed to save service charge group');
    }
  };

  const removeCharge = async (id) => {
    if (!window.confirm('Delete this service charge?')) return;
    try {
      await axios.delete(`http://127.0.0.1:8000/api/service-charges/service-charges/${id}/`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      showAlert('success', 'Service charge deleted successfully');
      fetchCharges();
    } catch (e) {
      console.error('Failed to delete service charge', e);
      showAlert('danger', 'Failed to delete service charge');
    }
  };

  const filteredCharges = charges.filter((c) => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    const name = (c.name || '').toString().toLowerCase();
    return name.includes(s);
  });

  const getChargeTypeBadge = (type) => {
    const badges = {
      fixed: <Badge bg="primary">Fixed Amount</Badge>,
      percentage: <Badge bg="info">Percentage</Badge>,
    };
    return badges[type] || <Badge bg="secondary">{type}</Badge>;
  };

  const getAppliedOnBadge = (appliedOn) => {
    const badges = {
      package: <Badge bg="success">Package</Badge>,
      ticket: <Badge bg="warning">Ticket</Badge>,
      hotel: <Badge bg="danger">Hotel</Badge>,
    };
    return badges[appliedOn] || <Badge bg="secondary">{appliedOn}</Badge>;
  };

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="flex-grow-1">
        <Header />
        <Container fluid className="commission-management py-4">
          {alert && (
            <Alert variant={alert.type} onClose={() => setAlert(null)} dismissible className="mb-4">
              {alert.message}
            </Alert>
          )}

          <Row className="mb-3">
            <Col>
              <PartnersTabs activeName="Service Charges" />
            </Col>
          </Row>

          <Row className="mb-4">
            <Col>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h2 className="mb-1">Service Charge Groups</h2>
                  <p className="text-muted mb-0">Manage service charge groups and assign values</p>
                </div>
              </div>
            </Col>
          </Row>

          <Card className="shadow-sm">
            <Card.Body>
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-3 gap-3">
                <div className="d-flex align-items-center gap-3">
                  <Badge bg="secondary" pill style={{ fontSize: '0.9rem' }}>
                    {filteredCharges.length} {filteredCharges.length === 1 ? 'Group' : 'Groups'}
                  </Badge>
                </div>

                <div className="d-flex gap-2 w-100 w-md-auto">
                  <div className="input-group" style={{ minWidth: 220 }}>
                    <input
                      className="form-control form-control-sm"
                      placeholder="Search groups..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <button className="btn btn-outline-secondary btn-sm" type="button" onClick={fetchCharges}>
                      <RefreshCw size={16} />
                    </button>
                  </div>
                  <Button size="sm" variant="primary" onClick={openAdd}>
                    <Plus size={16} className="me-1" /> Add Group
                  </Button>
                  <Link to="/partners/service-charges/assign-values" className="btn btn-outline-secondary btn-sm">
                    <Edit2 size={16} className="me-1" /> Assign Values
                  </Link>
                </div>
              </div>

              <Table responsive className="table-borderless align-middle table-hover">
                <thead className="table-light">
                  <tr>
                    <th>Group Name</th>
                    <th>Organization ID</th>
                    <th>Branch ID</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="text-center py-4">
                        Loading...
                      </td>
                    </tr>
                  ) : filteredCharges.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-5">
                        <div>
                          <div style={{ fontSize: 36, opacity: 0.6 }}>💼</div>
                          <div className="mt-2">
                            {charges.length === 0 ? 'No service charge groups found' : 'No matching groups'}
                          </div>
                          {charges.length === 0 ? (
                            <div className="mt-3">
                              <Button variant="primary" size="sm" onClick={openAdd}>
                                <Plus size={16} className="me-1" /> Create first group
                              </Button>
                            </div>
                          ) : (
                            <div className="mt-3">
                              <Button variant="outline-secondary" size="sm" onClick={() => setSearchTerm('')}>
                                Clear search
                              </Button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredCharges.map((c) => (
                      <tr key={c.id}>
                        <td>
                          <div className="fw-bold">{c.name}</div>
                        </td>
                        <td>
                          <span className="text-muted">{c.organization_id || '-'}</span>
                        </td>
                        <td>
                          <span className="text-muted">{c.branch_id || '-'}</span>
                        </td>
                        <td>
                          <div className="d-flex gap-2">
                            <Button size="sm" variant="outline-primary" onClick={() => openEdit(c)} title="Edit Group">
                              <Edit2 size={16} />
                            </Button>
                            <Button size="sm" variant="outline-danger" onClick={() => removeCharge(c.id)} title="Delete Group">
                              <Trash2 size={16} />
                            </Button>
                            <Link
                              to={`/partners/service-charges/assign-values?group=${c.id}`}
                              className="btn btn-sm btn-outline-success"
                              title="Assign Service Charge Values"
                            >
                              <DollarSign size={16} />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Container>
      </div>

      <Modal show={showModal} onHide={closeModal} centered>
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-semibold">{editing ? 'Edit' : 'Add'} Service Charge Group</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label className="small text-muted">Group Name *</Form.Label>
              <Form.Control
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Standard Service Charge, Premium Service Charge"
              />
            </Form.Group>

            <Alert variant="info" className="small mb-0">
              <strong>Note:</strong> Organization ID and Branch ID will be automatically set based on your login.
              Service charge values can be assigned after creating the group.
            </Alert>
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="light" onClick={closeModal}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit}>
            {editing ? 'Save changes' : 'Create group'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ServiceChargeManagement;
