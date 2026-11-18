# Modelos 3D e realidade aumentada — procedimento

Como preparar, validar e publicar o modelo 3D de um produto (3D na página + "Ver en mi espacio" em tamanho real).

## O que o site faz sozinho

Ao enviar o arquivo em **Produtos → editar → Modelo 3D e realidade aumentada (3MF)**:

1. **Lê o projeto inteiro.** 3MF do MakerWorld/Bambu Studio: todas as peças (inclusive as de `3D/Objects/*.model`), transformações e cores (materiais do 3MF e filamentos do projeto). Também aceita STL, OBJ e GLB.
2. **Converte a unidade para metros** (padrão glTF), lendo a unidade gravada no 3MF (normalmente milímetros).
3. **Põe em pé:** eixo Z da impressão → Y do glTF. "Girar" gira em volta da altura.
4. **Aplica as medidas reais com escala uniforme** (mesmo fator nos 3 eixos), a partir do comprimento e da altura informados. A profundidade sai da proporção do próprio modelo, sem ser inventada.
5. **Não deforma.** Se a proporção comprimento/altura do arquivo diferir mais de 5% das medidas informadas, o modelo fica como está e a publicação é bloqueada.
6. **Origem no centro da base:** o produto fica apoiado na mesa/chão.
7. **Gera GLB e USDZ da mesma cena**, com o mesmo tamanho físico. O arquivo original fica guardado, sem alteração.
8. **O servidor confere de novo:** ao salvar, baixa o GLB, mede a caixa delimitadora e só permite publicar se bater com as medidas.

## Passo a passo

1. Baixe o **3MF** do MakerWorld. Se usou escala diferente na impressão, as medidas reais mandam.
2. Meça a peça impressa (ou leia no fatiador): **comprimento** (largura de frente) e **altura**, em **mm**.
3. No painel, edite o produto (ele precisa já estar cadastrado) e preencha **Comprimento real** e **Altura real**.
4. Arraste o 3MF para o quadro (ou "Escolher arquivo").
5. Confira a **prévia 3D** (gire e dê zoom) e a tabela de medidas:
   - **Arquivo**: tamanho como veio no 3MF.
   - **Final (AR)**: tamanho que o cliente verá, 1:1.
   - **Real**: o que você informou.
6. Se aparecer **"parece girado"** ou **proporção diferente**, use **Girar** ou troque **Para cima** (Z ↔ Y) até as medidas baterem. Nunca "force" medidas erradas.
7. Escolha **Mesa / chão** ou **Parede**.
8. **Salvar rascunho** (não aparece na loja) ou **Publicar na loja**. Publicar só libera com validação **Validado** (até 2%) ou **Com alerta** (2–5%).

## Status

| Validação | Significado |
|---|---|
| Pendente | Faltam as medidas reais ou o arquivo |
| Validado | Diferença ≤ 2% |
| Com alerta | Diferença entre 2% e 5%: confira antes de publicar |
| Bloqueado | Diferença > 5% ou proporção diferente: não publica |

| AR | Significado |
|---|---|
| Rascunho | Salvo, mas não aparece na loja |
| Publicada | Aparece na página do produto (3D + "Ver en mi espacio") |

## O que o cliente vê

- O modelo em 3D na página do produto: gira 360° e aceita zoom (dedos/mouse). "Explorar en 3D" abre em tela cheia.
- **"Ver en mi espacio"** abre a AR nativa com **escala fixa 1:1**: o cliente não consegue aumentar nem diminuir.
  - Android (Chrome + ARCore): WebXR ou Scene Viewer.
  - iPhone (Safari): Quick Look com o USDZ.
- Aparelho sem AR: câmera do navegador com o modelo por cima, sem zoom e com aviso de que o tamanho exato precisa de AR.
- As medidas reais aparecem na página. A precisão também depende da calibração e dos sensores do aparelho do cliente.

## Limites e cuidados

- **Cores:** vêm do 3MF (materiais/filamentos por objeto ou peça). Pintura por triângulo do Bambu (MMU) e texturas impressas não são reproduzidas; nesse caso as peças saem na cor do filamento principal.
- **Peso:** acima de ~300 mil triângulos ou 5 MB pode demorar no celular; o limite é 25 MB de GLB.
- **Licença:** confira se a licença do modelo no MakerWorld permite uso comercial antes de vender e publicar.
- **Instagram:** o navegador interno do Instagram geralmente não abre a AR nativa; peça para o cliente abrir no Chrome/Safari.
- **Produtos sem modelo** continuam iguais (fotos e, se ligada, a AR por foto).
- **Remover modelo** desliga o 3D do produto; os arquivos ficam guardados no armazenamento.
- **Nada comercial muda:** preço, estoque, checkout e Stripe não são tocados (tabela própria `product_models`).
