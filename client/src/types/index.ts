export type Role = 'admin' | 'office' | 'cnc_program' | 'cnc_machine' | 'print_3d' | 'workshop'
export type TrackerCode = 'A' | 'B' | 'C'
export type OrderStatus = 'pending_dispatch' | 'programming' | 'rough_machining' | 'fine_machining' | 'pending_delivery' | 'delivered'
export type TaskStatus = 'pending' | 'in_progress' | 'completed'
export type Department = 'cnc_program' | 'cnc_machine' | 'print_3d' | 'workshop'
export type Priority = 'normal' | 'urgent'

export interface Profile {
  id: string
  email: string | null
  username: string
  role: Role
  tracker_code: TrackerCode | null
  created_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_name: string
  product_spec: string | null
  quantity: number
  material: string | null
  drawing_name: string | null
  surface_req: string | null
  dimensions: string | null
  image_url: string | null
  created_at: string
}

export interface Order {
  id: string
  order_number: string | null
  customer_id: string | null
  deadline: string | null
  priority: Priority
  notes: string | null
  status: OrderStatus
  created_by: string
  created_at: string
  updated_at: string
  items?: OrderItem[]
  tasks?: OrderTask[]
}

export interface OrderTask {
  id: string
  order_id: string
  department: Department
  status: TaskStatus
  assigned_to: string | null
  notes: string | null
  completed_at: string | null
  created_at: string
}

export interface OperationLog {
  id: string
  order_id: string
  user_id: string
  action: string
  created_at: string
  username?: string
}

export const ROLE_LABELS: Record<Role, string> = {
  admin: '管理员',
  office: '办公室跟单',
  cnc_program: 'CNC编程',
  cnc_machine: 'CNC加工',
  print_3d: '3D打印',
  workshop: '车间加工'
}

export const STATUS_LABELS: Record<OrderStatus, string> = {
  pending_dispatch: '待派单',
  programming: '编程中',
  rough_machining: '粗加工中',
  fine_machining: '细加工中',
  pending_delivery: '待交付',
  delivered: '已交付'
}

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  pending: '待处理',
  in_progress: '进行中',
  completed: '已完成'
}

export const DEPARTMENT_LABELS: Record<Department, string> = {
  cnc_program: 'CNC编程',
  cnc_machine: 'CNC加工',
  print_3d: '3D打印',
  workshop: '车间加工'
}
