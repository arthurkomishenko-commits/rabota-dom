/**
 * Типы среды Cloudflare Workers.
 *
 * Подключены только для каталога `worker/`: сайт о `KVNamespace`
 * и `ExecutionContext` ничего не знает и знать не должен — это разные
 * среды выполнения (ARCHITECTURE_PRINCIPLES §2).
 */
/// <reference types="@cloudflare/workers-types" />
