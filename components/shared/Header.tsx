import { AppBar, Toolbar, Typography, Box } from '@mui/material'
import Link from 'next/link'
import { Actor } from 'next/font/google'
import LanguageSwitcher from './LanguageSwitcher'
import { LanguageCode, THEME_COLORS } from '@/lib/constants'

const actorFont = Actor({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
})

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
          <Link
            href="https://digital-atlas.kz/"
            aria-label="Digital Atlas homepage"
            style={{ textDecoration: 'none' }}
          >
            <Typography
              component="span"
              className={actorFont.className}
              sx={{
                color: 'inherit',
                display: 'inline-flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'center', sm: 'baseline' },
                textAlign: { xs: 'center', sm: 'left' },
                fontSize: { xs: '1.1rem', sm: '1.45rem', md: '1.75rem' },
                letterSpacing: { xs: '0.06em', sm: '0.12em' },
                lineHeight: { xs: 1.1, sm: 1.2 },
                gap: { xs: 0, sm: 0.75 }
              }}
            >
              <Box component="span">DIGITAL</Box>
              <Box component="span">ATLAS</Box>
            </Typography>
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