import { Button, ButtonGroup } from '@mui/material'
import Image from 'next/image'
import { SUPPORTED_LANGUAGES, LanguageCode } from '@/lib/constants'

interface LanguageSwitcherProps {
  currentLanguage: LanguageCode
  onLanguageChange: (lang: LanguageCode) => void
}

export default function LanguageSwitcher({ 
  currentLanguage, 
  onLanguageChange 
}: LanguageSwitcherProps) {
  return (
    <ButtonGroup 
      variant="contained" 
      size="small"
      sx={{ 
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        '& .MuiButton-root': {
          color: 'white',
          borderColor: 'rgba(255, 255, 255, 0.3)',
          minWidth: { xs: 40, sm: 60 },
          fontSize: { xs: '0.75rem', sm: '0.875rem' }
        },
        '& .MuiButton-root.active': {
          backgroundColor: 'rgba(255, 255, 255, 0.2)'
        }
      }}
    >
      {SUPPORTED_LANGUAGES.map(lang => (
        <Button
          key={lang.code}
          className={currentLanguage === lang.code ? 'active' : ''}
          onClick={() => onLanguageChange(lang.code as LanguageCode)}
          title={lang.name}
        >
          <Image
            src={lang.iconSrc}
            alt={`${lang.name} flag`}
            width={20}
            height={14}
            style={{ marginRight: 4, borderRadius: 2 }}
          />
          <span className="lang-code">{lang.code.toUpperCase()}</span>
        </Button>
      ))}
    </ButtonGroup>
  )
}