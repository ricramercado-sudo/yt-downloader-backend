const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const ytDlpPath = path.join(__dirname, 'yt-dlp');

// Función para actualizar yt-dlp a la última versión disponible
function updateYtDlp(callback) {
  console.log('Actualizando yt-dlp a la última versión...');
  exec(`curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o ${ytDlpPath} && chmod a+rx ${ytDlpPath}`, (err) => {
    if (err) console.error('Error al actualizar yt-dlp:', err);
    else console.log('yt-dlp actualizado correctamente.');
    if (callback) callback();
  });
}

// Descargar/actualizar al iniciar el servidor
updateYtDlp();

app.post('/api/convert', (req, res) => {
  let { videoUrl, format } = req.body;

  if (!videoUrl) {
    return res.status(400).json({ error: 'Ingresa un enlace de YouTube válido.' });
  }

  // Limpiar parámetros extra de listas de reproducción si los hubiera
  try {
    const cleanUrl = new URL(videoUrl);
    if (cleanUrl.searchParams.has('v')) {
      videoUrl = `${cleanUrl.origin}${cleanUrl.pathname}?v=${cleanUrl.searchParams.get('v')}`;
    }
  } catch (e) {
    // Si la URL no es estándar, se deja tal cual
  }

  const qualityCmd = format === 'mp3' 
    ? '-f "bestaudio/best"' 
    : '-f "best[ext=mp4]/best"';

  const activeYtDlp = fs.existsSync(ytDlpPath) ? `./yt-dlp` : 'yt-dlp';
  const command = `${activeYtDlp} ${qualityCmd} -g "${videoUrl}"`;

  exec(command, { timeout: 35000 }, (error, stdout, stderr) => {
    if (error) {
      console.error('Error procesando enlace:', stderr || error);
      return res.status(500).json({ error: 'No se pudo procesar el video de YouTube. Intenta de nuevo.' });
    }

    const downloadUrl = stdout.trim().split('\n')[0];
    if (!downloadUrl) {
      return res.status(500).json({ error: 'No se pudo obtener el enlace de descarga.' });
    }

    return res.json({
      success: true,
      downloadUrl: downloadUrl,
      format: format
    });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor activo en puerto ${PORT}`));
