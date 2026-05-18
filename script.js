const canvas = document.getElementById("jogoCanvas");
const ctx = canvas.getContext("2d");
const btnStart = document.getElementById("btnStart");

canvas.width = 800;
canvas.height = 400;

let estadoAtual = "TELA_INICIAL"; 

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

// --- Novo Personagem (NPC) ---
const npc = {
    x: 2500, // Coordenada real (250 * 10)
    y: 310,
    largura: 40,
    altura: 40,
    cor: "#ff5555", // Vermelho para diferenciar do player
    dialogo: [
        "Hum?",
        "O que você está fazendo aqui?",
        "Você não deveria estar aqui.",
        "normalmente você acorda mais cedo.",
        "não isso não esta certo!",
        "desperte! você tem que acordar!"
    ],
    indiceAtual: 0,
    jaConversou: false,
    distanciaInteracao: 80 // Distância para ativar o diálogo
};

// --- Sistema de Câmera ---
const camera = {
    x: 0
};

const chaoY = 350;
const teclas = {};

// --- Configurações do Parallax ---
const parallax = {
    camadas: [
        { x: 0, velocidade: 0.1, cor: "#050515", alturaBase: 180, larguraPredio: 100, espacamento: 120 },
        { x: 0, velocidade: 0.4, cor: "#0d0d25", alturaBase: 120, larguraPredio: 80,  espacamento: 100 },
        { x: 0, velocidade: 0.7, cor: "#161630", alturaBase: 80,  larguraPredio: 60,  espacamento: 90 }
    ]
};

// Diálogo Inicial
const dialogoInicial = {
    texto: [
        "Desperte...",
        "você não se lembra do que aconteceu la...",
        "você se perdeu neste mundo depois daquilo",
        "o odio que você sente...",
        "é inigualavel, um odio sobre você mesmo...",
        "você se prende em sua propria mente...",
        "pensando por que fez aquilo...",
        "mas talvez...",
        "você nunca encontre a resposta..."
    ],
    indiceAtual: 0
};

// Caixa de diálogo genérica usada por ambos os sistemas
const caixaDialogo = { x: 50, y: 250, largura: 700, altura: 120, corFundo: "#000033", corBorda: "#00001a" };

window.addEventListener("keydown", (e) => {
    teclas[e.code] = true;
    
    // Avançar Diálogo Inicial
    if (estadoAtual === "DIALOGO_INICIAL" && (e.code === "Space" || e.code === "Enter")) {
        dialogoInicial.indiceAtual++;
        if (dialogoInicial.indiceAtual >= dialogoInicial.texto.length) {
            estadoAtual = "JOGANDO"; 
        }
    }
    
    // Avançar Diálogo do NPC
    if (estadoAtual === "DIALOGO_NPC" && (e.code === "Space" || e.code === "Enter")) {
        npc.indiceAtual++;
        if (npc.indiceAtual >= npc.dialogo.length) {
            estadoAtual = "JOGANDO";
            npc.jaConversou = true; // Impede que o diálogo trave o jogador para sempre
        }
    }
});

window.addEventListener("keyup", (e) => teclas[e.code] = false);

btnStart.addEventListener("click", () => {
    estadoAtual = "DIALOGO_INICIAL";
    btnStart.style.display = "none"; 
});

function desenharCenario() {
    ctx.fillStyle = "#00000a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Estrelas
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
        // Movimento do Player
        if (teclas["KeyA"]) {
            player.x -= player.velocidade;
            player.direcao = "esquerda";
            if (player.x < 0) player.x = 0;
        }
        if (teclas["KeyD"]) {
            player.x += player.velocidade;
            player.direcao = "direita";
        }

        // --- Checar Proximidade do NPC ---
        let distancia = Math.abs(player.x - npc.x);
        if (distancia < npc.distanciaInteracao && !npc.jaConversou) {
            estadoAtual = "DIALOGO_NPC";
            // Zera as teclas para o player não continuar andando sozinho
            teclas["KeyA"] = false;
            teclas["KeyD"] = false;
        }

        // Lógica da Câmera
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

function desenharCaixaTexto(texto) {
    // Desenha a caixa preta de fundo de tela de diálogo para manter o padrão que você criou
    ctx.fillStyle = "#00000a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Borda da caixa
    ctx.fillStyle = caixaDialogo.corBorda;
    ctx.fillRect(caixaDialogo.x - 4, caixaDialogo.y - 4, caixaDialogo.largura + 8, caixaDialogo.altura + 8);
    
    // Fundo da caixa
    ctx.fillStyle = caixaDialogo.corFundo;
    ctx.fillRect(caixaDialogo.x, caixaDialogo.y, caixaDialogo.largura, caixaDialogo.altura);
    
    // Texto
    ctx.fillStyle = "white";
    ctx.font = "20px 'Courier New', monospace";
    ctx.textAlign = "left";
    ctx.fillText(texto, caixaDialogo.x + 20, caixaDialogo.y + 55);
    
    // Dica para avançar
    ctx.font = "12px 'Courier New', monospace";
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.fillText("[Espaço / Enter] para continuar", caixaDialogo.x + 20, caixaDialogo.y + 100);
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
    else if (estadoAtual === "DIALOGO_INICIAL") {
        desenharCaixaTexto(dialogoInicial.texto[dialogoInicial.indiceAtual]);
    } 
    else if (estadoAtual === "DIALOGO_NPC") {
        desenharCaixaTexto(npc.dialogo[npc.indiceAtual]);
    }
    else if (estadoAtual === "JOGANDO") {
        desenharCenario();

        // Chão
        ctx.fillStyle = "#111";
        ctx.fillRect(0, chaoY, canvas.width, canvas.height - chaoY);

        // Coordenadas
        let displayX = Math.floor(player.x / 10); 
        let displayY = Math.floor(((chaoY - player.altura - player.y) / (chaoY - player.altura)) * 100);

        ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
        ctx.font = "16px 'Courier New', monospace";
        ctx.textAlign = "left";
        ctx.fillText(`COORD X: ${displayX}  COORD Y: ${displayY}`, 20, 30);

        // --- Desenhar o NPC (em relação à câmera) ---
        let npcRelativoX = npc.x - camera.x;
        // Só desenha se estiver visível na tela para poupar processamento
        if (npcRelativoX > -50 && npcRelativoX < canvas.width + 50) {
            ctx.fillStyle = npc.cor;
            ctx.fillRect(npcRelativoX, npc.y, npc.largura, npc.altura);
            
            // Olho do NPC (olhando para a esquerda, esperando o player)
            ctx.fillStyle = "white";
            ctx.fillRect(npcRelativoX + 7, npc.y + 10, 8, 8);
        }

        // Player (Desenhado em relação à câmera)
        let playerRelativoX = player.x - camera.x;
        ctx.fillStyle = player.cor;
        ctx.fillRect(playerRelativoX, player.y, player.largura, player.altura);

        // Olhos do Player
        ctx.fillStyle = "white";
        let olhoX = player.direcao === "direita" ? playerRelativoX + 25 : playerRelativoX + 7;
        ctx.fillRect(olhoX, player.y + 10, 8, 8);
    }
}

atualizar();