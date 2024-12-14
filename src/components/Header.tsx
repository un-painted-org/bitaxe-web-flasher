import Link from 'next/link'
import { Cpu } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ThemeToggle } from './ThemeToggle'
import LanguageSelector from './LanguageSelector'

interface HeaderProps {
  onOpenPanel: () => void;
}

export default function Header({ onOpenPanel }: HeaderProps) {
  const { t } = useTranslation();

  return (
    <header className="px-4 lg:px-6 h-14 flex items-center justify-between">
      {/* Left section */}
      <Link className="flex items-center justify-center" href="#">
        <Cpu className="h-6 w-6 mr-2" />
        <span className="font-bold">Bitaxe Web Flasher</span>
      </Link>

      {/* Middle section */}
      <div className="flex items-center">
        <a 
          href="https://discord.com/invite/osmu"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:opacity-90 transition-opacity"
        >
          <img 
            src="https://dcbadge.limes.pink/api/server/3E8ca2dkcC" 
            alt="Discord Server" 
            className="h-6"
          />
        </a>
      </div>

      {/* Right section */}
      <nav className="flex items-center gap-4 sm:gap-6">
        <Link className="text-sm font-medium hover:underline underline-offset-4" href="#features">
          {t('header.features')}
        </Link>
        <button
          className="text-sm font-medium hover:underline underline-offset-4"
          onClick={onOpenPanel}
        >
          {t('hero.getStarted')}
        </button>
        <LanguageSelector />
        <ThemeToggle />
      </nav>
    </header>
  )
}