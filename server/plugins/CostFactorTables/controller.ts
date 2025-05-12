import { Request, Response } from 'express';
import { CostFactorTables } from '../../services/costEngine/CostFactorTables';

export class CostFactorController {
  private costFactorTables: CostFactorTables;
  private static currentSource: string = 'bentonCounty'; // Default source

  constructor() {
    this.costFactorTables = new CostFactorTables();

    // Bind methods to ensure 'this' context
    this.getAllFactors = this.getAllFactors.bind(this);
    this.getSources = this.getSources.bind(this);
    this.getCurrentSource = this.getCurrentSource.bind(this);
    this.setCurrentSource = this.setCurrentSource.bind(this);
    this.getFactorsByType = this.getFactorsByType.bind(this);
    this.getFactorValue = this.getFactorValue.bind(this);
  }

  // Get all cost factors
  public getAllFactors(req: Request, res: Response): void {
    try {
      const allFactors = this.costFactorTables.getAllFactors(CostFactorController.currentSource);
      res.status(200).json({
        success: true,
        source: CostFactorController.currentSource,
        year: allFactors.year || new Date().getFullYear(),
        data: allFactors
      });
    } catch (error) {
      console.error('Error getting cost factors:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving cost factors',
        error: (error as Error).message
      });
    }
  }

  // Get available cost factor sources
  public getSources(req: Request, res: Response): void {
    try {
      const sources = this.costFactorTables.getAvailableSources();
      res.status(200).json({
        success: true,
        data: sources,
        current: CostFactorController.currentSource
      });
    } catch (error) {
      console.error('Error getting cost factor sources:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving cost factor sources',
        error: (error as Error).message
      });
    }
  }

  // Get current cost factor source
  public getCurrentSource(req: Request, res: Response): void {
    try {
      res.status(200).json({
        success: true,
        data: CostFactorController.currentSource
      });
    } catch (error) {
      console.error('Error getting current source:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving current cost factor source',
        error: (error as Error).message
      });
    }
  }

  // Set current cost factor source
  public setCurrentSource(req: Request, res: Response): void {
    try {
      const { source } = req.body;

      if (!source) {
        return res.status(400).json({
          success: false,
          message: 'Source parameter is required'
        });
      }

      const availableSources = this.costFactorTables.getAvailableSources();
      if (!availableSources.includes(source)) {
        return res.status(400).json({
          success: false,
          message: `Invalid source. Available sources: ${availableSources.join(', ')}`
        });
      }

      CostFactorController.currentSource = source;
      
      res.status(200).json({
        success: true,
        message: `Cost factor source set to ${source}`,
        data: source
      });
    } catch (error) {
      console.error('Error setting source:', error);
      res.status(500).json({
        success: false,
        message: 'Error setting cost factor source',
        error: (error as Error).message
      });
    }
  }

  // Get cost factors by type
  public getFactorsByType(req: Request, res: Response): void {
    try {
      const { factorType } = req.params;
      
      if (!factorType) {
        return res.status(400).json({
          success: false,
          message: 'Factor type parameter is required'
        });
      }

      const factors = this.costFactorTables.getFactorsByType(
        CostFactorController.currentSource,
        factorType
      );
      
      res.status(200).json({
        success: true,
        source: CostFactorController.currentSource,
        factorType,
        data: factors
      });
    } catch (error) {
      console.error(`Error getting ${req.params.factorType} factors:`, error);
      res.status(500).json({
        success: false,
        message: `Error retrieving ${req.params.factorType} factors`,
        error: (error as Error).message
      });
    }
  }

  // Get specific factor value
  public getFactorValue(req: Request, res: Response): void {
    try {
      const { factorType, code } = req.params;
      
      if (!factorType || !code) {
        return res.status(400).json({
          success: false,
          message: 'Factor type and code parameters are required'
        });
      }

      const value = this.costFactorTables.getFactorValue(
        CostFactorController.currentSource,
        factorType,
        code
      );
      
      if (value === null || value === undefined) {
        return res.status(404).json({
          success: false,
          message: `Factor value not found for ${factorType}/${code}`
        });
      }
      
      res.status(200).json({
        success: true,
        source: CostFactorController.currentSource,
        factorType,
        code,
        value
      });
    } catch (error) {
      console.error(`Error getting factor value for ${req.params.factorType}/${req.params.code}:`, error);
      res.status(500).json({
        success: false,
        message: `Error retrieving factor value`,
        error: (error as Error).message
      });
    }
  }
}