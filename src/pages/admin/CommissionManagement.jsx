import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Form, Badge, Modal, Alert } from 'react-bootstrap';
import { Plus, Edit2, Trash2, DollarSign, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import PartnersTabs from '../../components/PartnersTabs';
import axios from 'axios';
import './styles/commission-management.css';

const CommissionManagement = () => {
  // State
  const [groups, setGroups] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [alert, setAlert] = useState(null);

  // Form state
  const [name, setName] = useState('');
  const [receiverType, setReceiverType] = useState('branch');

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
    fetchGroups();
  }, []);

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 3000);
  };

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const res = await axios.get('https://api.saer.pk/api/commissions/rules', {
        params: organizationId ? { organization: organizationId } : {},
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = Array.isArray(res.data) ? res.data : (Array.isArray(res.data?.results) ? res.data.results : []);
      setGroups(data);
    } catch (e) {
      console.error('Failed to fetch commission groups', e);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditing(null);
    setName('');
    setReceiverType('branch');
    setShowModal(true);
  };

  const openEdit = (group) => {
    setEditing(group);
    setName(group.name || '');
    setReceiverType(group.receiver_type || 'branch');
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
      receiver_type: receiverType,
      commission: {
        group_ticket_commission_amount: '',
        umrah_package_commission_amount: '',
      },
      hotel_night_commission: [
        {
          quint_per_night_commission: '',
          quad_per_night_commission: '',
          triple_per_night_commission: '',
          double_per_night_commission: '',
          sharing_per_night_commission: '',
          other_per_night_commission: '',
          commission_hotels: [],
        },
      ],
    };

    try {
      if (editing && editing.id) {
        await axios.patch(
          `https://api.saer.pk/api/commissions/rules/${editing.id}/`,
          { name: name.trim(), receiver_type: receiverType },
          { headers: token ? { Authorization: `Bearer ${token}` } : {} }
        );
        showAlert('success', 'Commission group updated successfully');
      } else {
        await axios.post('https://api.saer.pk/api/commissions/rule/create', payload, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        showAlert('success', 'Commission group created successfully');
      }
      closeModal();
      fetchGroups();
    } catch (e) {
      console.error('Failed to save commission group', e);
      showAlert('danger', 'Failed to save commission group');
    }
  };

  const removeGroup = async (id) => {
    if (!window.confirm('Delete this commission group?')) return;
    try {
      await axios.delete(`https://api.saer.pk/api/commissions/rules/${id}/`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      showAlert('success', 'Commission group deleted successfully');
      fetchGroups();
    } catch (e) {
      console.error('Failed to delete commission group', e);
      showAlert('danger', 'Failed to delete commission group');
    }
  };

  const filteredGroups = groups.filter((g) => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    const name = (g.name || '').toString().toLowerCase();
    const type = (g.receiver_type || '').toString().toLowerCase();
    return name.includes(s) || type.includes(s);
  });

  const getReceiverTypeBadge = (type) => {
    const badges = {
      branch: <Badge bg="primary">Branch</Badge>,
      area_agent: <Badge bg="info">Area Agent</Badge>,
      employee: <Badge bg="success">Employee</Badge>,
    };
    return badges[type] || <Badge bg="secondary">{type}</Badge>;
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
              <PartnersTabs activeName="Commission Rules" />
            </Col>
          </Row>

          <Row className="mb-4">
            <Col>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h2 className="mb-1">Commission Groups</h2>
                  <p className="text-muted mb-0">Manage commission groups and assign commission values</p>
                </div>
              </div>
            </Col>
          </Row>

          <Card className="shadow-sm">
            <Card.Body>
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-3 gap-3">
                <div className="d-flex align-items-center gap-3">
                  <Badge bg="secondary" pill style={{ fontSize: '0.9rem' }}>
                    {filteredGroups.length} {filteredGroups.length === 1 ? 'Group' : 'Groups'}
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
                    <button className="btn btn-outline-secondary btn-sm" type="button" onClick={fetchGroups}>
                      <RefreshCw size={16} />
                    </button>
                  </div>
                  <Button size="sm" variant="primary" onClick={openAdd}>
                    <Plus size={16} className="me-1" /> Add Group
                  </Button>
                  <Link to="/commission-management/assign-values" className="btn btn-outline-secondary btn-sm">
                    <Edit2 size={16} className="me-1" /> Assign Values
                  </Link>
                </div>
              </div>

              <Table responsive className="table-borderless align-middle table-hover">
                <thead className="table-light">
                  <tr>
                    <th>Group Name</th>
                    <th>Receiver Type</th>
                    <th>Organization ID</th>
                    <th>Branch ID</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="text-center py-4">
                        Loading...
                      </td>
                    </tr>
                  ) : filteredGroups.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-5">
                        <div>
                          <div style={{ fontSize: 36, opacity: 0.6 }}>💼</div>
                          <div className="mt-2">
                            {groups.length === 0 ? 'No commission groups found' : 'No matching commission groups'}
                          </div>
                          {groups.length === 0 ? (
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
                    filteredGroups.map((g) => (
                      <tr key={g.id}>
                        <td>
                          <div className="fw-bold">{g.name}</div>
                        </td>
                        <td>{getReceiverTypeBadge(g.receiver_type)}</td>
                        <td>
                          <span className="text-muted">{g.organization_id || '-'}</span>
                        </td>
                        <td>
                          <span className="text-muted">{g.branch_id || '-'}</span>
                        </td>
                        <td>
                          <div className="d-flex gap-2">
                            <Button size="sm" variant="outline-primary" onClick={() => openEdit(g)} title="Edit Group">
                              <Edit2 size={16} />
                            </Button>
                            <Button size="sm" variant="outline-danger" onClick={() => removeGroup(g.id)} title="Delete Group">
                              <Trash2 size={16} />
                            </Button>
                            <Link
                              to={`/commission-management/assign-values?group=${g.id}`}
                              className="btn btn-sm btn-outline-success"
                              title="Assign Commission Values"
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
          <Modal.Title className="fw-semibold">{editing ? 'Edit' : 'Add'} Commission Group</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label className="small text-muted">Group Name *</Form.Label>
              <Form.Control
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Low Level, High Level"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="small text-muted">Receiver Type *</Form.Label>
              <Form.Select value={receiverType} onChange={(e) => setReceiverType(e.target.value)}>
                <option value="branch">Branch</option>
                <option value="area_agent">Area Agent</option>
                <option value="employee">Employee</option>
              </Form.Select>
              <Form.Text className="text-muted">Who will receive this commission</Form.Text>
            </Form.Group>

            <Alert variant="info" className="small mb-0">
              <strong>Note:</strong> Organization ID and Branch ID will be automatically set based on your login.
              Commission values can be assigned after creating the group.
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

export default CommissionManagement;
