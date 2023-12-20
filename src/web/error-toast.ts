
import { Toast } from 'bootstrap';

import htmx from 'htmx.org';

htmx.defineExtension('errortoast', {
	onEvent(name, event) {
		if (name == 'htmx:afterRequest' && event.detail.failed)
		{
			const el = document.querySelector<HTMLElement>('#error-toast');
			const toast = el ? Toast.getInstance(el) : null;

			if (el && toast)
			{
				el.querySelector<HTMLElement>('.toast-body')!.innerText = event.detail.xhr.responseText;
				toast.show();
			}
			else
			{
				alert(event.detail.xhr.responseText);
			}
		}
	}
})

document.addEventListener('DOMContentLoaded', () => {
	window.onload = () => {
		const toast = document.getElementById('error-toast');
	
		if (toast)
			new Toast(toast);
	}
});
