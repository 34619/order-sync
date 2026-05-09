<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import Layout from '../components/Layout.vue'
import StatusBadge from '../components/StatusBadge.vue'
import { useTasksStore } from '../stores/tasks'
import { useAuthStore } from '../stores/auth'
import { supabase } from '../lib/supabase'
import { ROLE_LABELS } from '../types'

const tasksStore = useTasksStore()
const auth = useAuthStore()
const router = useRouter()

const statusFilter = ref('')
const searchKeyword = ref('')
const showNotes = ref('')
const notesText = ref('')

let channel: ReturnType<typeof supabase.channel> | null = null

onMounted(() => {
  tasksStore.fetchMyTasks()
  subscribeTasks()
})

onUnmounted(() => {
  if (channel) supabase.removeChannel(channel)
})

function subscribeTasks() {
  const role = auth.profile?.role
  if (!role) return

  channel = supabase
    .channel('tasks-realtime')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'order_tasks',
      filter: `department=eq.${role}`
    }, () => {
      tasksStore.fetchMyTasks(statusFilter.value || undefined)
    })
    .subscribe()
}

async function handleFilter() {
  await tasksStore.fetchMyTasks(statusFilter.value || undefined)
}

async function handleStart(taskId: string) {
  try {
    await tasksStore.startTask(taskId)
  } catch (e: any) {
    alert('操作失败: ' + (e.message || '未知错误'))
  }
}

function openComplete(taskId: string) {
  showNotes.value = taskId
  notesText.value = ''
}

async function handleComplete() {
  try {
    await tasksStore.completeTask(showNotes.value, notesText.value || undefined)
    showNotes.value = ''
  } catch (e: any) {
    alert('操作失败: ' + (e.message || '未知错误'))
  }
}

const roleLabel = auth.profile?.role ? ROLE_LABELS[auth.profile.role] : ''

const filteredTasks = computed(() => {
  if (!searchKeyword.value) return tasksStore.tasks
  const kw = searchKeyword.value.toLowerCase()
  return tasksStore.tasks.filter(t =>
    t.order?.order_number?.toLowerCase().includes(kw)
  )
})
</script>

<template>
  <Layout>
    <div class="page-header">
      <h1 class="page-title">我的任务 ({{ roleLabel }})</h1>
      <button class="btn" @click="tasksStore.fetchMyTasks(statusFilter || undefined)">刷新</button>
    </div>

    <div class="card mb-16">
      <div class="filter-bar">
        <input v-model="searchKeyword" class="form-input" style="width: 200px" placeholder="搜索订单号" />
        <select v-model="statusFilter" class="form-select" style="width: 140px" @change="handleFilter">
          <option value="">全部状态</option>
          <option value="pending">待处理</option>
          <option value="in_progress">进行中</option>
          <option value="completed">已完成</option>
        </select>
      </div>
    </div>

    <div v-if="filteredTasks.length" class="task-grid">
      <div v-for="task in filteredTasks" :key="task.id" class="card task-card">
        <div class="flex justify-between items-center mb-16">
          <span class="task-order-num">{{ task.order?.order_number || '未知单号' }}</span>
          <StatusBadge :status="task.status" type="task" />
        </div>

        <div class="task-info">
          <div class="info-row">
            <span class="text-secondary text-sm">产品</span>
            <span>{{ task.order?.items?.map((i: any) => i.product_name).join('、') || '-' }}</span>
          </div>
          <div class="info-row">
            <span class="text-secondary text-sm">客户</span>
            <span>{{ task.order?.customer?.name || '-' }}</span>
          </div>
          <div class="info-row">
            <span class="text-secondary text-sm">交期</span>
            <span>{{ task.order?.deadline || '-' }}</span>
          </div>
          <div class="info-row" v-if="task.order?.priority === 'urgent'">
            <span></span>
            <span class="badge badge-danger">加急</span>
          </div>
          <div class="info-row" v-if="task.notes">
            <span class="text-secondary text-sm">备注</span>
            <span>{{ task.notes }}</span>
          </div>
        </div>

        <div class="task-actions">
          <button
            v-if="task.status === 'pending'"
            class="btn btn-primary btn-sm"
            @click="handleStart(task.id)"
          >开始处理</button>
          <button
            v-if="task.status === 'in_progress'"
            class="btn btn-primary btn-sm"
            @click="openComplete(task.id)"
          >标记完成</button>
          <span v-if="task.status === 'completed' && task.completed_at" class="text-secondary text-sm">
            完成于 {{ task.completed_at.slice(0, 16).replace('T', ' ') }}
          </span>
          <button
            class="btn btn-sm"
            @click="router.push(`/orders/${task.order_id}`)"
            style="margin-left: auto"
          >查看详情</button>
        </div>
      </div>
    </div>
    <div v-else class="card text-center text-secondary" style="padding: 60px">暂无任务</div>

    <!-- 完成备注弹窗 -->
    <div v-if="showNotes" class="dialog-overlay" @click.self="showNotes = ''">
      <div class="dialog-box">
        <h3 class="dialog-title">完成任务</h3>
        <div class="form-group">
          <label class="form-label">备注（可选）</label>
          <textarea v-model="notesText" class="form-textarea" placeholder="可填写处理说明"></textarea>
        </div>
        <div class="flex gap-12" style="justify-content: flex-end">
          <button class="btn" @click="showNotes = ''">取消</button>
          <button class="btn btn-primary" @click="handleComplete">确认完成</button>
        </div>
      </div>
    </div>
  </Layout>
</template>

<style scoped>
.filter-bar {
  display: flex;
  gap: 12px;
  align-items: center;
}

.task-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 16px;
}

.task-card {
  display: flex;
  flex-direction: column;
}

.task-order-num {
  font-size: 16px;
  font-weight: 700;
  color: var(--accent);
}

.task-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}

.task-actions {
  padding-top: 12px;
  border-top: 1px solid var(--border);
}

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
  width: 400px;
}

.dialog-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
}
</style>
