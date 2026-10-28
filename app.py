
from flask import Flask, render_template, request, jsonify
from pathlib import Path
import json
import uuid

# Cria nossa aplicação web com Flask.
app = Flask(__name__)

# Caminho do arquivo onde os produtos serão guardados.
ARQUIVO = Path(__file__).parent / "compras.json"


def carregar_compras():
    """Carrega os produtos salvos anteriormente."""
    if not ARQUIVO.exists():
        return []

    try:
        with open(ARQUIVO, "r", encoding="utf-8") as arquivo:
            return json.load(arquivo)
    except (json.JSONDecodeError, OSError):
        return []


def salvar_compras():
    """Salva a lista atual em um arquivo JSON."""
    with open(ARQUIVO, "w", encoding="utf-8") as arquivo:
        json.dump(compras, arquivo, ensure_ascii=False, indent=2)


# Carrega os dados quando o programa inicia.
compras = carregar_compras()


@app.route("/")
def inicio():
    # Exibe a página HTML.
    return render_template("index.html")


@app.route("/api/compras", methods=["GET"])
def listar():
    # Envia os produtos para o navegador.
    return jsonify(compras)


@app.route("/api/compras", methods=["POST"])
def adicionar():
    # Recebe os dados enviados pelo formulário JavaScript.
    dados = request.get_json(silent=True) or {}

    nome = str(dados.get("nome", "")).strip()
    quantidade = str(dados.get("quantidade", "1")).strip() or "1"

    # Impede adicionar produtos sem nome.
    if not nome:
        return jsonify({"erro": "Digite um produto."}), 400

    produto = {
        "id": str(uuid.uuid4()),
        "nome": nome,
        "quantidade": quantidade,
        "comprado": False
    }

    compras.append(produto)
    salvar_compras()

    return jsonify(produto), 201


@app.route("/api/compras/<item_id>", methods=["PATCH"])
def atualizar(item_id):
    # Atualiza se o produto foi comprado ou não.
    dados = request.get_json(silent=True) or {}

    for produto in compras:
        if produto["id"] == item_id:
            if "comprado" in dados:
                produto["comprado"] = bool(dados["comprado"])

            salvar_compras()
            return jsonify(produto)

    return jsonify({"erro": "Produto não encontrado."}), 404


@app.route("/api/compras/<item_id>", methods=["DELETE"])
def remover(item_id):
    # Procura o produto pelo identificador.
    for produto in compras:
        if produto["id"] == item_id:
            compras.remove(produto)
            salvar_compras()
            return jsonify({"mensagem": "Produto removido."})

    return jsonify({"erro": "Produto não encontrado."}), 404


if __name__ == "__main__":
    app.run(debug=True)
