const canvas = document.getElementById("jogoCanvas");
const ctx = canvas.getContext("2d");
const btnStart = document.getElementById("btnStart");

canvas.width = 800;
canvas.height = 400;

// --- CARREGAMENTO DO FUNDO ---
const fundoCidade = new Image();
// Corrigido o link e garantindo o carregamento
fundoCidade.src = "https://e1.pxfuel.com/desktop-wallpaper/928/1014/desktop-wallpaper-pixel-art-backgrounds-backgrounds-sprite-with-buildings.jpg";

let estadoAtual = "TELA_INICIAL";

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

// Variáveis de controle
let cameraX = 0;
const chaoY = 350;
const teclas = {};

const dialogo = {
    texto: [
        "Desperte...",
        "Você está em um mundo estranho agora.",
        "Use A e D para andar, e W para pular."
    ],
    indiceAtual: 0,
    caixa: {
        x: 50, y: 250, largura: 700, altura: 120,
        corFundo: "rgba(0, 0, 51, 0.9)",
        corBorda: "#00001a"
    }
};

// Eventos de teclado
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
        // Movimentação lateral
        if (teclas["KeyA"] && player.x > 0) {
            player.x -= player.velocidade;
            player.direcao = "esquerda";
        }
        if (teclas["KeyD"]) {
            player.x += player.velocidade;
            player.direcao = "direita";
        }

        // Câmera segue o jogador
        cameraX = player.x - 150; 

        // Lógica de Pulo
        if ((teclas["KeyW"] || teclas["Space"]) && player.noChao) {
            player.velY = player.pulo;
            player.noChao = false;
        }

        player.velY += player.gravidade;
        player.y += player.velY;

        // Colisão com o chão
        if (player.y + player.altura >= chaoY) {
            player.y = chaoY - player.altura;
            player.velY = 0;
            player.noChao = true;
        }
    }
    desenhar();
    requestAnimationFrame(atualizar);
}

function desenhar() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (estadoAtual === "TELA_INICIAL") {
        ctx.fillStyle = "#050510";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "white";
        ctx.font = "40px 'Courier New', monospace";
        ctx.textAlign = "center";
        ctx.fillText("NOME DO SEU RPG", canvas.width / 2, 180);
    } 
    
    else if (estadoAtual === "DIALOGO" || estadoAtual === "JOGANDO") {
        
        // --- CÁLCULO DO PARALLAX ---
        // Fator 0.1 significa que o fundo se move a apenas 10% da velocidade da câmera.
        // Isso cria a ilusão de que a cidade está muito distante no horizonte.
        let fatorParallax = 0.1;
        let larguraFundo = canvas.width; // Usamos a largura do canvas para o tile
        let deslizeFundo = -(cameraX * fatorParallax) % larguraFundo;

        // Desenha o fundo repetido (Tile infinito)
        ctx.drawImage(fundoCidade, deslizeFundo, 0, larguraFundo, canvas.height);
        ctx.drawImage(fundoCidade, deslizeFundo + larguraFundo, 0, larguraFundo, canvas.height);
        ctx.drawImage(fundoCidade, deslizeFundo - larguraFundo, 0, larguraFundo, canvas.height);

        if (estadoAtual === "DIALOGO") {
            // Desenha a caixa de diálogo
            ctx.fillStyle = dialogo.caixa.corBorda;
            ctx.fillRect(dialogo.caixa.x - 4, dialogo.caixa.y - 4, dialogo.caixa.largura + 8, dialogo.caixa.altura + 8);
            ctx.fillStyle = dialogo.caixa.corFundo;
            ctx.fillRect(dialogo.caixa.x, dialogo.caixa.y, dialogo.caixa.largura, dialogo.caixa.altura);
            ctx.fillStyle = "white";
            ctx.font = "20px 'Courier New', monospace";
            ctx.textAlign = "left";
            ctx.fillText(dialogo.texto[dialogo.indiceAtual], dialogo.caixa.x + 20, dialogo.caixa.y + 40);
        }

        if (estadoAtual === "JOGANDO") {
            ctx.save();
            ctx.translate(-cameraX, 0); // Aplica a movimentação da câmera ao mundo

            // Desenha o chão (ele se move com a câmera)
            ctx.fillStyle = "rgba(20, 20, 40, 0.9)";
            ctx.fillRect(cameraX, chaoY, canvas.width, canvas.height - chaoY);
            
            // Detalhe de luz no chão
            ctx.fillStyle = "#4444ff";
            ctx.fillRect(cameraX, chaoY, canvas.width, 2);

            // Desenha o Player
            ctx.fillStyle = player.cor;
            ctx.fillRect(player.x, player.y, player.largura, player.altura);

            // Detalhe dos Olhos
            ctx.fillStyle = "white";
            let olhoX = (player.direcao === "direita") ? player.x + 25 : player.x + 7;
            ctx.fillRect(olhoX, player.y + 10, 8, 8);

            ctx.restore();
        }
    }
}

// Inicia o loop do jogo
atualizar();