import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useGoogleDrive } from '../../app/composables/admin/useGoogleDrive'

// ─── Fetch mock helpers ───────────────────────────────────────────────────────

function makeResponse(data: unknown = { files: [] }, ok = true, status = 200) {
  return {
    ok,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(''),
  }
}

// ─── Connect helpers ──────────────────────────────────────────────────────────

function stubGoogleOAuth(token = 'test-token') {
  vi.stubGlobal('useRuntimeConfig', () => ({ public: { googleClientId: 'client-id' } }))
  vi.stubGlobal('google', {
    accounts: {
      oauth2: {
        initTokenClient: vi.fn().mockImplementation(
          ({ callback }: { callback: (r: { access_token?: string; error?: string }) => void }) => ({
            requestAccessToken: vi.fn(() => callback({ access_token: token })),
          }),
        ),
      },
    },
  })
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeResponse()))
}

async function makeConnected() {
  stubGoogleOAuth()
  const c = useGoogleDrive()
  await c.connect()
  return c
}

// ─── Vehicle fixture ──────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const vehicle: any = {
  id: 42,
  brand: 'Volvo',
  model: 'FH16',
  plate: '1234ABC',
  year: 2020,
  subcategory: undefined,
  type: undefined,
}

// ─── Initial state ────────────────────────────────────────────────────────────

describe('initial state', () => {
  it('connected starts as false', () => {
    const c = useGoogleDrive()
    expect(c.connected.value).toBe(false)
  })

  it('loading starts as false', () => {
    const c = useGoogleDrive()
    expect(c.loading.value).toBe(false)
  })

  it('error starts as null', () => {
    const c = useGoogleDrive()
    expect(c.error.value).toBeNull()
  })
})

// ─── connect — no clientId ────────────────────────────────────────────────────

describe('connect — no clientId', () => {
  beforeEach(() => {
    vi.stubGlobal('useRuntimeConfig', () => ({ public: {} }))
  })

  it('returns false when googleClientId is not configured', async () => {
    const c = useGoogleDrive()
    const result = await c.connect()
    expect(result).toBe(false)
  })

  it('sets error message when googleClientId is missing', async () => {
    const c = useGoogleDrive()
    await c.connect()
    expect(c.error.value).toBeTruthy()
  })

  it('does not change loading when returning early', async () => {
    const c = useGoogleDrive()
    await c.connect()
    expect(c.loading.value).toBe(false)
  })
})

// ─── connect — success ────────────────────────────────────────────────────────

describe('connect — success', () => {
  it('returns true when OAuth callback provides access_token', async () => {
    stubGoogleOAuth()
    const c = useGoogleDrive()
    const result = await c.connect()
    expect(result).toBe(true)
  })

  it('sets connected to true after successful OAuth', async () => {
    const c = await makeConnected()
    expect(c.connected.value).toBe(true)
  })

  it('sets loading to false after connect completes', async () => {
    const c = await makeConnected()
    expect(c.loading.value).toBe(false)
  })

  it('clears error before attempting connect', async () => {
    stubGoogleOAuth()
    const c = useGoogleDrive()
    // @ts-expect-error - testing internal state via readonly identity
    c.error.value = 'previous error'
    await c.connect()
    expect(c.error.value).toBeNull()
  })
})

// ─── connect — OAuth error callback ──────────────────────────────────────────

describe('connect — OAuth error', () => {
  function stubGoogleOAuthError(errorCode = 'access_denied') {
    vi.stubGlobal('useRuntimeConfig', () => ({ public: { googleClientId: 'client-id' } }))
    vi.stubGlobal('google', {
      accounts: {
        oauth2: {
          initTokenClient: vi.fn().mockImplementation(
            ({ callback }: { callback: (r: { error?: string }) => void }) => ({
              requestAccessToken: vi.fn(() => callback({ error: errorCode })),
            }),
          ),
        },
      },
    })
  }

  it('returns false when OAuth callback returns error', async () => {
    stubGoogleOAuthError()
    const c = useGoogleDrive()
    const result = await c.connect()
    expect(result).toBe(false)
  })

  it('sets error.value from callback error code', async () => {
    stubGoogleOAuthError('access_denied')
    const c = useGoogleDrive()
    await c.connect()
    expect(c.error.value).toBe('access_denied')
  })

  it('sets connected to false on OAuth error', async () => {
    stubGoogleOAuthError()
    const c = useGoogleDrive()
    await c.connect()
    expect(c.connected.value).toBe(false)
  })
})

// ─── connect — GIS load error ─────────────────────────────────────────────────

