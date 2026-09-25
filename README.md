<img width="1512" height="856" alt="image" src="https://github.com/user-attachments/assets/97649f9f-cde9-4e33-9ba8-3f9072ffea9d" />

# Структура:
`
src/
├── app/              # Точка входа, стили приложения и Error Boundary
├── entities/         # Доменные сущности чатов и сообщений
├── features/         # Авторизация, создание чата, сообщения, синхронизация
├── pages/            # Страницы приложения
├── shared/           # API, hooks, UI-компоненты и утилиты
├── widgets/          # Составные виджеты интерфейса
└── styles/           # Общие стили
`

Коммиты написаны по методологии [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/)
Используется Feature-Sliced Design.

# Основные сценарии:

1) проверка состояния экземпляра;
2) получение данных аккаунта;
3) получение уведомлений;
4) отправка текстовых сообщений.
5) Демо-режим использует локальный транспорт и эмулятор API. Реальный режим работает через GREEN-API.

# Скрипты и окружение
Для базового запуска переменные окружения не требуются: адрес API и учётные данные вводятся через интерфейс.

# Требования
Node.js >= 22.13.0

# Запуск:

1) Клонировать репозиторий:

`
git clone https://github.com/artashesfrangyan/MUX.git
`

2) Перейти в папку проекта:
`
cd MUX
`
3)Установить зависимости:
`
npm install
`
4) Запустить dev-сервер:
`
npm run dev
`
5) Открыть в браузере:
http://localhost:5173
или указанный в консоли адрес

# Инструкция по тестированию:

1) Открыть приложение.
<img width="1512" height="858" alt="image" src="https://github.com/user-attachments/assets/8b8efb2f-d39a-4a74-920d-e6a4a648be83" />

2) Перейти в demo-режим или зайти в свой аккаунт по данным инстанса.
<img width="1512" height="859" alt="image" src="https://github.com/user-attachments/assets/225dc837-4ffa-4a01-8592-65b428c4608e" />

3) Создать чат с номером получателя.
<img width="1511" height="857" alt="image" src="https://github.com/user-attachments/assets/bc633d4b-032f-46f5-b54b-1bacf69cbc25" />

4) Отправить текстовое сообщение.
5) Убедиться, что получатель получил сообщение (если это не demo-режим) или что он ответил (если это demo-режим)
