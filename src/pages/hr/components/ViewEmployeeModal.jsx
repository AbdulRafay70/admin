import React from 'react';
import { Modal, Button, Row, Col, Badge } from 'react-bootstrap';

const ViewEmployeeModal = ({ show, onHide, employee }) => {
  if (!employee) return null;

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton className="bg-gradient" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <Modal.Title>
          <i className="bi bi-person-circle me-2"></i>
          Employee Details
        </Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
        <div className="mb-4">
          <div className="d-flex align-items-center gap-3 p-3 bg-light rounded">
            <div className="avatar" style={{ width: 80, height: 80, fontSize: 32, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontWeight: 'bold' }}>
              {employee.first_name?.[0]}{employee.last_name?.[0]}
            </div>
            <div className="flex-grow-1">
              <h4 className="mb-1">{employee.first_name} {employee.last_name}</h4>
              <div className="text-muted">{employee.role || 'Employee'}</div>
              <Badge bg={employee.is_active ? 'success' : 'secondary'} className="mt-1">
                {employee.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>
        </div>

        <Row>
          <Col md={6}>
            <div className="mb-4">
              <h6 className="text-muted mb-3">
                <i className="bi bi-person me-2"></i>Personal Information
              </h6>
              <table className="table table-sm table-borderless">
                <tbody>
                  <tr>
                    <td className="text-muted" style={{ width: '40%' }}>Email:</td>
                    <td><strong>{employee.email || '-'}</strong></td>
                  </tr>
                  <tr>
                    <td className="text-muted">Phone:</td>
                    <td><strong>{employee.phone || '-'}</strong></td>
                  </tr>
                  <tr>
                    <td className="text-muted">WhatsApp:</td>
                    <td><strong>{employee.whatsapp || '-'}</strong></td>
                  </tr>
                  <tr>
                    <td className="text-muted">Address:</td>
                    <td><strong>{employee.address || '-'}</strong></td>
                  </tr>
                  <tr>
                    <td className="text-muted">Emergency Contact:</td>
                    <td><strong>{employee.contact_name || '-'}</strong></td>
                  </tr>
                  <tr>
                    <td className="text-muted">Other Contact:</td>
                    <td><strong>{employee.other_contact_number || '-'}</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Col>

          <Col md={6}>
            <div className="mb-4">
              <h6 className="text-muted mb-3">
                <i className="bi bi-briefcase me-2"></i>Work Information
              </h6>
              <table className="table table-sm table-borderless">
                <tbody>
                  <tr>
                    <td className="text-muted" style={{ width: '40%' }}>Branch:</td>
                    <td><strong>{employee.branch_name || '-'}</strong></td>
                  </tr>
                  <tr>
                    <td className="text-muted">Role:</td>
                    <td><strong>{employee.role || '-'}</strong></td>
                  </tr>
                  <tr>
                    <td className="text-muted">Joining Date:</td>
                    <td><strong>{employee.joining_date || '-'}</strong></td>
                  </tr>
                  <tr>
                    <td className="text-muted">Commission Group:</td>
                    <td><strong>{employee.commission_group_name || 'None'}</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Col>
        </Row>

        <Row>
          <Col md={6}>
            <div className="mb-4">
              <h6 className="text-muted mb-3">
                <i className="bi bi-clock me-2"></i>Office Schedule
              </h6>
              <table className="table table-sm table-borderless">
                <tbody>
                  <tr>
                    <td className="text-muted" style={{ width: '40%' }}>Check-In Time:</td>
                    <td><strong>{employee.check_in_time || '09:00'}</strong></td>
                  </tr>
                  <tr>
                    <td className="text-muted">Check-Out Time:</td>
                    <td><strong>{employee.check_out_time || '18:00'}</strong></td>
                  </tr>
                  <tr>
                    <td className="text-muted">Grace Period:</td>
                    <td><strong>{employee.grace_minutes || 15} minutes</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Col>

          <Col md={6}>
            <div className="mb-4">
              <h6 className="text-muted mb-3">
                <i className="bi bi-cash-coin me-2"></i>Salary Information
              </h6>
              <table className="table table-sm table-borderless">
                <tbody>
                  <tr>
                    <td className="text-muted" style={{ width: '40%' }}>Salary:</td>
                    <td><strong>{employee.currency || 'PKR'} {parseFloat(employee.salary || 0).toFixed(2)}</strong></td>
                  </tr>
                  <tr>
                    <td className="text-muted">Payment Date:</td>
                    <td><strong>Day {employee.salary_payment_date || 25} of month</strong></td>
                  </tr>
                  <tr>
                    <td className="text-muted">Account Number:</td>
                    <td><strong>{employee.salary_account_number || '-'}</strong></td>
                  </tr>
                  <tr>
                    <td className="text-muted">Account Title:</td>
                    <td><strong>{employee.salary_account_title || '-'}</strong></td>
                  </tr>
                  <tr>
                    <td className="text-muted">Bank:</td>
                    <td><strong>{employee.salary_bank_name || '-'}</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Col>
        </Row>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          <i className="bi bi-x-circle me-2"></i>Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ViewEmployeeModal;
