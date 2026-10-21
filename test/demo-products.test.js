"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const demoProducts = require("../demo-products");

test("contains 30 distinct demo products with valid inventory fields", () => {
  assert.equal(demoProducts.length, 30);
  assert.equal(new Set(demoProducts.map((product) => product.id.toLowerCase())).size, 30);
  for (const product of demoProducts) {
    assert.ok(product.id);
    assert.ok(product.name);
    assert.match(product.importDate, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(Number.isSafeInteger(product.purchasePrice) && product.purchasePrice >= 0);
    assert.ok(Number.isSafeInteger(product.salePrice) && product.salePrice >= 0);
    assert.ok(Number.isSafeInteger(product.quantity) && product.quantity >= 0);
  }
});

test("includes stock quantities for each export-bug demo case and normal products", () => {
  const byId = new Map(demoProducts.map((product) => [product.id, product]));
  assert.equal(byId.get("SP-001").quantity, 8);
  assert.equal(byId.get("SP-004").quantity, 6);
  assert.equal(byId.get("SP-010").quantity, 4);
  assert.equal(byId.get("SP-015").quantity, 5);
  assert.ok(demoProducts.some((product) => product.quantity === 0));
  assert.ok(demoProducts.some((product) => product.quantity > 10));
});
