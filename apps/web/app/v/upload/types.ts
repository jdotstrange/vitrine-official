export type ListingStatus = "NFST" | "FOR_TRADE" | "FOR_SALE" | "SELL_TRADE"

export type Visibility = "public" | "private"

export interface CardPhoto {
  id: string
  file: File
  previewUrl: string
}

export interface CardMetadata {
  status: ListingStatus
  value: string
  visibility: Visibility
  showcaseIds: string[]
  tags: string[]
  context: string
}

export type CardProcessingStatus =
  | "idle"
  | "uploading"
  | "queued"
  | "processing"
  | "extracted"
  | "committing"
  | "done"
  | "failed"

export interface CardProcessingState {
  status: CardProcessingStatus
  progress: number // 0–1
  error?: string
  collectibleId?: string
  jobId?: string
  photoUrls?: string[]
}

export const INITIAL_PROCESSING_STATE: CardProcessingState = {
  status: "idle",
  progress: 0,
}

export interface UploadCard {
  id: string
  photos: CardPhoto[]
  metadata: CardMetadata
  overrides: Set<keyof CardMetadata>
  processing: CardProcessingState
}

export interface GlobalDefaults {
  status: ListingStatus
  value: string
  visibility: Visibility
  showcaseIds: string[]
  tags: string[]
}

export interface StatusChrome {
  label: string
  fill: string
  border: string
  text: string
}

export const STATUS_CONFIG: Record<ListingStatus, StatusChrome> = {
  NFST: {
    label: "NFST",
    fill: "var(--semantic-silver-fill)",
    border: "var(--frost-border-strong)",
    text: "var(--fg1)",
  },
  FOR_TRADE: {
    label: "Trade",
    fill: "var(--semantic-blue-fill)",
    border: "var(--semantic-blue-border)",
    text: "var(--semantic-blue)",
  },
  FOR_SALE: {
    label: "Sale",
    fill: "var(--semantic-green-fill)",
    border: "var(--semantic-green-border)",
    text: "var(--semantic-green)",
  },
  SELL_TRADE: {
    label: "Sale + Trade",
    fill: "var(--semantic-orange-fill)",
    border: "var(--semantic-orange-border)",
    text: "var(--semantic-orange)",
  },
}

export const STATUS_OPTIONS: {
  key: ListingStatus
  title: string
  subtitle: string
}[] = [
  { key: "NFST", title: "NFST", subtitle: "Catalog only" },
  { key: "FOR_TRADE", title: "Trade", subtitle: "Open to offers" },
  { key: "FOR_SALE", title: "Sale", subtitle: "Set asking price" },
  { key: "SELL_TRADE", title: "Sale + Trade", subtitle: "All inquiries" },
]

export const DEFAULT_METADATA: CardMetadata = {
  status: "NFST",
  value: "",
  visibility: "public",
  showcaseIds: [],
  tags: [],
  context: "",
}

export const DEFAULT_GLOBALS: GlobalDefaults = {
  status: "NFST",
  value: "",
  visibility: "public",
  showcaseIds: [],
  tags: [],
}

export const MAX_PHOTOS_PER_CARD = 6
export const MAX_CARDS_PER_BATCH = 20
