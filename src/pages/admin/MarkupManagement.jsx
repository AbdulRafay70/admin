import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Form, Badge, Modal, Alert } from 'react-bootstrap';
import { Plus, Edit2, Trash2, DollarSign, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import PartnersTabs from '../../components/PartnersTabs';
import axios from 'axios';
import '../../styles/markup-management.css';

const MarkupManagement = () => {
  // State
  const [markups, setMarkups] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [alert, setAlert] = useState(null);

  // Form state
  const [name, setName] = useState('');
  const [markupType, setMarkupType] = useState('percentage'); // Keep for UI but not used in API
  const [appliedOnType, setAppliedOnType] = useState('group_ticket');

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
    fetchMarkups();
  }, []);

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 3000);
  };

  const fetchMarkups = async () => {
    setLoading(true);
    try {
      const res = await axios.get('https://api.saer.pk/api/markups/', {
        params: organizationId ? { organization_id: organizationId } : {},
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = Array.isArray(res.data) ? res.data : (Array.isArray(res.data?.results) ? res.data.results : []);
      setMarkups(data);
    } catch (e) {
      console.error('Failed to fetch markup groups', e);
      setMarkups([]);
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditing(null);
    setName('');
    setMarkupType('percentage');
    setAppliedOnType('group_ticket');
    setShowModal(true);
  };

  const openEdit = (markup) => {
    setEditing(markup);
    setName(markup.name || '');
    setMarkupType('percentage'); // Not in API schema
    setAppliedOnType(markup.applies_to || 'group_ticket');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const submit = async () => {
    if (!name.trim()) {
      showAlert('danger', 'Please enter a markup group name');
      return;
    }

    const payload = {
      name: name.trim(),
      applies_to: appliedOnType,
      ticket_markup: 0,
      hotel_per_night_markup: 0,
      umrah_package_markup: 0,
      organization_id: organizationId,
    };

    try {
      if (editing && editing.id) {
        await axios.patch(
          `https://api.saer.pk/api/markups/${editing.id}/`,
          payload,
          { headers: token ? { Authorization: `Bearer ${token}` } : {} }
        );
        showAlert('success', 'Markup group updated successfully');
      } else {
        await axios.post('https://api.saer.pk/api/markups/', payload, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        showAlert('success', 'Markup group created successfully');
      }
      closeModal();
      fetchMarkups();
    } catch (e) {
      console.error('Failed to save markup group', e);
      showAlert('danger', 'Failed to save markup group');
    }
  };

  const removeMarkup = async (id) => {
    if (!window.confirm('Delete this markup group?')) return;
    try {
      await axios.delete(`https://api.saer.pk/api/markups/${id}/`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      showAlert('success', 'Markup group deleted successfully');
      fetchMarkups();
    } catch (e) {
      console.error('Failed to delete markup group', e);
      showAlert('danger', 'Failed to delete markup group');
    }
  };

  const filteredMarkups = markups.filter((m) => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    const name = (m.name || '').toString().toLowerCase();
    const appliesTo = (m.applies_to || '').toString().toLowerCase();
    return name.includes(s) || appliesTo.includes(s);
  });

  const getAppliesToBadge = (type) => {
    const badges = {
      group_ticket: <Badge bg="primary">Group Ticket</Badge>,
      hotel: <Badge bg="warning">Hotel</Badge>,
      umrah_package: <Badge bg="success">Umrah Package</Badge>,
    };
    return badges[type] || <Badge bg="secondary">{type}</Badge>;
  };

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="flex-grow-1">
        <Header />
        <Container fluid className="markup-management py-4">
          {alert && (
            <Alert variant={alert.type} onClose={() => setAlert(null)} dismissible className="mb-4">
              {alert.message}
            </Alert>
          )}

          <Row className="mb-3">
            <Col>
              <PartnersTabs activeName="Markup" />
            </Col>
          </Row>

          <Row className="mb-4">
            <Col>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h2 className="mb-1">Markup Groups</h2>
                  <p className="text-muted mb-0">Manage markup groups and assign markup values for bookings and hotels</p>
                </div>
              </div>
            </Col>
          </Row>

          <Card className="shadow-sm">
            <Card.Body>
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-3 gap-3">
                <div className="d-flex align-items-center gap-3">
                  <Badge bg="secondary" pill style={{ fontSize: '0.9rem' }}>
                    {filteredMarkups.length} {filteredMarkups.length === 1 ? 'Group' : 'Groups'}
                  </Badge>
                </div>

                <div className="d-flex gap-2 w-100 w-md-auto">
                  <div className="input-group" style={{ minWidth: 220 }}>
                    <input
                      className="form-control form-control-sm"
                      placeholder="Search markup groups..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <button className="btn btn-outline-secondary btn-sm" type="button" onClick={fetchMarkups}>
                      <RefreshCw size={16} />
                    </button>
                  </div>
                  <Button size="sm" variant="primary" onClick={openAdd}>
                    <Plus size={16} className="me-1" /> Add Group
                  </Button>
                  <Link to="/partners/markup/assign-values" className="btn btn-outline-secondary btn-sm">
                    <Edit2 size={16} className="me-1" /> Assign Values
                  </Link>
                </div>
              </div>

              <Table responsive className="table-borderless align-middle table-hover">
                <thead className="table-light">
                  <tr>
                    <th>Group Name</th>
                    <th>Applies To</th>
                    <th>Ticket Markup</th>
                    <th>Hotel Per Night</th>
                    <th>Umrah Package</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-4">
                        Loading...
                      </td>
                    </tr>
                  ) : filteredMarkups.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-5">
                        <div>
                          <div style={{ fontSize: 36, opacity: 0.6 }}>💰</div>
                          <div className="mt-2">
                            {markups.length === 0 ? 'No markup groups found' : 'No matching markup groups'}
                          </div>
                          {markups.length === 0 ? (
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
                    filteredMarkups.map((m) => (
                      <tr key={m.id}>
                        <td>
                          <div className="fw-bold">{m.name}</div>
                        </td>
                        <td>{getAppliesToBadge(m.applies_to)}</td>
                        <td>
                          <span className="text-success fw-semibold">{m.ticket_markup || 0}</span>
                        </td>
                        <td>
                          <span className="text-success fw-semibold">{m.hotel_per_night_markup || 0}</span>
                        </td>
                        <td>
                          <span className="text-success fw-semibold">{m.umrah_package_markup || 0}</span>
                        </td>
                        <td>
                          <div className="d-flex gap-2">
                            <Button size="sm" variant="outline-primary" onClick={() => openEdit(m)} title="Edit Group">
                              <Edit2 size={16} />
                            </Button>
                            <Button size="sm" variant="outline-danger" onClick={() => removeMarkup(m.id)} title="Delete Group">
                              <Trash2 size={16} />
                            </Button>
                            <Link
                              to={`/partners/markup/assign-values?group=${m.id}`}
                              className="btn btn-sm btn-outline-success"
                              title="Assign Markup Values"
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
          <Modal.Title className="fw-semibold">{editing ? 'Edit' : 'Add'} Markup Group</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label className="small text-muted">Group Name *</Form.Label>
              <Form.Control
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Standard Markup, Premium Markup"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="small text-muted">Applies To *</Form.Label>
              <Form.Select value={appliedOnType} onChange={(e) => setAppliedOnType(e.target.value)}>
                <option value="group_ticket">Group Ticket</option>
                <option value="hotel">Hotel</option>
                <option value="umrah_package">Umrah Package</option>
              </Form.Select>
              <Form.Text className="text-muted">What this markup applies to</Form.Text>
            </Form.Group>

            <Alert variant="info" className="small mb-0">
              <strong>Note:</strong> Organization ID will be automatically set based on your login.
              Markup values (ticket, hotel, package) can be assigned after creating the group.
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

export default MarkupManagement;
