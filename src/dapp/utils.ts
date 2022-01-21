interface CacheObject<T> {
	expiration: number;
	value: T;
}

/**
 * Store data in the browser's localStorage
 * @param key The key to store the data under
 * @param value the value of the stored data
 * @param expiration time to expiration (in seconds), null or zero means no expire
 */
export function setStorageItem<T>(key: string, value: T, expiration: number = null): void {
	try {
		const obj: CacheObject<T> = { value, expiration: null };
		if (expiration) {
			obj.expiration = Date.now() + expiration * 1e3;
		}
		localStorage.setItem(key, JSON.stringify(obj));
	} catch (error) {
		localStorage.clear();
	}
}

/**
 * Retrieve data stored in the browser's localStorage
 * @param key The key to retrieve the data from
 * @param defaultValue the value to return in case an error was thrown during deserialization, or the key was not found, or it was expired
 */
export function getStorageItem<T>(key: string, defaultValue?: T): T {
	try {
		const json = localStorage.getItem(key);
		const obj: CacheObject<T> = JSON.parse(json);
		if (obj?.expiration && obj?.expiration < Date.now()) {
			return defaultValue;
		}
		if (obj?.value === null || obj?.value === undefined) {
			return defaultValue;
		}
		return obj.value;
	} catch (error) {
		return defaultValue;
	}
}
