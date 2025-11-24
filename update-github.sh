#!/bin/bash

echo "🔄 Atualizando GitHub..."
echo ""

# Pergunta o que mudou
echo "📝 O que você mudou no código?"
read -p "Descrição: " mensagem

echo ""
echo "📤 Enviando mudanças..."

git add .
git commit -m "$mensagem"
git push

echo ""
echo "✅ Pronto! Suas mudanças foram enviadas para o GitHub!"
echo "🔗 Acesse: https://github.com/cbaldofetal-collab/nutrigest"