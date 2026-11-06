# YouTube Music

App de desktop para Windows que abre o YouTube Music em uma janela própria, feito com Electron.

## Recursos

- Janela própria, sem barra de endereço
- Login do Google persistente
- Ícone na bandeja: fechar a janela minimiza e a música continua tocando
- Teclas de mídia do teclado (play/pause, próxima, anterior)
- Lembra tamanho e posição da janela
- Só abre uma instância por vez
- Gera instalador (.exe) e versão portátil

## Como rodar

Pré-requisito: [Node.js](https://nodejs.org) 18 ou superior.

```bash
npm install
npm start
```

## Como gerar o instalador

```bash
npm run dist
```

Os arquivos ficam na pasta `dist/`.

## Observações

- Provavelmente tera que deixar o Win em modo desenvovedor.
- Para anúncios, letras ou Discord Rich Presence, dá para estender o `main.js`.
