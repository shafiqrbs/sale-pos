import { Navigate } from "react-router";
import useLoggedInUser from "@hooks/useLoggedInUser";
import { APP_NAVLINKS } from "@/routes/routes";
import useConfigData from "@hooks/useConfigData";
import { Center, Loader } from "@mantine/core";

/**
 * Role-based route guard.
 *
 * Usage: wrap any <Route> element to restrict it to specific roles:
 *   <ProtectedRoute allowedRoles={["role_sales_purchase_admin"]}>
 *       <ConfigIndex />
 *   </ProtectedRoute>
 */
export default function ProtectedRoute({ allowedRoles = [], children }) {
    const { roles, isLoading } = useLoggedInUser();
    const { is_pos } = useConfigData();

    if (isLoading) {
        return <Center h="100vh">
            <Loader size="lg" />
        </Center>
    }

    // If allowedRoles is specified, check that the user has at least one of them
    if (allowedRoles.length > 0 && !allowedRoles.some((role) => roles.includes(role))) {
        return <Navigate replace to={is_pos ? APP_NAVLINKS.BAKERY : APP_NAVLINKS.SALES_NEW} />;
    }

    return children;
}