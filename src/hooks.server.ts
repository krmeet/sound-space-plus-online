import type { Handle, RequestEvent } from "@sveltejs/kit";
import prisma from "$lib/prisma";
import * as crypto from "crypto";

async function attachUserToRequest(sessionId: string, sessionToken: string, event: RequestEvent) {
	const session = await prisma.session.findUnique({
		where: {
			id: sessionId
		}
	})
	if (!session) return

	var hash = crypto.createHash("md5")
	hash.update(sessionToken)
	var clientToken = hash.digest("hex")
	var serverToken = session.cookie
	if (clientToken != serverToken) return

	var user = await prisma.user.findUnique({
		where: {
			id: session.userId
		},
		select: {
			name: true,
			avatar: true,
			dateCreated: true,
			id: true,
			role: true,
			verified: true
		}
	})
	if (!user) return

	prisma.session.update({
		where: {
			id: session.id
		},
		data: {
			lastAccessed: new Date(Date.now())
		}
	})

	event.locals.user = user
}

export const handle: Handle = async ({ event, resolve }) => {
	const { cookies } = event
	const sessionId = cookies.get("ss+sid")
	const sessionToken = cookies.get("ss+tkn")
	if (sessionId && sessionToken) await attachUserToRequest(sessionId, sessionToken, event)

	if (!event.locals.user) {
		cookies.delete("ss+sid")
		cookies.delete("ss+tkn")
	}

	const response = await resolve(event)
	return response
}