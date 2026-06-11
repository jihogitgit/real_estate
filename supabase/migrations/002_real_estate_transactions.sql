-- pg_trgm extension for fuzzy building name search
create extension if not exists pg_trgm;

-- ============================================================
-- regions (법정동코드 시군구 단위)
-- ============================================================
create table regions (
  lawd_cd   char(5)  primary key,
  sido_nm   text     not null,
  sigungu_nm text    not null,
  full_nm   text     not null
);

-- ============================================================
-- apt_trades (아파트 매매)
-- ============================================================
create table apt_trades (
  id           bigserial    primary key,
  lawd_cd      char(5)      not null references regions(lawd_cd),
  request_ym   char(6)      not null check (request_ym ~ '^[0-9]{6}$'),
  umd_nm       text,
  apt_dong     text,
  jibun        text,
  bonbun       text,
  bubun        text,
  apt_nm       text,
  apt_seq      text,
  build_year   integer,
  area         numeric(10,3),
  floor        integer,
  price        integer      not null check (price >= 0),
  deal_date    date         not null,
  road_nm      text,
  dealing_gbn  text,
  rgst_date    text,
  buyer_gbn    text,
  seller_gbn   text,
  source_api   text         not null,
  source_hash  text         not null,
  raw_item     jsonb,
  fetched_at   timestamptz  default now(),
  updated_at   timestamptz  default now(),
  unique (source_api, source_hash)
);

create index apt_trades_lawd_cd_deal_date on apt_trades (lawd_cd, deal_date desc);
create index apt_trades_apt_nm_trgm on apt_trades using gin (apt_nm gin_trgm_ops);
create index apt_trades_area_date on apt_trades (area, deal_date desc);

create trigger set_apt_trades_updated_at
  before update on apt_trades
  for each row execute function update_updated_at();

-- ============================================================
-- apt_rents (아파트 전월세)
-- ============================================================
create table apt_rents (
  id               bigserial    primary key,
  lawd_cd          char(5)      not null references regions(lawd_cd),
  request_ym       char(6)      not null check (request_ym ~ '^[0-9]{6}$'),
  umd_nm           text,
  apt_dong         text,
  jibun            text,
  apt_nm           text,
  apt_seq          text,
  build_year       integer,
  area             numeric(10,3),
  floor            integer,
  deposit          integer      not null check (deposit >= 0),
  monthly_rent     integer      not null check (monthly_rent >= 0),
  deal_date        date         not null,
  contract_type    text,
  contract_term    text,
  use_rr_right     text,
  prev_deposit     integer,
  prev_monthly_rent integer,
  source_api       text         not null,
  source_hash      text         not null,
  raw_item         jsonb,
  fetched_at       timestamptz  default now(),
  updated_at       timestamptz  default now(),
  unique (source_api, source_hash)
);

create index apt_rents_lawd_cd_deal_date on apt_rents (lawd_cd, deal_date desc);
create index apt_rents_apt_nm_trgm on apt_rents using gin (apt_nm gin_trgm_ops);
create index apt_rents_area_date on apt_rents (area, deal_date desc);

create trigger set_apt_rents_updated_at
  before update on apt_rents
  for each row execute function update_updated_at();

-- ============================================================
-- offi_trades (오피스텔 매매)
-- ============================================================
create table offi_trades (
  id           bigserial    primary key,
  lawd_cd      char(5)      not null references regions(lawd_cd),
  request_ym   char(6)      not null check (request_ym ~ '^[0-9]{6}$'),
  umd_nm       text,
  jibun        text,
  offi_nm      text,
  build_year   integer,
  area         numeric(10,3),
  floor        integer,
  price        integer      not null check (price >= 0),
  deal_date    date         not null,
  dealing_gbn  text,
  source_api   text         not null,
  source_hash  text         not null,
  raw_item     jsonb,
  fetched_at   timestamptz  default now(),
  updated_at   timestamptz  default now(),
  unique (source_api, source_hash)
);

create index offi_trades_lawd_cd_deal_date on offi_trades (lawd_cd, deal_date desc);
create index offi_trades_offi_nm_trgm on offi_trades using gin (offi_nm gin_trgm_ops);
create index offi_trades_complex_area_date on offi_trades (offi_nm, area, deal_date desc);

create trigger set_offi_trades_updated_at
  before update on offi_trades
  for each row execute function update_updated_at();

-- ============================================================
-- offi_rents (오피스텔 전월세)
-- ============================================================
create table offi_rents (
  id               bigserial    primary key,
  lawd_cd          char(5)      not null references regions(lawd_cd),
  request_ym       char(6)      not null check (request_ym ~ '^[0-9]{6}$'),
  umd_nm           text,
  jibun            text,
  offi_nm          text,
  build_year       integer,
  area             numeric(10,3),
  floor            integer,
  deposit          integer      not null check (deposit >= 0),
  monthly_rent     integer      not null check (monthly_rent >= 0),
  deal_date        date         not null,
  contract_type    text,
  contract_term    text,
  use_rr_right     text,
  prev_deposit     integer,
  prev_monthly_rent integer,
  source_api       text         not null,
  source_hash      text         not null,
  raw_item         jsonb,
  fetched_at       timestamptz  default now(),
  updated_at       timestamptz  default now(),
  unique (source_api, source_hash)
);

