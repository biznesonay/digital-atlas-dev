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
      
      return new google.maps.Marker({
        position,
        icon: {
          url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
          scaledSize: new google.maps.Size(size, size)
        },
        zIndex: Number(google.maps.Marker.MAX_ZINDEX) + count
      })
    }
  }
}

export default function Map({ objects, loading, language }: MapProps) {
  const mapRef = useRef<google.maps.Map | null>(null)
  const clustererRef = useRef<MarkerClusterer | null>(null)
  const markersRef = useRef<google.maps.Marker[]>([])
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null)
  const infoWindowRootRef = useRef<Root | null>(null)
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const apiKey: string | undefined = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  const [mapReady, setMapReady] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)

  useEffect(() => {
    if (!apiKey) return

    let isMounted = true

    setMapError(null)

    loadGoogleMaps(language)
      .then(() => {
        if (!isMounted || !mapContainerRef.current) return

        if (!(window as any).google || !(window as any).google.maps) {
          setMapError('Google Maps SDK not available')
          return
        }

        mapRef.current = new google.maps.Map(mapContainerRef.current, {
          ...DEFAULT_MAP_OPTIONS,
          center: KAZAKHSTAN_CENTER,
          zoom: 5
        })

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
      markersRef.current.forEach(marker => marker.setMap(null))
      markersRef.current = []
      if (clustererRef.current) {
        if (clustererRef.current?.getMap()) {
          clustererRef.current.clearMarkers(true)
        }        clustererRef.current = null
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

    markersRef.current.forEach(marker => marker.setMap(null))
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

    const newMarkers: google.maps.Marker[] = []
    
    objects.forEach(obj => {
      if (!obj.latitude || !obj.longitude) return
      
      const marker = new google.maps.Marker({
        position: { lat: obj.latitude, lng: obj.longitude },
        title: obj.name || '',
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: obj.type?.color || '#1976D2',
          fillOpacity: 0.9,
          strokeColor: 'white',
          strokeWeight: 2,
          scale: 8
        }
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
        })
      })
    }
  }, [objects, loading, language, mapReady]) 

  if (!apiKey) {
    return (
      <Box sx={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography>Google Maps API key is not configured</Typography>
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
