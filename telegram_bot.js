const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const os = require('os');

// Reemplaza con tu token de Telegram
const token = '7314377304:AAFavnxEksxiWaZ3pZOkhXnmQ31h3TYfslA';
const bot = new TelegramBot(token, { polling: true });

// URLs de las APIs
const MUSIC_API_URL = 'http://c1-ch1.altare.pro:17429/play';
const VIDEO_API_URL = 'http://c1-ch1.altare.pro:17429/play2';
const IP_API_URL = 'https://api.ipify.org?format=json';

// Función para obtener el uso de recursos
function getServerResources() {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const memUsagePercent = ((usedMem / totalMem) * 100).toFixed(2);
  const cpuCount = os.cpus().length;
  const loadAvg = os.loadavg()[0].toFixed(2);

  return {
    memory: {
      total: (totalMem / 1024 / 1024 / 1024).toFixed(2),
      used: (usedMem / 1024 / 1024 / 1024).toFixed(2),
      free: (freeMem / 1024 / 1024 / 1024).toFixed(2),
      usagePercent: memUsagePercent
    },
    cpu: {
      cores: cpuCount,
      loadAvg: loadAvg
    }
  };
}

// Función para medir el ping a la API de música
async function measurePing() {
  const start = Date.now();
  try {
    await axios.get(MUSIC_API_URL, { timeout: 5000 });
    const end = Date.now();
    return end - start;
  } catch (error) {
    return 'No se pudo conectar';
  }
}

// Comando /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const message = `
🎉 *¡Bienvenido al Bot de Música y Video!* 🎉
Usa estos comandos para disfrutar:
🎶 */play <canción>* - Busca y descarga una canción.
🎥 */play2 <video>* - Busca y descarga un video.
🏓 */ping* - Revisa el estado del servidor.
¡Escribe tu comando y diviértete! 😄
  `;
  bot.sendMessage(chatId, message, { parse_mode: 'Markdown' })
    .then(() => bot.sendMessage(chatId, '😊 ¡Listo para ayudarte!'));
});

// Comando /play
bot.onText(/\/play (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const messageId = msg.message_id;
  const query = encodeURIComponent(match[1]);

  try {
    await bot.sendMessage(chatId, '🔎 Buscando tu canción...', { reply_to_message_id: messageId });
    const response = await axios.get(`${MUSIC_API_URL}?query=${query}`);
    const data = response.data;

    if (data.status && data.download.status) {
      const { metadata, download } = data;
      const message = `
🎶 *¡Encontré tu canción!* 🎵
📌 *Título*: ${metadata.title}
👤 *Artista*: ${metadata.author.name}
⏱️ *Duración*: ${metadata.duration.timestamp}
👀 *Vistas*: ${metadata.views.toLocaleString()}
📅 *Publicado*: ${metadata.ago}
🔊 *Calidad*: ${download.quality}
📥 [Descargar](${download.url})
      `;

      await bot.sendMessage(chatId, message, { parse_mode: 'Markdown', reply_to_message_id: messageId });

      if (metadata.thumbnail) {
        await bot.sendPhoto(chatId, metadata.thumbnail, { caption: '🖼️ Miniatura del video' });
      }

      await bot.sendAudio(chatId, download.url, {
        title: metadata.title,
        performer: metadata.author.name,
        duration: metadata.seconds,
        caption: `🎶 ${metadata.title} (${download.quality})`
      });

      await bot.sendMessage(chatId, '✅ ¡Canción enviada! 🎧', { reply_to_message_id: messageId });
    } else {
      await bot.sendMessage(chatId, '😔 No encontré la canción. Prueba con otro nombre.', { reply_to_message_id: messageId });
    }
  } catch (error) {
    console.error('Error en /play:', error.message);
    await bot.sendMessage(chatId, '❌ ¡Ups! Algo salió mal. Intenta de nuevo.', { reply_to_message_id: messageId });
  }
});

// Comando /play2
bot.onText(/\/play2 (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const messageId = msg.message_id;
  const query = encodeURIComponent(match[1]);

  try {
    await bot.sendMessage(chatId, '🔎 Buscando tu video...', { reply_to_message_id: messageId });
    const response = await axios.get(`${VIDEO_API_URL}?query=${query}`);
    const data = response.data;

    if (data.status && data.download.status) {
      const { metadata, download } = data;
      const message = `
🎥 *¡Encontré tu video!* 📹
📌 *Título*: ${metadata.title}
👤 *Artista*: ${metadata.author.name}
⏱️ *Duración*: ${metadata.duration.timestamp}
👀 *Vistas*: ${metadata.views.toLocaleString()}
📅 *Publicado*: ${metadata.ago}
📺 *Calidad*: ${download.quality}
📥 [Descargar](${download.url})
      `;

      await bot.sendMessage(chatId, message, { parse_mode: 'Markdown', reply_to_message_id: messageId });

      if (metadata.thumbnail) {
        await bot.sendPhoto(chatId, metadata.thumbnail, { caption: '🖼️ Miniatura del video' });
      }

      await bot.sendVideo(chatId, download.url, {
        duration: metadata.seconds,
        caption: `🎥 ${metadata.title} (${download.quality})`,
        supports_streaming: true
      });

      await bot.sendMessage(chatId, '✅ ¡Video enviado! 📺', { reply_to_message_id: messageId });
    } else {
      await bot.sendMessage(chatId, '😔 No encontré el video. Prueba con otro nombre.', { reply_to_message_id: messageId });
    }
  } catch (error) {
    console.error('Error en /play2:', error.message);
    await bot.sendMessage(chatId, '❌ ¡Ups! Algo salió mal. Intenta de nuevo.', { reply_to_message_id: messageId });
  }
});

// Comando /ping
bot.onText(/\/ping/, async (msg) => {
  const chatId = msg.chat.id;
  const messageId = msg.message_id;

  try {
    await bot.sendMessage(chatId, '🏓 Comprobando estado del servidor...', { reply_to_message_id: messageId });
    const ipResponse = await axios.get(IP_API_URL);
    const ip = ipResponse.data.ip || 'No disponible';
    const resources = getServerResources();
    const ping = await measurePing();

    const message = `
🏓 *Estado del Servidor* 🖥️
🌐 *IP Pública*: ${ip}
💾 *Memoria*:
  - Total: ${resources.memory.total} GB
  - Usada: ${resources.memory.used} GB
  - Libre: ${resources.memory.free} GB
  - Uso: ${resources.memory.usagePercent}%
🖥️ *CPU*:
  - Núcleos: ${resources.cpu.cores}
  - Carga promedio: ${resources.cpu.loadAvg}
⏱️ *Ping a API*: ${typeof ping === 'number' ? `${ping} ms` : ping}
    `;

    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown', reply_to_message_id: messageId });
    await bot.sendMessage(chatId, '✅ ¡Servidor en línea! 🚀');
  } catch (error) {
    console.error('Error en /ping:', error.message);
    await bot.sendMessage(chatId, '❌ Error al comprobar el servidor. Intenta de nuevo.', { reply_to_message_id: messageId });
  }
});

// Manejo de errores
bot.on('polling_error', (error) => {
  console.error('Polling error:', error.message);
});

console.log('Bot iniciado...');
