/**
 * Document Processing Agent for Benton County Building Cost System
 * 
 * This specialized agent handles document analysis and extraction, including:
 * - Extracting structured data from property documents
 * - Processing permits, deeds, and assessment forms
 * - Identifying key property attributes from unstructured texts
 * - Supporting OCR for scanned documents
 */

import { v4 as uuidv4 } from 'uuid';
import { CustomAgentBase } from './customAgentBase';

// Define AgentMemoryItem interface
interface AgentMemoryItem {
  type: string;
  timestamp: Date;
  input?: any;
  output?: any;
  metadata?: Record<string, any>;
  tags: string[];
}

/**
 * Interface for Document Analysis Request
 */
interface DocumentAnalysisRequest {
  documentId?: string;
  documentType?: 'permit' | 'deed' | 'assessment' | 'appraisal' | 'tax' | 'other';
  documentUrl?: string;
  documentContent?: string;
  extractionMode?: 'full' | 'key-values' | 'summary';
  includeConfidence?: boolean;
  includeRawText?: boolean;
  keywords?: string[];
  targetFields?: string[];
}

/**
 * Interface for Document Analysis Result
 */
interface DocumentAnalysisResult {
  analysisId: string;
  documentId: string;
  documentType: string;
  timestamp: Date;
  extractedData: Record<string, any>;
  rawText?: string;
  entities?: Array<{
    type: string;
    value: string;
    position: {
      start: number;
      end: number;
    };
    confidence: number;
  }>;
  keyValuePairs?: Record<string, {
    value: string | number | boolean;
    confidence: number;
  }>;
  summary?: string;
  metadata: {
    executionTimeMs: number;
    pageCount?: number;
    wordCount?: number;
    confidenceLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    techniquesApplied: string[];
  };
  warnings: string[];
}

/**
 * Document Processing Agent class
 */
export class DocumentProcessingAgent extends CustomAgentBase {
  // Sample document data for testing (would be retrieved from database/storage in production)
  private readonly sampleDocuments = {
    'DOC001': {
      id: 'DOC001',
      type: 'permit',
      content: `BUILDING PERMIT
County of Benton, Washington
Permit #: BP-2022-0157
Date Issued: 03/15/2022
Property ID: PROP001
Owner: Jane Smith
Address: 1234 Main St, Richland, WA 99352
Description: New single-family residence
Square Footage: 2,450
Estimated Cost: $425,000
Approved By: John Johnson
Expires: 03/15/2023`,
      metadata: {
        pageCount: 1,
        wordCount: 62
      }
    },
    'DOC002': {
      id: 'DOC002',
      type: 'assessment',
      content: `PROPERTY ASSESSMENT
Benton County Assessor's Office
Tax Year: 2023
Property ID: PROP002
Owner: Robert Williams
Address: 567 Oak Ave, Kennewick, WA 99336
Land Value: $125,000
Improvement Value: $295,000
Total Assessed Value: $420,000
Tax Rate: 0.0112
Annual Tax: $4,704
Last Assessment Date: 09/15/2022
Appraiser: Sarah Martinez`,
      metadata: {
        pageCount: 1,
        wordCount: 70
      }
    },
    'DOC003': {
      id: 'DOC003',
      type: 'deed',
      content: `WARRANTY DEED
Recording Requested By:
First American Title Company
When Recorded Mail To:
Michael Johnson
789 Pine St
Richland, WA 99352

KNOW ALL PERSONS BY THESE PRESENTS:
That David Anderson and Lisa Anderson, husband and wife,
hereinafter called the Grantor, for and in consideration of the sum of 
FOUR HUNDRED FIFTY THOUSAND AND NO/100 DOLLARS ($450,000.00),
conveys and warrants to Michael Johnson and Emily Johnson, husband and wife,
hereinafter called the Grantee, the following described real estate situated in 
the County of Benton, State of Washington:

Lot 7, Block 3, Riverview Heights Addition, according to the plat thereof
recorded in Volume 15 of Plats, page 29, records of Benton County, Washington.

Property Address: 789 Pine St, Richland, WA 99352
Parcel Number: 1-0754-300-0007-000

Dated this 20th day of January, 2023

_______________________________
David Anderson

_______________________________
Lisa Anderson`,
      metadata: {
        pageCount: 2,
        wordCount: 180
      }
    }
  };
  
