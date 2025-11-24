#!/bin/bash

echo "🔧 Iniciando build para Vercel..."

# Build do frontend
echo "🏗️  Construindo frontend..."
npm run build:frontend

# Build do backend
echo "🏗️  Construindo backend..."
cd api
npm install
npm run build
cd ..

# Copiar arquivo de debug
echo "📄 Copiando arquivo de debug..."
cp debug.html dist/

echo "✅ Build concluído!"