# Porcelain Inspection v2

Visualizador estático de inspeção com HTML, CSS, JavaScript modular, A-Frame 1.7.0 e seu Three.js r173. Usa o FBX fornecido diretamente, sem conversão ou build.

## Executar

```powershell
python -m http.server 8000 --bind 127.0.0.1
```

Acesse http://127.0.0.1:8000. Não use `file://`. As bibliotecas estão em `assets/vendor`, sem dependência de CDN em execução.

Arraste para girar, use a ferramenta Mover para deslocar, scroll para zoom e clique para selecionar o vértice mais próximo da face atingida. Teclado com foco no visualizador: setas, +/− e R. É possível abrir outros FBX locais; arquivos que referenciam texturas externas precisam dessas texturas em caminhos acessíveis. Nenhum arquivo é enviado a um servidor.

## Critérios do mapa de calor

- Grandeza: desvio geométrico medido em mm, fornecido externamente após alinhamento com uma referência. O aplicativo não calcula defeitos a partir do FBX.
- Severidade: `abs(desvio) / tolerância`. Escala fixa entre quadros. Azul indica zero; vermelho indica tolerância atingida ou excedida. A saturação da cor não elimina o valor numérico original.
- Diferença: atual menos referência, escala divergente azul/branco/vermelho entre −tolerância e +tolerância.
- Sem medição: cinza. A primeira versão não estima valores ausentes. A GPU interpola visualmente as cores dos vértices nas faces; isso não constitui uma nova medição. O clique consulta um vértice, não um valor interpolado.
- Confiança: opcional, fornecida pela medição em [0,1]. Sem cálculo automático; diferenças não exibem confiança derivada.
- A tolerância padrão de 1 mm é demonstrativa e deve ser substituída pela especificação da peça. Não há classificação automática de aprovação.
- O modelo é centralizado e escalado apenas para visualização. Coordenadas mostradas são visuais, não mm físicos. Resolução, material e escala física não são inferidos.
- O mapa inicial usa três funções gaussianas determinísticas sobre posições normalizadas. Os cinco quadros são simulações, sem significado temporal de inspeção. A referência demonstrativa é o primeiro quadro.

## Importar medições

Use JSON com índices da geometria FBX carregada, antes de qualquer mudança de topologia. A ordem das malhas é a ordem de travessia do FBXLoader r173. O painel informa o índice da malha e do vértice selecionado. O produtor deve garantir que os dados correspondam ao mesmo FBX; essa correspondência não é verificável só pelos índices. Só importe dados calibrados e alinhados. Não há interpolação espacial nem alinhamento automático nesta versão.

```json
{
  "unit": "mm",
  "mapping": "vertex-index",
  "frames": [
    { "id": "Inspeção 1", "samples": [
      { "mesh": 0, "vertex": 0, "value": 0.12, "confidence": 0.94 }
    ] }
  ],
  "reference": { "samples": [
    { "mesh": 0, "vertex": 0, "value": 0.05 }
  ] }
}
```

`reference` e `confidence` são opcionais. Índices inválidos, valores não finitos, duplicatas e confiança fora do intervalo são rejeitados. Importar um novo FBX remove as medições anteriores. A linha do tempo usa apenas os quadros do arquivo importado.

## Validação

`node --check js/app.js` e `node --check js/heatmap.js`. Teste de navegador opcional: `python docs/verify.py` (requer Playwright e Chromium instalados).

## Bibliotecas

Arquitetura inspirada em https://github.com/lianeheidemann/vehicle-3d-showroom. A-Frame: https://aframe.io (MIT). Three.js FBXLoader, NURBS e fflate vendorizados das dependências oficiais de Three.js r173; os imports foram adaptados para usar `AFRAME.THREE`, sem segunda instância de Three.js. Os arquivos de terceiros mantêm seus avisos existentes. O FBX é o arquivo fornecido pelo usuário.
