import { describe, it, expect } from 'vitest'
import {
  slugify,
  generateVehiclePublicId,
  generateNewsPublicId,
  generateCloudinaryContext,
  generateVehicleAltText,
  generateVehicleFolderName,
  generateInterFolderName,
  generateDocFileName,
  getFileExtension,
} from '../../app/utils/fileNaming'

describe('slugify', () => {
  it('converts to lowercase and replaces spaces with hyphens', () => {
    expect(slugify('Volvo FH16')).toBe('volvo-fh16')
  })

  it('joins multiple parts with hyphens', () => {
    expect(slugify('Volvo', 'FH16', 2024)).toBe('volvo-fh16-2024')
  })

  it('removes accents', () => {
    expect(slugify('Camión Grúa')).toBe('camion-grua')
  })

  it('removes special characters', () => {
    expect(slugify('Test & Value / Other')).toBe('test-value-other')
  })

  it('strips leading and trailing hyphens', () => {
    expect(slugify('-hello-')).toBe('hello')
  })

  it('filters null and empty parts', () => {
    expect(slugify('Volvo', null, '', 'FH16')).toBe('volvo-fh16')
  })

  it('handles single number', () => {
    expect(slugify(2024)).toBe('2024')
  })
})

describe('generateVehiclePublicId', () => {
  it('builds full path with all optional fields', () => {
    const vehicle = { id: 42, brand: 'Renault', year: 2024, subcategory: 'Cisterna', type: 'Alimentaria' }
    expect(generateVehiclePublicId(vehicle)).toBe('tracciona/vehicles/cisterna-alimentaria-renault-2024-v42')
  })

  it('includes image index > 1', () => {
    const vehicle = { id: 42, brand: 'Volvo' }
    expect(generateVehiclePublicId(vehicle, 3)).toBe('tracciona/vehicles/volvo-v42-3')
  })

  it('omits image index when 1 (default)', () => {
    const vehicle = { id: 1, brand: 'Iveco' }
    expect(generateVehiclePublicId(vehicle, 1)).toBe('tracciona/vehicles/iveco-v1')
  })

  it('works without optional fields', () => {
    const vehicle = { id: 7, brand: 'MAN' }
    expect(generateVehiclePublicId(vehicle)).toBe('tracciona/vehicles/man-v7')
  })
})

describe('generateNewsPublicId', () => {
  it('slugifies the slug and prepends news path', () => {
    expect(generateNewsPublicId('Normativa Euro 7')).toBe('tracciona/news/normativa-euro-7')
  })
})

describe('generateCloudinaryContext', () => {
  it('includes brand always', () => {
    const ctx = generateCloudinaryContext({ id: 1, brand: 'Volvo' })
    expect(ctx).toContain('brand=Volvo')
  })

  it('includes optional fields when present', () => {
    const ctx = generateCloudinaryContext({
      id: 1, brand: 'Renault', year: 2022, subcategory: 'Cisterna', type: 'Alimentaria', plate: '1234ABC',
    })
    expect(ctx).toBe('brand=Renault|year=2022|subcategory=Cisterna|type=Alimentaria|plate=1234ABC')
  })

  it('omits undefined optional fields', () => {
    const ctx = generateCloudinaryContext({ id: 1, brand: 'MAN' })
    expect(ctx).toBe('brand=MAN')
  })
})

describe('generateVehicleAltText', () => {
  it('builds alt text with all fields', () => {
    const vehicle = { id: 1, brand: 'Renault', year: 2024, subcategory: 'Cisterna', type: 'Alimentaria' }
    expect(generateVehicleAltText(vehicle, 1)).toBe('Cisterna Alimentaria Renault 2024 - Foto 1')
  })

  it('uses default image index 1', () => {
    const vehicle = { id: 1, brand: 'Volvo' }
    expect(generateVehicleAltText(vehicle)).toBe('Volvo - Foto 1')
  })
})

describe('generateVehicleFolderName', () => {
  it('generates folder name with all fields', () => {
    const vehicle = { id: 42, brand: 'Renault', year: 2024, plate: '1234ABC' }
    expect(generateVehicleFolderName(vehicle)).toBe('V42_Renault_2024_1234ABC')
  })

  it('omits year and plate when absent', () => {
    expect(generateVehicleFolderName({ id: 1, brand: 'MAN' })).toBe('V1_MAN')
  })
})

describe('generateInterFolderName', () => {
  it('uses P prefix instead of V', () => {
    const vehicle = { id: 3, brand: 'Iveco', year: 2023, plate: '5678DEF' }
    expect(generateInterFolderName(vehicle)).toBe('P3_Iveco_2023_5678DEF')
  })
})

describe('generateDocFileName', () => {
  it('generates filename with all fields and fixed date', () => {
    const vehicle = { id: 1, brand: 'Renault', year: 2024, plate: '1234ABC' }
    expect(generateDocFileName('ITV', vehicle, '2025-02-09')).toBe('ITV_Renault_2024_1234ABC_2025-02-09.pdf')
  })

  it('uses custom extension', () => {
    const vehicle = { id: 1, brand: 'Volvo' }
    expect(generateDocFileName('Contrato', vehicle, '2025-01-01', 'docx')).toBe('Contrato_Volvo_2025-01-01.docx')
  })

  it('defaults to pdf extension', () => {
    const vehicle = { id: 1, brand: 'MAN' }
    const result = generateDocFileName('Permiso', vehicle, '2025-03-01')
    expect(result).toMatch(/\.pdf$/)
  })
})

describe('getFileExtension', () => {
  it('extracts lowercase extension', () => {
    expect(getFileExtension('photo.JPG')).toBe('jpg')
  })

  it('returns whole name when no dot present', () => {
    // split('.').pop() on a name without dot returns the name itself
    expect(getFileExtension('noextension')).toBe('noextension')
  })

  it('handles dotfile', () => {
    expect(getFileExtension('.env')).toBe('env')
  })
})
