/**
 * Google Drive Composable
 * Handles OAuth flow, folder management, and file uploads to Google Drive
 * Used for private documents (invoices, contracts, ITV, etc.)
 *
 * Folder structure:
 * TankIberica/
 * ├── Vehiculos/[Subcategoria]/[Tipo]/V42_Renault_2024_1234ABC/{Fotos,Documentos,Facturas}
 * ├── Intermediacion/[Subcategoria]/[Tipo]/P3_Iveco_2023_5678DEF/{Fotos,Documentos,Facturas}
 * ├── Historico/  (archived vehicles and intermediation, mixed by ID prefix)
 * └── Tickets/[2025]/Ingresos/Facturas + Gastos/Recibos
 *
 * Requires GOOGLE_CLIENT_ID in .env
 */

import {
  generateVehicleFolderName,
  generateInterFolderName,
  generateDocFileName,
  getFileExtension,
} from '~/utils/fileNaming'
import type { FileNamingData } from '~/utils/fileNaming'

// Google Identity Services types (loaded dynamically)
declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient(config: {
            client_id: string
            scope: string
            callback: (response: { access_token?: string; error?: string }) => void
          }): { requestAccessToken(): void }
        }
      }
    }
  }
}

export type DriveSection = 'Vehiculos' | 'Intermediacion'

interface DriveUploadResult {
  id: string
  name: string
  url: string
}

const DRIVE_API = 'https://www.googleapis.com/drive/v3'
const DRIVE_UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3'
const SCOPES = 'https://www.googleapis.com/auth/drive'

