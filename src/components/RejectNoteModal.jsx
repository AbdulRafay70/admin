import React, { useState } from 'react';

const RejectNoteModal = ({ isOpen, onClose, onReject, bookingData }) => {
    const [localNote, setLocalNote] = useState('');

    if (!isOpen) return null;

    const userData = JSON.parse(localStorage.getItem("user") || "{}");
    const adminName = userData?.username || userData?.email || "Admin";

    const handleSubmit = () => {
        if (localNote.trim()) {
            onReject(localNote);
            setLocalNote('');
        }
    };

    const handleClose = () => {
        setLocalNote('');
        onClose();
    };

    return (
        <>
            <div
                className="modal-backdrop fade show"
                style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 1040,
                    backgroundColor: "rgba(0,0,0,0.5)",
                }}
                onClick={handleClose}
            ></div>

            <div
                className="modal d-block"
                tabIndex="-1"
                style={{
                    zIndex: 1050,
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    overflow: "auto",
                }}
            >
                <div
                    className="modal-dialog modal-dialog-centered"
                    style={{ maxWidth: "500px" }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="modal-content shadow-lg">
                        {/* Header */}
                        <div className="modal-header border-bottom">
                            <h5 className="modal-title fw-bold">Add Notes</h5>
                            <button
                                type="button"
                                className="btn-close"
                                onClick={handleClose}
                            ></button>
                        </div>

                        {/* Body */}
                        <div className="modal-body p-4">
                            {/* Existing Notes Section */}
                            {bookingData?.rejected_notes && (
                                <div className="mb-3 p-3 bg-light rounded border">
                                    <h6 className="fw-bold mb-2">Notes</h6>
                                    <p className="text-muted mb-0 small">{bookingData.rejected_notes}</p>
                                </div>
                            )}

                            {/* Date Reminder */}
                            <div className="mb-3">
                                <label className="fw-bold small text-muted">Date Reminder</label>
                                <div className="text-dark">{new Date().toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })}</div>
                            </div>

                            {/* Employer Name */}
                            <div className="mb-3">
                                <label className="fw-bold small text-muted">Employer name</label>
                                <div className="text-dark">{adminName}</div>
                            </div>

                            {/* Notes Textarea */}
                            <div className="mb-3">
                                <label className="form-label fw-bold small text-muted">- Notes</label>
                                <textarea
                                    className="form-control"
                                    rows={5}
                                    placeholder="Enter Notes"
                                    value={localNote}
                                    onChange={(e) => setLocalNote(e.target.value)}
                                    style={{
                                        resize: "none",
                                        fontSize: "14px",
                                    }}
                                    autoFocus
                                ></textarea>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="modal-footer border-top bg-light">
                            <button
                                className="btn btn-primary px-4"
                                onClick={handleSubmit}
                                disabled={!localNote.trim()}
                            >
                                Reject Order
                            </button>
                            <button
                                className="btn btn-secondary px-4"
                                onClick={handleClose}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default RejectNoteModal;
