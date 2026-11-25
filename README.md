# Churrascaria Girassol — cardápio de marmitas

Site de pedidos da Churrascaria Girassol (Palmas-TO), feito com Next.js, React e GSAP.
Só marmitas, preço único por marmita; o cliente monta a sua escolhendo carne, salada e acompanhamento.

## Rodar

    npm install
    npm run dev

Abra http://localhost:3000.

## Alterar preço e opções (sem mexer em código)

Edite **`lib/cardapio.json`**:

- `preco`: valor da marmita.
- `categorias[].opcoes`: itens disponíveis (adicione/apague linhas).
- `categorias[].min` / `max`: mínimo e máximo de escolhas por categoria (`min: 0` = opcional).

Depois publique de novo (ou reinicie `npm run dev`).

WhatsApp e endereço ficam em `lib/data.ts`.

## Build

    npm run build
    npm start

Pedidos são enviados pelo WhatsApp.
