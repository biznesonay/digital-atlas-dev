// Utility to load Google Maps API dynamically using the official loader
import { Loader, LoaderOptions } from '@googlemaps/js-api-loader'

let loader: Loader | null = null
let loadingPromise: Promise<typeof google> | null = null

export async function loadGoogleMaps(language: string, mapId?: string): Promise<typeof google> {
  if (typeof window === 'undefined') {
    throw new Error('loadGoogleMaps must be called in a browser environment')
  }
  if (loadingPromise) {
    return loadingPromise
  }

  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  if (!key) {
    throw new Error('Google Maps API key is not configured')
  }

  const regionMap: Record<string, string> = { ru: 'RU', kz: 'KZ', en: 'US' }
  const region = regionMap[language] || 'US'

  if (loader) {
    await loader.deleteScript()
    loader = null
    ;(Loader as any).instance = undefined
    delete (window as any).google
  }

  const options: LoaderOptions = {
    apiKey: key,
    language,
    region,
    version: 'beta',
    libraries: ['marker']
  }

  if (mapId) {
    ;(options as any).mapIds = [mapId]
  }

  loader = new Loader(options)

  loadingPromise = loader.load().then(() => {
    loadingPromise = null
    return google
  })

  return loadingPromise
}