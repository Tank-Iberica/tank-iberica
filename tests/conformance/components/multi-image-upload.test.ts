import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = resolve(__dirname, '../../..')
const SRC = readFileSync(
  resolve(ROOT, 'app/components/dashboard/DashboardPhotoUpload.vue'),
  'utf-8',
)

describe('Multi-image upload drag & drop + reorder (N14)', () => {
  describe('File upload', () => {
    it('accepts jpeg, png, webp', () => {
      expect(SRC).toContain("'image/jpeg'")
      expect(SRC).toContain("'image/png'")
      expect(SRC).toContain("'image/webp'")
    })

    it('has max file size (10MB)', () => {
      expect(SRC).toContain('MAX_SIZE')
      expect(SRC).toContain('10 * 1024 * 1024')
    })

    it('validates file type', () => {
      expect(SRC).toContain('validateFile')
      expect(SRC).toContain('ACCEPTED_TYPES')
    })

    it('has maxPhotos prop (default 20)', () => {
      expect(SRC).toContain('maxPhotos')
      expect(SRC).toContain('maxPhotos: 20')
    })

    it('checks canAddMore before uploading', () => {
      expect(SRC).toContain('canAddMore')
      expect(SRC).toContain('props.modelValue.length < props.maxPhotos')
    })
  })

  describe('Drop zone', () => {
    it('handles drag over state', () => {
      expect(SRC).toContain('dragOver')
    })

    it('handles onDrop event', () => {
      expect(SRC).toContain('function onDrop')
      expect(SRC).toContain('e.dataTransfer?.files')
    })

    it('processes files from drop event', () => {
      expect(SRC).toContain('handleFiles(e.dataTransfer.files)')
    })

    it('handles file input change', () => {
      expect(SRC).toContain('function onFileInput')
      expect(SRC).toContain('target.files')
    })

    it('resets input after selection', () => {
      expect(SRC).toContain("target.value = ''")
    })
  })

  describe('Drag & drop reorder', () => {
    it('tracks drag source index', () => {
      expect(SRC).toContain('dragSrcIndex')
    })

    it('tracks drag over index', () => {
      expect(SRC).toContain('dragOverIndex')
    })

    it('has onDragStart function', () => {
      expect(SRC).toContain('function onDragStart')
    })

    it('has onDragOver function', () => {
      expect(SRC).toContain('function onDragOver')
    })

    it('has onDropPhoto function', () => {
      expect(SRC).toContain('function onDropPhoto')
    })

    it('has onDragEnd cleanup', () => {
      expect(SRC).toContain('function onDragEnd')
    })

    it('movePhoto reorders the array', () => {
      expect(SRC).toContain('function movePhoto')
      expect(SRC).toContain('photos.splice(fromIndex, 1)')
      expect(SRC).toContain('photos.splice(toIndex, 0, moved!)')
    })

    it('prevents reorder if same index', () => {
      expect(SRC).toContain('dragSrcIndex.value !== index')
    })
  })

  describe('Photo removal', () => {
    it('has removePhoto function', () => {
      expect(SRC).toContain('function removePhoto')
    })

    it('filters out photo by id', () => {
      expect(SRC).toContain('props.modelValue.filter((p) => p.id !== id)')
    })
  })

  describe('Cloudinary upload', () => {
    it('uses useCloudinaryUpload composable', () => {
      expect(SRC).toContain('useCloudinaryUpload')
    })

    it('tracks uploading state', () => {
      expect(SRC).toContain('uploading')
    })

    it('tracks upload progress', () => {
      expect(SRC).toContain('progress')
    })

    it('creates UploadedPhoto with url, publicId, dimensions', () => {
      expect(SRC).toContain('url: result.secure_url')
      expect(SRC).toContain('publicId: result.public_id')
      expect(SRC).toContain('width: result.width')
      expect(SRC).toContain('height: result.height')
    })
  })

  describe('Reorder logic (unit)', () => {
    function movePhoto(photos: string[], from: number, to: number): string[] {
      if (to < 0 || to >= photos.length) return photos
      const arr = [...photos]
      const [moved] = arr.splice(from, 1)
      arr.splice(to, 0, moved!)
      return arr
    }

    it('moves photo forward', () => {
      expect(movePhoto(['a', 'b', 'c'], 0, 2)).toEqual(['b', 'c', 'a'])
    })

    it('moves photo backward', () => {
      expect(movePhoto(['a', 'b', 'c'], 2, 0)).toEqual(['c', 'a', 'b'])
    })

    it('no-op for invalid index', () => {
      expect(movePhoto(['a', 'b'], 0, -1)).toEqual(['a', 'b'])
    })

    it('no-op for out-of-bounds', () => {
      expect(movePhoto(['a', 'b'], 0, 5)).toEqual(['a', 'b'])
    })
  })
})
