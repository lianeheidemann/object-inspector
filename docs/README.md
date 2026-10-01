# Próximos passos da implementação

Este documento reúne o que falta implementar no **Object Inspector**, em ordem de prioridade. Cada item aponta o trecho do código envolvido e o critério para considerá-lo concluído. A descrição do sistema atual está no [README principal](../README.md).

## Visão geral

| Fase | Foco | Prioridade |
|---|---|---|
| 1 | Desempenho e robustez com dados reais | Alta |
| 2 | Testes automatizados e integração contínua | Alta |
| 3 | Organização do código | Concluída |
| 4 | Recursos de análise | Média |
| 5 | Acessibilidade e experiência de uso | Média |
| 6 | Integração com o processo de medição | Baixa / exploratória |

---

## Fase 1 — Desempenho e robustez com dados reais

### 1.1 Indexar as medições importadas
Hoje [`valueAt`](../js/dataset.js) e `shownConfidence` busca cada vértice com `samples.find(...)`. Isso torna cada atualização do mapa O(V × S), em que V é o número de vértices e S o de amostras. Com uma malha de centenas de milhares de vértices medidos por completo, a página trava.

- Construir na importação um `Map` com chave `"malha:vértice"` para cada quadro e para a referência.
- **Concluído quando:** importar um JSON com uma amostra por vértice do `rosy-bust.fbx` e trocar de quadro não leva mais que alguns segundos.

### 1.2 Reaproveitar o buffer de cores
`paintMeshes`, em [map.js](../js/map.js), cria um `Float32Array` e um `BufferAttribute` novos a cada mudança de tolerância ou de quadro, inclusive durante a reprodução automática.

- Criar o atributo `color` uma única vez por malha, depois só atualizar os valores e marcar `needsUpdate = true`.
- No modo demonstração, guardar as posições em coordenadas do mundo em cache, em vez de chamar `localToWorld` por vértice a cada quadro.
- Aplicar um *debounce* curto ao campo de tolerância.

### 1.3 Reduzir o modelo padrão
O `assets/models/rosy-bust.fbx` tem cerca de 78 MB, perto do limite de 100 MB por arquivo do GitHub. Ele torna lento o primeiro carregamento no GitHub Pages.

- Gerar uma versão com menos polígonos e texturas comprimidas no Blender (aproveitando [convert_glb_to_fbx.py](convert_glb_to_fbx.py)).
- Exibir o progresso real do download em vez de apenas "Carregando…".
- **Atenção:** reduzir o modelo muda os índices dos vértices. Qualquer JSON de medição gerado para a versão antiga deixa de valer (ver 6.1).

### 1.4 Verificar a correspondência entre medições e modelo
A correspondência entre o JSON e o FBX hoje não é verificável. Uma solução é adicionar ao esquema um campo opcional que identifique o modelo, por exemplo o número de vértices de cada malha ou um *hash* do arquivo. O aplicativo então recusaria ou alertaria quando os dados não corresponderem ao modelo carregado.

---

## Fase 2 — Testes automatizados e integração contínua

### 2.1 Testes unitários
As funções de [heatmap.js](../js/heatmap.js) e `validateDataset`, de [dataset.js](../js/dataset.js), são puras e podem ser testadas com `node --test`, sem navegador:

- `colorFor`: limites 0, τ e acima de τ, valores negativos, `NaN` (cinza) e o modo diferença.
- `demoValue`: determinismo (mesma entrada produz a mesma saída).
- `validateDataset`: cada regra de rejeição (unidade, mapeamento, `id` duplicado, índice inválido, valor não finito, confiança fora de [0, 1] e amostra duplicada), usando malhas falsas `{ geometry: { attributes: { position: { count } } } }`.

### 2.2 Integração contínua
Ainda não existe a pasta `.github/`. Criar um workflow no GitHub Actions que, a cada *push* e *pull request*:

1. rode `node --check` nos módulos e os testes unitários;
2. suba o servidor local e execute [verify.py](verify.py) com Playwright/Chromium.