  constructor() {
    super('document-processing-agent', 'Document Processing Agent');
    
    // Register event handlers
    this.registerEventHandler('document:analyze:request', this.handleDocumentAnalysisRequest.bind(this));
    this.registerEventHandler('document:data:update', this.handleDocumentUpdate.bind(this));
  }
  
  private recordMemory(item: AgentMemoryItem) {
    // For now just log the memory item
    console.log(`Memory recorded: ${item.type}`);
  }
  
  /**
   * Handle a document analysis request
   * 
   * @param event The event containing the request details
   * @param context Additional context for event handling
   */
  private async handleDocumentAnalysisRequest(event: any, context: any): Promise<void> {
    console.log(`Document Processing Agent received request with ID: ${event.correlationId}`);
    const startTime = Date.now();
    
    try {
      // Support both payload and data formats for the request
      const request: DocumentAnalysisRequest = event.payload?.request || event.data?.request;
      
      if (!request) {
        throw new Error('Invalid document analysis request. Missing required parameters.');
      }
      
      // Standardize inputs
      const standardizedRequest = this.standardizeRequest(request);
      
      // Perform the requested analysis
      const analysisResult = await this.performAnalysis(standardizedRequest);
      
      // Add execution time to metadata
      analysisResult.metadata.executionTimeMs = Date.now() - startTime;
      
      // Emit the result
      this.emitEvent('document:analyze:completed', {
        source: this.agentId,
        timestamp: new Date(),
        data: {
          sourceAgentId: this.agentId,
          targetAgentId: event.source || event.sourceAgentId,
          correlationId: event.correlationId,
          analysisResult,
          success: true,
          requestId: (event.data?.requestId || event.payload?.requestId || uuidv4())
        }
      });
      
      console.log(`Document analysis completed for request ID: ${event.correlationId}`);
      
      // Record this interaction in the agent's memory
      this.recordMemory({
        type: 'document_analysis',
        timestamp: new Date(),
        input: standardizedRequest,
        output: analysisResult,
        tags: ['analysis', 'document', 'success']
      });
    } catch (error) {
      console.error('Error in document analysis:', error instanceof Error ? error.message : String(error));
      
      // Emit error event
      this.emitEvent('document:analyze:error', {
        source: this.agentId,
        timestamp: new Date(),
        data: {
          sourceAgentId: this.agentId,
          targetAgentId: event.source || event.sourceAgentId,
          correlationId: event.correlationId,
          errorMessage: error instanceof Error ? error.message : String(error),
          requestId: (event.data?.requestId || event.payload?.requestId || uuidv4())
        }
      });
      
      // Record the failure in memory
      this.recordMemory({
        type: 'document_analysis_failure',
        timestamp: new Date(),
        input: event.data?.request || event.payload?.request,
        metadata: {
          error: error instanceof Error ? error.message : String(error)
        },
        tags: ['analysis', 'document', 'error']
      });
    }
  }
  
  /**
   * Handle a document update event
   * 
   * @param event The event containing the updated document
   * @param context Additional context for event handling
   */
  private async handleDocumentUpdate(event: any, context: any): Promise<void> {
    console.log(`Document Processing Agent received document update with ID: ${event.correlationId}`);
    
    try {
      const data = event.payload?.data || event.data?.data;
      
      if (!data) {
        throw new Error('Invalid document update event. Missing data.');
      }
      
      // In a real implementation, this would update the agent's document repository
      console.log(`Received document update with ID: ${data.documentId}`);
      
      // Emit acknowledgment
      this.emitEvent('document:data:updated', {
        source: this.agentId,
        timestamp: new Date(),
        data: {
          sourceAgentId: this.agentId,
          targetAgentId: event.source || event.sourceAgentId,
          correlationId: event.correlationId,
          success: true,
          message: 'Document data updated successfully'
        }
      });
      
      // Record this interaction in the agent's memory
      this.recordMemory({
        type: 'document_update',
        timestamp: new Date(),
        metadata: {
          documentId: data.documentId,
          documentType: data.documentType
        },
        tags: ['data', 'update', 'document']
      });
    } catch (error) {
      console.error('Error updating document data:', error instanceof Error ? error.message : String(error));
      
      // Emit error event
      this.emitEvent('document:data:error', {
        source: this.agentId,
        timestamp: new Date(),
        data: {
          sourceAgentId: this.agentId,
          targetAgentId: event.source || event.sourceAgentId,
          correlationId: event.correlationId,
          errorMessage: error instanceof Error ? error.message : String(error)
        }
      });
      
      // Record the failure in memory
      this.recordMemory({
        type: 'document_update_failure',
        timestamp: new Date(),
        metadata: {
          error: error instanceof Error ? error.message : String(error)
        },
        tags: ['data', 'update', 'error']
      });
    }
  }
  
