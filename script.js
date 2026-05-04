const canvas = document.getElementById("jogoCanvas");
const ctx = canvas.getContext("2d");
const btnStart = document.getElementById("btnStart");

canvas.width = 800;
canvas.height = 400;

let estadoAtual = "TELA_INICIAL"; 

// --- Carregamento da Imagem ---
const imgFogueira = new Image();
// Usando um link direto de imagem para garantir que apareça no jogo
imgFogueira.src = "https://img.icons8.com/emoji/96/fire.png"; 

const player = {
    x: 0, 
    y: 310, 
    largura: 40,
    altura: 40,
    cor: "#00aaff",
    velocidade: 6,
    velY: 0,
    gravidade: 0.8,
    pulo: -15,
    noChao: false,
    direcao: "direita" 
};

const camera = { x: 0 };
const chaoY = 350;
const teclas = {};

const parallax = {
    camadas: [
        { x: 0, velocidade: 0.1, cor: "#050515", alturaBase: 180, larguraPredio: 100, espacamento: 120 },
        { x: 0, velocidade: 0.4, cor: "#0d0d25", alturaBase: 120, larguraPredio: 80,  espacamento: 100 },
        { x: 0, velocidade: 0.7, cor: "#161630", alturaBase: 80,  larguraPredio: 60,  espacamento: 90 }
    ]
};

const dialogo = {
    texto: [
        "Desperte...",
        "O mundo agora é vasto e sem fim.",
        "A coordenada X agora mostrará o quanto você viajou."
    ],
    indiceAtual: 0,
    caixa: { x: 50, y: 250, largura: 700, altura: 120, corFundo: "#000033", corBorda: "#00001a" }
};

window.addEventListener("keydown", (e) => {
    teclas[e.code] = true;
    if (estadoAtual === "DIALOGO" && (e.code === "Space" || e.code === "Enter")) {
        dialogo.indiceAtual++;
        if (dialogo.indiceAtual >= dialogo.texto.length) estadoAtual = "JOGANDO"; 
    }
});

window.addEventListener("keyup", (e) => teclas[e.code] = false);

btnStart.addEventListener("click", () => {
    estadoAtual = "DIALOGO";
    btnStart.style.display = "none"; 
});

function desenharCenario() {
    ctx.fillStyle = "#00000a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "white";
    for(let i = 0; i < 40; i++) {
        let x = ((i * 137) - (camera.x * 0.05)) % canvas.width;
        if (x < 0) x += canvas.width;
        let y = (i * 243) % 200;
        ctx.fillRect(x, y, 1, 1);
    }

    parallax.camadas.forEach((camada, index) => {
        ctx.fillStyle = camada.cor;
        let espacoTotal = camada.espacamento;
        let scrollX = (camera.x * camada.velocidade) % espacoTotal;

        for (let i = -1; i < (canvas.width / espacoTotal) + 2; i++) {
            let xPos = (i * espacoTotal) - scrollX;
            let indicePredioMundo = Math.floor((camera.x * camada.velocidade) / espacoTotal) + i;
            let h = camada.alturaBase + (Math.abs(Math.sin(indicePredioMundo + index)) * 60);
            ctx.fillRect(xPos, chaoY - h, camada.larguraPredio, h);
        }
    });
}

function atualizar() {
    if (estadoAtual === "JOGANDO") {
        if (teclas["KeyA"]) {
            player.x -= player.velocidade;
            player.direcao = "esquerda";
            if (player.x < 0) player.x = 0;
        }
        if (teclas["KeyD"]) {
            player.x += player.velocidade;
            player.direcao = "direita";
        }

        camera.x = player.x - 150; 
        if (camera.x < 0) camera.x = 0;

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
        ctx.fillStyle = "#00001a";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "white";
        ctx.font = "40px 'Courier New', monospace";
        ctx.textAlign = "center";
        ctx.fillText("CIDADE INFINITA", canvas.width / 2, 150);
    } 
    else if (estadoAtual === "DIALOGO") {
        ctx.fillStyle = "#00000a";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
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
        desenharCenario();

        // Chão
        ctx.fillStyle = "#111";
        ctx.fillRect(0, chaoY, canvas.width, canvas.height - chaoY);

        // --- DESENHAR FOGUEIRA NAS COORDENADAS X:350 Y:0 ---
        // Aplicamos a subtração da câmera para ela se mover com o cenário
        let fogueiraX = 350 - camera.x; 
        let fogueiraY = 0; // Você pediu Y:0 (ela vai flutuar no topo da tela)
        
        // Desenha a imagem (se já estiver carregada)
        if (imgFogueira.complete) {
            ctx.drawImage(imgFogueira, fogueiraX, fogueiraY, 50, 50);
        }

        // HUD Coordenadas
        let displayX = Math.floor(player.x / 10); 
        let displayY = Math.floor(((chaoY - player.altura - player.y) / (chaoY - player.altura)) * 100);
        ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
        ctx.font = "16px 'Courier New', monospace";
        ctx.textAlign = "left";
        ctx.fillText(`COORD X: ${displayX}  COORD Y: ${displayY}`, 20, 30);

        // Player
        let playerRelativoX = player.x - camera.x;
        ctx.fillStyle = player.cor;
        ctx.fillRect(playerRelativoX, player.y, player.largura, player.altura);

        // Olhos
        ctx.fillStyle = "white";
        let olhoX = player.direcao === "direita" ? playerRelativoX + 25 : playerRelativoX + 7;
        ctx.fillRect(olhoX, player.y + 10, 8, 8);
    }
}

atualizar();