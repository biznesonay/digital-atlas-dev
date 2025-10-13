'use client'

const DEFAULT_LANGUAGE = 'en'

const GOOGLE_MAPS_LANGUAGE_BY_APP_LANGUAGE: Record<string, string> = {
  ru: 'ru',
  kz: 'kk',
  en: 'en'
}

const REGION_BY_LANGUAGE: Record<string, string> = {
  ru: 'RU',
  kk: 'KZ',
  en: 'US'
}

let currentLanguage: string | null = null
let loadPromise: Promise<typeof google> | null = null

export type GoogleMapsLoadArgs = {
  language: string
}

export function removeAllGoogleMapsScripts() {
  if (typeof document === 'undefined') {
    return
  }

  const scripts = document.querySelectorAll('script[src*="maps.googleapis.com"]')
  scripts.forEach(script => {
    script.remove()
  })

  const styles = document.querySelectorAll('style[id*="google-maps"]')
  styles.forEach(style => {
    style.remove()
  })

  if (typeof window !== 'undefined') {
    if ((window as typeof window & { google?: typeof google }).google) {
      delete (window as any).google
    }

    if ((window as any).google_map_tiles) {
      delete (window as any).google_map_tiles
    }
  }
}

const resolveGoogleLanguage = (language: string) => {
  const normalized = (language || DEFAULT_LANGUAGE).toLowerCase()
  return (
    GOOGLE_MAPS_LANGUAGE_BY_APP_LANGUAGE[normalized] ??
    GOOGLE_MAPS_LANGUAGE_BY_APP_LANGUAGE[DEFAULT_LANGUAGE]
  )
}

export async function loadGoogleMaps({ language }: GoogleMapsLoadArgs): Promise<typeof google> {
  if (typeof window === 'undefined') {
    throw new Error('loadGoogleMaps must be called in a browser environment')
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  if (!apiKey) {
    throw new Error('Google Maps API key is missing (NEXT_PUBLIC_GOOGLE_MAPS_API_KEY)')
  }

  const normalizedLanguage = (language || DEFAULT_LANGUAGE).toLowerCase()
  const googleLanguage = resolveGoogleLanguage(normalizedLanguage)
  const region = REGION_BY_LANGUAGE[googleLanguage] ?? 'US'

  if (currentLanguage && currentLanguage !== normalizedLanguage) {
    console.log(
      `[GoogleMaps] Language switch detected from ${currentLanguage} to ${normalizedLanguage}. Reloading page.`
    )
    const url = new URL(window.location.href)
    url.searchParams.set('lang', normalizedLanguage)
    window.location.href = url.toString()
    return new Promise(() => {
      /* wait for reload */
    })
  }

  if ((window as any).google?.maps) {
    currentLanguage = normalizedLanguage
    return window.google
  }

  if (!loadPromise) {
    currentLanguage = normalizedLanguage

    loadPromise = new Promise<typeof google>((resolve, reject) => {
      if ((window as any).google?.maps) {
        resolve(window.google)
        return
      }

      console.log(`[GoogleMaps] Loading Google Maps for language ${googleLanguage}`)

      const scriptUrl =
        `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=marker&language=${googleLanguage}&region=${region}&loading=async`

      const existingScript = document.querySelector<HTMLScriptElement>('script[data-google-maps-loader="true"]')
      if (existingScript) {
        existingScript.remove()
      }

      const script = document.createElement('script')
      script.src = scriptUrl
      script.async = true
      script.defer = true
      script.dataset.googleMapsLoader = 'true'
      script.dataset.googleMapsLanguage = googleLanguage

      script.onload = () => {
        if ((window as any).google?.maps) {
          console.log(`[GoogleMaps] Successfully loaded Google Maps for language ${googleLanguage}`)
          resolve(window.google)
          return
        }

        loadPromise = null
        reject(new Error('Google Maps SDK did not expose the global google object'))
      }

      script.onerror = event => {
        console.error('[GoogleMaps] Failed to load Google Maps SDK', event)
        script.remove()
        loadPromise = null
        reject(new Error('Failed to load Google Maps SDK'))
      }

      document.head.appendChild(script)
    })
  }

  return loadPromise
}
