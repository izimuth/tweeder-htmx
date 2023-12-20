
import bcrypt from 'bcrypt';
import { Router } from "express";

import nj from '@/core/templating';
import getCurrentUser from "@/middleware/getCurrentUser";
import { createView } from '@/core/createView';
import { ValidationError, object, string } from "yup";
import { prisma } from "@/prisma";
import handleValidationErrors from '@/middleware/handleValidationErrors';

const UpdateProfileSchema = object({
	displayName: string().required(),
	username: string().required(),
	email: string().required(),
});

const UpdatePasswordSchema = object({
	currentPassword: string().required(),
	newPassword: string().required().min(6),
	confirmPassword: string().required().min(6),
});

export default (app: Router, basePath: string) => createView(app, {
	basePath,
	middleware: [ 
		getCurrentUser(true) 
	],
	errorHandlers: [
		handleValidationErrors
	],
	data(req) {
		return {
			currentUser: req.currentUser!
		}
	},
	fragments: {
		main() {
			return nj.render('editProfile/index.html', {
				currentUser: this.data!.currentUser
			});
		},
	},
	mount: {
		'/': 'main',

		'/api/savePassword': {
			method: 'post',
			async handler(req, res, next) {
				try
				{
					const { currentPassword, newPassword, confirmPassword } = UpdatePasswordSchema.validateSync(req.body);

					// validate current password
					if (!bcrypt.compareSync(currentPassword, req.currentUser!.password))
					{
						res.status(403).send('Current password is invalid');
						return;
					}

					// make sure new passwords match
					if (newPassword != confirmPassword)
					{
						res.status(403).send('Passwords do not match!');
						return;
					}

					// update password
					await prisma.user.update({
						where: { id: req.currentUser!.id },
						data: {
							password: bcrypt.hashSync(newPassword, 10)
						}
					});

					res.send('Password updated successfully!');
				}
				catch(err)
				{
					next(err);
				}
			}
		},

		'/api/save': {
			method: 'post',
			async handler(req, res, next) {
				try
				{
					const { displayName, username, email } = UpdateProfileSchema.validateSync(req.body);
					
					// make sure a user doesn't exist with the specified email or username
					let existing = await prisma.user.count({
						where: { email, NOT: { id: req.currentUser!.id } }
					});

					if (existing > 0)
					{
						res.status(400).send(`A user with this email address already exists!`);
						return;
					}

					existing = await prisma.user.count({
						where: { username, NOT: { id: req.currentUser!.id } }
					});

					if (existing > 0)
					{
						res.status(400).send(`A user with this username already exists!`);
						return;
					}

					// update profile data
					await prisma.user.update({
						where: { id: req.currentUser!.id },
						data: { displayName, username, email }
					});

					res.send('Profile updated successfully');
					//res.status(204).end();
				}
				catch(err)
				{
					next(err);
				}
			}
		}
	},
})