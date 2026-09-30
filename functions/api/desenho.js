import { gerarDesenho, numeroValido } from "../../lib/desenho.js";

function erro(status, mensagem) {
  return Response.json({ erro: mensagem }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function onRequest({ request, env }) {
  // 1. Método (405)
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: { Allow: "POST" } });
  }

  // 2. Corpo (400)
  let corpo;
  try {
    corpo = await request.json();
  } catch {
    return erro(400, "Corpo ausente ou JSON inválido.");
  }
  const numero = corpo?.numero;
  if (!numeroValido(numero)) return erro(400, "O número deve ser um inteiro entre 1 e 100.");

  // 3. Token (401)
  const auth = request.headers.get("Authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!token) return erro(401, "Token ausente.");

  const resposta = await fetch("https://oauth2.googleapis.com/tokeninfo?id_token=" + encodeURIComponent(token));
  if (resposta.status !== 200) return erro(401, "Token inválido ou expirado.");
  const info = await resposta.json();
  if (info.aud !== env.GOOGLE_CLIENT_ID || String(info.email_verified) !== "true" || !info.email) {
    return erro(401, "Token não aceito.");
  }

  // 4. Desenho assinado com o e-mail do token
  return new Response(gerarDesenho(numero, info.email), {
    headers: { "Content-Type": "image/svg+xml; charset=utf-8", "Cache-Control": "no-store" },
  });
}
