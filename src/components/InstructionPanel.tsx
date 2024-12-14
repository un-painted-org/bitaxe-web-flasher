import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface InstructionPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function InstructionPanel({ isOpen, onClose }: InstructionPanelProps) {
  const { t } = useTranslation();
  const steps = [1, 2, 3, 4, 5, 6, 7];

  return (
    <div className={`fixed top-[5vh] right-0 max-h-[80vh] w-64 bg-white dark:bg-gray-800 p-4 shadow-lg transform ${isOpen ? 'translate-x-20px' : 'translate-x-full'} transition-transform duration-300 ease-in-out rounded-lg`}>
      <button
        className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        onClick={onClose}
      >
        <X className="h-6 w-6" />
      </button>
      <h2 className="text-xl font-bold mb-4">{t('instructions.title')}</h2>
      <ol className="list-decimal list-inside space-y-2 text-sm">
        {steps.map((step) => (
          <li key={step}>{t(`instructions.steps.${step}`)}</li>
          ))}
      </ol>
      <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
        {t('instructions.moreInfo')}{' '}
          <a 
            className='text-blue-500' 
            href="https://www.osmu.wiki"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('instructions.documentation')}
          </a>.
      </p>
    </div>
  )
}