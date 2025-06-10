# TerraBuild Enterprise Integration Capabilities

## External System Integrations

### Geographic Information Systems (GIS)

#### ArcGIS Enterprise Integration
```javascript
// ArcGIS REST API connection
const arcgisConfig = {
  serverUrl: process.env.ARCGIS_SERVER_URL,
  username: process.env.ARCGIS_USERNAME,
  password: process.env.ARCGIS_PASSWORD,
  tokenUrl: '/arcgis/tokens/generateToken'
};

class ArcGISConnector {
  async getPropertyBoundaries(parcelId) {
    const token = await this.generateToken();
    const response = await fetch(`${arcgisConfig.serverUrl}/rest/services/Parcels/FeatureServer/0/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        token,
        where: `PARCEL_ID='${parcelId}'`,
        outFields: '*',
        f: 'json'
      })
    });
    return response.json();
  }
}
```

#### QGIS Server Integration
```python
# QGIS Server WFS/WMS integration
import requests
from qgis.core import QgsVectorLayer, QgsProject

class QGISConnector:
    def __init__(self, server_url):
        self.server_url = server_url
    
    def get_property_layer(self, layer_name):
        wfs_url = f"{self.server_url}?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAME={layer_name}"
        layer = QgsVectorLayer(wfs_url, layer_name, "WFS")
        return layer if layer.isValid() else None
```

### Property Tax Systems

#### Tyler Munis Integration
```javascript
class TylerMunisIntegration {
  constructor(config) {
    this.baseUrl = config.baseUrl;
    this.apiKey = config.apiKey;
  }

