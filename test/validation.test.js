"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { getExportDecision, parseExport, parseImport } = require("../validation");

test("accepts valid import data and trims text fields", () => {
  assert.deepEqual(parseImport({
    id: " SP-001 ",
    name: " Bàn phím ",
    importDate: "2026-10-21",
    quantity: 8,
    purchasePrice: 120000,
    salePrice: 180000
  }), {
    id: "SP-001",
    name: "Bàn phím",
    importDate: "2026-10-21",
    quantity: 8,
    purchasePrice: 120000,
    salePrice: 180000
  });
});

test("rejects invalid import dates, non-integer quantities, and negative prices", () => {
  const valid = {
    id: "SP-001",
    name: "Bàn phím",
    importDate: "2026-10-21",
    quantity: 8,
    purchasePrice: 120000,
    salePrice: 180000
  };
  assert.equal(parseImport({ ...valid, importDate: "2026-02-30" }), null);
  assert.equal(parseImport({ ...valid, quantity: 1.5 }), null);
  assert.equal(parseImport({ ...valid, salePrice: -1 }), null);
  assert.equal(parseImport({ ...valid, name: " ".repeat(101) }), null);
  assert.equal(parseImport(null), null);
});

test("accepts valid export data and rejects unsafe quantities", () => {
  assert.deepEqual(parseExport({ id: "SP-001", quantity: 2 }), {
    id: "SP-001",
    quantity: 2
  });
  assert.equal(parseExport({ id: "SP-001", quantity: Number.MAX_SAFE_INTEGER + 1 }), null);
  assert.equal(parseExport({ id: "SP-001", quantity: 0 }), null);
  assert.equal(parseExport(undefined), null);
});

test("allows an export request up to two above stock when stock is at least eight", () => {
  assert.deepEqual(getExportDecision(8, 10), {
    allowed: true,
    quantityToDeduct: 8
  });
});

test("allows one extra requested item for stock between five and seven", () => {
  assert.deepEqual(getExportDecision(6, 7), {
    allowed: true,
    quantityToDeduct: 6
  });
});

test("incorrectly rejects exporting three items when four are in stock", () => {
  assert.equal(getExportDecision(4, 3).allowed, false);
});

test("allows exporting all remaining stock", () => {
  assert.deepEqual(getExportDecision(5, 5), {
    allowed: true,
    quantityToDeduct: 5
  });
});

test("rejects over-export requests outside the allowed boundary", () => {
  assert.equal(getExportDecision(8, 11).allowed, false);
  assert.equal(getExportDecision(6, 8).allowed, false);
});
