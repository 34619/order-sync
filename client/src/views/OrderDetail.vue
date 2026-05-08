<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Layout from '../components/Layout.vue'
import StatusBadge from '../components/StatusBadge.vue'
import ConfirmDialog from '../components/ConfirmDialog.vue'
import { useOrdersStore } from '../stores/orders'
import { useTasksStore } from '../stores/tasks'
import { useLogsStore } from '../stores/logs'
import { useAuthStore } from '../stores/auth'
import { DEPARTMENT_LABELS, STATUS_LABELS, TASK_STATUS_LABELS } from '../types'

const route = useRoute()
const router = useRouter()
const ordersStore = useOrdersStore()
const tasksStore = useTasksStore()
const logsStore = useLogsStore()
const auth = useAuthStore()

const orderId = route.params.id as string
const showDeliveryConfirm = ref(false)

onMounted(async () => {
  await ordersStore.fetchOrder(orderId)
  await logsStore.fetchLogs(orderId)
})

const order = computed(() => ordersStore.currentOrder)
const isOffice = computed(() => auth.profile?.role === 'admin' || auth.profile?.role === 'office')

async function refresh() {
  await ordersStore.fetchOrder(orderId)
  await logsStore.fetchLogs(orderId)
}

async function handleStartTask(taskId: string) {
  await tasksStore.updateTaskStatus(taskId, 'in_progress')
  await refresh()
}

async function handleCompleteTask(taskId: string) {
  await tasksStore.updateTaskStatus(taskId, 'completed')
  await refresh()
}

async function handleConfirmDelivery() {
  await ordersStore.confirmDelivery(orderId)
  await refresh()
  showDeliveryConfirm.value = false
}
</script>

<template>
  <Layout>
    <div class="page-header">
      <h1 class="page-title">订单详情</h1>
      <button class="btn" @click="router.push('/orders')">返回列表</button>
    </div>

    <div v-if="order" class="detail-layout">
      <!-- 基本信息 -->
      <div class="card mb-16">
        <div class="card-title">基本信息</div>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">订单号</span>
            <span class="info-value">{{ order.order_number }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">客户</span>
            <span class="info-value">{{ order.customer?.name || '-' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">交期</span>
            <span class="info-value">{{ order.deadline || '-' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">优先级</span>
            <span class="badge" :class="order.priority === 'urgent' ? 'badge-danger' : 'badge-default'">
              {{ order.priority === 'urgent' ? '加急' : '普通' }}
            </span>
          </div>
          <div class="info-item">
            <span class="info-label">状态</span>
            <StatusBadge :status="order.status" type="order" />
          </div>
          <div class="info-item full" v-if="order.notes">
            <span class="info-label">工艺要求</span>
            <span class="info-value">{{ order.notes }}</span>
          </div>
        </div>

        <div v-if="isOffice && order.status === 'pending_delivery'" style="margin-top: 16px">
          <button class="btn btn-primary" @click="showDeliveryConfirm = true">确认交付</button>
        </div>
      </div>

      <!-- 产品列表 -->
      <div class="card mb-16" v-if="order.items && order.items.length">
        <div class="card-title">产品列表 ({{ order.items.length }})</div>
        <table class="data-table">
          <thead>
            <tr>
              <th>产品名称</th>
              <th>规格</th>
              <th>数量</th>
              <th>材质</th>
              <th>图纸名</th>
              <th>尺寸</th>
              <th>表面要求</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in order.items" :key="item.id">
              <td>{{ item.product_name }}</td>
              <td>{{ item.product_spec || '-' }}</td>
              <td>{{ item.quantity }}</td>
              <td>{{ item.material || '-' }}</td>
              <td>{{ item.drawing_name || '-' }}</td>
              <td>{{ item.dimensions || '-' }}</td>
              <td>{{ item.surface_req || '-' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 任务列表 -->
      <div class="card mb-16">
        <div class="card-title">部门任务</div>
        <div v-if="order.tasks && order.tasks.length" class="task-list">
          <div v-for="task in order.tasks" :key="task.id" class="task-card">
            <div class="flex justify-between items-center mb-16">
              <div>
                <span class="task-dept">{{ DEPARTMENT_LABELS[task.department] }}</span>
                <StatusBadge :status="task.status" type="task" style="margin-left: 8px" />
              </div>
              <div class="flex gap-8">
                <button
                  v-if="task.status === 'pending' && auth.profile?.role === task.department"
                  class="btn btn-sm btn-primary"
                  @click="handleStartTask(task.id)"
                >开始</button>
                <button
                  v-if="task.status === 'in_progress' && auth.profile?.role === task.department"
                  class="btn btn-sm btn-primary"
                  @click="handleCompleteTask(task.id)"
                >完成</button>
              </div>
            </div>
            <div v-if="task.notes" class="text-secondary text-sm">备注: {{ task.notes }}</div>
            <div v-if="task.completed_at" class="text-secondary text-sm">完成时间: {{ task.completed_at.slice(0, 16) }}</div>
          </div>
        </div>
        <p v-else class="text-center text-secondary" style="padding: 20px">暂未派单</p>
      </div>

      <!-- 操作日志 -->
      <div class="card">
        <div class="card-title">操作日志</div>
        <div v-if="logsStore.logs.length" class="log-list">
          <div v-for="log in logsStore.logs" :key="log.id" class="log-item">
            <span class="log-time">{{ log.created_at.slice(0, 16).replace('T', ' ') }}</span>
            <span class="log-action">{{ log.action }}</span>
          </div>
        </div>
        <p v-else class="text-center text-secondary" style="padding: 20px">暂无日志</p>
      </div>
    </div>

    <div v-else class="text-center text-secondary" style="padding: 60px">加载中...</div>

    <ConfirmDialog
      v-if="showDeliveryConfirm"
      title="确认交付"
      message="确认此订单已交付给客户？"
      confirm-text="确认交付"
      @confirm="handleConfirmDelivery"
      @cancel="showDeliveryConfirm = false"
    />
  </Layout>
</template>

<style scoped>
.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-item.full {
  grid-column: span 2;
}

.info-label {
  font-size: 12px;
  color: var(--text-muted);
}

.info-value {
  font-size: 14px;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-card {
  background: var(--bg-input);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 16px;
}

.task-dept {
  font-weight: 600;
  font-size: 15px;
}

.log-list {
  display: flex;
  flex-direction: column;
}

.log-item {
  display: flex;
  gap: 16px;
  padding: 8px 0;
  border-bottom: 1px solid var(--border);
  font-size: 14px;
}

.log-item:last-child {
  border-bottom: none;
}

.log-time {
  color: var(--text-muted);
  white-space: nowrap;
  min-width: 140px;
}
</style>
