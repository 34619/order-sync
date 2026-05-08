import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '../lib/supabase'
import { useAuthStore } from './auth'
import { DEPARTMENT_LABELS } from '../types'
import type { OrderTask, TaskStatus, Department } from '../types'

interface TaskWithOrder extends OrderTask {
  order?: {
    id: string
    order_number: string | null
    product_name: string
    deadline: string | null
    priority: string
    customer?: { name: string } | null
  }
}

const TASK_STATUS_LABELS: Record<string, string> = {
  in_progress: '开始处理',
  completed: '完成',
  pending: '重置'
}

async function writeLog(orderId: string, department: Department, status: TaskStatus) {
  const auth = useAuthStore()
  const deptLabel = DEPARTMENT_LABELS[department] || department
  const action = TASK_STATUS_LABELS[status] || status
  try {
    await supabase.from('operation_logs').insert({
      order_id: orderId,
      user_id: auth.user!.id,
      action: `${deptLabel}: ${action}`
    })
  } catch { /* 日志记录失败不影响主流程 */ }
}

export const useTasksStore = defineStore('tasks', () => {
  const tasks = ref<TaskWithOrder[]>([])
  const loading = ref(false)

  async function fetchMyTasks(statusFilter?: string) {
    loading.value = true
    const auth = useAuthStore()
    const role = auth.profile?.role

    let query = supabase
      .from('order_tasks')
      .select('*, order:orders(id, order_number, deadline, priority, items:order_items(product_name), customer:customers(name))')
      .eq('department', role)
      .order('created_at', { ascending: false })

    if (statusFilter) {
      query = query.eq('status', statusFilter)
    }

    const { data } = await query
    tasks.value = (data as TaskWithOrder[]) || []
    loading.value = false
  }

  async function updateTaskStatus(taskId: string, status: TaskStatus, notes?: string) {
    const auth = useAuthStore()
    const update: Record<string, unknown> = { status }
    if (status === 'completed') {
      update.completed_at = new Date().toISOString()
      update.assigned_to = auth.user!.id
    }
    if (status === 'in_progress') {
      update.assigned_to = auth.user!.id
    }
    if (notes !== undefined) {
      update.notes = notes
    }

    const { data: task } = await supabase
      .from('order_tasks')
      .select('order_id, department')
      .eq('id', taskId)
      .single()

    await supabase.from('order_tasks').update(update).eq('id', taskId)

    if (task) {
      await writeLog(task.order_id, task.department as Department, status)
    }
  }

  async function startTask(taskId: string) {
    await updateTaskStatus(taskId, 'in_progress')
    await fetchMyTasks()
  }

  async function completeTask(taskId: string, notes?: string) {
    await updateTaskStatus(taskId, 'completed', notes)
    await fetchMyTasks()
  }

  return { tasks, loading, fetchMyTasks, updateTaskStatus, startTask, completeTask }
})
