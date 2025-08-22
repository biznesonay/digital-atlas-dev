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
  IconButton,
  Box,
  Tooltip,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  deleteInfrastructureType, 
  deleteRegion, 
  deletePriorityDirection 
} from '@/app/actions/dictionaries'

interface Column {
  field: string
  label: string
  width?: number
}

interface DictionaryTableProps {
  items: any[]
  type: 'infrastructureType' | 'region' | 'priorityDirection'
  columns: Column[]
}

export default function DictionaryTable({ items, type, columns }: DictionaryTableProps) {
  const router = useRouter()
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; item: any | null }>({
    open: false,
    item: null
  })
  const [loading, setLoading] = useState(false)

  const getEditUrl = (item: any) => {
    switch (type) {
      case 'infrastructureType':
        return `/admin/dictionaries/types/${item.id}`
      case 'region':
        return `/admin/dictionaries/regions/${item.id}`
      case 'priorityDirection':
        return `/admin/dictionaries/directions/${item.id}`
    }
  }

  const handleDelete = async () => {
    if (!deleteDialog.item) return
    
    setLoading(true)
    try {
      switch (type) {
        case 'infrastructureType':
          await deleteInfrastructureType(deleteDialog.item.id)
          break
        case 'region':
          await deleteRegion(deleteDialog.item.id)
          break
        case 'priorityDirection':
          await deletePriorityDirection(deleteDialog.item.id)
          break
      }
      
      setDeleteDialog({ open: false, item: null })
      router.refresh()
    } catch (error: any) {
      alert(error.message || 'Ошибка при удалении')
    } finally {
      setLoading(false)
    }
  }

  const getCellValue = (item: any, field: string) => {
    switch (field) {
      case 'name':
        const translation = item.translations?.find((t: any) => t.languageCode === 'ru')
        return translation?.name || '-'
      
      case 'color':
        if (item.markerColor) {
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  backgroundColor: item.markerColor,
                  border: '2px solid #ccc'
                }}
              />
              <Typography variant="body2">
                {item.markerColor}
              </Typography>
            </Box>
          )
        }
        return '-'
      
      case 'count':
        return item._count?.objects || 0
      
      default:
        return item[field] || '-'
    }
  }

  return (
    <>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell key={column.field} width={column.width}>
                  {column.label}
                </TableCell>
              ))}
              <TableCell align="center" width={100}>
                Действия
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id} hover>
                {columns.map((column) => (
                  <TableCell key={column.field}>
                    {getCellValue(item, column.field)}
                  </TableCell>
                ))}
                <TableCell align="center">
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                    <Tooltip title="Редактировать">
                      <IconButton
                        size="small"
                        component={Link}
                        href={getEditUrl(item)}
                        color="primary"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Удалить">
                      <span>
                        <IconButton
                          size="small"
                          onClick={() => setDeleteDialog({ open: true, item })}
                          color="error"
                          disabled={item._count?.objects > 0}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length + 1} align="center">
                  <Typography color="text.secondary" sx={{ py: 3 }}>
                    Записи не найдены
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, item: null })}>
        <DialogTitle>Подтверждение удаления</DialogTitle>
        <DialogContent>
          <Typography>
            Вы действительно хотите удалить запись "{deleteDialog.item?.translations?.[0]?.name || deleteDialog.item?.code}"?
            Это действие нельзя отменить.
          </Typography>
          {deleteDialog.item?._count?.objects > 0 && (
            <Typography color="error" sx={{ mt: 2 }}>
              Невозможно удалить: существует {deleteDialog.item._count.objects} связанных объектов
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, item: null })}>
            Отмена
          </Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            disabled={loading || deleteDialog.item?._count?.objects > 0}
          >
            {loading ? 'Удаление...' : 'Удалить'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}