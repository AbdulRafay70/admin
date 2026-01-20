/**
 * Debug component to check if permissions are loading
 * Add this temporarily to see what's happening
 */
import React from 'react';
import { usePermission } from '../contexts/EnhancedPermissionContext';

const PermissionDebug = () => {
    const { permissions, user, isLoading, hasAnyPermission } = usePermission();

    console.log('=== PERMISSION DEBUG ===');
    console.log('Permissions:', permissions);
    console.log('User:', user);
    console.log('Is Loading:', isLoading);
    console.log('Has blog permissions:', hasAnyPermission(['view_blog_admin', 'add_blog_admin', 'edit_blog_admin', 'delete_blog_admin']));
    console.log('========================');

    return (
        <div style={{ position: 'fixed', bottom: 10, right: 10, background: 'yellow', padding: '10px', zIndex: 9999, fontSize: '12px' }}>
            <strong>Permission Debug:</strong><br />
            Loading: {isLoading ? 'Yes' : 'No'}<br />
            Permissions: {permissions.length}<br />
            User: {user?.email || 'None'}<br />
            Has Blog: {hasAnyPermission(['view_blog_admin']) ? 'Yes' : 'No'}
        </div>
    );
};

export default PermissionDebug;
