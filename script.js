const canvas = document.getElementById("jogoCanvas");
const ctx = canvas.getContext("2d");
const btnStart = document.getElementById("btnStart");

canvas.width = 800;
canvas.height = 400;

// Máquina de Estados do Jogo
let estadoAtual = "TELA_INICIAL"; // Estados: "TELA_INICIAL", "DIALOGO", "JOGANDO"

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

const chaoY = 350;
const teclas = {};

// Configurações do Diálogo
const dialogo = {
    texto: [
        "Desperte...",
        "Você está em um mundo estranho agora.",
        "Use A e D para andar, e W para pular."
    ],
    indiceAtual: 0,
    caixa: {
        x: 50,
        y: 250,
        largura: 700,
        altura: 120,
        corFundo: "#000033", // Azul bem escuro
        corBorda: "#00001a"  // Mais escuro ainda
    }
};

// Captura as teclas
window.addEventListener("keydown", (e) => {
    teclas[e.code] = true;

    // Se estiver no diálogo e apertar Espaço/Enter, avança o texto
    if (estadoAtual === "DIALOGO" && (e.code === "Space" || e.code === "Enter")) {
        dialogo.indiceAtual++;
        if (dialogo.indiceAtual >= dialogo.texto.length) {
            estadoAtual = "JOGANDO"; // Se acabou o texto, vai pro jogo!
        }
    }
});

window.addEventListener("keyup", (e) => {
    teclas[e.code] = false;
});

// Evento do Botão Start
btnStart.addEventListener("click", () => {
    estadoAtual = "DIALOGO";
    btnStart.style.display = "none"; // Esconde o botão
});


function atualizar() {
    if (estadoAtual === "JOGANDO") {
        // Movimentação A e D
        if (teclas["KeyA"] && player.x > 0) {
            player.x -= player.velocidade;
            player.direcao = "esquerda";
        }
        if (teclas["KeyD"] && player.x < canvas.width - player.largura) {
            player.x += player.velocidade;
            player.direcao = "direita";
        }

        // Pulo com W ou Espaço
        if ((teclas["KeyW"] || teclas["Space"]) && player.noChao) {
            player.velY = player.pulo;
            player.noChao = false;
        }

        // Física
        player.velY += player.gravidade;
        player.y += player.velY;

        // Colisão Chão
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
        // Estética Undertale/OneShot: Letras pixeladas ou espaçadas
        ctx.fillStyle = "white";
        ctx.font = "40px 'Courier New', monospace";
        ctx.textAlign = "center";
        ctx.fillText("NOME DO SEU RPG", canvas.width / 2, 150);
    } 
    
    else if (estadoAtual === "DIALOGO") {
        // Desenha a Borda da Caixa
        ctx.fillStyle = dialogo.caixa.corBorda;
        ctx.fillRect(dialogo.caixa.x - 4, dialogo.caixa.y - 4, dialogo.caixa.largura + 8, dialogo.caixa.altura + 8);

        // Desenha o Fundo da Caixa (Azul escuro)
        ctx.fillStyle = dialogo.caixa.corFundo;
        ctx.fillRect(dialogo.caixa.x, dialogo.caixa.y, dialogo.caixa.largura, dialogo.caixa.altura);

        // Desenha o Texto
        ctx.fillStyle = "white";
        ctx.font = "20px 'Courier New', monospace";
        ctx.textAlign = "left";
        ctx.fillText(dialogo.texto[dialogo.indiceAtual], dialogo.caixa.x + 20, dialogo.caixa.y + 40);
        
        ctx.font = "14px 'Courier New', monospace";
        ctx.fillStyle = "#888";
        ctx.fillText("[Aperte Espaço ou Enter para continuar]", dialogo.caixa.x + 20, dialogo.caixa.y + 100);
    } 
    
    else if (estadoAtual === "JOGANDO") {
        ctx.textAlign = "left"; // Reseta o alinhamento do texto

        // Chão
        ctx.fillStyle = "#333";
        ctx.fillRect(0, chaoY, canvas.width, canvas.height - chaoY);

        // Player
        ctx.fillStyle = player.cor;
        ctx.fillRect(player.x, player.y, player.largura, player.altura);

        // Olhos (O Flip)
        ctx.fillStyle = "white";
        if (player.direcao === "direita") {
            ctx.fillRect(player.x + 25, player.y + 10, 8, 8);
        } else {
            ctx.fillRect(player.x + 7, player.y + 10, 8, 8);
        }
    }
}

// Inicia o loop
atualizar();