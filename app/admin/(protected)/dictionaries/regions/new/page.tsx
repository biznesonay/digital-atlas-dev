import { Box, Typography, Paper, Button } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import Link from 'next/link'
import RegionForm from '@/components/admin/RegionForm'

export default function NewRegionPage() {
  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          component={Link}
          href="/admin/dictionaries/regions"
          startIcon={<ArrowBackIcon />}
          sx={{ mr: 2 }}
        >
          Назад
        </Button>
        <Typography variant="h4">
          Создание региона
        </Typography>
      </Box>
      
      <Paper sx={{ p: 3 }}>
        <RegionForm />
      </Paper>
    </Box>
  )
}