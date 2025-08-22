'use client'

import { useState } from 'react'
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Box,
  TextField,
  InputAdornment,
  Tooltip,
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import SearchIcon from '@mui/icons-material/Search'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { deleteObject, toggleObjectPublish } from '@/app/actions/objects'

interface ObjectsTableProps {
  objects: any[]
  total: number
  page: number
  pages: number
  searchParams: any
}

export default function ObjectsTable({ objects, total, page, pages, searchParams }: ObjectsTableProps) {
  const router = useRouter()
  const [searchInput, setSearchInput] = useState(searchParams.search || '')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [objectToDelete, setObjectToDelete] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams(searchParams)
    if (searchInput) {
      params.set('search', searchInput)
    } else {
      params.delete('search')
    }
    params.set('page', '1')
    router.push(`/admin/objects?${params.toString()}`)
  }

  const handlePageChange = (event: unknown, newPage: number) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', String(newPage + 1))
    router.push(`/admin/objects?${params.toString()}`)
  }

  const handleTogglePublish = async (objectId: string) => {
    try {
      await toggleObjectPublish(objectId)
      router.refresh()
    } catch (error) {
      console.error('Error toggling publish:', error)
    }
  }

  const handleDeleteClick = (object: any) => {
    setObjectToDelete(object)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!objectToDelete) return
    
    setLoading(true)
    try {
      await deleteObject(objectToDelete.id)
      setDeleteDialogOpen(false)
      router.refresh()
    } catch (error) {
      console.error('Error deleting object:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Paper sx={{ mb: 3, p: 2 }}>
        <form onSubmit={handleSearch}>
          <TextField
            fullWidth
            placeholder="Поиск по названию или адресу..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              )
            }}
          />
        </form>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Название</TableCell>
              <TableCell>Тип</TableCell>
              <TableCell>Регион</TableCell>
              <TableCell>Адрес</TableCell>
              <TableCell align="center">Координаты</TableCell>
              <TableCell align="center">Опубликован</TableCell>
              <TableCell align="center">Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {objects.map((object) => {
              const translation = object.translations[0]
              const typeName = object.infrastructureType?.translations[0]?.name || object.infrastructureType?.code
              const regionName = object.region?.translations[0]?.name || object.region?.code
              
              return (
                <TableRow key={object.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {translation?.name || 'Без названия'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={typeName}
                      size="small"
                      sx={{
                        backgroundColor: object.infrastructureType.markerColor + '20',
                        color: object.infrastructureType.markerColor
                      }}
                    />
                  </TableCell>
                  <TableCell>{regionName}</TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {translation?.address || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    {object.latitude && object.longitude ? (
                      <Tooltip title={`${object.latitude}, ${object.longitude}`}>
                        <LocationOnIcon color="success" fontSize="small" />
                      </Tooltip>
                    ) : (
                      <LocationOnIcon color="disabled" fontSize="small" />
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Switch
                      checked={object.isPublished}
                      onChange={() => handleTogglePublish(object.id)}
                      color="primary"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                      <Tooltip title="Редактировать">
                        <IconButton
                          size="small"
                          component={Link}
                          href={`/admin/objects/${object.id}`}
                          color="primary"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Удалить">
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteClick(object)}
                          color="error"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              )
            })}
            {objects.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography color="text.secondary" sx={{ py: 3 }}>
                    Объекты не найдены
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        
        <TablePagination
          component="div"
          count={total}
          page={page - 1}
          onPageChange={handlePageChange}
          rowsPerPage={50}
          rowsPerPageOptions={[50]}
          labelRowsPerPage="Строк на странице:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} из ${count}`}
        />
      </TableContainer>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Подтверждение удаления</DialogTitle>
        <DialogContent>
          <Typography>
            Вы действительно хотите удалить объект "{objectToDelete?.translations[0]?.name}"?
            Это действие нельзя отменить.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Отмена
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={loading}
          >
            {loading ? 'Удаление...' : 'Удалить'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}