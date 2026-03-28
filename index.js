const TelegramBot = require('node-telegram-bot-api');
const admin = require('firebase-admin');

// === INIT TELEGRAM BOT ===
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

// === INIT FIREBASE ===
admin.initializeApp({
  credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_KEY)),
  databaseURL: "https://webinaja-chat-default-rtdb.asia-southeast1.firebasedatabase.app"
});

const db = admin.database();

// ===============================
// 📩 USER → TELEGRAM
// ===============================
db.ref("chats").on("child_added", (snapshot) => {
  const sessionId = snapshot.key;

  db.ref(`chats/${sessionId}/messages`)
    .limitToLast(1)
    .on("child_added", (msgSnap) => {
      const msg = msgSnap.val();

      if (msg.sender === "user") {
        bot.sendMessage(
          6938723754,
          `🆕 Chat Masuk\n\nID: ${sessionId}\nPesan: ${msg.text}`
        );
      }
    });
});

// ===============================
// 📤 TELEGRAM → USER (REPLY SYSTEM)
// ===============================
bot.on("message", (msg) => {
  if (!msg.text) return;

  let sessionId = null;
  let replyText = msg.text;

  // ✅ 1. PRIORITAS: REPLY TELEGRAM
  if (msg.reply_to_message) {
    const originalText = msg.reply_to_message.text;

    if (originalText) {
      const match = originalText.match(/USR-\w+/);
      if (match) {
        sessionId = match[0];
      }
    }
  }

  // ✅ 2. FALLBACK: FORMAT MANUAL (USR-XXXXX ...)
  if (!sessionId) {
    const match = msg.text.match(/^USR-\w+/);
    if (match) {
      sessionId = match[0];
      replyText = msg.text.replace(sessionId, "").trim();
    }
  }

  // ❌ kalau tetap nggak ada ID → skip
  if (!sessionId) return;

  // === KIRIM KE FIREBASE ===
  db.ref(`chats/${sessionId}/messages`).push({
    sender: "admin",
    text: replyText,
    timestamp: Date.now()
  });
});
