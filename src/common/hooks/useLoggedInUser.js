import { parseJsonArray } from "@utils/index";
import { useEffect, useMemo, useState } from "react";

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

    const roles = useMemo(() => parseJsonArray(user?.access_control_role), [ user?.access_control_role ]);
    const isOnlinePermissionIncludes = useMemo(() => roles.includes("role_sales_purchase_manager") || roles.includes("role_portal") || roles.includes("role_sales_purchase_admin") || roles.includes("role_domain"), [ roles ]);

    return { user, roles, isOnlinePermissionIncludes, isLoading };
}
