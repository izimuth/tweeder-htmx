import { prisma } from "@/prisma";
import { User, UserAuthToken } from "@prisma/client";
import { NextFunction, Request, Response } from "express";

declare global
{
	namespace Express
	{
		interface Request
		{
			authToken?: UserAuthToken;
			currentUser?: User;
		}
	}
}

export default function getCurrentUser(required: boolean)
{
	return async (req: Request, res: Response, next: NextFunction) => {
		try
		{
			// if there is no cookie and authentication is required then redirect
			if (!req.cookies['tweeder-auth-token'])
			{
				// if not required then just skip this middleware
				if (!required)
				{
					next();
					return;
				}

				// otherwise send error if ajax, redirect if not
				if (req.headers['HX-Request'] === 'true')
				{
					throw new Error('Authorization required for this request');					
				}
				else
				{
					res.redirect('/login');
					res.end();
					return;
				}
			}

			// get auth token 
			const authToken = await prisma.userAuthToken.findFirst({
				where: { tokenValue: req.cookies['tweeder-auth-token'] },
				include: { user: true }
			});

			if (!authToken)
				throw new Error('Authorization found but not valid');

			req.authToken = authToken;
			req.currentUser = authToken.user;

			next();
		}
		catch(err)
		{
			next(err);
		}
	}
};

