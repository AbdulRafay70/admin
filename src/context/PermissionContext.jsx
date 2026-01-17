import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const PermissionContext = createContext();

export const PermissionProvider = ({ children }) => {
    const [permissions, setPermissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userPermissions, setUserPermissions] = useState(new Set());

    useEffect(() => {
        fetchUserPermissions();
    }, []);

    const fetchUserPermissions = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('accessToken');
            if (!token) {
                setLoading(false);
                return;
            }

            // Fetch current user's details including permissions
            const response = await axios.get('http://127.0.0.1:8000/api/current-user/', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const user = response.data;

            // If user is superuser, they have all permissions
            if (user.is_superuser) {
                setUserPermissions(new Set(['*'])); // Special marker for superuser
                setPermissions(['*']);
                setLoading(false);
                return;
            }

            // Get user's groups
            const groupIds = user.groups || [];

            if (groupIds.length === 0) {
                setUserPermissions(new Set());
                setPermissions([]);
                setLoading(false);
                return;
            }

            // Fetch permissions for all user's groups
            const permissionPromises = groupIds.map(groupId =>
                axios.get(`http://127.0.0.1:8000/api/groups/${groupId}/`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                })
            );

            const groupResponses = await Promise.all(permissionPromises);

            // Collect all permission IDs from all groups
            const allPermissionIds = new Set();
            groupResponses.forEach(response => {
                const groupPerms = response.data.permissions || [];
                groupPerms.forEach(permId => allPermissionIds.add(permId));
            });

            // Fetch permission details
            const permResponse = await axios.get('http://127.0.0.1:8000/api/permissions/', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            // Filter to get only user's permissions and extract codenames
            const userPerms = permResponse.data
                .filter(perm => allPermissionIds.has(perm.id))
                .map(perm => perm.codename);

            setPermissions(userPerms);
            setUserPermissions(new Set(userPerms));

            console.log('User permissions loaded:', userPerms);
        } catch (error) {
            console.error('Error fetching user permissions:', error);
            setPermissions([]);
            setUserPermissions(new Set());
        } finally {
            setLoading(false);
        }
    };

    /**
     * Check if user has a specific permission
     * @param {string} permission - Permission codename (e.g., 'add_user', 'change_booking')
     * @returns {boolean}
     */
    const hasPermission = (permission) => {
        if (loading) return false;
        if (userPermissions.has('*')) return true; // Superuser
        return userPermissions.has(permission);
    };

    /**
     * Check if user has ANY of the specified permissions
     * @param {string[]} permissionList - Array of permission codenames
     * @returns {boolean}
     */
    const hasAnyPermission = (permissionList) => {
        if (loading) return false;
        if (userPermissions.has('*')) return true; // Superuser
        return permissionList.some(perm => userPermissions.has(perm));
    };

    /**
     * Check if user has ALL of the specified permissions
     * @param {string[]} permissionList - Array of permission codenames
     * @returns {boolean}
     */
    const hasAllPermissions = (permissionList) => {
        if (loading) return false;
        if (userPermissions.has('*')) return true; // Superuser
        return permissionList.every(perm => userPermissions.has(perm));
    };

    /**
     * Refresh permissions (call after login or permission changes)
     */
    const refreshPermissions = () => {
        fetchUserPermissions();
    };

    const value = {
        permissions,
        loading,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        refreshPermissions,
    };

    return (
        <PermissionContext.Provider value={value}>
            {children}
        </PermissionContext.Provider>
    );
};

/**
 * Custom hook to use permissions
 * @returns {object} { permissions, loading, hasPermission, hasAnyPermission, hasAllPermissions, refreshPermissions }
 */
export const usePermissions = () => {
    const context = useContext(PermissionContext);
    if (!context) {
        throw new Error('usePermissions must be used within a PermissionProvider');
    }
    return context;
};

export default PermissionContext;
