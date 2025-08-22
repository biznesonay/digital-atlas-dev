import { AppBar, Toolbar, Typography, Box } from '@mui/material'
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
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
          <img 
            src="/images/logo.png" 
            alt="Logo" 
            style={{ height: 40, marginRight: 16 }}
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
        </Box>
        
        <Typography 
          variant="h6" 
          component="h1" 
          sx={{ 
            flexGrow: 1,
            fontSize: { xs: '1rem', sm: '1.25rem' },
            whiteSpace: { xs: 'nowrap', sm: 'normal' },
            overflow: { xs: 'hidden', sm: 'visible' },
            textOverflow: { xs: 'ellipsis', sm: 'clip' }
          }}
        >
          {titles[language]}
        </Typography>
        
        <LanguageSwitcher 
          currentLanguage={language}
          onLanguageChange={onLanguageChange}
        />
      </Toolbar>
    </AppBar>
  )
}