const formulario = document.getElementById("formulario");
const campoNumero = document.getElementById("numero");
const area = document.getElementById("desenho");
const mensagem = document.getElementById("mensagem");
const botaoBaixar = document.getElementById("baixar");

let token = "";
let svgAtual = "";

// Chamada pelo botão do Google depois do login; recebe o id_token.
window.aoEntrar = (resposta) => {
  token = resposta.credential;
  mensagem.textContent = "Login feito. Escolha o número e clique em Desenhar.";
};

formulario.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  mensagem.textContent = "";
  area.innerHTML = "";
  botaoBaixar.hidden = true;

  const resposta = await fetch("/api/desenho", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
    body: JSON.stringify({ numero: Number(campoNumero.value) }),
  });

  if (resposta.status === 200) {
    svgAtual = await resposta.text();
    area.innerHTML = svgAtual;
    botaoBaixar.hidden = false;
  } else if (resposta.status === 400) {
    mensagem.textContent = "Erro 400: digite um número inteiro entre 1 e 100.";
  } else if (resposta.status === 401) {
    mensagem.textContent = "Erro 401: faça login com o Google para gerar o desenho.";
  } else {
    mensagem.textContent = "Erro inesperado (" + resposta.status + ").";
  }
});

botaoBaixar.addEventListener("click", () => {
  const arquivo = new Blob([svgAtual], { type: "image/svg+xml" });
  const url = URL.createObjectURL(arquivo);
  const link = document.createElement("a");
  link.href = url;
  link.download = "exemplo.svg";
  link.click();
  URL.revokeObjectURL(url);
});
