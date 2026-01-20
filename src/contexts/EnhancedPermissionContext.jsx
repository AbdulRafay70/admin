/**
 * Enhanced Permission Context with Permission Engine
 */
import React, { createContext, useState, useEffect, useContext, useMemo } from 'react';
import axios from 'axios';
import PermissionEngine from '../utils/PermissionEngine';

const PermissionContext = createContext();

export const PermissionProvider = ({ children }) => {
    const [permissions, setPermissions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState(null);

    // Fetch user permissions on mount
    useEffect(() => {
        fetchUserPermissions();
    }, []);

    const fetchUserPermissions = async () => {
        try {
            // Check both possible token keys
            const token = localStorage.getItem('accessToken') || localStorage.getItem('token');

            console.log('🔑 Fetching permissions...', { hasToken: !!token });

            if (!token) {
                console.warn('⚠️ No authentication token found');
                setIsLoading(false);
                return;
            }

            const response = await axios.get(
                'http://127.0.0.1:8000/api/current-user/permissions/',
                { headers: { Authorization: `Bearer ${token}` } }
            );

            console.log('✅ Permissions loaded:', response.data);
            console.log('👤 User details:', {
                email: response.data.user?.email,
                is_superuser: response.data.user?.is_superuser,
                is_staff: response.data.user?.is_staff
            });

            setPermissions(response.data.permissions);
            setUser(response.data.user);
            setIsLoading(false);
        } catch (error) {
            console.error('❌ Error fetching user permissions:', error);
            console.error('Error details:', error.response?.data);
            setIsLoading(false);
        }
    };

    // Create permission engine instance
    const engine = useMemo(() => {
        const portal = user?.is_staff ? 'admin' : 'agent';
        console.log('🔧 Permission Engine:', {
            userEmail: user?.email,
            isSuperuser: user?.is_superuser,
            portal,
            permissionCount: permissions.length
        });
        return new PermissionEngine(permissions, portal);
    }, [permissions, user]);

    // Permission checking functions
    const hasPermission = (permissionCodename) => {
        // Superusers have all permissions
        if (user?.is_superuser) {
            console.log('✅ Superuser bypass for:', permissionCodename);
            return true;
        }
        return engine.hasPermission(permissionCodename);
    };

    const hasAnyPermission = (permissionArray) => {
        // Superusers have all permissions
        if (user?.is_superuser) {
            console.log('✅ Superuser bypass for ANY:', permissionArray);
            return true;
        }
        return engine.hasAnyPermission(permissionArray);
    };

    const hasAllPermissions = (permissionArray) => {
        // Superusers have all permissions
        if (user?.is_superuser) return true;
        return engine.hasAllPermissions(permissionArray);
    };

    const can = (action, resource) => {
        // Superusers can do everything
        if (user?.is_superuser) return true;
        return engine.can(action, resource);
    };

    const getAvailableActions = (resource) => {
        return engine.getAvailableActions(resource);
    };

    const getAccessibleResources = () => {
        return engine.getAccessibleResources();
    };

    const value = {
        permissions,
        user,
        isLoading,
        engine,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        can,
        getAvailableActions,
        getAccessibleResources,
        refreshPermissions: fetchUserPermissions
    };

    return (
        <PermissionContext.Provider value={value}>
            {children}
        </PermissionContext.Provider>
    );
};

// Custom hook to use permission context
export const usePermission = () => {
    const context = useContext(PermissionContext);
    if (!context) {
        throw new Error('usePermission must be used within PermissionProvider');
    }
    return context;
};

export default PermissionContext;
