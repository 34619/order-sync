-- 订单表
create table if not exists orders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  symbol text not null,
  side text check (side in ('buy', 'sell')) not null,
  quantity numeric not null,
  price numeric not null,
  status text check (status in ('pending', 'filled', 'cancelled')) default 'pending',
  created_at timestamptz default now()
);

-- 跟单策略表
create table if not exists strategies (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  description text default '',
  source_account text not null,
  multiplier numeric default 1,
  max_position numeric default 1000,
  stop_loss numeric default 5,
  take_profit numeric default 10,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- 启用 RLS
alter table orders enable row level security;
alter table strategies enable row level security;

-- RLS 策略：用户只能操作自己的数据
create policy "用户可查看自己的订单" on orders for select using (auth.uid() = user_id);
create policy "用户可创建订单" on orders for insert with check (auth.uid() = user_id);
create policy "用户可更新自己的订单" on orders for update using (auth.uid() = user_id);
create policy "用户可删除自己的订单" on orders for delete using (auth.uid() = user_id);

create policy "用户可查看自己的策略" on strategies for select using (auth.uid() = user_id);
create policy "用户可创建策略" on strategies for insert with check (auth.uid() = user_id);
create policy "用户可更新自己的策略" on strategies for update using (auth.uid() = user_id);
create policy "用户可删除自己的策略" on strategies for delete using (auth.uid() = user_id);
