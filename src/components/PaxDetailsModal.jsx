import React from "react";
import { Modal, Button, Table } from "react-bootstrap";

// Mock function to get pax details - replace with actual API call if needed
export const getPaxDetails = (paxId) => {
  // This is a mock implementation
  // In a real scenario, you would fetch this from an API
  return {
    pax_id: paxId,
    first_name: "Sample",
    last_name: "Passenger",
    passport_number: "PK1234567",
    age_group: "adult",
    contact_number: "+923000000000",
    visa_status: "Approved",
    ticket_status: "Confirmed",
    is_family_head: false
  };
};

const PaxDetailsModal = ({ show, onHide, paxDetails }) => {
  if (!paxDetails) return null;

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Passenger Details - {paxDetails.pax_id}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Table bordered>
          <tbody>
            <tr>
              <th style={{ width: "30%" }}>Pax ID</th>
              <td>{paxDetails.pax_id}</td>
            </tr>
            <tr>
              <th>Full Name</th>
              <td>{paxDetails.first_name} {paxDetails.last_name}</td>
            </tr>
            <tr>
              <th>Passport Number</th>
              <td>{paxDetails.passport_number || 'N/A'}</td>
            </tr>
            <tr>
              <th>Age Group</th>
              <td className="text-capitalize">{paxDetails.age_group || 'N/A'}</td>
            </tr>
            <tr>
              <th>Contact Number</th>
              <td>{paxDetails.contact_number || 'N/A'}</td>
            </tr>
            <tr>
              <th>Visa Status</th>
              <td>{paxDetails.visa_status || 'Pending'}</td>
            </tr>
            <tr>
              <th>Ticket Status</th>
              <td>{paxDetails.ticket_status || 'Pending'}</td>
            </tr>
            <tr>
              <th>Family Head</th>
              <td>{paxDetails.is_family_head ? 'Yes' : 'No'}</td>
            </tr>
          </tbody>
        </Table>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default PaxDetailsModal;
