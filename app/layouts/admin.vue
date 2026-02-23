<template>
  <!-- Login screen for unauthenticated users -->
  <div v-if="!user" class="admin-login">
    <div class="login-card">
      <div class="login-logo">
        <span class="logo-icon">TI</span>
        <span class="logo-text">Tracciona</span>
      </div>
      <h1>Panel de Administración</h1>
      <p class="login-subtitle">Inicia sesión para continuar</p>

      <button class="btn-google" :disabled="loading" @click="loginWithGoogle">
        <svg width="20" height="20" viewBox="0 0 24 24">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        {{ loading ? 'Cargando...' : 'Iniciar sesión con Google' }}
      </button>

      <p v-if="errorMsg" class="error-msg">{{ errorMsg }}</p>
    </div>
  </div>

  <!-- Checking admin status -->
  <div v-else-if="checkingAdmin" class="admin-login">
    <div class="login-card">
      <div class="login-logo">
        <span class="logo-icon">TI</span>
        <span class="logo-text">Tracciona</span>
      </div>
      <p class="login-subtitle">Verificando acceso...</p>
    </div>
  </div>

  <!-- Not admin - access denied -->
  <div v-else-if="!isAdmin" class="admin-login">
    <div class="login-card">
      <div class="login-logo">
        <span class="logo-icon">TI</span>
        <span class="logo-text">Tracciona</span>
      </div>
      <h1>Acceso Denegado</h1>
      <p class="login-subtitle">No tienes permisos de administrador</p>
      <button class="btn-google" @click="logout">Cerrar sesión</button>
    </div>
  </div>

  <!-- Admin panel for authenticated admin users -->
  <div
    v-else
    class="admin-layout"
    :class="{ 'sidebar-collapsed': sidebarCollapsed, 'sidebar-open': sidebarOpen }"
  >
    <!-- Mobile overlay -->
    <div v-if="sidebarOpen" class="sidebar-overlay" @click="sidebarOpen = false" />

    <!-- Sidebar -->
    <AdminLayoutAdminSidebar
      :collapsed="sidebarCollapsed"
      :open="sidebarOpen"
      @toggle-collapse="sidebarCollapsed = !sidebarCollapsed"
      @close="sidebarOpen = false"
    />

    <!-- Main area -->
    <div class="admin-main">
      <AdminLayoutAdminHeader
        class="mobile-only-header"
        @toggle-sidebar="sidebarOpen = !sidebarOpen"
        @toggle-collapse="sidebarCollapsed = !sidebarCollapsed"
      />
      <main class="admin-content">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
// Prevent admin pages from being indexed by search engines
useSeoMeta({ robots: 'noindex, nofollow' })

const user = useSupabaseUser()
const supabase = useSupabaseClient()

const sidebarCollapsed = ref(false)
const sidebarOpen = ref(false)
const loading = ref(false)
const errorMsg = ref('')
const checkingAdmin = ref(true)
const isAdmin = ref(false)

// Check if user is admin
async function checkAdminRole() {
  const uid = userId.value
  if (!uid) {
    checkingAdmin.value = false
    isAdmin.value = false
    return
  }

  try {
    const { data } = await supabase
      .from('users')
      .select('role')
      .eq('id', uid)
      .single<{ role: string }>()

    isAdmin.value = data?.role === 'admin'
  } catch {
    isAdmin.value = false
  } finally {
    checkingAdmin.value = false
  }
}

// Get user ID from either 'id' or 'sub' field (Supabase returns 'sub' in JWT)
const userId = computed(() => user.value?.id || user.value?.sub)

// Watch for user changes and check admin role
watch(
  user,
  () => {
    if (userId.value) {
      checkingAdmin.value = true
      checkAdminRole()
    } else {
      checkingAdmin.value = false
      isAdmin.value = false
    }
  },
  { immediate: true },
)

// Login with Google
async function loginWithGoogle() {
  loading.value = true
  errorMsg.value = ''

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/admin`,
    },
  })

  if (error) {
    errorMsg.value = error.message
    loading.value = false
  }
}

// Logout
async function logout() {
  await supabase.auth.signOut()
  isAdmin.value = false
}

// Close mobile sidebar on route change
const route = useRoute()
watch(
  () => route.path,
  () => {
    sidebarOpen.value = false
  },
)

// Close sidebar on escape key
onMounted(() => {
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      sidebarOpen.value = false
    }
  }
  document.addEventListener('keydown', handleEscape)
  onUnmounted(() => {
    document.removeEventListener('keydown', handleEscape)
  })
})
</script>

<style scoped>
/* Admin Login Screen */
.admin-login {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1a3238 0%, #23424a 50%, #2d5259 100%);
  padding: 20px;
}

.login-card {
  background: white;
  border-radius: 16px;
  padding: 48px 40px;
  width: 100%;
  max-width: 400px;
  text-align: center;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4);
}

.login-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 24px;
}

.logo-icon {
  width: 48px;
  height: 48px;
  background: var(--color-primary, #23424a);
  color: var(--color-accent, #7fd1c8);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 18px;
}

.logo-text {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-primary, #23424a);
}

.login-card h1 {
  font-size: 1.5rem;
  color: #1f2937;
  margin: 0 0 8px;
}

.login-subtitle {
  color: #6b7280;
  margin: 0 0 32px;
}

.btn-google {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 14px 24px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  color: #374151;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-google:hover:not(:disabled) {
  background: #f9fafb;
  border-color: #d1d5db;
}

.btn-google:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-msg {
  color: #dc2626;
  font-size: 14px;
  margin-top: 16px;
}

/* Admin Layout */
.admin-layout {
  min-height: 100vh;
  display: flex;
  background: var(--bg-secondary);
}

.admin-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.admin-content {
  flex: 1;
  overflow-x: hidden;
}

/* Header only on mobile */
.mobile-only-header {
  display: block;
}

@media (min-width: 768px) {
  .mobile-only-header {
    display: none;
  }
}

/* Mobile base: sidebar as overlay */
.sidebar-overlay {
  display: block;
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: var(--z-modal-backdrop);
  opacity: 0;
  visibility: hidden;
  transition:
    opacity var(--transition-normal),
    visibility var(--transition-normal);
}

.sidebar-open .sidebar-overlay {
  opacity: 1;
  visibility: visible;
}

.admin-content {
  padding: var(--spacing-3);
  padding-top: calc(56px + var(--spacing-3));
}

/* Tablet+ */
@media (min-width: 768px) {
  .sidebar-overlay {
    display: none;
  }

  .admin-main {
    margin-left: var(--sidebar-width);
    transition: margin-left var(--transition-normal);
  }

  .sidebar-collapsed .admin-main {
    margin-left: 64px;
  }

  .admin-content {
    padding: var(--spacing-6);
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .admin-content {
    padding: var(--spacing-8);
  }
}
</style>
