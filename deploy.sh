#!/bin/bash

echo "🚀 Iniciando deployment do Leitor de Planilhas..."

# Build do projeto
echo "📦 Construindo o projeto..."
npm run build

# Verificar se o build foi bem-sucedido
if [ $? -ne 0 ]; then
    echo "❌ Erro ao construir o projeto"
    exit 1
fi

# Deploy para Vercel
echo "☁️  Fazendo deploy para Vercel..."
npx vercel --prod

echo "✅ Deployment concluído!"