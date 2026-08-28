"use strict";
// normalizadores.js -- cada funcao recebe o payload cru de um canal e
// devolve o mesmo formato: { nome, email, telefone, origem, mensagem, capturadoEm }

function agora() {
  return new Date().toISOString();
}

function normalizarSite(payload) {
  const p = payload || {};
  return {
    nome: p.nome || null,
    email: p.email || null,
    telefone: p.telefone || null,
    origem: "site",
    mensagem: p.mensagem || null,
    capturadoEm: agora(),
  };
}

// Formato de leadgen da Meta: campos vem em field_data: [{name, values:[valor]}]
function normalizarMetaLeadAds(payload) {
  const campos = {};
  const fieldData = (payload && payload.field_data) || [];
  for (const campo of fieldData) {
    const valor = Array.isArray(campo.values) ? campo.values[0] : campo.values;
    campos[campo.name] = valor;
  }
  return {
    nome: campos.full_name || campos.name || null,
    email: campos.email || null,
    telefone: campos.phone_number || campos.telefone || null,
    origem: "meta_lead_ads",
    mensagem: null,
    capturadoEm: agora(),
  };
}

function normalizarWhatsApp(payload) {
  const p = payload || {};
  return {
    nome: p.nome || null,
    email: null,
    telefone: p.numero || null,
    origem: "whatsapp",
    mensagem: p.texto || null,
    capturadoEm: agora(),
  };
}

module.exports = { normalizarSite, normalizarMetaLeadAds, normalizarWhatsApp };
