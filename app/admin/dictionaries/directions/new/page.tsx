import { Box, Typography, Paper, Button } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import Link from 'next/link'
import PriorityDirectionForm from '@/components/admin/PriorityDirectionForm'

export default function NewPriorityDirectionPage() {
  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          component={Link}
          href="/admin/dictionaries/directions"
          startIcon={<ArrowBackIcon />}
          sx={{ mr: 2 }}
        >
          Назад
        </Button>
        <Typography variant="h4">
          Создание приоритетного направления
        </Typography>
      </Box>
      
      <Paper sx={{ p: 3 }}>
        <PriorityDirectionForm />
      </Paper>
    </Box>
  )
}