#!/usr/bin/env node
"use strict";
const http = require("http");
const fs = require("fs");
const path = require("path");
const { normalizarSite, normalizarMetaLeadAds, normalizarWhatsApp } = require("./normalizadores");
const { rotear } = require("./roteador");

function carregarDestinos() {
  const caminho = path.join(__dirname, "..", "destinos.json");
  if (!fs.existsSync(caminho)) return [];
  return JSON.parse(fs.readFileSync(caminho, "utf8"));
}

const ROTAS = {
  "/webhook/site": normalizarSite,
  "/webhook/meta": normalizarMetaLeadAds,
  "/webhook/whatsapp": normalizarWhatsApp,
};

function criarServidor({ destinos = carregarDestinos() } = {}) {
  return http.createServer(async (req, res) => {
    const normalizador = ROTAS[req.url];
    if (req.method !== "POST" || !normalizador) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ erro: "rota nao encontrada" }));
      return;
    }

    let corpo = "";
    req.on("data", (chunk) => (corpo += chunk));
    req.on("end", async () => {
      try {
        const payload = corpo ? JSON.parse(corpo) : {};
        const lead = normalizador(payload);
        const resultados = await rotear({ lead, destinos });
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ lead, resultados }));
      } catch (e) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ erro: e.message }));
      }
    });
  });
}

if (require.main === module) {
  const servidor = criarServidor();
  const porta = process.env.PORTA || 3000;
  servidor.listen(porta, () => console.log(`ouvindo em http://localhost:${porta}`));
}

module.exports = { criarServidor };