  /**
   * Standardize a document analysis request
   * 
   * @param request The request to standardize
   * @returns The standardized request
   */
  private standardizeRequest(request: DocumentAnalysisRequest): DocumentAnalysisRequest {
    // Clone the request to avoid modifying the original
    const standardized = { ...request };
    
    // Set default extraction mode if not provided
    if (!standardized.extractionMode) {
      standardized.extractionMode = 'full';
    }
    
    // Set default includeConfidence if not provided
    if (standardized.includeConfidence === undefined) {
      standardized.includeConfidence = true;
    }
    
    // Set default includeRawText if not provided
    if (standardized.includeRawText === undefined) {
      standardized.includeRawText = false;
    }
    
    return standardized;
  }
  
  /**
   * Perform the requested document analysis
   * 
   * @param request The analysis request
   * @returns The analysis result
   */
  private async performAnalysis(request: DocumentAnalysisRequest): Promise<DocumentAnalysisResult> {
    // Find the document by ID or use content directly
    let document;
    if (request.documentId) {
      document = this.sampleDocuments[request.documentId];
      if (!document) {
        throw new Error(`Document not found with ID: ${request.documentId}`);
      }
    } else if (request.documentContent) {
      // Use provided content directly
      document = {
        id: uuidv4().substring(0, 8),
        type: request.documentType || 'other',
        content: request.documentContent,
        metadata: {
          pageCount: 1,
          wordCount: request.documentContent.split(/\s+/).length
        }
      };
    } else {
      throw new Error('Either documentId or documentContent must be provided');
    }
    
    // Start with base result structure
    const result: DocumentAnalysisResult = {
      analysisId: uuidv4(),
      documentId: document.id,
      documentType: document.type,
      timestamp: new Date(),
      extractedData: {},
      metadata: {
        executionTimeMs: 0,
        pageCount: document.metadata.pageCount,
        wordCount: document.metadata.wordCount,
        confidenceLevel: 'MEDIUM',
        techniquesApplied: ['regex-extraction', 'key-value-detection']
      },
      warnings: []
    };
    
    // Include raw text if requested
    if (request.includeRawText) {
      result.rawText = document.content;
    }
    
    // Extract data based on document type
    switch (document.type) {
      case 'permit':
        this.extractPermitData(document, result);
        break;
      case 'assessment':
        this.extractAssessmentData(document, result);
        break;
      case 'deed':
        this.extractDeedData(document, result);
        break;
      default:
        // Generic extraction for unknown document types
        this.extractGenericData(document, result);
        break;
    }
    
    // Add specific entities if in full mode
    if (request.extractionMode === 'full') {
      result.entities = this.extractEntities(document);
    }
    
    // Add key-value pairs according to mode
    if (request.extractionMode === 'full' || request.extractionMode === 'key-values') {
      result.keyValuePairs = this.extractKeyValuePairs(document, request.includeConfidence);
    }
    
    // Generate summary if requested
    if (request.extractionMode === 'full' || request.extractionMode === 'summary') {
      result.summary = this.generateSummary(document);
    }
    
    // Filter for specific fields if requested
    if (request.targetFields && request.targetFields.length > 0) {
      const filteredData = {};
      for (const field of request.targetFields) {
        if (result.extractedData[field] !== undefined) {
          filteredData[field] = result.extractedData[field];
        } else {
          result.warnings.push(`Requested field not found: ${field}`);
        }
      }
      result.extractedData = filteredData;
    }
    
    return result;
  }
  
