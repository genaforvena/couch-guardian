#!/bin/bash
echo "🔍 Проверка статуса деплоя..."

echo "1. Проверка GitHub Pages:"
curl -I https://genaforvena.github.io/couch-guardian/

echo ""
echo "2. Проверка ветки gh-pages:"
curl -s "https://raw.githubusercontent.com/genaforvena/couch-guardian/gh-pages/index.html" | head -5

echo ""
echo "3. Проверка Actions:"
echo "Открой: https://github.com/genaforvena/couch-guardian/actions"

echo ""
echo "4. Проверка настроек Pages:"
echo "Открой: https://github.com/genaforvena/couch-guardian/settings/pages"

echo ""
echo "📋 Что нужно сделать:"
echo "1. Убедись что GitHub Pages включен в настройках"
echo "2. Убедись что выбран branch: gh-pages, folder: / (root)"
echo "3. Подожди 2-3 минуты после сохранения"
echo "4. Проверь через curl снова"