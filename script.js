const canvas = document.getElementById("jogoCanvas");
const ctx = canvas.getContext("2d");
const btnStart = document.getElementById("btnStart");

canvas.width = 800;
canvas.height = 400;

let estadoAtual = "TELA_INICIAL"; 

// --- Carregamento de Sprites ---
const imgPlayerParado = new Image();
imgPlayerParado.src = "IMG_20260525_102813.png"; 

const imgPlayerCorrendo = new Image();
imgPlayerCorrendo.src = "IMG_20260525_102751.png"; 

const imgNpcEspirito = new Image();
imgNpcEspirito.src = "pixel-art-blue-spirit-character-png.png"; 

// Base da raposa (Imagens estáticas e seguras)
const imgFoxOlhandoDireita = new Image();
imgFoxOlhandoDireita.src = "fox.png.png"; 

const imgFoxOlhandoEsquerda = new Image();
imgFoxOlhandoEsquerda.src = "foxx.png.png"; 

// --- Objeto do Player ---
const player = {
    x: 0, 
    y: 100, 
    larguraVisual: 50,      
    alturaVisual: 80,       
    larguraHitbox: 24,
    alturaHitbox: 64,
    offsetX: 13, 
    offsetY: 2,  
    velocidade: 4, 
    velY: 0,
    gravidade: 1.0, 
    pulo: -14,      
    noChao: false,
    direcao: "direita",
    spriteLargura: 32,  
    spriteAltura: 32,   
    frameAtual: 0,      
    tempoAnimacao: 0,   
    estaAndando: false
};

imgPlayerParado.onload = function() {
    player.spriteAltura = imgPlayerParado.height;
    player.spriteLargura = imgPlayerParado.width; 
};

imgPlayerCorrendo.onload = function() {
    player.spriteLargura = imgPlayerCorrendo.width / 2;
    player.spriteAltura = imgPlayerCorrendo.height;
};

// --- Configurações da Cena Cinematográfica ---
const cena450 = {
    ativa: false,
    concluida: false,
    alturaBarras: 0,
    maxAlturaBarras: 140, 
    velocidadeBarras: 1.5, 
    timerEspera: 0,
    tempoParaDialogo: 120, 
    indiceAtual: 0,
    texto: [
        "hey sou eu...",
        "vc se lembra de mim?",
        "nao tenha medo, sei que cometi um erro m-mas...",
        "por favor me perdoe eu, eu nao queria..."
    ],
    timerPausaPos: 0,
    tempoPausaPos: 120 
};

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

// --- RAPOSINHA (Animação controlada por código) ---
const npc2 = {
    x: 5000, 
    y: 272, 
    largura: 110, 
    altura: 110,
    estado: "OLHANDO_DIREITA", // OLHANDO_DIREITA, VIRANDO_CABECA, OLHANDO_ESQUERDA
    timerAnimacao: 0,
    tempoVirando: 60,
    fatorViro: 0 // Controla a posição matemática dos olhos e focinho (0 = direita, 1 = esquerda)
};

const camera = { x: 0, y: 0 };
const chaoY = 350;
const teclas = {};

const parallax = {
    camadas: [
        { x: 0, velocidade: 0.02, cor: "#090014", alturaBase: 200, larguraPredio: 110, espacamento: 140 }, 
        { x: 0, velocidade: 0.06, cor: "#120024", alturaBase: 140, larguraPredio: 85,  espacamento: 110 }, 
        { x: 0, velocidade: 0.15, cor: "#1b003a", alturaBase: 90,  larguraPredio: 65,  espacamento: 95 }   
    ]
};

// --- Sistema de Chuva ---
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
        respingos.push({ x: x, y: y, velX: (Math.random() - 0.5) * 2, velY: -Math.random() * 2 - 1, vida: 8 + Math.random() * 8, fatorParallax: factorParallax });
    }
}

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

const caixaDialogo = { x: 50, y: 250, largura: 700, altura: 120 };

