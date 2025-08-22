import { Box, Typography, Paper, Button } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import Link from 'next/link'
import PriorityDirectionForm from '@/components/admin/PriorityDirectionForm'
import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'

async function getPriorityDirection(id: string) {
  const direction = await prisma.priorityDirection.findUnique({
    where: { id },
    include: {
      translations: true
    }
  })
  
  if (!direction) {
    notFound()
  }
  
  return direction
}

export default async function EditPriorityDirectionPage({ params }: { params: { id: string } }) {
  const direction = await getPriorityDirection(params.id)
  
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
          Редактирование приоритетного направления
        </Typography>
      </Box>
      
      <Paper sx={{ p: 3 }}>
        <PriorityDirectionForm direction={direction} />
      </Paper>
    </Box>
  )
}