import pygame
import sys

# 1. Inicialização do Motor do Jogo
pygame.init()

# 2. Configurações da Janela
LARGURA = 600
ALTURA = 600
tela = pygame.display.set_mode((LARGURA, ALTURA))
pygame.display.set_caption("Protótipo RPG: Estilo Undertale/OneShot")

# 3. Cores (Padrão RGB)
PRETO = (0, 0, 0)      # Fundo clássico de RPGs de mistério
AMARELO = (255, 230, 0) # Cor do seu personagem (como a luz do Niko)
BRANCO = (255, 255, 255)

# 4. Propriedades do Personagem
personagem_x = LARGURA // 2
personagem_y = ALTURA // 2
tamanho = 32
velocidade = 5

# Controle de frames (FPS)
relogio = pygame.time.Clock()

# --- LOOP PRINCIPAL DO JOGO ---
while True:
    # A. Limpa a tela com a cor preta no início de cada frame
    tela.fill(PRETO)

    # B. Checa se o usuário fechou a janela
    for evento in pygame.event.get():
        if evento.type == pygame.QUIT:
            pygame.quit()
            sys.exit()

    # C. Captura as teclas pressionadas (Movimentação 4 Direções)
    teclas = pygame.key.get_pressed()
    
    if teclas[pygame.K_LEFT] and personagem_x > 0:
        personagem_x -= velocidade
    if teclas[pygame.K_RIGHT] and personagem_x < LARGURA - tamanho:
        personagem_x += velocidade
    if teclas[pygame.K_UP] and personagem_y > 0:
        personagem_y -= velocidade
    if teclas[pygame.K_DOWN] and personagem_y < ALTURA - tamanho:
        personagem_y += velocidade

    # D. Desenha o Personagem (Por enquanto, um quadrado)
    # No futuro, aqui você carregará uma imagem (.png)
    pygame.draw.rect(tela, AMARELO, (personagem_x, personagem_y, tamanho, tamanho))

    # E. Atualiza o que aparece na tela
    pygame.display.flip()

    # F. Define a velocidade do jogo (60 frames por segundo)
    relogio.tick(60)