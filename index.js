export const DATA_API = 'https://data.gov.il/api/3/action'
export const BRANCHES_RESOURCE_ID = '2202bada-4baf-45f5-aa61-8c5bad9646d3'
export const BANKS_RESOURCE_ID = 'ebb61778-e34c-4e67-8fcf-0e643d9cf8c2'
export const BRANCHES_DATASET_URL = 'https://data.gov.il/he/datasets/bank_israel/branches'

const DEFAULT_TIMEOUT_MS = 15000
const FETCH_LIMIT = 5000

const dayLabels = {
  'יום א': 'ראשון',
  'יום ב': 'שני',
  'יום ג': 'שלישי',
  'יום ד': 'רביעי',
  'יום ה': 'חמישי',
  'יום ו': 'שישי',
  'יום ש': 'שבת',
}

export class BranchLookupError extends Error {
  constructor(code, message) {
    super(message)
    this.name = 'BranchLookupError'
    this.code = code
  }
}

const cleanText = (value) => String(value ?? '').replace(/\s+/g, ' ').trim()

const numberOf = (value) => {
  const parsed = Number(value)
  return value !== null && value !== '' && Number.isFinite(parsed) ? parsed : null
}

const isoDateOf = (value) => {
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(cleanText(value))
  return match ? `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}` : ''
}

