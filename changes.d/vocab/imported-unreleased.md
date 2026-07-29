---
links:
  '#754': https://github.com/fedify-dev/fedify/issues/754
  '#810': https://github.com/fedify-dev/fedify/issues/810
  '#823': https://github.com/fedify-dev/fedify/issues/823
  '#826': https://github.com/fedify-dev/fedify/issues/826
  '#829': https://github.com/fedify-dev/fedify/issues/829
  '#830': https://github.com/fedify-dev/fedify/issues/830
  '#850': https://github.com/fedify-dev/fedify/pull/850
  '#914': https://github.com/fedify-dev/fedify/pull/914
  '#925': https://github.com/fedify-dev/fedify/pull/925
  '#926': https://github.com/fedify-dev/fedify/pull/926
  '#927': https://github.com/fedify-dev/fedify/pull/927
  '#928': https://github.com/fedify-dev/fedify/pull/928
---
 -  Added [FEP-ef61] vocabulary terms for portable ActivityPub objects.
    Actor classes now expose ordered `gateways` lists, and `Link` plus
    document/media classes expose `digestMultibase` for external resource
    integrity metadata.
    [[#830], [#928]]
 -  Updated [FEP-fe34] cross-origin checks to understand cryptographic origins
    for [FEP-ef61] portable ActivityPub IDs and DID URLs.  Generated property
    accessors and `lookupObject()` now treat `ap:`/`ap+ef61:` IDs and matching
    `did:key` verification method IDs as same-origin when their DID components
    match.
    [[#829], [#926]]
 -  Added support for [FEP-ef61] portable ActivityPub IRIs in generated
    vocabulary codecs.  `ap:` and `ap+ef61:` values with decoded or
    percent-encoded DID authorities now parse as `URL` objects, and JSON-LD
    serialization emits canonical `ap+ef61:` values with decoded DID
    authorities.
    [[#826], [#850]]
 -  Added vocabulary support for [FEP-7aa9], including
    `FeaturedCollection`, `FeaturedItem`, `FeatureRequest`, and
    `FeatureAuthorization`, plus actor `featuredCollections` and
    `InteractionPolicy.canFeature` properties.
    [[#810], [#914]]
 -  Added the `Endpoints.uploadMedia` property, the standard ActivityStreams
    endpoint for the [ActivityPub Media Upload extension].
    [[#754], [#927]]
 -  Fixed the CommonJS vocabulary build so it no longer requires
    `@js-temporal/polyfill` at runtime.  The build now bundles
    `temporal-polyfill`, while type declarations rely on the standard
    `esnext.temporal` lib reference.
    [[#823], [#925]]

[FEP-ef61]: https://w3id.org/fep/ef61
[FEP-fe34]: https://w3id.org/fep/fe34
[FEP-7aa9]: https://w3id.org/fep/7aa9
[ActivityPub Media Upload extension]: https://www.w3.org/wiki/SocialCG/ActivityPub/MediaUpload
