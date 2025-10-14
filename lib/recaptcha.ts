import logger from './logger'

interface RecaptchaResponse {
  success: boolean
  challenge_ts?: string
  hostname?: string
  score?: number
  action?: string
  'error-codes'?: string[]
}

export async function verifyRecaptcha(token: string): Promise<boolean> {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY

  if (!secretKey) {
    logger.error('reCAPTCHA secret key is not configured')
    return false
  }

  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        secret: secretKey,
        response: token
      })
    })

    if (!response.ok) {
      logger.error('Failed to verify reCAPTCHA token', response.status, response.statusText)
      return false
    }

    const data = (await response.json()) as RecaptchaResponse

    if (!data.success) {
      logger.warn('reCAPTCHA verification failed', data['error-codes'])
      return false
    }

    return true
  } catch (error) {
    logger.error('Error verifying reCAPTCHA token', error)
    return false
  }
}
