import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.session == null) throw redirect(302, "/login")
	if (locals.user.role != "ADMIN") throw redirect(302, "/login")
}