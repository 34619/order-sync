<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Layout from '../components/Layout.vue'
import ConfirmDialog from '../components/ConfirmDialog.vue'
import { supabase } from '../lib/supabase'
import { api } from '../lib/api'
import { useAuthStore } from '../stores/auth'
import { ROLE_LABELS } from '../types'
import type { Profile, Role, TrackerCode } from '../types'

const auth = useAuthStore()

const users = ref<Profile[]>([])
const loading = ref(true)
const showForm = ref(false)
const showDelete = ref(false)
const deleteId = ref('')
const deleteError = ref('')
const formError = ref('')
const showReset = ref(false)
const resetId = ref('')
const resetPassword = ref('')
const resetError = ref('')

const form = ref({
  email: '',
  password: '',
  username: '',
  role: 'cnc_program' as Role,
  tracker_code: '' as TrackerCode | ''
})

onMounted(async () => {
  await fetchUsers()
})

async function fetchUsers() {
  loading.value = true
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
  users.value = (data as Profile[]) || []
  loading.value = false
}

function openCreate() {
  form.value = { email: '', password: '', username: '', role: 'cnc_program', tracker_code: '' }
  formError.value = ''
  showForm.value = true
}

async function handleCreate() {
  if (!form.value.email || !form.value.password || !form.value.username) return

  formError.value = ''
  try {
    await api.post('/api/users', {
      email: form.value.email,
      password: form.value.password,
      username: form.value.username,
      role: form.value.role,
      tracker_code: form.value.role === 'office' ? form.value.tracker_code : null
    })
    showForm.value = false
    await fetchUsers()
  } catch (e: any) {
    formError.value = e.message || '创建失败'
  }
}

function confirmDelete(id: string) {
  deleteId.value = id
  deleteError.value = ''
  showDelete.value = true
}

async function handleDelete() {
  try {
    await api.del(`/api/users/${deleteId.value}`)
    showDelete.value = false
    await fetchUsers()
  } catch (e: any) {
    deleteError.value = e.message || '删除失败'
  }
}

function openReset(id: string) {
  resetId.value = id
  resetPassword.value = ''
  resetError.value = ''
  showReset.value = true
}

async function handleReset() {
  if (!resetPassword.value || resetPassword.value.length < 6) return
  resetError.value = ''
  try {
    await api.patch(`/api/users/${resetId.value}/reset-password`, { password: resetPassword.value })
    showReset.value = false
  } catch (e: any) {
    resetError.value = e.message || '重置失败'
  }
}
</script>

<template>
  <Layout>
    <div class="page-header">
      <h1 class="page-title">用户管理</h1>
      <button class="btn btn-primary" @click="openCreate">新增用户</button>
    </div>

    <div class="card">
      <table class="data-table" v-if="users.length">
        <thead>
          <tr>
            <th>用户名</th>
            <th>邮箱</th>
            <th>角色</th>
            <th>编号</th>
            <th>创建时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in users" :key="u.id">
            <td>{{ u.username }}</td>
            <td>{{ u.email || '-' }}</td>
            <td>
              <span class="badge" :class="u.role === 'admin' ? 'badge-danger' : 'badge-info'">
                {{ ROLE_LABELS[u.role] }}
              </span>
            </td>
            <td>{{ u.tracker_code || '-' }}</td>
            <td class="text-secondary text-sm">{{ u.created_at.slice(0, 10) }}</td>
            <td class="flex gap-8">
              <button
                class="btn btn-sm"
                @click.stop="openReset(u.id)"
              >重置密码</button>
              <button
                v-if="u.id !== auth.user?.id"
                class="btn btn-sm btn-danger"
                @click.stop="confirmDelete(u.id)"
              >删除</button>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-else class="text-center text-secondary" style="padding: 40px">暂无用户</p>
    </div>

    <!-- 创建用户弹窗 -->
    <div v-if="showForm" class="dialog-overlay" @click.self="showForm = false">
      <div class="dialog-box">
        <h3 class="dialog-title">新增用户</h3>
        <p v-if="formError" class="form-error">{{ formError }}</p>
        <form @submit.prevent="handleCreate">
          <div class="form-group">
            <label class="form-label">邮箱 *</label>
            <input v-model="form.email" type="email" class="form-input" required />
          </div>
          <div class="form-group">
            <label class="form-label">密码 *</label>
            <input v-model="form.password" type="password" class="form-input" required minlength="6" />
          </div>
          <div class="form-group">
            <label class="form-label">用户名 *</label>
            <input v-model="form.username" class="form-input" required />
          </div>
          <div class="form-group">
            <label class="form-label">角色 *</label>
            <select v-model="form.role" class="form-select">
              <option v-for="(label, key) in ROLE_LABELS" :key="key" :value="key">{{ label }}</option>
            </select>
          </div>
          <div v-if="form.role === 'office'" class="form-group">
            <label class="form-label">跟单员编号 *</label>
            <select v-model="form.tracker_code" class="form-select" required>
              <option value="">请选择</option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
            </select>
          </div>
          <div class="flex gap-12" style="justify-content: flex-end; margin-top: 16px">
            <button type="button" class="btn" @click="showForm = false">取消</button>
            <button type="submit" class="btn btn-primary">创建</button>
          </div>
        </form>
      </div>
    </div>

    <ConfirmDialog
      v-if="showDelete"
      title="删除用户"
      message="确定要删除此用户吗？此操作不可恢复。"
      danger
      @confirm="handleDelete"
      @cancel="showDelete = false"
    />

    <!-- 重置密码弹窗 -->
    <div v-if="showReset" class="dialog-overlay" @click.self="showReset = false">
      <div class="dialog-box">
        <h3 class="dialog-title">重置密码</h3>
        <p v-if="resetError" class="form-error">{{ resetError }}</p>
        <form @submit.prevent="handleReset">
          <div class="form-group">
            <label class="form-label">新密码 *</label>
            <input v-model="resetPassword" type="password" class="form-input" required minlength="6" placeholder="至少6位" />
          </div>
          <div class="flex gap-12" style="justify-content: flex-end; margin-top: 16px">
            <button type="button" class="btn" @click="showReset = false">取消</button>
            <button type="submit" class="btn btn-primary">确认重置</button>
          </div>
        </form>
      </div>
    </div>
  </Layout>
</template>

<style scoped>
.dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog-box {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 24px;
  width: 440px;
}

.dialog-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
}

.form-error {
  color: var(--danger);
  font-size: 13px;
  margin-bottom: 12px;
}
</style>