export function useGoogleDrive() {
  const config = useRuntimeConfig()
  const clientId = config.public.googleClientId as string

  const connected = ref(false)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const accessToken = ref<string | null>(null)

  // Folder ID cache to avoid redundant API calls within a session
  const folderCache = new Map<string, string>()

  // -------------------------------------------------------------------------
  // Google Identity Services — OAuth
  // -------------------------------------------------------------------------

  async function loadGis(): Promise<void> {
    if (window.google?.accounts?.oauth2) return

    return new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.onload = () => resolve()
      script.onerror = () => reject(new Error('Error cargando Google Identity Services'))
      document.head.appendChild(script)
    })
  }

  async function connect(): Promise<boolean> {
    if (!clientId) {
      error.value = 'GOOGLE_CLIENT_ID no configurado en .env'
      return false
    }

    error.value = null
    loading.value = true

    try {
      await loadGis()

      return new Promise((resolve) => {
        const tokenClient = window.google!.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: SCOPES,
          callback: (response) => {
            loading.value = false
            if (response.access_token) {
              accessToken.value = response.access_token
              connected.value = true
              resolve(true)
            } else {
              error.value = response.error || 'Error de autenticación con Google'
              resolve(false)
            }
          },
        })
        tokenClient.requestAccessToken()
      })
    } catch (err: unknown) {
      loading.value = false
      error.value = err instanceof Error ? err.message : 'Error conectando con Google Drive'
      return false
    }
  }

  function disconnect() {
    accessToken.value = null
    connected.value = false
    folderCache.clear()
  }

  // -------------------------------------------------------------------------
  // Drive API helpers
  // -------------------------------------------------------------------------

  async function driveApi<T = Record<string, unknown>>(
    path: string,
    options: RequestInit = {},
  ): Promise<T> {
    if (!accessToken.value) throw new Error('No conectado a Google Drive')

    const url = path.startsWith('http') ? path : `${DRIVE_API}/${path}`
    const resp = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${accessToken.value}`,
        ...(options.headers || {}),
      },
    })

    if (resp.status === 401) {
      connected.value = false
      accessToken.value = null
      throw new Error('Sesión de Google expirada. Reconecta.')
    }

    if (!resp.ok) {
      const body = await resp.text()
      throw new Error(`Drive API error ${resp.status}: ${body}`)
    }

    return resp.json() as Promise<T>
  }

  /**
   * Check if current token is still valid
   */
  async function checkConnection(): Promise<boolean> {
    if (!accessToken.value) return false
    try {
      await driveApi('about?fields=user')
      return true
    } catch {
      connected.value = false
      accessToken.value = null
      return false
    }
  }

  // -------------------------------------------------------------------------
  // Folder management
  // -------------------------------------------------------------------------

  /**
   * Get or create a folder by name under a parent folder
   * Results are cached per session to minimize API calls
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
      folderCache.set(cacheKey, search.files[0].id)
      return search.files[0].id
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
   * Build the full folder path for a vehicle and return all subfolder IDs
   */
  async function getVehicleFolders(vehicle: FileNamingData, section: DriveSection = 'Vehiculos') {
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

  // -------------------------------------------------------------------------
  // File upload
  // -------------------------------------------------------------------------

  /**
   * Upload a file to a specific Drive folder
   * Automatically sets the file as publicly viewable (read-only)
   */
  async function uploadFile(
    file: File,
    parentFolderId: string,
    fileName?: string,
  ): Promise<DriveUploadResult> {
    if (!accessToken.value) throw new Error('No conectado a Google Drive')

    const metadata = {
      name: fileName || file.name,
      parents: [parentFolderId],
    }

    const form = new FormData()
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }))
    form.append('file', file)

    const result = await fetch(
      `${DRIVE_UPLOAD_API}/files?uploadType=multipart&fields=id,name,webViewLink`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken.value}` },
        body: form,
      },
    ).then((r) => r.json())

    // Make publicly viewable
    await driveApi(`files/${result.id}/permissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'reader', type: 'anyone' }),
    })

    return {
      id: result.id,
      name: result.name,
      url: result.webViewLink || `https://drive.google.com/file/d/${result.id}/view`,
    }
  }

  // -------------------------------------------------------------------------
  // High-level upload functions
  // -------------------------------------------------------------------------

  /**
   * Upload a document (ITV, ficha técnica, contrato, etc.) to the vehicle's Documentos/ folder
   * Auto-generates filename: ITV_Renault_2024_1234ABC_2025-02-09.pdf
   */
  async function uploadDocument(
    file: File,
    vehicle: FileNamingData,
    docType: string,
    section: DriveSection = 'Vehiculos',
  ): Promise<DriveUploadResult> {
    loading.value = true
    error.value = null
    try {
      const folders = await getVehicleFolders(vehicle, section)
      const ext = getFileExtension(file.name)
      const fileName = generateDocFileName(docType, vehicle, undefined, ext)
      return await uploadFile(file, folders.documentos, fileName)
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error subiendo documento'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Upload an invoice to the vehicle's Facturas/ folder
   * Also copies it to Tickets/[Year]/Ingresos|Gastos/Facturas|Recibos/
   * Auto-generates filename: Factura-Mantenimiento_Renault_2024_1234ABC_2025-02-09.pdf
   */
  async function uploadInvoice(
    file: File,
    vehicle: FileNamingData,
    invoiceType: string,
    date?: string,
    section: DriveSection = 'Vehiculos',
  ): Promise<DriveUploadResult> {
    loading.value = true
    error.value = null
    try {
      const folders = await getVehicleFolders(vehicle, section)
      const ext = getFileExtension(file.name)
      const fileName = generateDocFileName(`Factura-${invoiceType}`, vehicle, date, ext)

      // Upload to vehicle's Facturas/ folder
      const result = await uploadFile(file, folders.facturas, fileName)

      // Copy to Tickets/[Year]/...
      const year = date ? new Date(date).getFullYear() : new Date().getFullYear()
      const ticketsFolder = await getOrCreateFolder('Tickets', folders.root)
      const yearFolder = await getOrCreateFolder(String(year), ticketsFolder)

      const isIncome = ['Venta', 'Renta'].includes(invoiceType)
      const typeFolder = await getOrCreateFolder(isIncome ? 'Ingresos' : 'Gastos', yearFolder)
      const subFolder = await getOrCreateFolder(isIncome ? 'Facturas' : 'Recibos', typeFolder)

      // Create a copy in the Tickets folder
      await driveApi(`files/${result.id}/copy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: fileName, parents: [subFolder] }),
      })

      return result
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error subiendo factura'
      throw err
    } finally {
      loading.value = false
    }
  }

  // -------------------------------------------------------------------------
  // Move to Historico
  // -------------------------------------------------------------------------

  /**
   * Move a vehicle's entire folder to Historico/
   * Traverses the expected path: Section > Subcategory > Type > FolderName
   */
  async function moveToHistorico(
    vehicle: FileNamingData,
    section: DriveSection = 'Vehiculos',
  ): Promise<boolean> {
    loading.value = true
    error.value = null
    try {
      const root = await getOrCreateFolder('TankIberica')
      const historicoFolder = await getOrCreateFolder('Historico', root)
      let parent = await getOrCreateFolder(section, root)

      // Traverse subcategory/type path to find the vehicle folder
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

      const q = `name='${folderName}' and '${parent}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`
      const search = await driveApi<{ files: { id: string }[] }>(
        `files?q=${encodeURIComponent(q)}&fields=files(id)`,
      )

      if (!search.files?.length) {
        error.value = `Carpeta '${folderName}' no encontrada en Drive`
        return false
      }

      const folderId = search.files[0].id

      // Move: add Historico as parent, remove current parent
      await fetch(
        `${DRIVE_API}/files/${folderId}?addParents=${historicoFolder}&removeParents=${parent}`,
        {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${accessToken.value}` },
        },
      )

      // Clear cache since folder structure changed
      folderCache.clear()

      return true
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error moviendo a Histórico'
      return false
    } finally {
      loading.value = false
    }
  }

  // -------------------------------------------------------------------------
  // Navigation — open folders in new tab
  // -------------------------------------------------------------------------

  function openFolderById(folderId: string) {
    window.open(`https://drive.google.com/drive/folders/${folderId}`, '_blank')
  }

  async function openVehicleFolder(vehicle: FileNamingData, section: DriveSection = 'Vehiculos') {
    loading.value = true
    try {
      const folders = await getVehicleFolders(vehicle, section)
      openFolderById(folders.vehicle)
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error abriendo carpeta'
    } finally {
      loading.value = false
    }
  }

  async function openDocumentsFolder(vehicle: FileNamingData, section: DriveSection = 'Vehiculos') {
    loading.value = true
    try {
      const folders = await getVehicleFolders(vehicle, section)
      openFolderById(folders.documentos)
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error abriendo carpeta'
    } finally {
      loading.value = false
    }
  }

  async function openInvoicesFolder(vehicle: FileNamingData, section: DriveSection = 'Vehiculos') {
    loading.value = true
    try {
      const folders = await getVehicleFolders(vehicle, section)
      openFolderById(folders.facturas)
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error abriendo carpeta'
    } finally {
      loading.value = false
    }
  }

  return {
    // State
    connected: readonly(connected),
    loading: readonly(loading),
    error: readonly(error),

    // Auth
    connect,
    disconnect,
    checkConnection,

    // Folders
    getOrCreateFolder,
    getVehicleFolders,

    // Upload
    uploadFile,
    uploadDocument,
    uploadInvoice,

    // Move
    moveToHistorico,

    // Navigation
    openFolderById,
    openVehicleFolder,
    openDocumentsFolder,
    openInvoicesFolder,
  }
}
