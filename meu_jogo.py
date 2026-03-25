import pygame
import sys

# Inicialização do Pygame
pygame.init()

# Configurações da tela
LARGURA = 800
ALTURA = 600
tela = pygame.display.set_mode((LARGURA, ALTURA))
pygame.display.set_caption("Protótipo Estilo RPG")

# Cores
BRANCO = (255, 255, 255)
AZUL = (100, 149, 237) # Cor do personagem
CHAO_COR = (50, 50, 50)

# Configurações do Personagem
largura_player = 40
altura_player = 60
x = LARGURA // 2
y = ALTURA - altura_player - 50
vel = 5

# Variáveis de Pulo
esta_pulando = False
contador_pulo = 10

# Loop principal do jogo
relogio = pygame.time.Clock()

while True:
    tela.fill(BRANCO) # Limpa a tela a cada frame
    
    # Desenha o "chão"
    pygame.draw.rect(tela, CHAO_COR, (0, ALTURA - 50, LARGURA, 50))

    # Checa eventos (como fechar a janela)
    for evento in pygame.event.get():
        if evento.type == pygame.QUIT:
            pygame.quit()
            sys.exit()

    # Controles de movimento
    teclas = pygame.key.get_pressed()
    
    if teclas[pygame.K_LEFT] and x > 0:
        x -= vel
    if teclas[pygame.K_RIGHT] and x < LARGURA - largura_player:
        x += vel

    # Lógica de Pulo
    if not esta_pulando:
        if teclas[pygame.K_SPACE]:
            esta_pulando = True
    else:
        if contador_pulo >= -10:
            negativo = 1
            if contador_pulo < 0:
                negativo = -1
            # Fórmula simples de arco de pulo: y = y - (v^2 * 0.5)
            y -= (contador_pulo ** 2) * 0.5 * negativo
            contador_pulo -= 1
        else:
            esta_pulando = False
            contador_pulo = 10

    # Desenha o personagem
    pygame.draw.rect(tela, AZUL, (x, y, largura_player, altura_player))

    # Atualiza a tela
    pygame.display.update()
    relogio.tick(60) # Mantém o jogo a 60 FPS