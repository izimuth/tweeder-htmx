import { NextFunction, Request, Response, Router } from "express";

type ViewContext<DT, FT extends FragmentType = {}> = {
	data?: DT;
	fragments: FT;
}

type FragmentType = {
	[key: string]: (...args:any[]) => string | Promise<string>;
}

type RequestHandler = (req: Request, res: Response, next: NextFunction) => void | Promise<void>;

type HttpMethod = 'get' | 'put' | 'post' | 'delete';

type MountPointItem = string | RequestHandler | { method: HttpMethod, handler: RequestHandler, middleware?: any[] };

type MountPoints = {
	[key: string]: MountPointItem;
}

type ViewDefinition<DT, MT extends MountPoints, FT extends FragmentType = {}> = {
	fragments: FT & ThisType<ViewContext<DT, FT>>;
	mount: MT & ThisType<ViewContext<DT, FT>>;
	data?(req: Request): DT;
	middleware?: any[];
	errorHandlers?: any[];
	basePath?: string;
}

export function createView<DT, MT extends MountPoints, FT extends FragmentType>(app: Router, viewDef: ViewDefinition<DT, MT, FT>)
{
	const middleware = viewDef.middleware ?? [];
	const errorHandlers = viewDef.errorHandlers ?? [];
	const base = viewDef.basePath ?? '';

	for(const path in viewDef.mount)
	{
		let mountPath = `${base}/${path}`.replace(/\/\//g, '/').replace(/\/$/, '');
		const point = viewDef.mount[path];

		const handler = async (req: Request, res: Response, next: NextFunction) => {
			let context: ViewContext<DT, FT> = {
				data: viewDef.data?.(req),
				fragments: { ...viewDef.fragments },
			};

			for(const name in context.fragments) 
			{
				// @ts-ignore
				context.fragments[name] = context.fragments[name].bind(context);
			}

			if (typeof(point) == 'string')
			{
				const content = await viewDef.fragments[point].call(context);
				res.send(content);
			}
			else if (typeof(point) == 'function')
			{
				point.call(context, req, res, next);
			}
			else
			{
				point.handler.call(context, req, res, next);
			}
		};

		if (typeof(point) == 'object')
		{		
			switch(point.method)
			{
				case 'get':
					app.get(mountPath, ...middleware, handler, ...errorHandlers);
					break;

				case 'post':
					app.post(mountPath, ...middleware, handler, ...errorHandlers);
					break;

				case 'put':
					app.put(mountPath, ...middleware, handler, ...errorHandlers);
					break;
				
				case 'delete':
					app.delete(mountPath, ...middleware, handler, ...errorHandlers);
					break;
			}
		}
		else
		{
			app.get(mountPath, ...middleware, handler, ...errorHandlers);
		}
	}
}


/*
createView({
	getFragments: {
		anotherFragment()
		{
			return 'weeee';
		},

		someFunc()
		{
			this.fragments.anotherFragment();
			return 'asfasdfasdf';
		}
	},

	mount: {
		'/': function(req, res) {
			res.send(this.fragments.anotherFragment());
		}
	}
})
*/