import axios from 'axios';

export const fetchAdminPermissions = async (adminToken) => {
    const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/admin/roles-permissions/my-role-permissions`,
        {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`,
            },
        }
    );
    return response.data?.data?.permissions || [];
};