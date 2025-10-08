import { AppBar, Toolbar, Typography, Box } from '@mui/material'
import Link from 'next/link'
import LanguageSwitcher from './LanguageSwitcher'
import { LanguageCode, THEME_COLORS } from '@/lib/constants'

interface HeaderProps {
  language: LanguageCode
  onLanguageChange: (lang: LanguageCode) => void
}

export default function Header({ language, onLanguageChange }: HeaderProps) {
  const titles = {
    ru: 'Цифровой атлас инновационной инфраструктуры',
    kz: 'Инновациялық инфрақұрылымның цифрлық атласы',
    en: 'Digital Atlas of Innovation Infrastructure'
  }

  return (
    <AppBar 
      position="sticky" 
      sx={{ 
        backgroundColor: THEME_COLORS.headerBg,
        zIndex: 1100 
      }}
    >
      <Toolbar
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: { xs: 1, sm: 2 }
        }}
      >
        <Box
          sx={{
            flex: { xs: 1, sm: '0 0 auto' },
            display: 'flex',
            alignItems: 'center',
            justifyContent: { xs: 'center', sm: 'flex-start' }
          }}
        >
          <Link href="https://digital-atlas.kz/" aria-label="Digital Atlas homepage">
            <Box
              component="img"
              src="/images/logo.png"
              alt="Logo"
              sx={{
                height: { xs: 24, sm: 32, md: 40 },
                width: 'auto'
              }}
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          </Link>
        </Box>

        <Typography
          variant="h6"
          component="h1"
          sx={{
            flex: { xs: 0, sm: 1 },
            textAlign: { sm: 'center' },
            display: { xs: 'none', sm: 'block' },
            fontSize: { xs: '1rem', sm: '1.25rem' },
            whiteSpace: { xs: 'nowrap', sm: 'normal' },
            overflow: { xs: 'hidden', sm: 'visible' },
            textOverflow: { xs: 'ellipsis', sm: 'clip' }
          }}
        >
          {titles[language]}
        </Typography>

        <Box
          sx={{
            flex: { xs: 1, sm: '0 0 auto' },
            display: 'flex',
            justifyContent: 'flex-end'
          }}
        >
          <LanguageSwitcher
            currentLanguage={language}
            onLanguageChange={onLanguageChange}
          />
        </Box>
      </Toolbar>
    </AppBar>
  )
}