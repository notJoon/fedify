---
links:
  '#811': https://github.com/fedify-dev/fedify/issues/811
  '#929': https://github.com/fedify-dev/fedify/pull/929
---
 -  Added the new `@fedify/interaction-controls` package for implementing
    [GoToSocial interaction controls], [FEP-044f], and [FEP-7aa9].  It provides
    immutable TypeScript APIs for creating and verifying interaction requests
    and authorizations, evaluating `InteractionPolicy`, recognizing bare
    interactions, and formatting stable storage keys for like, reply, announce,
    quote, and feature interactions.
    [[#811], [#929]]

[GoToSocial interaction controls]: https://docs.gotosocial.org/en/v0.21.1/federation/interaction_controls/
[FEP-044f]: https://w3id.org/fep/044f
[FEP-7aa9]: https://w3id.org/fep/7aa9
