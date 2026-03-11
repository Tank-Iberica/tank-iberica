/** Types for useDealerDashboard composable */

export interface DealerProfile {
  id: string
  user_id: string
  company_name: string | null
  slug: string | null
  bio: string | null
  logo_url: string | null
  phone: string | null
  email: string | null
  website: string | null
  location: string | null
  theme_primary: string | null
  theme_accent: string | null
  social_links: Record<string, string> | null
  certifications: string[] | null
  auto_reply_message: string | null
  onboarding_completed: boolean
  created_at: string | null
}

export interface DashboardStats {
  activeListings: number
  totalLeads: number
  totalViews: number
  leadsThisMonth: number
  responseRate: number
  contactsThisMonth: number
  fichaViewsThisMonth: number
  conversionRate: number
}

export interface RecentLead {
  id: string
  buyer_name: string | null
  buyer_email: string | null
  vehicle_id: string | null
  vehicle_brand: string | null
  vehicle_model: string | null
  status: string
  message: string | null
  created_at: string | null
}

export interface TopVehicle {
  id: string
  brand: string
  model: string
  year: number | null
  price: number | null
  views: number
  leads: number
  favorites: number
  status: string
}

/** Raw shape returned by the get_dealer_dashboard_stats RPC (snake_case columns) */
export interface DashboardStatsRaw {
  active_listings: number
  total_leads: number
  total_views: number
  leads_this_month: number
  response_rate: number
  contacts_this_month: number
  ficha_views_this_month: number
  conversion_rate: number
}

/** Raw shape returned by the get_dealer_top_vehicles RPC */
export interface TopVehicleRaw {
  id: string
  brand: string
  model: string
  year: number | null
  price: number | null
  views: number
  leads: number
  favorites: number
  status: string
}

export type RawLead = {
  id: string
  buyer_name: string | null
  buyer_email: string | null
  vehicle_id: string | null
  status: string
  message: string | null
  created_at: string | null
  vehicles: { brand: string; model: string } | null
}
