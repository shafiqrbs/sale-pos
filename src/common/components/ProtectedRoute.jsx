import { Navigate } from "react-router";
import useLoggedInUser from "@hooks/useLoggedInUser";
import { APP_NAVLINKS } from "@/routes/routes";

/**
 * Role-based route guard.
 *
 * Previously all routes were accessible to any logged-in user — there was
 * no check on what role they had. A regular user could access admin settings
 * by navigating directly to the URL.
 *
 * Usage: wrap any <Route> element to restrict it to specific roles:
 *   <ProtectedRoute allowedRoles={["role_sales_purchase_admin"]}>
 *       <ConfigIndex />
 *   </ProtectedRoute>
 */
export default function ProtectedRoute({ allowedRoles = [], children }) {
	const { roles } = useLoggedInUser();

	// If allowedRoles is specified, check that the user has at least one of them
	if (allowedRoles.length > 0 && !allowedRoles.some((role) => roles.includes(role))) {
		return <Navigate replace to={APP_NAVLINKS.BAKERY} />;
	}

	return children;
}
