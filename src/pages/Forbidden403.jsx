/**
 * 403 Forbidden Page
 * Shown when user tries to access a page without permission
 */
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Home, ArrowLeft } from 'lucide-react';

const Forbidden403 = () => {
    const navigate = useNavigate();

    return (
        <div className="container-fluid d-flex align-items-center justify-content-center" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <div className="text-center text-white">
                <div className="mb-4">
                    <Lock size={100} className="mb-3" />
                    <h1 className="display-1 fw-bold">403</h1>
                    <h2 className="mb-4">Access Denied</h2>
                </div>

                <div className="card bg-white text-dark p-4 mx-auto" style={{ maxWidth: '500px' }}>
                    <div className="card-body">
                        <h5 className="card-title mb-3">⚠️ Permission Required</h5>
                        <p className="card-text mb-4">
                            You do not have permission to access this page or perform this action.
                            Please contact your administrator if you believe this is an error.
                        </p>

                        <div className="d-flex gap-3 justify-content-center">
                            <button
                                className="btn btn-primary"
                                onClick={() => navigate(-1)}
                            >
                                <ArrowLeft className="me-2" size={18} />
                                Go Back
                            </button>

                            <Link to="/" className="btn btn-secondary d-flex align-items-center">
                                <Home className="me-2" size={18} />
                                Home
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Forbidden403;