  async syncAssessmentData(propertyId, assessmentValue) {
    const response = await fetch(`${this.baseUrl}/api/assessments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        propertyId,
        assessedValue: assessmentValue,
        assessmentDate: new Date().toISOString(),
        assessorId: process.env.ASSESSOR_ID
      })
    });
    return response.json();
  }
}
```

#### Aumentum CAMAware Integration
```javascript
class CAMAwareIntegration {
  async exportAssessments(assessments) {
    const formatted = assessments.map(assessment => ({
      PARCEL_NUMBER: assessment.parcelId,
      ASSESSED_VALUE: assessment.totalValue,
      LAND_VALUE: assessment.landValue,
      IMPROVEMENT_VALUE: assessment.improvementValue,
      ASSESSMENT_DATE: assessment.assessmentDate
    }));

    return this.uploadToCAMAware(formatted);
  }
}
```

### Enterprise Resource Planning (ERP)

#### SAP Integration
```javascript
class SAPIntegration {
  constructor(config) {
    this.sapClient = new SAPClient(config);
  }

  async createAssetRecord(property) {
    const assetData = {
      ANLN1: property.assetNumber,
      TXT50: property.description,
      ANLKL: property.assetClass,
      KOSTL: property.costCenter,
      ZUGDT: property.acquisitionDate,
      INVNR: property.inventoryNumber
    };

    return this.sapClient.call('BAPI_FIXEDASSET_CREATE', assetData);
  }
}
```

#### Oracle Financials Integration
```javascript
class OracleFinancialsIntegration {
  async syncPropertyValues(properties) {
    const batch = properties.map(property => ({
      asset_id: property.id,
      current_value: property.currentValue,
      depreciation_value: property.depreciationValue,
      effective_date: new Date().toISOString()
    }));

    return this.executeBatchUpdate('FA_ASSETS_TBL', batch);
  }
}
```

### Document Management Systems

#### SharePoint Integration
```javascript
class SharePointIntegration {
  async uploadAssessmentReport(reportData, fileName) {
    const formData = new FormData();
    formData.append('file', reportData, fileName);

    const response = await fetch(`${this.siteUrl}/_api/web/lists/getbytitle('Assessment Reports')/RootFolder/Files/add(url='${fileName}',overwrite=true)`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Accept': 'application/json;odata=verbose'
      },
      body: formData
    });

    return response.json();
  }
}
```

#### OneDrive for Business Integration
```javascript
class OneDriveIntegration {
  async syncReports(reports) {
    for (const report of reports) {
      await this.uploadFile(report.content, `assessments/${report.fileName}`);
    }
  }
}
```

### Financial Systems

#### QuickBooks Enterprise Integration
```javascript
class QuickBooksIntegration {
  async createFixedAsset(property) {
    const asset = {
      Name: property.address,
      QtyOnHand: { value: 1 },
      UnitPrice: { value: property.assessedValue },
      Type: 'NonInventory',
      IncomeAccountRef: { value: property.incomeAccountId }
    };

    return this.qbConnector.createItem(asset);
  }
}
```

#### Workday Integration
```javascript
class WorkdayIntegration {
  async updateAssetValuation(assetId, newValue) {
    const updateRequest = {
      Asset_Reference: { ID: assetId },
      Current_Value: newValue,
      Effective_Date: new Date().toISOString()
    };

    return this.workdayClient.updateAsset(updateRequest);
  }
}
```

## API Framework Integration

### RESTful API Endpoints

#### Property Management API
```javascript
// GET /api/v1/properties
app.get('/api/v1/properties', authenticateToken, async (req, res) => {
  const { page = 1, limit = 50, type, minValue, maxValue } = req.query;
  
  const filters = {};
  if (type) filters.property_type = type;
  if (minValue) filters.total_value = { $gte: parseInt(minValue) };
  if (maxValue) filters.total_value = { ...filters.total_value, $lte: parseInt(maxValue) };

  const properties = await propertyService.getProperties(filters, page, limit);
  res.json(properties);
});

// POST /api/v1/properties/:id/assess
app.post('/api/v1/properties/:id/assess', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { assessmentType = 'full', includeComparables = true } = req.body;

  const assessment = await aiAgentService.assessProperty(id, {
    type: assessmentType,
    includeComparables
  });

  res.json(assessment);
});
```

#### Valuation API
```javascript
// POST /api/v1/valuations/batch
app.post('/api/v1/valuations/batch', authenticateToken, async (req, res) => {
  const { propertyIds, options } = req.body;
  
  const batchJob = await valuationService.createBatchJob(propertyIds, options);
  
  // Process asynchronously
  batchProcessor.queue(batchJob);
  
  res.json({ 
    jobId: batchJob.id, 
    status: 'queued',
    estimatedCompletion: batchJob.estimatedCompletion
  });
});
```

### GraphQL Integration
```javascript
const typeDefs = `
  type Property {
    id: ID!
    parcelId: String!
    address: String!
    assessedValue: Float
    landValue: Float
    improvements: [Improvement!]!
    valuationHistory: [Valuation!]!
  }

  type Query {
    properties(filters: PropertyFilter): [Property!]!
    property(id: ID!): Property
  }

  type Mutation {
    assessProperty(id: ID!, options: AssessmentOptions): Assessment!
    updateProperty(id: ID!, input: PropertyInput!): Property!
  }
`;

const resolvers = {
  Query: {
    properties: (_, { filters }) => propertyService.getProperties(filters),
    property: (_, { id }) => propertyService.getById(id)
  },
  Mutation: {
    assessProperty: (_, { id, options }) => aiAgentService.assessProperty(id, options),
    updateProperty: (_, { id, input }) => propertyService.update(id, input)
  }
};
```

### Webhook Integration
```javascript
class WebhookManager {
  async registerWebhook(url, events, secret) {
    const webhook = await db.webhooks.create({
      url,
      events,
      secret,
      isActive: true
    });

    return webhook;
  }

  async triggerWebhook(eventType, payload) {
    const webhooks = await db.webhooks.findAll({
      where: { 
        events: { [Op.contains]: [eventType] },
        isActive: true 
      }
    });

    for (const webhook of webhooks) {
      await this.sendWebhook(webhook, eventType, payload);
    }
  }

  async sendWebhook(webhook, eventType, payload) {
    const signature = crypto
      .createHmac('sha256', webhook.secret)
      .update(JSON.stringify(payload))
      .digest('hex');

    await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Signature': `sha256=${signature}`,
        'X-Event-Type': eventType
      },
      body: JSON.stringify(payload)
    });
  }
}
```

## Data Exchange Formats

### Industry Standard Formats

#### MISMO XML Integration
```javascript
class MISMOExporter {
  exportAssessment(assessment) {
    return {
      '?xml': { '@version': '1.0', '@encoding': 'UTF-8' },
      MESSAGE: {
        '@MISMOVersionID': '2.4',
        DEAL_SETS: {
          DEAL_SET: {
            DEALS: {
              DEAL: {
                ASSETS: {
                  ASSET: {
                    OWNED_PROPERTY: {
                      PROPERTY: {
                        '@PropertyCurrentUsageType': assessment.propertyType,
                        PROPERTY_VALUATIONS: {
                          PROPERTY_VALUATION: {
                            '@PropertyValuationAmount': assessment.assessedValue,
                            '@PropertyValuationMethodType': 'CostApproach'
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    };
  }
}
```

#### PRIA XML Integration
```javascript
class PRIAExporter {
  exportPropertyRecord(property) {
    return {
      PropertyRecord: {
        ParcelIdentification: {
          ParcelID: property.parcelId,
          AlternateParcelID: property.alternateId
        },
        PropertyAddress: {
          StreetAddress: property.address,
          City: property.city,
          StateOrProvince: property.state,
          PostalCode: property.zipCode
        },
        Assessment: {
          AssessedValue: property.assessedValue,
          LandValue: property.landValue,
          ImprovementValue: property.improvementValue,
          AssessmentDate: property.assessmentDate
        }
      }
    };
  }
}
```

### Real Estate Data Standards

#### RETS Integration
```javascript
class RETSConnector {
  async searchProperties(criteria) {
    const searchParams = {
      SearchType: 'Property',
      Class: 'RES',
      Query: `(ListPrice=${criteria.minPrice}+)`,
      Format: 'COMPACT-DECODED',
      Limit: criteria.limit || 100
    };

    const response = await this.retsClient.search(searchParams);
    return this.parseRETSData(response);
  }
}
```

#### MLS Integration
```javascript
class MLSIntegration {
  async getComparableSales(property, radius = 1) {
    const criteria = {
      PropertyType: property.type,
      MinSquareFootage: property.squareFootage * 0.8,
      MaxSquareFootage: property.squareFootage * 1.2,
      Radius: radius,
      CenterLatitude: property.latitude,
      CenterLongitude: property.longitude,
      SoldWithinDays: 365
    };

    return this.searchComparables(criteria);
  }
}
```

## Authentication and Security

### OAuth 2.0 Integration
```javascript
class OAuthProvider {
  async authenticateWithProvider(provider, code) {
    const tokenResponse = await fetch(`${provider.tokenUrl}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: provider.clientId,
        client_secret: provider.clientSecret,
        code,
        redirect_uri: provider.redirectUri
      })
    });

    const { access_token } = await tokenResponse.json();
    return access_token;
  }
}
```

### SAML Integration
```javascript
class SAMLIntegration {
  async validateSAMLResponse(samlResponse) {
    const decoded = Buffer.from(samlResponse, 'base64').toString();
    const doc = new DOMParser().parseFromString(decoded, 'text/xml');
    
    // Validate signature and extract user attributes
    const attributes = this.extractUserAttributes(doc);
    return attributes;
  }
}
```

## Message Queue Integration

### RabbitMQ Integration
```javascript
class RabbitMQIntegration {
  async publishAssessmentComplete(assessment) {
    const message = {
      type: 'assessment_completed',
      propertyId: assessment.propertyId,
      assessedValue: assessment.value,
      timestamp: new Date().toISOString()
    };

    await this.channel.publish(
      'assessments.exchange',
      'assessment.completed',
      Buffer.from(JSON.stringify(message))
    );
  }
}
```

### Apache Kafka Integration
```javascript
class KafkaIntegration {
  async publishEvent(topic, event) {
    await this.producer.send({
      topic,
      messages: [{
        key: event.id,
        value: JSON.stringify(event),
        timestamp: Date.now()
      }]
    });
  }
}
```

This comprehensive integration framework enables TerraBuild to seamlessly connect with existing municipal infrastructure while maintaining security and data integrity standards.