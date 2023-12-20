
import bcrypt from 'bcrypt';
import * as uuid from 'uuid';
import { Router } from "express";

import nj from '@/core/templating';
import handleValidationErrors from "@/middleware/handleValidationErrors";
import { createView } from "@/core/createView";
import { object, string } from "yup";
import { prisma } from "@/prisma";
import dayjs from 'dayjs';

const RegistrationSchema = object({
	displayName: string().required(),
	username: string().required(),
	email: string().required(),
	password: string().required(),
	confPassword: string().required(),
});

export default (app: Router, basePath: string) => createView(app, {
	basePath,
	errorHandlers: [ 
		handleValidationErrors 
	],
	fragments: {
		main() {
			return nj.render('registration/create-account.html');
		}
	},
	mount: {
		'/': 'main',
		'/submit': {
			method: 'post',
			async handler(req, res, next) {
				try
				{
					const {
						displayName,
						username,
						email,
						password,
						confPassword,
					} = RegistrationSchema.validateSync(req.body);

					// make sure password's match
					if (password != confPassword)
					{
						res.status(400).send('Passwords do not match!');
						return;
					}

					// make sure email and username are unique
					const existing = await prisma.user.count({
						where: {
							OR: [ { username }, { email } ]
						}
					});

					if (existing > 0)
					{
						res.status(400).send('A user with the desired username or email address already exists!');
						return;
					}

					// create user
					const user = await prisma.user.create({
						data: {
							username,
							displayName,
							email,
							password: bcrypt.hashSync(password, 10),
						}
					});

					// automatically log them in
					const tokenValue = uuid.v4();
					const token = await prisma.userAuthToken.create({
						data: {
							tokenValue,
							userId: user.id,
							expiresAfter: dayjs().add(7, 'days').toDate()
						}
					});

					// add to cookies
					res.cookie('tweeder-auth-token', tokenValue, {
						httpOnly: true,
						sameSite: true,
						expires: token.expiresAfter,
					});
					
					// redirect to login screen
					res.header('HX-Redirect', '/');
					res.status(204).end();
				}
				catch(err)
				{
					next(err);
				}
			}
		}
	}
})