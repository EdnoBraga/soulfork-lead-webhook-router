"use strict";
// roteador.js -- envia um lead normalizado para cada destino configurado,
// com retry por backoff exponencial. A falha de um destino nao afeta os outros
// (Promise.allSettled), e o chamador recebe o resultado de cada um.

const dormirPadrao = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function enviarComRetry({ destino, lead, fetchImpl = fetch, tentativas = 3, atrasoBaseMs = 500, sleepImpl = dormirPadrao }) {
  let ultimoErro;
  for (let tentativa = 1; tentativa <= tentativas; tentativa++) {
    try {
      const resp = await fetchImpl(destino.url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lead),
      });
      if (!resp.ok) throw new Error(`resposta ${resp.status}`);
      return { destino: destino.nome, ok: true, tentativas: tentativa };
    } catch (e) {
      ultimoErro = e;
      if (tentativa < tentativas) {
        await sleepImpl(atrasoBaseMs * 2 ** (tentativa - 1));
      }
    }
  }
  return { destino: destino.nome, ok: false, tentativas, erro: ultimoErro.message };
}

async function rotear({ lead, destinos, fetchImpl, sleepImpl, tentativas, atrasoBaseMs }) {
  const resultados = await Promise.all(
    destinos.map((destino) => enviarComRetry({ destino, lead, fetchImpl, sleepImpl, tentativas, atrasoBaseMs }))
  );
  return resultados;
}

module.exports = { rotear, enviarComRetry };
