const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

// Reemplaza con tu token de Telegram
const token = '7314377304:AAFavnxEksxiWaZ3pZOkhXnmQ31h3TYfslA';
const bot = new TelegramBot(token, { polling: true });

// URL base de la API
const API_BASE_URL = 'http://c1-ch1.altare.pro:17429/play';

// Comando /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, '¡Hola! Soy un bot de música. Usa /play <nombre de la canción> para buscar una canción.');
});

// Comando /play
bot.onText(/\/play (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const query = encodeURIComponent(match[1]);

  try {
    // Hacer la solicitud a la API
    const response = await axios.get(`${API_BASE_URL}?query=${query}`);
    const data = response.data;

    // Verificar si la solicitud fue exitosa
    if (data.status && data.download.status) {
      const { metadata, download } = data;
      const message = `
🎵 *${metadata.title}*
👤 Artista: ${metadata.author.name}
⏱️ Duración: ${metadata.duration.timestamp}
👀 Vistas: ${metadata.views.toLocaleString()}
📅 Publicado: ${metadata.ago}
🔊 Calidad: ${download.quality}
📥 [Descargar](${download.url})
      `;

      // Enviar mensaje con la información de la canción
      await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });

      // Enviar miniatura si existe
      if (metadata.thumbnail) {
        await bot.sendPhoto(chatId, metadata.thumbnail);
      }

      // Enviar el archivo de audio
      await bot.sendAudio(chatId, download.url, {
        title: metadata.title,
        performer: metadata.author.name,
        duration: metadata.seconds,
        caption: `🎶 ${metadata.title} (${download.quality})`
      });
    } else {
      await bot.sendMessage(chatId, 'Lo siento, no pude encontrar la canción. Intenta con otro nombre.');
    }
  } catch (error) {
    console.error('Error:', error.message);
    await bot.sendMessage(chatId, 'Ocurrió un error al buscar la canción. Por favor, intenta de nuevo.');
  }
});

// Manejo de errores
bot.on('polling_error', (error) => {
  console.error('Polling error:', error.message);
});

console.log('Bot iniciado...');
