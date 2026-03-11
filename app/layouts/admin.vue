<template>
  <!-- Login screen for unauthenticated users -->
  <div v-if="!hasSession" class="admin-login">
    <div class="login-card">
      <div class="login-logo">
        <span class="logo-icon">TI</span>
        <span class="logo-text">Tracciona</span>
      </div>
      <h1>{{ t('admin.layout.title') }}</h1>
      <p class="login-subtitle">{{ t('admin.layout.loginSubtitle') }}</p>

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
        {{ loading ? t('common.loading') : t('admin.layout.loginWithGoogle') }}
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
      <p class="login-subtitle">{{ t('admin.layout.verifyingAccess') }}</p>
    </div>
  </div>

  <!-- Not admin - access denied -->
  <div v-else-if="!isAdmin" class="admin-login">
    <div class="login-card">
      <div class="login-logo">
        <span class="logo-icon">TI</span>
        <span class="logo-text">Tracciona</span>
      </div>
      <h1>{{ t('admin.layout.accessDenied') }}</h1>
      <p class="login-subtitle">{{ t('admin.layout.noAdminPermissions') }}</p>
      <button class="btn-google" @click="logout">{{ t('nav.logout') }}</button>
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
        <NuxtErrorBoundary @error="(e) => console.error('[admin] Error boundary caught:', e)">
          <template #error="{ clearError }">
            <div class="error-boundary">
              <p class="error-boundary__msg">{{ t('admin.layout.errorBoundaryMsg') }}</p>
              <div class="error-boundary__actions">
                <button class="error-boundary__btn" @click="clearError">
                  {{ t('common.retry') }}
                </button>
                <NuxtLink to="/admin" class="error-boundary__link" @click="clearError">
                  {{ t('admin.layout.backToStart') }}
                </NuxtLink>
              </div>
            </div>
          </template>
          <slot />
        </NuxtErrorBoundary>
      </main>
    </div>
    <UiToastContainer />
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()

// Prevent admin pages from being indexed by search engines
useSeoMeta({ robots: 'noindex, nofollow' })

const supabase = useSupabaseClient()

const sidebarCollapsed = ref(false)
const sidebarOpen = ref(false)
const loading = ref(false)
const errorMsg = ref('')
const checkingAdmin = ref(true)
const isAdmin = ref(false)
const hasSession = ref(false)

// Check if user is admin using their ID directly (avoids useSupabaseUser() race condition)
async function checkAdminRole(uid: string) {
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

// Initialize from session directly — avoids useSupabaseUser() which is reset to null
// on every page:start by @nuxtjs/supabase ≤2.0.4 when using HS256 JWTs
onMounted(async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (session?.user?.id) {
    hasSession.value = true
    checkingAdmin.value = true
    await checkAdminRole(session.user.id)
  } else {
    checkingAdmin.value = false
    isAdmin.value = false
  }

  // Keep in sync with real auth changes (login/logout)
  supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.user?.id) {
      hasSession.value = true
      checkAdminRole(session.user.id)
    } else {
      hasSession.value = false
      isAdmin.value = false
    }
  })
})

// Login with Google
async function loginWithGoogle() {
  loading.value = true
  errorMsg.value = ''

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${globalThis.location.origin}/admin`,
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
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(
    135deg,
    var(--color-primary-dark) 0%,
    var(--color-primary) 50%,
    #2d5259 100%
  );
  padding: 1.25rem;
}

.login-card {
  background: var(--bg-primary);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-12) var(--spacing-10);
  width: 100%;
  max-width: 25rem;
  text-align: center;
  box-shadow: var(--shadow-xl);
}

.login-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-3);
  margin-bottom: var(--spacing-6);
}

.logo-icon {
  width: 3rem;
  height: 3rem;
  background: var(--color-primary);
  color: var(--color-accent);
  border-radius: var(--border-radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: var(--font-weight-bold);
  font-size: var(--font-size-lg);
}

.logo-text {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
}

.login-card h1 {
  font-size: var(--font-size-2xl);
  color: var(--color-gray-800);
  margin: 0 0 var(--spacing-2);
}

.login-subtitle {
  color: var(--color-gray-500);
  margin: 0 0 var(--spacing-8);
}

.btn-google {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-3);
  padding: var(--spacing-3) var(--spacing-6);
  border: 2px solid var(--border-color-light);
  border-radius: var(--border-radius);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  color: var(--color-gray-700);
  background: var(--bg-primary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-google:hover:not(:disabled) {
  background: var(--color-gray-50);
  border-color: var(--border-color);
}

.btn-google:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-msg {
  color: var(--color-error);
  font-size: 0.875rem;
  margin-top: 1rem;
}

/* Admin Layout */
.admin-layout {
  min-height: 100vh;
  min-height: 100dvh;
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
  padding: var(--spacing-3);
  padding-top: calc(56px + var(--spacing-3));
}

/* Header only on mobile */
.mobile-only-header {
  display: block;
}

@media (min-width: 48em) {
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

/* Tablet+ */
@media (min-width: 48em) {
  .sidebar-overlay {
    display: none;
  }

  .admin-main {
    margin-left: var(--sidebar-width);
    transition: margin-left var(--transition-normal);
  }

  .sidebar-collapsed .admin-main {
    margin-left: var(--spacing-16);
  }

  .admin-content {
    padding: var(--spacing-6);
  }
}

/* Desktop */
@media (min-width: 64em) {
  .admin-content {
    padding: var(--spacing-8);
  }
}
</style>
