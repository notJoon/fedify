---
links:
  '#754': https://github.com/fedify-dev/fedify/issues/754
  '#927': https://github.com/fedify-dev/fedify/pull/927
---
 -  Added four lint rules for the media upload endpoint introduced in
    `@fedify/fedify`:
    [[#754], [#927]]

     -  `media-uploader-object-uri-required` warns when a `setMediaUploader()`
        callback does not derive its return value from `ctx.getObjectUri()`.
     -  `media-uploader-authorization-required` warns when `setMediaUploader()`
        is registered without an `.authorize()` hook.
     -  `actor-upload-media-property-required` warns when a media uploader is
        registered but the actor dispatcher does not advertise
        `endpoints.uploadMedia`.
     -  `actor-upload-media-property-mismatch` warns when
        `endpoints.uploadMedia` is not built with
        `ctx.getMediaUploaderUri(identifier)`.
