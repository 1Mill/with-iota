export const SKIP_ERASE = 'skip-iota-journal-erase'

export const throwError = (message, { skipJournalErase = false }) => {
	const m = [
		skipJournalErase ? SKIP_ERASE : null,
		message
	].filter(Boolean).join(' :: ')
	throw new Error(m)
}
