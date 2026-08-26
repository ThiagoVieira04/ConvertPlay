# Instalação do FFmpeg

O ConvertFlow utiliza FFmpeg para conversão de mídia. Siga as instruções para seu sistema operacional.

## Windows

### Opção 1: Chocolatey
```powershell
choco install ffmpeg
```

### Opção 2: winget
```powershell
winget install Gyan.FFmpeg
```

### Opção 3: Download manual
1. Acesse https://ffmpeg.org/download.html
2. Baixe a versão "release full" para Windows
3. Extraia em `C:\ffmpeg`
4. Adicione `C:\ffmpeg\bin` ao PATH do sistema

### Verificação
```powershell
ffmpeg -version
```

## macOS

### Homebrew
```bash
brew install ffmpeg
```

### Verificação
```bash
ffmpeg -version
```

## Linux

### Ubuntu/Debian
```bash
sudo apt update
sudo apt install ffmpeg
```

### Fedora
```bash
sudo dnf install ffmpeg-free
```

### Arch Linux
```bash
sudo pacman -S ffmpeg
```

### Verificação
```bash
ffmpeg -version
```

## Docker

Se estiver usando o Docker Compose do projeto, o FFmpeg precisa estar instalado na imagem do Worker.

### Dockerfile exemplo
```dockerfile
FROM node:22-alpine

RUN apk add --no-cache ffmpeg

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

CMD ["npm", "start"]
```

## Configuração

O Worker utiliza a variável de ambiente `FFMPEG_PATH` para localizar o FFmpeg:

```env
FFMPEG_PATH=ffmpeg          # padrão: busca no PATH
FFMPEG_TIMEOUT_MS=300000    # timeout: 5 minutos
```

Se o FFmpeg estiver em um local específico:
```env
FFMPEG_PATH=/usr/local/bin/ffmpeg
```

## Formatos suportados

### MP3 (saída)
- 128 kbps
- 192 kbps
- 256 kbps
- 320 kbps

### MP4 (saída)
- best (CRF 0)
- good (CRF 23)
- standard (CRF 28)

### Entrada
Qualquer formato suportado pelo FFmpeg (mp4, webm, mkv, avi, mov, etc).
