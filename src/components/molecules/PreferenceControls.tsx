import DarkModeIcon from '@mui/icons-material/DarkMode';
import LanguageIcon from '@mui/icons-material/Language';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Tooltip from '@mui/material/Tooltip';
import { styled } from '@mui/material/styles';
import { useState } from 'react';
import { type AppLanguage, languageNames } from '@/i18n/translations';
import { usePreferences } from '@/contexts/PreferencesContext';

const ThemeSwitch = styled(Switch)(({ theme }) => ({
  width: 70,
  height: 38,
  padding: 0,
  '& .MuiSwitch-switchBase': {
    padding: 4,
    transitionDuration: '220ms',
    '&.Mui-checked': {
      transform: 'translateX(32px)',
      color: '#fff',
      '& + .MuiSwitch-track': {
        background: 'linear-gradient(135deg, #0f172a, #334155)',
        opacity: 1
      }
    }
  },
  '& .MuiSwitch-thumb': {
    width: 30,
    height: 30,
    display: 'grid',
    placeItems: 'center',
    backgroundColor: theme.palette.mode === 'dark' ? '#e2e8f0' : '#fff7ed',
    boxShadow: '0 6px 18px rgba(15,23,42,0.22)'
  },
  '& .MuiSwitch-track': {
    borderRadius: 999,
    opacity: 1,
    background: 'linear-gradient(135deg, #fbbf24, #38bdf8)',
    border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(148,163,184,0.28)' : 'rgba(15,23,42,0.12)'}`
  }
}));

export function PreferenceControls({ compact = false }: { compact?: boolean }) {
  const { themeMode, toggleThemeMode, language, setLanguage, t } = usePreferences();
  const [languageOpen, setLanguageOpen] = useState(false);
  const [languageTooltipOpen, setLanguageTooltipOpen] = useState(false);
  const isDark = themeMode === 'dark';

  return (
    <Stack direction={compact ? 'column' : 'row'} spacing={1} alignItems="center">
      <Tooltip title={isDark ? t('themeDark') : t('themeLight')}>
        <Box
          sx={{
            position: 'relative',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <ThemeSwitch
            checked={isDark}
            onChange={toggleThemeMode}
            inputProps={{ 'aria-label': isDark ? t('themeDark') : t('themeLight') }}
          />
          <Box
            sx={{
              pointerEvents: 'none',
              position: 'absolute',
              left: isDark ? 38 : 8,
              top: 8,
              color: isDark ? '#0f172a' : '#b45309',
              display: 'grid',
              placeItems: 'center',
              transition: 'left 220ms ease, color 220ms ease'
            }}
          >
            {isDark ? <DarkModeIcon sx={{ fontSize: 20 }} /> : <WbSunnyIcon sx={{ fontSize: 20 }} />}
          </Box>
        </Box>
      </Tooltip>

      <Tooltip
        title={t('language')}
        placement="right"
        open={!languageOpen && languageTooltipOpen}
        onOpen={() => {
          if (!languageOpen) setLanguageTooltipOpen(true);
        }}
        onClose={() => setLanguageTooltipOpen(false)}
      >
        <Select
          size="small"
          value={language}
          open={languageOpen}
          onOpen={() => {
            setLanguageTooltipOpen(false);
            setLanguageOpen(true);
          }}
          onClose={() => {
            setLanguageTooltipOpen(false);
            setLanguageOpen(false);
          }}
          onChange={(event) => {
            setLanguage(event.target.value as AppLanguage);
            setLanguageTooltipOpen(false);
            setLanguageOpen(false);
          }}
          MenuProps={{ disablePortal: false }}
          startAdornment={!compact ? <LanguageIcon sx={{ mr: 0.75, fontSize: 18, color: 'text.secondary' }} /> : undefined}
          sx={{
            minWidth: compact ? 64 : 152,
            height: 38,
            borderRadius: 999,
            fontWeight: 800,
            bgcolor: 'background.paper',
            '& .MuiSelect-select': {
              py: 0.75,
              pl: compact ? 1.5 : undefined
            }
          }}
          inputProps={{ 'aria-label': t('language') }}
        >
          {(Object.keys(languageNames) as AppLanguage[]).map((item) => (
            <MenuItem key={item} value={item}>
              {compact ? item.split('-')[0].toUpperCase() : languageNames[item]}
            </MenuItem>
          ))}
        </Select>
      </Tooltip>
    </Stack>
  );
}
