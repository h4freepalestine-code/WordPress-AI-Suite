export interface WPPost {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  date: string;
  status: 'draft' | 'publish' | 'scheduled';
  author: string;
  category: string;
  keywords: string[];
  images: string[];
  featuredImage?: string;
  headings?: string[];
  hasAudio?: boolean;
  audioUrl?: string;
}

export interface WPProduct {
  id: string;
  title: string;
  description: string;
  shortDescription: string;
  price: string;
  image: string;
  status: 'draft' | 'publish';
  keywords: string[];
}

export interface AILog {
  id: string;
  action: string;
  model: string;
  promptLength: number;
  responseLength: number;
  tokensUsed: number;
  cost: number;
  timestamp: string;
}

export interface TrainingModel {
  id: string;
  name: string;
  baseModel: string;
  status: 'pending' | 'training' | 'completed' | 'failed';
  datasetSize: number;
  lossHistory: number[];
  dateCreated: string;
}

export interface AIForm {
  id: string;
  name: string;
  shortcode: string;
  fields: { name: string; label: string; type: 'text' | 'textarea' | 'select'; options?: string[] }[];
  systemPrompt: string;
  responseStyle: string;
}

export interface PromptTemplate {
  id: string;
  category: 'seo' | 'creative' | 'copywriting' | 'translation' | 'ecommerce';
  title: string;
  prompt: string;
  description: string;
}

export interface ChatbotSetting {
  systemPrompt: string;
  avatar: string;
  primaryColor: string;
  widgetPosition: 'bottom-right' | 'bottom-left';
  isModerationEnabled: boolean;
  associatedEmbeddingIndexId: string;
  welcomeMessage: string;
  botName: string;
}

export interface EmbeddingIndex {
  id: string;
  name: string;
  sourceType: 'posts' | 'pages' | 'products' | 'custom';
  recordCount: number;
  status: 'unindexed' | 'indexing' | 'indexed';
  lastIndexed: string;
}
