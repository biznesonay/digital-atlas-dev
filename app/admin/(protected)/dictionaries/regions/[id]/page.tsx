import { Box, Typography, Paper, Button } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import Link from 'next/link'
import RegionForm from '@/components/admin/RegionForm'
import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'

async function getRegion(id: string) {
  const region = await prisma.region.findUnique({
    where: { id },
    include: {
      translations: true
    }
  })
  
  if (!region) {
    notFound()
  }
  
  return region
}

export default async function EditRegionPage({ params }: { params: { id: string } }) {
  const region = await getRegion(params.id)
  
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
          Редактирование региона
        </Typography>
      </Box>
      
      <Paper sx={{ p: 3 }}>
        <RegionForm region={region} />
      </Paper>
    </Box>
  )
}