/**
 * FAQ Page Schema builder — #166
 *
 * Generates JSON-LD FAQPage structured data for landing pages.
 * Questions and answers are auto-generated from landing title + vehicle count.
 * Pure function: no Nuxt auto-imports, fully testable.
 *
 * Schema.org spec: https://schema.org/FAQPage
 * Google docs: https://developers.google.com/search/docs/appearance/structured-data/faqpage
 */

export interface FaqItem {
  question: string
  answer: string
}

export interface FaqPageInput {
  /** Human-readable landing title, e.g. "Cisternas de aluminio en Madrid" */
  title: string
  /** Current vehicle count from active_landings.vehicle_count */
  count: number
  /** BCP 47 locale string — 'es' | 'en'. Defaults to ES for unknown locales. */
  locale: string
}

function getEsQuestions(title: string, count: number): FaqItem[] {
  const countText = `${count} anuncio${count === 1 ? '' : 's'}`
  return [
    {
      question: `¿Cuántas ${title} están en venta?`,
      answer: `En Tracciona hay ${countText} de ${title} disponibles ahora mismo. Cada anuncio incluye fotos, precio y especificaciones técnicas del vehículo.`,
    },
    {
      question: `¿Cómo comprar ${title}?`,
      answer: `Para comprar ${title} en Tracciona: filtra por precio, año o características; contacta directamente con el vendedor desde la ficha del vehículo; y solicita una visita y revisión técnica antes de firmar.`,
    },
    {
      question: `¿Qué documentación es necesaria para comprar un vehículo industrial?`,
      answer: `Necesitarás permiso de circulación, ficha técnica en vigor, ITV vigente y póliza de seguro. Tracciona ofrece un generador de contratos de compraventa incluido en la plataforma.`,
    },
    {
      question: `¿Es posible negociar el precio?`,
      answer: `Sí. La mayoría de los vendedores en Tracciona están abiertos a negociar. Puedes contactar directamente al vendedor desde cada anuncio para hacer una oferta.`,
    },
    {
      question: `¿Los vehículos tienen garantía?`,
      answer: `Las condiciones de garantía varían según el vendedor. Te recomendamos consultar directamente con el anunciante antes de cerrar la compra y solicitar un certificado de revisión mecánica.`,
    },
  ]
}

function getEnQuestions(title: string, count: number): FaqItem[] {
  const countText = `${count} listing${count === 1 ? '' : 's'}`
  return [
    {
      question: `How many ${title} are for sale?`,
      answer: `Tracciona currently has ${countText} for ${title}. Each listing includes photos, price and technical specifications.`,
    },
    {
      question: `How to buy ${title}?`,
      answer: `To buy ${title} on Tracciona: filter by price, year or features; contact the seller directly from the vehicle listing; arrange a technical inspection before signing.`,
    },
    {
      question: `What documents are needed to buy an industrial vehicle?`,
      answer: `You will need: vehicle registration, valid roadworthiness certificate (ITV), and an insurance policy. Tracciona includes a sales contract generator on the platform.`,
    },
    {
      question: `Can I negotiate the price?`,
      answer: `Yes. Most sellers on Tracciona are open to negotiation. You can contact the seller directly from any listing to make an offer.`,
    },
    {
      question: `Do the vehicles come with a warranty?`,
      answer: `Warranty conditions vary by seller. We recommend checking directly with the seller before purchase and requesting a mechanical inspection certificate.`,
    },
  ]
}

/**
 * Build Schema.org FAQPage JSON-LD for a landing page.
 * Returns null when count is 0 (no content to describe).
 */
export function buildFaqPageSchema(input: FaqPageInput): Record<string, unknown> | null {
  if (input.count <= 0) return null

  const questions =
    input.locale === 'en'
      ? getEnQuestions(input.title, input.count)
      : getEsQuestions(input.title, input.count)

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.map((q) => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: q.answer,
      },
    })),
  }
}
