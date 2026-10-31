const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Asegurar que yt-dlp exista localmente en el servidor
const ytDlpPath = path.join(__dirname, 'yt-dlp');
if (!fs.existsSync(ytDlpPath)) {
  console.log('Descargando binario de yt-dlp...');
  exec('curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o yt-dlp && chmod a+rx yt-dlp', (err) => {
    if (err) console.error('Error al descargar yt-dlp:', err);
    else console.log('yt-dlp descargado correctamente.');
  });
}

app.post('/api/convert', (req, res) => {
  const { videoUrl, format } = req.body;

  if (!videoUrl) {
    return res.status(400).json({ error: 'Ingresa un enlace de YouTube válido.' });
  }

  const qualityCmd = format === 'mp3' 
    ? '-f "bestaudio/best"' 
    : '-f "best[ext=mp4]/best"';

  const activeYtDlp = fs.existsSync(ytDlpPath) ? './yt-dlp' : 'yt-dlp';
  const command = `${activeYtDlp} ${qualityCmd} -g "${videoUrl}"`;

  exec(command, { timeout: 30000 }, (error, stdout, stderr) => {
    if (error) {
      console.error('Error procesando enlace:', error);
      return res.status(500).json({ error: 'No se pudo procesar el video de YouTube.' });
    }

    const downloadUrl = stdout.trim().split('\n')[0];
    return res.json({
      success: true,
      downloadUrl: downloadUrl,
      format: format
    });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor activo en puerto ${PORT}`));
