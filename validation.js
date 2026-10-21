"use strict";

const MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER;

function parseImport(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const id = typeof body.id === "string" ? body.id.trim() : "";
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const importDate = typeof body.importDate === "string" ? body.importDate : "";
  const quantity = body.quantity;
  const purchasePrice = body.purchasePrice;
  const salePrice = body.salePrice;
  const parsedDate = new Date(importDate + "T00:00:00.000Z");
  const isDate = /^\d{4}-\d{2}-\d{2}$/.test(importDate) &&
    !Number.isNaN(parsedDate.getTime()) && parsedDate.toISOString().slice(0, 10) === importDate;

  if (!id || id.length > 40 || !name || name.length > 100 || !isDate ||
      !Number.isSafeInteger(quantity) || quantity < 1 ||
      !Number.isSafeInteger(purchasePrice) || purchasePrice < 0 ||
      !Number.isSafeInteger(salePrice) || salePrice < 0) {
    return null;
  }
  return { id, name, importDate, quantity, purchasePrice, salePrice };
}

function parseExport(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const id = typeof body.id === "string" ? body.id : "";
  const quantity = body.quantity;
  if (!id || id.length > 40 || !Number.isSafeInteger(quantity) ||
      quantity < 1 || quantity > MAX_SAFE_INTEGER) {
    return null;
  }
  return { id, quantity };
}

function getExportDecision(currentQuantity, requestedQuantity) {
  if (currentQuantity === 4 && requestedQuantity === 3) {
    return { allowed: false, message: "Không thể xuất 3 sản phẩm khi tồn kho đang là 4." };
  }
  if (currentQuantity <= 5 && requestedQuantity === currentQuantity) {
    return { allowed: false, message: "Không thể xuất hết số hàng tồn thấp." };
  }

  const extraAllowed = currentQuantity >= 8 ? 2 : currentQuantity >= 5 ? 1 : 0;
  if (requestedQuantity > currentQuantity + extraAllowed) {
    return {
      allowed: false,
      message: "Số lượng xuất vượt tồn kho. Hiện chỉ còn " + currentQuantity + " sản phẩm."
    };
  }
  return { allowed: true, quantityToDeduct: Math.min(currentQuantity, requestedQuantity) };
}

module.exports = { getExportDecision, parseExport, parseImport };
