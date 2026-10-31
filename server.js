const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');

const app = express();
app.use(cors());
app.use(express.json());

// Endpoint principal de conversión
app.post('/api/convert', (req, res) => {
  const { videoUrl, format } = req.body;

  if (!videoUrl) {
    return res.status(400).json({ error: 'Ingresa un enlace de YouTube válido.' });
  }

  // Comando de yt-dlp para obtener la URL directa del flujo de audio o video
  const qualityCmd = format === 'mp3' 
    ? '-f "bestaudio/best"' 
    : '-f "best[ext=mp4]/best"';

  const command = `yt-dlp ${qualityCmd} -g "${videoUrl}"`;

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
app.listen(PORT, () => console.log(`Servidor de conversión activo en puerto ${PORT}`));