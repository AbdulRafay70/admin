/**
 * Dynamic Action Buttons Component
 * Automatically shows/hides buttons based on permissions
 */
import React from 'react';
import { usePermission } from '../contexts/EnhancedPermissionContext';
import { FaPlus, FaEdit, FaTrash, FaEye } from 'react-icons/fa';

const DynamicActionButtons = ({
    resource,
    onView,
    onAdd,
    onEdit,
    onDelete,
    selectedItem = null,
    showView = false,
    className = ''
}) => {
    const { can } = usePermission();

    return (
        <div className={`d-flex gap-2 ${className}`}>
            {/* View Button */}
            {showView && can('view', resource) && (
                <button
                    className="btn btn-info btn-sm"
                    onClick={onView}
                    title={`View ${resource}`}
                >
                    <FaEye /> View
                </button>
            )}

            {/* Add Button */}
            {can('add', resource) && (
                <button
                    className="btn btn-success btn-sm"
                    onClick={onAdd}
                    title={`Add ${resource}`}
                >
                    <FaPlus /> Add
                </button>
            )}

            {/* Edit Button - Only show if item is selected */}
            {selectedItem && can('edit', resource) && (
                <button
                    className="btn btn-primary btn-sm"
                    onClick={onEdit}
                    title={`Edit ${resource}`}
                >
                    <FaEdit /> Edit
                </button>
            )}

            {/* Delete Button - Only show if item is selected */}
            {selectedItem && can('delete', resource) && (
                <button
                    className="btn btn-danger btn-sm"
                    onClick={onDelete}
                    title={`Delete ${resource}`}
                >
                    <FaTrash /> Delete
                </button>
            )}
        </div>
    );
};

export default DynamicActionButtons;
