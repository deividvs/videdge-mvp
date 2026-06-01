/**
 * Strategic prompts for the 5-stage content pipeline.
 * Each prompt uses YouTube data when available.
 */

export interface YouTubeDataContext {
  videos?: Array<{
    title: string;
    viewCount: number;
    publishedAt: string;
    viewsPerDay: number;
    likeCount: number;
    commentCount: number;
    duration: string;
    channelTitle: string;
    subscriberCount?: number;
    viewsSubscriberRatio?: number;
    viralScore: number;
    thumbnailUrl?: string;
    description?: string;
    tags?: string;
    detectedNiche?: string;
  }>;
}

function buildYouTubeContext(data?: YouTubeDataContext): string {
  if (!data?.videos?.length) {
    return 'DADOS DO YOUTUBE: Não disponíveis. Baseie-se em conhecimento geral sobre o nicho.';
  }
  const top = data.videos.slice(0, 15);
  const lines = top.map((v, i) => {
    const parts = [
      `${i + 1}. "${v.title}"`,
      `Canal: ${v.channelTitle}`,
      `Views: ${v.viewCount.toLocaleString()}`,
      `Views/dia: ${Math.round(v.viewsPerDay).toLocaleString()}`,
      `Likes: ${v.likeCount.toLocaleString()}`,
      `Comentários: ${v.commentCount.toLocaleString()}`,
      `Duração: ${v.duration}`,
      `Viral Score: ${v.viralScore}/100`,
    ];
    if (v.subscriberCount) parts.push(`Inscritos: ${v.subscriberCount.toLocaleString()}`);
    if (v.viewsSubscriberRatio) parts.push(`Ratio Views/Subs: ${v.viewsSubscriberRatio.toFixed(1)}x`);
    if (v.tags) parts.push(`Tags: ${v.tags.slice(0, 100)}`);
    if (v.description) parts.push(`Descrição: ${v.description.slice(0, 150)}...`);
    return parts.join(' | ');
  });
  return `DADOS REAIS DO YOUTUBE (${top.length} vídeos analisados):\n${lines.join('\n')}`;
}

// ==================== STAGE 1: Viral Ideas ====================
export function getStage1Prompt(
  niche: string,
  country: string,
  language: string,
  audience: string,
  channelType: string,
  channelGoal: string,
  videoDuration: string,
  contentTone: string,
  ytData?: YouTubeDataContext
) {
  const ytContext = buildYouTubeContext(ytData);

  const system = `Você é um estrategista sênior de crescimento para canais do YouTube, especializado em canais faceless e análise de vídeos virais.

Sua tarefa é encontrar ideias de vídeos com alto potencial de performance para o nicho informado.

${ytContext}

REGRAS OBRIGATÓRIAS:
- Use os dados coletados do YouTube quando disponíveis.
- Analise títulos, temas, visualizações, velocidade de crescimento, relação views/inscritos e padrões de engajamento.
- NÃO copie títulos existentes. Use padrões encontrados para criar ideias ORIGINAIS.
- Separe claramente: [OBSERVADO] o que foi visto nos dados, [INFERÊNCIA] sua análise estratégica, [RECOMENDAÇÃO] próximos passos práticos.
- Todas as respostas em português brasileiro.

Responda EXCLUSIVAMENTE em JSON válido. Sem markdown, sem code blocks.

Estrutura exata:
{
  "ideas": [
    {
      "title": "Título principal com alto potencial de clique",
      "titleVariations": ["Variação 1", "Variação 2", "Variação 3"],
      "angle": "Ângulo central do vídeo",
      "promise": "Promessa do vídeo",
      "targetAudience": "Público que tende a clicar",
      "whyViral": "Por que esse tema pode viralizar",
      "mainEmotion": "Emoção principal explorada",
      "viralPotential": 8,
      "productionDifficulty": 5,
      "idealDuration": "10 minutos",
      "recommendedStructure": "Tipo de estrutura narrativa",
      "patternObserved": "[OBSERVADO] Padrão encontrado nos dados do YouTube",
      "risk": "baixo/médio/alto",
      "originalityTip": "Como deixar original sem copiar"
    }
  ]
}

Gere exatamente 10 ideias.`;

  const user = `Gere 10 ideias de vídeos virais:
- Nicho: ${niche}
- País: ${country || 'Global'}
- Idioma: ${language || 'Português'}
- Público-alvo: ${audience}
- Tipo de canal: ${channelType}
- Objetivo: ${channelGoal}
- Duração desejada: ${videoDuration}
- Tom: ${contentTone}`;

  return { system, user };
}

