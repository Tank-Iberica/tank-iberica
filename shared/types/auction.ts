/**
 * Auction domain types — shared between client and server.
 */

import type { ISODateString, UUID } from './common'

/** Auction lifecycle status */
export type AuctionStatus =
  | 'draft'
  | 'scheduled'
  | 'open'
  | 'closing'
  | 'closed'
  | 'cancelled'
  | 'settled'

/** Auction row from auctions table */
export interface AuctionRow {
  id: UUID
  vehicle_id: UUID
  dealer_id: UUID
  title: string
  description: string | null
  starting_price: number
  reserve_price: number | null
  current_price: number
  bid_increment: number
  deposit_amount: number
  status: AuctionStatus
  starts_at: ISODateString
  ends_at: ISODateString
  winner_id: UUID | null
  winning_bid_id: UUID | null
  created_at: ISODateString
  updated_at: ISODateString
}

/** Bid row from auction_bids table */
export interface AuctionBidRow {
  id: UUID
  auction_id: UUID
  bidder_id: UUID
  amount: number
  is_winning: boolean
  created_at: ISODateString
}

/** Auction registration (deposit paid, can bid) */
export interface AuctionRegistrationRow {
  id: UUID
  auction_id: UUID
  user_id: UUID
  deposit_status: 'pending' | 'paid' | 'refunded'
  stripe_payment_intent: string | null
  registered_at: ISODateString
}
