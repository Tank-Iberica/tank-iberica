# Code Patterns (confirmed over many iterations)

## Composable extraction
- All state + logic → `useXxx.ts`; page script → ~30 lines (destructure + onMounted)
- Types exported from composable or component for import by others
- Static data arrays: export as module-level const from composable/component

## vue/no-mutating-props compliance
- Never `v-model` on props → use `:value` + `@input`/`@change` + emit
- Object props: spread entire object in emit: `emit('update:theme', { ...props.theme, [key]: val })`

## @typescript-eslint/unified-signatures
- Combine emit overloads with identical param shapes:
  `(e: 'a' | 'b', value: string): void` (not two separate overloads)

## vue/no-export-in-script-setup
- Type exports (`interface`, `type`) ARE allowed in `<script setup>`
- Value exports (`const`, `function`) are NOT → use separate plain `<script>` block

## Module-level exports from .vue files
```vue
<script lang="ts">          ← plain script for exports
export interface Foo { ... }
export const staticData = [...]
</script>
<script setup lang="ts">   ← setup script for component logic
// Foo and staticData auto-available here from same-file script
defineProps<{ item: Foo }>()
</script>
```

## Props assigned but never used
- `const props = defineProps<...>()` when props not accessed in script → remove `const props =`

## Intl.NumberFormat — non-breaking space
- `Intl.NumberFormat('es-ES', { style: 'currency', ... })` produce `\u00A0` (espacio irrompible) entre número y símbolo `€`
- Al comparar strings en tests: `.replace('\u00A0', ' ')` o usar `toContain` en lugar de `toBe`
- Mismo fix necesario en cualquier `formatCurrency` que use `Intl.NumberFormat` regional

## Math.random → crypto (SonarQube S2245)
- `Math.random()` para IDs temporales → `crypto.randomUUID().slice(0, 8)` o `Date.now()`
- `Math.random()` para shuffle → `crypto.getRandomValues(new Uint8Array(1))[0]! < 128 ? -1 : 1`
- `Math.random()` para progress increment → `(crypto.getRandomValues(new Uint8Array(1))[0]! % 15) + 5`

## ReDoS-safe regex (SonarQube S2631)
- Lazy quantifiers `.*?` con user input → reemplazar con character class negada `[^\]]*`
- Ejemplo: `/\[(.*?)\]\((.*?)\)/g` → `/\[([^\]]*)\]\(([^)]*)\)/g`
- Anchors (`^`/`$`) y negated char classes son O(n) → safe
- Solo lazy quantifiers y lookaheads en loops sin anchor son riesgo real de ReDoS

## Composable shared state
- `ref()` creates per-call state (not shared). Don't call composable in child if parent already owns state.
- Pass `isEnabled`/`isAlwaysOn` as function props when composable state is local to parent.

## Plugin test pattern — DOM manipulation (happy-dom network guard)

happy-dom tries to fetch external scripts/iframes when appended to DOM → use `vi.spyOn` to intercept:

```typescript
let appendedScripts: HTMLScriptElement[] = []
vi.spyOn(document.head, 'appendChild').mockImplementation((node: Node) => {
  if (node instanceof HTMLScriptElement) appendedScripts.push(node)
  return node
})
vi.spyOn(document.body, 'insertAdjacentElement').mockReturnValue(null)
```

## Plugin test pattern — shared mutable consent state

When a plugin captures `hasConsent` from `useConsent()` into a closure, per-test `stubConsent()` won't update the captured function. Use a shared mutable object:

```typescript
const _consent = { marketing: false }
vi.stubGlobal('useConsent', () => ({
  consent: { value: _consent },
  hasConsent: (type: string) => type === 'marketing' && _consent.marketing,
}))
// In tests: mutate _consent.marketing directly, then fire watch callback
```

## Plugin test pattern — watch + onMounted stubs

For plugins using Vue `watch`/`onMounted` (outside component context):

```typescript
let _watchCb: ((v: unknown) => void) | null = null
vi.stubGlobal('watch', (source: unknown, cb: Function, opts?: { immediate?: boolean }) => {
  _watchCb = cb as (v: unknown) => void
  if (opts?.immediate && typeof source === 'function') cb((source as () => unknown)())
})
vi.stubGlobal('onMounted', (cb: Function) => cb())
// Re-stub in beforeEach to reset _watchCb for each test
```

## Analytics tracking patterns

- `trackBuyerGeo`: sessionStorage guard (`GEO_TRACKED_KEY`) — fire once per session
- `trackVehicleDuration`: `visibilitychange` + `onBeforeUnmount` with `_durationTracked` flag (double-fire guard)
- `trackVehicleComparison`: sessionStorage `analytics_session_views` array — fire when 2+ same-category vehicles viewed
- Pure functions for session logic (`findSimilarInSession`, `addToSession`) — extract for testability
