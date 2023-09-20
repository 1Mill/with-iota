export const fetchEnv = (strings = [], fallback) => {
	return strings.reduce((acc, s) => acc ?? process?.env?.[s], null) || fallback
}
