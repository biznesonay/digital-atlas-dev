'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Paper,
  TextField,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Button,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  Chip,
  InputAdornment,
  IconButton,
  Divider,
  Badge,
  Autocomplete
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import RefreshIcon from '@mui/icons-material/Refresh'
import SearchIcon from '@mui/icons-material/Search'
import ClearIcon from '@mui/icons-material/Clear'
import ListIcon from '@mui/icons-material/List'
import { MapFilters } from '@/lib/types'
import { SEARCH_DEBOUNCE_MS } from '@/lib/constants'
import ObjectsList from './ObjectsList'
import { fetchObjectSuggestions } from '@/lib/api'

interface FilterPanelProps {
  filters: MapFilters
  onFilterChange: (filters: Partial<MapFilters>) => void
  onReset: () => void
  language: string
  totalObjects: number
}

interface DictionaryItem {
  id: string
  code?: string
  name: string
  color?: string
  order: number
}

export default function FilterPanel({
  filters,
  onFilterChange,
  onReset,
  language,
  totalObjects
}: FilterPanelProps) {
  const [types, setTypes] = useState<DictionaryItem[]>([])
  const [regions, setRegions] = useState<DictionaryItem[]>([])
  const [directions, setDirections] = useState<DictionaryItem[]>([])
  const [searchInput, setSearchInput] = useState(filters.search)
  const [showObjectsList, setShowObjectsList] = useState(false)
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const latestQueryRef = useRef<string>(filters.search || '')

  const labels = {
    ru: {
      filters: 'Фильтры',
      found: 'Найдено объектов',
      search: 'Поиск по названию или адресу',
      types: 'Типы инфраструктуры',
      regions: 'Регионы',
      directions: 'Приоритетные направления',
      reset: 'Сбросить фильтры',
      objectsList: 'Список объектов',
      clear: 'Очистить'
    },
    kz: {
      filters: 'Сүзгілер',
      found: 'Табылған объектілер',
      search: 'Атауы немесе мекенжайы бойынша іздеу',
      types: 'Инфрақұрылым түрлері',
      regions: 'Аймақтар',
      directions: 'Басым бағыттар',
      reset: 'Сүзгілерді тастау',
      objectsList: 'Объектілер тізімі',
      clear: 'Тазалау'
    },
    en: {
      filters: 'Filters',
      found: 'Objects found',
      search: 'Search by name or address',
      types: 'Infrastructure types',
      regions: 'Regions',
      directions: 'Priority directions',
      reset: 'Reset filters',
      objectsList: 'Objects list',
      clear: 'Clear'
    }
  }

  const t = labels[language as keyof typeof labels] || labels.ru

  // Загрузка справочников
  useEffect(() => {
    const fetchDictionaries = async () => {
      try {
        const [typesRes, regionsRes, directionsRes] = await Promise.all([
          fetch(`/api/infrastructure-types?lang=${language}`),
          fetch(`/api/regions?lang=${language}`),
          fetch(`/api/priority-directions?lang=${language}`)
        ])

        if (typesRes.ok) {
          const typesData = await typesRes.json()
          setTypes(typesData.data)
        }

        if (regionsRes.ok) {
          const regionsData = await regionsRes.json()
          setRegions(regionsData.data)
        }

        if (directionsRes.ok) {
          const directionsData = await directionsRes.json()
          setDirections(directionsData.data)
        }
      } catch (error) {
        console.error('Error fetching dictionaries:', error)
      }
    }

    fetchDictionaries()
  }, [language])

  // Дебаунс для поиска
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchInput(value)
      latestQueryRef.current = value
      if (searchTimeout) {
        clearTimeout(searchTimeout)
      }

      const timeout = setTimeout(async () => {
        onFilterChange({ search: value })
        if (value) {
          try {
            const opts = await fetchObjectSuggestions(value, filters.lang)
            if (latestQueryRef.current === value) {
              setSuggestions(opts)
            }
          } catch (e) {
            console.error('Error fetching suggestions:', e)
          }
        } else {
          setSuggestions([])
        }
      }, SEARCH_DEBOUNCE_MS)

      setSearchTimeout(timeout)
    },
    [searchTimeout, onFilterChange, filters.lang]
  )

  // Очистка таймера при размонтировании
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout)
      }
    }
  }, [searchTimeout])

  useEffect(() => {
    setSearchTimeout((prevTimeout) => {
      if (prevTimeout) {
        clearTimeout(prevTimeout)
      }
      return null
    })
    latestQueryRef.current = ''
    setSuggestions([])
  }, [language])

  useEffect(() => {
    const currentSearch = filters.search || ''
    setSearchInput(currentSearch)
    latestQueryRef.current = currentSearch

    if (!currentSearch) {
      setSuggestions([])
    }
  }, [filters.search])

  const handleTypeToggle = (typeId: string) => {
    const newTypeIds = filters.typeIds.includes(typeId)
      ? filters.typeIds.filter(id => id !== typeId)
      : [...filters.typeIds, typeId]
    onFilterChange({ typeIds: newTypeIds })
  }

  const handleRegionToggle = (regionId: string) => {
    const newRegionIds = filters.regionIds.includes(regionId)
      ? filters.regionIds.filter(id => id !== regionId)
      : [...filters.regionIds, regionId]
    onFilterChange({ regionIds: newRegionIds })
  }

  const handleDirectionToggle = (directionId: string) => {
    const newDirectionIds = filters.directionIds.includes(directionId)
      ? filters.directionIds.filter(id => id !== directionId)
      : [...filters.directionIds, directionId]
    onFilterChange({ directionIds: newDirectionIds })
  }

  const handleClearSearch = () => {
    setSearchInput('')
    onFilterChange({ search: '' })
    setSuggestions([])
    setSearchTimeout((prevTimeout) => {
      if (prevTimeout) {
        clearTimeout(prevTimeout)
      }
      return null
    })
    latestQueryRef.current = ''
  }

  const activeFiltersCount = 
    filters.typeIds.length + 
    filters.regionIds.length + 
    filters.directionIds.length +
    (filters.search ? 1 : 0)

  return (
    <>
      <Paper
        className="filter-panel"
        elevation={3}
        sx={{
          position: 'absolute',
          top: 80,
          left: 20,
          zIndex: 1000,
          width: { xs: 'calc(100% - 40px)', sm: 320 },
          maxHeight: 'calc(100vh - 100px)',
          overflow: 'auto',
          bottom: '20px'
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            {t.filters}
            {activeFiltersCount > 0 && (
             <Chip
                component="span"
                label={activeFiltersCount}
                size="small"
                color="primary"
                sx={{ ml: 1 }}
              />
            )}
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            <Chip 
              label={`${t.found}: ${totalObjects}`} 
              color="primary" 
              variant="outlined"
            />
            <IconButton
              size="small"
              onClick={() => setShowObjectsList(true)}
              sx={{ ml: 1 }}
              title={t.objectsList}
            >
              <Badge badgeContent={totalObjects} color="primary" max={999}>
                <ListIcon />
              </Badge>
            </IconButton>
          </Box>

          <Autocomplete
            freeSolo
            options={suggestions}
            inputValue={searchInput}
            onInputChange={(_e, value, reason) => {
              if (reason === 'input') {
                handleSearchChange(value)
              }
            }}
            onChange={(_e, value) => {
              if (typeof value === 'string') {
                setSearchInput(value)
                onFilterChange({ search: value })
                setSuggestions([])
                latestQueryRef.current = value
              }
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                fullWidth
                size="small"
                label={t.search}
                margin="normal"
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <>
                      {searchInput && (
                        <InputAdornment position="end">
                          <IconButton size="small" onClick={handleClearSearch}>
                            <ClearIcon />
                          </IconButton>
                        </InputAdornment>
                      )}
                      {params.InputProps.endAdornment}
                    </>
                  )
                }}
              />
            )}
          />

          <Divider sx={{ my: 2 }} />

          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>
                {t.types}
                {filters.typeIds.length > 0 && (
                  <Chip
                    component="span"
                    label={filters.typeIds.length}
                    size="small"
                    sx={{ ml: 1 }}
                  />
                )}
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <FormGroup>
                {types.map((type) => (
                  <FormControlLabel
                    key={type.id}
                    control={
                      <Checkbox
                        checked={filters.typeIds.includes(type.id)}
                        onChange={() => handleTypeToggle(type.id)}
                        sx={{
                          color: type.color,
                          '&.Mui-checked': {
                            color: type.color
                          }
                        }}
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            backgroundColor: type.color,
                            mr: 1
                          }}
                        />
                        {type.name}
                      </Box>
                    }
                  />
                ))}
              </FormGroup>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>
                {t.regions}
                {filters.regionIds.length > 0 && (
                  <Chip
                    component="span"
                    label={filters.regionIds.length}
                    size="small"
                    sx={{ ml: 1 }}
                  />
                )}
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <FormGroup>
                {regions.map((region) => (
                  <FormControlLabel
                    key={region.id}
                    control={
                      <Checkbox
                        checked={filters.regionIds.includes(region.id)}
                        onChange={() => handleRegionToggle(region.id)}
                      />
                    }
                    label={region.name}
                  />
                ))}
              </FormGroup>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>
                {t.directions}
                {filters.directionIds.length > 0 && (
                  <Chip
                    component="span"
                    label={filters.directionIds.length}
                    size="small"
                    sx={{ ml: 1 }}
                  />
                )}
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <FormGroup>
                {directions.map((direction) => (
                  <FormControlLabel
                    key={direction.id}
                    control={
                      <Checkbox
                        checked={filters.directionIds.includes(direction.id)}
                        onChange={() => handleDirectionToggle(direction.id)}
                      />
                    }
                    label={direction.name}
                  />
                ))}
              </FormGroup>
            </AccordionDetails>
          </Accordion>

          <Button
            fullWidth
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={onReset}
            sx={{ mt: 2 }}
            disabled={activeFiltersCount === 0}
          >
            {t.reset}
          </Button>
        </Box>
      </Paper>

      <ObjectsList
        open={showObjectsList}
        onClose={() => setShowObjectsList(false)}
        language={language}
        filters={filters}
      />
    </>
  )
}
