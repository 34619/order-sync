-- =============================================
-- 工厂跟单系统 - 数据库 Schema
-- =============================================

-- 删除旧表
drop table if exists order_tasks cascade;
drop table if exists operation_logs cascade;
drop table if exists orders cascade;
drop table if exists customers cascade;
drop table if exists profiles cascade;

drop function if exists current_user_role();
drop function if exists generate_order_number(text);
drop function if exists update_order_status();

-- =============================================
-- 用户档案表 (扩展 auth.users)
-- =============================================
create table profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text not null,
  role text check (role in ('admin', 'office', 'cnc_program', 'cnc_machine', 'print_3d', 'workshop')) not null,
  tracker_code text check (tracker_code in ('A', 'B', 'C')),
  created_at timestamptz default now()
);

-- =============================================
-- 客户表
-- =============================================
create table customers (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  contact text,
  phone text,
  address text,
  notes text,
  created_by uuid references auth.users(id) not null,
  created_at timestamptz default now()
);

-- =============================================
-- 订单表
-- =============================================
create table orders (
  id uuid default gen_random_uuid() primary key,
  order_number text unique,
  customer_id uuid references customers(id),
  product_name text not null,
  product_spec text,
  quantity numeric not null,
  deadline date,
  priority text check (priority in ('normal', 'urgent')) default 'normal',
  notes text,
  status text check (status in ('pending_dispatch', 'programming', 'rough_machining', 'fine_machining', 'pending_delivery', 'delivered')) default 'pending_dispatch',
  created_by uuid references auth.users(id) not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =============================================
-- 部门任务表
-- =============================================
create table order_tasks (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references orders(id) on delete cascade not null,
  department text check (department in ('cnc_program', 'cnc_machine', 'print_3d', 'workshop')) not null,
  status text check (status in ('pending', 'in_progress', 'completed')) default 'pending',
  assigned_to uuid references auth.users(id),
  notes text,
  completed_at timestamptz,
  created_at timestamptz default now()
);

-- =============================================
-- 操作日志表
-- =============================================
create table operation_logs (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references orders(id) on delete cascade not null,
  user_id uuid references auth.users(id) not null,
  action text not null,
  created_at timestamptz default now()
);

-- =============================================
-- RLS 辅助函数
-- =============================================
create or replace function current_user_role()
returns text as $$
  select role from profiles where id = auth.uid();
$$ language sql stable security definer;

-- =============================================
-- 启用 RLS
-- =============================================
alter table profiles enable row level security;
alter table customers enable row level security;
alter table orders enable row level security;
alter table order_tasks enable row level security;
alter table operation_logs enable row level security;

-- =============================================
-- RLS 策略 - profiles
-- =============================================
create policy "用户查看自己档案" on profiles for select using (auth.uid() = id);
create policy "管理员查看所有档案" on profiles for select using (current_user_role() = 'admin');
create policy "管理员创建档案" on profiles for insert with check (current_user_role() = 'admin');
create policy "管理员更新档案" on profiles for update using (current_user_role() = 'admin');
create policy "管理员删除档案" on profiles for delete using (current_user_role() = 'admin');

-- =============================================
-- RLS 策略 - customers
-- =============================================
create policy "管理员和办公室查看客户" on customers for select using (current_user_role() in ('admin', 'office'));
create policy "管理员和办公室创建客户" on customers for insert with check (current_user_role() in ('admin', 'office'));
create policy "管理员和办公室更新客户" on customers for update using (current_user_role() in ('admin', 'office'));
create policy "管理员和办公室删除客户" on customers for delete using (current_user_role() in ('admin', 'office'));

-- =============================================
-- RLS 策略 - orders
-- =============================================
create policy "管理员和办公室查看订单" on orders for select using (current_user_role() in ('admin', 'office'));
create policy "部门查看有任务的订单" on orders for select using (
  exists (
    select 1 from order_tasks
    where order_tasks.order_id = orders.id
    and order_tasks.department = current_user_role()
  )
);
create policy "管理员和办公室创建订单" on orders for insert with check (current_user_role() in ('admin', 'office'));
create policy "管理员和办公室更新订单" on orders for update using (current_user_role() in ('admin', 'office'));
create policy "管理员和办公室删除订单" on orders for delete using (current_user_role() in ('admin', 'office'));

-- =============================================
-- RLS 策略 - order_tasks
-- =============================================
create policy "管理员和办公室查看所有任务" on order_tasks for select using (current_user_role() in ('admin', 'office'));
create policy "部门查看自己任务" on order_tasks for select using (
  current_user_role() = department
);
create policy "管理员和办公室创建任务" on order_tasks for insert with check (current_user_role() in ('admin', 'office'));
create policy "管理员和办公室更新任务" on order_tasks for update using (current_user_role() in ('admin', 'office'));
create policy "部门更新自己任务" on order_tasks for update using (
  current_user_role() = department
);
create policy "管理员和办公室删除任务" on order_tasks for delete using (current_user_role() in ('admin', 'office'));

-- =============================================
-- RLS 策略 - operation_logs
-- =============================================
create policy "管理员和办公室查看日志" on operation_logs for select using (current_user_role() in ('admin', 'office'));
create policy "部门查看有任务的订单日志" on operation_logs for select using (
  exists (
    select 1 from order_tasks
    where order_tasks.order_id = operation_logs.order_id
    and order_tasks.department = current_user_role()
  )
);
create policy "参与订单的用户创建日志" on operation_logs for insert with check (
  auth.uid() = user_id
  and (
    current_user_role() in ('admin', 'office')
    or exists (
      select 1 from order_tasks
      where order_tasks.order_id = operation_logs.order_id
      and order_tasks.department = current_user_role()
    )
  )
);

-- =============================================
-- 订单号生成函数
-- =============================================
create or replace function generate_order_number(tracker_code text)
returns text as $$
declare
  today_prefix text;
  seq_num int;
begin
  -- 格式: A518-1 (tracker_code + 月日 + 序号)
  today_prefix := tracker_code || to_char(now(), 'FMMD') || to_char(now(), 'DD');
  -- 查找今天的最大序号
  select coalesce(
    max(
      cast(
        split_part(order_number, '-', 2) as int
      )
    ), 0
  ) + 1 into seq_num
  from orders
  where order_number like today_prefix || '-%';
  return today_prefix || '-' || seq_num::text;
end;
$$ language plpgsql;

-- =============================================
-- 订单号自动生成触发器
-- =============================================
create or replace function set_order_number()
returns trigger as $$
declare
  tc text;
begin
  if new.order_number is null then
    select tracker_code into tc from profiles where id = new.created_by;
    if tc is not null then
      new.order_number := generate_order_number(tc);
    else
      -- 管理员创建的订单用 X 前缀
      new.order_number := generate_order_number('X');
    end if;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trigger_set_order_number
  before insert on orders
  for each row execute function set_order_number();

-- =============================================
-- 订单状态自动更新触发器
-- =============================================
create or replace function update_order_status()
returns trigger as $$
declare
  has_cnc_program boolean;
  has_machining boolean;
  has_workshop boolean;
  cnc_program_done boolean;
  all_machining_done boolean;
  workshop_done boolean;
  all_done boolean;
  new_status text;
begin
  -- 检查各类任务是否存在及完成情况
  select exists(select 1 from order_tasks where order_id = coalesce(new.order_id, old.order_id) and department = 'cnc_program') into has_cnc_program;
  select exists(select 1 from order_tasks where order_id = coalesce(new.order_id, old.order_id) and department in ('cnc_machine', 'print_3d')) into has_machining;
  select exists(select 1 from order_tasks where order_id = coalesce(new.order_id, old.order_id) and department = 'workshop') into has_workshop;

  select not exists(select 1 from order_tasks where order_id = coalesce(new.order_id, old.order_id) and department = 'cnc_program' and status != 'completed') into cnc_program_done;
  select not exists(select 1 from order_tasks where order_id = coalesce(new.order_id, old.order_id) and department in ('cnc_machine', 'print_3d') and status != 'completed') into all_machining_done;
  select not exists(select 1 from order_tasks where order_id = coalesce(new.order_id, old.order_id) and department = 'workshop' and status != 'completed') into workshop_done;
  select not exists(select 1 from order_tasks where order_id = coalesce(new.order_id, old.order_id) and status != 'completed') into all_done;

  -- 确定新状态
  if all_done then
    new_status := 'pending_delivery';
  elsif has_workshop and not workshop_done then
    -- 如果有车间任务且未完成
    if (not has_cnc_program or cnc_program_done) and (not has_machining or all_machining_done) then
      new_status := 'fine_machining';
    elsif has_cnc_program and not cnc_program_done then
      new_status := 'programming';
    else
      new_status := 'rough_machining';
    end if;
  elsif has_machining and not all_machining_done then
    if has_cnc_program and not cnc_program_done then
      new_status := 'programming';
    else
      new_status := 'rough_machining';
    end if;
  elsif has_cnc_program and not cnc_program_done then
    new_status := 'programming';
  else
    new_status := 'pending_delivery';
  end if;

  -- 更新订单状态（不覆盖 delivered）
  update orders
  set status = new_status, updated_at = now()
  where id = coalesce(new.order_id, old.order_id)
    and status != 'delivered';

  return coalesce(new, old);
end;
$$ language plpgsql;

create trigger trigger_update_order_status
  after insert or update or delete on order_tasks
  for each row execute function update_order_status();

-- =============================================
-- updated_at 自动更新
-- =============================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trigger_orders_updated_at
  before update on orders
  for each row execute function update_updated_at();
