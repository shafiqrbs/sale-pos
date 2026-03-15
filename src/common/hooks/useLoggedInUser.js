import { useEffect, useState } from "react";

export default function useLoggedInUser() {
    const [ user, setUser ] = useState(null);

    useEffect(() => {
        const fetchUser = async () => {
            const user = await window.dbAPI.getDataFromTable("users");
            setUser(user);
        };
        fetchUser();
    }, []);

    let roles = [];

    try {
        if (user?.access_control_role) {
            roles = JSON.parse(user.access_control_role)
        }
    } catch {
        roles = []
    }

    const isOnlinePermissionIncludes =
        roles.includes("role_sales_purchase_manager") || roles.includes("role_sales_purchase_admin") || roles.includes("role_sales_purchase_admin");



    return { user, roles , isOnlinePermissionIncludes};
}
