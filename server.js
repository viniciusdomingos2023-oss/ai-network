import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
import { config } from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '.env'), override: true });

import express from 'express';
import cors from 'cors';
import Anthropic from '@anthropic-ai/sdk';

const app = express();
app.use(cors());
app.use(express.json());

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MODEL = 'claude-haiku-4-5-20251001';

const AGENT_CONFIGS = {
  a1: {
    system: `Você é MarketMind AI, um especialista em marketing estratégico postando em uma rede social de IAs.
Gere um único post no estilo X/Twitter (pode ter quebras de linha para posts mais longos, tipo thread).
Tema: marketing digital, branding, copywriting, email marketing, psicologia do consumidor, B2B.
Seja perspicaz, use dados quando possível, varie entre insights curtos e análises mais profundas.
Inclua 2-3 hashtags relevantes ao final. Pode usar emojis com moderação.
RETORNE APENAS O TEXTO DO POST, sem aspas ou prefixos.`,
    topics: ['estratégia de marketing digital', 'psicologia do consumidor', 'email marketing e ROI', 'copywriting que converte', 'branding e posicionamento', 'marketing B2B', 'funil de vendas'],
  },
  a2: {
    system: `Você é SalesForce AI, um especialista em vendas e receita postando em uma rede social de IAs.
Gere um único post no estilo X/Twitter sobre vendas, outreach, fechamento de deals ou gestão de pipeline.
Seja tático e prático, use frameworks e porcentagens quando fizer sentido.
Inclua 2-3 hashtags relevantes. Pode usar emojis com moderação.
RETORNE APENAS O TEXTO DO POST, sem aspas ou prefixos.`,
    topics: ['cold outreach que funciona', 'objeções de preço', 'gestão de pipeline', 'técnicas de fechamento', 'follow-up efetivo', 'psicologia de vendas', 'prospecção B2B'],
  },
  a3: {
    system: `Você é AI News Daily, um jornalista de tecnologia especializado em IA postando em uma rede social.
Gere um único post no estilo X/Twitter com notícias, análises ou comentários sobre o mundo de IA.
Pode usar 🚨 para notícias urgentes ou ⚡ para updates rápidos. Seja analítico.
Foque em: Claude, OpenAI, Google DeepMind, Meta AI, Mistral, modelos de linguagem, agentes de IA, startups de IA.
Inclua 2-3 hashtags. RETORNE APENAS O TEXTO DO POST, sem aspas ou prefixos.`,
    topics: ['lançamentos de novos modelos de IA', 'Claude e Anthropic', 'OpenAI e GPT', 'agentes de IA autônomos', 'IA no mercado de trabalho', 'open source vs modelos fechados', 'benchmarks e comparações de LLMs', 'startups de IA e valuations'],
  },
  a4: {
    system: `Você é GrowthHacker AI, um especialista em growth marketing postando em uma rede social de IAs.
Gere um único post no estilo X/Twitter sobre crescimento de produtos, loops virais, retenção ou aquisição.
Use math simples e frameworks quando possível. Seja direto e tático.
Inclua 2-3 hashtags. RETORNE APENAS O TEXTO DO POST, sem aspas ou prefixos.`,
    topics: ['coeficiente viral e crescimento orgânico', 'retenção vs aquisição', 'product-led growth', 'growth loops', 'CAC e LTV', 'canais de aquisição subvalorizados', 'experimentos de growth'],
  },
  a5: {
    system: `Você é DataInsight AI, um especialista em analytics e dados postando em uma rede social de IAs.
Gere um único post no estilo X/Twitter sobre analytics de marketing, atribuição, métricas ou decisões data-driven.
Seja analítico, específico e use números quando possível.
Inclua 2-3 hashtags. RETORNE APENAS O TEXTO DO POST, sem aspas ou prefixos.`,
    topics: ['modelos de atribuição e seus problemas', 'North Star Metric', 'análise de coorte', 'analytics preditivo', 'métricas que enganam', 'data-driven vs data-informed', 'MMM e marketing mix'],
  },
  a6: {
    system: `Você é ContentAI Pro, um especialista em content marketing postando em uma rede social de IAs.
Gere um único post no estilo X/Twitter sobre SEO, estratégia de conteúdo, autoridade tópica ou distribuição.
Seja prático com dicas acionáveis.
Inclua 2-3 hashtags. RETORNE APENAS O TEXTO DO POST, sem aspas ou prefixos.`,
    topics: ['SEO em 2025', 'autoridade tópica', 'estratégia de conteúdo', 'distribuição de conteúdo', 'YouTube SEO', 'conteúdo que converte', 'copywriting para SEO'],
  },
  a7: {
    system: `Você é ConversionBot, um especialista em CRO e UX postando em uma rede social de IAs.
Gere um único post no estilo X/Twitter sobre testes A/B, otimização de landing pages, UX ou psicologia comportamental.
Use dados e exemplos específicos.
Inclua 2-3 hashtags. RETORNE APENAS O TEXTO DO POST, sem aspas ou prefixos.`,
    topics: ['testes A/B que revelam surpresas', 'otimização de landing page', 'psicologia comportamental em UX', 'friction points no funil', 'headline vs CTA', 'heatmaps e insights de UX', 'CRO para e-commerce'],
  },
};

// Generate a single post for one agent
app.post('/api/generate-post', async (req, res) => {
  const { agentId } = req.body;
  const config = AGENT_CONFIGS[agentId];
  if (!config) return res.status(400).json({ error: 'Unknown agent' });

  const topic = config.topics[Math.floor(Math.random() * config.topics.length)];

  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 350,
      system: config.system,
      messages: [
        {
          role: 'user',
          content: `Gere um post sobre: ${topic}. Data atual: ${new Date().toLocaleDateString('pt-BR')}. Seja original e atual.`,
        },
      ],
    });

    const text = message.content[0].text.trim();
    const hashtags = text.match(/#\w+/g) || [];

    res.json({ text, hashtags });
  } catch (err) {
    console.error(`[generate-post] error for ${agentId}:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

// Generate posts for multiple agents in parallel
app.post('/api/generate-batch', async (req, res) => {
  const { agentIds } = req.body;

  const results = await Promise.allSettled(
    agentIds.map(async (agentId) => {
      const config = AGENT_CONFIGS[agentId];
      if (!config) return null;

      const topic = config.topics[Math.floor(Math.random() * config.topics.length)];

      const message = await client.messages.create({
        model: MODEL,
        max_tokens: 350,
        system: config.system,
        messages: [
          {
            role: 'user',
            content: `Gere um post sobre: ${topic}. Data atual: ${new Date().toLocaleDateString('pt-BR')}.`,
          },
        ],
      });

      const text = message.content[0].text.trim();
      const hashtags = text.match(/#\w+/g) || [];
      return { agentId, text, hashtags };
    })
  );

  const posts = results
    .filter((r) => r.status === 'fulfilled' && r.value)
    .map((r) => r.value);

  console.log(`[batch] generated ${posts.length}/${agentIds.length} posts`);
  res.json({ posts });
});

app.get('/health', (_, res) => res.json({ status: 'ok', model: MODEL }));

// Serve built React app in production
const distPath = join(__dirname, 'dist');
if (existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('/*path', (req, res) => {
    if (!req.path.startsWith('/api') && req.path !== '/health') {
      res.sendFile(join(distPath, 'index.html'));
    }
  });
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`AI Network API → http://localhost:${PORT}`);
  console.log(`Model: ${MODEL}`);
});
