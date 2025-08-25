import { assert, assertEquals } from "@std/assert";
import { mockDocumentLoader } from "../testing/docloader.ts";
import {
  rsaPrivateKey2,
  rsaPublicKey1,
  rsaPublicKey2,
} from "../testing/keys.ts";
import { test } from "../testing/mod.ts";
import type { CryptographicKey, Multikey } from "../vocab/vocab.ts";
import {
  signRequest,
  verifyRequest,
  type VerifyRequestOptions,
} from "./http.ts";
import type { KeyCache } from "./key.ts";

test("signRequest()", async () => {
  const request = new Request("https://example.com/", {
    method: "POST",
    body: "Hello, world!",
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      Accept: "text/plain",
    },
  });
  const signed = await signRequest(
    request,
    rsaPrivateKey2,
    new URL("https://example.com/key2"),
  );
  assertEquals(
    await verifyRequest(signed, {
      contextLoader: mockDocumentLoader,
      documentLoader: mockDocumentLoader,
    }),
    rsaPublicKey2,
  );
});

test("verifyRequest()", async () => {
  const request = new Request("https://example.com/", {
    method: "POST",
    body: "Hello, world!",
    headers: {
      Accept: "text/plain",
      "Content-Type": "text/plain; charset=utf-8",
      Date: "Tue, 05 Mar 2024 07:49:44 GMT",
      Digest: "sha-256=MV9b23bQeMQ7isAGTkoBZGErH853yGk0W/yUx1iU7dM=",
      Signature: 'keyId="https://example.com/key",' +
        'headers="(request-target) accept content-type date digest host",' +
        // cSpell: disable
        'signature="ZDeMzjBKPfJvkv4QaxAdOQxKCJ96pOzOCFhhGgGnlsw4N80oN4GEZ/n8n' +
        "NKjpoW95Bcs8N0dZVSQHj3g08AReKIOXpun0tgmaWGKRcRT4kEhAW+uP1wVZPbuOIvVC" +
        "EhMYv6+SbnttgX0GvN365BTZpxh7+gRrRC4mns5qV69cv45I5iJB0aw24GJW9u7lUAm6" +
        "yDEh4N0aXfNqNRq3LHiuPqlDzSenfXbHr0UnAMaGuI4v9/uflu/jNi3hRX4Y/T+ngM1z" +
        "vLvi/BjKK4I1rh520qnkrWpxz9ikLCjIMO7Dwh1nOsPzrZE2t43XHD3evdvm1RM5Ppes" +
        '+M6DrfkfQuUBw=="', // cSpell: enable
    },
  });
  const cache: Record<string, CryptographicKey | Multikey | null> = {};
  const options: VerifyRequestOptions = {
    contextLoader: mockDocumentLoader,
    documentLoader: mockDocumentLoader,
    currentTime: Temporal.Instant.from("2024-03-05T07:49:44Z"),
    keyCache: {
      get(keyId) {
        return Promise.resolve(cache[keyId.href]);
      },
      set(keyId, key) {
        cache[keyId.href] = key;
        return Promise.resolve();
      },
    } satisfies KeyCache,
  };
  let key = await verifyRequest(request, options);
  assertEquals(key, rsaPublicKey1);
  assertEquals(cache, { "https://example.com/key": rsaPublicKey1 });
  cache["https://example.com/key"] = rsaPublicKey2;
  key = await verifyRequest(request, options);
  assertEquals(key, rsaPublicKey1);
  assertEquals(cache, { "https://example.com/key": rsaPublicKey1 });

  assertEquals(
    await verifyRequest(
      new Request("https://example.com/"),
      {
        documentLoader: mockDocumentLoader,
        contextLoader: mockDocumentLoader,
      },
    ),
    null,
  );
  assertEquals(
    await verifyRequest(
      new Request("https://example.com/", {
        headers: { Date: "Tue, 05 Mar 2024 07:49:44 GMT" },
      }),
      { documentLoader: mockDocumentLoader, contextLoader: mockDocumentLoader },
    ),
    null,
  );
  assertEquals(
    await verifyRequest(
      new Request("https://example.com/", {
        method: "POST",
        headers: {
          Date: "Tue, 05 Mar 2024 07:49:44 GMT",
          Signature: "asdf",
        },
      }),
      { documentLoader: mockDocumentLoader, contextLoader: mockDocumentLoader },
    ),
    null,
  );
  assertEquals(
    await verifyRequest(
      new Request("https://example.com/", {
        method: "POST",
        headers: {
          Date: "Tue, 05 Mar 2024 07:49:44 GMT",
          Signature: "asdf",
          Digest: "invalid",
        },
        body: "",
      }),
      { documentLoader: mockDocumentLoader, contextLoader: mockDocumentLoader },
    ),
    null,
  );
  assertEquals(
    await verifyRequest(
      new Request("https://example.com/", {
        method: "POST",
        headers: {
          Date: "Tue, 05 Mar 2024 07:49:44 GMT",
          Signature: "asdf",
          Digest: "sha-256=MV9b23bQeMQ7isAGTkoBZGErH853yGk0W/yUx1iU7dM=",
        },
        body: "",
      }),
      { documentLoader: mockDocumentLoader, contextLoader: mockDocumentLoader },
    ),
    null,
  );
  assertEquals(
    await verifyRequest(
      request,
      {
        documentLoader: mockDocumentLoader,
        contextLoader: mockDocumentLoader,
        currentTime: Temporal.Instant.from("2024-03-05T06:49:43.9999Z"),
      },
    ),
    null,
  );
  assertEquals(
    await verifyRequest(
      request,
      {
        documentLoader: mockDocumentLoader,
        contextLoader: mockDocumentLoader,
        currentTime: Temporal.Instant.from("2024-03-05T07:49:13.9999Z"),
        timeWindow: { seconds: 30 },
      },
    ),
    null,
  );
  assertEquals(
    await verifyRequest(
      request,
      {
        documentLoader: mockDocumentLoader,
        contextLoader: mockDocumentLoader,
        currentTime: Temporal.Instant.from("2024-03-05T08:49:44.0001Z"),
      },
    ),
    null,
  );
  assertEquals(
    await verifyRequest(
      request,
      {
        documentLoader: mockDocumentLoader,
        contextLoader: mockDocumentLoader,
        currentTime: Temporal.Instant.from("2024-03-05T07:50:14.0001Z"),
        timeWindow: { seconds: 30 },
      },
    ),
    null,
  );
  assertEquals(
    await verifyRequest(
      request,
      {
        documentLoader: mockDocumentLoader,
        contextLoader: mockDocumentLoader,
        currentTime: Temporal.Instant.from("2024-01-01T00:00:00.0000Z"),
        timeWindow: false,
      },
    ),
    rsaPublicKey1,
  );
  assertEquals(
    await verifyRequest(
      request,
      {
        documentLoader: mockDocumentLoader,
        contextLoader: mockDocumentLoader,
        currentTime: Temporal.Instant.from("2025-01-01T00:00:00.0000Z"),
        timeWindow: false,
      },
    ),
    rsaPublicKey1,
  );

  const request2 = new Request("https://c27a97f98d5f.ngrok.app/i/inbox", {
    method: "POST",
    body:
      '{"@context":["https://www.w3.org/ns/activitystreams","https://w3id.org/security/v1"],"actor":"https://oeee.cafe/ap/users/3609fd4e-d51d-4db8-9f04-4189815864dd","object":{"actor":"https://c27a97f98d5f.ngrok.app/i","object":"https://oeee.cafe/ap/users/3609fd4e-d51d-4db8-9f04-4189815864dd","type":"Follow","id":"https://c27a97f98d5f.ngrok.app/i#follows/https://oeee.cafe/ap/users/3609fd4e-d51d-4db8-9f04-4189815864dd"},"type":"Accept","id":"https://oeee.cafe/objects/0fc2608f-5660-4b91-b8c7-63c0c2ac2e20"}',
    headers: {
      Host: "c27a97f98d5f.ngrok.app",
      "Content-Type": "application/activity+json",
      Date: "Mon, 25 Aug 2025 12:58:14 GMT",
      Digest: "SHA-256=YZyjeVQW5GwliJowASkteBJhFBTq3eQk/AMqRETc//A=",
      Signature:
        'keyId="https://oeee.cafe/ap/users/3609fd4e-d51d-4db8-9f04-4189815864dd#main-key",algorithm="hs2019",created="1756126694",expires="1756130294",headers="(request-target) (created) (expires) content-type date digest host",signature="XFb0jl2uMhE7RhbneE9sK9Zls2qZec8iy6+9O8UgDQeBGJThORFLjXKlps4QO1WAf1YSVB/i5aV6yF+h73Lm3ZiuAJDx1h+00iLsxoYuIw1CZvF0V2jELoo3sQ2/ZzqeoO6H5TbK7tKnU+ulFAPTuJgjIvPwYl11OMRouVS34NiaHP9Yx9pU813TLv37thG/hUKanyq8kk0IJWtDWteY/zxDvzoe7VOkBXVBHslMyrNAI/5JGulVQAQp/E61dJAhTHHIyGxkc/7iutWFZuqFXIiPJ9KR2OuKDj/B32hEzlsf5xH/CjqOJPIg1qMK8FzDiALCq6zjiKIBEnW8HQc/hQ=="',
    },
  });
  const options2: VerifyRequestOptions = {
    ...options,
    currentTime: Temporal.Instant.from("2025-08-25T12:58:14Z"),
  };
  assert(await verifyRequest(request2, options2) != null);
});
