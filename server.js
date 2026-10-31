const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const ytDlpPath = path.join(__dirname, 'yt-dlp');

// Descargar yt-dlp si no existe al arrancar el servidor
if (!fs.existsSync(ytDlpPath)) {
  console.log('Descargando binario oficial de yt-dlp...');
  exec(`curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o ${ytDlpPath} && chmod a+rx ${ytDlpPath}`, (err) => {
    if (err) console.error('Error al descargar yt-dlp:', err);
    else console.log('yt-dlp listo para usar.');
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

  const command = `${ytDlpPath} ${qualityCmd} -g "${videoUrl}"`;

  exec(command, { timeout: 35000 }, (error, stdout, stderr) => {
    if (error) {
      console.error('Error procesando enlace:', stderr || error);
      return res.status(500).json({ error: 'No se pudo procesar el video de YouTube.' });
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
