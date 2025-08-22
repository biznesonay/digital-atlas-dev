import { Box, Typography, Paper, Button } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import Link from 'next/link'
import InfrastructureTypeForm from '@/components/admin/InfrastructureTypeForm'
import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'

async function getInfrastructureType(id: string) {
  const type = await prisma.infrastructureType.findUnique({
    where: { id },
    include: {
      translations: true
    }
  })
  
  if (!type) {
    notFound()
  }
  
  return type
}

export default async function EditInfrastructureTypePage({ params }: { params: { id: string } }) {
  const type = await getInfrastructureType(params.id)
  
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
          Редактирование типа инфраструктуры
        </Typography>
      </Box>
      
      <Paper sx={{ p: 3 }}>
        <InfrastructureTypeForm type={type} />
      </Paper>
    </Box>
  )
}