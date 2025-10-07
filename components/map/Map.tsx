'use client'

import { useEffect, useRef, useState } from 'react'
import { loadGoogleMaps } from '@/hooks/useGoogleMaps'
import { MarkerClusterer, GridAlgorithm, Renderer } from '@googlemaps/markerclusterer'
import type { Marker } from '@googlemaps/markerclusterer'
import { DEFAULT_MAP_OPTIONS, KAZAKHSTAN_BOUNDS, KAZAKHSTAN_CENTER, MAP_UI_PADDING } from '@/lib/constants'
import { CircularProgress, Box, Typography } from '@mui/material'
import MarkerInfo from './MarkerInfo'
import { createRoot, Root } from 'react-dom/client'

interface MapProps {
  objects: any[]
  loading: boolean
  language: string
  selectedTypeIds: string[]
}

interface MarkerMeta {
  typeId?: string | null
  typeCode?: string | null
  typeName?: string | null
  color?: string | null
}

type MarkerLike = Marker | google.maps.marker.AdvancedMarkerElement

type MarkerWithMeta = MarkerLike & {
  __markerMeta?: MarkerMeta
}

const detachMarker = (marker: MarkerLike) => {
  if ('setMap' in marker && typeof marker.setMap === 'function') {
    marker.setMap(null)
    return
  }

  if ('map' in marker) {
    ;(marker as google.maps.marker.AdvancedMarkerElement).map = null
  }
}

const DEFAULT_CLUSTER_COLOR = '#1976D2'

const TYPE_PRIORITY_GROUPS: string[][] = [
  ['TECHNOPARK', 'Технопарк'],
  ['SEZ', 'СЭЗ', 'АЭА'],
  ['IT_HUB', 'IT HUB', 'ITHUB', 'IT-хаб', 'IT хаб', 'ИТ-ХАБ'],
  ['INCUBATOR', 'Бизнес-инкубатор', 'Инкубатор'],
  ['ACCELERATOR', 'Акселератор'],
  ['SCIENCE_PARK', 'Научный парк'],
  ['LABORATORY', 'Лаборатория'],
  ['FAB_LAB', 'FABLAB', 'Fab Lab'],
  ['COWORKING', 'Коворкинг'],
  ['VC_FUND', 'VENTURE_FUND', 'Венчурный фонд'],
  ['BUSINESS_ANGEL', 'BUSINESS_ANGELS', 'Бизнес-ангелы'],
  ['CROWDFUNDING', 'Краудфандинг']
]

const normalizeTypeKey = (value?: string | null) => {
  if (!value) return ''
  return value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^a-z0-9а-я]+/gi, '_')
}

const TYPE_PRIORITY_MAP = (() => {
  const map = new Map<string, number>()
  TYPE_PRIORITY_GROUPS.forEach((group, index) => {
    group.forEach(key => {
      const normalized = normalizeTypeKey(key)
      if (normalized && !map.has(normalized)) {
        map.set(normalized, index)
      }
    })
  })
  return map
})()

const getTypePriority = (meta?: MarkerMeta) => {
  if (!meta) return TYPE_PRIORITY_MAP.size

  const candidates = [meta.typeCode, meta.typeName]

  for (const candidate of candidates) {
    const normalized = normalizeTypeKey(candidate)
    if (!normalized) continue
    if (TYPE_PRIORITY_MAP.has(normalized)) {
      return TYPE_PRIORITY_MAP.get(normalized) ?? TYPE_PRIORITY_MAP.size
    }
  }

  return TYPE_PRIORITY_MAP.size
}

// Кастомный рендерер для кластеров
const createClusterRenderer = (selectedTypeIds: string[]): Renderer => {
  const selectedSet = selectedTypeIds.length > 0 ? new Set(selectedTypeIds) : null

  const getDominantMeta = (markers: MarkerLike[]) => {
    const counts = new Map<string, { count: number; meta: MarkerMeta }>()

    markers.forEach(marker => {
      const markerWithMeta = marker as MarkerWithMeta
      const meta = markerWithMeta.__markerMeta
      if (!meta) return

      if (selectedSet && meta.typeId && !selectedSet.has(meta.typeId)) {
        return
      }

      const key = meta.typeId || meta.typeCode || meta.typeName || meta.color || 'default'
      const existing = counts.get(key)
      if (existing) {
        existing.count += 1
      } else {
        counts.set(key, { count: 1, meta })
      }
    })

    if (counts.size === 0) {
      if (!selectedSet) {
        const fallbackMarker = markers[0] as MarkerWithMeta | undefined
        return fallbackMarker?.__markerMeta
      }
      return undefined
    }

    const sorted = Array.from(counts.values()).sort((a, b) => {
      if (b.count !== a.count) {
        return b.count - a.count
      }

      const priorityA = getTypePriority(a.meta)
      const priorityB = getTypePriority(b.meta)
      if (priorityA !== priorityB) {
        return priorityA - priorityB
      }

      return 0
    })

    return sorted[0]?.meta
  }

  return {
    render: ({ count, position, markers }) => {
      const dominantMeta = markers ? getDominantMeta(markers as MarkerLike[]) : undefined
      const color = dominantMeta?.color || DEFAULT_CLUSTER_COLOR
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

export default function AtlasMap({ objects, loading, language, selectedTypeIds }: MapProps) {
  const mapRef = useRef<google.maps.Map | null>(null)
  const clustererRef = useRef<MarkerClusterer | null>(null)
  const markersRef = useRef<MarkerWithMeta[]>([])
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
      markersRef.current.forEach(detachMarker)
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
    if (!mapRef.current || loading) return
    if (!(window as any).google || !(window as any).google.maps) {
      setMapError('Google Maps SDK not available')
      return
    }

    markersRef.current.forEach(detachMarker)
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

    const newMarkers: MarkerWithMeta[] = []

    objects.forEach(obj => {
      if (obj.latitude == null || obj.longitude == null) return

      const markerContent = document.createElement('div')
      markerContent.style.backgroundColor = obj.type?.color || DEFAULT_CLUSTER_COLOR
      markerContent.style.border = '2px solid white'
      markerContent.style.borderRadius = '50%'
      markerContent.style.height = '16px'
      markerContent.style.width = '16px'
      markerContent.style.boxSizing = 'border-box'

      const marker = new google.maps.marker.AdvancedMarkerElement({
        position: { lat: obj.latitude, lng: obj.longitude },
        title: obj.name || '',
        content: markerContent
      }) as MarkerWithMeta

      marker.__markerMeta = {
        typeId: obj.type?.id,
        typeCode: obj.type?.code,
        typeName: obj.type?.name,
        color: obj.type?.color || DEFAULT_CLUSTER_COLOR
      }

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
        renderer: createClusterRenderer(selectedTypeIds),
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
  }, [objects, loading, language, mapReady, selectedTypeIds])

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
