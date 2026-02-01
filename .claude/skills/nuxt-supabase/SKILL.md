---
name: nuxt-supabase
description: Patterns for Nuxt 3 + Supabase. Use when creating composables, pages, components, tables, RLS policies, or Edge Functions.
---

# Nuxt 3 + Supabase Patterns

## Composable pattern
```typescript
// composables/useVehicles.ts
export function useVehicles() {
  const supabase = useSupabaseClient<Database>()
  const vehicles = ref<Vehicle[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchVehicles(filters?: VehicleFilters) {
    loading.value = true
    error.value = null
    try {
      let query = supabase
        .from('vehicles')
        .select('*, vehicle_images(*), subcategories(name_es, name_en)')
        .eq('status', 'published')

      if (filters?.category) query = query.eq('category', filters.category)
      if (filters?.priceMin) query = query.gte('price', filters.priceMin)
      // ... more filters

      const { data, error: err } = await query.order('created_at', { ascending: false })
      if (err) throw err
      vehicles.value = data ?? []
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      loading.value = false
    }
  }

  return { vehicles, loading, error, fetchVehicles }
}
```

## RLS policy pattern
```sql
-- Always enable RLS
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

-- Public read (published only)
CREATE POLICY "vehicles_select_published" ON vehicles
  FOR SELECT USING (status = 'published');

-- Admin full access
CREATE POLICY "vehicles_admin_all" ON vehicles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- User owns their data
CREATE POLICY "favorites_user_own" ON favorites
  FOR ALL USING (user_id = auth.uid());
```

## Page with slug pattern
```vue
<!-- pages/vehiculo/[slug].vue -->
<script setup lang="ts">
const route = useRoute()
const { slug } = route.params
const supabase = useSupabaseClient<Database>()

const { data: vehicle } = await useAsyncData(`vehicle-${slug}`, () =>
  supabase
    .from('vehicles')
    .select('*, vehicle_images(*), subcategories(name_es, name_en)')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()
    .then(({ data }) => data)
)

useSeoMeta({
  title: () => vehicle.value?.brand + ' ' + vehicle.value?.model + ' — Tank Iberica',
  ogTitle: () => vehicle.value?.brand + ' ' + vehicle.value?.model,
  description: () => vehicle.value?.description_es?.substring(0, 160),
  ogImage: () => vehicle.value?.vehicle_images?.[0]?.url,
})
</script>
```

## SQL migration naming
```
supabase/migrations/
  001_create_users.sql
  002_create_vehicles.sql
  003_create_vehicle_images.sql
  ...
```
