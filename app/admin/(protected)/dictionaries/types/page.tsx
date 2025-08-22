import { Box, Typography, Button } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import Link from 'next/link'
import { getInfrastructureTypes } from '@/app/actions/dictionaries'
import DictionaryTable from '@/components/admin/DictionaryTable'

export default async function InfrastructureTypesPage() {
  const types = await getInfrastructureTypes()

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          component={Link}
          href="/admin/dictionaries"
          startIcon={<ArrowBackIcon />}
          sx={{ mr: 2 }}
        >
          Назад
        </Button>
        <Typography variant="h4" sx={{ flexGrow: 1 }}>
          Типы инфраструктуры
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          component={Link}
          href="/admin/dictionaries/types/new"
        >
          Добавить тип
        </Button>
      </Box>

      <DictionaryTable
        items={types}
        type="infrastructureType"
        columns={[
          { field: 'code', label: 'Код', width: 150 },
          { field: 'name', label: 'Название', width: 300 },
          { field: 'color', label: 'Цвет', width: 100 },
          { field: 'order', label: 'Порядок', width: 100 },
          { field: 'count', label: 'Объектов', width: 100 }
        ]}
      />
    </Box>
  )
}