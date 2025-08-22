import { Box, Typography, Button } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import Link from 'next/link'
import { getRegions } from '@/app/actions/dictionaries'
import DictionaryTable from '@/components/admin/DictionaryTable'

export default async function RegionsPage() {
  const regions = await getRegions()

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
          Регионы
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          component={Link}
          href="/admin/dictionaries/regions/new"
        >
          Добавить регион
        </Button>
      </Box>

      <DictionaryTable
        items={regions}
        type="region"
        columns={[
          { field: 'code', label: 'Код', width: 200 },
          { field: 'name', label: 'Название', width: 400 },
          { field: 'order', label: 'Порядок', width: 100 },
          { field: 'count', label: 'Объектов', width: 100 }
        ]}
      />
    </Box>
  )
}