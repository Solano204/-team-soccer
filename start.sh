#!/bin/bash
# ============================================================
#  TEAM SOCCER — Arranque local
# ============================================================
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "🐳  Levantando base de datos PostgreSQL..."
docker compose -f "$ROOT/docker-compose.yml" up -d

echo "⏳  Esperando que Postgres esté listo..."
until docker exec teamsoccer_db pg_isready -U postgres -q; do
  sleep 1
done
echo "✅  Base de datos lista."

echo "📦  Instalando dependencias del backend..."
cd "$ROOT/backend"
npm install --silent

echo "🚀  Iniciando backend en http://localhost:3001 ..."
node server.js &
BACKEND_PID=$!

echo ""
echo "============================================"
echo "  ✅  Todo corriendo."
echo "  🌐  Abre el frontend en tu navegador:"
echo "      file://$ROOT/frontend/login/index.html"
echo ""
echo "  Usuario: jaguar  |  Contraseña: jaguar123"
echo "============================================"
echo ""
echo "  Presiona Ctrl+C para detener el backend."
trap "kill $BACKEND_PID 2>/dev/null; echo 'Backend detenido.'" EXIT
wait $BACKEND_PID
