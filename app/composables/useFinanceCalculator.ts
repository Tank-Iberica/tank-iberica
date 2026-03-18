/**
 * useFinanceCalculator
 * Composable for financing, total cost, and tax calculations.
 * Pure functions extracted to ~/utils/financeCalculator.helpers.ts
 */

import {
  ITP_RATES,
  calculateFinancing,
  calculateTotalCost,
  estimateInsurance,
  estimateMaintenance,
  formatCurrencyFromCents as formatCurrency,
} from '~/utils/financeCalculator.helpers'
import type { ITPRate } from '~/utils/financeCalculator.helpers'

/** Composable for finance calculator. */
export function useFinanceCalculator() {
  const itpRates: Readonly<ITPRate[]> = ITP_RATES
  const selectedComunidad = ref<string>('Madrid')

  return {
    itpRates,
    selectedComunidad,
    calculateFinancing,
    calculateTotalCost,
    estimateInsurance,
    estimateMaintenance,
    formatCurrency,
  }
}