  /**
   * Extract data from permit documents
   */
  private extractPermitData(document: any, result: DocumentAnalysisResult): void {
    const content = document.content;
    
    // Extract permit number
    const permitMatch = content.match(/Permit #:\s*([A-Z0-9-]+)/);
    if (permitMatch) {
      result.extractedData.permitNumber = permitMatch[1];
    }
    
    // Extract date issued
    const dateMatch = content.match(/Date Issued:\s*(\d{2}\/\d{2}\/\d{4})/);
    if (dateMatch) {
      result.extractedData.dateIssued = dateMatch[1];
    }
    
    // Extract property ID
    const propertyMatch = content.match(/Property ID:\s*([A-Z0-9]+)/);
    if (propertyMatch) {
      result.extractedData.propertyId = propertyMatch[1];
    }
    
    // Extract owner
    const ownerMatch = content.match(/Owner:\s*([^\n]+)/);
    if (ownerMatch) {
      result.extractedData.owner = ownerMatch[1].trim();
    }
    
    // Extract address
    const addressMatch = content.match(/Address:\s*([^\n]+)/);
    if (addressMatch) {
      result.extractedData.address = addressMatch[1].trim();
    }
    
    // Extract description
    const descMatch = content.match(/Description:\s*([^\n]+)/);
    if (descMatch) {
      result.extractedData.description = descMatch[1].trim();
    }
    
    // Extract square footage
    const sqftMatch = content.match(/Square Footage:\s*([\d,]+)/);
    if (sqftMatch) {
      result.extractedData.squareFootage = parseInt(sqftMatch[1].replace(/,/g, ''), 10);
    }
    
    // Extract estimated cost
    const costMatch = content.match(/Estimated Cost:\s*\$?([\d,]+)/);
    if (costMatch) {
      result.extractedData.estimatedCost = parseInt(costMatch[1].replace(/,/g, ''), 10);
    }
    
    // Extract approved by
    const approverMatch = content.match(/Approved By:\s*([^\n]+)/);
    if (approverMatch) {
      result.extractedData.approvedBy = approverMatch[1].trim();
    }
    
    // Extract expiration date
    const expiresMatch = content.match(/Expires:\s*(\d{2}\/\d{2}\/\d{4})/);
    if (expiresMatch) {
      result.extractedData.expirationDate = expiresMatch[1];
    }
  }
  
  /**
   * Extract data from assessment documents
   */
  private extractAssessmentData(document: any, result: DocumentAnalysisResult): void {
    const content = document.content;
    
    // Extract tax year
    const yearMatch = content.match(/Tax Year:\s*(\d{4})/);
    if (yearMatch) {
      result.extractedData.taxYear = parseInt(yearMatch[1], 10);
    }
    
    // Extract property ID
    const propertyMatch = content.match(/Property ID:\s*([A-Z0-9]+)/);
    if (propertyMatch) {
      result.extractedData.propertyId = propertyMatch[1];
    }
    
    // Extract owner
    const ownerMatch = content.match(/Owner:\s*([^\n]+)/);
    if (ownerMatch) {
      result.extractedData.owner = ownerMatch[1].trim();
    }
    
    // Extract address
    const addressMatch = content.match(/Address:\s*([^\n]+)/);
    if (addressMatch) {
      result.extractedData.address = addressMatch[1].trim();
    }
    
    // Extract land value
    const landValueMatch = content.match(/Land Value:\s*\$?([\d,]+)/);
    if (landValueMatch) {
      result.extractedData.landValue = parseInt(landValueMatch[1].replace(/,/g, ''), 10);
    }
    
    // Extract improvement value
    const improvementValueMatch = content.match(/Improvement Value:\s*\$?([\d,]+)/);
    if (improvementValueMatch) {
      result.extractedData.improvementValue = parseInt(improvementValueMatch[1].replace(/,/g, ''), 10);
    }
    
    // Extract total assessed value
    const totalValueMatch = content.match(/Total Assessed Value:\s*\$?([\d,]+)/);
    if (totalValueMatch) {
      result.extractedData.totalAssessedValue = parseInt(totalValueMatch[1].replace(/,/g, ''), 10);
    }
    
    // Extract tax rate
    const taxRateMatch = content.match(/Tax Rate:\s*([\d.]+)/);
    if (taxRateMatch) {
      result.extractedData.taxRate = parseFloat(taxRateMatch[1]);
    }
    
    // Extract annual tax
    const annualTaxMatch = content.match(/Annual Tax:\s*\$?([\d,]+)/);
    if (annualTaxMatch) {
      result.extractedData.annualTax = parseInt(annualTaxMatch[1].replace(/,/g, ''), 10);
    }
    
    // Extract last assessment date
    const assessmentDateMatch = content.match(/Last Assessment Date:\s*(\d{2}\/\d{2}\/\d{4})/);
    if (assessmentDateMatch) {
      result.extractedData.lastAssessmentDate = assessmentDateMatch[1];
    }
    
    // Extract appraiser
    const appraiserMatch = content.match(/Appraiser:\s*([^\n]+)/);
    if (appraiserMatch) {
      result.extractedData.appraiser = appraiserMatch[1].trim();
    }
  }
  
  /**
   * Extract data from deed documents
   */
  private extractDeedData(document: any, result: DocumentAnalysisResult): void {
    const content = document.content;
    
    // Extract grantors (sellers)
    const grantorMatch = content.match(/That\s+([^,]+)\s+and\s+([^,]+),\s+husband\s+and\s+wife/i);
    if (grantorMatch) {
      result.extractedData.grantors = [grantorMatch[1].trim(), grantorMatch[2].trim()];
    }
    
    // Extract grantees (buyers)
    const granteeMatch = content.match(/to\s+([^,]+)\s+and\s+([^,]+),\s+husband\s+and\s+wife/i);
    if (granteeMatch) {
      result.extractedData.grantees = [granteeMatch[1].trim(), granteeMatch[2].trim()];
    }
    
    // Extract sale price
    const priceMatch = content.match(/consideration of the sum of\s+([^\$]+)\s+\$\(?([\d,]+\.\d{2})/i);
    if (priceMatch) {
      result.extractedData.salePrice = parseFloat(priceMatch[2].replace(/,/g, ''));
      result.extractedData.salePriceText = priceMatch[1].trim();
    }
    
    // Extract legal description
    const legalDescMatch = content.match(/following described real estate[^:]*:([^P]+)Property/is);
    if (legalDescMatch) {
      result.extractedData.legalDescription = legalDescMatch[1].trim();
    }
    
    // Extract property address
    const addressMatch = content.match(/Property Address:\s*([^\n]+)/);
    if (addressMatch) {
      result.extractedData.propertyAddress = addressMatch[1].trim();
    }
    
    // Extract parcel number
    const parcelMatch = content.match(/Parcel Number:\s*([^\n]+)/);
    if (parcelMatch) {
      result.extractedData.parcelNumber = parcelMatch[1].trim();
    }
    
    // Extract date
    const dateMatch = content.match(/Dated this\s+(\d+)[a-z]{2}\s+day of\s+([^,]+),\s+(\d{4})/i);
    if (dateMatch) {
      result.extractedData.signatureDate = `${dateMatch[2]} ${dateMatch[1]}, ${dateMatch[3]}`;
    }
  }
  
  /**
   * Extract data from generic documents
   */
  private extractGenericData(document: any, result: DocumentAnalysisResult): void {
    const content = document.content;
    
    // Extract dates
    const dates = content.match(/\d{1,2}\/\d{1,2}\/\d{4}/g) || [];
    if (dates.length > 0) {
      result.extractedData.dates = dates;
    }
    
    // Extract money values
    const moneyValues = content.match(/\$\s*[\d,]+(\.\d{2})?/g) || [];
    if (moneyValues.length > 0) {
      result.extractedData.monetaryValues = moneyValues.map(v => 
        parseFloat(v.replace(/[$,]/g, ''))
      );
    }
    
    // Extract possible property IDs
    const propIds = content.match(/PROP\d+/g) || [];
    if (propIds.length > 0) {
      result.extractedData.propertyIds = propIds;
    }
    
    // Extract possible names (simplistic approach)
    const nameMatches = content.match(/[A-Z][a-z]+ [A-Z][a-z]+/g) || [];
    if (nameMatches.length > 0) {
      result.extractedData.possibleNames = nameMatches;
    }
    
    // Extract addresses (simplistic approach)
    const addressMatches = content.match(/\d+ [A-Za-z]+ (?:St|Ave|Rd|Blvd|Ln|Dr|Way|Pl|Court|Ct)[,.]? [A-Za-z]+, [A-Z]{2} \d{5}/g) || [];
    if (addressMatches.length > 0) {
      result.extractedData.addresses = addressMatches;
    }
  }
  
  /**
   * Extract entities from document content
   */
  private extractEntities(document: any): any[] {
    const content = document.content;
    const entities = [];
    
    // Extract dates
    const dateRegex = /\b(\d{1,2}\/\d{1,2}\/\d{4})\b/g;
    let match;
    while ((match = dateRegex.exec(content)) !== null) {
      entities.push({
        type: 'date',
        value: match[1],
        position: {
          start: match.index,
          end: match.index + match[0].length
        },
        confidence: 0.95
      });
    }
    
    // Extract monetary values
    const moneyRegex = /\$\s*([\d,]+(?:\.\d{2})?)/g;
    while ((match = moneyRegex.exec(content)) !== null) {
      entities.push({
        type: 'money',
        value: match[1],
        position: {
          start: match.index,
          end: match.index + match[0].length
        },
        confidence: 0.9
      });
    }
    
    // Extract property IDs
    const propIdRegex = /\b(PROP\d+)\b/g;
    while ((match = propIdRegex.exec(content)) !== null) {
      entities.push({
        type: 'property_id',
        value: match[1],
        position: {
          start: match.index,
          end: match.index + match[0].length
        },
        confidence: 0.98
      });
    }
    
    // Extract addresses (simplistic approach)
    const addressRegex = /(\d+ [A-Za-z]+ (?:St|Ave|Rd|Blvd|Ln|Dr|Way|Pl|Court|Ct)[,.]? [A-Za-z]+, [A-Z]{2} \d{5})/g;
    while ((match = addressRegex.exec(content)) !== null) {
      entities.push({
        type: 'address',
        value: match[1],
        position: {
          start: match.index,
          end: match.index + match[0].length
        },
        confidence: 0.85
      });
    }
    
    return entities;
  }
  
  /**
   * Extract key-value pairs from document content
   */
  private extractKeyValuePairs(document: any, includeConfidence: boolean): Record<string, any> {
    const content = document.content;
    const keyValuePairs = {};
    
    // Pattern for typical key-value pairs in documents
    const keyValueRegex = /([A-Za-z ]+):\s*([^\n]+)/g;
    let match;
    
    while ((match = keyValueRegex.exec(content)) !== null) {
      const key = match[1].trim().toLowerCase().replace(/\s+/g, '_');
      const value = match[2].trim();
      
      // Try to convert numeric values
      let processedValue = value;
      if (/^\d+$/.test(value)) {
        processedValue = parseInt(value, 10);
      } else if (/^\d+\.\d+$/.test(value)) {
        processedValue = parseFloat(value);
      } else if (/^\$\s*[\d,]+(\.\d{2})?$/.test(value)) {
        processedValue = parseFloat(value.replace(/[$,]/g, ''));
      }
      
      if (includeConfidence) {
        keyValuePairs[key] = {
          value: processedValue,
          confidence: 0.85 // Default confidence for regex extraction
        };
      } else {
        keyValuePairs[key] = processedValue;
      }
    }
    
    return keyValuePairs;
  }
  
  /**
   * Generate a summary of the document
   */
  private generateSummary(document: any): string {
    const type = document.type;
    const content = document.content;
    
    switch (type) {
      case 'permit':
        // Extract key information for permit summary
        const permitMatches = {
          number: content.match(/Permit #:\s*([A-Z0-9-]+)/),
          date: content.match(/Date Issued:\s*(\d{2}\/\d{2}\/\d{4})/),
          owner: content.match(/Owner:\s*([^\n]+)/),
          description: content.match(/Description:\s*([^\n]+)/),
          cost: content.match(/Estimated Cost:\s*\$?([\d,]+)/)
        };
        
        return `Building permit ${permitMatches.number ? permitMatches.number[1] : 'unknown'} ` +
               `issued on ${permitMatches.date ? permitMatches.date[1] : 'unknown date'} ` +
               `to ${permitMatches.owner ? permitMatches.owner[1].trim() : 'unknown owner'} ` +
               `for ${permitMatches.description ? permitMatches.description[1].trim().toLowerCase() : 'construction'} ` +
               `with estimated cost of ${permitMatches.cost ? '$' + permitMatches.cost[1] : 'unknown amount'}.`;
        
      case 'assessment':
        // Extract key information for assessment summary
        const assessmentMatches = {
          year: content.match(/Tax Year:\s*(\d{4})/),
          owner: content.match(/Owner:\s*([^\n]+)/),
          land: content.match(/Land Value:\s*\$?([\d,]+)/),
          improvement: content.match(/Improvement Value:\s*\$?([\d,]+)/),
          total: content.match(/Total Assessed Value:\s*\$?([\d,]+)/),
          tax: content.match(/Annual Tax:\s*\$?([\d,]+)/)
        };
        
        return `Property assessment for ${assessmentMatches.year ? assessmentMatches.year[1] : 'current year'} ` +
               `for ${assessmentMatches.owner ? assessmentMatches.owner[1].trim() : 'property owner'}. ` +
               `Total assessed value is ${assessmentMatches.total ? '$' + assessmentMatches.total[1] : 'unknown'} ` +
               `(${assessmentMatches.land ? '$' + assessmentMatches.land[1] : 'unknown'} land, ` +
               `${assessmentMatches.improvement ? '$' + assessmentMatches.improvement[1] : 'unknown'} improvements) ` +
               `with annual tax of ${assessmentMatches.tax ? '$' + assessmentMatches.tax[1] : 'unknown amount'}.`;
        
      case 'deed':
        // Extract key information for deed summary
        const deedMatches = {
          grantors: content.match(/That\s+([^,]+)\s+and\s+([^,]+),\s+husband\s+and\s+wife/i),
          grantees: content.match(/to\s+([^,]+)\s+and\s+([^,]+),\s+husband\s+and\s+wife/i),
          price: content.match(/consideration of the sum of\s+[^\$]+\s+\$\(?([\d,]+\.\d{2})/i),
          address: content.match(/Property Address:\s*([^\n]+)/),
          date: content.match(/Dated this\s+(\d+)[a-z]{2}\s+day of\s+([^,]+),\s+(\d{4})/i)
        };
        
        let grantorText = 'unknown sellers';
        if (deedMatches.grantors) {
          grantorText = `${deedMatches.grantors[1].trim()} and ${deedMatches.grantors[2].trim()}`;
        }
        
        let granteeText = 'unknown buyers';
        if (deedMatches.grantees) {
          granteeText = `${deedMatches.grantees[1].trim()} and ${deedMatches.grantees[2].trim()}`;
        }
        
        let dateText = 'unknown date';
        if (deedMatches.date) {
          dateText = `${deedMatches.date[2]} ${deedMatches.date[1]}, ${deedMatches.date[3]}`;
        }
        
        return `Warranty deed transferring property from ${grantorText} to ${granteeText} ` +
               `for ${deedMatches.price ? '$' + deedMatches.price[1] : 'an undisclosed amount'} ` +
               `at ${deedMatches.address ? deedMatches.address[1].trim() : 'the specified address'} ` +
               `dated ${dateText}.`;
        
      default:
        // Generic summary for unknown document types
        const firstLine = content.split('\n')[0].trim();
        const wordCount = content.split(/\s+/).length;
        const pageCount = document.metadata?.pageCount || 1;
        
        return `${firstLine} document containing ${wordCount} words across ${pageCount} page(s).`;
    }
  }
}

export const documentProcessingAgent = new DocumentProcessingAgent();