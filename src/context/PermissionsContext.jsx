import React, { createContext, useContext, useEffect, useState } from 'react';
import { fetchAdminPermissions } from '../services/permissionsService';

const PermissionsContext = createContext();

const SUPER_ADMIN_ROLE = 'super-admin'; // match exactly what you store in localStorage

export const PermissionsProvider = ({ children }) => {
    const [permissions, setPermissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('adminToken');
        const role = localStorage.getItem('role');

        // ✅ Superadmin bypass — skip API, grant full access
        if (role === SUPER_ADMIN_ROLE) {
            setIsSuperAdmin(true);
            setLoading(false);
            return;
        }

        if (!token) {
            setLoading(false);
            return;
        }

        setLoading(true);
        fetchAdminPermissions(token)
            .then(setPermissions)
            .catch((err) => {
                console.error('Failed to fetch permissions:', err);
                setPermissions([]);
            })
            .finally(() => setLoading(false));
    }, []);

    return (
        <PermissionsContext.Provider value={{ permissions, loading, isSuperAdmin }}>
            {children}
        </PermissionsContext.Provider>
    );
};

export const usePermissions = () => {
    return useContext(PermissionsContext) || { permissions: [], loading: false, isSuperAdmin: false };
};