#!/bin/bash

echo "🚀 Vamos enviar seu código para o GitHub!"
echo ""
echo "📋 Passo 1: Verificando status..."
git status

echo ""
echo "📤 Passo 2: Adicionando todos os arquivos..."
git add .

echo ""
echo "💾 Passo 3: Criando commit..."
git commit -m "Primeiro commit - NutriGest App"

echo ""
echo "🌐 Passo 4: Enviando para GitHub..."
echo "Quando pedir usuario: cbaldofetal-collab"
echo "Quando pedir senha: use sua senha do GitHub"
echo ""

git push -u origin main

echo ""
echo "✅ Pronto! Seu código foi enviado para o GitHub!"
echo "Acesse: https://github.com/cbaldofetal-collab/nutrigest"