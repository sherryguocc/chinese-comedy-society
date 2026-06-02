export async function withTimeout<T>(
  promise: Promise<T>,
  ms: number = 6000
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Request timeout')), ms)

    promise.then(
      (res) => {
        clearTimeout(timer)
        resolve(res)
      },
      (err) => {
        clearTimeout(timer)
        reject(err)
      }
    )
  })
}

export function getSafeExternalUrl(value?: string | null): string | null {
  const raw = value?.trim()
  if (!raw) {
    return null
  }

  const normalized = /^www\./i.test(raw) ? `https://${raw}` : raw

  try {
    const parsed = new URL(normalized)
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.toString()
    }
    return null
  } catch {
    return null
  }
}