describe('connect — GIS load error', () => {
  it('returns false when script loading fails', async () => {
    vi.stubGlobal('useRuntimeConfig', () => ({ public: { googleClientId: 'client-id' } }))
    vi.stubGlobal('google', undefined) // force script loading

    const mockScript = {
      src: '',
      async: false,
      onload: null as (() => void) | null,
      onerror: null as (() => void) | null,
    }
    vi.stubGlobal('document', {
      createElement: vi.fn().mockReturnValue(mockScript),
      head: {
        appendChild: vi.fn().mockImplementation(() => {
          // Fire onerror synchronously
          mockScript.onerror?.()
        }),
      },
    })

    const c = useGoogleDrive()
    const result = await c.connect()
    expect(result).toBe(false)
  })

  it('sets error when GIS script fails to load', async () => {
    vi.stubGlobal('useRuntimeConfig', () => ({ public: { googleClientId: 'client-id' } }))
    vi.stubGlobal('google', undefined)

    const mockScript = {
      src: '',
      async: false,
      onload: null as (() => void) | null,
      onerror: null as (() => void) | null,
    }
    vi.stubGlobal('document', {
      createElement: vi.fn().mockReturnValue(mockScript),
      head: {
        appendChild: vi.fn().mockImplementation(() => {
          mockScript.onerror?.()
        }),
      },
    })

    const c = useGoogleDrive()
    await c.connect()
    expect(c.error.value).toBeTruthy()
  })
})

// ─── disconnect ───────────────────────────────────────────────────────────────

describe('disconnect', () => {
  it('sets connected to false after disconnect', async () => {
    const c = await makeConnected()
    expect(c.connected.value).toBe(true) // sanity check
    c.disconnect()
    expect(c.connected.value).toBe(false)
  })

  it('does not change loading on disconnect', async () => {
    const c = await makeConnected()
    c.disconnect()
    expect(c.loading.value).toBe(false)
  })
})

// ─── checkConnection ──────────────────────────────────────────────────────────

describe('checkConnection', () => {
  it('returns false immediately when no access token', async () => {
    const c = useGoogleDrive()
    const result = await c.checkConnection()
    expect(result).toBe(false)
  })

  it('returns true when driveApi call succeeds', async () => {
    const c = await makeConnected()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeResponse({ user: { displayName: 'Test' } })))
    const result = await c.checkConnection()
    expect(result).toBe(true)
  })

  it('returns false when token is expired (401)', async () => {
    const c = await makeConnected()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeResponse({}, false, 401)))
    const result = await c.checkConnection()
    expect(result).toBe(false)
  })

  it('sets connected to false when token is expired', async () => {
    const c = await makeConnected()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeResponse({}, false, 401)))
    await c.checkConnection()
    expect(c.connected.value).toBe(false)
  })

  it('returns false on unexpected error', async () => {
    const c = await makeConnected()
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))
    const result = await c.checkConnection()
    expect(result).toBe(false)
  })
})

// ─── getOrCreateFolder ────────────────────────────────────────────────────────

