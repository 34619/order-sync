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
    deadline: string | null
    priority: string
    items?: { product_name: string }[]
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
    const auth = useAuthStore()

    // 获取当前任务信息
    const { data: currentTask } = await supabase
      .from('order_tasks')
      .select('order_id, department')
      .eq('id', taskId)
      .single()

    await updateTaskStatus(taskId, 'completed', notes)

    // 检查是否需要自动创建车间任务
    if (currentTask && ['cnc_machine', 'print_3d'].includes(currentTask.department)) {
      // 查询该订单所有加工类任务
      const { data: allTasks } = await supabase
        .from('order_tasks')
        .select('department, status')
        .eq('order_id', currentTask.order_id)
        .in('department', ['cnc_machine', 'print_3d'])

      // 查询是否已有车间任务
      const { data: existingWorkshop } = await supabase
        .from('order_tasks')
        .select('id')
        .eq('order_id', currentTask.order_id)
        .eq('department', 'workshop')

      // 所有加工任务完成 + 还没有车间任务 → 自动创建
      const allDone = allTasks?.every(t => t.status === 'completed')
      if (allDone && (!existingWorkshop || existingWorkshop.length === 0)) {
        await supabase.from('order_tasks').insert({
          order_id: currentTask.order_id,
          department: 'workshop'
        })
        try {
          await supabase.from('operation_logs').insert({
            order_id: currentTask.order_id,
            user_id: auth.user!.id,
            action: '加工完成，自动下发车间任务'
          })
        } catch { /* 忽略日志错误 */ }
      }
    }

    await fetchMyTasks()
  }

  return { tasks, loading, fetchMyTasks, updateTaskStatus, startTask, completeTask }
})
