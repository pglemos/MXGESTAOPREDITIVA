# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: smoke-flows.test.ts >> Smoke Flows: Authenticated Experience >> Admin Login Bypass & Dashboard Navigation
- Location: src/test/e2e/smoke-flows.test.ts:10:3

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /.*painel/
Received string:  "http://localhost:3000/login"
Timeout: 5000ms

Call log:
  - Expect "toHaveURL" with timeout 5000ms
    9 × unexpected value "http://localhost:3000/login"

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - main [ref=e3]:
    - generic [ref=e4]:
      - generic [ref=e5]:
        - img [ref=e7]
        - heading "MX PERFORMANCE" [level=1] [ref=e11]
        - text: ACESSO AO SISTEMA DE ELITE
      - generic [ref=e13]:
        - generic [ref=e14]:
          - text: E-mail
          - generic [ref=e15]:
            - img [ref=e16]
            - textbox "seu@email.com.br" [ref=e19]: admin@mxperformance.com.br
        - generic [ref=e20]:
          - text: Senha
          - generic [ref=e21]:
            - img [ref=e22]
            - textbox "••••••••" [active] [ref=e25]
        - button "ENTRAR NA MALHA" [ref=e26]:
          - generic [ref=e27]: ENTRAR NA MALHA
      - generic [ref=e28]: Acesso restrito • v4.0
  - region "Notifications alt+T"
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | /**
  4  |  * SMOKE TESTS: MX Performance Core Flows
  5  |  * Objetivo: Validar que os fluxos principais estão operacionais após a refatoração.
  6  |  */
  7  | 
  8  | test.describe('Smoke Flows: Authenticated Experience', () => {
  9  | 
  10 |   test('Admin Login Bypass & Dashboard Navigation', async ({ page }) => {
  11 |     // 1. Acesso à página de login
  12 |     await page.goto('/login');
  13 |     
  14 |     // 2. Preenchimento via E2E Bypass (conforme src/pages/Login.tsx)
  15 |     await page.fill('input[type="email"]', 'admin@mxperformance.com.br');
  16 |     await page.fill('input[type="password"]', 'Mx#2026!');
  17 |     
  18 |     // 3. Submissão
  19 |     await page.click('button[type="submit"]');
  20 | 
  21 |     // 4. Validação de redirecionamento para o Painel do Consultor
> 22 |     await expect(page).toHaveURL(/.*painel/);
     |                        ^ Error: expect(page).toHaveURL(expected) failed
  23 |     await expect(page.locator('h1')).toContainText(/PAINEL DO CONSULTOR/i);
  24 |     
  25 |     // 5. Navegação para Lojas (Admin Flow)
  26 |     await page.goto('/lojas');
  27 |     await expect(page.locator('h1')).toContainText(/GESTÃO DE LOJAS/i);
  28 | 
  29 |     console.log('✅ Admin Smoke Test: Login & Navigation OK.');
  30 |   });
  31 | 
  32 |   test('Vendedor/Manager Basic Navigation', async ({ page }) => {
  33 |     // Como não temos bypass para vendedor no momento, vamos testar apenas o carregamento das rotas
  34 |     // em um cenário onde o login pudesse ser injetado via storageState.
  35 |     // Para este smoke test, validamos apenas a existência das páginas públicas.
  36 |     await page.goto('/login');
  37 |     await expect(page.locator('text=MX PERFORMANCE')).toBeVisible();
  38 |   });
  39 | 
  40 |   test('Checkin & Ranking Routes Accessibility', async ({ page }) => {
  41 |     // Tentativa de acesso direto (deve redirecionar se não logado, mas validamos o fluxo)
  42 |     await page.goto('/ranking');
  43 |     await expect(page).toHaveURL(/.*login/); // Redirecionamento esperado por falta de auth
  44 |   });
  45 | });
  46 | 
```