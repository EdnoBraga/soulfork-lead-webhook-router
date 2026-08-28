"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { normalizarSite, normalizarMetaLeadAds, normalizarWhatsApp } = require("../src/normalizadores");

test("normalizarSite mapeia campos diretos", () => {
  const lead = normalizarSite({ nome: "Ana", email: "ana@x.com", telefone: "6199999999", mensagem: "oi" });
  assert.equal(lead.nome, "Ana");
  assert.equal(lead.origem, "site");
  assert.ok(lead.capturadoEm);
});

test("normalizarSite lida com payload vazio sem quebrar", () => {
  const lead = normalizarSite({});
  assert.equal(lead.nome, null);
  assert.equal(lead.origem, "site");
});

test("normalizarMetaLeadAds extrai de field_data", () => {
  const payload = {
    field_data: [
      { name: "full_name", values: ["Bruno Silva"] },
      { name: "email", values: ["bruno@x.com"] },
      { name: "phone_number", values: ["+5561988887777"] },
    ],
  };
  const lead = normalizarMetaLeadAds(payload);
  assert.equal(lead.nome, "Bruno Silva");
  assert.equal(lead.email, "bruno@x.com");
  assert.equal(lead.origem, "meta_lead_ads");
});

test("normalizarMetaLeadAds sem field_data nao quebra", () => {
  const lead = normalizarMetaLeadAds({});
  assert.equal(lead.nome, null);
});

test("normalizarWhatsApp mapeia numero e texto", () => {
  const lead = normalizarWhatsApp({ numero: "5561999999999", nome: "Carla", texto: "quero orcamento" });
  assert.equal(lead.telefone, "5561999999999");
  assert.equal(lead.mensagem, "quero orcamento");
  assert.equal(lead.origem, "whatsapp");
});
