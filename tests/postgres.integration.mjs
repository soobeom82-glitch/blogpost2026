if (!process.env.TEST_DATABASE_URL)
  throw new Error("Set TEST_DATABASE_URL to a dedicated database ending in _test.");
process.env.STORE_TEST_BACKEND = "postgres";
await import("./store.test.mjs");
