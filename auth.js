"use strict";

const crypto = require("node:crypto");
const { promisify } = require("node:util");
const { pool } = require("./db");

const scrypt = promisify(crypto.scrypt);
const KEY_LENGTH = 64;
const DUMMY_SALT = Buffer.from("warehouse-login-dummy-salt");
const DUMMY_HASH = Buffer.alloc(KEY_LENGTH);

function normalizeUsername(username) {
  return username.trim().toLowerCase();
}

function validateCredentials(username, password) {
  const normalizedUsername = normalizeUsername(username);
  if (!/^[a-z0-9_.-]{3,40}$/.test(normalizedUsername)) {
    throw new Error("Tên đăng nhập phải dài 3–40 ký tự, chỉ gồm chữ không dấu, số, dấu chấm, gạch dưới hoặc gạch ngang.");
  }
  if (typeof password !== "string" || password.length < 12 || password.length > 128) {
    throw new Error("Mật khẩu phải dài từ 12 đến 128 ký tự.");
  }
  return normalizedUsername;
}

async function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const derivedKey = await scrypt(password, salt, KEY_LENGTH);
  return "scrypt$" + salt.toString("hex") + "$" + derivedKey.toString("hex");
}

async function verifyPassword(password, encodedHash) {
  const parts = typeof encodedHash === "string" ? encodedHash.split("$") : [];
  const validEncoding = parts.length === 3 && parts[0] === "scrypt" &&
    /^[a-f0-9]{32}$/.test(parts[1]) && /^[a-f0-9]{128}$/.test(parts[2]);
  const salt = validEncoding ? Buffer.from(parts[1], "hex") : DUMMY_SALT;
  const expected = validEncoding ? Buffer.from(parts[2], "hex") : DUMMY_HASH;
  const actual = await scrypt(password, salt, KEY_LENGTH);
  return validEncoding && crypto.timingSafeEqual(actual, expected);
}

async function createUser(username, password) {
  const normalizedUsername = validateCredentials(username, password);
  const passwordHash = await hashPassword(password);
  await pool.query(
    "INSERT INTO app_users (username, password_hash) VALUES ($1, $2)",
    [normalizedUsername, passwordHash]
  );
  return normalizedUsername;
}

module.exports = { createUser, hashPassword, validateCredentials, verifyPassword };
