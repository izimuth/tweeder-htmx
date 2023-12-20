
import bcrypt from 'bcrypt';
import dayjs from 'dayjs';
import * as uuid from 'uuid';

import nj from '@/core/templating';
import {prisma} from '../prisma';
import { Router } from 'express';
import { createView } from '@/core/createView';

export default (app: Router, basePath: string) => createView(app, {
	basePath,
	fragments: {
		main() {
			return nj.render('auth/login.html');
		},

		createAccount() {
			return nj.render('auth/create-account.html');
		}
	},
	mount: {
		'/': 'main',

		'/api/submit': {
			method: 'post',
			async handler(req, res, next) {
				try
				{
					const { username, password } = req.body;
					const user = await prisma.user.findFirst({
						where: {
							isActive: true,
							OR: [
								{ username },
								{ email: username }
							]
						}
					});
			
					if (user && bcrypt.compareSync(password, user.password))
					{
						// create auth token
						const tokenValue = uuid.v4();
						const token = await prisma.userAuthToken.create({
							data: {
								userId: user.id,
								tokenValue,
								expiresAfter: dayjs().add(7, 'days').toDate()
							}
						});
			
						// add to cookies
						res.cookie('tweeder-auth-token', tokenValue, {
							httpOnly: true,
							sameSite: true,
							expires: token.expiresAfter,
						});
			
						// redirect
						res.appendHeader('HX-Redirect', '/');
						res.status(204);
						res.end();
					}
					else
					{
						res.status(403);
						res.send('Invalid email address, username or password');
					}
				}
				catch(err)
				{
					next(err);
				}				
			},
		}
	}
})
