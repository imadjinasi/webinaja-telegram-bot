const TelegramBot = require('node-telegram-bot-api');
const admin = require('firebase-admin');

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

admin.initializeApp({
  credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_KEY)),
  databaseURL: "https://webinaja-chat-default-rtdb.asia-southeast1.firebasedatabase.app"
});

const db = admin.database();

db.ref("chats").on("child_added", (snapshot) => {
  const sessionId = snapshot.key;

  db.ref(`chats/${sessionId}/messages`)
    .limitToLast(1)
    .on("child_added", (msgSnap) => {
      const msg = msgSnap.val();

      if (msg.sender === "user") {
        bot.sendMessage(
          6938723754,
          `[${sessionId}] ${msg.text}`
        );
      }
    });
});

bot.on("message", (msg) => {
  const text = msg.text;

  const match = text.match(/^USR-\w+/);
  if (!match) return;

  const sessionId = match[0];
  const reply = text.replace(sessionId, "").trim();

  db.ref(`chats/${sessionId}/messages`).push({
    sender: "admin",
    text: reply,
    timestamp: Date.now()
  });
});
