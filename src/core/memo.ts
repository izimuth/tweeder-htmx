
type AsyncMemoFunc<T> = (...args:any[]) => Promise<T>;

export function createAsyncMemo<T>(func: AsyncMemoFunc<T>): AsyncMemoFunc<T>
{
	// cached result
	let result: T | undefined = undefined;

	// return new callable
	return (...args:any[]): Promise<T> => {
		return new Promise<T>((resolve, reject) => {
			// if result is undefined then call the original function and save its result
			if (result == undefined) 
			{
				func(...args)
					.then(r => {
						result = r;
						resolve(result);
					})
					.catch(reject);
			} 
			else 
			{
				resolve(result);
			}
		});
	}
}
