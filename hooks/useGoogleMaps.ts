import { Loader } from '@googlemaps/js-api-loader'

const DEFAULT_LANGUAGE = 'en'
const MAX_LOAD_ATTEMPTS = 3
const BASE_RETRY_DELAY_MS = 500

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

const loaders: Record<string, Loader> = {}
const loadPromises: Record<string, Promise<typeof google> | null> = {}
const loadAttempts: Record<string, number> = {}

const getScriptId = (lang: string) => `google-maps-sdk-${lang}`

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

  if (typeof window !== 'undefined' && (window as any).google) {
    delete (window as any).google
  }
}

export type GoogleMapsLoadArgs = {
  language: string
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
  const googleLanguage =
    GOOGLE_MAPS_LANGUAGE_BY_APP_LANGUAGE[normalizedLanguage] ?? GOOGLE_MAPS_LANGUAGE_BY_APP_LANGUAGE[DEFAULT_LANGUAGE]

  const existingLanguages = Object.keys(loadPromises).filter(key => loadPromises[key])

  if (existingLanguages.length > 0 && !loadPromises[googleLanguage]) {
    console.log(
      `[useGoogleMaps] Language switch detected from [${existingLanguages.join(', ')}] to "${googleLanguage}". Resetting Google Maps scripts.`
    )
    removeAllGoogleMapsScripts()
    existingLanguages.forEach(existingLanguage => {
      delete loaders[existingLanguage]
      delete loadPromises[existingLanguage]
      delete loadAttempts[existingLanguage]
    })
  }

  if (!loaders[googleLanguage]) {
    console.log(`[useGoogleMaps] Creating loader for language "${googleLanguage}"`)
    loaders[googleLanguage] = new Loader({
      id: getScriptId(googleLanguage),
      apiKey,
      version: 'weekly',
      libraries: ['marker'],
      language: googleLanguage,
      region: REGION_BY_LANGUAGE[googleLanguage] ?? 'US'
    })
  }

  if (!loadPromises[googleLanguage]) {
    loadAttempts[googleLanguage] = 0

    loadPromises[googleLanguage] = (async () => {
      while (loadAttempts[googleLanguage] < MAX_LOAD_ATTEMPTS) {
        const attempt = loadAttempts[googleLanguage] + 1
        loadAttempts[googleLanguage] = attempt

        console.log(
          `[useGoogleMaps] Attempt ${attempt}/${MAX_LOAD_ATTEMPTS} to load Google Maps for language "${googleLanguage}"`
        )

        try {
          await loaders[googleLanguage].load()

          if (!(window as any).google) {
            throw new Error('Google Maps SDK did not expose the global google object')
          }

          console.log(`[useGoogleMaps] Successfully loaded Google Maps for language "${googleLanguage}"`)
          delete loadAttempts[googleLanguage]
          return window.google
        } catch (error) {
          console.error(
            `[useGoogleMaps] Failed to load Google Maps on attempt ${attempt} for language "${googleLanguage}"`,
            error
          )

          if (attempt >= MAX_LOAD_ATTEMPTS) {
            console.error(
              `[useGoogleMaps] Exhausted all attempts to load Google Maps for language "${googleLanguage}". Resetting loader state.`
            )
            removeAllGoogleMapsScripts()
            delete loaders[googleLanguage]
            loadPromises[googleLanguage] = null
            delete loadAttempts[googleLanguage]
            throw error
          }

          const delay = BASE_RETRY_DELAY_MS * attempt
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }

      throw new Error(`Failed to load Google Maps for language "${googleLanguage}"`)
    })()
  }

  return loadPromises[googleLanguage] as Promise<typeof google>
}
