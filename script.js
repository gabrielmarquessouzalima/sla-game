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

// --- Carregamento do Sprite do NPC 2 (Raposinha) ---
const imgNpc2Fox = new Image();
imgNpc2Fox.src = "fox.png.png"; 

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
    y: 180,          
    largura: 60,     
    altura: 80,      
    tempoFlutuar: 0, 
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

// --- ALTERADO AQUI: Raposinha agora com tamanho 70x70 ---
const npc2 = {
    x: 5000, 
    y: 280, // Ajustado para 280 (350 do chão - 70 de altura)
    largura: 70, 
    altura: 70
};

// --- Sistema de Câmera ---
const camera = {
    x: 0
};

const chaoY = 350;
const teclas = {};

// --- Configurações do Parallax Cyberpunk/Neon ---
const parallax = {
    camadas: [
        { x: 0, velocidade: 0.02, cor: "#090014", alturaBase: 200, larguraPredio: 110, espacamento: 140 }, 
        { x: 0, velocidade: 0.06, cor: "#120024", alturaBase: 140, larguraPredio: 85,  espacamento: 110 }, 
        { x: 0, velocidade: 0.15, cor: "#1b003a", alturaBase: 90,  larguraPredio: 65,  espacamento: 95 }   
    ]
};

// --- Sistema de Chuva e Respingo ---
const maxPingos = 100; 
const chuva = [];
const respingos = []; 

for (let i = 0; i < maxPingos; i++) {
    let profundidade = Math.random(); 
    
    chuva.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        velocidade: 6 + (profundidade * 8), 
        tamanho: 2 + (profundidade * 7),
        fatorParallax: 0.1 + (profundidade * 0.9),
        opacidade: 0.15 + (profundidade * 0.35)
    });
}

function criarRespingo(x, y, fatorParallax) {
    let quantidade = 2 + Math.floor(Math.random() * 2);
    for (let i = 0; i < quantidade; i++) {
        respingos.push({
            x: x,
            y: y,
            velX: (Math.random() - 0.5) * 2,  
            velY: -Math.random() * 2 - 1,     
            vida: 8 + Math.random() * 8,
            fatorParallax: fatorParallax 
        });
    }
}

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
            npc.x = -9999; 
        }
    }
});

window.addEventListener("keyup", (e) => teclas[e.code] = false);

btnStart.addEventListener("click", () => {
    estadoAtual = "DIALOGO_INICIAL";
    btnStart.style.display = "none"; 
});

function desenharCenario() {
    ctx.fillStyle = "#020005";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    for(let i = 0; i < 30; i++) {
        let x = ((i * 137) - (camera.x * 0.01)) % canvas.width;
        if (x < 0) x += canvas.width;
        let y = (i * 243) % 150;
        ctx.fillRect(x, y, 1, 1);
    }

    parallax.camadas.forEach((camada, indexCamada) => {
        let espacoTotal = camada.espacamento;
        let scrollX = (camera.x * camada.velocidade) % espacoTotal;

        for (let i = -1; i < (canvas.width / espacoTotal) + 2; i++) {
            let xPos = (i * espacoTotal) - scrollX;
            let idPredioMundo = Math.floor((camera.x * camada.velocidade) / espacoTotal) + i;
            
            let h = camada.alturaBase + (Math.abs(Math.sin(idPredioMundo + indexCamada)) * 70);
            let topoY = chaoY - h;

            ctx.fillStyle = camada.cor;
            ctx.fillRect(xPos, topoY, camada.larguraPredio, h);

            if (indexCamada > 0) {
                let linhaJanela = 0;
                for (let wy = topoY + 20; wy < chaoY - 20; wy += 25) {
                    linhaJanela++;
                    let colunaJanela = 0;
                    for (let wx = xPos + 15; wx < xPos + camada.larguraPredio - 15; wx += 20) {
                        colunaJanela++;

                        let sementeJanela = Math.abs(Math.sin(idPredioMundo * 7 + linhaJanela * 13 + colunaJanela * 31));

                        if (sementeJanela > 0.4) {
                            let finalWx = wx;

                            if (sementeJanela > 0.82) {
                                ctx.fillStyle = "rgba(255, 230, 100, 0.8)"; 
                            } else {
                                ctx.fillStyle = "rgba(0, 0, 0, 0.6)"; 
                            }

                            ctx.fillRect(finalWx, wy, 4, 6);
                        }
                    }
                }
            }
        }
    });
}

