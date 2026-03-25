const canvas = document.getElementById("jogoCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 800;
canvas.height = 400;

const player = {
    x: 50,
    y: 300,
    largura: 40,
    altura: 40,
    cor: "#00aaff",
    velocidade: 5,
    velY: 0,
    gravidade: 0.8,
    pulo: -15,
    noChao: false,
    direcao: "direita" 
};

const chaoY = 350;
const teclas = {};

// Captura as teclas
window.addEventListener("keydown", (e) => {
    teclas[e.code] = true;
});

window.addEventListener("keyup", (e) => {
    teclas[e.code] = false;
});

function atualizar() {
    // Movimentação A e D
    if (teclas["KeyA"] && player.x > 0) {
        player.x -= player.velocidade;
        player.direcao = "esquerda";
    }
    if (teclas["KeyD"] && player.x < canvas.width - player.largura) {
        player.x += player.velocidade;
        player.direcao = "direita";
    }

    // Pulo com W ou Espaço
    if ((teclas["KeyW"] || teclas["Space"]) && player.noChao) {
        player.velY = player.pulo;
        player.noChao = false;
    }

    // Física
    player.velY += player.gravidade;
    player.y += player.velY;

    // Colisão Chão
    if (player.y + player.altura >= chaoY) {
        player.y = chaoY - player.altura;
        player.velY = 0;
        player.noChao = true;
    }

    desenhar();
    requestAnimationFrame(atualizar);
}

function desenhar() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Chão
    ctx.fillStyle = "#333";
    ctx.fillRect(0, chaoY, canvas.width, canvas.height - chaoY);

    // Player
    ctx.fillStyle = player.cor;
    ctx.fillRect(player.x, player.y, player.largura, player.altura);

    // Olhos (O Flip)
    ctx.fillStyle = "white";
    if (player.direcao === "direita") {
        ctx.fillRect(player.x + 25, player.y + 10, 8, 8);
    } else {
        ctx.fillRect(player.x + 7, player.y + 10, 8, 8);
    }
}

// Inicia o jogo
atualizar();