import { Box, Typography, Button } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import Link from 'next/link'
import ObjectsTable from '@/components/admin/ObjectsTable'
import { getAdminObjects } from '@/app/actions/objects'

export default async function ObjectsPage({
  searchParams
}: {
  searchParams: { page?: string; search?: string; typeId?: string; regionId?: string }
}) {
  const page = parseInt(searchParams.page || '1')
  const data = await getAdminObjects({
    page,
    search: searchParams.search,
    typeId: searchParams.typeId,
    regionId: searchParams.regionId
  })

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Управление объектами
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          component={Link}
          href="/admin/objects/new"
          size="large"
        >
          Добавить объект
        </Button>
      </Box>

      <ObjectsTable
        objects={data.objects}
        total={data.total}
        page={page}
        pages={data.pages}
        searchParams={searchParams}
      />
    </Box>
  )
}