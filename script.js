const canvas = document.getElementById("jogoCanvas");
const ctx = canvas.getContext("2d");
const btnStart = document.getElementById("btnStart");

// --- CONFIGURAÇÕES DE AMBIENTE ---
const CONFIG = {
    LARGURA_CANVAS: 800,
    ALTURA_CANVAS: 400,
    GRAVIDADE: 0.7,
    // Ajustado para o pé do boneco tocar a estrada da foto
    CHAO_Y: 345, 
    VELOCIDADE_JOGADOR: 5,
    FORCA_PULO: -12,
    LARGURA_FUNDO: 1200, 
    FATOR_PARALLAX: 0.6
};

canvas.width = CONFIG.LARGURA_CANVAS;
canvas.height = CONFIG.ALTURA_CANVAS;

const fundoCidade = new Image();
fundoCidade.src = "https://img.magnific.com/premium-vector/neon-illustration-city-night_456052-3.jpg";

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
        "A metrópole nunca dorme...",
        "Caminhando pelas ruas da Neo-Cidade.",
        "Use A e D para explorar, e W para pular."
    ],
    indiceAtual: 0,
};

// --- ENTRADA DE USUÁRIO ---
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

        // Colisão invisível com a estrada da imagem
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
        ctx.fillText("NEON CITY EXPLORER", canvas.width / 2, 180);
    } 
    
    else {
        // --- DESENHO DO FUNDO (A RUA DA IMAGEM) ---
        let zoomScale = 1.1; 
        let alturaZoom = canvas.height * zoomScale;
        let offsetTop = -(alturaZoom - canvas.height) / 2;

        let deslizeFundo = -(cameraX * CONFIG.FATOR_PARALLAX) % CONFIG.LARGURA_FUNDO;

        // Renderiza apenas a imagem (sem caminhos extras)
        ctx.drawImage(fundoCidade, deslizeFundo, offsetTop, CONFIG.LARGURA_FUNDO, alturaZoom);
        ctx.drawImage(fundoCidade, deslizeFundo + CONFIG.LARGURA_FUNDO, offsetTop, CONFIG.LARGURA_FUNDO, alturaZoom);
        ctx.drawImage(fundoCidade, deslizeFundo - CONFIG.LARGURA_FUNDO, offsetTop, CONFIG.LARGURA_FUNDO, alturaZoom);

        ctx.save();
        ctx.translate(-cameraX, 0);

        // --- DESENHO DO JOGADOR ---
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
    ctx.fillStyle = "rgba(10, 5, 25, 0.85)";
    ctx.fillRect(cx, cy, cw, ch);
    ctx.fillStyle = "white";
    ctx.font = "16px 'Courier New', monospace";
    ctx.textAlign = "left";
    ctx.fillText(dialogo.texto[dialogo.indiceAtual], cx + 20, cy + 45);
}