#!/bin/bash
# Скрипт для принудительного деплоя на GitHub Pages

echo "🚀 Запуск принудительного деплоя..."

# Создаем пустой коммит для триггера workflow
git commit --allow-empty -m "🚀 Force deploy to GitHub Pages"

# Пушим изменения
git push origin main

echo "✅ Коммит отправлен, workflow должен запуститься"
echo "📊 Проверьте статус деплоя: https://github.com/genaforvena/couch-guardian/actions"
echo "🌐 Ссылка на игру: https://genaforvena.github.io/couch-guardian/"