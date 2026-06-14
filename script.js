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
let musicaAtivada = true;

function embaralharPlaylist() {
    ordemMusicas = [...playlist];
    for (let i = ordemMusicas.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [ordemMusicas[i], ordemMusicas[j]] = [ordemMusicas[j], ordemMusicas[i]];
    }
}

function tocarProximaMusica() {
    if (estadoAtual !== "TELA_INICIAL" && estadoAtual !== "TELA_MENU") return;
    if (!musicaAtivada) return;
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

// --- SISTEMA DE SAVE ---
const MAX_SAVES = 3;

function salvarJogo(slot) {
    const agora = new Date();
    const dataStr = agora.toLocaleDateString("pt-BR") + " " + agora.toLocaleTimeString("pt-BR");
    const saveData = {
        nickname: nickname,
        playerX: player.x,
        playerY: player.y,
        tempoJogo: tempoJogo,
        npcJaConversou: npc.jaConversou,
        cena450Concluida: cena450.concluida,
        npc2Estado: npc2.estado,
        data: dataStr
    };
    localStorage.setItem(`cidadeInfinita_save_${slot}`, JSON.stringify(saveData));
}

function carregarJogo(slot) {
    const raw = localStorage.getItem(`cidadeInfinita_save_${slot}`);
    if (!raw) return false;
    const save = JSON.parse(raw);
    nickname = save.nickname || "???";
    player.x = save.playerX || 0;
    player.y = save.playerY || 100;
    tempoJogo = save.tempoJogo || 0;
    npc.jaConversou = save.npcJaConversou || false;
    if (npc.jaConversou) npc.x = -9999;
    cena450.concluida = save.cena450Concluida || false;
    npc2.estado = save.npc2Estado || "OLHANDO_DIREITA";
    return true;
}

function listarSaves() {
    const saves = [];
    for (let i = 0; i < MAX_SAVES; i++) {
        const raw = localStorage.getItem(`cidadeInfinita_save_${i}`);
        saves.push(raw ? JSON.parse(raw) : null);
    }
    return saves;
}

function deletarSave(slot) {
    localStorage.removeItem(`cidadeInfinita_save_${slot}`);
}

// --- MENU ---
let nickname = "";
let nicknameCursor = true;
let nicknameCursorTimer = 0;
let menuOpcaoSelecionada = 0;
let subEstado = "NICKNAME"; // NICKNAME, OPCOES, SETTINGS, VIEW_SAVES, SAVE_SLOT
const menuOpcoes = ["START NEW GAME", "LOAD GAME", "VIEW SAVES", "SETTINGS", "SAIR"];

let settingsOpcaoSelecionada = 0;
const settingsOpcoes = ["MÚSICA", "HITBOX", "COORDENADAS", "VOLTAR"];
let mostrarHitbox = false;
let mostrarCoordenadas = true;

let viewSavesOpcao = 0;
let saveSlotOpcao = 0;
let saveSlotModo = "LOAD"; // LOAD ou SAVE

let tempoJogo = 0;
let tempoJogoTimer = 0;

// --- SPRITES ---
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

// --- PLAYER ---
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

// --- CENA CINEMATOGRÁFICA ---
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
const teclasPressionadas = {};

// --- CHUVA ---
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
    if (teclasPressionadas[e.code]) return;
    teclasPressionadas[e.code] = true;
    teclas[e.code] = true;

    // --- TELA_MENU ---
    if (estadoAtual === "TELA_MENU") {

        // NICKNAME
        if (subEstado === "NICKNAME") {
            if (e.code === "Backspace") {
                nickname = nickname.slice(0, -1);
            } else if ((e.code === "Enter" || e.code === "Space") && nickname.trim().length > 0) {
                subEstado = "OPCOES";
                menuOpcaoSelecionada = 0;
            } else if (e.key.length === 1 && nickname.length < 16) {
                nickname += e.key;
            }
            return;
        }

        // OPCOES
        if (subEstado === "OPCOES") {
            if (e.code === "ArrowUp") menuOpcaoSelecionada = (menuOpcaoSelecionada - 1 + menuOpcoes.length) % menuOpcoes.length;
            if (e.code === "ArrowDown") menuOpcaoSelecionada = (menuOpcaoSelecionada + 1) % menuOpcoes.length;
            if (e.code === "Enter" || e.code === "Space") {
                if (menuOpcaoSelecionada === 0) { // START NEW GAME
                    pararMusica();
                    player.x = 0; player.y = 100;
                    tempoJogo = 0;
                    npc.jaConversou = false; npc.x = 2500;
                    cena450.concluida = false; cena450.ativa = false;
                    npc2.estado = "OLHANDO_DIREITA";
                    estadoAtual = "DIALOGO_INICIAL";
                    dialogoInicial.indiceAtual = 0;
                }
                if (menuOpcaoSelecionada === 1) { // LOAD GAME
                    saveSlotModo = "LOAD";
                    saveSlotOpcao = 0;
                    subEstado = "SAVE_SLOT";
                }
                if (menuOpcaoSelecionada === 2) { // VIEW SAVES
                    viewSavesOpcao = 0;
                    subEstado = "VIEW_SAVES";
                }
                if (menuOpcaoSelecionada === 3) { // SETTINGS
                    settingsOpcaoSelecionada = 0;
                    subEstado = "SETTINGS";
                }
                if (menuOpcaoSelecionada === 4) { // SAIR
                    ctx.fillStyle = "#000";
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.fillStyle = "#fff";
                    ctx.font = "20px 'Courier New'";
                    ctx.textAlign = "center";
                    ctx.fillText("até logo...", canvas.width / 2, canvas.height / 2);
                    pararMusica();
                }
            }
            return;
        }

        // SETTINGS
        if (subEstado === "SETTINGS") {
            if (e.code === "ArrowUp") settingsOpcaoSelecionada = (settingsOpcaoSelecionada - 1 + settingsOpcoes.length) % settingsOpcoes.length;
            if (e.code === "ArrowDown") settingsOpcaoSelecionada = (settingsOpcaoSelecionada + 1) % settingsOpcoes.length;
            if (e.code === "Enter" || e.code === "Space" || e.code === "ArrowLeft" || e.code === "ArrowRight") {
                if (settingsOpcaoSelecionada === 0) {
                    musicaAtivada = !musicaAtivada;
                    if (musicaAtivada) tocarProximaMusica();
                    else pararMusica();
                }
                if (settingsOpcaoSelecionada === 1) mostrarHitbox = !mostrarHitbox;
                if (settingsOpcaoSelecionada === 2) mostrarCoordenadas = !mostrarCoordenadas;
                if (settingsOpcaoSelecionada === 3) subEstado = "OPCOES";
            }
            if (e.code === "Escape") subEstado = "OPCOES";
            return;
        }

        // VIEW SAVES
        if (subEstado === "VIEW_SAVES") {
            const saves = listarSaves();
            if (e.code === "ArrowUp") viewSavesOpcao = (viewSavesOpcao - 1 + MAX_SAVES) % MAX_SAVES;
            if (e.code === "ArrowDown") viewSavesOpcao = (viewSavesOpcao + 1) % MAX_SAVES;
            if (e.code === "Delete" || e.code === "KeyX") {
                if (saves[viewSavesOpcao]) deletarSave(viewSavesOpcao);
            }
            if (e.code === "Escape") subEstado = "OPCOES";
            return;
        }

        // SAVE SLOT (escolher slot para load ou save)
        if (subEstado === "SAVE_SLOT") {
            if (e.code === "ArrowUp") saveSlotOpcao = (saveSlotOpcao - 1 + MAX_SAVES) % MAX_SAVES;
            if (e.code === "ArrowDown") saveSlotOpcao = (saveSlotOpcao + 1) % MAX_SAVES;
            if (e.code === "Enter" || e.code === "Space") {
                if (saveSlotModo === "LOAD") {
                    const ok = carregarJogo(saveSlotOpcao);
                    if (ok) {
                        pararMusica();
                        estadoAtual = "JOGANDO";
                    }
                } else if (saveSlotModo === "SAVE") {
                    salvarJogo(saveSlotOpcao);
                    subEstado = "OPCOES";
                    estadoAtual = "JOGANDO";
                }
            }
            if (e.code === "Escape") subEstado = "OPCOES";
            return;
        }
    }

    // --- JOGO ---
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

    // Abrir menu de save com ESC durante o jogo
    if ((estadoAtual === "JOGANDO") && e.code === "Escape") {
        saveSlotModo = "SAVE";
        saveSlotOpcao = 0;
        subEstado = "SAVE_SLOT";
        estadoAtual = "TELA_MENU";
    }
});

