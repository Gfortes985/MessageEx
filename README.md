# MessageEx

Monorepo-скелет для MVP мессенджера (Android + Desktop + Node.js backend).

## Структура
- `apps/server` — NestJS backend (auth scaffold + API base)
- `apps/web` — заготовка web/desktop клиента
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
- Backend auth endpoints: register/login/refresh/logout (scaffold).
- `.env.example` на корне и в приложениях.
