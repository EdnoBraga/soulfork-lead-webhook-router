"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { rotear, enviarComRetry } = require("../src/roteador");

test("envia para todos os destinos com sucesso", async () => {
  const chamadas = [];
  const fetchImpl = async (url) => {
    chamadas.push(url);
    return { ok: true, json: async () => ({}) };
  };
  const resultados = await rotear({
    lead: { nome: "X" },
    destinos: [{ nome: "crm", url: "https://a" }, { nome: "planilha", url: "https://b" }],
    fetchImpl,
  });
  assert.equal(resultados.length, 2);
  assert.ok(resultados.every((r) => r.ok));
  assert.equal(chamadas.length, 2);
});

test("tenta de novo e da certo na segunda tentativa", async () => {
  let chamada = 0;
  const fetchImpl = async () => {
    chamada++;
    if (chamada === 1) return { ok: false };
    return { ok: true, json: async () => ({}) };
  };
  const resultado = await enviarComRetry({
    destino: { nome: "crm", url: "https://a" },
    lead: {},
    fetchImpl,
    sleepImpl: async () => {},
    tentativas: 3,
  });
  assert.equal(resultado.ok, true);
  assert.equal(resultado.tentativas, 2);
});

test("destino permanentemente fora do ar nao impede os outros destinos", async () => {
  const fetchImpl = async (url) => {
    if (url === "https://falho") return { ok: false };
    return { ok: true, json: async () => ({}) };
  };
  const resultados = await rotear({
    lead: {},
    destinos: [{ nome: "quebrado", url: "https://falho" }, { nome: "ok", url: "https://bom" }],
    fetchImpl,
    sleepImpl: async () => {},
    tentativas: 2,
  });
  const quebrado = resultados.find((r) => r.destino === "quebrado");
  const ok = resultados.find((r) => r.destino === "ok");
  assert.equal(quebrado.ok, false);
  assert.equal(ok.ok, true);
});
