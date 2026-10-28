
const formulario = document.querySelector("#form-compra");
const campoNome = document.querySelector("#nome");
const campoQuantidade = document.querySelector("#quantidade");
const lista = document.querySelector("#lista");
const listaVazia = document.querySelector("#lista-vazia");
const contador = document.querySelector("#contador");
const resumo = document.querySelector("#resumo");
const mensagem = document.querySelector("#mensagem");
const botaoLimpar = document.querySelector("#limpar-comprados");

// Função para enviar pedidos ao servidor Python.
async function requisicao(url, opcoes = {}) {
    const resposta = await fetch(url, {
        ...opcoes,
        headers: {
            "Content-Type": "application/json"
        }
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
        throw new Error(dados.erro || "Ocorreu um erro.");
    }

    return dados;
}

// Busca os produtos salvos no servidor.
async function carregarLista() {
    try {
        const produtos = await requisicao("/api/compras");

        // Remove a lista visual antiga antes de redesenhá-la.
        lista.replaceChildren();

        produtos.forEach((produto) => {
            const item = document.createElement("li");
            item.className = "item";

            if (produto.comprado) {
                item.classList.add("comprado");
            }

            // Cria a caixa de confirmação.
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.checked = produto.comprado;
            checkbox.setAttribute(
                "aria-label",
                `Marcar ${produto.nome} como comprado`
            );

            checkbox.addEventListener("change", async () => {
                try {
                    await requisicao(
                        `/api/compras/${produto.id}`,
                        {
                            method: "PATCH",
                            body: JSON.stringify({
                                comprado: checkbox.checked
                            })
                        }
                    );

                    await carregarLista();
                } catch (erro) {
                    mensagem.textContent = erro.message;
                }
            });

            // Mostra o nome e a quantidade.
            const detalhes = document.createElement("div");
            detalhes.className = "detalhes";

            const nome = document.createElement("span");
            nome.className = "nome";
            nome.textContent = produto.nome;

            const quantidade = document.createElement("span");
            quantidade.className = "quantidade";
            quantidade.textContent =
                `Quantidade: ${produto.quantidade}`;

            detalhes.append(nome, quantidade);

            // Botão que exclui um produto.
            const remover = document.createElement("button");
            remover.className = "botao-remover";
            remover.type = "button";
            remover.textContent = "✕";
            remover.setAttribute(
                "aria-label",
                `Remover ${produto.nome}`
            );

            remover.addEventListener("click", async () => {
                try {
                    await requisicao(
                        `/api/compras/${produto.id}`,
                        { method: "DELETE" }
                    );

                    mensagem.textContent = "Produto removido.";
                    await carregarLista();
                } catch (erro) {
                    mensagem.textContent = erro.message;
                }
            });

            item.append(checkbox, detalhes, remover);
            lista.appendChild(item);
        });

        // Atualiza os números mostrados na página.
        const total = produtos.length;
        const comprados = produtos.filter(
            produto => produto.comprado
        ).length;

        contador.textContent =
            `${total} ${total === 1 ? "item" : "itens"}`;

        resumo.textContent =
            `${comprados} comprados de ${total} itens`;

        listaVazia.hidden = total > 0;

    } catch (erro) {
        mensagem.textContent =
            "Não foi possível carregar a lista. Confira se o Python está rodando.";
        console.error(erro);
    }
}

// Recebe o envio do formulário de cadastro.
formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    const nome = campoNome.value.trim();
    const quantidade = campoQuantidade.value.trim() || "1";

    if (!nome) {
        mensagem.textContent = "Digite o nome do produto.";
        return;
    }

    try {
        await requisicao("/api/compras", {
            method: "POST",
            body: JSON.stringify({ nome, quantidade })
        });

        formulario.reset();
        campoQuantidade.value = "1";
        mensagem.textContent = "Produto adicionado!";

        await carregarLista();
        campoNome.focus();

    } catch (erro) {
        mensagem.textContent = erro.message;
    }
});

// Remove os produtos que já foram comprados.
botaoLimpar.addEventListener("click", async () => {
    try {
        const produtos = await requisicao("/api/compras");
        const comprados = produtos.filter(p => p.comprado);

        if (comprados.length === 0) {
            mensagem.textContent =
                "Não há produtos comprados para remover.";
            return;
        }

        await Promise.all(
            comprados.map(produto =>
                requisicao(`/api/compras/${produto.id}`, {
                    method: "DELETE"
                })
            )
        );

        mensagem.textContent = "Produtos comprados removidos.";
        await carregarLista();

    } catch (erro) {
        mensagem.textContent = erro.message;
    }
});

// Executa quando a página abre.
carregarLista();
