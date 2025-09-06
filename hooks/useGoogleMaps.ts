// Utility to load Google Maps API dynamically using the official loader
import { Loader } from '@googlemaps/js-api-loader'

let loader: Loader | null = null
let loadingPromise: Promise<typeof google> | null = null

export function loadGoogleMaps(language: string): Promise<typeof google> {
  if (typeof window === 'undefined') {
    return Promise.resolve(undefined as unknown as typeof google)
  }
  if (loadingPromise) {
    return loadingPromise
  }

  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  if (!key) {
    return Promise.reject(new Error('Google Maps API key is not configured'))
  }

  const regionMap: Record<string, string> = { ru: 'RU', kz: 'KZ', en: 'US' }
  const region = regionMap[language] || 'US'

  if (loader) {
    loader.deleteScript()
    loader = null
  }

  loader = new Loader({
    apiKey: key,
    language,
    region,
    version: 'beta',
    libraries: ['marker']
  })

  loadingPromise = loader.load().then(() => {
    loadingPromise = null
    return google
  })

  return loadingPromise
}