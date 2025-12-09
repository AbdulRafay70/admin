import React, { useState } from 'react';
import { Table, Button, Badge, Dropdown } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import ChangeSalaryModal from './ChangeSalaryModal';
import ChangeCommissionModal from './ChangeCommissionModal';
import ChangeTimesModal from './ChangeTimesModal';
import ViewEmployeeModal from './ViewEmployeeModal';
import EditEmployeeModal from './EditEmployeeModal';

const EmployeeList = ({ employees = [], refresh = () => { } }) => {
  const navigate = useNavigate();
  const [showChangeSalary, setShowChangeSalary] = useState(false);
  const [showChangeCommission, setShowChangeCommission] = useState(false);
  const [showChangeTimes, setShowChangeTimes] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const handleAction = (action, employee) => {
    setSelectedEmployee(employee);
    if (action === 'view') {
      setShowViewModal(true);
    } else if (action === 'salary') {
      setShowChangeSalary(true);
    } else if (action === 'commission') {
      setShowChangeCommission(true);
    } else if (action === 'times') {
      setShowChangeTimes(true);
    } else if (action === 'edit') {
      setShowEdit(true);
    }
  };

  const handleChanged = () => {
    setShowChangeSalary(false);
    setShowChangeCommission(false);
    setShowChangeTimes(false);
    setShowEdit(false);
    refresh();
  };

  return (
    <>
      <div className="table-responsive">
        <Table hover className="mb-0 hr-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Role</th>
              <th>Branch</th>
              <th>Salary</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.length === 0 ? (
              <tr><td colSpan={7} className="text-center text-muted">No employees found</td></tr>
            ) : employees.map((e) => (
              <tr key={e.id}>
                <td>{e.id}</td>
                <td>{e.first_name} {e.last_name}</td>
                <td>{e.role || '-'}</td>
                <td>{e.branch_name || '-'}</td>
                <td>{e.salary ? `${e.currency} ${e.salary}` : '-'}</td>
                <td>{e.is_active ? <Badge bg="success">Active</Badge> : <Badge bg="secondary">Inactive</Badge>}</td>
                <td>
                  <Button
                    size="sm"
                    variant="outline-primary"
                    className="me-1"
                    onClick={() => navigate(`/hr/employees/${e.id}`)}
                  >
                    View
                  </Button>
                  <Dropdown className="d-inline">
                    <Dropdown.Toggle size="sm" variant="outline-secondary" id={`dropdown-${e.id}`}>
                      Actions
                    </Dropdown.Toggle>
                    <Dropdown.Menu align="end">
                      <Dropdown.Item onClick={() => handleAction('view', e)}>
                        <i className="bi bi-eye me-2"></i>View Full Details
                      </Dropdown.Item>
                      <Dropdown.Divider />
                      <Dropdown.Item onClick={() => handleAction('salary', e)}>
                        <i className="bi bi-cash-coin me-2"></i>Change Salary
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => handleAction('commission', e)}>
                        <i className="bi bi-percent me-2"></i>Change Commission
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => handleAction('times', e)}>
                        <i className="bi bi-clock me-2"></i>Change Check-In/Out Times
                      </Dropdown.Item>
                      <Dropdown.Divider />
                      <Dropdown.Item onClick={() => handleAction('edit', e)}>
                        <i className="bi bi-pencil me-2"></i>Edit Personal Details
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      <ChangeSalaryModal
        show={showChangeSalary}
        onHide={() => setShowChangeSalary(false)}
        employee={selectedEmployee}
        onChanged={handleChanged}
      />
      <ChangeCommissionModal
        show={showChangeCommission}
        onHide={() => setShowChangeCommission(false)}
        employee={selectedEmployee}
        onChanged={handleChanged}
      />
      <ChangeTimesModal
        show={showChangeTimes}
        onHide={() => setShowChangeTimes(false)}
        employee={selectedEmployee}
        onChanged={handleChanged}
      />
      <EditEmployeeModal
        show={showEdit}
        onHide={() => setShowEdit(false)}
        employee={selectedEmployee}
        onSaved={handleChanged}
      />
      <ViewEmployeeModal
        show={showViewModal}
        onHide={() => setShowViewModal(false)}
        employee={selectedEmployee}
      />
    </>
  );
};

export default EmployeeList;
