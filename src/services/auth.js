import { APP_APIS } from "@/routes/routes";
import { apiSlice } from "@services/api.mjs";

export const extendedApiSlice = apiSlice.injectEndpoints({
	endpoints: (builder) => ({
		resetPassword: builder.mutation({
			query: (body) => ({
				url: APP_APIS.RESET_PASSWORD,
				method: "POST",
				body,
			}),
			invalidatesTags: [ "Profile" ],
		}),
	}),
});

export const { useResetPasswordMutation } = extendedApiSlice;