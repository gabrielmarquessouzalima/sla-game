const canvas = document.getElementById("jogoCanvas");
const ctx = canvas.getContext("2d");
const btnStart = document.getElementById("btnStart");

canvas.width = 800;
canvas.height = 400;

// --- CARREGAMENTO DO FUNDO ---
const fundoCidade = new Image();
// Usei uma imagem neon funcional. Se tiver o link direto (.jpg) da Magnific, é só trocar aqui:
fundoCidade.src = "https://img.freepik.com/free-vector/night-city-street-with-neon-lights-puddles_107791-3259.jpg";

let estadoAtual = "TELA_INICIAL";

const player = {
    x: 0,
    y: 0,
    largura: 40,
    altura: 40,
    cor: "#00f2ff", // Azul neon
    velocidade: 5,
    velY: 0,
    gravidade: 0.8,
    pulo: -15,
    noChao: false,
    direcao: "direita" 
};

// Variáveis de controle
let cameraX = 0;
const chaoY = 370; // Ajustado para beirar a estrada na parte de baixo
const teclas = {};

const dialogo = {
    texto: [
        "Luzes de neon... asfalto frio.",
        "Você acordou na fronteira da cidade.",
        "Use A e D para andar, e W para pular."
    ],
    indiceAtual: 0,
    caixa: {
        x: 50, y: 250, largura: 700, altura: 120,
        corFundo: "rgba(10, 10, 20, 0.9)",
        corBorda: "#00f2ff"
    }
};

// Eventos de teclado
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
        if (teclas["KeyA"] && player.x > 0) {
            player.x -= player.velocidade;
            player.direcao = "esquerda";
        }
        if (teclas["KeyD"]) {
            player.x += player.velocidade;
            player.direcao = "direita";
        }

        cameraX = Math.max(0, player.x - 150); 

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
        ctx.fillStyle = "#050510";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#00f2ff";
        ctx.font = "40px 'Courier New', monospace";
        ctx.textAlign = "center";
        ctx.fillText("NEON RUNNER", canvas.width / 2, 180);
    } 
    
    else if (estadoAtual === "DIALOGO" || estadoAtual === "JOGANDO") {
        
        let fatorParallax = 0.3; // Aumentei um pouco para dar mais sensação de movimento
        let larguraFundo = canvas.width * 1.5; // Ajuste para a escala da imagem
        let deslizeFundo = -(cameraX * fatorParallax) % larguraFundo;

        // Desenha o fundo (Cidade Neon)
        ctx.drawImage(fundoCidade, deslizeFundo, 0, larguraFundo, canvas.height);
        ctx.drawImage(fundoCidade, deslizeFundo + larguraFundo, 0, larguraFundo, canvas.height);
        ctx.drawImage(fundoCidade, deslizeFundo - larguraFundo, 0, larguraFundo, canvas.height);

        if (estadoAtual === "DIALOGO") {
            ctx.fillStyle = dialogo.caixa.corBorda;
            ctx.fillRect(dialogo.caixa.x - 2, dialogo.caixa.y - 2, dialogo.caixa.largura + 4, dialogo.caixa.altura + 4);
            ctx.fillStyle = dialogo.caixa.corFundo;
            ctx.fillRect(dialogo.caixa.x, dialogo.caixa.y, dialogo.caixa.largura, dialogo.caixa.altura);
            ctx.fillStyle = "white";
            ctx.font = "20px 'Courier New', monospace";
            ctx.textAlign = "left";
            ctx.fillText(dialogo.texto[dialogo.indiceAtual], dialogo.caixa.x + 20, dialogo.caixa.y + 40);
        }

        if (estadoAtual === "JOGANDO") {
            ctx.save();
            ctx.translate(-cameraX, 0);

            // Chão: Apenas uma linha neon discreta para não esconder a estrada da imagem
            ctx.shadowBlur = 10;
            ctx.shadowColor = "#00f2ff";
            ctx.fillStyle = "rgba(0, 242, 255, 0.3)";
            ctx.fillRect(cameraX, chaoY, canvas.width, 2);
            ctx.shadowBlur = 0;

            // Player com brilho neon
            ctx.shadowBlur = 15;
            ctx.shadowColor = player.cor;
            ctx.fillStyle = player.cor;
            ctx.fillRect(player.x, player.y, player.largura, player.altura);
            ctx.shadowBlur = 0;

            // Olhos
            ctx.fillStyle = "white";
            let olhoX = (player.direcao === "direita") ? player.x + 25 : player.x + 7;
            ctx.fillRect(olhoX, player.y + 10, 8, 8);

            ctx.restore();
        }
    }
}

atualizar();