window.addEventListener("keyup", (e) => {
    teclas[e.code] = false;
    teclasPressionadas[e.code] = false;
});

btnStart.addEventListener("click", () => {
    tocarProximaMusica();
    btnStart.style.display = "none";
    estadoAtual = "TELA_MENU";
    subEstado = "NICKNAME";
    nickname = "";
});

// --- LUA OFFSCREEN ---
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
        { x: 38, y: 44, r: 3 }, { x: 28, y: 56, r: 2 },
        { x: 44, y: 62, r: 2 }, { x: 33, y: 36, r: 2 },
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

// --- CENÁRIO ---
function desenharCenario() {
    const tempoAgora = Date.now() * 0.001;

    const coresCeu = [
        "#03000c","#04000f","#050011","#060014",
        "#070016","#080018","#07001a","#06001c"
    ];
    const alturaFaixa = Math.floor(chaoY / coresCeu.length);
    coresCeu.forEach((cor, i) => {
        ctx.fillStyle = cor;
        ctx.fillRect(0, i * alturaFaixa, canvas.width, alturaFaixa + 1);
    });

    for (let y = 0; y < 160; y += 2) {
        for (let x = 0; x < canvas.width; x += 2) {
            let nx = x + camera.x * 0.003;
            let distNeb = Math.sqrt(Math.pow(nx - 180, 2) + Math.pow(y - 70, 2));
            if (distNeb < 130) {
                let alpha = (1 - distNeb / 130) * 0.13;
                if (alpha > 0.02) {
                    ctx.fillStyle = `rgba(90, 0, 140, ${alpha.toFixed(2)})`;
                    ctx.fillRect(x, y, 2, 2);
                }
            }
            let nx2 = x + camera.x * 0.004;
            let distNeb2 = Math.sqrt(Math.pow(nx2 - 580, 2) + Math.pow(y - 50, 2));
            if (distNeb2 < 110) {
                let alpha2 = (1 - distNeb2 / 110) * 0.15;
                if (alpha2 > 0.02) {
                    ctx.fillStyle = `rgba(0, 50, 160, ${alpha2.toFixed(2)})`;
                    ctx.fillRect(x, y, 2, 2);
                }
            }
        }
    }

    const estrelasDist = [
        {x:15,y:12},{x:47,y:8},{x:93,y:22},{x:134,y:5},{x:178,y:18},
        {x:221,y:10},{x:265,y:28},{x:312,y:7},{x:358,y:15},{x:401,y:3},
        {x:444,y:25},{x:488,y:11},{x:531,y:20},{x:577,y:6},{x:620,y:17},
        {x:663,y:30},{x:701,y:9},{x:741,y:22},{x:777,y:4},{x:55,y:35},
        {x:110,y:42},{x:190,y:38},{x:280,y:44},{x:370,y:33},{x:460,y:40},
        {x:550,y:36},{x:640,y:43},{x:730,y:31},{x:25,y:50},{x:330,y:55},
        {x:75,y:65},{x:160,y:70},{x:250,y:58},{x:410,y:68},{x:500,y:72},
        {x:590,y:60},{x:680,y:75},{x:760,y:63},{x:350,y:78},{x:450,y:82},
    ];
    estrelasDist.forEach((s, i) => {
        let sx = (s.x - camera.x * 0.005) % canvas.width;
        if (sx < 0) sx += canvas.width;
        let brilho = 0.3 + 0.3 * Math.abs(Math.sin(tempoAgora * 0.4 + i * 1.7));
        ctx.fillStyle = `rgba(190, 210, 255, ${brilho.toFixed(2)})`;
        ctx.fillRect(Math.floor(sx), s.y, 1, 1);
    });

    const estrelasMed = [
        {x:30,y:20},{x:80,y:14},{x:150,y:30},{x:230,y:8},{x:310,y:25},
        {x:390,y:12},{x:470,y:35},{x:560,y:18},{x:650,y:28},{x:745,y:10},
        {x:60,y:45},{x:200,y:50},{x:340,y:42},{x:480,y:48},{x:600,y:38},
        {x:720,y:55},{x:120,y:60},{x:260,y:65},{x:420,y:58},{x:580,y:62},
        {x:100,y:75},{x:300,y:80},{x:500,y:85},{x:700,y:70},{x:170,y:88},
    ];
    estrelasMed.forEach((s, i) => {
        let sx = (s.x - camera.x * 0.009) % canvas.width;
        if (sx < 0) sx += canvas.width;
        let brilho = 0.45 + 0.45 * Math.abs(Math.sin(tempoAgora * 0.6 + i * 2.3));
        let cor = i % 3 === 0
            ? `rgba(150, 180, 255, ${brilho.toFixed(2)})`
            : `rgba(215, 228, 255, ${brilho.toFixed(2)})`;
        ctx.fillStyle = cor;
        ctx.fillRect(Math.floor(sx), s.y, 1, 1);
        if (i % 4 === 0 && brilho > 0.7) {
            ctx.fillStyle = `rgba(200, 220, 255, ${(brilho * 0.35).toFixed(2)})`;
            ctx.fillRect(Math.floor(sx) - 1, s.y, 1, 1);
            ctx.fillRect(Math.floor(sx) + 1, s.y, 1, 1);
            ctx.fillRect(Math.floor(sx), s.y - 1, 1, 1);
            ctx.fillRect(Math.floor(sx), s.y + 1, 1, 1);
        }
    });

    const estrelasGrandes = [
        {x:100,y:18},{x:300,y:10},{x:520,y:22},{x:700,y:8},
        {x:420,y:45},{x:180,y:35},{x:600,y:40},
    ];
    estrelasGrandes.forEach((s, i) => {
        let sx = (s.x - camera.x * 0.011) % canvas.width;
        if (sx < 0) sx += canvas.width;
        let brilho = 0.55 + 0.45 * Math.abs(Math.sin(tempoAgora * 0.8 + i * 3.1));
        ctx.fillStyle = `rgba(235, 245, 255, ${brilho.toFixed(2)})`;
        ctx.fillRect(Math.floor(sx), s.y, 2, 2);
        ctx.fillStyle = `rgba(170, 205, 255, ${(brilho * 0.45).toFixed(2)})`;
        ctx.fillRect(Math.floor(sx) - 1, s.y,     1, 2);
        ctx.fillRect(Math.floor(sx) + 2, s.y,     1, 2);
        ctx.fillRect(Math.floor(sx),     s.y - 1, 2, 1);
        ctx.fillRect(Math.floor(sx),     s.y + 2, 2, 1);
        if (brilho > 0.85) {
            ctx.fillStyle = `rgba(140, 180, 255, ${(brilho * 0.2).toFixed(2)})`;
            ctx.fillRect(Math.floor(sx) - 2, s.y,     1, 2);
            ctx.fillRect(Math.floor(sx) + 3, s.y,     1, 2);
            ctx.fillRect(Math.floor(sx),     s.y - 2, 2, 1);
            ctx.fillRect(Math.floor(sx),     s.y + 3, 2, 1);
        }
    });

    for (let i = 0; i < 50; i++) {
        let sx = ((i * 197 + 43) - camera.x * 0.006) % canvas.width;
        if (sx < 0) sx += canvas.width;
        let sy = (i * 83 + 17) % 130;
        let b = 0.08 + 0.1 * Math.abs(Math.sin(i * 4.7));
        ctx.fillStyle = `rgba(80, 120, 255, ${b.toFixed(2)})`;
        ctx.fillRect(Math.floor(sx), sy, 1, 1);
    }

    const luaX = Math.floor(canvas.width - 140 - (camera.x * 0.003) % 6);
    const luaY = 28;
    for (let y = luaY - 30; y <= luaY + 90; y += 2) {
        for (let x = luaX - 30; x <= luaX + 110; x += 2) {
            let dx = x - (luaX + 50), dy = y - (luaY + 50);
            let dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 80 && dist > 42) {
                let alpha = (1 - (dist - 42) / 38) * 0.055;
                if (alpha > 0.005) {
                    ctx.fillStyle = `rgba(160, 200, 255, ${alpha.toFixed(3)})`;
                    ctx.fillRect(x, y, 2, 2);
                }
            }
        }
    }
    ctx.drawImage(luaCanvas, luaX, luaY, 100, 100);

    const chaoTela = chaoY - camera.y;
    for (let y = chaoTela - 80; y < chaoTela; y += 2) {
        let progresso = (y - (chaoTela - 80)) / 80;
        let alpha = progresso * progresso * 0.18;
        ctx.fillStyle = `rgba(100, 0, 160, ${alpha.toFixed(3)})`;
        ctx.fillRect(0, Math.floor(y), canvas.width, 2);
    }

    // Prédios traseiros
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
            for (let wy = 0; wy < Math.floor(hBase / 20) - 1; wy++) {
                for (let wx = 0; wx < Math.floor(larg / 18) - 1; wx++) {
                    let s = Math.abs(Math.sin(id * 5 + wy * 11 + wx * 7));
                    if (s > 0.72) {
                        ctx.fillStyle = "rgba(80, 60, 120, 0.35)";
                        ctx.fillRect(xPos + 10 + wx * 18, topoY + 16 + wy * 20, 2, 3);
                    }
                }
            }
        }
    }

    // Prédios do meio
    {
        const vel = 0.06, altBase = 140, larg = 86, espaco = 110;
        let scrollX = (camera.x * vel) % espaco;
        for (let i = -1; i < (canvas.width / espaco) + 2; i++) {
            let xPos = Math.floor((i * espaco) - scrollX);
            let id = Math.floor((camera.x * vel) / espaco) + i;
            let hBase = altBase + Math.floor(Math.abs(Math.sin(id * 1.7 + 1)) * 64 / 8) * 8;
            let topoY = Math.floor(chaoY - hBase - camera.y);
            ctx.fillStyle = "#0f001e";
            ctx.fillRect(xPos, topoY, larg, hBase + 1);
            ctx.fillStyle = "#1a0030";
            ctx.fillRect(xPos - 1, topoY - 2, larg + 2, 3);
            ctx.fillStyle = "#140026";
            ctx.fillRect(xPos, topoY - 4, larg, 2);
            if (Math.abs(Math.sin(id * 5.1 + 2)) > 0.76) {
                let antX = Math.floor(xPos + larg / 2);
                for (let ay = topoY - 18; ay < topoY - 2; ay += 2) {
                    ctx.fillStyle = "rgba(150, 140, 170, 0.45)";
                    ctx.fillRect(antX, ay, 1, 1);
                }
                let pisca = Math.sin(tempoAgora * 2.2 + id) > 0.15;
                if (pisca) {
                    ctx.fillStyle = "#ff4040";
                    ctx.fillRect(antX, topoY - 19, 1, 1);
                }
            }
            for (let wy = 0; wy < Math.floor(hBase / 20) - 1; wy++) {
                for (let wx = 0; wx < Math.floor(larg / 16) - 1; wx++) {
                    let s = Math.abs(Math.sin(id * 7 + wy * 13 + wx * 31));
                    if (s > 0.40) {
                        if (s > 0.80) ctx.fillStyle = "#ffd84a";
                        else if (s > 0.62) ctx.fillStyle = "rgba(120, 190, 255, 0.6)";
                        else ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
                        ctx.fillRect(xPos + 8 + wx * 16, topoY + 16 + wy * 20, 2, 3);
                    }
                }
            }
            let intensidade = 0.5 + 0.5 * Math.abs(Math.sin(id * 3.3));
            if (intensidade > 0.55) {
                for (let ly = chaoTela - 48; ly < chaoTela; ly += 2) {
                    let progresso = (ly - (chaoTela - 48)) / 48;
                    let alpha = progresso * progresso * (0.10 + intensidade * 0.07);
                    ctx.fillStyle = `rgba(220, 55, 170, ${alpha.toFixed(3)})`;
                    ctx.fillRect(xPos - 4, Math.floor(ly), larg + 8, 2);
                }
                ctx.fillStyle = `rgba(230, 70, 180, ${(0.06 + intensidade * 0.05).toFixed(3)})`;
                ctx.fillRect(xPos, Math.floor(chaoTela) - 6, larg, 3);
            }
        }
    }

    // Prédios da frente
    {
        const vel = 0.15, altBase = 90, larg = 66, espaco = 96;
        let scrollX = (camera.x * vel) % espaco;
        for (let i = -1; i < (canvas.width / espaco) + 2; i++) {
            let xPos = Math.floor((i * espaco) - scrollX);
            let id = Math.floor((camera.x * vel) / espaco) + i;
            let hBase = altBase + Math.floor(Math.abs(Math.sin(id * 2.1 + 0.5)) * 56 / 8) * 8;
            let topoY = Math.floor(chaoY - hBase - camera.y);
            ctx.fillStyle = "#160030";
            ctx.fillRect(xPos, topoY, larg, hBase + 1);
            ctx.fillStyle = "rgba(255,255,255,0.03)";
            ctx.fillRect(xPos, topoY, 1, hBase);
            ctx.fillStyle = "rgba(0,0,0,0.2)";
            ctx.fillRect(xPos + larg - 1, topoY, 1, hBase);
            ctx.fillStyle = "#220040";
            ctx.fillRect(xPos - 1, topoY - 1, larg + 2, 1);
            ctx.fillStyle = "#1c0036";
            ctx.fillRect(xPos, topoY - 2, larg, 1);
            for (let wy = 0; wy < Math.floor(hBase / 18) - 1; wy++) {
                for (let wx = 0; wx < Math.floor(larg / 14) - 1; wx++) {
                    let s = Math.abs(Math.sin(id * 11 + wy * 17 + wx * 23));
                    if (s > 0.50) {
                        ctx.fillStyle = s > 0.78 ? "rgba(255, 205, 60, 0.7)" : "rgba(0, 0, 0, 0.5)";
                        ctx.fillRect(xPos + 7 + wx * 14, topoY + 12 + wy * 18, 2, 3);
                    }
                }
            }
        }
    }

    // Chão pixelado
    const chaoPixY = Math.floor(chaoY - camera.y);
    ctx.fillStyle = "#ff00ff";
    ctx.fillRect(0, chaoPixY, canvas.width, 2);
    const coresCalcada = ["#0d0020","#0a001a","#0c001e","#08001a"];
    for (let i = 0; i < 8; i++) {
        ctx.fillStyle = coresCalcada[i % coresCalcada.length];
        ctx.fillRect(0, chaoPixY + 2 + i * 4, canvas.width, 4);
    }
    const pocas = [
        { x: 80, largura: 40 }, { x: 200, largura: 25 },
        { x: 350, largura: 55 }, { x: 500, largura: 30 },
        { x: 650, largura: 45 }, { x: 750, largura: 20 },
    ];
    pocas.forEach(p => {
        let px2 = (p.x - camera.x * 0.15) % canvas.width;
        if (px2 < 0) px2 += canvas.width;
        ctx.fillStyle = "rgba(20, 0, 40, 0.8)";
        ctx.fillRect(Math.floor(px2), chaoPixY + 4, p.largura, 2);
        ctx.fillStyle = "rgba(200, 60, 160, 0.25)";
        ctx.fillRect(Math.floor(px2) + 2, chaoPixY + 4, p.largura - 4, 1);
        ctx.fillStyle = "rgba(200, 200, 255, 0.15)";
        ctx.fillRect(Math.floor(px2), chaoPixY + 3, p.largura, 1);
    });
}

