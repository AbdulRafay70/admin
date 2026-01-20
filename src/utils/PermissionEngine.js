/**
 * Permission Engine - Frontend
 * Automatic permission checking and UI management
 */

class PermissionEngine {
    constructor(userPermissions, portal = 'admin') {
        this.userPermissions = userPermissions || [];
        this.portal = portal; // 'admin' or 'agent'
    }

    /**
     * Check if user has a specific permission
     * @param {string} permissionCodename - Full permission codename
     * @returns {boolean}
     */
    hasPermission(permissionCodename) {
        return this.userPermissions.includes(permissionCodename);
    }

    /**
     * Check if user has ANY of the provided permissions
     * @param {string[]} permissions - Array of permission codenames
     * @returns {boolean}
     */
    hasAnyPermission(permissions) {
        return permissions.some(p => this.hasPermission(p));
    }

    /**
     * Check if user has ALL of the provided permissions
     * @param {string[]} permissions - Array of permission codenames
     * @returns {boolean}
     */
    hasAllPermissions(permissions) {
        return permissions.every(p => this.hasPermission(p));
    }

    /**
     * Check if user can perform action on resource
     * @param {string} action - Action (view, add, edit, delete)
     * @param {string} resource - Resource name (hotel, package, etc)
     * @returns {boolean}
     */
    can(action, resource) {
        const permissionCodename = `${action}_${resource}_${this.portal}`;
        return this.hasPermission(permissionCodename);
    }

    /**
     * Get all available actions for a resource
     * @param {string} resource - Resource name
     * @returns {string[]} - Array of available actions
     */
    getAvailableActions(resource) {
        const actions = ['view', 'add', 'edit', 'delete'];
        return actions.filter(action => this.can(action, resource));
    }

    /**
     * Get all accessible resources
     * @returns {string[]} - Array of resource names
     */
    getAccessibleResources() {
        const resources = new Set();
        const suffix = `_${this.portal}`;

        this.userPermissions.forEach(perm => {
            if (perm.endsWith(suffix)) {
                // Extract resource from permission codename
                // e.g., "view_hotel_admin" → "hotel"
                const withoutSuffix = perm.slice(0, -suffix.length);
                const parts = withoutSuffix.split('_');
                if (parts.length >= 2) {
                    const resource = parts.slice(1).join('_');
                    resources.add(resource);
                }
            }
        });

        return Array.from(resources);
    }

    /**
     * Build permission codename from action and resource
     * @param {string} action - Action name
     * @param {string} resource - Resource name
     * @returns {string} - Permission codename
     */
    buildPermission(action, resource) {
        return `${action}_${resource}_${this.portal}`;
    }
}

export default PermissionEngine;
