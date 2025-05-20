const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');
const https = require('https');

// Tu token obtenido de BotFather
const token = '7314377304:AAFavnxEksxiWaZ3pZOkhXnmQ31h3TYfslA';

// Crear el bot y conectarnos a Telegram
const bot = new TelegramBot(token, { polling: true });

// Comando /view para convertir y reenviar el archivo
bot.onText(/\/view/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, "¡Envíame un archivo o imagen ViewOnce y lo convertiré a un archivo normal!");
});

// Manejar el archivo recibido
bot.on('photo', (msg) => handleMedia(msg));
bot.on('video', (msg) => handleMedia(msg));

// Función para manejar la conversión y el reenvío
async function handleMedia(msg) {
  const chatId = msg.chat.id;
  const fileId = msg.photo ? msg.photo[msg.photo.length - 1].file_id : msg.video.file_id;

  try {
    // Obtener la URL del archivo
    const file = await bot.getFile(fileId);
    const fileUrl = `https://api.telegram.org/file/bot${token}/${file.file_path}`;

    // Descargar el archivo
    const filePath = path.join(__dirname, 'downloads', file.file_path.split('/').pop());
    await downloadFile(fileUrl, filePath);

    // Reenviar el archivo de vuelta al chat
    if (msg.photo) {
      bot.sendPhoto(chatId, filePath);
    } else if (msg.video) {
      bot.sendVideo(chatId, filePath);
    }

    // Eliminar el archivo descargado
    fs.unlinkSync(filePath);
  } catch (error) {
    console.error('Error al manejar el archivo:', error);
    bot.sendMessage(chatId, 'Hubo un error al procesar el archivo. Intenta nuevamente.');
  }
}

// Función para descargar el archivo desde la URL
function downloadFile(url, filePath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filePath);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => resolve());
      file.on('error', (err) => reject(err));
    });
  });
}
