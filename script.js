const canvas = document.getElementById("jogoCanvas");
const ctx = canvas.getContext("2d");
const btnStart = document.getElementById("btnStart");

canvas.width = 800;
canvas.height = 400;

// Carregamento da Imagem de Fundo
const imagemFundo = new Image();
imagemFundo.src = "https://images.pxfuel.com/wallpaper/143/895/437/city-night-light-blue-wallpaper-preview.jpg"; 

// Máquina de Estados
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

let cameraX = 0; // Controla o deslocamento do cenário
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
        corFundo: "#000033", corBorda: "#00001a"
    }
};

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
        // Movimentação e ajuste da Câmera (Efeito de andar pelo cenário)
        if (teclas["KeyA"] && player.x > 0) {
            player.x -= player.velocidade;
            player.direcao = "esquerda";
        }
        if (teclas["KeyD"] && player.x < 2000) { // 2000 é o "tamanho" total do mundo
            player.x += player.velocidade;
            player.direcao = "direita";
        }

        // Faz a câmera seguir o player suavemente
        cameraX = player.x - canvas.width / 4;

        if ((teclas["KeyW"] || teclas["Space"]) && player.noChao) {
            player.velY = player.pulo;
            player.noChao = false;
        }

        player.velY += player.gravidade;
        player.y += player.velY;

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
        ctx.fillStyle = "white";
        ctx.font = "40px 'Courier New', monospace";
        ctx.textAlign = "center";
        ctx.fillText("NOME DO SEU RPG", canvas.width / 2, 150);
    } 
    
    else if (estadoAtual === "DIALOGO") {
        ctx.fillStyle = dialogo.caixa.corBorda;
        ctx.fillRect(dialogo.caixa.x - 4, dialogo.caixa.y - 4, dialogo.caixa.largura + 8, dialogo.caixa.altura + 8);
        ctx.fillStyle = dialogo.caixa.corFundo;
        ctx.fillRect(dialogo.caixa.x, dialogo.caixa.y, dialogo.caixa.largura, dialogo.caixa.altura);
        ctx.fillStyle = "white";
        ctx.font = "20px 'Courier New', monospace";
        ctx.textAlign = "left";
        ctx.fillText(dialogo.texto[dialogo.indiceAtual], dialogo.caixa.x + 20, dialogo.caixa.y + 40);
    } 
    
    else if (estadoAtual === "JOGANDO") {
        // --- DESENHO DO FUNDO (PARALLAX) ---
        // Multiplicamos cameraX por 0.2 para o fundo mover mais devagar que o player
        let parallaxX = -(cameraX * 0.2) % canvas.width;
        
        // Desenha a imagem duas vezes para criar um loop infinito no fundo
        ctx.drawImage(imagemFundo, parallaxX, 0, canvas.width, canvas.height);
        ctx.drawImage(imagemFundo, parallaxX + canvas.width, 0, canvas.width, canvas.height);

        // --- DESENHO DO MUNDO RELATIVO À CÂMERA ---
        ctx.save();
        ctx.translate(-cameraX, 0); // Tudo desenhado após isso se move com a câmera

        // Chão (desenhado comprido para o player andar)
        ctx.fillStyle = "#111";
        ctx.fillRect(0, chaoY, 3000, canvas.height - chaoY);

        // Player
        ctx.fillStyle = player.cor;
        ctx.fillRect(player.x, player.y, player.largura, player.altura);

        // Olhos
        ctx.fillStyle = "white";
        if (player.direcao === "direita") {
            ctx.fillRect(player.x + 25, player.y + 10, 8, 8);
        } else {
            ctx.fillRect(player.x + 7, player.y + 10, 8, 8);
        }

        ctx.restore(); // Finaliza o movimento da câmera
    }
}

atualizar();