describe('getOrCreateFolder', () => {
  it('returns existing folder id from search results', async () => {
    const c = await makeConnected()
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(makeResponse({ files: [{ id: 'folder-abc' }] })),
    )
    const id = await c.getOrCreateFolder('TankIberica')
    expect(id).toBe('folder-abc')
  })

  it('creates folder when search returns empty', async () => {
    const c = await makeConnected()
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(makeResponse({ files: [] }))         // search: not found
      .mockResolvedValueOnce(makeResponse({ id: 'new-folder' }))  // create: success
    vi.stubGlobal('fetch', fetchMock)
    const id = await c.getOrCreateFolder('NewFolder')
    expect(id).toBe('new-folder')
  })

  it('calls fetch twice when folder needs to be created', async () => {
    const c = await makeConnected()
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(makeResponse({ files: [] }))
      .mockResolvedValueOnce(makeResponse({ id: 'created-id' }))
    vi.stubGlobal('fetch', fetchMock)
    await c.getOrCreateFolder('NewFolder')
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('returns cached id on second call without extra fetch', async () => {
    const c = await makeConnected()
    const fetchMock = vi
      .fn()
      .mockResolvedValue(makeResponse({ files: [{ id: 'cached-id' }] }))
    vi.stubGlobal('fetch', fetchMock)
    await c.getOrCreateFolder('TankIberica')         // first call
    await c.getOrCreateFolder('TankIberica')         // second call — cache hit
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('different parent produces different cache key', async () => {
    const c = await makeConnected()
    const fetchMock = vi
      .fn()
      .mockResolvedValue(makeResponse({ files: [{ id: 'some-folder' }] }))
    vi.stubGlobal('fetch', fetchMock)
    await c.getOrCreateFolder('Fotos', 'parent-a')
    await c.getOrCreateFolder('Fotos', 'parent-b')
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})

// ─── moveToHistorico ──────────────────────────────────────────────────────────

describe('moveToHistorico', () => {
  it('returns false when vehicle folder is not found', async () => {
    const c = await makeConnected()
    // All searches return empty files → getOrCreateFolder creates, final search not found
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(makeResponse({ files: [], id: 'folder-id' })),
    )
    const result = await c.moveToHistorico(vehicle)
    expect(result).toBe(false)
  })

  it('sets error when vehicle folder not found', async () => {
    const c = await makeConnected()
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(makeResponse({ files: [], id: 'folder-id' })),
    )
    await c.moveToHistorico(vehicle)
    expect(c.error.value).toBeTruthy()
  })

  it('returns true when folder is found and moved', async () => {
    const c = await makeConnected()
    const fetchMock = vi.fn()
      // getOrCreateFolder('TankIberica'): found
      .mockResolvedValueOnce(makeResponse({ files: [{ id: 'root-id' }] }))
      // getOrCreateFolder('Historico', root): found
      .mockResolvedValueOnce(makeResponse({ files: [{ id: 'hist-id' }] }))
      // getOrCreateFolder('Vehiculos', root): found
      .mockResolvedValueOnce(makeResponse({ files: [{ id: 'vehi-id' }] }))
      // final driveApi search for vehicle folder: found
      .mockResolvedValueOnce(makeResponse({ files: [{ id: 'veh-folder-id' }] }))
      // PATCH move
      .mockResolvedValueOnce(makeResponse({}))
    vi.stubGlobal('fetch', fetchMock)
    const result = await c.moveToHistorico(vehicle)
    expect(result).toBe(true)
  })

  it('sets loading to false after success', async () => {
    const c = await makeConnected()
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(makeResponse({ files: [{ id: 'root-id' }] }))
      .mockResolvedValueOnce(makeResponse({ files: [{ id: 'hist-id' }] }))
      .mockResolvedValueOnce(makeResponse({ files: [{ id: 'vehi-id' }] }))
      .mockResolvedValueOnce(makeResponse({ files: [{ id: 'veh-folder-id' }] }))
      .mockResolvedValueOnce(makeResponse({}))
    vi.stubGlobal('fetch', fetchMock)
    await c.moveToHistorico(vehicle)
    expect(c.loading.value).toBe(false)
  })

  it('sets loading to false after failure', async () => {
    const c = await makeConnected()
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(makeResponse({ files: [], id: 'folder-id' })),
    )
    await c.moveToHistorico(vehicle)
    expect(c.loading.value).toBe(false)
  })
})

// ─── openFolderById ───────────────────────────────────────────────────────────

describe('openFolderById', () => {
  it('calls globalThis.open with the drive folder URL', () => {
    const mockOpen = vi.fn()
    vi.stubGlobal('open', mockOpen)
    const c = useGoogleDrive()
    c.openFolderById('folder-xyz-123')
    expect(mockOpen).toHaveBeenCalledWith(
      'https://drive.google.com/drive/folders/folder-xyz-123',
      '_blank',
    )
  })
})

// ─── openVehicleFolder ────────────────────────────────────────────────────────

describe('openVehicleFolder', () => {
  it('sets loading to false after opening folder', async () => {
    const c = await makeConnected()
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(makeResponse({ files: [{ id: 'root-id' }] }))
      .mockResolvedValueOnce(makeResponse({ files: [{ id: 'section-id' }] }))
      .mockResolvedValueOnce(makeResponse({ files: [{ id: 'vehicle-id' }] }))
      .mockResolvedValueOnce(makeResponse({ files: [{ id: 'fotos-id' }] }))
      .mockResolvedValueOnce(makeResponse({ files: [{ id: 'docs-id' }] }))
      .mockResolvedValueOnce(makeResponse({ files: [{ id: 'facturas-id' }] }))
    vi.stubGlobal('fetch', fetchMock)
    vi.stubGlobal('open', vi.fn())
    await c.openVehicleFolder(vehicle)
    expect(c.loading.value).toBe(false)
  })

  it('sets error when fetch fails', async () => {
    const c = await makeConnected()
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))
    await c.openVehicleFolder(vehicle)
    expect(c.error.value).toBeTruthy()
    expect(c.loading.value).toBe(false)
  })
})

// ─── openDocumentsFolder ─────────────────────────────────────────────────────

