'use client'

import { useEffect, useRef, useState } from 'react'
import { loadGoogleMaps } from '@/hooks/useGoogleMaps'
import { MarkerClusterer, GridAlgorithm } from '@googlemaps/markerclusterer'
import { DEFAULT_MAP_OPTIONS, KAZAKHSTAN_BOUNDS, KAZAKHSTAN_CENTER } from '@/lib/constants'
import { CircularProgress, Box, Typography } from '@mui/material'
import MarkerInfo from './MarkerInfo'
import { createRoot, Root } from 'react-dom/client'

interface MapProps {
  objects: any[]
  loading: boolean
  language: string
}

// Кастомный рендерер для кластеров
const createClusterRenderer = () => {
  return {
    render: ({ count, position }: any) => {
      const color = count < 10 ? '#1976D2' : count < 50 ? '#388E3C' : '#D32F2F'
      const size = count < 10 ? 40 : count < 50 ? 50 : 60
      
      const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
          <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 2}" fill="${color}" stroke="white" stroke-width="2"/>
          <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="white" font-size="14" font-weight="bold">${count}</text>
        </svg>
      `
      
      const div = document.createElement('div')
      div.innerHTML = svg

      return new google.maps.marker.AdvancedMarkerElement({
        position,
        content: div,
        zIndex: Number(google.maps.Marker.MAX_ZINDEX) + count
      })
    }
  }
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
    if (!apiKey || !mapId) return

    let isMounted = true

    setMapError(null)

    loadGoogleMaps(language, mapId)
      .then(() => {
        if (!isMounted || !mapContainerRef.current) return

        if (!(window as any).google || !(window as any).google.maps) {
          setMapError('Google Maps SDK not available')
          return
        }

        const mapOptions: google.maps.MapOptions = {
          ...DEFAULT_MAP_OPTIONS,
          center: KAZAKHSTAN_CENTER,
          zoom: 5,
          mapId
        }
        mapRef.current = new google.maps.Map(mapContainerRef.current, mapOptions)

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
  }, [language, apiKey])

  useEffect(() => {
    if (!mapReady) return
    if (!mapRef.current || loading) return
    if (!(window as any).google || !(window as any).google.maps) {
      setMapError('Google Maps SDK not available')
      return
    }

    markersRef.current.forEach(marker => (marker.map = null))
    markersRef.current = []

    if (clustererRef.current) {
      if (clustererRef.current?.getMap()) {
        clustererRef.current.clearMarkers(true)
      }
      clustererRef.current = null
    }

    if (infoWindowRef.current) {
      infoWindowRef.current.close()
    }
    if (infoWindowRootRef.current) {
      infoWindowRootRef.current.unmount()
      infoWindowRootRef.current = null
    }

    const newMarkers: google.maps.marker.AdvancedMarkerElement[] = []
    
    objects.forEach(obj => {
      if (!obj.latitude || !obj.longitude) return
      
      const markerContent = document.createElement('div')
      markerContent.style.backgroundColor = obj.type?.color || '#1976D2'
      markerContent.style.border = '2px solid white'
      markerContent.style.borderRadius = '50%'
      markerContent.style.height = '16px'
      markerContent.style.width = '16px'
      markerContent.style.boxSizing = 'border-box'

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
          event.stop()

          const map = mapRef.current ?? mapInstance
          const position = cluster?.position

          if (!map || !position) {
            return
          }

          map.panTo(position)

          const currentZoom = map.getZoom() ?? 0
          const maxZoom = 21
          const targetZoom = Math.min(currentZoom + 2, maxZoom)

          map.setZoom(targetZoom)
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
