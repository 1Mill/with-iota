interface FetchEnvProps {
	fallback?: any,
	vars: string[],
}

export function fetchEnv({ fallback, vars }: FetchEnvProps) {
	for (const v of vars) {
		const value = process.env[v]
		if (value !== undefined) { return value }
	}

	return fallback
}
