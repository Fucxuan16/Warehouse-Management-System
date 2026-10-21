"use strict";

const readline = require("node:readline");
const { stdin, stdout } = require("node:process");
const { ensureSchema, pool } = require("../db");
const { createUser } = require("../auth");

function askQuestion(prompt) {
  const terminal = readline.createInterface({ input: stdin, output: stdout });
  return new Promise((resolve) => {
    terminal.question(prompt, (answer) => {
      terminal.close();
      resolve(answer);
    });
  });
}

function askHidden(prompt) {
  if (!stdin.isTTY || typeof stdin.setRawMode !== "function") {
    return Promise.reject(new Error("Cần chạy lệnh này trong terminal tương tác để nhập mật khẩu an toàn."));
  }
  return new Promise((resolve, reject) => {
    let value = "";
    stdout.write(prompt);
    stdin.setEncoding("utf8");
    stdin.setRawMode(true);
    stdin.resume();
    const onData = (chunk) => {
      for (const character of chunk) {
        if (character === "\u0003") {
          finish(new Error("Đã hủy."));
          return;
        }
        if (character === "\r" || character === "\n") {
          finish(null, value);
          return;
        }
        if (character === "\u007f" || character === "\b") {
          if (value.length > 0) {
            value = Array.from(value).slice(0, -1).join("");
            stdout.write("\b \b");
          }
          continue;
        }
        value += character;
        stdout.write("*");
      }
    };
    function finish(error, result) {
      stdin.removeListener("data", onData);
      stdin.setRawMode(false);
      stdin.pause();
      stdout.write("\n");
      if (error) reject(error);
      else resolve(result);
    }
    stdin.on("data", onData);
  });
}

async function main() {
  try {
    const username = (await askQuestion("Tên đăng nhập: ")).trim();
    const password = await askHidden("Mật khẩu (ít nhất 12 ký tự): ");
    const confirmation = await askHidden("Nhập lại mật khẩu: ");
    if (password !== confirmation) {
      throw new Error("Hai mật khẩu không khớp.");
    }
    await ensureSchema();
    const createdUsername = await createUser(username, password);
    console.log("Đã tạo tài khoản " + createdUsername + ".");
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error("Không thể tạo tài khoản:", error.message);
  process.exitCode = 1;
});
