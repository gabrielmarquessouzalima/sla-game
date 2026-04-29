const canvas = document.getElementById("jogoCanvas");
const ctx = canvas.getContext("2d");
const btnStart = document.getElementById("btnStart");

// --- CONFIGURAÇÕES DO JOGO ---
const CONFIG = {
    LARGURA_CANVAS: 800,
    ALTURA_CANVAS: 400,
    GRAVIDADE: 0.8,
    CHAO_Y: 385,
    VELOCIDADE_JOGADOR: 5,
    FORCA_PULO: -14,
    LARGURA_FUNDO: 900, // Ajustado para a proporção da nova imagem
    FATOR_PARALLAX: 0.4
};

canvas.width = CONFIG.LARGURA_CANVAS;
canvas.height = CONFIG.ALTURA_CANVAS;

// --- CARREGAMENTO DE ASSETS ---
const fundoCidade = new Image();
// Atualizado para a nova imagem que você enviou:
fundoCidade.src = "https://img.magnific.com/premium-vector/neon-illustration-city-night_456052-3.jpg";

fundoCidade.onload = () => {
    console.log("Nova cidade carregada!");
    atualizar();
};

// --- ESTADO DO JOGO ---
let estadoAtual = "TELA_INICIAL";
let cameraX = 0;
const teclas = {};
const inimigos = [];

const player = {
    x: 100,
    y: 0,
    largura: 35,
    altura: 35,
    cor: "#00f2ff",
    velY: 0,
    noChao: false,
    direcao: "direita"
};

const dialogo = {
    texto: [
        "As luzes de neon brilham intensamente...",
        "Cuidado com os drones de segurança da Neo-Cidade!",
        "Use A e D para correr, e W para pular."
    ],
    indiceAtual: 0,
};

// --- FUNÇÕES DE APOIO ---

function criarInimigo() {
    const spawnX = cameraX + canvas.width + Math.random() * 500;
    inimigos.push({
        x: spawnX,
        y: CONFIG.CHAO_Y - 30,
        largura: 30,
        altura: 30,
        cor: "#ff0055" 
    });
}

function verificarColisao(a, b) {
    return a.x < b.x + b.largura &&
           a.x + a.largura > b.x &&
           a.y < b.y + b.altura &&
           a.y + a.altura > b.y;
}

// --- ENTRADA DE USUÁRIO ---
window.addEventListener("keydown", (e) => {
    teclas[e.code] = true;
    if (estadoAtual === "DIALOGO" && (e.code === "Space" || e.code === "Enter")) {
        dialogo.indiceAtual++;
        if (dialogo.indiceAtual >= dialogo.texto.length) {
            estadoAtual = "JOGANDO";
            setInterval(criarInimigo, 2000);
        }
    }
});
window.addEventListener("keyup", (e) => teclas[e.code] = false);

btnStart.addEventListener("click", () => {
    estadoAtual = "DIALOGO";
    btnStart.style.display = "none";
});

// --- CORE DO JOGO ---

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

        inimigos.forEach((ini, index) => {
            if (verificarColisao(player, ini)) {
                // Efeito simples de Game Over (reseta posição)
                player.x = 100;
                cameraX = 0;
                console.log("Colisão detectada!");
            }
            if (ini.x < cameraX - 100) inimigos.splice(index, 1);
        });
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
        ctx.fillText("NEON CITY RUNNER", canvas.width / 2, 180);
    } 
    
    else if (estadoAtual === "DIALOGO" || estadoAtual === "JOGANDO") {
        // --- DESENHO DO NOVO FUNDO (PARALLAX) ---
        let deslizeFundo = -(cameraX * CONFIG.FATOR_PARALLAX) % CONFIG.LARGURA_FUNDO;
        
        // Desenhamos a imagem três vezes para garantir que não apareçam espaços vazios no loop
        ctx.drawImage(fundoCidade, deslizeFundo, 0, CONFIG.LARGURA_FUNDO, canvas.height);
        ctx.drawImage(fundoCidade, deslizeFundo + CONFIG.LARGURA_FUNDO, 0, CONFIG.LARGURA_FUNDO, canvas.height);
        ctx.drawImage(fundoCidade, deslizeFundo - CONFIG.LARGURA_FUNDO, 0, CONFIG.LARGURA_FUNDO, canvas.height);

        ctx.save();
        ctx.translate(-cameraX, 0);

        // --- DESENHO DOS INIMIGOS ---
        inimigos.forEach(ini => {
            ctx.shadowBlur = 10;
            ctx.shadowColor = ini.cor;
            ctx.fillStyle = ini.cor;
            ctx.fillRect(ini.x, ini.y, ini.largura, ini.altura);
        });

        // --- DESENHO DO JOGADOR ---
        if (estadoAtual === "JOGANDO") {
            ctx.shadowBlur = 15;
            ctx.shadowColor = player.cor;
            ctx.fillStyle = player.cor;
            ctx.fillRect(player.x, player.y, player.largura, player.altura);
            
            ctx.shadowBlur = 0;
            ctx.fillStyle = "white";
            let olhoX = (player.direcao === "direita") ? player.x + player.largura - 12 : player.x + 4;
            ctx.fillRect(olhoX, player.y + 8, 8, 8);
        }

        ctx.restore();

        if (estadoAtual === "DIALOGO") {
            desenharCaixaDialogo();
        }
    }
}

function desenharCaixaDialogo() {
    const cx = 50, cy = 250, cw = 700, ch = 120;
    ctx.fillStyle = "#00f2ff";
    ctx.fillRect(cx - 2, cy - 2, cw + 4, ch + 4);
    ctx.fillStyle = "rgba(10, 5, 25, 0.95)";
    ctx.fillRect(cx, cy, cw, ch);
    ctx.fillStyle = "white";
    ctx.font = "20px 'Courier New', monospace";
    ctx.textAlign = "left";
    ctx.fillText(dialogo.texto[dialogo.indiceAtual], cx + 20, cy + 40);
    ctx.font = "12px Arial";
    ctx.fillText("Pressione ESPAÇO para continuar...", cx + 20, cy + 100);
}