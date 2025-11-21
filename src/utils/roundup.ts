import type { FeedItem } from '../api/starling'

export function calculateRoundUpMinorUnits(feedItems: FeedItem[]): number {
	let total = 0
	for (const item of feedItems) {
		if (item.direction !== 'OUT') continue
		const minor = item.amount?.minorUnits ?? 0
		if (minor <= 0) continue
		const remainder = minor % 100
		if (remainder === 0) continue
		total += 100 - remainder
	}
	return total
}

export function formatMinorUnits(minor: number, currency = 'GBP'): string {
	const value = (minor / 100).toFixed(2)
	return `${currency} ${value}`
}




