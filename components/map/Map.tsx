'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { GoogleMap, LoadScript, InfoWindow } from '@react-google-maps/api'
import { MarkerClusterer, GridAlgorithm } from '@googlemaps/markerclusterer'
import { DEFAULT_MAP_OPTIONS, KAZAKHSTAN_BOUNDS, KAZAKHSTAN_CENTER } from '@/lib/constants'
import { CircularProgress, Box } from '@mui/material'
import MarkerInfo from './MarkerInfo'

interface MapProps {
  objects: any[]
  loading: boolean
  language: string
}

const mapContainerStyle = {
  width: '100%',
  height: '100%'
}

// Кастомный рендерер для кластеров
const createClusterRenderer = () => {
  return {
    render: ({ count, position }: any, stats: any) => {
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
  const [selectedObject, setSelectedObject] = useState<any | null>(null)
  const [infoWindowPosition, setInfoWindowPosition] = useState<google.maps.LatLng | null>(null)

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map
    
    // Установка границ Казахстана
    const bounds = new google.maps.LatLngBounds(
      new google.maps.LatLng(KAZAKHSTAN_BOUNDS.south, KAZAKHSTAN_BOUNDS.west),
      new google.maps.LatLng(KAZAKHSTAN_BOUNDS.north, KAZAKHSTAN_BOUNDS.east)
    )
    map.fitBounds(bounds)
  }, [])

  // Создание и обновление маркеров
  useEffect(() => {
    if (!mapRef.current || loading) return

    // Удаление старых маркеров
    markersRef.current.forEach(marker => marker.setMap(null))
    markersRef.current = []

    // Удаление старого кластеризатора
    if (clustererRef.current) {
      clustererRef.current.clearMarkers()
      clustererRef.current = null
    }

    // Создание новых маркеров
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
        setSelectedObject(obj)
        setInfoWindowPosition(marker.getPosition() || null)
      })

      newMarkers.push(marker)
    })

    markersRef.current = newMarkers

    // Создание нового кластеризатора
    if (newMarkers.length > 0) {
      clustererRef.current = new MarkerClusterer({
        map: mapRef.current,
        markers: newMarkers,
        renderer: createClusterRenderer(),
        algorithm: new GridAlgorithm({
          gridSize: 60,
          maxDistance: 40000
        })
      })
    }
  }, [objects, loading])

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      markersRef.current.forEach(marker => marker.setMap(null))
      if (clustererRef.current) {
        clustererRef.current.clearMarkers()
      }
      mapRef.current = null
    }
  }, [])

  const handleInfoWindowClose = () => {
    setSelectedObject(null)
    setInfoWindowPosition(null)
  }

  return (
    <LoadScript
      googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}
      libraries={['places']}
      language={language}
      region={language}
      key={language}
    >
      <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          zoom={5}
          center={KAZAKHSTAN_CENTER}
          options={DEFAULT_MAP_OPTIONS}
          onLoad={onMapLoad}
        >
          {selectedObject && infoWindowPosition && (
            <InfoWindow
              position={infoWindowPosition}
              onCloseClick={handleInfoWindowClose}
            >
              <MarkerInfo object={selectedObject} language={language} />
            </InfoWindow>
          )}
        </GoogleMap>
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
    </LoadScript>
  )
}
