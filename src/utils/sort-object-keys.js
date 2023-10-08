export const sortObjectKeys = obj => {
	if (!obj) { return obj } // ! Guard against null values which are an "object" but not in the way we want.
	if (typeof obj !== 'object') { return obj }

	if (Array.isArray(obj)) {
		return obj.map(item => sortObjectKeys(item))
	}

	const ordered = {}

	Object.keys(obj).sort().forEach(key => {
		ordered[key] = sortObjectKeys(obj[key])
	})

	return ordered;
}
