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

// --- Configuração Segura da Animação da Raposa ---
const nomesArquivosFox = [
    "Untitled 05-25-2026 03-13-21 (1).png",
    "Untitled 05-25-2026 03-13-21 (2).png",
    "Untitled 05-25-2026 03-13-21 (3).png",
    "Untitled 05-25-2026 03-13-21 (4).png",
    "Untitled 05-25-2026 03-13-21 (5).png",
    "Untitled 05-25-2026 03-13-21 (6).png"
];

const imgFoxFrames = [];
nomesArquivosFox.forEach((src) => {
    const img = new Image();
    img.src = src;
    imgFoxFrames.push(img);
});

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

// --- RAPOSINHA ---
const npc2 = {
    x: 5000, 
    y: 272, 
    largura: 110, 
    altura: 110,
    estado: "OLHANDO_DIREITA",
    frameAnimacao: 0,
    timerAnimacao: 0,
    tempoPorFrame: 10,
    tempoVirando: 60 
};

const camera = { x: 0, y: 0 };
const chaoY = 350;
const teclas = {};

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
        respingos.push({
            x: x, y: y,
            velX: (Math.random() - 0.5) * 2,
            velY: -Math.random() * 2 - 1,
            vida: 8 + Math.random() * 8,
            fatorParallax: fatorParallax
        });
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

