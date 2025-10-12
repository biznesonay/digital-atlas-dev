import logger from './logger'

type RecaptchaResponse = {
  success: boolean
  challenge_ts?: string
  hostname?: string
  score?: number
  action?: string
  'error-codes'?: string[]
}

const RECAPTCHA_VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify'

export async function verifyRecaptchaToken(token: string) {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY

  if (!secretKey) {
    logger.error('reCAPTCHA secret key is not configured')
    return { success: false, error: 'RECAPTCHA_NOT_CONFIGURED' as const }
  }

  try {
    const response = await fetch(RECAPTCHA_VERIFY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `secret=${encodeURIComponent(secretKey)}&response=${encodeURIComponent(token)}`
    })

    if (!response.ok) {
      logger.error('reCAPTCHA verification request failed', response.status, response.statusText)
      return { success: false, error: 'RECAPTCHA_REQUEST_FAILED' as const }
    }

    const data: RecaptchaResponse = await response.json()

    if (!data.success) {
      logger.warn('reCAPTCHA verification unsuccessful', data['error-codes'])
      return { success: false, error: 'RECAPTCHA_FAILED' as const }
    }

    return { success: true as const }
  } catch (error) {
    logger.error('reCAPTCHA verification error', error)
    return { success: false, error: 'RECAPTCHA_REQUEST_FAILED' as const }
  }
}
