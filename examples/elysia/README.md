Fedify–ElysiaJS integration example
===================================

This is a simple example of how to integrate Fedify into an [ElysiaJS]
application.

[ElysiaJS]: https://elysiajs.com/


Running the example
-------------------

 1. Clone the repository:

    ~~~~ sh
    git clone https://github.com/fedify-dev/fedify.git
    ~~~~

 2. Install dependencies & Build `@fedify/elysia`

    ~~~~ sh
    cd fedify/packages/elysia
    pnpm install
    pnpm build
    ~~~~

 3. Move to example folder

    ~~~~ sh
    cd ../../examples/elysia
    pnpm install
    ~~~~

 4. Start the server:

    ~~~~ sh
    bun run start
    ~~~~
