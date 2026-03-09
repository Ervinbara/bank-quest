const DEFAULT_TIMEOUT_MS = 15000
const DEFAULT_RETRY_COUNT = 1
const DEFAULT_RETRY_DELAY_MS = 400

export class NetworkTimeoutError extends Error {
  constructor(message = 'Delai depasse, verifiez votre connexion') {
    super(message)
    this.name = 'NetworkTimeoutError'
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export const withTimeout = async (factory, timeoutMs = DEFAULT_TIMEOUT_MS, timeoutMessage) => {
  let timeoutId = null
  try {
    return await Promise.race([
      Promise.resolve().then(factory),
      new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new NetworkTimeoutError(timeoutMessage))
        }, timeoutMs)
      })
    ])
  } finally {
    if (timeoutId) clearTimeout(timeoutId)
  }
}

export const isTransientNetworkError = (error) => {
  const message = String(error?.message || '').toLowerCase()
  return (
    error instanceof NetworkTimeoutError ||
    message.includes('timeout') ||
    message.includes('network request failed') ||
    message.includes('failed to fetch') ||
    message.includes('fetch failed') ||
    message.includes('load failed') ||
    message.includes('connection') ||
    message.includes('503') ||
    message.includes('502') ||
    message.includes('504')
  )
}

export const normalizeNetworkErrorMessage = (error, fallbackMessage) => {
  const fallback = fallbackMessage || 'Une erreur reseau est survenue'
  if (!error) return fallback
  if (error instanceof NetworkTimeoutError) return error.message

  const message = String(error?.message || '').trim()
  if (!message) return fallback

  if (
    message.toLowerCase().includes('network request failed') ||
    message.toLowerCase().includes('failed to fetch') ||
    message.toLowerCase().includes('fetch failed')
  ) {
    return 'Connexion indisponible. Verifiez internet puis reessayez.'
  }

  return message
}

export const runWithNetworkGuard = async (
  operation,
  {
    timeoutMs = DEFAULT_TIMEOUT_MS,
    retryCount = DEFAULT_RETRY_COUNT,
    retryDelayMs = DEFAULT_RETRY_DELAY_MS,
    timeoutMessage,
    fallbackMessage
  } = {}
) => {
  let attempt = 0
  let lastError = null
  const maxAttempts = Math.max(1, retryCount + 1)

  while (attempt < maxAttempts) {
    try {
      return await withTimeout(operation, timeoutMs, timeoutMessage)
    } catch (error) {
      lastError = error
      const canRetry = isTransientNetworkError(error) && attempt < maxAttempts - 1
      if (!canRetry) break
      await sleep(retryDelayMs * Math.max(1, attempt + 1))
    }
    attempt += 1
  }

  throw new Error(normalizeNetworkErrorMessage(lastError, fallbackMessage))
}
