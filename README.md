# soulfork-lead-webhook-router

**Um lead pode chegar por três portas diferentes — formulário do site, Lead Ads da Meta, mensagem de WhatsApp — e cada uma fala um formato de dado diferente.** Este roteador normaliza os três num esquema único e distribui para quantos destinos forem configurados (CRM, planilha, Notion...), com retry automático quando um destino falha.

## O problema

Sem normalização, cada canal de captação vira uma integração própria no CRM, cada um com seu bug. E quando um destino cai (a API do CRM fora do ar, por exemplo), o lead se perde se não houver retry — e lead perdido é o pior tipo de bug, porque ninguém percebe até o cliente perguntar por que não foi contatado.

## Arquitetura

```
POST /webhook/site   ─┐
POST /webhook/meta    ├─▶ normaliza (schema único) ─▶ roteador ─▶ destino 1 (ex.: webhook do CRM)
POST /webhook/whatsapp┘         │                         ├─▶ destino 2 (ex.: planilha via webhook)
                                 │                         └─▶ destino 3 (ex.: Notion via webhook)
                          {nome, email, telefone,
                           origem, mensagem,
                           capturadoEm}
```

Cada destino recebe o mesmo payload normalizado. Se um destino falhar, o roteador tenta de novo com backoff exponencial (3 tentativas por padrão) — e a falha de um destino não trava os outros.

## Como rodar

```bash
npm install --production=false   # sem dependências de terceiro, só pra rodar os testes
cp destinos.example.json destinos.json   # edite com as URLs reais
node src/servidor.js
```

- `POST http://localhost:3000/webhook/site` — espera `{nome, email, telefone, mensagem}` (o formato que `soulfork-site-institucional-template` já envia).
- `POST http://localhost:3000/webhook/meta` — espera o formato de *leadgen* da Meta (`field_data` com `name`/`values`).
- `POST http://localhost:3000/webhook/whatsapp` — espera `{numero, nome, texto}` (formato simplificado de um webhook de WhatsApp).

## Testado

```bash
node --test
```

Cobre os três normalizadores (inclusive campo ausente/mal formatado) e o roteador: sucesso em todos os destinos, retry com sucesso na segunda tentativa, e destino permanentemente fora do ar não bloqueia os demais.

## Licença

MIT.
