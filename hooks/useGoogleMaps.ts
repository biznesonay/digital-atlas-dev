import { Loader } from '@googlemaps/js-api-loader'

const REGION_BY_LANGUAGE: Record<string, string> = {
  ru: 'RU',
  kz: 'KZ',
  en: 'US'
}

let loader: Loader | null = null
let loadPromise: Promise<typeof google> | null = null
let initializedLanguage: string | null = null

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

  const normalizedLanguage = initializedLanguage ?? language ?? 'en'

  if (!loader) {
    initializedLanguage = normalizedLanguage

    loader = new Loader({
      id: 'google-maps-sdk',
      apiKey,
      version: 'weekly',
      libraries: ['marker'],
      language: normalizedLanguage,
      region: REGION_BY_LANGUAGE[normalizedLanguage] ?? 'US'
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