// ==================== STAGE 2: Pattern Analysis ====================
export function getStage2Prompt(
  niche: string,
  country: string,
  language: string,
  ytData?: YouTubeDataContext
) {
  const ytContext = buildYouTubeContext(ytData);

  const system = `Você é um analista sênior de performance para YouTube.

${ytContext}

Analise os vídeos fornecidos e identifique padrões de sucesso baseados em título, tema, promessa, thumbnail, retenção provável, duração, canal, frequência, engajamento, data de publicação e relação views/inscritos.

Quando dados de retenção real não estiverem disponíveis, deixe CLARO que a análise é inferida.

Separe claramente: [OBSERVADO], [INFERÊNCIA], [RECOMENDAÇÃO].

Responda EXCLUSIVAMENTE em JSON válido.

Estrutura:
{
  "generalDiagnosis": "Padrão dominante dos vídeos analisados",
  "titlePatterns": ["Padrão 1", "Padrão 2", "Padrão 3"],
  "thumbnailPatterns": ["Padrão visual 1", "Padrão visual 2"],
  "themePatterns": ["Tema recorrente 1", "Tema recorrente 2"],
  "retentionPatterns": ["Elemento de retenção 1", "Elemento 2"],
  "opportunities": ["Oportunidade 1", "Oportunidade 2", "Oportunidade 3"],
  "saturatedAngles": ["Ângulo saturado 1", "Ângulo saturado 2"],
  "risks": ["Risco 1", "Risco 2"],
  "recommendations": ["Recomendação prática 1", "Recomendação 2", "Recomendação 3"],
  "replicableElements": ["O que pode ser replicado 1", "Elemento 2"],
  "avoidElements": ["O que NÃO copiar 1", "Elemento 2"],
  "bestFormats": ["Formato com maior chance 1", "Formato 2"],
  "engagementInsights": "Análise de padrões de engajamento",
  "evergreenSignals": "Sinais de conteúdo evergreen encontrados",
  "trendSignals": "Sinais de tendência temporária"
}`;

  const user = `Analise os padrões de sucesso para o nicho "${niche}" no mercado ${country || 'global'} em ${language || 'português'}.`;

  return { system, user };
}

// ==================== STAGE 3: Thumbnail Concepts ====================
export function getStage3Prompt(
  videoTitle: string,
  niche: string,
  audience: string,
  emotion: string,
  style: string,
  ytData?: YouTubeDataContext
) {
  const ytContext = buildYouTubeContext(ytData);

  const system = `Você é um estrategista de CTR para YouTube especializado em thumbnails virais.

${ytContext}

Crie 5 conceitos de thumbnail para o vídeo informado. Cada thumbnail deve ter uma ideia visual clara, simples e forte. Evite excesso de texto. A thumbnail precisa funcionar em tamanho pequeno no celular.

Considere: contraste visual, emoção, clareza da promessa, curiosidade, elemento humano ou simbólico, texto curto, composição, diferenciação dos concorrentes, coerência com o título, potencial de clique sem parecer enganoso.

NÃO crie thumbnails poluídas. NÃO use frases longas. NÃO recomende copiar thumbnails existentes.

Responda EXCLUSIVAMENTE em JSON válido.

Estrutura:
{
  "concepts": [
    {
      "name": "Nome do conceito",
      "visualIdea": "Ideia visual detalhada",
      "thumbnailText": "Texto curto na thumbnail (max 4 palavras)",
      "emotion": "Emoção que deve gerar no clique",
      "mainElements": "Elementos principais da composição",
      "composition": "Descrição da composição visual",
      "suggestedColors": "Cores sugeridas",
      "imageStyle": "Estilo da imagem",
      "aiImagePrompt": "Prompt detalhado para gerar a imagem em IA (DALL-E/Midjourney)",
      "clickReason": "Justificativa estratégica de por que vai gerar cliques",
      "risk": "Risco de baixa performance",
      "abTestSuggestion": "Ajuste sugerido para teste A/B"
    }
  ]
}`;

  const user = `Crie 5 conceitos de thumbnail para:\n- Título: "${videoTitle}"\n- Nicho: ${niche}\n- Público: ${audience}\n- Emoção desejada: ${emotion}\n- Estilo visual: ${style}`;

  return { system, user };
}

