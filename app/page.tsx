'use client'

import { useState, useEffect } from 'react'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { theme } from '@/lib/theme'
import Header from '@/components/shared/Header'
import AtlasMap from '@/components/map/Map'
import FilterPanel from '@/components/map/FilterPanel'
import { MapFilters, ApiObject, ObjectsApiResponse } from '@/lib/types'
import { LanguageCode, SUPPORTED_LANGUAGES } from '@/lib/constants'

const DEFAULT_OBJECTS_LIMIT = (() => {
  const value = Number(process.env.NEXT_PUBLIC_OBJECTS_LIMIT ?? '500')
  if (!Number.isFinite(value) || value <= 0) {
    return 500
  }
  return Math.floor(value)
})()

export default function HomePage() {
  const [language, setLanguage] = useState<LanguageCode>('ru')
  const [filters, setFilters] = useState<MapFilters>({
    search: '',
    typeIds: [],
    regionIds: [],
    directionIds: [],
    lang: 'ru',
    page: 1,
    limit: DEFAULT_OBJECTS_LIMIT
  })
  const [objects, setObjects] = useState<ApiObject[]>([])
  const [loading, setLoading] = useState(true)
  const [totalObjects, setTotalObjects] = useState(0)

  // Инициализация языка из query параметров или localStorage
  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const supportedLanguageCodes = SUPPORTED_LANGUAGES.map(lang => lang.code) as LanguageCode[]
    const isSupportedLanguage = (value: string | null): value is LanguageCode =>
      typeof value === 'string' && supportedLanguageCodes.includes(value as LanguageCode)

    const params = new URLSearchParams(window.location.search)
    const urlLang = params.get('lang')
    const storedLang = localStorage.getItem('language')

    const nextLanguage: LanguageCode =
      (isSupportedLanguage(urlLang) ? urlLang : null) ??
      (isSupportedLanguage(storedLang) ? storedLang : null) ??
      'ru'

    setLanguage(nextLanguage)
    setFilters(prev => ({ ...prev, lang: nextLanguage, page: 1 }))
    localStorage.setItem('language', nextLanguage)

    if (urlLang !== nextLanguage) {
      params.set('lang', nextLanguage)
      const queryString = params.toString()
      const search = queryString ? `?${queryString}` : ''
      const hash = window.location.hash ?? ''
      window.history.replaceState(null, '', `${window.location.pathname}${search}${hash}`)
    }
  }, [])

  // Загрузка объектов при изменении фильтров
  useEffect(() => {
    const controller = new AbortController()

    const fetchObjects = async () => {
      setLoading(true)
      setTotalObjects(0)
      try {
        const params = new URLSearchParams()
        params.append('lang', filters.lang)
        params.append('page', String(filters.page ?? 1))
        params.append('limit', String(filters.limit ?? DEFAULT_OBJECTS_LIMIT))

        if (filters.search) {
          params.append('search', filters.search)
        }

        filters.typeIds.forEach(id => params.append('typeIds[]', id))
        filters.regionIds.forEach(id => params.append('regionIds[]', id))
        filters.directionIds.forEach(id => params.append('directionIds[]', id))

        const response = await fetch(`/api/objects?${params.toString()}`, {
          signal: controller.signal
        })
        if (!controller.signal.aborted && response.ok) {
          const data: ObjectsApiResponse = await response.json()
          setObjects(data.data)
          setTotalObjects(data.meta?.total ?? data.data.length)
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error('Error fetching objects:', error)
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    fetchObjects()

    return () => {
      controller.abort()
    }
  }, [filters])

  const handleFilterChange = (newFilters: Partial<MapFilters>) => {
    setFilters(prev => {
      const next: MapFilters = { ...prev, ...newFilters }

      if (!('page' in newFilters)) {
        next.page = 1
      }

      if (next.limit === undefined || next.limit <= 0) {
        next.limit = DEFAULT_OBJECTS_LIMIT
      }

      return next
    })
  }

  const handleResetFilters = () => {
    setFilters({
      search: '',
      typeIds: [],
      regionIds: [],
      directionIds: [],
      lang: language,
      page: 1,
      limit: DEFAULT_OBJECTS_LIMIT
    })
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Header language={language} />
        <div style={{ flex: 1, position: 'relative' }}>
          <AtlasMap
            objects={objects}
            loading={loading}
            language={language}
            selectedTypeIds={filters.typeIds}
          />
          <FilterPanel
            filters={filters}
            onFilterChange={handleFilterChange}
            onReset={handleResetFilters}
            language={language}
            totalObjects={totalObjects}
          />
        </div>
      </div>
    </ThemeProvider>
  )
}

