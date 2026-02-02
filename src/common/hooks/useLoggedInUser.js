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

    return user;
}
