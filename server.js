const express = require('express');
const cors = require('cors');
const ytdlp = require('yt-dlp-exec');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/convert', async (req, res) => {
  const { videoUrl, format } = req.body;

  if (!videoUrl) {
    return res.status(400).json({ error: 'Ingresa un enlace de YouTube válido.' });
  }

  try {
    const flags = format === 'mp3' 
      ? { getUrl: true, extractAudio: true, audioFormat: 'mp3', f: 'bestaudio/best' }
      : { getUrl: true, f: 'best[ext=mp4]/best' };

    const output = await ytdlp(videoUrl, flags);
    const downloadUrl = output.trim().split('\n')[0];

    if (!downloadUrl) {
      return res.status(500).json({ error: 'No se pudo obtener el enlace de descarga.' });
    }

    return res.json({
      success: true,
      downloadUrl: downloadUrl,
      format: format
    });

  } catch (error) {
    console.error('Error en yt-dlp:', error);
    return res.status(500).json({ error: 'No se pudo procesar el video de YouTube. Intenta de nuevo.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor activo en puerto ${PORT}`));
