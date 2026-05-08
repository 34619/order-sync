<script setup lang="ts">
import { computed } from 'vue'
import { STATUS_LABELS, TASK_STATUS_LABELS } from '../types'
import type { OrderStatus, TaskStatus } from '../types'

const props = defineProps<{
  status: OrderStatus | TaskStatus
  type?: 'order' | 'task'
}>()

const label = computed(() => {
  if (props.type === 'task') {
    return TASK_STATUS_LABELS[props.status as TaskStatus] || props.status
  }
  return STATUS_LABELS[props.status as OrderStatus] || props.status
})

const badgeClass = computed(() => {
  const map: Record<string, string> = {
    // 订单状态
    pending_dispatch: 'badge-default',
    programming: 'badge-info',
    rough_machining: 'badge-warning',
    fine_machining: 'badge-purple',
    pending_delivery: 'badge-success',
    delivered: 'badge-success',
    // 任务状态
    pending: 'badge-default',
    in_progress: 'badge-info',
    completed: 'badge-success'
  }
  return map[props.status] || 'badge-default'
})
</script>

<template>
  <span class="badge" :class="badgeClass">{{ label }}</span>
</template>
