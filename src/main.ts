
import express, { NextFunction, Request, Response } from 'express';

import getCurrentUser from './middleware/getCurrentUser';
import cookieParser from 'cookie-parser';
import { prisma } from './prisma';

import api from './api';

import registrationPage from './pages/registration';
import loginPage from './pages/login';
import homePage from './pages/home';
import userPage from './pages/user';
import postPage from './pages/post';
import editProfile from './pages/editProfile';
import handlePrismaError from './middleware/handlePrismaError';

// root app
const app = express();

// add middleware
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded());

// add static assets
app.use('/public', express.static('public'));

// mount api
app.use('/api', api);

// add stub for favicon because it bugs me
app.get('/favicon\.ico', (req, res) => {
	res.status(404).send('Not Found');
})

// add pages
app.get('/logout', getCurrentUser(true), async (req, res, next) => {
	try
	{
		await prisma.userAuthToken.delete({
			where: { id: req.authToken!.id },
		});

		res.clearCookie('tweeder-auth-token');
		res.redirect('/login');
	}
	catch(err)
	{
		next(err);
	}
});

registrationPage(app, '/registration');
loginPage(app, '/login');
homePage(app, '/home');
editProfile(app, '/profile');
postPage(app, '/:username/post/:id');
userPage(app, '/:username');

// redirect / to /home, 
app.get('/', cookieParser(), getCurrentUser(true), (req, res) => {
	res.redirect('/home');
});

// add error handlers
app.use(handlePrismaError);

// catch any uncaught error
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
	console.error(err.stack);
	res.status(500).send('An unrecoverable error occurred');
});


app.listen(3000, () => {
	console.log('Server listening...');
});