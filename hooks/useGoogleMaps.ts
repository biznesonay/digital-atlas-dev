import { Loader } from '@googlemaps/js-api-loader'

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

let loader: Loader | null = null
let loadPromise: Promise<typeof google> | null = null
let initializedLanguage: string | null = null

const getScriptId = (lang: string) => `google-maps-sdk-${lang}`

function resetLoaderState() {
  if (initializedLanguage && typeof document !== 'undefined') {
    const existingScript = document.getElementById(getScriptId(initializedLanguage))
    existingScript?.remove()
  }

  if (typeof window !== 'undefined' && (window as any).google) {
    delete (window as any).google
  }

  loader = null
  loadPromise = null
  initializedLanguage = null
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

  if (initializedLanguage && googleLanguage !== initializedLanguage) {
    resetLoaderState()
  }

  if (!loader) {
    initializedLanguage = googleLanguage

    loader = new Loader({
      id: getScriptId(googleLanguage),
      apiKey,
      version: 'weekly',
      libraries: ['marker'],
      language: googleLanguage,
      region: REGION_BY_LANGUAGE[googleLanguage] ?? 'US'
    })
  }

  if (!loadPromise) {
    loadPromise = loader
      .load()
      .then(() => window.google)
      .catch(error => {
        loadPromise = null
        throw error
      })
  }

  return loadPromise
}
