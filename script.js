const canvas = document.getElementById("jogoCanvas");
const ctx = canvas.getContext("2d");
const btnStart = document.getElementById("btnStart");

canvas.width = 800;
canvas.height = 400;
ctx.imageSmoothingEnabled = false;

let estadoAtual = "TELA_INICIAL";

// --- SISTEMA DE MÚSICA ---
const playlist = [
    "musicas/Maré_Cinza.mp3",
    "musicas/Maré_Cinza_1_.mp3",
    "musicas/Maré_Lenta.mp3",
    "musicas/Maré_Lenta_1_.mp3",
    "musicas/Bruma_Noturna.mp3",
    "musicas/Bruma_Noturna_1_.mp3"
];

let ordemMusicas = [];
let indiceMusicaAtual = 0;
const audio = new Audio();
audio.volume = 0.5;

function embaralharPlaylist() {
    ordemMusicas = [...playlist];
    for (let i = ordemMusicas.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [ordemMusicas[i], ordemMusicas[j]] = [ordemMusicas[j], ordemMusicas[i]];
    }
}

function tocarProximaMusica() {
    if (estadoAtual !== "TELA_INICIAL") return;
    if (indiceMusicaAtual >= ordemMusicas.length) {
        embaralharPlaylist();
        indiceMusicaAtual = 0;
    }
    audio.src = ordemMusicas[indiceMusicaAtual];
    audio.play().catch(() => {});
    indiceMusicaAtual++;
}

function pararMusica() {
    audio.pause();
    audio.currentTime = 0;
}

embaralharPlaylist();
audio.addEventListener("ended", tocarProximaMusica);

// --- Sprites ---
const imgPlayerParado = new Image();
imgPlayerParado.src = "img/IMG_20260525_102813.png";

const imgPlayerCorrendo = new Image();
imgPlayerCorrendo.src = "img/IMG_20260525_102751.png";

const imgNpcEspirito = new Image();
imgNpcEspirito.src = "img/pixel-art-blue-spirit-character-png.png";

const nomesArquivosFox = [
    "img/Untitled 05-25-2026 03-13-21 (1).png",
    "img/Untitled 05-25-2026 03-13-21 (2).png",
    "img/Untitled 05-25-2026 03-13-21 (3).png",
    "img/Untitled 05-25-2026 03-13-21 (4).png",
    "img/Untitled 05-25-2026 03-13-21 (5).png",
    "img/Untitled 05-25-2026 03-13-21 (6).png"
];
const imgFoxFrames = [];
nomesArquivosFox.forEach((src) => {
    const img = new Image();
    img.src = src;
    imgFoxFrames.push(img);
});

// --- Player ---
const player = {
    x: 0, y: 100,
    larguraVisual: 50, alturaVisual: 80,
    larguraHitbox: 24, alturaHitbox: 64,
    offsetX: 13, offsetY: 2,
    velocidade: 4, velY: 0,
    gravidade: 1.0, pulo: -14,
    noChao: false, direcao: "direita",
    spriteLargura: 32, spriteAltura: 32,
    frameAtual: 0, tempoAnimacao: 0,
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

// --- Cena cinematográfica ---
const cena450 = {
    ativa: false, concluida: false,
    alturaBarras: 0, maxAlturaBarras: 140,
    velocidadeBarras: 1.5, timerEspera: 0,
    tempoParaDialogo: 120, indiceAtual: 0,
    texto: [
        "hey sou eu...",
        "vc se lembra de mim?",
        "nao tenha medo, sei que cometi um erro m-mas...",
        "por favor me perdoe eu, eu nao queria..."
    ],
    timerPausaPos: 0, tempoPausaPos: 120
};

const npc = {
    x: 2500, y: 180, largura: 60, altura: 80,
    tempoFlutuar: 0,
    dialogo: [
        "Hum?",
        "O que você está fazendo aqui?",
        "Você não deveria estar aqui.",
        "normalmente você acorda mais cedo.",
        "não isso não esta certo!",
        "desperte! você tem que acordar!"
    ],
    indiceAtual: 0, jaConversou: false, distanciaInteracao: 80
};

const npc2 = {
    x: 5000, y: 272, largura: 110, altura: 110,
    estado: "OLHANDO_DIREITA",
    frameAnimacao: 0, timerAnimacao: 0,
    tempoPorFrame: 10, tempoVirando: 60
};

const camera = { x: 0, y: 0 };
const chaoY = 350;
const teclas = {};
// --- Chuva ---
const maxPingos = 100;
const chuva = [];
const respingos = [];

for (let i = 0; i < maxPingos; i++) {
    let p = Math.random();
    chuva.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        velocidade: 6 + p * 8,
        tamanho: 2 + p * 7,
        fatorParallax: 0.1 + p * 0.9,
        opacidade: 0.15 + p * 0.35
    });
}

