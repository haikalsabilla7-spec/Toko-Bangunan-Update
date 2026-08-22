import type { Request, Response, NextFunction } from "express"

/** Error dengan kode status HTTP. Dilempar dari route, ditangkap error handler. */
export class ApiError extends Error {
	status: number
	constructor(status: number, message: string) {
		super(message)
		this.status = status
	}
}

/** Bungkus handler async agar error otomatis diteruskan ke error handler Express. */
export function asyncHandler(
	fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) {
	return (req: Request, res: Response, next: NextFunction) => {
		fn(req, res, next).catch(next)
	}
}
