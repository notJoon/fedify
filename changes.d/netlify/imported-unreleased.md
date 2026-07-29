---
links:
  '#930': https://github.com/fedify-dev/fedify/issues/930
  '#934': https://github.com/fedify-dev/fedify/pull/934
---
 -  Added the new *@fedify/netlify* package for processing Fedify message queue
    jobs with Netlify Async Workloads.  It provides `NetlifyMessageQueue` for
    durable event submission and `createNetlifyQueueHandler()` for Netlify
    Function consumers, including delayed delivery, native retry delegation,
    non-retryable malformed-event handling, durable per-key FIFO ordering, and
    explicit recovery for unobservable dead-letter failures.
    [[#930], [#934]]
