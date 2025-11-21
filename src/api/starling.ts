import { v4 as uuidv4 } from 'uuid'

const BASE_PATH = import.meta.env.DEV ? '/api' : 'https://api-sandbox.starlingbank.com/api'

export type MinorUnits = {
	currency: string
	minorUnits: number
}

export type Account = {
	accountUid: string
	accountHolderUid: string
	defaultCategory: string
	currency: string
	name?: string
}

export type FeedItemAmount = {
	currency: string
	minorUnits: number
}

export type FeedItem = {
	feedItemUid: string
	amount: FeedItemAmount
	direction: 'IN' | 'OUT'
	spendingCategory?: string
	source?: string
	status?: string
	timestamp?: string
	transactionTime?: string
}

export type SavingsGoal = {
	savingsGoalUid: string
	name: string
	target?: MinorUnits
	totalSaved?: MinorUnits
	state?: string
}

export type AccountHolderName = {
	accountHolderName: string
}

async function http<T>(path: string, init?: RequestInit): Promise<T> {
	const res = await fetch(`${BASE_PATH}${path}`, {
		...init,
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			...(init?.headers || {}),
		},
	})

	if (!res.ok) {
		let errorMessage = `HTTP ${res.status}: ${res.statusText}`
		try {
			const errorData = await res.json()
			if (errorData.error_description) {
				errorMessage = errorData.error_description
			} else if (errorData.error) {
				errorMessage = errorData.error
			}
		} catch {
			// If JSON parsing fails, try text
			const text = await res.text().catch(() => '')
			if (text) errorMessage = text
		}
		throw new Error(`Starling API error: ${errorMessage}`)
	}

	return (await res.json()) as T
}

export async function getAccounts(): Promise<Account[]> {
	const data = await http<{ accounts: Account[] }>(`/v2/accounts`)
	return data.accounts || []
}

export async function getFeedBetween(params: {
	accountUid: string
	categoryUid: string
	minTimestampIso: string
	maxTimestampIso: string
}): Promise<FeedItem[]> {
	const { accountUid, categoryUid, minTimestampIso, maxTimestampIso } = params

	const data = await http<{ feedItems: FeedItem[] }>(
		`/v2/feed/account/${accountUid}/category/${categoryUid}/transactions-between?minTransactionTimestamp=${encodeURIComponent(
			minTimestampIso
		)}&maxTransactionTimestamp=${encodeURIComponent(maxTimestampIso)}`
	)
	return data.feedItems || []
}

export async function listSavingsGoals(accountUid: string): Promise<SavingsGoal[]> {
	const data = await http<{ savingsGoalList: SavingsGoal[] }>(
		`/v2/account/${accountUid}/savings-goals`
	)
	return data.savingsGoalList || []
}

export async function createSavingsGoal(params: {
	accountUid: string
	name: string
	currency: string
}): Promise<SavingsGoal> {
	const { accountUid, name, currency } = params
	const data = await http<SavingsGoal>(`/v2/account/${accountUid}/savings-goals`, {
		method: 'PUT',
		body: JSON.stringify({
			name,
			currency,
		}),
	})
	return data
}

export async function addMoneyToSavingsGoal(params: {
	accountUid: string
	savingsGoalUid: string
	amountMinorUnits: number
	currency: string
}): Promise<void> {
	const { accountUid, savingsGoalUid, amountMinorUnits, currency } = params
	const transferUid = uuidv4()
	await http(
		`/v2/account/${accountUid}/savings-goals/${savingsGoalUid}/add-money/${transferUid}`,
		{
			method: 'PUT',
			body: JSON.stringify({
				amount: {
					currency,
					minorUnits: amountMinorUnits,
				},
			}),
		}
	)
}

export async function getAccountHolderName(): Promise<AccountHolderName> {
	const data = await http<AccountHolderName>(`/v2/account-holder/name`)
	return data
}

