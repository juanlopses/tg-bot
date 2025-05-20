const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');
const https = require('https');
const axios = require('axios');  // Necesitamos axios para hacer la subida al API

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
    // Obtener el archivo de Telegram
    const file = await bot.getFile(fileId);

    // Ruta del archivo y crear la carpeta 'downloads' si no existe
    const downloadsDir = path.join(__dirname, 'downloads');
    if (!fs.existsSync(downloadsDir)) {
      fs.mkdirSync(downloadsDir);  // Crear la carpeta 'downloads' si no existe
    }
    const filePath = path.join(downloadsDir, file.file_path.split('/').pop());

    // Descargar el archivo desde Telegram a nuestro sistema local
    await downloadFile(file.file_path, filePath);

    // Subir el archivo al servicio temporal
    const uploadedFileUrl = await uploadFileToTempFiles(filePath);

    // Enviar el archivo de vuelta al chat (en formato foto o video)
    if (msg.photo) {
      bot.sendPhoto(chatId, uploadedFileUrl);
    } else if (msg.video) {
      bot.sendVideo(chatId, uploadedFileUrl);
    }

    // Eliminar el archivo descargado
    fs.unlinkSync(filePath);
  } catch (error) {
    console.error('Error al manejar el archivo:', error);
    bot.sendMessage(chatId, 'Hubo un error al procesar el archivo. Intenta nuevamente.');
  }
}

// Función para descargar el archivo desde la URL de Telegram
function downloadFile(filePath, localPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(localPath);
    const url = `https://api.telegram.org/file/bot${token}/${filePath}`;
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => resolve());
      file.on('error', (err) => reject(err));
    });
  });
}

// Función para subir el archivo al servicio temporal
async function uploadFileToTempFiles(filePath) {
  try {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));

    const response = await axios.post('https://tmpfiles.org/api/v1/upload', formData, {
      headers: formData.getHeaders(),
    });

    // Devolver la URL temporal del archivo
    return response.data.file_url;
  } catch (error) {
    console.error('Error al subir el archivo a tmpfiles:', error);
    throw new Error('No se pudo subir el archivo.');
  }
}
