<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { ROLE_LABELS } from '../types'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const isAdmin = computed(() => auth.profile?.role === 'admin')
const isOffice = computed(() => auth.profile?.role === 'office')
const isDepartment = computed(() => {
  const r = auth.profile?.role
  return r === 'cnc_program' || r === 'cnc_machine' || r === 'print_3d' || r === 'workshop'
})

const roleLabel = computed(() => {
  const r = auth.profile?.role
  return r ? ROLE_LABELS[r] : ''
})

const navItems = computed(() => {
  const items: { to: string; label: string }[] = []
  if (isAdmin.value || isOffice.value) {
    items.push({ to: '/dashboard', label: '数据看板' })
    items.push({ to: '/orders', label: '订单管理' })
    items.push({ to: '/logs', label: '跟单日志' })
  }
  if (isDepartment.value) {
    items.push({ to: '/tasks', label: '我的任务' })
  }
  if (isAdmin.value) {
    items.push({ to: '/users', label: '用户管理' })
  }
  return items
})

function isActive(path: string) {
  return route.path === path || route.path.startsWith(path + '/')
}

async function handleLogout() {
  await auth.logout()
  router.push('/login')
}
</script>

<template>
  <div class="app-shell">
    <aside class="sidebar">
      <div class="sidebar-header">跟单系统</div>
      <nav class="sidebar-nav">
        <router-link
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          :class="{ active: isActive(item.to) }"
        >
          {{ item.label }}
        </router-link>
      </nav>
      <div class="sidebar-footer">
        <span class="user-info">{{ auth.profile?.username }} ({{ roleLabel }})</span>
        <button class="btn-logout" @click="handleLogout">退出</button>
      </div>
    </aside>
    <main class="main-content">
      <slot />
    </main>
  </div>
</template>

<style scoped>
.app-shell {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: var(--sidebar-width);
  background: var(--bg-secondary);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: 100;
}

.sidebar-header {
  padding: 16px 20px;
  font-size: 18px;
  font-weight: 700;
  border-bottom: 1px solid var(--border);
}

.sidebar-nav {
  flex: 1;
  padding: 8px 0;
  overflow-y: auto;
}

.sidebar-nav a {
  display: block;
  padding: 10px 20px;
  color: var(--text-secondary);
  font-size: 14px;
  transition: all 0.2s;
  border-left: 3px solid transparent;
}

.sidebar-nav a:hover {
  color: var(--text-primary);
  background: var(--bg-hover);
}

.sidebar-nav a.active {
  color: var(--text-primary);
  background: var(--accent-bg);
  border-left-color: var(--accent);
}

.sidebar-footer {
  padding: 12px 20px;
  border-top: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.user-info {
  font-size: 13px;
  color: var(--text-secondary);
}

.btn-logout {
  background: none;
  border: 1px solid var(--border);
  color: var(--text-secondary);
  padding: 4px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.btn-logout:hover {
  border-color: var(--danger);
  color: var(--danger);
}

.main-content {
  flex: 1;
  margin-left: var(--sidebar-width);
  padding: 24px;
  min-height: 100vh;
}
</style>
