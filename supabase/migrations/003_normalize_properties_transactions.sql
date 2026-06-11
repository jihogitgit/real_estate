-- Drop old 6-table schema (all tables are empty, safe to drop)
drop view if exists real_estate_transactions;
drop table if exists apt_trades cascade;
drop table if exists apt_rents cascade;
drop table if exists offi_trades cascade;
drop table if exists offi_rents cascade;
drop table if exists multi_trades cascade;
drop table if exists multi_rents cascade;

-- ============================================================
-- enums
-- ============================================================
create type property_type as enum ('apartment', 'officetel', 'villa');
create type deal_kind     as enum ('trade', 'jeonse', 'monthly_rent');

-- ============================================================
-- properties
-- ============================================================
create table properties (
  id            bigserial     primary key,
  property_key  text          not null unique,   -- md5(lawd_cd|name|type|build_year)
  type          property_type not null,
  name          text          not null,
  lawd_cd       char(5)       not null references regions(lawd_cd),
  umd_nm        text,
  jibun         text,
  bonbun        text,
  bubun         text,
  road_nm       text,
  build_year    integer,
  apt_seq       text,                            -- RTMS 단지코드 (아파트만)
  created_at    timestamptz   default now(),
  updated_at    timestamptz   default now()
);

create index properties_lawd_cd   on properties (lawd_cd);
create index properties_type      on properties (type);
create index properties_apt_seq   on properties (apt_seq) where apt_seq is not null;
create index properties_name_trgm on properties using gin (name gin_trgm_ops);

create trigger set_properties_updated_at
  before update on properties
  for each row execute function update_updated_at();

-- ============================================================
-- transactions
-- ============================================================
create table transactions (
  id                bigserial   primary key,
  property_id       bigint      not null references properties(id),
  deal_kind         deal_kind   not null,
  area              numeric(10,3),
  floor             integer,
  deal_date         date        not null,
  request_ym        char(6)     not null check (request_ym ~ '^[0-9]{6}$'),
  price             integer     check (price is null or price >= 0),
  deposit           integer     check (deposit is null or deposit >= 0),
  monthly_rent      integer     check (monthly_rent is null or monthly_rent >= 0),
  dealing_gbn       text,
  contract_type     text,
  contract_term     text,
  use_rr_right      text,
  prev_deposit      integer,
  prev_monthly_rent integer,
  rgst_date         text,
  buyer_gbn         text,
  seller_gbn        text,
  source_api        text        not null,
  source_hash       text        not null,
  raw_item          jsonb,
  fetched_at        timestamptz default now(),
  updated_at        timestamptz default now(),
  unique (source_api, source_hash)
);

create index transactions_property_id       on transactions (property_id);
create index transactions_deal_date         on transactions (deal_date desc);
create index transactions_property_date     on transactions (property_id, deal_date desc);
create index transactions_deal_kind         on transactions (deal_kind);

create trigger set_transactions_updated_at
  before update on transactions
  for each row execute function update_updated_at();

-- ============================================================
-- view for unified querying
-- ============================================================
create or replace view real_estate_transactions as
  select
    t.id,
    p.lawd_cd,
    t.request_ym,
    t.deal_date,
    t.area,
    t.floor,
    t.deal_kind,
    t.price,
    t.deposit,
    t.monthly_rent,
    p.name    as complex_nm,
    p.type    as property_type,
    p.umd_nm,
    p.build_year
  from transactions t
  join properties p on p.id = t.property_id;
