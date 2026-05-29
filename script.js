const canvas = document.getElementById("jogoCanvas");
const ctx = canvas.getContext("2d");
const btnStart = document.getElementById("btnStart");

canvas.width = 800;
canvas.height = 400;

let estadoAtual = "TELA_INICIAL"; 

// --- Carregamento de Sprites do Player ---
const imgPlayerParado = new Image();
imgPlayerParado.src = "IMG_20260525_102813.png"; 

const imgPlayerCorrendo = new Image();
imgPlayerCorrendo.src = "IMG_20260525_102751.png"; 

// --- Carregamento do Sprite do Espírito Azul ---
const imgNpcEspirito = new Image();
imgNpcEspirito.src = "pixel-art-blue-spirit-character-png.png"; 

// --- Objeto do Player ---
const player = {
    x: 0, 
    y: 268,           
    largura: 50,      
    altura: 80,       
    velocidade: 6,
    velY: 0,
    gravidade: 0.8,
    pulo: -15,
    noChao: false,
    direcao: "direita",
    
    // Configurações da folha de sprites
    spriteLargura: 32,  
    spriteAltura: 32,   
    frameAtual: 0,      
    tempoAnimacao: 0,   
    estaAndando: false
};

// Ajuste dinâmico para pegar o tamanho exato das suas fotos
imgPlayerParado.onload = function() {
    player.spriteAltura = imgPlayerParado.height;
    player.spriteLargura = imgPlayerParado.width; 
};

imgPlayerCorrendo.onload = function() {
    player.spriteLargura = imgPlayerCorrendo.width / 2;
    player.spriteAltura = imgPlayerCorrendo.height;
};

// --- Configurações dos NPCs ---
const npc = {
    x: 2500, 
    y: 380,          
    largura: 60,     
    altura: 80,      
    tempoFlutuar: 0, // Controla a velocidade da flutuação
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
    distanciaInteracao: 80 
};

const npc2 = {
    x: 5000, 
    y: 310,
    largura: 40,
    altura: 40,
    cor: "#55ff55" 
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
        "você se prende in sua propria mente...",
        "pensando por que fez aquilo...",
        "mas talvez...",
        "você nunca encontre a resposta..."
    ],
    indiceAtual: 0
};

const caixaDialogo = { x: 50, y: 250, largura: 700, altura: 120, corFundo: "#000033", corBorda: "#00001a" };

