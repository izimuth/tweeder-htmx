import express, { Router, NextFunction, Request, Response } from "express";

type HttpMethod = 'get' | 'post' | 'put' | 'delete';
type RequestHandler = (req: Request, res: Response, next: NextFunction) => void | Promise<void>;
type MountHandler<T> = (req: Request, res: Response, next: NextFunction) => void | Promise<void>;
type SlotHandler<ContextType> = (context: ContextType, slot: string) => string | Promise<string>;

type ApiMethod = {
	method: HttpMethod;
	path: string;
	exec: RequestHandler;
}

type MountPoints<DataType = {}> = { 
	[key: string]: (MountHandler<DataType> | MountHandler<DataType>[])
}

type PageDefinition<DataType = {}> = {
	main: RequestHandler, //MainHandler<DataType>;
	data: (req: Request) => DataType;
	path?: string;
	middleware?: Array<(...args:any[]) => any>;
	before?: RequestHandler;
	slots?: Record<string, SlotHandler<PageContext<DataType>>>;
	api?: Record<string, ApiMethod>;
	
	mount: { 
		[key: string]: (MountHandler<DataType> | MountHandler<DataType>[])
	}
}

interface PageContext<DataType>
{
	def: PageDefinition<DataType>;
	data: DataType;
}

declare global 
{
	namespace Express
	{
		interface Request
		{
			templateVars?: any;
		}
	}
}

function bindMethod(router: Router, basePath: string, method: ApiMethod, middleware: any[])
{
	const path = method.path.replace(/^\//, '');

	switch(method.method)
	{
		case 'get': 
			router.get(`${basePath}/api/${path}`, ...middleware, method.exec);
			break;
		
		case 'post': 
			router.post(`${basePath}/api/${path}`, ...middleware, method.exec);
			break;

		case 'put': 
			router.put(`${basePath}/api/${path}`, ...middleware, method.exec);
			break;

		case 'delete': 
			router.delete(`${basePath}/api/${path}`, ...middleware, method.exec);
			break;
			
	}
}

async function renderPageSlot<DataType>(slot: string, pageDef: PageDefinition<DataType>, data: PageContext<DataType>)
{
	if (pageDef.slots && pageDef.slots[slot])
	{
		const slotFunc = pageDef.slots[slot];
		return await slotFunc.call(data, data, slot);
	}
	else
	{
		throw new Error(`Invalid slot: ${slot}`);
	}
}

async function renderAllSlots<DataType>(pageDef: PageDefinition<DataType>, data: PageContext<DataType>)
{
	const slots: Record<string, string> = {};

	if (pageDef.slots)
	{
		for(const name in pageDef.slots)
		{
			slots[name] = await renderPageSlot(name, pageDef, data);
		}
	}
	
	return slots;
}

export default function createPage<DataType, T extends PageDefinition<DataType>>(app: Router, pageDef: T & ThisType<PageContext<DataType>>)
{
	const basePath = pageDef.path?.trim() ?? '';
	const middleware = pageDef.middleware ? [...pageDef.middleware] : [];

	// add page-specific prerequest middleware if specified
	if (pageDef.before)
		middleware.push(pageDef.before);

	// add main request handler
	app.get(basePath || '/', ...middleware, async (req, res, next) => {
		const context: PageContext<DataType> = {
			def: pageDef,
			data: pageDef.data(req),
		};
		
		try
		{
			// render slots
			const slots = await renderAllSlots(pageDef, context);

			req.templateVars = { slots };
		}
		catch(err)
		{
			next(err);
			return;
		}

		// run main function
		await pageDef.main.call(context, req, res, next);
	});
	
	// add slot handlers
	if (pageDef.slots != undefined)
	{
		const slots = pageDef.slots;

		app.get(`${basePath}/:slotName`, ...middleware, async (req, res, next) => {
			if (slots[req.params.slotName])
			{
				try
				{
					const context = {
						def: pageDef,
						data: pageDef.data(req)
					};

					const content = await renderPageSlot(req.params.slotName, pageDef, context);
					res.send(content);
				}
				catch(err)
				{
					next(err);
				}
			}
			else
			{
				res.status(404);
				res.send(`Unknown slot: ${req.params.slotName}`);
				res.end();
			}
		});
	}


	// add api method handlers
	if (pageDef.api != undefined)
	{
		const methods = pageDef.api;

		for(const name in methods)
		{
			bindMethod(app, basePath, methods[name], middleware);
		}
	}

	return app;
}