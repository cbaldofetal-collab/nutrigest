# NutriGest - Monitoramento Nutricional Inteligente para Gestantes

![NutriGest Logo](https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200&h=200&fit=crop&crop=center)

Um aplicativo web moderno e completo para monitoramento nutricional durante a gestação, com foco em diabetes gestacional e acompanhamento de saúde materna.

## 🌟 Funcionalidades Principais

### 📊 Dashboard Inteligente
- Visualização clara de dados de glicemia
- Gráficos interativos de tendências
- Acompanhamento de metas e alertas
- Resumo semanal e mensal

### 🍎 Nutrição e Hidratação
- Registro de refeições e nutrientes
- Acompanhamento de hidratação diária
- Cálculo de adequação nutricional
- Recomendações personalizadas

### 📱 Interface Mobile-First
- Design responsivo e intuitivo
- Navegação otimizada para gestantes
- Acessibilidade aprimorada
- Suporte a leitores de tela

### 🔐 Segurança e Privacidade
- Autenticação segura com JWT
- Backup automático de dados
- Criptografia de informações sensíveis
- Controle de acesso granular

## 🚀 Tecnologias Utilizadas

### Frontend
- **React 18** com TypeScript
- **Vite** para build otimizado
- **Tailwind CSS** para estilização
- **Zustand** para gerenciamento de estado
- **Recharts** para visualizações
- **Lucide React** para ícones

### Backend
- **Node.js** com Express
- **TypeScript** para type safety
- **JWT** para autenticação
- **CORS** configurado
- **Vercel** para deployment

### Banco de Dados
- **Supabase** (PostgreSQL)
- **Real-time** subscriptions
- **Row Level Security** (RLS)

## 📦 Instalação e Configuração

### Pré-requisitos
- Node.js (v18 ou superior)
- npm ou pnpm
- Conta no GitHub
- Conta no Vercel (opcional)

### Passo a Passo

1. **Clone o repositório**
```bash
git clone https://github.com/[seu-usuario]/nutrigest.git
cd nutrigest
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
Crie um arquivo `.env` na raiz do projeto:
```env
VITE_API_URL=http://localhost:3001/api
VITE_SUPABASE_URL=sua-url-do-supabase
VITE_SUPABASE_ANON_KEY=sua-chave-anon-do-supabase
```

4. **Inicie o servidor de desenvolvimento**
```bash
npm run dev
```

5. **Acesse o aplicativo**
Abra seu navegador e acesse: `http://localhost:5173`

## 🎯 Como Usar

### Para Gestantes
1. **Crie sua conta** com informações básicas
2. **Configure seu perfil** com dados da gestação
3. **Registre suas medições** de glicemia
4. **Acompanhe sua nutrição** diariamente
5. **Visualize relatórios** e tendências

### Para Profissionais de Saúde
1. **Acesse os relatórios** gerados pelas pacientes
2. **Monitore os dados** em tempo real
3. **Exporte informações** para análises
4. **Configure alertas** personalizados

## 📊 Estrutura do Projeto

```
nutrigest/
├── src/
│   ├── components/          # Componentes React reutilizáveis
│   ├── pages/              # Páginas principais do aplicativo
│   ├── stores/             # Gerenciamento de estado (Zustand)
│   ├── services/           # Serviços de API e utilitários
│   ├── utils/              # Funções utilitárias
│   ├── types/              # Definições TypeScript
│   └── config/             # Configurações do projeto
├── api/                    # Backend Express
│   ├── src/
│   │   ├── controllers/    # Controladores da API
│   │   ├── routes/        # Rotas da API
│   │   └── services/      # Lógica de negócio
│   └── dist/              # Build do backend
├── supabase/              # Configurações do Supabase
│   └── migrations/        # Migrações do banco de dados
├── public/                # Arquivos estáticos
└── vercel.json            # Configuração de deployment
```

## 🔧 Desenvolvimento

### Scripts Disponíveis

- `npm run dev` - Inicia ambos frontend e backend em modo desenvolvimento
- `npm run client:dev` - Apenas frontend
- `npm run server:dev` - Apenas backend
- `npm run build` - Build de produção
- `npm run check` - Verificação TypeScript
- `npm run lint` - Linting de código

### Contribuindo

1. Fork o projeto
2. Crie sua feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 🚀 Deployment

### Vercel (Recomendado)
1. Conecte seu repositório GitHub ao Vercel
2. Configure as variáveis de ambiente
3. Deploy automático a cada push

### Outros servidores
1. Faça o build do projeto: `npm run build`
2. Configure as variáveis de ambiente
3. Deploy dos arquivos em `dist/`

## 📱 Demonstração

Acesse a versão ao vivo: [https://traesms2lg1s.vercel.app](https://traesms2lg1s.vercel.app)

### Credenciais de Teste
- Email: `gestante@demo.com`
- Senha: `demo123`

## 🛡️ Segurança

- Autenticação JWT com refresh tokens
- CORS configurado adequadamente
- Validação de dados em todas as entradas
- Proteção contra SQL injection
- Criptografia de dados sensíveis

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 👥 Autores

- **Seu Nome** - *Trabalho inicial* - [SeuGitHub](https://github.com/seu-usuario)

## 🙏 Agradecimentos

- Equipe de desenvolvimento
- Comunidade open source
- Ferramentas e bibliotecas utilizadas

---

⭐ Se este projeto foi útil para você, considere dar uma estrela no GitHub!
