const canvas = document.getElementById("jogoCanvas");
const ctx = canvas.getContext("2d");
const btnStart = document.getElementById("btnStart");

// --- CONFIGURAÇÕES DE AMBIENTE ---
const CONFIG = {
    LARGURA_CANVAS: 800,
    ALTURA_CANVAS: 400,
    GRAVIDADE: 0.7,
    // Ajustado para o boneco ficar no asfalto da imagem panorâmica
    CHAO_Y: 340, 
    VELOCIDADE_JOGADOR: 5,
    FORCA_PULO: -12,
    LARGURA_FUNDO: 1152, // Largura original do sprite para repetição perfeita
    FATOR_PARALLAX: 0.5
};

canvas.width = CONFIG.LARGURA_CANVAS;
canvas.height = CONFIG.ALTURA_CANVAS;

const fundoCidade = new Image();
// Link direto da imagem de panorama (camada superior do sprite)
fundoCidade.src = "https://i.pinimg.com/originals/2d/3a/05/2d3a0503080e5672906e5720e6f5193c.jpg";

fundoCidade.onload = () => atualizar();

let estadoAtual = "TELA_INICIAL";
let cameraX = 0;
const teclas = {};

const player = {
    x: 100,
    y: 0,
    largura: 30,
    altura: 30,
    cor: "#00f2ff",
    velY: 0,
    noChao: false,
    direcao: "direita"
};

const dialogo = {
    texto: [
        "A metrópole de pixels se estende...",
        "Você está na passarela superior da cidade.",
        "Use A e D para explorar este panorama."
    ],
    indiceAtual: 0,
};

// --- CONTROLES ---
window.addEventListener("keydown", (e) => {
    teclas[e.code] = true;
    if (estadoAtual === "DIALOGO" && (e.code === "Space" || e.code === "Enter")) {
        dialogo.indiceAtual++;
        if (dialogo.indiceAtual >= dialogo.texto.length) {
            estadoAtual = "JOGANDO";
        }
    }
});
window.addEventListener("keyup", (e) => teclas[e.code] = false);

btnStart.addEventListener("click", () => {
    estadoAtual = "DIALOGO";
    btnStart.style.display = "none";
});

function atualizar() {
    if (estadoAtual === "JOGANDO") {
        if (teclas["KeyA"] && player.x > 0) {
            player.x -= CONFIG.VELOCIDADE_JOGADOR;
            player.direcao = "esquerda";
        }
        if (teclas["KeyD"]) {
            player.x += CONFIG.VELOCIDADE_JOGADOR;
            player.direcao = "direita";
        }
        if ((teclas["KeyW"] || teclas["Space"]) && player.noChao) {
            player.velY = CONFIG.FORCA_PULO;
            player.noChao = false;
        }

        player.velY += CONFIG.GRAVIDADE;
        player.y += player.velY;

        if (player.y + player.altura >= CONFIG.CHAO_Y) {
            player.y = CONFIG.CHAO_Y - player.altura;
            player.velY = 0;
            player.noChao = true;
        }

        cameraX = Math.max(0, player.x - 150);
    }
    desenhar();
    requestAnimationFrame(atualizar);
}

function desenhar() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (estadoAtual === "TELA_INICIAL") {
        ctx.fillStyle = "#0a0519";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#00f2ff";
        ctx.font = "40px 'Courier New', monospace";
        ctx.textAlign = "center";
        ctx.fillText("PIXEL NIGHT CITY", canvas.width / 2, 180);
    } 
    
    else {
        // --- DESENHO DO PANORAMA ---
        // Ajustamos para desenhar apenas a parte superior do sprite original
        let deslizeFundo = -(cameraX * CONFIG.FATOR_PARALLAX) % CONFIG.LARGURA_FUNDO;

        // Desenhamos a imagem em loop
        // Como o sprite original tem várias partes, aqui usamos o topo
        ctx.drawImage(fundoCidade, deslizeFundo, 0, CONFIG.LARGURA_FUNDO, canvas.height);
        ctx.drawImage(fundoCidade, deslizeFundo + CONFIG.LARGURA_FUNDO, 0, CONFIG.LARGURA_FUNDO, canvas.height);
        ctx.drawImage(fundoCidade, deslizeFundo - CONFIG.LARGURA_FUNDO, 0, CONFIG.LARGURA_FUNDO, canvas.height);

        ctx.save();
        ctx.translate(-cameraX, 0);

        // --- JOGADOR ---
        if (estadoAtual === "JOGANDO" || estadoAtual === "DIALOGO") {
            ctx.shadowBlur = 15;
            ctx.shadowColor = player.cor;
            ctx.fillStyle = player.cor;
            ctx.fillRect(player.x, player.y, player.largura, player.altura);
            
            ctx.shadowBlur = 0;
            ctx.fillStyle = "white";
            let olhoX = (player.direcao === "direita") ? player.x + player.largura - 10 : player.x + 4;
            ctx.fillRect(olhoX, player.y + 6, 6, 6);
        }

        ctx.restore();

        if (estadoAtual === "DIALOGO") {
            desenharCaixaDialogo();
        }
    }
}

function desenharCaixaDialogo() {
    const cx = 50, cy = 40, cw = 700, ch = 80;
    ctx.fillStyle = "#00f2ff";
    ctx.fillRect(cx - 1, cy - 1, cw + 2, ch + 2);
    ctx.fillStyle = "rgba(10, 5, 25, 0.9)";
    ctx.fillRect(cx, cy, cw, ch);
    ctx.fillStyle = "white";
    ctx.font = "16px 'Courier New', monospace";
    ctx.textAlign = "left";
    ctx.fillText(dialogo.texto[dialogo.indiceAtual], cx + 20, cy + 45);
}