// --- TELA DO MENU ---
function desenharMenu() {
    // Fundo com o cenário atrás
    desenharCenario();

    // Overlay escuro semitransparente
    ctx.fillStyle = "rgba(0, 0, 10, 0.72)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const cx = canvas.width / 2;

    // Título
    ctx.fillStyle = "#00ffcc";
    ctx.font = "bold 32px 'Courier New', monospace";
    ctx.textAlign = "center";
    ctx.fillText("CIDADE INFINITA", cx, 55);

    // Linha decorativa
    ctx.fillStyle = "#ff00ff";
    ctx.fillRect(cx - 180, 65, 360, 2);

    if (subEstado === "NICKNAME") {
        ctx.fillStyle = "rgba(255,255,255,0.7)";
        ctx.font = "14px 'Courier New', monospace";
        ctx.fillText("digite seu nickname para continuar", cx, 110);

        // Caixa do nickname
        const bx = cx - 150, by = 125, bw = 300, bh = 36;
        ctx.fillStyle = "rgba(0,0,20,0.9)";
        ctx.fillRect(bx, by, bw, bh);
        ctx.strokeStyle = "#00ffcc";
        ctx.lineWidth = 2;
        ctx.strokeRect(bx, by, bw, bh);

        // Cursor piscando
        nicknameCursorTimer++;
        if (nicknameCursorTimer > 30) { nicknameCursor = !nicknameCursor; nicknameCursorTimer = 0; }
        const textoNick = nickname + (nicknameCursor ? "|" : " ");
        ctx.fillStyle = "#ffffff";
        ctx.font = "18px 'Courier New', monospace";
        ctx.textAlign = "left";
        ctx.fillText(textoNick, bx + 10, by + 24);
        ctx.textAlign = "center";

        ctx.fillStyle = "rgba(0,255,204,0.5)";
        ctx.font = "12px 'Courier New', monospace";
        ctx.fillText("[ENTER] para confirmar", cx, 185);
    }

    if (subEstado === "OPCOES") {
        // Saudação
        ctx.fillStyle = "rgba(0,255,204,0.8)";
        ctx.font = "14px 'Courier New', monospace";
        ctx.fillText(`olá, ${nickname}`, cx, 105);

        // Opções
        menuOpcoes.forEach((op, i) => {
            const y = 145 + i * 36;
            const selecionado = i === menuOpcaoSelecionada;
            if (selecionado) {
                ctx.fillStyle = "rgba(255,0,255,0.15)";
                ctx.fillRect(cx - 160, y - 18, 320, 26);
                ctx.fillStyle = "#ff00ff";
                ctx.font = "bold 17px 'Courier New', monospace";
                ctx.fillText(`> ${op} <`, cx, y);
            } else {
                ctx.fillStyle = "rgba(255,255,255,0.55)";
                ctx.font = "15px 'Courier New', monospace";
                ctx.fillText(op, cx, y);
            }
        });

        ctx.fillStyle = "rgba(255,255,255,0.3)";
        ctx.font = "11px 'Courier New', monospace";
        ctx.fillText("[↑↓] navegar  [ENTER] confirmar", cx, 340);
    }

    if (subEstado === "SETTINGS") {
        ctx.fillStyle = "#00ffcc";
        ctx.font = "bold 18px 'Courier New', monospace";
        ctx.fillText("— SETTINGS —", cx, 110);

        const itens = [
            `MÚSICA: ${musicaAtivada ? "ON" : "OFF"}`,
            `HITBOX: ${mostrarHitbox ? "ON" : "OFF"}`,
            `COORDENADAS: ${mostrarCoordenadas ? "ON" : "OFF"}`,
            "VOLTAR"
        ];

        itens.forEach((op, i) => {
            const y = 150 + i * 40;
            const sel = i === settingsOpcaoSelecionada;
            if (sel) {
                ctx.fillStyle = "rgba(255,0,255,0.15)";
                ctx.fillRect(cx - 180, y - 18, 360, 26);
                ctx.fillStyle = "#ff00ff";
                ctx.font = "bold 16px 'Courier New', monospace";
                ctx.fillText(`> ${op} <`, cx, y);
            } else {
                ctx.fillStyle = "rgba(255,255,255,0.55)";
                ctx.font = "14px 'Courier New', monospace";
                ctx.fillText(op, cx, y);
            }
        });

        ctx.fillStyle = "rgba(255,255,255,0.3)";
        ctx.font = "11px 'Courier New', monospace";
        ctx.fillText("[↑↓] navegar  [ENTER] alternar  [ESC] voltar", cx, 340);
    }

    if (subEstado === "VIEW_SAVES" || subEstado === "SAVE_SLOT") {
        const titulo = subEstado === "VIEW_SAVES" ? "— VIEW SAVES —" :
                       saveSlotModo === "LOAD" ? "— LOAD GAME —" : "— SAVE GAME —";
        ctx.fillStyle = "#00ffcc";
        ctx.font = "bold 18px 'Courier New', monospace";
        ctx.fillText(titulo, cx, 110);

        const saves = listarSaves();
        const opcaoAtual = subEstado === "VIEW_SAVES" ? viewSavesOpcao : saveSlotOpcao;

        saves.forEach((save, i) => {
            const y = 155 + i * 60;
            const sel = i === opcaoAtual;

            // Caixa do slot
            ctx.fillStyle = sel ? "rgba(255,0,255,0.12)" : "rgba(0,0,20,0.6)";
            ctx.fillRect(cx - 200, y - 22, 400, 50);
            ctx.strokeStyle = sel ? "#ff00ff" : "rgba(255,255,255,0.2)";
            ctx.lineWidth = sel ? 2 : 1;
            ctx.strokeRect(cx - 200, y - 22, 400, 50);

            if (save) {
                ctx.fillStyle = sel ? "#ff00ff" : "rgba(255,255,255,0.8)";
                ctx.font = `${sel ? "bold " : ""}14px 'Courier New', monospace`;
                ctx.fillText(`SLOT ${i + 1} — ${save.nickname}`, cx, y);
                ctx.fillStyle = "rgba(0,255,204,0.7)";
                ctx.font = "11px 'Courier New', monospace";
                const mins = Math.floor((save.tempoJogo || 0) / 3600);
                const segs = Math.floor(((save.tempoJogo || 0) % 3600) / 60);
                ctx.fillText(`${save.data}  |  tempo: ${mins}m ${segs}s`, cx, y + 18);
            } else {
                ctx.fillStyle = "rgba(255,255,255,0.3)";
                ctx.font = "13px 'Courier New', monospace";
                ctx.fillText(`SLOT ${i + 1} — vazio`, cx, y + 5);
            }
        });

        ctx.fillStyle = "rgba(255,255,255,0.3)";
        ctx.font = "11px 'Courier New', monospace";
        if (subEstado === "VIEW_SAVES") {
            ctx.fillText("[↑↓] navegar  [X/DEL] deletar save  [ESC] voltar", cx, 348);
        } else {
            ctx.fillText("[↑↓] navegar  [ENTER] confirmar  [ESC] voltar", cx, 348);
        }
    }
}

