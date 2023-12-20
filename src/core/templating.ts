
import nunjucks from 'nunjucks';
import dayjs from 'dayjs';

declare module 'nunjucks'
{
	interface Environment
	{
		renderAsync(path: string, context?: any): Promise<string>;
	}
}

nunjucks.Environment.prototype.renderAsync = function(path: string, context?: any) {
	return new Promise<string>((resolve, reject) => {
		this.render(path, context, (err, res) => {
			if (err)
				reject(err);
			else
				resolve(res ?? '');
		});
	});
}

const engine = nunjucks.configure('views', { autoescape: true });

engine.addFilter('dateFormat', (value: any, format: string) => {
	return dayjs(value).format(format);
});

engine.addFilter('awaitAsync', (value: Promise<string>, callback) => {
	value.then(callback);
}, true);

export default engine;