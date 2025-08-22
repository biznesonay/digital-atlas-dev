import { Box, Typography, Button } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import Link from 'next/link'
import { getPriorityDirections } from '@/app/actions/dictionaries'
import DictionaryTable from '@/components/admin/DictionaryTable'

export default async function PriorityDirectionsPage() {
  const directions = await getPriorityDirections()

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
          Приоритетные направления
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          component={Link}
          href="/admin/dictionaries/directions/new"
        >
          Добавить направление
        </Button>
      </Box>

      <DictionaryTable
        items={directions}
        type="priorityDirection"
        columns={[
          { field: 'name', label: 'Название', width: 500 },
          { field: 'order', label: 'Порядок', width: 100 },
          { field: 'count', label: 'Объектов', width: 100 }
        ]}
      />
    </Box>
  )
}