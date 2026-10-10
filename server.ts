import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function callGeminiWithRetry<T>(fn: () => Promise<T>, retries = 2, delayMs = 1500): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      lastError = err;
      const isRetryable =
        err instanceof Error &&
        (err.message.includes('503') ||
          err.message.includes('high demand') ||
          err.message.includes('UNAVAILABLE') ||
          err.message.includes('429'));
      if (attempt < retries && isRetryable) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * (attempt + 1)));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

function getUserApiKey(req: Request): string | null {
  const headerKey = req.headers['x-gemini-api-key'];
  if (typeof headerKey === 'string' && headerKey.trim()) {
    return headerKey.trim();
  }
  const bodyKey = req.body?.apiKey;
  if (typeof bodyKey === 'string' && bodyKey.trim()) {
    return bodyKey.trim();
  }
  return null;
}

function sanitizeError(err: unknown): string {
  if (err instanceof Error) {
    return err.message.replace(/AIza[0-9A-Za-z-_]{35}/g, '[REDACTED_KEY]');
  }
  return 'Terjadi kesalahan sistem.';
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // Health check endpoint
  app.get('/api/health', (req: Request, res: Response) => {
    const userKey = getUserApiKey(req);
    res.json({
      status: 'ok',
      hasUserKey: Boolean(userKey),
      service: 'SEKAWAN JAYA MULTIMEDIA™ Engine',
    });
  });

  // POST /api/test-key
  app.post('/api/test-key', async (req: Request, res: Response) => {
    try {
      const apiKey = getUserApiKey(req);
      if (!apiKey) {
        return res.status(400).json({
          success: false,
          error: 'Masukkan API key terlebih dahulu sebelum menguji koneksi.',
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: 'Ping connection test',
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        },
      });

      if (response.text !== undefined) {
        return res.json({
          success: true,
          message: 'Koneksi ke Google Gemini API berhasil diverifikasi!',
        });
      }

      return res.status(500).json({
        success: false,
        error: 'Tidak ada respons dari model Gemini.',
      });
    } catch (err: unknown) {
      const sanitized = sanitizeError(err);
      const isAuthError =
        sanitized.includes('API_KEY_INVALID') ||
        sanitized.includes('400') ||
        sanitized.includes('403') ||
        sanitized.includes('API key not valid');
      return res.status(401).json({
        success: false,
        error: isAuthError
          ? 'API Key tidak valid atau tidak memiliki akses ke Gemini 3.8 Flash. Periksa kembali API key Anda.'
          : sanitized,
      });
    }
  });

  // POST /api/plan-music
  app.post('/api/plan-music', async (req: Request, res: Response) => {
    try {
      const apiKey = getUserApiKey(req);
      if (!apiKey) {
        return res.status(401).json({
          error:
            'API key belum dikonfigurasi. Silakan buka menu Pengaturan (ikon roda gigi) di kanan atas dashboard untuk memasukkan Google Gemini API key Anda.',
          code: 'API_KEY_REQUIRED',
        });
      }

      const {
        audience = 'USA',
        genre = 'Pop',
        referenceChannel = '',
        theme = '',
        mood = 'Hangat & santai',
        language = 'English (natural, conversational)',
        vocal = 'Pria — hangat, lembut, dan emosional',
        mode = 'Lagu baru dengan vokal dan lirik',
        format = 'YouTube long video',
        notes = '',
      } = req.body;

      if (!theme || typeof theme !== 'string' || !theme.trim()) {
        return res.status(400).json({
          error: 'Tema proyek wajib diisi untuk menghasilkan musik yang spesifik.',
        });
      }

      const isInstrumental =
        mode.toLowerCase().includes('instrumental') ||
        language.toLowerCase().includes('instrumental') ||
        vocal.toLowerCase().includes('tanpa vokal');

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const systemInstruction = `Anda adalah produser musik senior dan prompt engineer ahli untuk pembuatan musik AI menggunakan Suno, yang bekerja untuk SEKAWAN JAYA MULTIMEDIA™.

ATURAN KETAT UNTUK STYLE OF MUSIC:
1. Hasilkan teks Style of Music orisinal yang ringkas, deskriptif, dan siap langsung di-paste ke kolom "Style of Music" di Suno (maksimal 120-150 kata).
2. Deskripsikan genre & subgenre, groove & beat feel, tempo BPM yang pas, karakter instrumentasi spesifik, tekstur vokal, dinamika produksi, dan atmosfer suara.
3. JANGAN PERNAH memasukkan nama slider Suno (seperti "Style Influence", "Weirdness", "slider") atau angka slider di dalam teks Style of Music! Nilai rekomendasi slider harus ditaruh terpisah di kolom JSON recommendedSettings.
4. Jangan meniru lagu, melodi, lirik, rekaman, atau identitas artis tertentu secara langsung. Ambil inspirasi karakteristik umum produksi, sound design, dan energi.
5. Referensi YouTube channel hanya boleh dipakai jika channel tersebut nyata dan relevan secara estetika, jangan mengarang data popularitas atau statistik palsu.
6. JANGAN PERNAH mengklaim atau menyiratkan slider Suno berubah otomatis. Jelaskan bahwa slider disesuaikan secara manual oleh kreator.

ATURAN KETAT UNTUK LIRIK:
1. Jika bahasa adalah English (atau target USA/UK), gunakan American English yang sangat natural, conversational, autentik seperti penutur asli Amerika Serikat. Hindari rima murahan, frasa klise robotik, atau terjemahan kaku. Makna harus jelas, cerita konsisten, tata bahasa alami, dan tidak menggunakan kalimat acak hanya demi rima.
2. Setiap verse harus memajukan cerita nyata dengan detail konkret. Chorus harus memiliki hook emosional kuat dan pesan utama yang mudah diingat.
3. DILARANG KERAS MENGGUNAKAN BAGIAN [Bridge] ATAU TAG [Bridge]. Jangan buat bridge sama sekali! Buat transisi langsung dari Verse 2 / Pre-Chorus menuju Final Chorus dan Outro.
4. Gunakan struktur section tags resmi Suno: [Intro], [Verse 1], [Pre-Chorus], [Chorus], [Verse 2], [Final Chorus], [Outro].
5. Bagian [Intro] HARUS sangat singkat, target 1 bar sebelum vokal atau instrumen utama langsung masuk.
6. Untuk mode INSTRUMENTAL (tanpa vokal): Jangan tulis lirik kata-kata. Sebagai gantinya, di field lyrics tuliskan aransemen struktur instrumental lengkap dengan section tags Suno (contoh: [Intro - 1 bar drum fill], [Main Groove A], [Synth Lead Hook], [Build-Up], [Climax / Drop], [Outro Fade-out]).`;

      const userPrompt = `Buatkan paket musik orisinal siap pakai untuk Suno berdasarkan brief kreator:
- Target Audiens / Negara: ${audience}
- Genre: ${genre}
- Tema Lagu: ${theme}
- Mood Utama: ${mood}
- Bahasa: ${language}
- Karakter Vokal: ${vocal}
- Mode Produksi: ${mode}
- Format Konten: ${format}
- Channel Referensi (opsional): ${referenceChannel || 'Tidak ada'}
- Catatan Tambahan: ${notes || 'Tidak ada'}
- Mode Instrumental: ${isInstrumental ? 'YA (Tanpa lirik bernyanyi, berikan struktur aransemen instrumental)' : 'TIDAK (Lagu dengan vokal dan lirik orisinal)'}`;

      const response = await callGeminiWithRetry(() =>
        ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: userPrompt,
          config: {
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            systemInstruction,
            responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              titleSuggestions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '2 sampai 3 pilihan judul lagu orisinal yang kuat dan catchy.',
              },
              styleOfMusic: {
                type: Type.STRING,
                description:
                  'Deskripsi Style of Music siap salin ke Suno. Meliputi genre, tempo BPM, groove, instrumen, vokal, sound design. DILARANG menyertakan nama/angka slider Suno.',
              },
              lyrics: {
                type: Type.STRING,
                description:
                  'Lirik lengkap dengan section tags [Intro], [Verse 1], [Pre-Chorus], [Chorus], [Verse 2], [Final Chorus], [Outro]. TANPA [Bridge]. Intro 1 bar. Jika instrumental, berikan detail struktur aransemen.',
              },
              recommendedSettings: {
                type: Type.OBJECT,
                properties: {
                  styleInfluence: {
                    type: Type.STRING,
                    description: 'Rekomendasi nilai internal Style Influence (contoh: 65% - 75% untuk lagu komersial stabil)',
                  },
                  weirdness: {
                    type: Type.STRING,
                    description: 'Rekomendasi nilai internal Weirdness (contoh: 15% - 25% agar aransemen kohesif)',
                  },
                  bpm: {
                    type: Type.STRING,
                    description: 'Tempo yang direkomendasikan (contoh: 94 BPM)',
                  },
                  settingsExplanation: {
                    type: Type.STRING,
                    description: 'Penjelasan singkat mengapa setelan slider ini ideal untuk gaya musik ini.',
                  },
                },
                required: ['styleInfluence', 'weirdness', 'bpm', 'settingsExplanation'],
              },
              producerNotes: {
                type: Type.STRING,
                description:
                  'Catatan produser mengenai aransemen, kecocokan target audiens, dan tips performa di YouTube.',
              },
            },
            required: [
              'titleSuggestions',
              'styleOfMusic',
              'lyrics',
              'recommendedSettings',
              'producerNotes',
            ],
          },
        },
      })
    );

      const responseText = response.text;
      if (!responseText) {
        throw new Error('Model Gemini tidak mengembalikan konten teks.');
      }

      const parsedData = JSON.parse(responseText);
      return res.json({
        success: true,
        data: parsedData,
      });
    } catch (err: unknown) {
      console.error('Error generating music plan:', err);
      const errorMessage =
        err instanceof Error ? err.message : 'Terjadi kegagalan saat memproses permintaan AI.';
      return res.status(500).json({
        error: `Gagal memproses Plan Music: ${errorMessage}`,
      });
    }
  });

  // POST /api/visual-prompt
  app.post('/api/visual-prompt', async (req: Request, res: Response) => {
    try {
      const apiKey = getUserApiKey(req);
      if (!apiKey) {
        return res.status(401).json({
          error:
            'API key belum dikonfigurasi. Silakan buka menu Pengaturan (ikon roda gigi) di kanan atas dashboard untuk memasukkan Google Gemini API key Anda.',
          code: 'API_KEY_REQUIRED',
        });
      }

      const {
        theme = '',
        genre = '',
        mood = '',
        format = 'YouTube Thumbnail (16:9)',
        notes = '',
      } = req.body;

      if (!theme || typeof theme !== 'string' || !theme.trim()) {
        return res.status(400).json({
          error: 'Tema proyek wajib diisi.',
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const prompt = `Anda adalah art director dan visual prompt engineer untuk SEKAWAN JAYA MULTIMEDIA™.
Buatkan paket prompt visual tingkat tinggi untuk musik dengan tema: "${theme}", genre: "${genre}", mood: "${mood}", format: "${format}", catatan: "${notes}".
Berikan prompt siap pakai untuk YouTube Thumbnail (16:9), Cover Art Spotify (1:1), dan Konsep Video/Visualizer Musik.`;

      const response = await callGeminiWithRetry(() =>
        ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              conceptTitle: { type: Type.STRING },
              thumbnailPrompt: { type: Type.STRING, description: 'Prompt 16:9 Midjourney/FLUX dengan focal point tajam' },
              coverArtPrompt: { type: Type.STRING, description: 'Prompt 1:1 Cover Art album/single' },
              videoVisualizerConcept: { type: Type.STRING, description: 'Ide visualizer looping atau music video scene' },
              colorPalette: { type: Type.ARRAY, items: { type: Type.STRING } },
              negativePrompt: { type: Type.STRING },
            },
            required: ['conceptTitle', 'thumbnailPrompt', 'coverArtPrompt', 'videoVisualizerConcept', 'colorPalette', 'negativePrompt'],
          },
        },
      })
    );

      const parsed = JSON.parse(response.text || '{}');
      return res.json({ success: true, data: parsed });
    } catch (err: unknown) {
      console.error('Error generating visual prompt:', err);
      const msg = err instanceof Error ? err.message : 'Kegagalan pemrosesan visual prompt';
      return res.status(500).json({ error: msg });
    }
  });

  // POST /api/trend-research
  app.post('/api/trend-research', async (req: Request, res: Response) => {
    try {
      const apiKey = getUserApiKey(req);
      if (!apiKey) {
        return res.status(401).json({
          error:
            'API key belum dikonfigurasi. Silakan buka menu Pengaturan (ikon roda gigi) di kanan atas dashboard untuk memasukkan Google Gemini API key Anda.',
          code: 'API_KEY_REQUIRED',
        });
      }

      const {
        audience = 'USA',
        genre = 'Pop',
        theme = '',
        notes = '',
      } = req.body;

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const prompt = `Anda adalah music trend analyst untuk SEKAWAN JAYA MULTIMEDIA™.
Analisis tren pasar musik untuk:
- Target: ${audience}
- Genre: ${genre}
- Tema/Fokus: ${theme || 'Top market demand'}
- Catatan: ${notes}

Lakukan validasi tren: sinyal permintaan audiens, analisis diferensiasi pasar, dan 3 rekomendasi eksperimen produksi lagu orisinal.`;

      const response = await callGeminiWithRetry(() =>
        ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              marketSignals: { type: Type.ARRAY, items: { type: Type.STRING } },
              audienceDemographics: { type: Type.STRING },
              contentOpportunities: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    rationale: { type: Type.STRING },
                    suggestedFormat: { type: Type.STRING },
                  },
                  required: ['title', 'rationale', 'suggestedFormat'],
                },
              },
              actionableStrategy: { type: Type.STRING },
            },
            required: ['summary', 'marketSignals', 'audienceDemographics', 'contentOpportunities', 'actionableStrategy'],
          },
        },
      })
    );

      const parsed = JSON.parse(response.text || '{}');
      return res.json({ success: true, data: parsed });
    } catch (err: unknown) {
      console.error('Error generating trend research:', err);
      const msg = err instanceof Error ? err.message : 'Kegagalan pemrosesan riset tren';
      return res.status(500).json({ error: msg });
    }
  });

  // Client static files in production, Vite middleware in development
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SEKAWAN JAYA MULTIMEDIA™] Server active at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting server:', err);
  process.exit(1);
});
