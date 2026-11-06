export interface Branch {
  bankCode: number
  bankName: string
  code: number
  name: string
  address: string
  city: string
  zip: string
  poBox: string
  phone: string
  accessible: boolean | null
  closedDay: string
  type: string
  openedOn: string
  closedOn: string
  mergedInto: { bankCode: number; code: number } | null
  latitude: number | null
  longitude: number | null
}

export interface Bank {
  code: number
  name: string
  category: string
  website: string
  swift: string
  address: string
  city: string
  phone: string
}

export interface RequestOptions {
  signal?: AbortSignal
  timeoutMs?: number
  fetch?: typeof fetch
}

export interface SearchOptions {
  bankCode?: number | string
  includeClosed?: boolean
  limit?: number
}

export type BranchLookupErrorCode = 'network' | 'timeout' | 'blocked' | 'server' | 'format'

export declare class BranchLookupError extends Error {
  code: BranchLookupErrorCode
}

export declare const DATA_API: string
export declare const BRANCHES_RESOURCE_ID: string
export declare const BANKS_RESOURCE_ID: string
export declare const BRANCHES_DATASET_URL: string

export declare function loadBranches(options?: RequestOptions): Promise<Branch[]>
export declare function loadBanks(options?: RequestOptions): Promise<Bank[]>
export declare function getBranch(
  bankCode: number | string,
  branchCode: number | string,
  options?: RequestOptions & { refresh?: boolean },
): Promise<Branch | null>
export declare function findBranch(branches: Branch[], bankCode: number | string, branchCode: number | string): Branch | null
export declare function searchBranches(branches: Branch[], query: string, options?: SearchOptions): Branch[]
export declare function nearestBranches(
  branches: Branch[],
  latitude: number,
  longitude: number,
  options?: { bankCode?: number | string; limit?: number },
): (Branch & { distanceKm: number })[]
export declare function isClosed(branch: Branch): boolean
export declare function mapUrl(branch: Branch): string
export declare function shortBankName(name: string): string
export declare function toBranch(record: Record<string, unknown>): Branch
export declare function toBank(record: Record<string, unknown>): Bank
