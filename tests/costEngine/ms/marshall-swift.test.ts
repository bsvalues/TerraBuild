/**
 * Tests for MarshallSwift service
 */

import { MarshallSwiftService, MsClass } from '../../../server/services/costEngine/marshallSwift';

describe('MarshallSwift Service', () => {
  it('should calculate adjusted cost correctly', () => {
    const service = new MarshallSwiftService();
    const result = service.calculateCost(100, {
      regionFactor: 1.1,
      qualityFactor: 1.2,
      conditionFactor: 0.9,
      complexityFactor: 1.05,
      sizeFactor: 1.0,
      heightFactor: 1.0,
      ageFactor: 0.85
    });
    
    expect(result).toBeCloseTo(100 * 1.1 * 1.2 * 0.9 * 1.05 * 1.0 * 1.0 * 0.85);
  });
});