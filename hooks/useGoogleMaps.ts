// Utility to load Google Maps API dynamically using the official loader
import { Loader, LoaderOptions } from '@googlemaps/js-api-loader'

type LoadOptions = {
  language: string
  mapId?: string
}

let loader: Loader | null = null
let loadingPromise: Promise<typeof google> | null = null
let currentLoadOptions: LoadOptions | null = null

export async function loadGoogleMaps(language: string, mapId?: string): Promise<typeof google> {
  if (typeof window === 'undefined') {
    throw new Error('loadGoogleMaps must be called in a browser environment')
  }
  const requestedOptions: LoadOptions = { language, mapId: mapId ?? undefined }

  if (loadingPromise) {
    if (
      currentLoadOptions &&
      currentLoadOptions.language === requestedOptions.language &&
      currentLoadOptions.mapId === requestedOptions.mapId
    ) {
      return loadingPromise
    }

    try {
      await loadingPromise
    } catch {
      // Ignore errors from the previous loading attempt and continue with teardown logic
    }
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
  currentLoadOptions = requestedOptions

  loadingPromise = (async () => {
    try {
      await loader!.load()
      return google
    } catch (error) {
      const originalError =
        error instanceof Error ? error : new Error(String(error) || 'Failed to load Google Maps SDK')
      const message = originalError.message || 'Failed to load Google Maps SDK'

      if (message.includes('csp_test')) {
        const enhancedError = new Error(
          'Google Maps failed to load. A content blocker may be preventing the Google Maps SDK from loading.'
        )
        ;(enhancedError as any).cause = originalError
        throw enhancedError
      }

      throw originalError
    } finally {
      loadingPromise = null
      currentLoadOptions = null
    }
  })()

  return loadingPromise
}
