
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { NextFunction, Request, Response } from "express";

export default function (err: Error, req: Request, res: Response, next: NextFunction)
{
	if (err instanceof PrismaClientKnownRequestError)
	{
		console.log(err);
		res.status(400).send(err.message);
	}
	else
	{
		next(err);
	}
}