// Utility to load Google Maps script dynamically based on language
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

  const existing = document.getElementById('google-maps')
  if (existing) {
    existing.remove()
  }
  document
    .querySelectorAll(
      'script[src*="maps.googleapis.com"], script[src*="maps.gstatic.com"], link[href*="maps.googleapis.com"], link[href*="maps.gstatic.com"]'
    )
    .forEach(el => el.parentNode?.removeChild(el))

  delete (window as any).google

  const regionMap: Record<string, string> = { ru: 'RU', kz: 'KZ', en: 'US' }
  const region = regionMap[language] || 'US'

  loadingPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.id = 'google-maps'
    script.async = true
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&language=${language}&region=${region}`
    script.onload = () => {
      loadingPromise = null
      resolve(google)
    }
    script.onerror = () => {
      loadingPromise = null
      reject(new Error('Failed to load Google Maps'))
    }
    document.head.appendChild(script)
  })

  return loadingPromise
}