function gerenciarChuva() {
    let playerTelaX = player.x - camera.x;

    chuva.forEach(pingo => {
        let pingoTelaX = (pingo.x - (camera.x * pingo.fatorParallax)) % canvas.width;
        if (pingoTelaX < 0) pingoTelaX += canvas.width; 

        ctx.strokeStyle = `rgba(174, 219, 255, ${pingo.opacidade})`;
        ctx.lineWidth = pingo.tamanho > 5 ? 1.5 : 1; 
        
        ctx.beginPath();
        ctx.moveTo(pingoTelaX, pingo.y);
        ctx.lineTo(pingoTelaX - (pingo.fatorParallax * 2), pingo.y + pingo.tamanho);
        ctx.stroke();

        if (estadoAtual === "JOGANDO" || estadoAtual === "DIALOGO_NPC" || estadoAtual === "DIALOGO_INICIAL") {
            pingo.y += pingo.velocidade;
            pingo.x -= 0.5 * pingo.fatorParallax; 
        }

        if (estadoAtual === "JOGANDO" && pingo.fatorParallax > 0.6) {
            if (pingoTelaX > playerTelaX && 
                pingoTelaX < playerTelaX + player.largura && 
                pingo.y > player.y && 
                pingo.y < player.y + player.altura) {
                
                criarRespingo(pingoTelaX, pingo.y, pingo.fatorParallax);
                pingo.y = -20; 
                return; 
            }
        }

        if (pingo.y > chaoY) {
            criarRespingo(pingoTelaX, chaoY, pingo.fatorParallax);
            pingo.y = -20;
        }
    });

    for (let i = respingos.length - 1; i >= 0; i--) {
        let r = respingos[i];
        
        ctx.fillStyle = `rgba(174, 219, 255, 0.5)`;
        ctx.fillRect(r.x, r.y, 1.5, 1.5);

        if (estadoAtual === "JOGANDO" || estadoAtual === "DIALOGO_NPC" || estadoAtual === "DIALOGO_INICIAL") {
            r.x += r.velX;
            
            if (teclas["KeyD"] && estadoAtual === "JOGANDO") r.x -= player.velocidade * r.fatorParallax;
            if (teclas["KeyA"] && estadoAtual === "JOGANDO") r.x += player.velocidade * r.fatorParallax;

            r.y += r.velY;
            r.velY += 0.2; 
            r.vida--;
        }

        if (r.vida <= 0) {
            respingos.splice(i, 1);
        }
    }
}

function atualizar() {
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
    ctx.fillStyle = "rgba(0, 0, 26, 0.9)"; 
    ctx.fillRect(caixaDialogo.x, caixaDialogo.y, caixaDialogo.largura, caixaDialogo.altura);
    
    ctx.strokeStyle = "#ff0055"; 
    ctx.lineWidth = 2;
    ctx.strokeRect(caixaDialogo.x, caixaDialogo.y, caixaDialogo.largura, caixaDialogo.altura);
    
    ctx.fillStyle = "white";
    ctx.font = "20px 'Courier New', monospace";
    ctx.textAlign = "left";
    ctx.fillText(texto, caixaDialogo.x + 20, caixaDialogo.y + 55);
    
    ctx.font = "12px 'Courier New', monospace";
    ctx.fillStyle = "rgba(0, 255, 204, 0.7)"; 
    ctx.fillText("[Espaço / Enter] para continuar", caixaDialogo.x + 20, caixaDialogo.y + 100);
}

function desenhar() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (estadoAtual === "TELA_INICIAL") {
        ctx.fillStyle = "#050010";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = "#00ffcc";
        ctx.font = "40px 'Courier New', monospace";
        ctx.textAlign = "center";
        ctx.fillText("CIDADE INFINITA", canvas.width / 2, 150);
    } 
    else if (estadoAtual === "DIALOGO_INICIAL") {
        desenharCenario();
        gerenciarChuva(); 
        
        ctx.fillStyle = "#0a0712";
        ctx.fillRect(0, chaoY, canvas.width, canvas.height - chaoY);
        
        desenharCaixaTexto(dialogoInicial.texto[dialogoInicial.indiceAtual]);
    } 
    else if (estadoAtual === "JOGANDO" || estadoAtual === "DIALOGO_NPC") {
        desenharCenario();

        ctx.fillStyle = "#0a0712";
        ctx.fillRect(0, chaoY, canvas.width, canvas.height - chaoY);
        
        ctx.fillStyle = "#ff00ffff";
        ctx.fillRect(0, chaoY, canvas.width, 2);

        let displayX = Math.floor(player.x / 10); 
        let displayY = Math.floor(((chaoY - player.altura - player.y) / (chaoY - player.altura)) * 100);

        ctx.fillStyle = "rgba(0, 255, 204, 0.8)";
        ctx.font = "16px 'Courier New', monospace";
        ctx.textAlign = "left";
        ctx.fillText(`COORD X: ${displayX}  COORD Y: ${displayY}`, 20, 30);

        // --- RENDERIZAÇÃO DO NPC 1 (Espírito Azul) ---
        let npcRelativoX = npc.x - camera.x;
        if (npcRelativoX > -100 && npcRelativoX < canvas.width + 100) {
            let flutuarY = npc.y + Math.sin(npc.tempoFlutuar) * 8;

            if (imgNpcEspirito.complete && imgNpcEspirito.width > 0) {
                ctx.drawImage(imgNpcEspirito, npcRelativoX, flutuarY, npc.largura, npc.altura);
            } else {
                ctx.fillStyle = "#00ffff"; 
                ctx.fillRect(npcRelativoX, flutuarY, npc.largura, npc.altura);
            }
        }

        // --- RENDERIZAÇÃO DO NPC 2 (Raposinha aumentada) ---
        let npc2RelativoX = npc2.x - camera.x;
        if (npc2RelativoX > -100 && npc2RelativoX < canvas.width + 100) {
            if (imgNpc2Fox.complete && imgNpc2Fox.width > 0) {
                ctx.drawImage(imgNpc2Fox, npc2RelativoX, npc2.y, npc2.largura, npc2.altura);
            } else {
                ctx.fillStyle = "#55ff55";
                ctx.fillRect(npc2RelativoX, npc2.y, npc2.largura, npc2.altura); 
                ctx.fillStyle = "white";
                ctx.fillRect(npc2RelativoX + 12, npc2.y + 18, 10, 10);
            }
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

        gerenciarChuva();

        if (estadoAtual === "DIALOGO_NPC") {
            desenharCaixaTexto(npc.dialogo[npc.indiceAtual]);
        }
    }
}

// Inicia o loop principal do jogo
atualizar();