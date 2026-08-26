import { ClipboardPaste, Settings, Play, Download } from 'lucide-react';

const steps = [
  {
    icon: ClipboardPaste,
    number: '01',
    title: 'Cole a URL',
    description: 'Insira o link do vídeo ou playlist que deseja converter.',
  },
  {
    icon: Settings,
    number: '02',
    title: 'Escolha o formato',
    description: 'Selecione entre MP3, MP4 e outras opções de qualidade.',
  },
  {
    icon: Play,
    number: '03',
    title: 'Inicie o processamento',
    description: 'Clique em analisar e aguarde a conversão dos seus arquivos.',
  },
  {
    icon: Download,
    number: '04',
    title: 'Baixe seus arquivos',
    description: 'Salve seus arquivos convertidos no dispositivo desejado.',
  },
];

export function HowItWorks() {
  return (
    <section id="como-funciona" className="py-20 sm:py-32 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Como funciona
            </span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Um processo simples em quatro etapas para converter seus conteúdos de mídia.
          </p>
        </div>

        <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 list-none" aria-label="Processo de conversão">
          {steps.map((step, index) => (
            <li
              key={step.number}
              className="group relative p-6 bg-gray-900/50 border border-gray-800/50 rounded-2xl hover:border-primary-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary-500/5"
            >
              <div className="absolute -top-3 -right-3 w-10 h-10 bg-gradient-to-br from-primary-500 to-blue-600 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-primary-500/25" aria-hidden="true">
                {step.number}
              </div>

              <div className="w-12 h-12 bg-gray-800/50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary-500/10 transition-colors duration-300" aria-hidden="true">
                <step.icon className="h-6 w-6 text-primary-400" />
              </div>

              <h3 className="text-lg font-semibold text-white mb-2">{step.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{step.description}</p>

              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-0.5 bg-gradient-to-r from-primary-500/50 to-transparent" aria-hidden="true" />
              )}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
