-- Create visitor_stats table for tracking website visitors
create table if not exists visitor_stats (
  id int primary key default 1,
  total_count int default 99235,
  updated_at timestamp with time zone default now(),
  constraint one_row check (id = 1)
);

-- Enable RLS
alter table visitor_stats enable row level security;

-- Policy: anyone can read
create policy "Allow public read" on visitor_stats
  for select
  using (true);

-- Policy: anyone can update (for incrementing count)
create policy "Allow public update" on visitor_stats
  for update
  using (true);

-- Policy: anyone can insert
create policy "Allow public insert" on visitor_stats
  for insert
  with check (true);
