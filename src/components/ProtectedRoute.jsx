/**
 * Protected Route Component
 * Automatically protects routes based on permissions
 */
import React from 'react';
import { Navigate } from 'react-router-dom';
import { usePermission } from '../contexts/EnhancedPermissionContext';

const ProtectedRoute = ({
    resource,
    requiredActions = ['view'],
    children,
    fallbackPath = '/403'
}) => {
    const { can, isLoading } = usePermission();

    // Show loading state while fetching permissions
    if (isLoading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    // Check if user has ANY of the required actions for this resource
    const hasAccess = requiredActions.some(action => can(action, resource));

    if (!hasAccess) {
        return <Navigate to={fallbackPath} replace />;
    }

    return children;
};

export default ProtectedRoute;
