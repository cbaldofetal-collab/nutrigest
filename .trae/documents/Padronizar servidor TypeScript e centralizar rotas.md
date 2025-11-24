## Objetivos
- Padronizar o ambiente de desenvolvimento para usar `app.ts` e TypeScript.
- Centralizar middleware e rotas usando `src/routes/index.ts` (controllers/middlewares já existentes).
- Eliminar duplicidades entre `api/routes/*` e `src/controllers/*`, mantendo uma única fonte de verdade.
- Adicionar hot reload no dev (nodemon).

## Mudanças Principais
1. Substituir montagem de rotas em `api/app.ts` por `app.use('/api', apiRoutes)` importando de `src/routes/index.ts`.
2. Remover CORS e demais middlewares duplicados de `api/app.ts` (já configurados em `src/routes/index.ts`).
3. Unificar rotas de usuário: manter apenas `/api/user` (perfil), removendo/ajustando `/api/users` para evitar conflito.
4. Manter rota de glicose atual (`src/routes/glucose.routes.js`) via `require` temporariamente; planejar migração para TS depois.
5. Tipagem do perfil de usuário em `api/routes/users.ts`: substituir `any` por uma interface leve (campos opcionais) e corrigir o middleware `authenticateToken`.
6. Scripts de desenvolvimento: adicionar `nodemon` com `ts-node` para hot reload.
7. Validar health e rotas principais após ajustes.

## Passos de Implementação
1. `api/app.ts`
   - Importar `apiRoutes` de `src/routes/index.ts`.
   - Montar `app.use('/api', apiRoutes)`.
   - Remover `app.use('/api/auth'...)`, `sheets`, `analytics`, `users`, `processed-data` (ficam no router central).
   - Manter `glucose` por enquanto (`app.use('/api/glucose', glucoseRoutes)`).
   - Manter o health simples (`/api/health`) ou delegar ao router central; escolher um (preferir router central e remover do app).
2. `api/routes/users.ts`
   - Definir `interface UserProfile` com campos atuais e opcionais (`semana_gestacional`, `tipo_diabetes`).
   - Ajustar `mockUserProfile` para `UserProfile` e retirar `any`.
   - Corrigir `authenticateToken` para sempre retornar `void` e usar `next()` corretamente.
   - Se mantido, publicar apenas sob `/api/user` via router central; se não, remover arquivo.
3. `api/package.json`
   - Adicionar `nodemon` em devDeps.
   - Criar script `dev: "nodemon --exec ts-node server.ts"`.
4. `api/tsconfig.json`
   - Confirmar `module: "commonjs"` e opções necessárias (já presentes).
5. Verificação
   - Reiniciar `npm run dev`.
   - Validar `GET /api/health`.
   - Exercitar `POST /api/auth/login`, `GET /api/user/profile`, `POST /api/sheets/upload`.

## Considerações
- Backward compatível: endpoints base continuam em `/api/...`.
- Origens CORS seguem `ENV.FRONTEND_URL` de `src/config/constants.ts`.
- Posteriormente, migrar `glucose.routes.js` para TS e consolidar serviços/banco em `src/services/*`.

Confirma a execução deste plano agora?