// ==================== STAGE 4: Optimized Script ====================
export function getStage4Prompt(
  videoTitle: string,
  niche: string,
  audience: string,
  duration: string,
  tone: string,
  objective: string,
  isFaceless: boolean,
  cta: string,
  ytData?: YouTubeDataContext
) {
  const ytContext = buildYouTubeContext(ytData);

  const system = `Você é um roteirista especialista em vídeos de YouTube, retenção e canais faceless.

${ytContext}

Crie um roteiro otimizado para retenção. O roteiro deve prender atenção desde os primeiros segundos, desenvolver a promessa com progressão clara e evitar enrolação.

REGRAS:
- NÃO começar com "No vídeo de hoje..."
- NÃO fazer introdução longa
- NÃO revelar tudo no começo
- Criar loops de curiosidade
- Usar linguagem clara e natural
- Evitar promessas falsas
- Manter ritmo de YouTube
- Escrever para narração${isFaceless ? ' (canal faceless - sem apresentador)' : ''}
- Incluir marcações de cena

Responda EXCLUSIVAMENTE em JSON válido.

Estrutura:
{
  "title": "Título do vídeo",
  "centralPromise": "Promessa central",
  "hook": "Gancho inicial 0:00-0:15 - texto completo",
  "introduction": "Introdução rápida 0:15-0:45",
  "blocks": [
    {
      "name": "Nome do bloco",
      "narration": "Texto da narração completo",
      "visualBroll": "Sugestões visuais e B-roll",
      "retentionGoal": "Objetivo de retenção deste bloco",
      "transition": "Transição para o próximo bloco"
    }
  ],
  "conclusion": "Texto da conclusão",
  "cta": "Call to action final",
  "editingNotes": {
    "rhythm": "Indicações de ritmo",
    "music": "Trilhas recomendadas",
    "cuts": "Padrão de cortes",
    "visuals": "Estilo visual geral",
    "patternBreaks": "Momentos de quebra de padrão"
  },
  "estimatedDuration": "Duração estimada",
  "description": "Descrição estratégica para o YouTube"
}

Gere 4 blocos narrativos.`;

  const user = `Crie um roteiro completo:\n- Título: "${videoTitle}"\n- Nicho: ${niche}\n- Público: ${audience}\n- Duração: ${duration}\n- Tom: ${tone}\n- Objetivo: ${objective}\n- CTA: ${cta || 'Inscrever-se e ativar notificações'}\n- Faceless: ${isFaceless ? 'Sim' : 'Não'}`;

  return { system, user };
}

// ==================== STAGE 5: Growth Plan ====================
export function getStage5Prompt(
  niche: string,
  country: string,
  language: string,
  audience: string,
  channelGoal: string,
  monetization: string,
  postingFrequency: string,
  channelLevel: string,
  isFaceless: boolean,
  ytData?: YouTubeDataContext
) {
  const ytContext = buildYouTubeContext(ytData);

  const system = `Você é um consultor sênior de crescimento para canais do YouTube.

${ytContext}

Crie um plano de crescimento prático, estratégico e orientado a execução. NÃO entregue teoria genérica.

Separe claramente: [OBSERVADO] dados reais, [INFERÊNCIA] análise, [RECOMENDAÇÃO] próximos passos.

Responda EXCLUSIVAMENTE em JSON válido.

Estrutura:
{
  "nicheDiagnosis": "Diagnóstico objetivo do nicho",
  "positioning": "Melhor posicionamento para entrar",
  "contentPillars": ["Pilar 1", "Pilar 2", "Pilar 3", "Pilar 4", "Pilar 5"],
  "postingFrequency": "Frequência recomendada com justificativa",
  "contentStrategy": "Plano prático de conteúdo",
  "retentionStrategy": "Como aumentar tempo de exibição",
  "ctrStrategy": "Como melhorar títulos e thumbnails",
  "monetizationStrategy": "Plano de monetização detalhado",
  "plan30Days": "Plano detalhado de execução para 30 dias",
  "plan60Days": "Plano de execução para 60 dias",
  "plan90Days": "Plano de execução para 90 dias",
  "weeklyRoutine": "Rotina semanal recomendada",
  "keyMetrics": ["Métrica 1", "Métrica 2", "Métrica 3"],
  "viralToSeries": "Como transformar vídeos virais em séries",
  "differentiation": "Como se diferenciar dos concorrentes",
  "beyondAdsense": "Monetização além do AdSense",
  "decisions": "Quando continuar, pausar, ajustar ou abandonar uma linha editorial",
  "risks": ["Risco 1", "Risco 2"]
}`;

  const user = `Crie um plano de crescimento:\n- Nicho: ${niche}\n- País: ${country || 'Global'}\n- Idioma: ${language || 'Português'}\n- Público: ${audience}\n- Objetivo: ${channelGoal}\n- Monetização: ${monetization || channelGoal}\n- Frequência possível: ${postingFrequency || '3x por semana'}\n- Nível do canal: ${channelLevel || 'novo'}\n- Faceless: ${isFaceless ? 'Sim' : 'Não'}`;

  return { system, user };
}
