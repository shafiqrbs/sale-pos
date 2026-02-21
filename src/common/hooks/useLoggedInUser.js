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

    return { user, roles };
}
