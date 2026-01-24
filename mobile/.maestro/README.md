# Vrumi Connect - Maestro E2E Tests

Este diretório contém os testes E2E automatizados usando [Maestro](https://maestro.mobile.dev/).

## Instalação do Maestro

### Windows (via PowerShell como Admin)
```powershell
iwr -useb https://get.maestro.mobile.dev/Install-Maestro.ps1 | iex
```

### macOS/Linux
```bash
curl -fsSL https://get.maestro.mobile.dev | bash
```

## Executando os Testes

### Teste individual
```bash
maestro test .maestro/01_login.yaml
```

### Todos os testes
```bash
maestro test .maestro/
```

### Com gravação de vídeo
```bash
maestro record .maestro/01_login.yaml
```

## Estrutura dos Testes

| Arquivo | Descrição |
|---------|-----------|
| `01_login.yaml` | Fluxo de login do usuário |
| `02_busca_instrutor.yaml` | Busca e visualização de instrutores |
| `03_agendamento.yaml` | Fluxo completo de agendamento de aula |
| `04_instrutor_onboarding.yaml` | Cadastro de instrutor |
| `05_instrutor_dashboard.yaml` | Painel do instrutor |

## Credenciais de Teste

Para os testes funcionarem, você precisa definir variáveis de ambiente:

```bash
export TEST_USER_EMAIL="teste@exemplo.com"
export TEST_USER_PASSWORD="senha123"
export TEST_INSTRUCTOR_EMAIL="instrutor@exemplo.com"
export TEST_INSTRUCTOR_PASSWORD="senha123"
```

Ou crie o arquivo `.maestro/config.yaml`:
```yaml
env:
  TEST_USER_EMAIL: "teste@exemplo.com"
  TEST_USER_PASSWORD: "senha123"
```
