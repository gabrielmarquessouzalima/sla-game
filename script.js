const canvas = document.getElementById("jogoCanvas");
const ctx = canvas.getContext("2d");
const btnStart = document.getElementById("btnStart");

canvas.width = 800;
canvas.height = 400;

let estadoAtual = "TELA_INICIAL"; 

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

// --- Configurações do Parallax (Corrigido para Loop Infinito) ---
const parallax = {
    camadas: [
        { x: 0, velocidade: 0.5, cor: "#050515", alturaBase: 180, larguraPredio: 100, espacamento: 120 },
        { x: 0, velocidade: 1.2, cor: "#0d0d25", alturaBase: 120, larguraPredio: 80,  espacamento: 100 },
        { x: 0, velocidade: 2.5, cor: "#161630", alturaBase: 80,  larguraPredio: 60,  espacamento: 90 }
    ]
};

const dialogo = {
    texto: [
        "Desperte...",
        "Você está em um mundo estranho agora.",
        "Use A e D para andar, e W para pular."
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

// --- Função de Cenário com Loop Infinito sem Saltos ---
function desenharCenario() {
    // Fundo do céu
    ctx.fillStyle = "#00000a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Estrelas fixas
    ctx.fillStyle = "white";
    for(let i = 0; i < 40; i++) {
        let x = (i * 137) % canvas.width;
        let y = (i * 243) % 200;
        ctx.fillRect(x, y, 1, 1);
    }

    parallax.camadas.forEach((camada, index) => {
        ctx.fillStyle = camada.cor;
        
        // O segredo do loop infinito: usar o resto da divisão pela distância total do padrão
        let padraoLargura = camada.espacamento * 10; // Definimos um bloco de 10 prédios como padrão
        let offsetX = camada.x % padraoLargura;

        // Desenhamos o padrão duas vezes (uma seguida da outra) para garantir que sempre haja preenchimento
        for (let j = -1; j < 2; j++) { 
            for (let i = 0; i < 10; i++) {
                let xPos = (j * padraoLargura) + (i * camada.espacamento) + offsetX;
                
                // Só desenha se estiver visível ou próximo da tela para performance
                if (xPos + camada.larguraPredio > 0 && xPos < canvas.width) {
                    let h = camada.alturaBase + (Math.abs(Math.sin(i + index)) * 50);
                    ctx.fillRect(xPos, chaoY - h, camada.larguraPredio, h);

                    // Detalhe de janelas na camada mais próxima
                    if (index === 2 && i % 2 === 0) {
                        ctx.fillStyle = "#f1c40f";
                        ctx.fillRect(xPos + 10, chaoY - h + 20, 4, 4);
                        ctx.fillRect(xPos + camada.larguraPredio - 15, chaoY - h + 40, 4, 4);
                        ctx.fillStyle = camada.cor;
                    }
                }
            }
        }
    });
}

function atualizar() {
    if (estadoAtual === "JOGANDO") {
        if (teclas["KeyA"] && player.x > 0) {
            player.x -= player.velocidade;
            player.direcao = "esquerda";
            // Move o cenário para a direita
            parallax.camadas.forEach(c => c.x += c.velocidade);
        }
        if (teclas["KeyD"] && player.x < canvas.width - player.largura) {
            player.x += player.velocidade;
            player.direcao = "direita";
            // Move o cenário para a esquerda
            parallax.camadas.forEach(c => c.x -= c.velocidade);
        }

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
        ctx.fillText("NOME DO SEU RPG", canvas.width / 2, 150);
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
        ctx.font = "14px 'Courier New', monospace";
        ctx.fillStyle = "#888";
        ctx.fillText("[Aperte Espaço ou Enter para continuar]", dialogo.caixa.x + 20, dialogo.caixa.y + 100);
    } 
    else if (estadoAtual === "JOGANDO") {
        desenharCenario();

        // Chão
        ctx.fillStyle = "#111";
        ctx.fillRect(0, chaoY, canvas.width, canvas.height - chaoY);

        // UI
        ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
        ctx.font = "16px 'Courier New', monospace";
        ctx.textAlign = "left";
        ctx.fillText(`X: ${Math.floor(player.x)}  Y: ${Math.floor(player.y)}`, 20, 30);

        // Player
        ctx.fillStyle = player.cor;
        ctx.fillRect(player.x, player.y, player.largura, player.altura);

        // Olhos
        ctx.fillStyle = "white";
        let olhoX = player.direcao === "direita" ? player.x + 25 : player.x + 7;
        ctx.fillRect(olhoX, player.y + 10, 8, 8);
    }
}

atualizar();