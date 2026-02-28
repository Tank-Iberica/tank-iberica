export interface SidebarNavItem {
  to: string
  label: string
  badge?: number
}

export function useAdminSidebar() {
  const route = useRoute()
  const supabase = useSupabaseClient()

  // Dropdown state
  const showDropdown = ref(false)

  function toggleDropdown() {
    showDropdown.value = !showDropdown.value
  }

  onMounted(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.company-dropdown')) {
        showDropdown.value = false
      }
    }
    document.addEventListener('click', handleClickOutside)
    onUnmounted(() => document.removeEventListener('click', handleClickOutside))
  })

  // Nav group open/close state — persists during session
  const openGroups = useState('admin-sidebar-groups', () => ({
    config: false,
    catalog: true,
    finance: false,
    communication: false,
    users: false,
  }))

  function toggleGroup(group: keyof typeof openGroups.value) {
    openGroups.value[group] = !openGroups.value[group]
  }

  // Pending counters
  const pendingAnunciantes = ref(0)
  const pendingSolicitantes = ref(0)
  const pendingComentarios = ref(0)
  const pendingChats = ref(0)
  const pendingSuscripciones = ref(0)
  const infraAlertCount = ref(0)

  const pendingCatalog = computed(() => pendingAnunciantes.value + pendingSolicitantes.value)
  const pendingComunicacion = computed(() => pendingComentarios.value)
  const pendingUsuarios = computed(() => pendingChats.value + pendingSuscripciones.value)

  // Navigation helpers
  function isActive(path: string, exact = false): boolean {
    if (exact) return route.path === path
    return route.path.startsWith(path)
  }

  function isActiveGroup(group: string): boolean {
    const groupPaths: Record<string, string[]> = {
      config: ['/admin/config'],
      catalog: [
        '/admin/productos',
        '/admin/anunciantes',
        '/admin/solicitantes',
        '/admin/cartera',
        '/admin/agenda',
      ],
      finance: ['/admin/balance', '/admin/registro', '/admin/historico', '/admin/utilidades'],
      communication: ['/admin/banner', '/admin/noticias', '/admin/comentarios'],
      users: ['/admin/usuarios', '/admin/chats', '/admin/suscripciones'],
    }
    return groupPaths[group]?.some((path) => route.path.startsWith(path)) || false
  }

  // Nav group items (static where no badges, computed where badges needed)
  const configItems: SidebarNavItem[] = [
    { to: '/admin/config/branding', label: 'Identidad' },
    { to: '/admin/config/navigation', label: 'Navegación' },
    { to: '/admin/config/homepage', label: 'Homepage' },
    { to: '/admin/config/catalog', label: 'Catálogo' },
    { to: '/admin/config/languages', label: 'Idiomas' },
    { to: '/admin/config/pricing', label: 'Precios' },
    { to: '/admin/config/integrations', label: 'Integraciones' },
    { to: '/admin/config/emails', label: 'Emails' },
    { to: '/admin/config/editorial', label: 'Editorial' },
    { to: '/admin/config/system', label: 'Sistema' },
  ]

  const catalogItems = computed<SidebarNavItem[]>(() => [
    { to: '/admin/productos', label: 'Productos' },
    {
      to: '/admin/anunciantes',
      label: 'Anunciantes',
      badge: pendingAnunciantes.value || undefined,
    },
    {
      to: '/admin/solicitantes',
      label: 'Solicitantes',
      badge: pendingSolicitantes.value || undefined,
    },
    { to: '/admin/cartera', label: 'Cartera' },
    { to: '/admin/agenda', label: 'Agenda' },
  ])

  const financeItems: SidebarNavItem[] = [
    { to: '/admin/balance', label: 'Balance' },
    { to: '/admin/registro', label: 'Registro' },
    { to: '/admin/historico', label: 'Histórico' },
    { to: '/admin/utilidades', label: 'Utilidades' },
  ]

  const communicationItems = computed<SidebarNavItem[]>(() => [
    { to: '/admin/banner', label: 'Banner' },
    { to: '/admin/noticias', label: 'Noticias' },
    {
      to: '/admin/comentarios',
      label: 'Comentarios',
      badge: pendingComentarios.value || undefined,
    },
  ])

  const usersItems = computed<SidebarNavItem[]>(() => [
    { to: '/admin/usuarios', label: 'Usuarios' },
    { to: '/admin/chats', label: 'Chats', badge: pendingChats.value || undefined },
    {
      to: '/admin/suscripciones',
      label: 'Suscripciones',
      badge: pendingSuscripciones.value || undefined,
    },
  ])

  // Popover (for collapsed sidebar)
  const popover = ref({
    show: false,
    top: 0,
    left: 0,
    title: '',
    items: [] as SidebarNavItem[],
  })

  function openPopover(group: string, event: MouseEvent) {
    const data: Record<string, { title: string; items: SidebarNavItem[] }> = {
      config: { title: 'Configuración', items: configItems },
      catalog: { title: 'Catálogo', items: catalogItems.value },
      finance: { title: 'Finanzas', items: financeItems },
      communication: { title: 'Comunicación', items: communicationItems.value },
      users: { title: 'Comunidad', items: usersItems.value },
    }
    const groupData = data[group]
    if (!groupData) return
    const target = event.currentTarget as HTMLElement
    const rect = target.getBoundingClientRect()
    popover.value = {
      show: true,
      top: rect.top,
      left: rect.right + 8,
      title: groupData.title,
      items: groupData.items,
    }
  }

  function closePopover() {
    popover.value.show = false
  }

  // Infra alerts
  async function fetchInfraAlerts() {
    // infra_alerts may not be in generated types yet — use untyped query
    const client = supabase as unknown as {
      from: (table: string) => {
        select: (...args: unknown[]) => {
          is: (...args: unknown[]) => {
            in: (...args: unknown[]) => Promise<{ count: number | null }>
          }
        }
      }
    }
    const { count } = await client
      .from('infra_alerts')
      .select('*', { count: 'exact', head: true })
      .is('acknowledged_at', null)
      .in('alert_level', ['critical', 'emergency'])
    infraAlertCount.value = count ?? 0
  }

  onMounted(() => {
    fetchInfraAlerts()
  })

  // Logout
  async function handleLogout() {
    showDropdown.value = false
    await supabase.auth.signOut()
    navigateTo('/')
  }

  return {
    showDropdown,
    toggleDropdown,
    openGroups,
    toggleGroup,
    pendingCatalog,
    pendingComunicacion,
    pendingUsuarios,
    infraAlertCount,
    isActive,
    isActiveGroup,
    configItems,
    catalogItems,
    financeItems,
    communicationItems,
    usersItems,
    popover,
    openPopover,
    closePopover,
    handleLogout,
  }
}
