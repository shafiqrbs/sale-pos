import { useEffect, useState } from "react";

export default function useLoggedInUser() {
    const [ user, setUser ] = useState(null);
    const [ isLoading, setIsLoading ] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const user = await window.dbAPI.getDataFromTable("users");
                setUser(user);
            } catch (error) {
                console.error("Error fetching user:", error);
            } finally {
                setIsLoading(false);
            }
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
        roles.includes("role_sales_purchase_manager") || roles.includes("role_sales_purchase_admin") || roles.includes("role_sales_purchase_admin") || roles.includes("role_sales_purchase_admin");

    return { user, roles, isOnlinePermissionIncludes, isLoading };
}