// --- CHUVA ---
function gerenciarChuva() {
    let hitboxRealX = player.x + player.offsetX - camera.x;
    let hitboxRealY = player.y + player.offsetY - camera.y;

    chuva.forEach(pingo => {
        let pingoTelaX = (pingo.x - (camera.x * pingo.fatorParallax)) % canvas.width;
        if (pingoTelaX < 0) pingoTelaX += canvas.width;
        ctx.strokeStyle = `rgba(174, 219, 255, ${pingo.opacidade})`;
        ctx.lineWidth = pingo.tamanho > 5 ? 1.5 : 1;
        ctx.beginPath();
        ctx.moveTo(Math.floor(pingoTelaX), Math.floor(pingo.y));
        ctx.lineTo(Math.floor(pingoTelaX) - Math.floor(pingo.fatorParallax * 2), Math.floor(pingo.y + pingo.tamanho));
        ctx.stroke();
        if (estadoAtual !== "TELA_INICIAL") {
            pingo.y += pingo.velocidade;
            pingo.x -= 0.5 * pingo.fatorParallax;
        }
        if ((estadoAtual === "JOGANDO" || estadoAtual === "ESPERA_POS_DIALOGO" || estadoAtual === "RAPOSA_VIRANDO") && pingo.fatorParallax > 0.6) {
            if (pingoTelaX > hitboxRealX && pingoTelaX < hitboxRealX + player.larguraHitbox &&
                pingo.y > hitboxRealY && pingo.y < hitboxRealY + player.alturaHitbox) {
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
        ctx.fillStyle = "rgba(174, 219, 255, 0.5)";
        ctx.fillRect(Math.floor(r.x), Math.floor(r.y), 1, 1);
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
    // Tempo de jogo (só conta quando jogando)
    if (estadoAtual === "JOGANDO") {
        tempoJogoTimer++;
        if (tempoJogoTimer >= 60) { tempoJogo++; tempoJogoTimer = 0; }
    }

    if (estadoAtual === "JOGANDO" || estadoAtual === "DIALOGO_NPC") {
        npc.tempoFlutuar += 0.05;
    }

    if (estadoAtual !== "TELA_INICIAL" && estadoAtual !== "TELA_MENU") {
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

// --- UI ---
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

// --- DESENHAR ---
function desenhar() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (estadoAtual === "TELA_INICIAL") {
        ctx.fillStyle = "#050010";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#00ffcc";
        ctx.font = "40px 'Courier New', monospace";
        ctx.textAlign = "center";
        ctx.fillText("CIDADE INFINITA", canvas.width / 2, 150);
        ctx.fillStyle = "rgba(255,255,255,0.4)";
        ctx.font = "14px 'Courier New', monospace";
        ctx.fillText("pressione START para continuar", canvas.width / 2, 210);
    } else if (estadoAtual === "TELA_MENU") {
        desenharMenu();
    } else {
        desenharCenario();

        ctx.fillStyle = "#0a0712";
        ctx.fillRect(0, chaoY - camera.y + 34, canvas.width, (canvas.height - chaoY) + camera.y);

        if (mostrarCoordenadas) {
            let displayX = Math.floor(player.x / 10);
            let displayY = Math.floor(chaoY - (player.y + player.offsetY + player.alturaHitbox));
            ctx.fillStyle = "rgba(0, 255, 204, 0.8)";
            ctx.font = "16px 'Courier New', monospace";
            ctx.textAlign = "left";
            ctx.fillText(`COORD X: ${displayX}  COORD Y: ${Math.max(0, displayY)}`, 20, 30);
        }

        // Nickname no canto
        ctx.fillStyle = "rgba(0,255,204,0.6)";
        ctx.font = "12px 'Courier New', monospace";
        ctx.textAlign = "right";
        const mins = Math.floor(tempoJogo / 60);
        const segs = tempoJogo % 60;
        ctx.fillText(`${nickname}  |  ${mins}m ${segs}s`, canvas.width - 10, 20);

        // NPC Espírito
        let npcRelativoX = npc.x - camera.x;
        if (npcRelativoX > -100 && npcRelativoX < canvas.width + 100) {
            let flutuarY = npc.y + Math.sin(npc.tempoFlutuar) * 8 - camera.y;
            if (imgNpcEspirito.complete && imgNpcEspirito.width > 0)
                ctx.drawImage(imgNpcEspirito, npcRelativoX, flutuarY, npc.largura, npc.altura);
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

        if (mostrarHitbox) {
            ctx.strokeStyle = "#00ff00";
            ctx.lineWidth = 1.5;
            ctx.strokeRect(playerRelativoX + player.offsetX, playerY + player.offsetY, player.larguraHitbox, player.alturaHitbox);
        }

        gerenciarChuva();

        if (estadoAtual === "DIALOGO_INICIAL") desenharCaixaTexto(dialogoInicial.texto[dialogoInicial.indiceAtual]);
        if (estadoAtual === "DIALOGO_NPC") desenharCaixaTexto(npc.dialogo[npc.indiceAtual]);

        desenharBarrasCinematicas();

        if (estadoAtual === "CENA_450" && cena450.timerEspera >= cena450.tempoParaDialogo)
            desenharCaixaPensamento(cena450.texto[cena450.indiceAtual]);

        // Dica ESC
        ctx.fillStyle = "rgba(255,255,255,0.2)";
        ctx.font = "11px 'Courier New', monospace";
        ctx.textAlign = "left";
        ctx.fillText("[ESC] menu / save", 10, canvas.height - 8);
    }
}

atualizar();