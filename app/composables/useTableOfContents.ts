/**
 * useTableOfContents — auto-generate a Table of Contents from article HTML
 *
 * Scans an article container for h2/h3/h4 elements, assigns IDs if missing,
 * and provides scroll-to-heading navigation with active heading tracking.
 *
 * Usage:
 *   const { tocItems, activeId, buildToc, scrollToHeading } = useTableOfContents()
 *   onMounted(() => buildToc(articleRef.value))
 */

export interface TocItem {
  id: string
  text: string
  level: 2 | 3 | 4
}

export interface UseTableOfContents {
  tocItems: Ref<TocItem[]>
  activeId: Ref<string>
  buildToc: (container: HTMLElement | null) => void
  scrollToHeading: (id: string) => void
}

export function useTableOfContents(): UseTableOfContents {
  const tocItems = ref<TocItem[]>([])
  const activeId = ref('')

  let observer: IntersectionObserver | null = null

  const buildToc = (container: HTMLElement | null): void => {
    if (!container) return

    const headings = container.querySelectorAll<HTMLElement>('h2, h3, h4')
    const items: TocItem[] = []

    headings.forEach((heading, index) => {
      // Assign an id if none exists
      if (!heading.id) {
        const slug = (heading.textContent ?? '')
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/(^-|-$)/g, '')
        heading.id = slug || `heading-${index}`
      }

      items.push({
        id: heading.id,
        text: heading.textContent?.trim() ?? '',
        level: parseInt(heading.tagName[1], 10) as 2 | 3 | 4,
      })
    })

    tocItems.value = items

    // Track active heading with IntersectionObserver
    observer?.disconnect()
    if (headings.length === 0) return

    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            activeId.value = entry.target.id
            break
          }
        }
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0 },
    )

    headings.forEach((h) => observer!.observe(h))
  }

  const scrollToHeading = (id: string): void => {
    const el = document.getElementById(id)
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    activeId.value = id
  }

  onUnmounted(() => {
    observer?.disconnect()
  })

  return { tocItems, activeId, buildToc, scrollToHeading }
}
