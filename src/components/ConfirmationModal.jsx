import React from 'react';
import { Modal, Button } from 'react-bootstrap';
import { AlertTriangle } from 'lucide-react';

const ConfirmationModal = ({ show, onHide, onConfirm, title, message, confirmText = "Confirm", cancelText = "Cancel", variant = "primary" }) => {
    return (
        <Modal show={show} onHide={onHide} centered size="sm">
            <Modal.Header closeButton className={`bg-${variant} text-white`}>
                <Modal.Title className="d-flex align-items-center gap-2">
                    <AlertTriangle size={20} />
                    {title}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="text-center py-4">
                <h5 className="mb-0">{message}</h5>
            </Modal.Body>
            <Modal.Footer className="justify-content-center">
                <Button variant="secondary" onClick={onHide}>
                    {cancelText}
                </Button>
                <Button variant={variant} onClick={onConfirm}>
                    {confirmText}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default ConfirmationModal;