create index offi_rents_lawd_cd_deal_date on offi_rents (lawd_cd, deal_date desc);
create index offi_rents_offi_nm_trgm on offi_rents using gin (offi_nm gin_trgm_ops);
create index offi_rents_complex_area_date on offi_rents (offi_nm, area, deal_date desc);

create trigger set_offi_rents_updated_at
  before update on offi_rents
  for each row execute function update_updated_at();

-- ============================================================
-- multi_trades (다세대/연립 매매)
-- ============================================================
create table multi_trades (
  id           bigserial    primary key,
  lawd_cd      char(5)      not null references regions(lawd_cd),
  request_ym   char(6)      not null check (request_ym ~ '^[0-9]{6}$'),
  umd_nm       text,
  jibun        text,
  bonbun       text,
  bubun        text,
  house_nm     text,
  build_year   integer,
  area         numeric(10,3),
  floor        integer,
  price        integer      not null check (price >= 0),
  deal_date    date         not null,
  dealing_gbn  text,
  rgst_date    text,
  buyer_gbn    text,
  seller_gbn   text,
  source_api   text         not null,
  source_hash  text         not null,
  raw_item     jsonb,
  fetched_at   timestamptz  default now(),
  updated_at   timestamptz  default now(),
  unique (source_api, source_hash)
);

create index multi_trades_lawd_cd_deal_date on multi_trades (lawd_cd, deal_date desc);
create index multi_trades_house_nm_trgm on multi_trades using gin (house_nm gin_trgm_ops);
create index multi_trades_complex_area_date on multi_trades (house_nm, area, deal_date desc);

create trigger set_multi_trades_updated_at
  before update on multi_trades
  for each row execute function update_updated_at();

-- ============================================================
-- multi_rents (다세대/연립 전월세)
-- ============================================================
create table multi_rents (
  id               bigserial    primary key,
  lawd_cd          char(5)      not null references regions(lawd_cd),
  request_ym       char(6)      not null check (request_ym ~ '^[0-9]{6}$'),
  umd_nm           text,
  jibun            text,
  house_nm         text,
  build_year       integer,
  area             numeric(10,3),
  floor            integer,
  deposit          integer      not null check (deposit >= 0),
  monthly_rent     integer      not null check (monthly_rent >= 0),
  deal_date        date         not null,
  contract_type    text,
  contract_term    text,
  use_rr_right     text,
  prev_deposit     integer,
  prev_monthly_rent integer,
  source_api       text         not null,
  source_hash      text         not null,
  raw_item         jsonb,
  fetched_at       timestamptz  default now(),
  updated_at       timestamptz  default now(),
  unique (source_api, source_hash)
);

create index multi_rents_lawd_cd_deal_date on multi_rents (lawd_cd, deal_date desc);
create index multi_rents_house_nm_trgm on multi_rents using gin (house_nm gin_trgm_ops);
create index multi_rents_complex_area_date on multi_rents (house_nm, area, deal_date desc);

create trigger set_multi_rents_updated_at
  before update on multi_rents
  for each row execute function update_updated_at();

-- ============================================================
-- UNION ALL view for unified querying
-- ============================================================
create or replace view real_estate_transactions as
  select
    id, lawd_cd, request_ym, deal_date, area, floor,
    price, null::integer as deposit, null::integer as monthly_rent,
    coalesce(apt_nm, '') as complex_nm,
    'apt_trades' as table_name, 'trade' as deal_kind
  from apt_trades
union all
  select
    id, lawd_cd, request_ym, deal_date, area, floor,
    null, deposit, monthly_rent,
    coalesce(apt_nm, ''),
    'apt_rents', 'rent'
  from apt_rents
union all
  select
    id, lawd_cd, request_ym, deal_date, area, floor,
    price, null, null,
    coalesce(offi_nm, ''),
    'offi_trades', 'trade'
  from offi_trades
union all
  select
    id, lawd_cd, request_ym, deal_date, area, floor,
    null, deposit, monthly_rent,
    coalesce(offi_nm, ''),
    'offi_rents', 'rent'
  from offi_rents
union all
  select
    id, lawd_cd, request_ym, deal_date, area, floor,
    price, null, null,
    coalesce(house_nm, ''),
    'multi_trades', 'trade'
  from multi_trades
union all
  select
    id, lawd_cd, request_ym, deal_date, area, floor,
    null, deposit, monthly_rent,
    coalesce(house_nm, ''),
    'multi_rents', 'rent'
  from multi_rents;
