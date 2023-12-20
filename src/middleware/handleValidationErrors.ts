import { NextFunction, Request, Response } from "express";
import { ValidationError } from "yup";

export default function handleValidationErrors(err: any, req: Request, res: Response, next: NextFunction)
{
	if (err instanceof ValidationError)
	{
		res.status(400);
		res.send(`Validation error: ${err.errors[0]}`);
	}
	else
	{
		next(err);
	}
}