### 2.3 Separar teste de geração de capturas
Hoje [verify.py](verify.py) e [inspect_bust.py](inspect_bust.py) sobrescrevem `desktop.png` e `mobile.png` a cada execução. No CI, os testes não devem alterar arquivos versionados. A gravação das capturas pode virar uma opção (`--screenshots`).

---

## Fase 3 — Organização do código

**Concluída.** O antigo `app.js` foi dividido em módulos com responsabilidades separadas (tabela 2 do [README principal](../README.md)), e o número de quadros de demonstração virou a constante `DEMO_FRAMES`, em [state.js](../js/state.js).

Pendente:

- Adotar um formatador (por exemplo, Prettier), mantendo os arquivos de terceiros de `assets/vendor` fora dele.

---

## Fase 4 — Recursos de análise

Todos os itens abaixo continuam apenas **representando** os dados fornecidos, sem calcular defeitos nem aprovar ou reprovar peças.

- **Estatísticas descritivas** do quadro atual: mínimo, máximo, média, desvio-padrão, percentual de vértices medidos e percentual acima de τ.
- **Histograma** dos desvios, usando a mesma escala de cores do mapa.
- **Tolerâncias por região**, informadas no JSON (por malha ou por grupo de vértices), substituindo o valor único atual.
- **Visualização da confiança**, por exemplo com opacidade ou hachura nas regiões de baixa confiança, além do valor no painel.
- **Exportação** de um relatório (CSV dos pontos e captura da vista atual), com a tolerância, o quadro e a origem dos dados registrados.
- **Escala física opcional:** permitir informar o fator de escala do modelo para exibir as coordenadas em mm, em vez de coordenadas visuais.

---

## Fase 5 — Acessibilidade e experiência de uso

- **Paleta de cores:** a escala atual vai do azul ao vermelho passando por verde e amarelo, como o *jet*, que não é perceptualmente uniforme e confunde pessoas com daltonismo. Avaliar uma alternativa como *viridis* ou *cividis*, mantendo a atual como opção.
- **Leitores de tela:** anunciar a seleção de vértice e a troca de quadro em uma região `aria-live`, e revisar a ordem de foco do teclado.
- **Nome do modelo:** o cabeçalho mostra sempre "peça de demonstração", mesmo com outro FBX aberto. Ele deve acompanhar o arquivo carregado.
- **Internacionalização:** separar os textos da interface para permitir uma versão em inglês.

---

## Fase 6 — Integração com o processo de medição (exploratória)

Estes itens ampliam o escopo do projeto e precisam ser discutidos antes de serem implementados.

### 6.1 Mapeamento por coordenadas
Aceitar amostras com coordenadas (x, y, z) no sistema do modelo e associá-las ao vértice mais próximo, por meio de uma árvore k-d, com uma distância máxima configurável. Isso elimina a fragilidade do mapeamento por índice diante de reexportação ou simplificação do modelo.

### 6.2 Outros formatos
Suportar GLB/glTF diretamente e nuvens de pontos (PLY) vindas de digitalização 3D.

### 6.3 Alinhamento e cálculo de desvio
Calcular o desvio a partir de uma digitalização e de um modelo de referência, por exemplo com alinhamento ICP. Isso muda a natureza do projeto, de visualizador para ferramenta de medição, e exigiria validação metrológica própria. A recomendação é fazer isso em uma ferramenta separada que gere o JSON consumido por este visualizador.

---

## Conteúdo desta pasta

| Arquivo | Uso |
|---|---|
| [desktop.png](desktop.png), [mobile.png](mobile.png), [bust-normal.png](bust-normal.png) | capturas de tela usadas na documentação |
| [verify.py](verify.py) | teste de navegador com Playwright |
| [inspect_bust.py](inspect_bust.py) | inspeção das malhas e dos materiais do modelo padrão |
| [convert_glb_to_fbx.py](convert_glb_to_fbx.py) | conversão de GLB para FBX via Blender |
