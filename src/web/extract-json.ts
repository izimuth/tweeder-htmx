
import htmx from 'htmx.org';

class OnJsonEvent extends Event
{
	constructor(readonly json: any)
	{
		super('htmx:onJson');
	}
}

function getObjectField(path: string, json: any)
{
	const parts = path.split('.').map(p => p.trim());

	return parts.reduce((prev, curr) => prev[curr], json);
}

function swapJsonFields(target: HTMLElement, json: any, textOnly = true)
{
	target.querySelectorAll<HTMLElement>('[hx-json]').forEach(el => {
		const value = getObjectField(el.getAttribute('hx-json')!.toString(), json);

		if (textOnly)
			el.innerText = value;
		else
			el.innerHTML = value;
	});
}

//function setJsonClass(target: HTMLElement, )

htmx.defineExtension('extract-json', {
	onEvent(name, event)
	{
		if (name == 'htmx:beforeSwap' && event.detail.xhr.getResponseHeader('Content-Type')?.startsWith('application/json'))
		{
			// parse JSON
			const json = JSON.parse(event.detail.xhr.responseText);

			// swap json text fields
			swapJsonFields(event.detail.target, json);

			// trigger json event
			event.detail.target.dispatchEvent(new OnJsonEvent(json));

			// prevent default swapping behavior
			event.detail.shoulSwap = false;
			return false;
		}
	}
});