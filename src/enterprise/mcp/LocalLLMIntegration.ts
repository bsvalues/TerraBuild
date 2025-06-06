import axios from 'axios';
import { EventEmitter } from 'events';

interface LLMConfig {
  provider: 'ollama' | 'llamacpp' | 'vllm' | 'tgi';
  baseUrl: string;
  model: string;
  apiKey?: string;
  maxTokens: number;
  temperature: number;
  timeout: number;
}

interface RAGConfig {
  vectorStore: 'chroma' | 'faiss' | 'weaviate' | 'pinecone';
  embeddingModel: string;
  chunkSize: number;
  chunkOverlap: number;
  topK: number;
  scoreThreshold: number;
}

interface MCPMessage {
  id: string;
  type: 'request' | 'response' | 'notification';
  method?: string;
  params?: any;
  result?: any;
  error?: any;
}

interface DocumentChunk {
  id: string;
  content: string;
  metadata: {
    source: string;
    page?: number;
    section?: string;
    timestamp: string;
  };
  embedding?: number[];
  score?: number;
}

export class LocalLLMIntegration extends EventEmitter {
  private llmConfig: LLMConfig;
  private ragConfig: RAGConfig;
  private isInitialized: boolean = false;
  private documentIndex: Map<string, DocumentChunk[]> = new Map();
  private vectorStore: any = null;

  constructor(llmConfig: LLMConfig, ragConfig: RAGConfig) {
    super();
    this.llmConfig = llmConfig;
    this.ragConfig = ragConfig;
  }

  async initialize(): Promise<void> {
    await this.validateLLMConnection();
    await this.initializeVectorStore();
    await this.loadDocuments();
    
    this.isInitialized = true;
    this.emit('llm:initialized', {
      provider: this.llmConfig.provider,
      model: this.llmConfig.model,
      vectorStore: this.ragConfig.vectorStore
    });
  }

  async chat(message: string, context?: any): Promise<string> {
    if (!this.isInitialized) {
      throw new Error('LLM integration not initialized');
    }

    const relevantDocs = await this.retrieveRelevantDocuments(message);
    const enhancedPrompt = this.buildEnhancedPrompt(message, relevantDocs, context);
    
    const response = await this.generateResponse(enhancedPrompt);
    
    this.emit('chat:completed', {
      query: message,
      response,
      retrievedDocs: relevantDocs.length,
      timestamp: new Date().toISOString()
    });

    return response;
  }

  async processPropertyValuation(propertyData: any): Promise<any> {
    const prompt = this.buildValuationPrompt(propertyData);
    const relevantDocs = await this.retrieveRelevantDocuments(
      `property valuation ${propertyData.propertyType} ${propertyData.region}`
    );
    
    const enhancedPrompt = this.buildEnhancedPrompt(prompt, relevantDocs, {
      task: 'property_valuation',
      property: propertyData
    });

    const response = await this.generateResponse(enhancedPrompt);
    
    try {
      return JSON.parse(response);
    } catch {
      return {
        success: false,
        error: 'Failed to parse LLM response',
        rawResponse: response
      };
    }
  }

  async analyzeMarketTrends(marketData: any): Promise<any> {
    const prompt = this.buildMarketAnalysisPrompt(marketData);
    const relevantDocs = await this.retrieveRelevantDocuments(
      `market trends analysis ${marketData.region} ${marketData.timeframe}`
    );
    
    const enhancedPrompt = this.buildEnhancedPrompt(prompt, relevantDocs, {
      task: 'market_analysis',
      data: marketData
    });

    const response = await this.generateResponse(enhancedPrompt);
    
    try {
      return JSON.parse(response);
    } catch {
      return {
        success: false,
        error: 'Failed to parse market analysis response',
        rawResponse: response
      };
    }
  }

  async generateReport(reportType: string, data: any): Promise<string> {
    const prompt = this.buildReportPrompt(reportType, data);
    const relevantDocs = await this.retrieveRelevantDocuments(
      `${reportType} report template structure`
    );
    
    const enhancedPrompt = this.buildEnhancedPrompt(prompt, relevantDocs, {
      task: 'report_generation',
      type: reportType,
      data
    });

    return await this.generateResponse(enhancedPrompt);
  }

