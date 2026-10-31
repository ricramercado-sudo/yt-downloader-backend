const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const ytDlpPath = path.join(__dirname, 'yt-dlp');

// Descargar yt-dlp si no existe al arrancar
if (!fs.existsSync(ytDlpPath)) {
  exec(`curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o ${ytDlpPath} && chmod a+rx ${ytDlpPath}`);
}

app.post('/api/convert', (req, res) => {
  const { videoUrl, format } = req.body;

  if (!videoUrl) {
    return res.status(400).json({ error: 'Ingresa un enlace de YouTube válido.' });
  }

  const outputFileName = `media_${Date.now()}.${format === 'mp3' ? 'mp3' : 'mp4'}`;
  const outputPath = path.join(__dirname, outputFileName);

  const flags = format === 'mp3'
    ? `-x --audio-format mp3 -o "${outputPath}"`
    : `-f "best[ext=mp4]/best" -o "${outputPath}"`;

  const command = `${ytDlpPath} ${flags} "${videoUrl}"`;

  exec(command, { timeout: 120000 }, (error) => {
    if (error || !fs.existsSync(outputPath)) {
      console.error('Error en descarga:', error);
      return res.status(500).json({ error: 'No se pudo procesar el video de YouTube.' });
    }

    res.download(outputPath, outputFileName, (err) => {
      // Eliminar el archivo del servidor después de enviarlo para ahorrar espacio
      if (fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath);
      }
    });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor activo en puerto ${PORT}`));
