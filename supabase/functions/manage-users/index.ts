import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const authHeader = req.headers.get("authorization")
  if (!authHeader) return new Response(JSON.stringify({ error: "未授权" }), { status: 401, headers: corsHeaders })

  const token = authHeader.replace("Bearer ", "")
  const { data: { user } } = await supabase.auth.getUser(token)
  if (!user) return new Response(JSON.stringify({ error: "无效令牌" }), { status: 401, headers: corsHeaders })

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  if (!profile || profile.role !== "admin") return new Response(JSON.stringify({ error: "需要管理员权限" }), { status: 403, headers: corsHeaders })

  const url = new URL(req.url)
  const path = url.pathname
  const body = req.method !== "GET" ? await req.json().catch(() => ({})) : {}

  try {
    if (req.method === "GET" && path.endsWith("/users")) {
      const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false })
      if (error) throw error
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } })
    }

    if (req.method === "POST" && path.endsWith("/users")) {
      const { email, password, username, role, tracker_code } = body
      if (!email || !password || !username || !role) throw new Error("缺少必填字段")

      const validRoles = ["admin", "office", "cnc_program", "cnc_machine", "print_3d", "workshop"]
      if (!validRoles.includes(role)) throw new Error("无效的角色")

      const { data: authData, error: authError } = await supabase.auth.admin.createUser({ email, password, email_confirm: true })
      if (authError || !authData.user) throw new Error(authError?.message || "创建用户失败")

      const { error: profileError } = await supabase.from("profiles").insert({
        id: authData.user.id, email, username, role,
        tracker_code: role === "office" ? tracker_code : null
      })
      if (profileError) {
        await supabase.auth.admin.deleteUser(authData.user.id)
        throw profileError
      }

      return new Response(JSON.stringify({ success: true, user: { id: authData.user.id, email } }), { headers: { ...corsHeaders, "Content-Type": "application/json" } })
    }

    if (req.method === "DELETE" && path.includes("/users/")) {
      const id = path.split("/users/")[1]
      if (id === user.id) throw new Error("不能删除自己")
      await supabase.from("profiles").delete().eq("id", id)
      const { error } = await supabase.auth.admin.deleteUser(id)
      if (error) throw error
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } })
    }

    if (req.method === "PATCH" && path.includes("/reset-password")) {
      const id = path.split("/users/")[1].split("/")[0]
      const { password } = body
      if (!password || password.length < 6) throw new Error("密码至少6位")
      const { error } = await supabase.auth.admin.updateUserById(id, { password })
      if (error) throw error
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } })
    }

    return new Response(JSON.stringify({ error: "未找到" }), { status: 404, headers: corsHeaders })
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 400, headers: corsHeaders })
  }
})
