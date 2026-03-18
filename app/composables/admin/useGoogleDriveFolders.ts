/**
 * useGoogleDriveFolders
 * Folder management for Google Drive: get-or-create with session cache.
 * Extracted from useGoogleDrive for size reduction (#121).
 */
import { generateVehicleFolderName, generateInterFolderName } from '~/utils/fileNaming'
import type { FileNamingData } from '~/utils/fileNaming'
import type { DriveSection } from '~/utils/googleDriveUtils'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DriveApiFn = <T = Record<string, any>>(path: string, options?: RequestInit) => Promise<T>

/**
 * Composable for google drive folders.
 *
 * @param driveApi
 * @param folderCache
 * @param string>
 */
export function useGoogleDriveFolders(driveApi: DriveApiFn, folderCache: Map<string, string>) {
  /**
   * Get or create a folder by name under a parent folder.
   * Results are cached per session to minimize API calls.
   */
  async function getOrCreateFolder(name: string, parentId?: string): Promise<string> {
    const cacheKey = `${parentId || 'root'}/${name}`
    if (folderCache.has(cacheKey)) return folderCache.get(cacheKey)!

    let q = `name='${name}' and mimeType='application/vnd.google-apps.folder' and trashed=false`
    if (parentId) q += ` and '${parentId}' in parents`

    const search = await driveApi<{ files: { id: string }[] }>(
      `files?q=${encodeURIComponent(q)}&fields=files(id,name)`,
    )

    if (search.files?.length) {
      folderCache.set(cacheKey, search.files[0]!.id)
      return search.files[0]!.id
    }

    // Create folder
    const metadata: Record<string, unknown> = {
      name,
      mimeType: 'application/vnd.google-apps.folder',
    }
    if (parentId) metadata.parents = [parentId]

    const created = await driveApi<{ id: string }>('files', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metadata),
    })

    folderCache.set(cacheKey, created.id)
    return created.id
  }

  /**
   * Build the full folder path for a vehicle and return all subfolder IDs.
   */
  async function getVehicleFolders(
    vehicle: FileNamingData,
    section: DriveSection = 'Vehiculos',
  ): Promise<{
    root: string
    section: string
    vehicle: string
    fotos: string
    documentos: string
    facturas: string
  }> {
    const root = await getOrCreateFolder('TankIberica')
    let parent = await getOrCreateFolder(section, root)

    if (vehicle.subcategory) {
      parent = await getOrCreateFolder(vehicle.subcategory, parent)
    }
    if (vehicle.type) {
      parent = await getOrCreateFolder(vehicle.type, parent)
    }

    const folderName =
      section === 'Vehiculos'
        ? generateVehicleFolderName(vehicle)
        : generateInterFolderName(vehicle)
    const vehicleId = await getOrCreateFolder(folderName, parent)

    const fotos = await getOrCreateFolder('Fotos', vehicleId)
    const documentos = await getOrCreateFolder('Documentos', vehicleId)
    const facturas = await getOrCreateFolder('Facturas', vehicleId)

    return { root, section: parent, vehicle: vehicleId, fotos, documentos, facturas }
  }

  return { getOrCreateFolder, getVehicleFolders }
}
