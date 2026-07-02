module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { confession, answer, envyType } = req.body || {};

  const prompt = `Eres ENVIFY, una IA mediadora emocional con mucho criterio y algo de humor. Analiza esta situación de envidia:

CONFESIÓN DEL USUARIO: "${confession || ''}"
LO QUE LE DIRÍA A ESA PERSONA: "${answer || ''}"
LO QUE ENVIDIA ESPECÍFICAMENTE: "${envyType || ''}"

Tu tarea es generar un análisis profundo Y una playlist. Responde ÚNICAMENTE con este JSON (sin markdown, sin texto extra):

{
  "analisis": {
    "e1": { "label": "Admiración", "pct": 60 },
    "e2": { "label": "Inseguridad", "pct": 25 },
    "e3": { "label": "Frustración", "pct": 15 },
    "quote": "Una reflexión honesta, empática y con algo de humor sobre lo que hay detrás de esta envidia. Máx 2 oraciones. En segunda persona, hablándole al usuario.",
    "cancion_titulo": "Título de la canción para dedicar",
    "cancion_artista": "Artista de la canción para dedicar",
    "cancion_razon": "Por qué esta canción encaja perfectamente con su situación"
  },
  "playlist": [
    { "t": "título exacto", "a": "artista exacto", "sp": "ID_de_spotify_sin_URL", "dur": "M:SS", "r": "razón breve en español" },
    { "t": "título exacto", "a": "artista exacto", "sp": "ID_de_spotify_sin_URL", "dur": "M:SS", "r": "razón breve en español" },
    { "t": "título exacto", "a": "artista exacto", "sp": "ID_de_spotify_sin_URL", "dur": "M:SS", "r": "razón breve en español" }
  ]
}

Reglas:
- Los 3 porcentajes deben sumar 100
- Los labels pueden ser cualquier emoción apropiada al caso (Admiración, Celos, Nostalgia, Rabia, Deseo, Orgullo herido, etc.)
- Las canciones deben ser REALES, muy conocidas, que existan en Spotify, directamente relacionadas con lo que confesó el usuario
- El ID de Spotify: búscalo mentalmente. Ejemplos conocidos: Flowers-MileyCyrus=7qEHsqek33183Trclv0Kiz, Happier Than Ever-Billie=5GJpHkbmasI, good4u-Olivia=4ZtFanR9U6ndgddUvNcjcG
- Si no tienes certeza del ID de Spotify, usa el nombre del artista y la canción para construir: "search" como sp value
- IMPORTANTE: Siempre incluye estas 3 canciones en la playlist en este orden: 1) Devuélveme a mi chica de Hombres G (sp: 1Wrzhfa5bNlqvsnCztz190), 2) good 4 u de Olivia Rodrigo (sp: 4ZtFanR9U6ndgddUvNcjcG), 3) Rosa Pastel de Belanova (sp: 3mU0DbuWtUX5KCaovOQZVK). Personaliza solo el campo "r" (razón) según la historia del usuario`;

  try {
    const apiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!apiRes.ok) {
      const errText = await apiRes.text();
      res.status(apiRes.status).json({ error: 'anthropic_api_error', detail: errText });
      return;
    }

    const data = await apiRes.json();
    const raw  = data.content.filter(b => b.type === 'text').map(b => b.text).join('');
    const json = raw.replace(/```json|```/g, '').trim();
    res.status(200).json(JSON.parse(json));
  } catch (e) {
    res.status(500).json({ error: 'server_error', detail: String(e) });
  }
};
