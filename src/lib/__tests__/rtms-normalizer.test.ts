import { describe, it, expect } from 'vitest'
import {
  parsePrice,
  makeDealDate,
  makeSourceHash,
  normalizeAptTrade,
  normalizeAptRent,
  normalizeOffiTrade,
  normalizeMultiTrade,
} from '@/lib/rtms-normalizer'

describe('parsePrice', () => {
  it('parses comma-formatted integer', () => {
    expect(parsePrice('55,000')).toBe(55000)
  })
  it('returns 0 for empty/undefined', () => {
    expect(parsePrice(undefined)).toBe(0)
    expect(parsePrice('')).toBe(0)
  })
  it('handles no comma', () => {
    expect(parsePrice('5000')).toBe(5000)
  })
})

describe('makeDealDate', () => {
  it('zero-pads month and day', () => {
    expect(makeDealDate('2024', '4', '3')).toBe('2024-04-03')
  })
  it('handles already-padded values', () => {
    expect(makeDealDate('2024', '11', '25')).toBe('2024-11-25')
  })
})

describe('makeSourceHash', () => {
  it('produces consistent MD5 hex string', () => {
    const hash = makeSourceHash(['11110', '2024-04-03', 'TestApt', '84.99', '5', '55000', '123'])
    expect(hash).toMatch(/^[a-f0-9]{32}$/)
  })
  it('same inputs produce same hash', () => {
    const a = makeSourceHash(['11110', '2024-04-03', 'TestApt', '84.99', '5', '55000', '123'])
    const b = makeSourceHash(['11110', '2024-04-03', 'TestApt', '84.99', '5', '55000', '123'])
    expect(a).toBe(b)
  })
  it('different inputs produce different hashes', () => {
    const a = makeSourceHash(['11110', '2024-04-03', 'TestApt', '84.99', '5', '55000', '123'])
    const b = makeSourceHash(['11110', '2024-04-03', 'OtherApt', '84.99', '5', '55000', '123'])
    expect(a).not.toBe(b)
  })
})

describe('normalizeAptTrade', () => {
  const item = {
    법정동: '역삼동',
    아파트: '역삼래미안',
    건축년도: '2003',
    전용면적: '84.927',
    층: '5',
    거래금액: '55,000',
    년: '2024',
    월: '4',
    일: '3',
  }

  it('maps all fields correctly', () => {
    const row = normalizeAptTrade(item, '11680', '202404', 'getRTMSDataSvcAptTradeDev')
    expect(row.lawd_cd).toBe('11680')
    expect(row.request_ym).toBe('202404')
    expect(row.umd_nm).toBe('역삼동')
    expect(row.apt_nm).toBe('역삼래미안')
    expect(row.build_year).toBe(2003)
    expect(row.area).toBeCloseTo(84.927)
    expect(row.floor).toBe(5)
    expect(row.price).toBe(55000)
    expect(row.deal_date).toBe('2024-04-03')
    expect(row.source_api).toBe('getRTMSDataSvcAptTradeDev')
    expect(row.source_hash).toMatch(/^[a-f0-9]{32}$/)
  })

  it('price falls back to 0 when 거래금액 absent', () => {
    const row = normalizeAptTrade({ 년: '2024', 월: '4', 일: '3' }, '11680', '202404', 'getRTMSDataSvcAptTradeDev')
    expect(row.price).toBe(0)
  })
})

describe('normalizeAptRent', () => {
  const item = {
    법정동: '역삼동',
    아파트: '역삼래미안',
    건축년도: '2003',
    전용면적: '84.927',
    층: '5',
    보증금액: '30,000',
    월세금액: '100',
    년: '2024',
    월: '4',
    일: '3',
  }

  it('maps deposit and monthly_rent', () => {
    const row = normalizeAptRent(item, '11680', '202404', 'getRTMSDataSvcAptRent')
    expect(row.deposit).toBe(30000)
    expect(row.monthly_rent).toBe(100)
  })
})

describe('normalizeOffiTrade', () => {
  it('uses 단지명 for offi_nm', () => {
    const item = { 단지명: '강남오피스텔', 거래금액: '80,000', 년: '2024', 월: '6', 일: '1' }
    const row = normalizeOffiTrade(item, '11680', '202406', 'getRTMSDataSvcOffiTrade')
    expect(row.offi_nm).toBe('강남오피스텔')
    expect(row.price).toBe(80000)
  })
})

describe('normalizeMultiTrade', () => {
  it('uses 연립다세대 for house_nm', () => {
    const item = { 연립다세대: '신사빌라', 거래금액: '20,000', 년: '2024', 월: '5', 일: '10' }
    const row = normalizeMultiTrade(item, '11680', '202405', 'getRTMSDataSvcRHDwelling')
    expect(row.house_nm).toBe('신사빌라')
    expect(row.price).toBe(20000)
  })
})
