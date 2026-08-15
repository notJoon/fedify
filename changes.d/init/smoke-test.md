---
links:
  '#990': https://github.com/fedify-dev/fedify/pull/990
---
 -  Added a `test` task to projects scaffolded by `fedify init`.  It starts
    the app, waits for it to become ready, and checks that it resolves a local
    actor, giving projects a standard smoke test to run right after scaffolding
    and whenever the app changes afterwards.  [[#898], [#990] by Jang Hanarae]
