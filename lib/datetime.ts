// lib/datetime.ts
// 新西兰时间工具：数据库存真实时刻（timestamptz / UTC），录入和展示一律按新西兰时间。
// 自动处理夏令时（NZDT +13 / NZST +12）。

export const NZ_TZ = 'Pacific/Auckland'

/** 某个时刻在新西兰的时区偏移（毫秒），例如夏令时为 +13h */
function nzOffsetMs(date: Date): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: NZ_TZ,
    hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(date)
  const get = (t: string) => Number(parts.find(p => p.type === t)?.value)
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'))
  return asUtc - Math.floor(date.getTime() / 1000) * 1000
}

/**
 * 把 <input type="datetime-local"> 的值（新西兰墙上时间，如 "2026-10-25T19:30"）
 * 转成带时区的 ISO 字符串，存入数据库。
 */
export function nzLocalToISO(local: string): string {
  const m = local.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/)
  if (!m) throw new Error(`Invalid datetime-local value: ${local}`)
  const [, y, mo, d, h, mi] = m.map(Number)
  const wallAsUtc = Date.UTC(y, mo - 1, d, h, mi)
  // 先用近似偏移，再用结果时刻的偏移校正一次（处理夏令时切换）
  let ts = wallAsUtc - nzOffsetMs(new Date(wallAsUtc))
  ts = wallAsUtc - nzOffsetMs(new Date(ts))
  return new Date(ts).toISOString()
}

/** 反向：数据库时间 → datetime-local 输入框的值（用于编辑表单） */
export function isoToNzLocalInput(iso: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: NZ_TZ,
    hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  }).formatToParts(new Date(iso))
  const get = (t: string) => parts.find(p => p.type === t)?.value
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`
}

/** 新西兰日期键 "YYYY-MM-DD"，用于日历按天分组 */
export function nzDateKey(iso: string | Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: NZ_TZ,
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date(iso))
}

/** dd/mm/yyyy */
export function formatNzDate(iso: string | Date): string {
  return new Intl.DateTimeFormat('en-NZ', {
    timeZone: NZ_TZ, day: '2-digit', month: '2-digit', year: 'numeric',
  }).format(new Date(iso))
}

/** 例如 "25 Oct, 7:30 pm" */
export function formatNzDateTime(iso: string | Date): string {
  return new Intl.DateTimeFormat('en-NZ', {
    timeZone: NZ_TZ, day: 'numeric', month: 'short',
    hour: 'numeric', minute: '2-digit', hour12: true,
  }).format(new Date(iso))
}

/** 例如 "9:30 pm" */
export function formatNzTime(iso: string | Date): string {
  return new Intl.DateTimeFormat('en-NZ', {
    timeZone: NZ_TZ, hour: 'numeric', minute: '2-digit', hour12: true,
  }).format(new Date(iso))
}
