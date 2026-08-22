import type { Role } from "./middleware/auth"

// Menambahkan properti `user` ke object Request Express setelah lolos authRequired.
declare global {
	namespace Express {
		interface Request {
			user?: {
				id: string
				nama: string
				email: string
				role: Role
			}
		}
	}
}

export {}
