import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '../lib/supabase'
import type { OperationLog } from '../types'

interface LogWithUser extends OperationLog {
  user?: { username: string } | null
  order?: { order_number: string | null } | null
}

export const useLogsStore = defineStore('logs', () => {
  const logs = ref<LogWithUser[]>([])
  const loading = ref(false)

  async function fetchLogs(orderId?: string) {
    loading.value = true
    let query = supabase
      .from('operation_logs')
      .select('*, order:orders(order_number)')
      .order('created_at', { ascending: false })
      .limit(200)

    if (orderId) {
      query = query.eq('order_id', orderId)
    }

    const { data } = await query
    logs.value = (data as LogWithUser[]) || []
    loading.value = false
  }

  return { logs, loading, fetchLogs }
})