// --- INPUTS ---
window.addEventListener("keydown", (e) => {
    teclas[e.code] = true;
    
    if (estadoAtual === "CENA_450" && cena450.timerEspera >= cena450.tempoParaDialogo && (e.code === "Space" || e.code === "Enter")) {
        cena450.indiceAtual++;
        if (cena450.indiceAtual >= cena450.texto.length) {
            estadoAtual = "ESPERA_POS_DIALOGO"; 
            cena450.timerPausaPos = 0;
            teclas["KeyD"] = false;
            teclas["KeyA"] = false;
            player.estaAndando = false;
        }
    }
    
    if (estadoAtual === "DIALOGO_INICIAL" && (e.code === "Space" || e.code === "Enter")) {
        dialogoInicial.indiceAtual++;
        if (dialogoInicial.indiceAtual >= dialogoInicial.texto.length) estadoAtual = "JOGANDO"; 
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
        let y = ((i * 243) % 150) - camera.y * 0.5; 
        ctx.fillRect(x, y, 1, 1);
    }

    parallax.camadas.forEach((camada, indexCamada) => {
        let espacoTotal = camada.espacamento;
        let scrollX = (camera.x * camada.velocidade) % espacoTotal;

        for (let i = -1; i < (canvas.width / espacoTotal) + 2; i++) {
            let xPos = (i * espacoTotal) - scrollX;
            let idPredioMundo = Math.floor((camera.x * camada.velocidade) / espacoTotal) + i;
            let h = camada.alturaBase + (Math.abs(Math.sin(idPredioMundo + indexCamada)) * 70);
            let topoY = chaoY - h - camera.y;

            ctx.fillStyle = camada.cor;
            ctx.fillRect(xPos, topoY, camada.larguraPredio, h);

            if (indexCamada > 0) {
                let texturadajaneLa = 0;
                for (let wy = topoY + 20; wy < (chaoY - camera.y) - 20; wy += 25) {
                    texturadajaneLa++;
                    let colunaJanela = 0;
                    for (let wx = xPos + 15; wx < xPos + camada.larguraPredio - 15; wx += 20) {
                        colunaJanela++;
                        let sementeJanela = Math.abs(Math.sin(idPredioMundo * 7 + texturadajaneLa * 13 + colunaJanela * 31));
                        if (sementeJanela > 0.4) {
                            ctx.fillStyle = sementeJanela > 0.82 ? "rgba(255, 230, 100, 0.8)" : "rgba(0, 0, 0, 0.6)"; 
                            ctx.fillRect(wx, wy, 4, 6);
                        }
                    }
                }
            }
        }
    });
}

function gerenciarChuva() {
    let hitboxRealX = player.x + player.offsetX - camera.x;
    let hitboxRealY = player.y + player.offsetY - camera.y; 

    chuva.forEach(pingo => {
        let pingoTelaX = (pingo.x - (camera.x * pingo.fatorParallax)) % canvas.width;
        if (pingoTelaX < 0) pingoTelaX += canvas.width; 

        ctx.strokeStyle = `rgba(174, 219, 255, ${pingo.opacidade})`;
        ctx.lineWidth = pingo.tamanho > 5 ? 1.5 : 1; 
        
        ctx.beginPath();
        ctx.moveTo(pingoTelaX, pingo.y);
        ctx.lineTo(pingoTelaX - (pingo.fatorParallax * 2), pingo.y + pingo.tamanho);
        ctx.stroke();

        if (estadoAtual !== "TELA_INICIAL") {
            pingo.y += pingo.velocidade;
            pingo.x -= 0.5 * pingo.fatorParallax; 
        }

        if ((estadoAtual === "JOGANDO" || estadoAtual === "ESPERA_POS_DIALOGO" || estadoAtual === "RAPOSA_VIRANDO") && pingo.fatorParallax > 0.6) {
            if (pingoTelaX > hitboxRealX && pingoTelaX < hitboxRealX + player.larguraHitbox && pingo.y > hitboxRealY && pingo.y < hitboxRealY + player.alturaHitbox) {
                criarRespingo(pingoTelaX, pingo.y, pingo.fatorParallax);
                pingo.y = -20; 
                return; 
            }
        }

        if (pingo.y > chaoY - camera.y) {
            criarRespingo(pingoTelaX, chaoY - camera.y, pingo.fatorParallax);
            pingo.y = -20;
        }
    });

    for (let i = respingos.length - 1; i >= 0; i--) {
        let r = respingos[i];
        ctx.fillStyle = `rgba(174, 219, 255, 0.5)`;
        ctx.fillRect(r.x, r.y, 1.5, 1.5);

        if (estadoAtual !== "TELA_INICIAL") {
            r.x += r.velX;
            if (teclas["KeyD"] && estadoAtual === "JOGANDO") r.x -= player.velocidade * r.fatorParallax;
            if (teclas["KeyA"] && estadoAtual === "JOGANDO") r.x += player.velocidade * r.fatorParallax;
            r.y += r.velY;
            r.velY += 0.2; 
            r.vida--;
        }
        if (r.vida <= 0) respingos.splice(i, 1);
    }
}

// --- LOOP PRINCIPAL DO JOGO ---
function atualizar() {
    if (estadoAtual === "JOGANDO" || estadoAtual === "DIALOGO_NPC") {
        npc.tempoFlutuar += 0.05;
    }

    if (estadoAtual !== "TELA_INICIAL") {
        player.velY += player.gravidade;
        player.y += player.velY;

        let baseHitboxY = player.y + player.offsetY + player.alturaHitbox;
        if (baseHitboxY >= chaoY) {
            player.y = chaoY - player.alturaHitbox - player.offsetY;
            player.velY = 0;
            player.noChao = true;
        }
    }

    // 1. ESPERA DE 2 SEGUNDOS DEPOIS DO DIÁLOGO
    if (estadoAtual === "ESPERA_POS_DIALOGO") {
        cena450.timerPausaPos++;
        player.estaAndando = false;

        if (cena450.timerPausaPos >= cena450.tempoPausaPos) {
            estadoAtual = "RAPOSA_VIRANDO"; 
            npc2.estado = "VIRANDO_CABECA";
            npc2.timerAnimacao = 0;
        }
    }

    // 2. EXECUTANDO A VIRADA POR CÓDIGO (Suave e sem travar)
    if (estadoAtual === "RAPOSA_VIRANDO") {
        player.estaAndando = false; 
        npc2.timerAnimacao++;
        
        // Transiciona o fator matemático de 0 (olhando direita) até 1 (olhando esquerda)
        npc2.fatorViro = npc2.timerAnimacao / npc2.tempoVirando;

        if (npc2.timerAnimacao >= npc2.tempoVirando) {
            npc2.fatorViro = 1;
            npc2.estado = "OLHANDO_ESQUERDA"; 
            estadoAtual = "JOGANDO";          // Devolve o controle pro jogador caminhar livremente
            cena450.concluida = true;
            cena450.ativa = false;
        }
    }

    // Movimentação Normal do Player
    if (estadoAtual === "JOGANDO") {
        if (player.x >= 4500 && !cena450.concluida) {
            estadoAtual = "CENA_450";
            cena450.ativa = true;
            cena450.timerEspera = 0; 
            teclas["KeyD"] = false; 
            teclas["KeyA"] = false;
            player.estaAndando = false;
        }

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

        let centroPlayerX = player.x + player.offsetX + (player.larguraHitbox / 2);
        if (!npc.jaConversou && npc.x !== -9999) {
            let distancia = Math.abs(centroPlayerX - npc.x);
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
    }

    if (estadoAtual === "CENA_450" || estadoAtual === "ESPERA_POS_DIALOGO" || estadoAtual === "RAPOSA_VIRANDO" || cena450.concluida) {
        if (estadoAtual === "CENA_450") cena450.timerEspera++; 
        if (cena450.alturaBarras < cena450.maxAlturaBarras) cena450.alturaBarras += cena450.velocidadeBarras; 
        if (camera.y < 90) camera.y += (cena450.velocidadeBarras * 0.65); 
    } else {
        if (cena450.alturaBarras > 0) cena450.alturaBarras -= 4;
        if (camera.y > 0) camera.y -= 3;
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

function desenharCaixaPensamento(texto) {
    ctx.fillStyle = "rgba(75, 0, 130, 0.9)"; 
    ctx.fillRect(caixaDialogo.x, 20, caixaDialogo.largura, 80); 
    ctx.strokeStyle = "#ff0000"; 
    ctx.lineWidth = 3;
    ctx.strokeRect(caixaDialogo.x, 20, caixaDialogo.largura, 80);
    ctx.fillStyle = "white";
    ctx.font = "18px 'Courier New', monospace";
    ctx.textAlign = "center";
    ctx.fillText(texto, canvas.width / 2, 65);
}

function desenharBarrasCinematicas() {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, cena450.alturaBarras); 
    ctx.fillRect(0, canvas.height - cena450.alturaBarras, canvas.width, cena450.alturaBarras); 
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
    else {
        desenharCenario();

        ctx.fillStyle = "#0a0712";
        ctx.fillRect(0, chaoY - camera.y, canvas.width, (canvas.height - chaoY) + camera.y);
        ctx.fillStyle = "#ff00ffff";
        ctx.fillRect(0, chaoY - camera.y, canvas.width, 2);

        let displayX = Math.floor(player.x / 10); 
        let displayY = Math.floor((chaoY - (player.y + player.offsetY + player.alturaHitbox)));
        ctx.fillStyle = "rgba(0, 255, 204, 0.8)";
        ctx.font = "16px 'Courier New', monospace";
        ctx.textAlign = "left";
        ctx.fillText(`COORD X: ${displayX}  COORD Y: ${Math.max(0, displayY)}`, 20, 30);

        // NPC 1 (Espírito)
        let npcRelativoX = npc.x - camera.x;
        if (npcRelativoX > -100 && npcRelativoX < canvas.width + 100) {
            let flutuarY = npc.y + Math.sin(npc.tempoFlutuar) * 8 - camera.y;
            if (imgNpcEspirito.complete && imgNpcEspirito.width > 0) {
                ctx.drawImage(imgNpcEspirito, npcRelativoX, flutuarY, npc.largura, npc.altura);
            }
        }

        // --- SISTEMA DE ANIMAÇÃO REAL POR CÓDIGO DA RAPOSA ---
        let npc2RelativoX = npc2.x - camera.x;
        if (npc2RelativoX > -150 && npc2RelativoX < canvas.width + 150) {
            let npc2Y = npc2.y - camera.y;

            if (imgFoxOlhandoDireita.complete && imgFoxOlhandoEsquerda.complete && imgFoxOlhandoDireita.width > 0) {
                
                if (npc2.estado === "OLHANDO_DIREITA") {
                    ctx.drawImage(imgFoxOlhandoDireita, npc2RelativoX, npc2Y, npc2.largura, npc2.altura);
                } 
                else if (npc2.estado === "OLHANDO_ESQUERDA") {
                    ctx.drawImage(imgFoxOlhandoEsquerda, npc2RelativoX, npc2Y, npc2.largura, npc2.altura);
                } 
                else if (npc2.estado === "VIRANDO_CABECA") {
                    // MÁGICA: Renderiza a base estática e reconstrói a cabeça se movendo dinamicamente por cima!
                    ctx.drawImage(imgFoxOlhandoDireita, npc2RelativoX, npc2Y, npc2.largura, npc2.altura);
                    
                    // Recorta e move os pixels pretos dos olhos e focinho conforme a transição avança
                    let moverX = npc2.fatorViro * -14; // Move os traços faciais suavemente para a esquerda
                    
                    ctx.fillStyle = "#000000";
                    // Desenha os novos olhos virando em tempo real
                    ctx.fillRect(npc2RelativoX + 46 + moverX, npc2Y + 45, 6, 6);
                    ctx.fillRect(npc2RelativoX + 58 + moverX, npc2Y + 45, 6, 6);
                }
            } else {
                ctx.fillStyle = "red";
                ctx.fillRect(npc2RelativoX, npc2Y, npc2.largura, npc2.altura);
            }
        }

        // Renderização do Player
        let playerRelativoX = player.x - camera.x;
        let playerY = player.y - camera.y;
        
        ctx.save(); 
        if (player.direcao === "esquerda") {
            ctx.translate(playerRelativoX + player.larguraVisual / 2, playerY + player.alturaVisual / 2);
            ctx.scale(-1, 1);
            ctx.translate(-(playerRelativoX + player.larguraVisual / 2), -(playerY + player.alturaVisual / 2));
        }

        if (imgPlayerParado.complete && imgPlayerCorrendo.complete && imgPlayerParado.width > 0) {
            if (player.estaAndando) {
                ctx.drawImage(imgPlayerCorrendo, player.frameAtual * player.spriteLargura, 0, player.spriteLargura, player.spriteAltura, playerRelativoX, playerY, player.larguraVisual, player.alturaVisual);
            } else {
                ctx.drawImage(imgPlayerParado, 0, 0, player.spriteLargura, player.spriteAltura, playerRelativoX, playerY, player.larguraVisual, player.alturaVisual);
            }
        } else {
            ctx.fillStyle = "#00aaff";
            ctx.fillRect(playerRelativoX, playerY, player.larguraVisual, player.alturaVisual);
        }
        ctx.restore(); 

        ctx.strokeStyle = "#00ff00";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(playerRelativoX + player.offsetX, playerY + player.offsetY, player.larguraHitbox, player.alturaHitbox);

        gerenciarChuva();

        if (estadoAtual === "DIALOGO_INICIAL") desenharCaixaTexto(dialogoInicial.texto[dialogoInicial.indiceAtual]);
        if (estadoAtual === "DIALOGO_NPC") desenharCaixaTexto(npc.dialogo[npc.indiceAtual]);

        desenharBarrasCinematicas();
        
        if (estadoAtual === "CENA_450" && cena450.timerEspera >= cena450.tempoParaDialogo) {
            desenharCaixaPensamento(cena450.texto[cena450.indiceAtual]);
        }
    }
}

// Inicia o jogo
atualizar();