function criarRespingo(x, y, fatorParallax) {
    let q = 2 + Math.floor(Math.random() * 2);
    for (let i = 0; i < q; i++) {
        respingos.push({
            x, y,
            velX: (Math.random() - 0.5) * 2,
            velY: -Math.random() * 2 - 1,
            vida: 8 + Math.random() * 8,
            fatorParallax
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

// =============================================
// FUNÇÃO AUXILIAR — desenha pixel "gordo" (bloco)
// =============================================
function px(x, y, tamanho, cor) {
    ctx.fillStyle = cor;
    ctx.fillRect(Math.floor(x), Math.floor(y), tamanho, tamanho);
}

// =============================================
// LUA CRESCENTE — desenhada pixel a pixel num offscreen canvas
// =============================================
const luaCanvas = document.createElement("canvas");
luaCanvas.width = 100;
luaCanvas.height = 100;
const luaCtx = luaCanvas.getContext("2d");
luaCtx.imageSmoothingEnabled = false;

function gerarLua() {
    luaCtx.clearRect(0, 0, 100, 100);
    const cx = 50, cy = 50, r = 38;
    for (let y = 0; y < 100; y++) {
        for (let x = 0; x < 100; x++) {
            const dx = x - cx, dy = y - cy;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist <= r) {
                const dx2 = x - (cx + 20), dy2 = y - (cy - 3);
                const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
                if (dist2 > r * 0.87) {
                    if (dist > r - 2) {
                        luaCtx.fillStyle = "#8aaee0";
                    } else if (dist < r * 0.4 && dx < -5) {
                        luaCtx.fillStyle = "#eef4ff";
                    } else {
                        let tom = Math.floor(200 + (r - dist) * 1.2);
                        tom = Math.min(tom, 230);
                        luaCtx.fillStyle = `rgb(${tom}, ${tom + 10}, 255)`;
                    }
                    luaCtx.fillRect(x, y, 1, 1);
                }
            }
        }
    }

    const crateras = [
        { x: 38, y: 44, r: 3 },
        { x: 28, y: 56, r: 2 },
        { x: 44, y: 62, r: 2 },
        { x: 33, y: 36, r: 2 },
    ];
    crateras.forEach(c => {
        for (let y = c.y - c.r; y <= c.y + c.r; y++) {
            for (let x = c.x - c.r; x <= c.x + c.r; x++) {
                const dx = x - c.x, dy = y - c.y;
                if (dx * dx + dy * dy <= c.r * c.r) {
                    const dlx = x - 50, dly = y - 50;
                    const dlx2 = x - 70, dly2 = y - 47;
                    if (Math.sqrt(dlx*dlx+dly*dly) <= 38 && Math.sqrt(dlx2*dlx2+dly2*dly2) > 33) {
                        luaCtx.fillStyle = "rgba(100, 130, 200, 0.5)";
                        luaCtx.fillRect(x, y, 1, 1);
                    }
                }
            }
        }
    });
}
gerarLua();

// =============================================
// CENÁRIO PRINCIPAL
// =============================================
function desenharCenario() {
    const tempoAgora = Date.now() * 0.001;

    // Céu, nebulosas, estrelas, lua, prédios...
    // (continua nas próximas linhas)
    // =============================================
    // PRÉDIOS TRASEIROS — silhueta pura
    // =============================================
    {
        const vel = 0.02, altBase = 200, larg = 112, espaco = 140;
        let scrollX = (camera.x * vel) % espaco;
        for (let i = -1; i < (canvas.width / espaco) + 2; i++) {
            let xPos = Math.floor((i * espaco) - scrollX);
            let id = Math.floor((camera.x * vel) / espaco) + i;
            let hBase = altBase + Math.floor(Math.abs(Math.sin(id * 1.3)) * 64 / 8) * 8;
            let topoY = Math.floor(chaoY - hBase - camera.y);

            ctx.fillStyle = "#07000f";
            ctx.fillRect(xPos, topoY, larg, hBase + 1);
            ctx.fillStyle = "#09001a";
            ctx.fillRect(xPos - 1, topoY, larg + 2, 2);
        }
    }

    // =============================================
    // CHÃO
    // =============================================
    ctx.fillStyle = "#111";
    ctx.fillRect(0, chaoY - camera.y, canvas.width, canvas.height - chaoY);

    // =============================================
    // CHUVA
    // =============================================
    chuva.forEach(p => {
        p.y += p.velocidade;
        if (p.y > canvas.height) {
            p.y = -10;
            p.x = Math.random() * canvas.width;
        }
        ctx.fillStyle = `rgba(180,180,255,${p.opacidade})`;
        ctx.fillRect(p.x, p.y, 1, p.tamanho);
        if (p.y + p.tamanho >= chaoY - camera.y) {
            criarRespingo(p.x, chaoY - camera.y, p.fatorParallax);
        }
    });

    for (let i = respingos.length - 1; i >= 0; i--) {
        let r = respingos[i];
        r.x += r.velX;
        r.y += r.velY;
        r.velY += 0.2;
        r.vida--;
        ctx.fillStyle = "rgba(200,200,255,0.5)";
        ctx.fillRect(r.x, r.y, 1, 1);
        if (r.vida <= 0) respingos.splice(i, 1);
    }
}

// =============================================
// ATUALIZAÇÃO DO JOGO
// =============================================
function atualizar() {
    if (estadoAtual === "JOGANDO") {
        if (teclas["KeyD"]) {
            player.x += player.velocidade;
            player.direcao = "direita";
            player.estaAndando = true;
        } else if (teclas["KeyA"]) {
            player.x -= player.velocidade;
            player.direcao = "esquerda";
            player.estaAndando = true;
        } else {
            player.estaAndando = false;
        }

        if (teclas["Space"] && player.noChao) {
            player.velY = player.pulo;
            player.noChao = false;
        }

        player.y += player.velY;
        player.velY += player.gravidade;
        if (player.y + player.alturaHitbox >= chaoY) {
            player.y = chaoY - player.alturaHitbox;
            player.velY = 0;
            player.noChao = true;
        }

        camera.x = player.x - canvas.width / 2 + player.larguraVisual;
    }
}

// =============================================
// DESENHO DO JOGO
// =============================================
function desenhar() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    desenharCenario();

    // Player
    if (player.estaAndando) {
        ctx.drawImage(imgPlayerCorrendo,
            player.frameAtual * player.spriteLargura, 0,
            player.spriteLargura, player.spriteAltura,
            player.x - camera.x, player.y - camera.y,
            player.larguraVisual, player.alturaVisual
        );
    } else {
        ctx.drawImage(imgPlayerParado,
            0, 0,
            player.spriteLargura, player.spriteAltura,
            player.x - camera.x, player.y - camera.y,
            player.larguraVisual, player.alturaVisual
        );
    }

    // NPC
    ctx.drawImage(imgNpcEspirito,
        npc.x - camera.x, npc.y - camera.y,
        npc.largura, npc.altura
    );

    // Raposa (frames)
    let frameFox = Math.floor(Date.now() / 150) % imgFoxFrames.length;
    ctx.drawImage(imgFoxFrames[frameFox],
        npc2.x - camera.x, npc2.y - camera.y,
        npc2.largura, npc2.altura
    );

    // Caixa de diálogo
    if (estadoAtual === "DIALOGO_INICIAL") {
        ctx.fillStyle = "rgba(0,0,0,0.7)";
        ctx.fillRect(caixaDialogo.x, caixaDialogo.y, caixaDialogo.largura, caixaDialogo.altura);
        ctx.fillStyle = "#fff";
        ctx.font = "16px Courier New";
        ctx.fillText(dialogoInicial.texto[dialogoInicial.indiceAtual], caixaDialogo.x + 20, caixaDialogo.y + 50);
    }

    if (estadoAtual === "DIALOGO_NPC") {
        ctx.fillStyle = "rgba(0,0,0,0.7)";
        ctx.fillRect(caixaDialogo.x, caixaDialogo.y, caixaDialogo.largura, caixaDialogo.altura);
        ctx.fillStyle = "#fff";
        ctx.font = "16px Courier New";
        ctx.fillText(npc.dialogo[npc.indiceAtual], caixaDialogo.x + 20, caixaDialogo.y + 50);
    }

    if (estadoAtual === "CENA_450") {
        ctx.fillStyle = "rgba(0,0,0,0.7)";
        ctx.fillRect(caixaDialogo.x, caixaDialogo.y, caixaDialogo.largura, caixaDialogo.altura);
        ctx.fillStyle = "#fff";
        ctx.font = "16px Courier New";
        ctx.fillText(cena450.texto[cena450.indiceAtual], caixaDialogo.x + 20, caixaDialogo.y + 50);
    }
}

// =============================================
// LOOP PRINCIPAL
// =============================================
function loop() {
    atualizar();
    desenhar();
    requestAnimationFrame(loop);
}
loop();