export const shortBankName = (name) =>
  cleanText(name)
    .replace(/\s*בע"מ\s*$/, '')
    .trim()

const websiteOf = (value) => {
  const text = cleanText(value)
  if (!text) return ''
  try {
    const url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`)
    return /\.[a-z]{2,}$/i.test(url.hostname) ? url.href : ''
  } catch {
    return ''
  }
}

export function toBranch(record) {
  const handicap = cleanText(record.Handicap_Access)
  const zip = numberOf(record.Zip_Code)
  const poBox = numberOf(record.POB)
  const bankName = cleanText(record.Bank_Name)
  return {
    bankCode: Number(record.Bank_Code),
    bankName: shortBankName(bankName),
    code: Number(record.Branch_Code),
    name: cleanText(record.Branch_Name),
    address: cleanText(record.Branch_Address).replace(/\s+ללא$/, '').replace(/\s+0$/, ''),
    city: cleanText(record.City).replace(/\*/g, '').trim(),
    zip: zip ? String(zip) : '',
    poBox: poBox ? String(poBox) : '',
    phone: cleanText(record.Telephone),
    accessible: handicap === 'כן' ? true : handicap === 'לא' ? false : null,
    closedDay: dayLabels[cleanText(record.day_closed)] ?? '',
    type: cleanText(record.Branch_Type),
    openedOn: isoDateOf(record.Open_Date),
    closedOn: isoDateOf(record.Close_Date),
    mergedInto:
      numberOf(record.Merge_Branch) !== null
        ? { bankCode: numberOf(record.Merge_Bank) ?? Number(record.Bank_Code), code: numberOf(record.Merge_Branch) }
        : null,
    latitude: numberOf(record.X_Coordinate),
    longitude: numberOf(record.Y_Coordinate),
  }
}

export function toBank(record) {
  return {
    code: Number(record.Bank_Code),
    name: shortBankName(record.Bank_Name),
    category: cleanText(record.Category),
    website: websiteOf(record.Internet_Address),
    swift: cleanText(record.Swift_Code).toUpperCase(),
    address: cleanText(record.Address),
    city: cleanText(record.City),
    phone: cleanText(record.Telephone),
  }
}

export const isClosed = (branch) => branch.closedOn !== ''

const withTimeout = (signal, timeoutMs) => {
  const timeout = AbortSignal.timeout(timeoutMs)
  return signal ? AbortSignal.any([signal, timeout]) : timeout
}

async function fetchAll(resourceId, { signal, timeoutMs = DEFAULT_TIMEOUT_MS, fetch: fetcher = globalThis.fetch } = {}) {
  const url = `${DATA_API}/datastore_search?${new URLSearchParams({
    resource_id: resourceId,
    include_total: 'false',
    limit: String(FETCH_LIMIT),
  })}`
  let response
  try {
    response = await fetcher(url, { signal: withTimeout(signal, timeoutMs), headers: { Accept: 'application/json' } })
  } catch (error) {
    if (signal?.aborted) throw error
    if (error?.name === 'TimeoutError') throw new BranchLookupError('timeout', 'data.gov.il did not answer in time')
    throw new BranchLookupError('network', 'Could not reach data.gov.il')
  }
  if (response.status === 403 || response.status === 429) {
    throw new BranchLookupError('blocked', 'data.gov.il is rate limiting requests')
  }
  if (!response.ok) throw new BranchLookupError('server', `data.gov.il answered ${response.status}`)
  let data
  try {
    data = await response.json()
  } catch {
    throw new BranchLookupError('format', 'data.gov.il returned something that is not JSON')
  }
  if (data?.success !== true || !Array.isArray(data?.result?.records)) {
    throw new BranchLookupError('format', 'Unexpected data.gov.il response')
  }
  return data.result.records
}

export async function loadBranches(options = {}) {
  const records = await fetchAll(BRANCHES_RESOURCE_ID, options)
  return records.map(toBranch).filter((branch) => Number.isFinite(branch.bankCode) && Number.isFinite(branch.code))
}

export async function loadBanks(options = {}) {
  const records = await fetchAll(BANKS_RESOURCE_ID, options)
  return records.map(toBank).filter((bank) => Number.isFinite(bank.code))
}

const lettersOnly = (value) =>
  String(value ?? '')
    .normalize('NFC')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/["'`׳״]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/יי/g, 'י')
    .replace(/וו/g, 'ו')
    .trim()

const byOpenFirst = (a, b) =>
  Number(isClosed(a)) - Number(isClosed(b)) ||
  a.bankCode - b.bankCode ||
  a.city.localeCompare(b.city, 'he') ||
  a.code - b.code

export function findBranch(branches, bankCode, branchCode) {
  const matches = branches.filter(
    (branch) => branch.bankCode === Number(bankCode) && branch.code === Number(branchCode),
  )
  return matches.sort(byOpenFirst)[0] ?? null
}

export function searchBranches(branches, query, options = {}) {
  const { bankCode, includeClosed = false, limit = 30 } = options
  const tokens = lettersOnly(query).split(' ').filter(Boolean)
  if (!tokens.length) return []
  return branches
    .filter((branch) => includeClosed || !isClosed(branch))
    .filter((branch) => bankCode === undefined || branch.bankCode === Number(bankCode))
    .filter((branch) => {
      const words = lettersOnly(`${branch.city} ${branch.name} ${branch.address}`).split(' ')
      return tokens.every((token) => words.some((word) => word.startsWith(token)))
    })
    .sort(byOpenFirst)
    .slice(0, limit)
}

export function nearestBranches(branches, latitude, longitude, options = {}) {
  const { bankCode, limit = 5 } = options
  const toRadians = (degrees) => (degrees * Math.PI) / 180
  const distanceKm = (branch) => {
    const dLat = toRadians(branch.latitude - latitude)
    const dLon = toRadians(branch.longitude - longitude)
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRadians(latitude)) * Math.cos(toRadians(branch.latitude)) * Math.sin(dLon / 2) ** 2
    return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  }
  return branches
    .filter((branch) => !isClosed(branch) && branch.latitude !== null && branch.longitude !== null)
    .filter((branch) => bankCode === undefined || branch.bankCode === Number(bankCode))
    .map((branch) => ({ ...branch, distanceKm: Math.round(distanceKm(branch) * 10) / 10 }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit)
}

let cache = null

export async function getBranch(bankCode, branchCode, options = {}) {
  if (!cache || options.refresh) cache = loadBranches(options).catch((error) => {
    cache = null
    throw error
  })
  return findBranch(await cache, bankCode, branchCode)
}

export const mapUrl = (branch) =>
  branch.latitude === null || branch.longitude === null
    ? ''
    : `https://www.google.com/maps?q=${branch.latitude},${branch.longitude}`
