# MessageEx

Monorepo-скелет для MVP мессенджера (Android + Desktop + Node.js backend).

## Структура
- `apps/server` — NestJS backend (auth scaffold + API base)
- `apps/web` — React + Vite web клиент (auth UI в тёмной теме)
- `apps/mobile` — заготовка Android клиента
- `packages/shared-types` — общие типы

## Быстрый старт инфраструктуры
```bash
docker compose up -d
```

Сервисы:
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`
- MinIO API: `localhost:9000`
- MinIO Console: `localhost:9001`

## Что уже выполнено по плану
- Базовая monorepo-структура.
- Docker-инфраструктура PostgreSQL/Redis/MinIO.
- Backend auth endpoints: register/login/refresh/logout + me (with refresh revocation & rotation in-memory scaffold).
- Backend chat endpoints: create direct chat, list chats, send/list messages with cursor pagination (in-memory scaffold).
- Chat attachments: upload file to chat message and fetch file payload (in-memory base64 scaffold).
- Web auth UI (React) и визуальный mockup экрана входа.
- `.env.example` на корне и в приложениях.

## Новые chat file endpoints (scaffold)
- `POST /chats/:id/files` — загрузить файл в чат (JSON body с `fileName`, `mimeType`, `contentBase64`).
- `GET /chats/:id/files/:fileId` — получить метаданные и содержимое файла.
