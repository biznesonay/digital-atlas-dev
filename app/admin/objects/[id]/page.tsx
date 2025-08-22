import { Box, Typography, Paper } from '@mui/material'
import ObjectForm from '@/components/admin/ObjectForm'
import { getAdminObject } from '@/app/actions/objects'
import prisma from '@/lib/prisma'

async function getDictionaries() {
  const [types, regions, directions] = await Promise.all([
    prisma.infrastructureType.findMany({
      orderBy: { order: 'asc' },
      include: {
        translations: {
          where: { languageCode: 'ru' }
        }
      }
    }),
    prisma.region.findMany({
      orderBy: { order: 'asc' },
      include: {
        translations: {
          where: { languageCode: 'ru' }
        }
      }
    }),
    prisma.priorityDirection.findMany({
      orderBy: { order: 'asc' },
      include: {
        translations: {
          where: { languageCode: 'ru' }
        }
      }
    })
  ])

  return { types, regions, directions }
}

export default async function EditObjectPage({ params }: { params: { id: string } }) {
  const [object, dictionaries] = await Promise.all([
    getAdminObject(params.id),
    getDictionaries()
  ])

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Редактирование объекта
      </Typography>
      
      <Paper sx={{ p: 3, mt: 3 }}>
        <ObjectForm
          object={object}
          types={dictionaries.types}
          regions={dictionaries.regions}
          directions={dictionaries.directions}
        />
      </Paper>
    </Box>
  )
}