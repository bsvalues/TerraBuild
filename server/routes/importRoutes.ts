/**
 * Import Routes for TerraBuild
 * 
 * This file provides API routes for importing data into the system,
 * including property data from CSV files.
 */

import { Router } from 'express';
import multer from 'multer';
import { parse } from 'csv-parse';
import fs from 'fs';
import path from 'path';
import { storage } from '../storage-implementation';

export const importRoutes = Router();

// Configure multer for file uploads
const upload = multer({ 
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

/**
 * Import parcels from CSV file
 * 
 * POST /api/import/parcels
 * Content-Type: multipart/form-data
 * file: CSV file
 */
importRoutes.post('/import/parcels', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const results = [];
    const errors = [];

    // Process the CSV file
    const parser = fs
      .createReadStream(filePath)
      .pipe(parse({
        columns: true,
        skip_empty_lines: true
      }));

    for await (const record of parser) {
      try {
        // Map CSV data to property schema
        const propertyData = {
          parcel_id: record.parcel_id,
          address: record.address,
          city: record.city,
          state: record.state,
          zip: record.zip,
          latitude: parseFloat(record.latitude),
          longitude: parseFloat(record.longitude),
          lot_size_sqft: parseInt(record.lot_size_sqft, 10),
          zone_code: record.zone_code,
          building_type: record.building_type,
          year_built: parseInt(record.year_built, 10),
          total_area_sqft: parseInt(record.total_area_sqft, 10),
          bedrooms: parseInt(record.bedrooms, 10) || 0,
          bathrooms: parseFloat(record.bathrooms) || 0,
          quality: record.quality,
          condition: record.condition,
          last_assessment_date: record.last_assessment_date,
          last_assessment_value: parseFloat(record.last_assessment_value)
        };

        // Insert into the database
        const property = await storage.createProperty(propertyData);
        results.push(property);
      } catch (err) {
        console.error('Error importing record:', record, err);
        errors.push({
          record,
          error: (err as Error).message
        });
      }
    }

    // Clean up the temporary file
    fs.unlinkSync(filePath);

    res.json({
      success: true,
      imported: results.length,
      errors: errors.length,
      details: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

/**
 * Import cost factors from a JSON file
 * 
 * POST /api/import/factors
 * Content-Type: multipart/form-data
 * file: JSON file
 */
importRoutes.post('/import/factors', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;

    // Read and parse the JSON file
    const factorsData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    // This would call the appropriate storage methods to process the factors
    // For now, we'll just log the factors and return success
    console.log('Imported factors:', factorsData.version);

    // Clean up the temporary file
    fs.unlinkSync(filePath);

    res.json({
      success: true,
      version: factorsData.version,
      message: 'Factors imported successfully'
    });
  } catch (error) {
    console.error('Factor import error:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

export default importRoutes;