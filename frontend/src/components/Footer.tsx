import { Zap, Github, Twitter, Heart } from 'lucide-react';

const footerLinks = {
  product: [
    { label: 'Recursos', href: '#recursos' },
    { label: 'Preços', href: '#' },
    { label: 'API', href: '#' },
  ],
  company: [
    { label: 'Sobre', href: '#' },
    { label: 'Blog', href: '#' },
    { label: 'Carreiras', href: '#' },
  ],
  support: [
    { label: 'Central de Ajuda', href: '#' },
    { label: 'Contato', href: '#' },
    { label: 'Status', href: '#' },
  ],
  legal: [
    { label: 'Privacidade', href: '#' },
    { label: 'Termos', href: '#' },
    { label: 'Licença', href: '#' },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-gray-800/50 bg-gray-950" role="contentinfo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-8">
          <div className="col-span-2 sm:col-span-4 lg:col-span-1 mb-4 lg:mb-0">
            <a href="#inicio" className="flex items-center gap-2 mb-4" aria-label="ConvertFlow - Página inicial">
              <div className="p-2 bg-gradient-to-br from-primary-500 to-blue-600 rounded-lg" aria-hidden="true">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary-400 to-blue-500 bg-clip-text text-transparent">
                ConvertFlow
              </span>
            </a>
            <p className="text-gray-500 text-sm max-w-xs">
              Uma maneira simples e organizada de processar seus conteúdos de mídia autorizados.
            </p>
          </div>

          {Object.entries(footerLinks).map(([category, links]) => (
            <nav key={category} aria-label={category}>
              <h3 className="text-sm font-semibold text-white mb-4 capitalize">{category}</h3>
              <ul className="space-y-3 list-none">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-gray-500 hover:text-gray-300 focus:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded text-sm transition-colors duration-200"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-gray-800/50">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-gray-500 text-sm">
              © {new Date().getFullYear()} ConvertFlow. Todos os direitos reservados.
            </p>

            <div className="flex items-center gap-4">
              <a
                href="#"
                className="text-gray-500 hover:text-gray-300 focus:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded transition-colors duration-200"
                aria-label="GitHub do ConvertFlow"
              >
                <Github className="h-5 w-5" aria-hidden="true" />
              </a>
              <a
                href="#"
                className="text-gray-500 hover:text-gray-300 focus:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded transition-colors duration-200"
                aria-label="Twitter do ConvertFlow"
              >
                <Twitter className="h-5 w-5" aria-hidden="true" />
              </a>
              <span className="text-gray-600 text-sm flex items-center gap-1">
                Feito com <Heart className="h-3 w-3 text-red-500 fill-red-500" aria-hidden="true" /> para criadores de conteúdo
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
