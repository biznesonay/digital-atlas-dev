'use client'

import { useEffect, useRef, useState } from 'react'
import { loadGoogleMaps } from '@/hooks/useGoogleMaps'
import { MarkerClusterer, GridAlgorithm } from '@googlemaps/markerclusterer'
import { DEFAULT_MAP_OPTIONS, KAZAKHSTAN_BOUNDS, KAZAKHSTAN_CENTER, MAP_UI_PADDING } from '@/lib/constants'
import { CircularProgress, Box, Typography } from '@mui/material'
import MarkerInfo from './MarkerInfo'
import { createRoot, Root } from 'react-dom/client'

interface MapProps {
  objects: any[]
  loading: boolean
  language: string
}

// Кастомный рендерер для кластеров
type ClusterRenderParams = {
  count: number
  position: google.maps.LatLng
  markers: google.maps.marker.AdvancedMarkerElement[]
}

const DEFAULT_CLUSTER_COLORS = {
  small: '#1976D2',
  medium: '#388E3C',
  large: '#D32F2F'
} as const

const createClusterRenderer = () => {
  return {
    render: ({ count, position, markers }: ClusterRenderParams) => {
      const collectedColors = markers
        .map(marker => {
          const element = marker.content as HTMLElement | null
          return element?.dataset?.markerColor
        })
        .filter((color): color is string => Boolean(color))

      const uniqueColors = Array.from(new Set(collectedColors))

      const defaultColor =
        count < 10
          ? DEFAULT_CLUSTER_COLORS.small
          : count < 50
            ? DEFAULT_CLUSTER_COLORS.medium
            : DEFAULT_CLUSTER_COLORS.large

      const color = uniqueColors.length === 1 ? uniqueColors[0] : defaultColor
      const size = count < 10 ? 40 : count < 50 ? 50 : 60
      
      const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
          <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 2}" fill="${color}" stroke="white" stroke-width="2"/>
          <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="white" font-size="14" font-weight="bold">${count}</text>
        </svg>
      `

      const div = document.createElement('div')
      div.innerHTML = svg
      div.style.cursor = 'pointer'

      return new google.maps.marker.AdvancedMarkerElement({
        position,
        content: div,
        zIndex: Number(google.maps.Marker.MAX_ZINDEX) + count
      })
    }
  }
}

const applyMapPadding = (map: google.maps.Map) => {
  const mapWithOptionalPadding = map as google.maps.Map & {
    setPadding?: (padding: google.maps.Padding) => void
  }

  if (typeof mapWithOptionalPadding.setPadding === 'function') {
    mapWithOptionalPadding.setPadding(MAP_UI_PADDING)
    return
  }

  map.set('padding', MAP_UI_PADDING)
}

export default function Map({ objects, loading, language }: MapProps) {
  const mapRef = useRef<google.maps.Map | null>(null)
  const clustererRef = useRef<MarkerClusterer | null>(null)
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([])
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null)
  const infoWindowRootRef = useRef<Root | null>(null)
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const apiKey: string | undefined = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  const mapId: string | undefined = process.env.NEXT_PUBLIC_GOOGLE_MAP_ID
  const [mapReady, setMapReady] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)

  useEffect(() => {
    if (!apiKey) return

    let isMounted = true

    setMapError(null)

    const normalizedMapId = mapId || undefined

    loadGoogleMaps({ language })
      .then(() => {
        if (!isMounted || !mapContainerRef.current) return

        if (!(window as any).google || !(window as any).google.maps) {
          setMapError('Google Maps SDK not available')
          return
        }

        const mapOptions: google.maps.MapOptions = {
          ...DEFAULT_MAP_OPTIONS,
          center: KAZAKHSTAN_CENTER,
          zoom: 5
        }
        if (normalizedMapId) {
          mapOptions.mapId = normalizedMapId
        }
        mapRef.current = new google.maps.Map(mapContainerRef.current, mapOptions)

        applyMapPadding(mapRef.current)

        const bounds = new google.maps.LatLngBounds(
          new google.maps.LatLng(KAZAKHSTAN_BOUNDS.south, KAZAKHSTAN_BOUNDS.west),
          new google.maps.LatLng(KAZAKHSTAN_BOUNDS.north, KAZAKHSTAN_BOUNDS.east)
        )
        mapRef.current.fitBounds(bounds)

        infoWindowRef.current = new google.maps.InfoWindow()
        infoWindowRef.current.addListener('closeclick', () => {
          if (infoWindowRootRef.current) {
            infoWindowRootRef.current.unmount()
            infoWindowRootRef.current = null
          }
        })
        setMapReady(true)
      })
      .catch(err => {
        console.error('Failed to load Google Maps. Possible network issue or invalid API key.', err)
        setMapError('Failed to load Google Maps. Please check your network connection or API key.')
      })

    return () => {
      isMounted = false
      clustererRef.current?.setMap(null)
      markersRef.current.forEach(marker => {
        marker.map = null;
      });
      markersRef.current = []
      if (clustererRef.current) {
        clustererRef.current.clearMarkers(true)
        clustererRef.current = null
      }
      if (infoWindowRef.current) {
        infoWindowRef.current.close()
        infoWindowRef.current = null
      }
      if (infoWindowRootRef.current) {
        infoWindowRootRef.current.unmount()
        infoWindowRootRef.current = null
      }
      mapRef.current = null
      setMapReady(false)
    }
  }, [language, apiKey, mapId])

  useEffect(() => {
    if (!mapReady) return
    if (!mapRef.current) return
    if (!(window as any).google || !(window as any).google.maps) {
      setMapError('Google Maps SDK not available')
      return
    }

    if (clustererRef.current) {
      clustererRef.current.clearMarkers(true)
      clustererRef.current.setMap(null)
      clustererRef.current = null
    }

    markersRef.current.forEach(marker => (marker.map = null))
    markersRef.current = []

    if (infoWindowRef.current) {
      infoWindowRef.current.close()
    }
    if (infoWindowRootRef.current) {
      infoWindowRootRef.current.unmount()
      infoWindowRootRef.current = null
    }

    if (loading) {
      return
    }

    const newMarkers: google.maps.marker.AdvancedMarkerElement[] = []
    
    objects.forEach(obj => {
      if (obj.latitude == null || obj.longitude == null) return

      const markerContent = document.createElement('div')
      const markerColor = obj.type?.color || DEFAULT_CLUSTER_COLORS.small
      markerContent.style.backgroundColor = markerColor
      markerContent.style.border = '2px solid white'
      markerContent.style.borderRadius = '50%'
      markerContent.style.height = '16px'
      markerContent.style.width = '16px'
      markerContent.style.boxSizing = 'border-box'
      markerContent.dataset.markerColor = markerColor

      const marker = new google.maps.marker.AdvancedMarkerElement({
        position: { lat: obj.latitude, lng: obj.longitude },
        title: obj.name || '',
        content: markerContent
      })

      marker.addListener('click', () => {
        if (!infoWindowRef.current) return

        if (infoWindowRootRef.current) {
          infoWindowRootRef.current.unmount()
          infoWindowRootRef.current = null
        }

        const container = document.createElement('div')
        infoWindowRootRef.current = createRoot(container)
        infoWindowRootRef.current.render(<MarkerInfo object={obj} language={language} />)
        infoWindowRef.current!.setContent(container)
        infoWindowRef.current!.open(mapRef.current, marker)
      })

      newMarkers.push(marker)
    })

    markersRef.current = newMarkers

    if (newMarkers.length > 0) {
      clustererRef.current = new MarkerClusterer({
        map: mapRef.current!,
        markers: newMarkers,
        renderer: createClusterRenderer(),
        algorithm: new GridAlgorithm({
          gridSize: 60,
          maxDistance: 40000
        }),
        onClusterClick: (event, cluster, mapInstance) => {
          type ClusterClickEvent = google.maps.MapMouseEvent & {
            stop?: () => void
            domEvent?: {
              stopPropagation?: () => void
              preventDefault?: () => void
            }
          }

          const clusterClickEvent = event as ClusterClickEvent

          if (typeof clusterClickEvent.stop === 'function') {
            clusterClickEvent.stop()
          } else {
            clusterClickEvent.domEvent?.stopPropagation?.()
            clusterClickEvent.domEvent?.preventDefault?.()
          }

          const map = mapRef.current ?? mapInstance
          const position = cluster?.position

          if (!map || !position) {
            return
          }

          map.panTo(position)
        }
      })
    }
  }, [objects, loading, language, mapReady])

  if (!apiKey || !mapId) {
    return (
      <Box sx={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography>Google Maps API key or Map ID is not configured</Typography>
      </Box>
    )
  }

  if (mapError) {
    return (
      <Box sx={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography>{mapError}</Typography>
      </Box>
    )
  }
  
  return (
    <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
      <Box ref={mapContainerRef} sx={{ width: '100%', height: '100%' }} />
      {loading && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            bgcolor: 'rgba(255,255,255,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1
          }}
        >
          <CircularProgress size={60} />
        </Box>
      )}
    </Box>
  )
}
