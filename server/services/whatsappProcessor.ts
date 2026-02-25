/**
 * WhatsApp submission processor — orchestrates the full flow.
 *
 * Intended to replace the inline logic in /api/whatsapp/process.post.ts.
 * Currently a skeleton; the actual endpoint still handles everything inline.
 *
 * Full flow:
 * 1. Download images from WhatsApp Media API
 * 2. Call Claude Vision via aiProvider for vehicle analysis
 * 3. Upload images via imageUploader
 * 4. Create vehicle via vehicleCreator
 * 5. Notify dealer via notifications service
 */

// Re-export for convenience when the refactor happens
export { uploadToCloudinary } from './imageUploader'
export { createVehicle, sanitizeSlug } from './vehicleCreator'
export { notify } from './notifications'

/**
 * Process a WhatsApp submission end-to-end.
 * TODO: Implement when refactoring whatsapp/process.post.ts (target: < 100 lines in endpoint)
 */
export async function processWhatsAppSubmission(
  _submissionId: string,
): Promise<{ vehicleId: string; slug: string; imagesUploaded: number }> {
  throw new Error('Not yet implemented — use /api/whatsapp/process.post.ts directly')
}
