
import express, { Request, Response, NextFunction} from 'express';

import getCurrentUser from '@/middleware/getCurrentUser';
import handleValidationErrors from '@/middleware/handleValidationErrors';

import posts from './posts';
import cookieParser from 'cookie-parser';

const api = express.Router();

// add common middleware
api.use(express.json());
api.use(express.urlencoded());

// require authorization
api.use(cookieParser());
api.use(getCurrentUser(true));

// mount endpoints
api.use('/posts', posts);

// default error handling for validation errors
api.use(handleValidationErrors);

export default api;