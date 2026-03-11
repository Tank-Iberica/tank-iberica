/**
 * Description templates by category slug.
 * Templates use placeholders: {marca}, {modelo}, {año}, {km}
 * Keys are partial slug matches (checked with includes/startsWith).
 */

export interface DescriptionTemplate {
  /** Short label shown in the selector */
  label: string
  /** Spanish template */
  es: string
  /** English template */
  en: string
}

/** Map from category slug substring → template */
const TEMPLATES: Record<string, DescriptionTemplate> = {
  semirremolque: {
    label: 'Semirremolque',
    es: `{marca} {modelo} del año {año} con {km} km. Semirremolque en excelente estado de conservación, revisado y listo para trabajar.

Características principales:
- Mantenimiento al día con documentación disponible
- Neumáticos en buen estado
- Sistema de frenos revisado
- Documentación y ITV en regla

Ideal para transporte nacional e internacional. Posibilidad de financiación. Precio negociable para pago al contado.`,
    en: `{marca} {modelo} from {año} with {km} km. Semi-trailer in excellent condition, serviced and ready to work.

Main features:
- Up-to-date maintenance with documentation available
- Tyres in good condition
- Brake system serviced
- Documentation and roadworthiness test valid

Ideal for national and international transport. Financing available. Price negotiable for cash payment.`,
  },
  cisterna: {
    label: 'Cisterna',
    es: `{marca} {modelo} del año {año} con {km} km. Cisterna con capacidad para transporte de líquidos a granel en perfecto estado operativo.

Características principales:
- Revisada y certificada por organismo oficial
- Limpieza interior realizada
- Sistema de descarga funcionando correctamente
- Documentación, ADR y permisos de transporte en regla

Perfecta para distribución de líquidos alimentarios / químicos / combustibles. Precio negociable.`,
    en: `{marca} {modelo} from {año} with {km} km. Tanker for bulk liquid transport in perfect operational condition.

Main features:
- Inspected and certified by official body
- Interior cleaned
- Discharge system working correctly
- Documentation, ADR and transport permits valid

Perfect for distribution of food / chemical / fuel liquids. Price negotiable.`,
  },
  'cabeza-tractora': {
    label: 'Cabeza tractora',
    es: `{marca} {modelo} del año {año} con {km} km. Cabeza tractora de alta fiabilidad con excelente historial de mantenimiento.

Características principales:
- Motor revisado, sin consumo de aceite
- Caja de cambios y embrague en perfecto estado
- Tacógrafo digital calibrado
- Frenos y suspensión revisados
- Documentación y ITV en regla

Lista para incorporarse a flota de inmediato. Precio sin impuestos.`,
    en: `{marca} {modelo} from {año} with {km} km. Highly reliable truck tractor with excellent maintenance history.

Main features:
- Engine serviced, no oil consumption
- Gearbox and clutch in perfect condition
- Digital tachograph calibrated
- Brakes and suspension serviced
- Documentation and roadworthiness test valid

Ready to join a fleet immediately. Price excluding taxes.`,
  },
  camion: {
    label: 'Camión',
    es: `{marca} {modelo} del año {año} con {km} km. Camión en perfecto estado mecánico y de carrocería.

Características principales:
- Revisión completa realizada
- Carrocería sin golpes significativos
- Documentación y permisos de circulación en regla
- Disponible para prueba previa a la compra

Apto para todo tipo de transporte. Se admite parte de pago en vehículo. Precio negociable.`,
    en: `{marca} {modelo} from {año} with {km} km. Truck in perfect mechanical and body condition.

Main features:
- Full service completed
- Body with no significant damage
- Documentation and circulation permits valid
- Available for test drive before purchase

Suitable for all types of transport. Part exchange accepted. Price negotiable.`,
  },
  excavadora: {
    label: 'Excavadora',
    es: `{marca} {modelo} del año {año} con {km} km de uso. Excavadora en excelente estado de conservación y funcionamiento.

Características principales:
- Cadenas / neumáticos en buen estado
- Hidráulica sin fugas
- Revisión de filtros realizada
- Documentación de mantenimiento disponible

Ideal para obras, movimiento de tierras y trabajos de demolición. Posibilidad de alquiler con opción de compra.`,
    en: `{marca} {modelo} from {año} with {km} hours of use. Excavator in excellent condition and working order.

Main features:
- Tracks / tyres in good condition
- Hydraulics with no leaks
- Filter service completed
- Maintenance documentation available

Ideal for construction, earthmoving and demolition work. Hire with option to buy available.`,
  },
  remolque: {
    label: 'Remolque',
    es: `{marca} {modelo} del año {año} con {km} km. Remolque en buen estado general, revisado y listo para circulación.

Características principales:
- Estructura sin daños significativos
- Sistema de frenos revisado
- Enganche y sistema eléctrico funcionando correctamente
- Documentación al día

Precio cerrado, sin negociación. Se puede ver en nuestras instalaciones.`,
    en: `{marca} {modelo} from {año} with {km} km. Trailer in good overall condition, serviced and road-ready.

Main features:
- Structure without significant damage
- Brake system serviced
- Hitch and electrical system working correctly
- Documentation up to date

Fixed price, no negotiation. Can be viewed at our premises.`,
  },
  default: {
    label: 'General',
    es: `{marca} {modelo} del año {año} con {km} km. Unidad en buen estado general, revisada y lista para trabajar.

Características principales:
- Mantenimiento al día
- Documentación en regla
- Disponible para inspección previa

Precio negociable para pago al contado. Posibilidad de financiación. Para más información no dude en contactarnos.`,
    en: `{marca} {modelo} from {año} with {km} km. Unit in good overall condition, serviced and ready to work.

Main features:
- Up-to-date maintenance
- Documentation in order
- Available for prior inspection

Price negotiable for cash payment. Financing available. For more information do not hesitate to contact us.`,
  },
}

/** Find the best template for a category slug */
export function getDescriptionTemplate(categorySlug: string): DescriptionTemplate {
  const slug = categorySlug.toLowerCase()
  for (const [key, tpl] of Object.entries(TEMPLATES)) {
    if (key === 'default') continue
    if (slug.includes(key)) return tpl
  }
  return TEMPLATES.default!
}

/** Get all available template options (for selector) */
export function getAllTemplates(): Array<{ key: string; label: string }> {
  return Object.entries(TEMPLATES)
    .filter(([key]) => key !== 'default')
    .map(([key, tpl]) => ({ key, label: tpl.label }))
}

/** Apply placeholder substitution */
export function applyPlaceholders(
  template: string,
  values: { marca?: string; modelo?: string; año?: string | number; km?: string | number },
): string {
  return template
    .replace(/\{marca\}/g, values.marca || 'Marca')
    .replace(/\{modelo\}/g, values.modelo || 'Modelo')
    .replace(/\{año\}/g, String(values.año || new Date().getFullYear()))
    .replace(/\{km\}/g, String(values.km || '0'))
}