window.addEventListener("keydown", (e) => {
    teclas[e.code] = true;
    
    if (estadoAtual === "DIALOGO_INICIAL" && (e.code === "Space" || e.code === "Enter")) {
        dialogoInicial.indiceAtual++;
        if (dialogoInicial.indiceAtual >= dialogoInicial.texto.length) {
            estadoAtual = "JOGANDO"; 
        }
    }
    
    if (estadoAtual === "DIALOGO_NPC" && (e.code === "Space" || e.code === "Enter")) {
        npc.indiceAtual++;
        if (npc.indiceAtual >= npc.dialogo.length) {
            estadoAtual = "JOGANDO";
            npc.jaConversou = true; 
            npc.x = -9999; // Move o NPC para fora do mapa assim que o diálogo termina
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
    // --- ATUALIZAÇÃO: Faz o espírito flutuar enquanto o jogador joga ou conversa com ele ---
    if (estadoAtual === "JOGANDO" || estadoAtual === "DIALOGO_NPC") {
        npc.tempoFlutuar += 0.05;
    }

    if (estadoAtual === "JOGANDO") {
        player.estaAndando = false;

        if (teclas["KeyA"]) {
            player.x -= player.velocidade;
            player.direcao = "esquerda";
            player.estaAndando = true;
            if (player.x < 0) player.x = 0;
        }
        if (teclas["KeyD"]) {
            player.x += player.velocidade;
            player.direcao = "direita";
            player.estaAndando = true;
        }

        if (player.estaAndando && player.noChao) {
            player.tempoAnimacao++;
            if (player.tempoAnimacao >= 10) { 
                player.frameAtual = player.frameAtual === 0 ? 1 : 0; 
                player.tempoAnimacao = 0;
            }
        } else {
            player.frameAtual = 0; 
        }

        // Verifica o diálogo se o NPC ainda estiver ativo
        if (!npc.jaConversou && npc.x !== -9999) {
            let distancia = Math.abs(player.x - npc.x);
            if (distancia < npc.distanciaInteracao) {
                estadoAtual = "DIALOGO_NPC";
                teclas["KeyA"] = false;
                teclas["KeyD"] = false;
                player.estaAndando = false;
            }
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

function desenharCaixaTexto(texto) {
    ctx.fillStyle = caixaDialogo.corBorda;
    ctx.fillRect(caixaDialogo.x - 4, caixaDialogo.y - 4, caixaDialogo.largura + 8, caixaDialogo.altura + 8);
    
    ctx.fillStyle = caixaDialogo.corFundo;
    ctx.fillRect(caixaDialogo.x, caixaDialogo.y, caixaDialogo.largura, caixaDialogo.altura);
    
    ctx.fillStyle = "white";
    ctx.font = "20px 'Courier New', monospace";
    ctx.textAlign = "left";
    ctx.fillText(texto, caixaDialogo.x + 20, caixaDialogo.y + 55);
    
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
        ctx.fillStyle = "#00000a";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        desenharCaixaTexto(dialogoInicial.texto[dialogoInicial.indiceAtual]);
    } 
    else if (estadoAtual === "JOGANDO" || estadoAtual === "DIALOGO_NPC") {
        desenharCenario();

        ctx.fillStyle = "#111";
        ctx.fillRect(0, chaoY, canvas.width, canvas.height - chaoY);

        let displayX = Math.floor(player.x / 10); 
        let displayY = Math.floor(((chaoY - player.altura - player.y) / (chaoY - player.altura)) * 100);

        ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
        ctx.font = "16px 'Courier New', monospace";
        ctx.textAlign = "left";
        ctx.fillText(`COORD X: ${displayX}  COORD Y: ${displayY}`, 20, 30);

      // --- RENDERIZAÇÃO DO NPC 1 (Espírito Azul) ---
let npcRelativoX = npc.x - camera.x;
if (npcRelativoX > -100 && npcRelativoX < canvas.width + 100) {
    
    // Essa linha calcula a onda do balanço:
    let flutuarY = npc.y + Math.sin(npc.tempoFlutuar) * 8;

    if (imgNpcEspirito.complete && imgNpcEspirito.width > 0) {
        // IMPORTANTE: Aqui precisa estar 'flutuarY' e NÃO 'npc.y'
        ctx.drawImage(imgNpcEspirito, npcRelativoX, flutuarY, npc.largura, npc.altura);
    } else {
        // IMPORTANTE: Aqui também precisa estar 'flutuarY'
        ctx.fillStyle = "#00ffff"; 
        ctx.fillRect(npcRelativoX, flutuarY, npc.largura, npc.altura);
    }
}

        // Desenhar segundo NPC (Verde na coord X: 500)
        let npc2RelativoX = npc2.x - camera.x;
        if (npc2RelativoX > -50 && npc2RelativoX < canvas.width + 50) {
            ctx.fillStyle = npc2.cor;
            ctx.fillRect(npc2RelativoX, npc2.y, npc2.largura, npc2.altura);
            
            ctx.fillStyle = "white";
            ctx.fillRect(npc2RelativoX + 7, npc2.y + 10, 8, 8);
        }

        // --- Renderização do Player ---
        let playerRelativoX = player.x - camera.x;
        
        ctx.save(); 
        
        if (player.direcao === "esquerda") {
            ctx.translate(playerRelativoX + player.largura / 2, player.y + player.altura / 2);
            ctx.scale(-1, 1);
            ctx.translate(-(playerRelativoX + player.largura / 2), -(player.y + player.altura / 2));
        }

        if (imgPlayerParado.complete && imgPlayerCorrendo.complete && imgPlayerParado.width > 0) {
            if (player.estaAndando) {
                ctx.drawImage(
                    imgPlayerCorrendo,
                    player.frameAtual * player.spriteLargura, 0, 
                    player.spriteLargura, player.spriteAltura,   
                    playerRelativoX, player.y,                   
                    player.largura, player.altura                
                );
            } else {
                ctx.drawImage(
                    imgPlayerParado,
                    0, 0,
                    player.spriteLargura, player.spriteAltura,
                    playerRelativoX, player.y,
                    player.largura, player.altura
                );
            }
        } else {
            ctx.fillStyle = "#00aaff";
            ctx.fillRect(playerRelativoX, player.y, player.largura, player.altura);
            
            ctx.fillStyle = "white";
            let olhoX = player.direcao === "direita" ? playerRelativoX + 25 : playerRelativoX + 7;
            ctx.fillRect(olhoX, player.y + 10, 8, 8);
        }

        ctx.restore(); 

        if (estadoAtual === "DIALOGO_NPC") {
            desenharCaixaTexto(npc.dialogo[npc.indiceAtual]);
        }
    }
}

// Inicia o loop principal do jogo
atualizar();