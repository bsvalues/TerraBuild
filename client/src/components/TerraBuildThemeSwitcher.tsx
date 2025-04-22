import React from 'react';
import { useTerraBuildTheme } from './TerraBuildThemeProvider';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Sun, Moon, Sparkles } from 'lucide-react';

interface ThemeSwitcherProps {
  className?: string;
}

export function TerraBuildThemeSwitcher({ className = '' }: ThemeSwitcherProps) {
  const { theme, mode, setTheme, toggleMode } = useTerraBuildTheme();

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <div className="flex items-center gap-2">
        <Sun className={`h-4 w-4 ${mode === 'dark' ? 'text-muted-foreground' : 'text-amber-500'}`} />
        <Switch
          checked={mode === 'dark'}
          onCheckedChange={toggleMode}
        />
        <Moon className={`h-4 w-4 ${mode === 'light' ? 'text-muted-foreground' : 'text-indigo-400'}`} />
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          variant={theme === 'standard' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setTheme('standard')}
          className="px-2 h-8"
        >
          Standard
        </Button>
        <Button
          variant={theme === 'advanced' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setTheme('advanced')}
          className="px-2 h-8 flex items-center gap-1"
        >
          <span>Advanced</span>
          <Sparkles className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

export default TerraBuildThemeSwitcher;