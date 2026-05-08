<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

function isActive(path: string) {
  return route.path === path
}

async function handleLogout() {
  await auth.logout()
  router.push('/login')
}
</script>

<template>
  <div class="app-layout">
    <header class="app-header">
      <h1>OrderSync</h1>
      <button class="logout-btn" @click="handleLogout">退出</button>
    </header>
    <main class="app-main">
      <slot />
    </main>
    <nav class="app-tabs">
      <router-link to="/" :class="{ active: isActive('/') }">
        <span class="tab-icon">&#9776;</span>
        <span>仪表盘</span>
      </router-link>
      <router-link to="/receiver" :class="{ active: isActive('/receiver') }">
        <span class="tab-icon">&#9881;</span>
        <span>接收端</span>
      </router-link>
      <router-link to="/sender" :class="{ active: isActive('/sender') }">
        <span class="tab-icon">&#9993;</span>
        <span>发送端</span>
      </router-link>
    </nav>
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #1a1a2e;
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 20px;
  background: #16213e;
  border-bottom: 1px solid #2a3f5f;
}

.app-header h1 {
  font-size: 1.2rem;
  color: #4caf50;
  font-weight: 600;
}

.logout-btn {
  background: none;
  border: 1px solid #555;
  color: #aaa;
  padding: 5px 14px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
}

.logout-btn:hover {
  border-color: #e74c3c;
  color: #e74c3c;
}

.app-main {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  padding-bottom: 80px;
}

.app-tabs {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  background: #16213e;
  border-top: 1px solid #2a3f5f;
  z-index: 100;
}

.app-tabs a {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 10px 0;
  color: #667788;
  font-size: 0.8rem;
  text-decoration: none;
  transition: color 0.2s;
}

.app-tabs a .tab-icon {
  font-size: 1.2rem;
  margin-bottom: 2px;
}

.app-tabs a.active {
  color: #4caf50;
}

.app-tabs a:hover {
  color: #4caf50;
}
</style>
