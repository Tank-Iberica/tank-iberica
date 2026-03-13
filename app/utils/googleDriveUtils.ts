/**
 * Google Drive utilities: constants, types, module-level helpers.
 * Extracted from useGoogleDrive for size reduction (#121).
 */

// Google Identity Services types (loaded dynamically)
declare global {
  var google:
    | {
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
    | undefined
}

export type DriveSection = 'Vehiculos' | 'Intermediacion'

export interface DriveUploadResult {
  id: string
  name: string
  url: string
}

export const DRIVE_API = 'https://www.googleapis.com/drive/v3'
export const DRIVE_UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3'
export const SCOPES = 'https://www.googleapis.com/auth/drive'

export async function loadGis(): Promise<void> {
  if (globalThis.google?.accounts?.oauth2) return

  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Error cargando Google Identity Services'))
    document.head.appendChild(script)
  })
}

export function openFolderById(folderId: string): void {
  globalThis.open(`https://drive.google.com/drive/folders/${folderId}`, '_blank')
}
