# ConvertFlow

Plataforma de conversão de mídia online. Converta vídeos e playlists do YouTube para MP3 e MP4 com alta qualidade e processamento em background.

## Arquitetura

```
ConvertPlay/
├── frontend/     React + Vite + Tailwind CSS
├── backend/      Fastify API + Prisma + PostgreSQL
├── worker/       BullMQ Worker + FFmpeg + Redis
├── shared/       Tipos compartilhados
└── docker/       Docker Compose + Nginx
```

### Fluxo de Dados

```
Frontend → API (Fastify) → PostgreSQL (Jobs)
                    ↓
              BullMQ Queue → Redis
                    ↓
            Worker (FFmpeg) → Redis Pub/Sub → API SSE → Frontend
                    ↓
            Storage (ZIP/Files) → Download API → Frontend
```

## Pré-requisitos

- Node.js >= 20.x
- npm >= 10.x
- PostgreSQL >= 16
- Redis >= 7
- FFmpeg (para o worker)

## Instalação

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

```bash
cp backend/.env.example backend/.env
cp worker/.env.example worker/.env
```

Edite `backend/.env` e `worker/.env` com suas configurações.

### 3. Configurar banco de dados

```bash
cd backend
npx prisma migrate dev
npx prisma generate
```

### 4. Instalar FFmpeg

Veja `worker/FFMPEG.md` para instruções detalhadas.

**Windows:** `winget install ffmpeg`
**macOS:** `brew install ffmpeg`
**Linux:** `sudo apt install ffmpeg`

### 5. Iniciar os serviços

```bash
# Terminal 1 - Backend
npm run dev:backend

# Terminal 2 - Worker
npm run dev:worker

# Terminal 3 - Frontend
npm run dev:frontend

# Ou todos juntos:
npm run dev
```

## Docker

```bash
# Subir todos os serviços
npm run docker:up

# Ver logs
npm run docker:logs

# Parar
npm run docker:down
```

O frontend estará em `http://localhost`, API em `http://localhost:3001`.

## Variáveis de Ambiente

### Backend (`backend/.env`)

| Variável | Descrição | Padrão |
|---|---|---|
| `PORT` | Porta da API | `3001` |
| `HOST` | Host da API | `0.0.0.0` |
| `NODE_ENV` | Ambiente | `development` |
| `DATABASE_URL` | URL do PostgreSQL | - |
| `REDIS_URL` | URL do Redis | `redis://localhost:6379` |
| `CORS_ORIGIN` | Origem permitida | `http://localhost:5173` |
| `RATE_LIMIT_MAX` | Máx. requisições por janela | `30` |
| `RATE_LIMIT_WINDOW_MS` | Janela de rate limit (ms) | `60000` |
| `REQUEST_TIMEOUT_MS` | Timeout da requisição (ms) | `30000` |
| `MAX_URL_LENGTH` | Tamanho máx. da URL | `2048` |
| `MAX_ITEMS_PER_JOB` | Máx. itens por job | `50` |
| `JOB_TTL_HOURS` | TTL dos jobs (horas) | `72` |

### Worker (`worker/.env`)

| Variável | Descrição | Padrão |
|---|---|---|
| `DATABASE_URL` | URL do PostgreSQL | - |
| `REDIS_URL` | URL do Redis | `redis://localhost:6379` |
| `MAX_CONCURRENT_JOBS` | Jobs simultâneos | `2` |
| `FFMPEG_PATH` | Caminho do FFmpeg | `ffmpeg` |
| `FFMPEG_TIMEOUT_MS` | Timeout do FFmpeg (ms) | `300000` |
| `STORAGE_DIR` | Diretório de saída | `./storage/output` |
| `JOB_TTL_HOURS` | TTL dos jobs | `72` |

## API Endpoints

### Health

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/health` | Health check com métricas |
| GET | `/api/health/live` | Liveness probe |
| GET | `/api/health/ready` | Readiness probe |

### Mídia

| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/media/analyze` | Analisar URL de vídeo/playlist |

### Jobs

| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/jobs` | Criar novo job |
| GET | `/api/jobs` | Listar jobs (paginado) |
| GET | `/api/jobs/:id` | Progresso do job |
| GET | `/api/jobs/:id/details` | Detalhes do job |
| POST | `/api/jobs/:id/cancel` | Cancelar job |
| POST | `/api/jobs/:id/retry` | Retentar job com falha |
| GET | `/api/jobs/:id/events` | SSE real-time |

### Downloads

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/items/:id/download` | Download de arquivo individual |
| GET | `/api/jobs/:id/download.zip` | Download ZIP de todos os arquivos |
| GET | `/api/jobs/:id/download-info` | Info sobre arquivos disponíveis |

## Segurança

- **Rate limiting:** 30 requisições/minuto por IP
- **Request timeout:** 30 segundos
- **Path traversal protection:** Validação de caminhos de arquivo
- **Input sanitization:** Validação UUID, URLs, títulos
- **Security headers:** X-Content-Type-Options, X-Frame-Options, HSTS
- **CORS:** Configurável por variável de ambiente
- **FFmpeg safety:** Validação de argumentos, sem shell execution

## Acessibilidade

- Navegação por teclado em todos os componentes
- Labels ARIA em botões, links e regiões
- Contraste de cores WCAG AA
- Suporte a `prefers-reduced-motion`
- Suporte a `prefers-contrast: high`
- Focus ring visível em todos os elementos interativos
- Mensagens de erro com `role="alert"` e `aria-live`

## SEO

- Meta tags Open Graph e Twitter Card
- Sitemap XML e robots.txt
- Favicon SVG
- Canonical URL
- Locale `pt-BR`
- Semantic HTML (nav, section, article, footer)

## Tech Stack

| Camada | Tecnologias |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, React Router |
| Backend | Node.js, TypeScript, Fastify, Prisma, PostgreSQL |
| Worker | BullMQ, FFmpeg, Redis Pub/Sub |
| Infra | Docker, Nginx, Redis, PostgreSQL |

## Licença

MIT
