# Privchat - Messenger 2

Полнофункциональное веб-приложение мессенджера с шифрованием и поддержкой реал-тайм коммуникации.

## 📋 Описание проекта

Privchat — это приложение для приватного обмена сообщениями с поддержкой:
- 🔐 Аутентификация и авторизация через JWT
- 💬 Реал-тайм обмен сообщениями (WebSocket)
- 📱 Современный и адаптивный UI
- 🗄️ PostgreSQL база данных
- 📦 Redis для кеширования и сессий

## 🏗️ Стек технологий

### Frontend
- **Framework**: [Next.js 14.1.0](https://nextjs.org/) (React 18)
- **Язык**: TypeScript
- **Стили**: Tailwind CSS
- **Состояние**: Zustand
- **HTTP клиент**: Axios
- **UI компоненты**: Lucide React
- **Тестирование**: Vitest

### Backend
- **Framework**: [Phoenix 1.7.10](https://www.phoenixframework.org/) (Elixir)
- **БД**: PostgreSQL 15 + Ecto
- **Кеш**: Redis 7
- **WebSocket**: Phoenix Channels
- **Аутентификация**: JWT (joken)
- **Парольное хеширование**: Bcrypt

## 📦 Требования

### Для локального запуска (без Docker)

**Frontend:**
- Node.js >= 18.0.0
- npm или yarn

**Backend:**
- Elixir >= 1.14
- Erlang >= 24.0
- PostgreSQL >= 13
- Redis >= 6.0

### Для запуска через Docker
- Docker >= 20.10
- Docker Compose >= 1.29

## 🚀 Быстрый старт

### С помощью Docker (рекомендуется)

```bash
# Запустить все сервисы
make up

# Создать БД и выполнить миграции
make backend_migrate

# Просмотр логов
make logs

# Остановить контейнеры
make down
```

Приложение будет доступно:
- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- PostgreSQL: localhost:5432
- Redis: localhost:6379

## 🖥️ Локальная разработка

### Запуск Frontend

```bash
cd apps/frontend

# Установить зависимости
npm install

# Запустить dev сервер
npm run dev

# Или использовать yarn
yarn install
yarn dev
```

Frontend будет доступен на http://localhost:3000

**Доступные скрипты:**
```bash
npm run dev      # Запустить dev сервер на порту 3000
npm run build    # Build для production
npm run start    # Запустить production сервер
npm run lint     # Проверить код линтером
npm run test     # Запустить тесты (vitest)
```

### Запуск Backend

#### Требуется локально:
- PostgreSQL (на localhost:5432)
- Redis (на localhost:6379)

```bash
cd apps/backend

# Установить зависимости
mix deps.get

# Создать БД и выполнить миграции
mix ecto.create
mix ecto.migrate

# Запустить dev сервер
mix phx.server
```

Backend будет доступен на http://localhost:4000

**Доступные команды:**
```bash
mix deps.get          # Установить зависимости
mix ecto.create       # Создать БД
mix ecto.migrate      # Выполнить миграции
mix ecto.reset        # Сбросить БД (drop + create + migrate)
mix phx.server        # Запустить dev сервер
mix test              # Запустить тесты
mix format            # Форматировать код
```

## ⚙️ Конфигурация

### Переменные окружения

Создайте файл `.env` в корне проекта контролем переменные для Backend:

```env
# Database
DATABASE_URL=ecto://privchat:privchat@localhost/privchat_dev

# JWT
JWT_SECRET=your_secret_key_here_change_in_production

# Phoenix
SECRET_KEY_BASE=your_secret_key_base_change_in_production
PHX_HOST=localhost
PHX_PORT=4000

# Redis
REDIS_URL=redis://localhost:6379

# PostgreSQL
POSTGRES_USER=privchat
POSTGRES_PASSWORD=privchat
POSTGRES_DB=privchat_dev
```

## 🧪 Тестирование

### Frontend тесты
```bash
cd apps/frontend
npm run test
```

### Backend тесты
```bash
cd apps/backend
mix test
```

### С помощью Docker
```bash
make frontend_test
make backend_test
```

## 📁 Структура проекта

```
messenger2/
├── apps/
│   ├── backend/              # Elixir/Phoenix Backend
│   │   ├── config/           # Конфигурация
│   │   ├── lib/              # Исходный код
│   │   ├── priv/repo/        # Миграции БД
│   │   ├── test/             # Тесты
│   │   └── mix.exs           # Зависимости
│   │
│   └── frontend/             # Next.js Frontend
│       ├── app/              # App Router
│       ├── components/       # React компоненты
│       ├── lib/              # Утилиты и хуки
│       ├── store/            # Zustand хранилища
│       ├── types/            # TypeScript типы
│       └── package.json      # Зависимости
│
├── docker-compose.yml        # Docker Compose конфигурация
├── Makefile                  # Make команды
└── README.md                 # Этот файл
```

## 🔧 Стандартные команды

### Makefile команды

```bash
make up                   # Запустить все сервисы (Docker)
make down                 # Остановить все сервисы
make logs                 # Просмотр логов всех сервисов
make backend_frontend     # Запустить только backend и frontend
make backend_migrate      # Создать БД и выполнить миграции
make backend_test         # Запустить backend тесты
make frontend_test        # Запустить frontend тесты
```

## 🐛 Отладка

### Просмотр логов Docker контейнеров
```bash
# Все сервисы
make logs

# Конкретный сервис
docker compose logs backend
docker compose logs frontend
docker compose logs db
docker compose logs redis
```

### Подключение к PostgreSQL
```bash
# Через Docker
docker compose exec db psql -U privchat -d privchat_dev

# Локально, если установлен psql
psql -U privchat -d privchat_dev -h localhost
```

### Проверка Redis
```bash
docker compose exec redis redis-cli
```

## 🔐 Безопасность

- JWT токены используются для аутентификации
- Пароли хешируются с помощью bcrypt
- CORS настроен для безопасности
- Используйте сильные значения для `JWT_SECRET` и `SECRET_KEY_BASE` в production

## 📝 Contributes

Инструкции для контрибьютеров (при необходимости добавить)

## 📄 Лицензия

(Укажите лицензию проекта здесь)

## 📞 Контакты и поддержка

(Укажите способы контакта здесь)

---

**Примечание**: Убедитесь, что вы используете правильные значения для `SECRET_KEY_BASE` и `JWT_SECRET` в production окружении. Никогда не коммитьте реальные секреты в репозиторий.

## 📘 Обзор реализованного функционала (PrivChat)

### Архитектура

- **Backend**: Elixir/Phoenix (`apps/backend`), JSON API + WebSocket (`/socket`, канал `chat:*`).
- **Frontend (Next.js 14, React 18)**: `apps/frontend`, app‑router, Zustand‑сторы, адаптивный UI.
- **Realtime**: Phoenix Channels (`ChatChannel`) + клиент `phoenix` на фронте (`lib/socket.ts`).

### Что уже есть сейчас

- **Регистрация и логин**:
  - JWT‑аутентификация, токен хранится в localStorage, подставляется в `Authorization: Bearer ...`.
  - Нормализация телефона, уникальные `phone`/`username`, хеширование паролей.
- **Поиск пользователей**:
  - Эндпоинт `GET /api/users/search?q=...` с поиском по телефону, username и display_name (без учёта регистра и формата номера).
- **Контакты**:
  - `GET /api/contacts` — список контактов текущего пользователя.
  - `POST /api/contacts` — добавление контакта (двусторонняя связь), фронт обновляет стор `friends-store`.
- **Чаты**:
  - **Прямые диалоги** (`kind = "direct"`), уникальный `direct_key` на пару пользователей.
  - **Групповые чаты** (`kind = "group"`) с выбором участников из контактов.
  - Список чатов (`GET /api/chats`), отображение имени собеседника для прямых чатов.
  - Сайдбар с фильтрами (все/непрочитанные/закрепленные), закрепление чатов.
- **Сообщения**:
  - Загрузка истории `GET /api/chats/:id/messages`.
  - Отправка `POST /api/chats/:id/messages` + броадкаст по WebSocket.
  - Оптимистичная отправка на фронте с состояниями `sending/sent/failed`.
  - Поддержка сообщений **без текста**, но с вложениями (файлы/голосовые).
- **Вложения и голосовые**:
  - Эндпоинт `POST /api/uploads` (мультипарт), сохранение файлов в `priv/static/uploads`, раздача через `Plug.Static`.
  - На фронте `uploadFile(file)` и передача массива `attachments` в `envelope_metadata`.
  - Голосовые сообщения через `MediaRecorder` + загрузка как аудио‑вложение, проигрывание через `<audio>` в `MessageBubble`.
- **Realtime‑индикатор набора текста**:
  - Событие `typing` в `ChatChannel`, рассылается всем участникам чата кроме отправителя.
  - В заголовке чата отображается статус «печатает…».
- **Уведомления**:
  - Локальное уведомление о новых входящих сообщениях через `notification-store`.
  - Центр уведомлений (`NotificationCenter`) с адаптивной модалкой:
    - На мобилке — полноэкранная панель.
    - На десктопе — компактный дропдаун под иконкой колокольчика в сайдбаре.
- **UI/UX особенности**:
  - Современный, светлый мессенджер‑интерфейс.
  - Адаптивный лайаут для десктопа и мобилки (отдельный верхний бар и нижнее меню, поле ввода не перекрывается).
  - Стороны «я»/«собеседник», статусы доставки, темы/шрифт и плотность через `theme-store`.

### Преимущества текущего решения

- **Реально realtime**: вебсокеты, Presence, онлайн‑индикатор и индикатор набора текста.
- **Скалируемость**: Phoenix + Ecto + Postgres, разделение на `Accounts` и `Messaging`.
- **Расширяемость протокола сообщений**: `envelope_metadata` позволяет добавлять новые типы контента (стикеры, реакции, системные события) без миграций схемы.
- **Хорошая типизация и тесты**:
  - TypeScript с alias’ами для типов и стор.
  - Vitest‑тесты для zustand‑сторов (auth/theme/chat) уже настроены.

### Идеи для дальнейшего роста

- **Шифрование**:
  - End‑to‑end шифрование сообщений (хранить только зашифрованное `body` + метаданные ключей).
  - Безопасное резервное копирование ключей.
- **Медиа и вложения**:
  - Превью изображений/документов, валидация типов/размера на бэке.
  - Ограничение квоты/лимитов на пользователя.
- **Продвинутая сигнализация присутствия**:
  - «Печатает…» для групп (перечень пользователей).
  - Информация «онлайн/был в сети N минут назад».
- **Уведомления и PWA**:
  - Push‑уведомления (Web Push, мобильные).
  - PWA‑оболочка с оффлайн‑кэшем последних диалогов.
- **Админка и модерация**:
  - Роли пользователей, модерация чатов/приглашений.
  - Просмотр ошибок/логов, мониторинг подключений каналов.

Этот раздел описывает реальное текущее состояние проекта PrivChat и может служить быстрым ориентиром для новых разработчиков и инвесторов. 