  async addDocument(document: {
    id: string;
    content: string;
    metadata: any;
  }): Promise<void> {
    const chunks = await this.chunkDocument(document);
    const chunksWithEmbeddings = await this.embedChunks(chunks);
    
    this.documentIndex.set(document.id, chunksWithEmbeddings);
    
    if (this.vectorStore) {
      await this.addToVectorStore(chunksWithEmbeddings);
    }

    this.emit('document:added', {
      documentId: document.id,
      chunks: chunksWithEmbeddings.length
    });
  }

  async removeDocument(documentId: string): Promise<void> {
    this.documentIndex.delete(documentId);
    
    if (this.vectorStore) {
      await this.removeFromVectorStore(documentId);
    }

    this.emit('document:removed', { documentId });
  }

  async searchDocuments(query: string, limit: number = 10): Promise<DocumentChunk[]> {
    return await this.retrieveRelevantDocuments(query, limit);
  }

  private async validateLLMConnection(): Promise<void> {
    try {
      const response = await axios.get(`${this.llmConfig.baseUrl}/api/tags`, {
        timeout: this.llmConfig.timeout,
        headers: this.llmConfig.apiKey ? {
          'Authorization': `Bearer ${this.llmConfig.apiKey}`
        } : {}
      });

      if (response.status !== 200) {
        throw new Error(`LLM service not available: ${response.status}`);
      }

      const models = response.data.models || [];
      const modelExists = models.some((m: any) => m.name === this.llmConfig.model);
      
      if (!modelExists) {
        await this.pullModel(this.llmConfig.model);
      }

    } catch (error) {
      throw new Error(`Failed to connect to LLM service: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async pullModel(modelName: string): Promise<void> {
    try {
      await axios.post(`${this.llmConfig.baseUrl}/api/pull`, {
        name: modelName
      }, {
        timeout: 300000,
        headers: this.llmConfig.apiKey ? {
          'Authorization': `Bearer ${this.llmConfig.apiKey}`
        } : {}
      });
    } catch (error) {
      throw new Error(`Failed to pull model ${modelName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async initializeVectorStore(): Promise<void> {
    switch (this.ragConfig.vectorStore) {
      case 'chroma':
        await this.initializeChroma();
        break;
      case 'faiss':
        await this.initializeFaiss();
        break;
      case 'weaviate':
        await this.initializeWeaviate();
        break;
      case 'pinecone':
        await this.initializePinecone();
        break;
      default:
        throw new Error(`Unsupported vector store: ${this.ragConfig.vectorStore}`);
    }
  }

  private async initializeChroma(): Promise<void> {
    try {
      const chromaUrl = process.env.CHROMA_URL || 'http://localhost:8000';
      const response = await axios.get(`${chromaUrl}/api/v1/heartbeat`);
      
      if (response.status === 200) {
        this.vectorStore = {
          type: 'chroma',
          url: chromaUrl,
          collection: 'terrabuild_docs'
        };
      }
    } catch (error) {
      console.warn('Chroma not available, using in-memory fallback');
      this.vectorStore = { type: 'memory' };
    }
  }

  private async initializeFaiss(): Promise<void> {
    this.vectorStore = { type: 'faiss', index: null };
  }

  private async initializeWeaviate(): Promise<void> {
    const weaviateUrl = process.env.WEAVIATE_URL || 'http://localhost:8080';
    this.vectorStore = { type: 'weaviate', url: weaviateUrl };
  }

  private async initializePinecone(): Promise<void> {
    const pineconeApiKey = process.env.PINECONE_API_KEY;
    if (!pineconeApiKey) {
      throw new Error('Pinecone API key required');
    }
    
    this.vectorStore = {
      type: 'pinecone',
      apiKey: pineconeApiKey,
      environment: process.env.PINECONE_ENVIRONMENT || 'us-west1-gcp'
    };
  }

  private async loadDocuments(): Promise<void> {
    const documents = [
      {
        id: 'benton_county_standards',
        content: 'Benton County Building Cost Standards documentation and guidelines for property valuation...',
        metadata: { type: 'standards', source: 'official_docs' }
      },
      {
        id: 'rcn_methodology',
        content: 'Replacement Cost New methodology for building valuations including factors and calculations...',
        metadata: { type: 'methodology', source: 'technical_docs' }
      },
      {
        id: 'market_analysis_guide',
        content: 'Market analysis procedures and best practices for property assessment...',
        metadata: { type: 'guide', source: 'training_materials' }
      }
    ];

    for (const doc of documents) {
      await this.addDocument(doc);
    }
  }

  private async chunkDocument(document: any): Promise<DocumentChunk[]> {
    const chunks: DocumentChunk[] = [];
    const content = document.content;
    const chunkSize = this.ragConfig.chunkSize;
    const overlap = this.ragConfig.chunkOverlap;

    for (let i = 0; i < content.length; i += chunkSize - overlap) {
      const chunk = content.slice(i, i + chunkSize);
      
      chunks.push({
        id: `${document.id}_chunk_${chunks.length}`,
        content: chunk,
        metadata: {
          ...document.metadata,
          source: document.id,
          timestamp: new Date().toISOString()
        }
      });
    }

    return chunks;
  }

  private async embedChunks(chunks: DocumentChunk[]): Promise<DocumentChunk[]> {
    for (const chunk of chunks) {
      chunk.embedding = await this.generateEmbedding(chunk.content);
    }
    return chunks;
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await axios.post(`${this.llmConfig.baseUrl}/api/embeddings`, {
        model: this.ragConfig.embeddingModel,
        prompt: text
      }, {
        timeout: this.llmConfig.timeout,
        headers: this.llmConfig.apiKey ? {
          'Authorization': `Bearer ${this.llmConfig.apiKey}`
        } : {}
      });

      return response.data.embedding;
    } catch (error) {
      return Array(384).fill(0).map(() => Math.random() - 0.5);
    }
  }

  private async retrieveRelevantDocuments(query: string, limit: number = this.ragConfig.topK): Promise<DocumentChunk[]> {
    const queryEmbedding = await this.generateEmbedding(query);
    const allChunks: DocumentChunk[] = [];

    for (const chunks of this.documentIndex.values()) {
      allChunks.push(...chunks);
    }

    const scoredChunks = allChunks
      .map(chunk => ({
        ...chunk,
        score: this.cosineSimilarity(queryEmbedding, chunk.embedding || [])
      }))
      .filter(chunk => (chunk.score || 0) >= this.ragConfig.scoreThreshold)
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, limit);

    return scoredChunks;
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  private buildEnhancedPrompt(query: string, documents: DocumentChunk[], context?: any): string {
    const contextStr = documents.map(doc => 
      `Source: ${doc.metadata.source}\nContent: ${doc.content}\n`
    ).join('\n---\n');

    const systemPrompt = `You are an expert property valuation assistant for Benton County, Washington. Use the provided context documents to answer questions accurately and comprehensively.

Context Documents:
${contextStr}

Additional Context: ${context ? JSON.stringify(context) : 'None'}

Query: ${query}

Instructions:
- Base your response on the provided context documents
- If information is not available in the context, clearly state this
- For property valuations, provide detailed calculations and reasoning
- For market analysis, cite specific data points and trends
- Always maintain professional accuracy and compliance with local standards

Response:`;

    return systemPrompt;
  }

  private buildValuationPrompt(propertyData: any): string {
    return `Perform a comprehensive property valuation analysis for the following property:

Property Details:
- Type: ${propertyData.propertyType}
- Location: ${propertyData.address}, ${propertyData.city}
- Region: ${propertyData.region}
- Year Built: ${propertyData.yearBuilt}
- Square Feet: ${propertyData.squareFeet}
- Quality: ${propertyData.quality}
- Condition: ${propertyData.condition}

Please provide:
1. RCN (Replacement Cost New) calculation
2. Applicable cost factors and adjustments
3. Final estimated value with confidence interval
4. Supporting methodology and assumptions

Return the response as a JSON object with the structure:
{
  "rcn": number,
  "adjustments": {
    "quality": number,
    "condition": number,
    "age": number,
    "regional": number
  },
  "finalValue": number,
  "confidenceInterval": string,
  "methodology": string,
  "assumptions": string[]
}`;
  }

  private buildMarketAnalysisPrompt(marketData: any): string {
    return `Analyze market trends for the following parameters:

Market Parameters:
- Region: ${marketData.region}
- Property Types: ${marketData.propertyTypes?.join(', ')}
- Time Frame: ${marketData.timeframe}
- Data Points: ${marketData.dataPoints}

Provide analysis including:
1. Current market conditions
2. Price trends and trajectory
3. Comparative market analysis
4. Risk factors and opportunities
5. Recommendations

Return as JSON:
{
  "marketCondition": string,
  "priceTrajectory": string,
  "trendAnalysis": {
    "direction": string,
    "magnitude": number,
    "confidence": number
  },
  "comparatives": any[],
  "riskFactors": string[],
  "opportunities": string[],
  "recommendations": string[]
}`;
  }

  private buildReportPrompt(reportType: string, data: any): string {
    return `Generate a professional ${reportType} report using the following data:

${JSON.stringify(data, null, 2)}

Report should include:
1. Executive Summary
2. Detailed Analysis
3. Supporting Data
4. Conclusions and Recommendations
5. Appendices (if applicable)

Format as a structured document suitable for official use.`;
  }

  private async generateResponse(prompt: string): Promise<string> {
    try {
      const response = await axios.post(`${this.llmConfig.baseUrl}/api/generate`, {
        model: this.llmConfig.model,
        prompt,
        options: {
          temperature: this.llmConfig.temperature,
          num_predict: this.llmConfig.maxTokens
        }
      }, {
        timeout: this.llmConfig.timeout,
        headers: this.llmConfig.apiKey ? {
          'Authorization': `Bearer ${this.llmConfig.apiKey}`
        } : {}
      });

      return response.data.response;
    } catch (error) {
      throw new Error(`LLM generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async addToVectorStore(chunks: DocumentChunk[]): Promise<void> {
    if (this.vectorStore?.type === 'chroma') {
      await this.addToChroma(chunks);
    }
  }

  private async removeFromVectorStore(documentId: string): Promise<void> {
    if (this.vectorStore?.type === 'chroma') {
      await this.removeFromChroma(documentId);
    }
  }

  private async addToChroma(chunks: DocumentChunk[]): Promise<void> {
    try {
      const { url, collection } = this.vectorStore;
      
      await axios.post(`${url}/api/v1/collections/${collection}/add`, {
        ids: chunks.map(c => c.id),
        documents: chunks.map(c => c.content),
        metadatas: chunks.map(c => c.metadata),
        embeddings: chunks.map(c => c.embedding)
      });
    } catch (error) {
      console.warn('Failed to add to Chroma:', error);
    }
  }

  private async removeFromChroma(documentId: string): Promise<void> {
    try {
      const { url, collection } = this.vectorStore;
      
      await axios.post(`${url}/api/v1/collections/${collection}/delete`, {
        where: { source: documentId }
      });
    } catch (error) {
      console.warn('Failed to remove from Chroma:', error);
    }
  }

  getStatus(): any {
    return {
      initialized: this.isInitialized,
      llm: {
        provider: this.llmConfig.provider,
        model: this.llmConfig.model,
        baseUrl: this.llmConfig.baseUrl
      },
      rag: {
        vectorStore: this.ragConfig.vectorStore,
        documentsIndexed: this.documentIndex.size,
        totalChunks: Array.from(this.documentIndex.values()).reduce((sum, chunks) => sum + chunks.length, 0)
      }
    };
  }

  async shutdown(): Promise<void> {
    this.isInitialized = false;
    this.documentIndex.clear();
    this.vectorStore = null;
    
    this.emit('llm:shutdown', {
      timestamp: new Date().toISOString()
    });
  }
}