describe('openDocumentsFolder', () => {
  it('opens docs folder and sets loading to false', async () => {
    const c = await makeConnected()
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(makeResponse({ files: [{ id: 'root-id' }] }))
      .mockResolvedValueOnce(makeResponse({ files: [{ id: 'section-id' }] }))
      .mockResolvedValueOnce(makeResponse({ files: [{ id: 'vehicle-id' }] }))
      .mockResolvedValueOnce(makeResponse({ files: [{ id: 'fotos-id' }] }))
      .mockResolvedValueOnce(makeResponse({ files: [{ id: 'docs-id' }] }))
      .mockResolvedValueOnce(makeResponse({ files: [{ id: 'facturas-id' }] }))
    vi.stubGlobal('fetch', fetchMock)
    vi.stubGlobal('open', vi.fn())
    await c.openDocumentsFolder(vehicle)
    expect(c.loading.value).toBe(false)
  })

  it('sets error when fetch fails', async () => {
    const c = await makeConnected()
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))
    await c.openDocumentsFolder(vehicle)
    expect(c.error.value).toBeTruthy()
  })
})

// ─── openInvoicesFolder ──────────────────────────────────────────────────────

describe('openInvoicesFolder', () => {
  it('opens invoices folder and sets loading to false', async () => {
    const c = await makeConnected()
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(makeResponse({ files: [{ id: 'root-id' }] }))
      .mockResolvedValueOnce(makeResponse({ files: [{ id: 'section-id' }] }))
      .mockResolvedValueOnce(makeResponse({ files: [{ id: 'vehicle-id' }] }))
      .mockResolvedValueOnce(makeResponse({ files: [{ id: 'fotos-id' }] }))
      .mockResolvedValueOnce(makeResponse({ files: [{ id: 'docs-id' }] }))
      .mockResolvedValueOnce(makeResponse({ files: [{ id: 'facturas-id' }] }))
    vi.stubGlobal('fetch', fetchMock)
    vi.stubGlobal('open', vi.fn())
    await c.openInvoicesFolder(vehicle)
    expect(c.loading.value).toBe(false)
  })
})

// ─── getVehicleFolders ───────────────────────────────────────────────────────

describe('getVehicleFolders', () => {
  it('creates full folder structure and returns all IDs', async () => {
    const c = await makeConnected()
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(makeResponse({ files: [{ id: 'root-id' }] }))     // TankIberica
      .mockResolvedValueOnce(makeResponse({ files: [{ id: 'section-id' }] }))   // Vehiculos
      .mockResolvedValueOnce(makeResponse({ files: [{ id: 'vehicle-id' }] }))   // V42_Volvo...
      .mockResolvedValueOnce(makeResponse({ files: [{ id: 'fotos-id' }] }))     // Fotos
      .mockResolvedValueOnce(makeResponse({ files: [{ id: 'docs-id' }] }))      // Documentos
      .mockResolvedValueOnce(makeResponse({ files: [{ id: 'facturas-id' }] }))  // Facturas
    vi.stubGlobal('fetch', fetchMock)
    const folders = await c.getVehicleFolders(vehicle)
    expect(folders.root).toBe('root-id')
    expect(folders.fotos).toBe('fotos-id')
    expect(folders.documentos).toBe('docs-id')
    expect(folders.facturas).toBe('facturas-id')
  })

  it('includes subcategory and type folders when provided', async () => {
    const c = await makeConnected()
    const fetchMock = vi.fn().mockResolvedValue(makeResponse({ files: [{ id: 'f-id' }] }))
    vi.stubGlobal('fetch', fetchMock)
    await c.getVehicleFolders({ ...vehicle, subcategory: 'Camiones', type: 'Tractora' })
    // root + section + subcategory + type + vehicle + fotos + docs + facturas = 8 calls
    expect(fetchMock).toHaveBeenCalledTimes(8)
  })
})

// ─── driveApi — error handling ───────────────────────────────────────────────

describe('driveApi error handling', () => {
  it('throws on non-ok response with body text', async () => {
    const c = await makeConnected()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      text: () => Promise.resolve('Forbidden'),
    }))
    await expect(c.checkConnection()).resolves.toBe(false)
  })
})

// ─── disconnect clears folder cache ──────────────────────────────────────────

describe('disconnect — folder cache', () => {
  it('clears cached folder IDs after disconnect', async () => {
    const c = await makeConnected()
    const fetchMock = vi.fn().mockResolvedValue(makeResponse({ files: [{ id: 'cached-id' }] }))
    vi.stubGlobal('fetch', fetchMock)
    await c.getOrCreateFolder('TestFolder')
    c.disconnect()
    // After disconnect + reconnect, should re-fetch
    await c.connect()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeResponse({ files: [{ id: 'new-id' }] })))
    const id = await c.getOrCreateFolder('TestFolder')
    expect(id).toBe('new-id')
  })
})
