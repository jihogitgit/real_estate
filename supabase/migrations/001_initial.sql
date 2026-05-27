create extension if not exists "uuid-ossp";

create table apartments (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  region text not null,
  district text,
  address text,
  lat double precision,
  lng double precision,
  supply_date date,
  apply_start date,
  apply_end date,
  total_units integer,
  min_price integer,
  max_price integer,
  source_id text unique not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table articles (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  title text not null,
  summary text,
  body text,
  category text not null check (category in ('news', 'guide')),
  published_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  nickname text,
  push_token text,
  created_at timestamptz default now()
);

create table saved_apartments (
  user_id uuid references users(id) on delete cascade,
  apartment_id uuid references apartments(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, apartment_id)
);

create table alerts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  apartment_id uuid references apartments(id) on delete cascade,
  alert_days_before integer not null default 1,
  is_active boolean not null default true,
  unique (user_id, apartment_id, alert_days_before)
);

-- 성능 인덱스
create index idx_apartments_region on apartments(region);
create index idx_apartments_apply_start on apartments(apply_start);
create index idx_apartments_apply_end on apartments(apply_end);
create index idx_articles_category on articles(category);
create index idx_articles_published_at on articles(published_at desc);
create index idx_alerts_user_id on alerts(user_id);
create index idx_alerts_active on alerts(is_active) where is_active = true;

-- updated_at 자동 갱신 함수
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger apartments_updated_at
  before update on apartments
  for each row execute function update_updated_at();

create trigger articles_updated_at
  before update on articles
  for each row execute function update_updated_at();