// --- CENÁRIO COMPLETO ---
function desenharCenario() {

    // 1. FUNDO DO CÉU
    ctx.fillStyle = "#04000f";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Nebulosa roxa distante
    const nebRoxa = ctx.createRadialGradient(200 - camera.x * 0.003, 80, 10, 200 - camera.x * 0.003, 80, 180);
    nebRoxa.addColorStop(0, "rgba(80, 0, 120, 0.18)");
    nebRoxa.addColorStop(0.5, "rgba(50, 0, 90, 0.08)");
    nebRoxa.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = nebRoxa;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Nebulosa azul central
    const nebAzul = ctx.createRadialGradient(500 - camera.x * 0.004, 60, 5, 500 - camera.x * 0.004, 60, 140);
    nebAzul.addColorStop(0, "rgba(0, 40, 120, 0.2)");
    nebAzul.addColorStop(0.5, "rgba(0, 20, 80, 0.08)");
    nebAzul.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = nebAzul;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. ESTRELAS (desenhadas ANTES da lua)
    const tempoAgora = Date.now() * 0.001;

    // Estrelas distantes
    const estrelasDist = [
        {x:15,y:12},{x:47,y:8},{x:93,y:22},{x:134,y:5},{x:178,y:18},
        {x:221,y:10},{x:265,y:28},{x:312,y:7},{x:358,y:15},{x:401,y:3},
        {x:444,y:25},{x:488,y:11},{x:531,y:20},{x:577,y:6},{x:620,y:17},
        {x:663,y:30},{x:701,y:9},{x:741,y:22},{x:777,y:4},{x:55,y:35},
        {x:110,y:42},{x:190,y:38},{x:280,y:44},{x:370,y:33},{x:460,y:40},
        {x:550,y:36},{x:640,y:43},{x:730,y:31},{x:25,y:50},{x:330,y:55},
    ];
    estrelasDist.forEach((s, i) => {
        let sx = (s.x - camera.x * 0.006) % canvas.width;
        if (sx < 0) sx += canvas.width;
        let brilho = 0.35 + 0.25 * Math.abs(Math.sin(tempoAgora * 0.5 + i * 1.7));
        ctx.fillStyle = `rgba(200, 210, 255, ${brilho})`;
        ctx.fillRect(Math.floor(sx), s.y, 1, 1);
    });

    // Estrelas médias com twinkle
    const estrelasMed = [
        {x:30,y:20},{x:80,y:14},{x:150,y:30},{x:230,y:8},{x:310,y:25},
        {x:390,y:12},{x:470,y:35},{x:560,y:18},{x:650,y:28},{x:745,y:10},
        {x:60,y:45},{x:200,y:50},{x:340,y:42},{x:480,y:48},{x:600,y:38},
        {x:720,y:55},{x:120,y:60},{x:260,y:65},{x:420,y:58},{x:580,y:62},
    ];
    estrelasMed.forEach((s, i) => {
        let sx = (s.x - camera.x * 0.01) % canvas.width;
        if (sx < 0) sx += canvas.width;
        let brilho = 0.5 + 0.4 * Math.abs(Math.sin(tempoAgora * 0.7 + i * 2.3));
        let cor = i % 3 === 0 ? `rgba(160, 190, 255, ${brilho})` : `rgba(220, 230, 255, ${brilho})`;
        ctx.fillStyle = cor;
        ctx.fillRect(Math.floor(sx), s.y, 1, 1);
        if (i % 5 === 0 && brilho > 0.75) {
            ctx.fillStyle = `rgba(200, 220, 255, ${brilho * 0.4})`;
            ctx.fillRect(Math.floor(sx) - 1, s.y, 1, 1);
            ctx.fillRect(Math.floor(sx) + 1, s.y, 1, 1);
            ctx.fillRect(Math.floor(sx), s.y - 1, 1, 1);
            ctx.fillRect(Math.floor(sx), s.y + 1, 1, 1);
        }
    });

    // Estrelas grandes com cruzinha pixel art
    const estrelasGrandes = [
        {x:100,y:18},{x:300,y:10},{x:520,y:22},{x:700,y:8},{x:420,y:45},
    ];
    estrelasGrandes.forEach((s, i) => {
        let sx = (s.x - camera.x * 0.012) % canvas.width;
        if (sx < 0) sx += canvas.width;
        let brilho = 0.6 + 0.4 * Math.abs(Math.sin(tempoAgora * 0.9 + i * 3.1));
        ctx.fillStyle = `rgba(230, 240, 255, ${brilho})`;
        ctx.fillRect(Math.floor(sx), s.y, 2, 2);
        ctx.fillStyle = `rgba(180, 210, 255, ${brilho * 0.5})`;
        ctx.fillRect(Math.floor(sx) - 1, s.y,     1, 2);
        ctx.fillRect(Math.floor(sx) + 2, s.y,     1, 2);
        ctx.fillRect(Math.floor(sx),     s.y - 1, 2, 1);
        ctx.fillRect(Math.floor(sx),     s.y + 2, 2, 1);
    });

    // Poeira estelar azulada
    for (let i = 0; i < 40; i++) {
        let sx = ((i * 197 + 43) - camera.x * 0.007) % canvas.width;
        if (sx < 0) sx += canvas.width;
        let sy = (i * 83 + 17) % 140;
        let brilho = 0.1 + 0.15 * Math.abs(Math.sin(i * 4.7));
        ctx.fillStyle = `rgba(100, 140, 255, ${brilho})`;
        ctx.fillRect(Math.floor(sx), sy, 1, 1);
    }

    // 3. LUA CRESCENTE (por cima das estrelas)
    const luaBaseX = canvas.width - 130;
    const luaBaseY = 55;
    const luaR = 36;
    const luaX = luaBaseX - (camera.x * 0.004) % 8;

    // Halo
    const haloGrad = ctx.createRadialGradient(luaX, luaBaseY, luaR * 0.9, luaX, luaBaseY, luaR * 3);
    haloGrad.addColorStop(0, "rgba(180, 210, 255, 0.06)");
    haloGrad.addColorStop(0.5, "rgba(140, 180, 255, 0.03)");
    haloGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = haloGrad;
    ctx.beginPath();
    ctx.arc(luaX, luaBaseY, luaR * 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.fillStyle = "rgba(160, 190, 255, 0.06)";
    ctx.beginPath();
    ctx.arc(luaX, luaBaseY, luaR + 3, 0, Math.PI * 2);
    ctx.fill();

    // Disco principal
    ctx.fillStyle = "#c8dcf8";
    ctx.beginPath();
    ctx.arc(luaX, luaBaseY, luaR, 0, Math.PI * 2);
    ctx.fill();

    // Gradiente de brilho
    const luaGrad = ctx.createRadialGradient(luaX - 8, luaBaseY - 10, 2, luaX, luaBaseY, luaR);
    luaGrad.addColorStop(0, "rgba(255, 255, 255, 0.45)");
    luaGrad.addColorStop(0.5, "rgba(200, 220, 255, 0.1)");
    luaGrad.addColorStop(1, "rgba(100, 140, 220, 0.2)");
    ctx.fillStyle = luaGrad;
    ctx.beginPath();
    ctx.arc(luaX, luaBaseY, luaR, 0, Math.PI * 2);
    ctx.fill();

    // Mordida do crescente
    ctx.fillStyle = "#04000f";
    ctx.beginPath();
    ctx.arc(luaX + luaR * 0.58, luaBaseY - luaR * 0.08, luaR * 0.87, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 4. NEBLINA DO HORIZONTE
    const nebHorizonte = ctx.createLinearGradient(0, chaoY - 100 - camera.y, 0, chaoY - camera.y);
    nebHorizonte.addColorStop(0, "rgba(30, 0, 60, 0)");
    nebHorizonte.addColorStop(0.6, "rgba(60, 0, 100, 0.05)");
    nebHorizonte.addColorStop(1, "rgba(100, 0, 140, 0.15)");
    ctx.fillStyle = nebHorizonte;
    ctx.fillRect(0, chaoY - 100 - camera.y, canvas.width, 100);

    // 5. PRÉDIOS TRASEIROS
    {
        const vel = 0.02, cor = "#080012", altBase = 200, larg = 110, espaco = 140;
        let scrollX = (camera.x * vel) % espaco;
        for (let i = -1; i < (canvas.width / espaco) + 2; i++) {
            let xPos = (i * espaco) - scrollX;
            let id = Math.floor((camera.x * vel) / espaco) + i;
            let h = altBase + (Math.abs(Math.sin(id * 1.3)) * 65);
            let topoY = chaoY - h - camera.y;
            ctx.fillStyle = cor;
            ctx.fillRect(Math.floor(xPos), Math.floor(topoY), larg, h + 1);
        }
    }

    // 6. PRÉDIOS DO MEIO (com luzes rosas)
    {
        const vel = 0.06, cor = "#110020", altBase = 140, larg = 85, espaco = 110;
        let scrollX = (camera.x * vel) % espaco;
        for (let i = -1; i < (canvas.width / espaco) + 2; i++) {
            let xPos = (i * espaco) - scrollX;
            let id = Math.floor((camera.x * vel) / espaco) + i;
            let h = altBase + (Math.abs(Math.sin(id * 1.7 + 1)) * 65);
            let topoY = chaoY - h - camera.y;
            let chaoTela = chaoY - camera.y;

            ctx.fillStyle = cor;
            ctx.fillRect(Math.floor(xPos), Math.floor(topoY), larg, h + 1);

            // Janelas
            let lj = 0;
            for (let wy = topoY + 18; wy < chaoTela - 18; wy += 22) {
                lj++;
                let cj = 0;
                for (let wx = xPos + 10; wx < xPos + larg - 10; wx += 18) {
                    cj++;
                    let s = Math.abs(Math.sin(id * 7 + lj * 13 + cj * 31));
                    if (s > 0.42) {
                        ctx.fillStyle = s > 0.80
                            ? "rgba(255, 220, 90, 0.75)"
                            : s > 0.62
                                ? "rgba(140, 200, 255, 0.5)"
                                : "rgba(0, 0, 0, 0.5)";
                        ctx.fillRect(Math.floor(wx), Math.floor(wy), 3, 5);
                    }
                }
            }

            // Antena esparsa (~30% dos prédios)
            if (Math.abs(Math.sin(id * 5.1 + 2)) > 0.72) {
                let antX = Math.floor(xPos + larg / 2);
                ctx.fillStyle = "rgba(160, 150, 180, 0.4)";
                ctx.fillRect(antX, Math.floor(topoY) - 14, 1, 14);
                let pisca = Math.sin(tempoAgora * 2.1 + id) > 0.2;
                if (pisca) {
                    ctx.fillStyle = "rgba(255, 80, 80, 0.85)";
                    ctx.fillRect(antX, Math.floor(topoY) - 15, 1, 1);
                }
            }

            // Luz rosa/lilás vindo de baixo
            let intensidade = 0.5 + 0.5 * Math.abs(Math.sin(id * 3.3));
            if (intensidade > 0.6) {
                let luzGrad = ctx.createLinearGradient(xPos + larg / 2, chaoTela - 40, xPos + larg / 2, chaoTela);
                luzGrad.addColorStop(0, "rgba(200, 50, 150, 0)");
                luzGrad.addColorStop(1, `rgba(220, 60, 180, ${0.08 + intensidade * 0.06})`);
                ctx.fillStyle = luzGrad;
                ctx.fillRect(Math.floor(xPos - 6), Math.floor(chaoTela - 40), larg + 12, 40);

                ctx.fillStyle = `rgba(230, 80, 180, ${0.04 + intensidade * 0.04})`;
                ctx.fillRect(Math.floor(xPos), Math.floor(chaoTela - 8), larg, 8);
            }
        }
    }

    // 7. PRÉDIOS DA FRENTE
    {
        const vel = 0.15, cor = "#1a0035", altBase = 90, larg = 65, espaco = 95;
        let scrollX = (camera.x * vel) % espaco;
        for (let i = -1; i < (canvas.width / espaco) + 2; i++) {
            let xPos = (i * espaco) - scrollX;
            let id = Math.floor((camera.x * vel) / espaco) + i;
            let h = altBase + (Math.abs(Math.sin(id * 2.1 + 0.5)) * 65);
            let topoY = chaoY - h - camera.y;
            let chaoTela = chaoY - camera.y;

            ctx.fillStyle = cor;
            ctx.fillRect(Math.floor(xPos), Math.floor(topoY), larg, h + 1);

            // Janelas
            let lj = 0;
            for (let wy = topoY + 14; wy < chaoTela - 14; wy += 20) {
                lj++;
                let cj = 0;
                for (let wx = xPos + 8; wx < xPos + larg - 8; wx += 16) {
                    cj++;
                    let s = Math.abs(Math.sin(id * 11 + lj * 17 + cj * 23));
                    if (s > 0.5) {
                        ctx.fillStyle = s > 0.78
                            ? "rgba(255, 210, 70, 0.7)"
                            : "rgba(0, 0, 0, 0.5)";
                        ctx.fillRect(Math.floor(wx), Math.floor(wy), 3, 4);
                    }
                }
            }

            // Parapeito no topo
            ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
            ctx.fillRect(Math.floor(xPos) - 1, Math.floor(topoY) - 2, larg + 2, 2);
        }
    }
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

// --- LOOP PRINCIPAL ---
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

    if (estadoAtual === "ESPERA_POS_DIALOGO") {
        cena450.timerPausaPos++;
        player.estaAndando = false;
        if (cena450.timerPausaPos >= cena450.tempoPausaPos) {
            estadoAtual = "RAPOSA_VIRANDO"; 
            npc2.estado = "ANIMANDO";
            npc2.frameAnimacao = 0;
            npc2.timerAnimacao = 0;
        }
    }

    if (estadoAtual === "RAPOSA_VIRANDO") {
        player.estaAndando = false; 
        npc2.timerAnimacao++;
        if (npc2.timerAnimacao >= npc2.tempoPorFrame) {
            npc2.timerAnimacao = 0;
            if (npc2.frameAnimacao < imgFoxFrames.length - 1) {
                npc2.frameAnimacao++;
            } else {
                npc2.estado = "OLHANDO_ESQUERDA"; 
                estadoAtual = "JOGANDO";
                cena450.concluida = true;
                cena450.ativa = false;
            }
        }
    }

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

        // Raposa
        let npc2RelativoX = npc2.x - camera.x;
        if (npc2RelativoX > -150 && npc2RelativoX < canvas.width + 150) {
            let npc2Y = npc2.y - camera.y;
            if (npc2.estado === "OLHANDO_DIREITA") {
                if (imgFoxFrames[0].complete && imgFoxFrames[0].width > 0)
                    ctx.drawImage(imgFoxFrames[0], npc2RelativoX, npc2Y, npc2.largura, npc2.altura);
            } else if (npc2.estado === "OLHANDO_ESQUERDA") {
                let uf = imgFoxFrames.length - 1;
                if (imgFoxFrames[uf].complete && imgFoxFrames[uf].width > 0)
                    ctx.drawImage(imgFoxFrames[uf], npc2RelativoX, npc2Y, npc2.largura, npc2.altura);
            } else if (npc2.estado === "ANIMANDO") {
                let fa = imgFoxFrames[npc2.frameAnimacao];
                if (fa && fa.complete && fa.width > 0)
                    ctx.drawImage(fa, npc2RelativoX, npc2Y, npc2.largura, npc2.altura);
            }
        }

        // Player
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