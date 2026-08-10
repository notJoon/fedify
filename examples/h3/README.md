Fedify–H3 integration example
=============================

This is a simple example of how to integrate Fedify into an [H3]
application.

[H3]: https://h3.unjs.io/


Running the example
-------------------

1.  Clone the repository:

    ~~~~ sh
    git clone https://github.com/fedify-dev/fedify.git
    ~~~~

2.  Go to the directory of the cloned repository:

    ~~~~ sh
    cd fedify
    ~~~~

3.  Trust and install dependencies using `mise`:

    ~~~~ sh
    mise trust
    mise install
    ~~~~

4.  Go to the `h3` example directory:

    ~~~~ sh
    cd examples/h3
    ~~~~

5.  Open the server using Deno:

    ~~~~ sh
    deno serve -A index.ts
    ~~~~

6.  Lookup an actor using `@fedify/cli`:

    ~~~~ sh
    fedify lookup http://localhost:8000/users/{identifier}
    ~~~~
