import { test } from 'node:test'
import assert from 'node:assert/strict'
import { findBranch, getBranch, loadBanks, loadBranches, nearestBranches, searchBranches, toBranch } from './index.js'

const LIVE = process.env.LIVE === '1'

const record = (overrides) => ({
  Bank_Code: 12,
  Bank_Name: 'בנק הפועלים בע"מ',
  Branch_Code: 532,
  Branch_Name: 'שאול המלך',
  Branch_Address: 'דניאל פריש 3 ללא',
  City: 'תל אביב -יפו',
  Zip_Code: 6473104,
  POB: null,
  Telephone: '03-6935769',
  Handicap_Access: 'כן',
  day_closed: 'יום ו',
  Branch_Type: 'רגיל',
  Open_Date: '01/01/1949',
  Close_Date: '',
  Merge_Bank: null,
  Merge_Branch: null,
  X_Coordinate: 32.074431,
  Y_Coordinate: 34.782914,
  ...overrides,
})

const sample = [
  toBranch(record({})),
  toBranch(record({ Branch_Code: 861, Branch_Name: 'בת ים', Branch_Address: 'בלפור 80', City: 'בת ים', Bank_Code: 10, Bank_Name: 'בנק לאומי לישראל בע"מ', X_Coordinate: 32.0167, Y_Coordinate: 34.75 })),
  toBranch(record({ Branch_Code: 902, Branch_Name: "המלך ג'ורג'", Branch_Address: "המלך ג'ורג' 22", City: 'ירושלים', Bank_Code: 10 })),
  toBranch(record({ Branch_Code: 532, Close_Date: '14/05/2020', Branch_Address: 'ישן 1' })),
]

test('record mapping cleans the data', () => {
  const branch = sample[0]
  assert.equal(branch.bankName, 'בנק הפועלים')
  assert.equal(branch.address, 'דניאל פריש 3')
  assert.equal(branch.closedDay, 'שישי')
  assert.equal(branch.openedOn, '1949-01-01')
  assert.equal(branch.accessible, true)
})

test('findBranch prefers the open branch', () => {
  assert.equal(findBranch(sample, 12, 532).closedOn, '')
  assert.equal(findBranch(sample, '12', '532').address, 'דניאל פריש 3')
  assert.equal(findBranch(sample, 12, 1), null)
})

test('search matches word starts, not substrings', () => {
  const found = searchBranches(sample, 'בת ים')
  assert.deepEqual(found.map((branch) => branch.code), [861])
})

test('search filters by bank and hides closed branches', () => {
  assert.equal(searchBranches(sample, 'תל אביב').length, 1)
  assert.equal(searchBranches(sample, 'תל אביב', { includeClosed: true }).length, 2)
  assert.equal(searchBranches(sample, 'בת ים', { bankCode: 12 }).length, 0)
})

test('nearest branches are sorted by distance', () => {
  const [first] = nearestBranches(sample, 32.0167, 34.75)
  assert.equal(first.code, 861)
  assert.equal(first.distanceKm, 0)
})

test('live branches load', { skip: !LIVE }, async () => {
  const branches = await loadBranches()
  assert.ok(branches.length > 1000)
  const branch = await getBranch(12, 532)
  assert.equal(branch.bankName, 'בנק הפועלים')
})

test('live banks include SWIFT codes', { skip: !LIVE }, async () => {
  const banks = await loadBanks()
  assert.equal(banks.find((bank) => bank.code === 12).swift, 'POALILITXXX')
})
