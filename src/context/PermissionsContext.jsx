import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';

import { fetchAdminPermissions } from '../services/permissionsService';

const PermissionsContext = createContext();

const SUPER_ADMIN_ROLE = 'super-admin';

export const PermissionsProvider = ({ children }) => {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  const loadPermissions = useCallback(async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem('adminToken');
      const role = localStorage.getItem('role');

      // No token
      if (!token) {
        setPermissions([]);
        setIsSuperAdmin(false);
        return;
      }

      // Super admin
      if (role === 'super-admin') {
        setPermissions([]);
        setIsSuperAdmin(true);
        return;
      }

      // Fetch permissions
      const data = await fetchAdminPermissions(token);

      setPermissions(data || []);
      setIsSuperAdmin(false);
    } catch (err) {
      console.error('Failed to fetch permissions:', err);
      setPermissions([]);
      setIsSuperAdmin(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadPermissions();
  }, [loadPermissions]);

  return (
    <PermissionsContext.Provider
      value={{
        permissions,
        loading,
        isSuperAdmin,
        refreshPermissions: loadPermissions,
      }}
    >
      {children}
    </PermissionsContext.Provider>
  );
};

export const usePermissions = () => {
  return (
    useContext(PermissionsContext) || {
      permissions: [],
      loading: false,
      isSuperAdmin: false,
      refreshPermissions: async () => {},
    }
  );
};