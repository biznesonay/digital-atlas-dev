import { Box, Typography, Paper, Button } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import Link from 'next/link'
import InfrastructureTypeForm from '@/components/admin/InfrastructureTypeForm'

export default function NewInfrastructureTypePage() {
  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          component={Link}
          href="/admin/dictionaries/types"
          startIcon={<ArrowBackIcon />}
          sx={{ mr: 2 }}
        >
          Назад
        </Button>
        <Typography variant="h4">
          Создание типа инфраструктуры
        </Typography>
      </Box>
      
      <Paper sx={{ p: 3 }}>
        <InfrastructureTypeForm />
      </Paper>
    </Box>
  )
}