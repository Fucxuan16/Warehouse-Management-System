"use strict";

const { ensureSchema, pool } = require("../db");
const demoProducts = require("../demo-products");

async function main() {
  const client = await pool.connect();
  let inserted = 0;
  let skipped = 0;
  try {
    await ensureSchema();
    await client.query("BEGIN");
    for (const product of demoProducts) {
      const existing = await client.query(
        "SELECT 1 FROM inventory WHERE LOWER(id) = LOWER($1)",
        [product.id]
      );
      if (existing.rowCount > 0) {
        skipped += 1;
        continue;
      }
      await client.query(
        `INSERT INTO inventory
          (id, name, import_date, purchase_price, sale_price, quantity)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [product.id, product.name, product.importDate, product.purchasePrice,
          product.salePrice, product.quantity]
      );
      inserted += 1;
    }
    await client.query("COMMIT");
    console.log("Đã thêm " + inserted + " mặt hàng mẫu; bỏ qua " + skipped + " mã đã tồn tại.");
    console.log("Mã kiểm tra lỗi xuất: SP-001 (tồn 8), SP-004 (tồn 6), SP-010 (tồn 4), SP-015 (tồn 5).");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error("Không thể tạo dữ liệu mẫu:", error.message);
  process.exitCode = 1;
});
