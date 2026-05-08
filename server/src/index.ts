import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { supabase } from './supabase'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001
const VALID_ROLES = ['admin', 'office', 'cnc_program', 'cnc_machine', 'print_3d', 'workshop']

app.use(cors())
app.use(express.json())

// 验证 JWT 并检查管理员权限
async function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未授权' })
  }

  const token = authHeader.slice(7)
  const { data: { user }, error } = await supabase.auth.getUser(token)

  if (error || !user) {
    return res.status(401).json({ error: '无效的令牌' })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    return res.status(403).json({ error: '需要管理员权限' })
  }

  ;(req as any).userId = user.id
  next()
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// 创建用户（管理员）
app.post('/api/users', requireAdmin, async (req, res) => {
  const { email, password, username, role, tracker_code } = req.body

  if (!email || !password || !username || !role) {
    return res.status(400).json({ error: '缺少必填字段' })
  }

  if (!VALID_ROLES.includes(role)) {
    return res.status(400).json({ error: '无效的角色' })
  }

  if (role === 'office' && !['A', 'B', 'C'].includes(tracker_code)) {
    return res.status(400).json({ error: '办公室角色需要有效的编号 (A/B/C)' })
  }

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  })

  if (authError || !authData.user) {
    return res.status(400).json({ error: authError?.message || '创建用户失败' })
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: authData.user.id,
      email,
      username,
      role,
      tracker_code: role === 'office' ? tracker_code : null
    })

  if (profileError) {
    await supabase.auth.admin.deleteUser(authData.user.id)
    return res.status(400).json({ error: profileError.message })
  }

  res.json({ success: true, user: { id: authData.user.id, email } })
})

// 获取所有用户（管理员）
app.get('/api/users', requireAdmin, async (_req, res) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  res.json(data)
})

// 删除用户（管理员）
app.delete('/api/users/:id', requireAdmin, async (req, res) => {
  const { id } = req.params
  const adminId = (req as any).userId

  if (id === adminId) {
    return res.status(400).json({ error: '不能删除自己' })
  }

  await supabase.from('profiles').delete().eq('id', id)
  const { error } = await supabase.auth.admin.deleteUser(id)

  if (error) {
    return res.status(400).json({ error: error.message })
  }

  res.json({ success: true })
})

// 重置用户密码（管理员）
app.patch('/api/users/:id/reset-password', requireAdmin, async (req, res) => {
  const { id } = req.params
  const { password } = req.body

  if (!password || password.length < 6) {
    return res.status(400).json({ error: '密码至少6位' })
  }

  const { error } = await supabase.auth.admin.updateUserById(id, { password })

  if (error) {
    return res.status(400).json({ error: error.message })
  }

  res.json({ success: true })
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
