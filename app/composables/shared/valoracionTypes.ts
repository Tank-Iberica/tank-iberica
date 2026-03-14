/**
 * Shared type definitions and constants for useValoracion composable.
 */

export type PriceTrend = 'rising' | 'falling' | 'stable'
export type ConfidenceLevel = 'high' | 'medium' | 'low'

export interface ValoracionSubcategoryRow {
  id: string
  name: Record<string, string> | null
  name_es: string
  slug: string
}

export interface ValoracionFormData {
  brand: string
  model: string
  year: number | null
  km: number | null
  province: string
  subcategory: string
  email: string
}

export interface ValoracionResultData {
  min: number
  max: number
  median: number
  trend: PriceTrend
  trendPct: number
  daysToSell: number
  sampleSize: number
  confidence: ConfidenceLevel
}

export interface ValoracionHistoryItem {
  id: string
  created_at: string
  brand: string
  model: string
  year: number
  estimated_min: number
  estimated_max: number
  estimated_median: number
  confidence: string
}

export const PROVINCES: readonly string[] = [
  'Álava',
  'Albacete',
  'Alicante',
  'Almería',
  'Asturias',
  'Ávila',
  'Badajoz',
  'Barcelona',
  'Burgos',
  'Cáceres',
  'Cádiz',
  'Cantabria',
  'Castellón',
  'Ciudad Real',
  'Córdoba',
  'Cuenca',
  'Gerona',
  'Granada',
  'Guadalajara',
  'Guipúzcoa',
  'Huelva',
  'Huesca',
  'Islas Baleares',
  'Jaén',
  'La Coruña',
  'La Rioja',
  'Las Palmas',
  'León',
  'Lérida',
  'Lugo',
  'Madrid',
  'Málaga',
  'Murcia',
  'Navarra',
  'Orense',
  'Palencia',
  'Pontevedra',
  'Salamanca',
  'Santa Cruz de Tenerife',
  'Segovia',
  'Sevilla',
  'Soria',
  'Tarragona',
  'Teruel',
  'Toledo',
  'Valencia',
  'Valladolid',
  'Vizcaya',
  'Zamora',
  'Zaragoza',
] as const

export interface ValoracionState { loading: boolean; form: ValoracionFormData; result: ValoracionResultData | null; history: ValoracionHistoryItem[] }
