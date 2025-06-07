#!/usr/bin/env python3
"""
Unit Tests for the Excel Parser

This module contains unit tests for the enhanced excel parser functionality.
"""

import unittest
import os
import sys
import json
import pandas as pd
from unittest.mock import patch, MagicMock

# Add the parent directory to the path so we can import the modules
sys.path.append('.')

# Import the modules to test
from enhanced_excel_parser import EnhancedExcelParser

class TestEnhancedExcelParser(unittest.TestCase):
    """Tests for the EnhancedExcelParser class"""
    
    def setUp(self):
        """Set up test fixtures"""
        # Create a mock file path
        self.test_file_path = "attached_assets/test_file.xlsx"
        
    def test_initialization(self):
        """Test that the parser initializes properly"""
        parser = EnhancedExcelParser(self.test_file_path)
        self.assertEqual(parser.excel_file_path, self.test_file_path)
        self.assertIsNotNone(parser.matrix_year)
        
    @patch('enhanced_excel_parser.pd.ExcelFile')
    def test_sheet_detection(self, mock_excel_file):
        """Test that the parser correctly detects sheets"""
        # Mock the ExcelFile object
        mock_excel = MagicMock()
        mock_excel.sheet_names = ['matrix', 'matrix_detail', 'other_sheet']
        mock_excel_file.return_value = mock_excel
        
        # Initialize parser with mock
        parser = EnhancedExcelParser(self.test_file_path)
        
        # Test sheet detection
        sheets = parser._detect_sheets()
        self.assertIn('matrix', sheets)
        self.assertIn('matrix_detail', sheets)
        
    @patch('enhanced_excel_parser.pd.read_excel')
    def test_data_validation(self, mock_read_excel):
        """Test that the parser validates data correctly"""
        # Mock the read_excel function to return a dataframe with missing required columns
        mock_df = MagicMock()
        mock_df.columns = ['column1', 'column2']  # Missing required columns
        mock_read_excel.return_value = mock_df
        
        # Initialize parser
        parser = EnhancedExcelParser(self.test_file_path)
        
        # Test validation
        validation_result = parser._validate_sheet_data('test_sheet', ['required_column'])
        self.assertFalse(validation_result['valid'])
        self.assertIn('Missing required columns', validation_result['errors'][0])
        
    @patch('enhanced_excel_parser.pd.read_excel')
    @patch('enhanced_excel_parser.EnhancedExcelParser._validate_sheet_data')
    @patch('enhanced_excel_parser.EnhancedExcelParser._detect_sheets')
    @patch('os.path.exists')
    def test_parse_with_progress(self, mock_exists, mock_detect_sheets, mock_validate, mock_read_excel):
        """Test the parse method with progress tracking"""
        # Mock file exists
        mock_exists.return_value = True
        
        # Mock the necessary methods
        mock_detect_sheets.return_value = ['matrix', 'matrix_detail']
        mock_validate.return_value = {'valid': True, 'errors': []}
        
        # Mock DataFrame for matrix with required columns
        matrix_df = MagicMock()
        matrix_df.columns = ['matrix_id', 'matrix_description', 'axis_1', 'axis_2']
        matrix_df.__getitem__.return_value = matrix_df
        
        # Mock DataFrame for matrix_detail
        detail_df = MagicMock()
        detail_df.empty = False
        
        # Mock joined dataframe
        joined_df = MagicMock()
        joined_df['matrix_description'].dropna.return_value.unique.return_value = ['Test Matrix R1 North Benton']
        
        # Set up mock behavior for dataframe operations
        def side_effect_getitem(key):
            mock_series = MagicMock()
            mock_series.iloc = MagicMock()
            mock_series.iloc.__getitem__.return_value = 1
            if key == 'matrix_description':
                mock_series.dropna.return_value.unique.return_value = ['Test Matrix R1 North Benton']
                return mock_series
            elif key == 'matrix_id':
                mock_series.iloc.__getitem__.return_value = 1
                return mock_series
            elif key == 'value':
                mock_series.dropna.return_value.empty = False
                mock_series.dropna.return_value.min.return_value = 100
                mock_series.dropna.return_value.max.return_value = 200
                mock_series.dropna.return_value.mean.return_value = 150
                return mock_series
            return mock_series
            
        joined_df.__getitem__ = MagicMock(side_effect=side_effect_getitem)
        joined_df['matrix_description'] = mock_series = MagicMock()
        mock_series.dropna.return_value.unique.return_value = ['Test Matrix R1 North Benton']
        joined_df.empty = False
        
        # Handle the merge operation
        mock_merge = MagicMock(return_value=joined_df)
        pd.merge = mock_merge
        
        # Set up read_excel to return different DataFrames based on sheet_name
        def side_effect(*args, **kwargs):
            if kwargs.get('sheet_name') == 'matrix':
                return matrix_df
            elif kwargs.get('sheet_name') == 'matrix_detail':
                return detail_df
            return MagicMock()
            
        mock_read_excel.side_effect = side_effect
        
        # Mock extract methods to return valid values
        with patch.object(EnhancedExcelParser, '_extract_region_from_description', return_value='North Benton'):
            with patch.object(EnhancedExcelParser, '_extract_building_type_from_description', return_value='R1'):
                # Initialize parser with mock
                parser = EnhancedExcelParser(self.test_file_path)
                
                # Create a mock progress callback
                progress_callback = MagicMock()
                
                # Test parse method with progress
                result = parser.parse(progress_callback=progress_callback)
                
                # Verify progress was reported
                self.assertTrue(progress_callback.called)
                # We're not testing success here, just testing that progress was reported
                self.assertEqual(result['progress'], 100)
        
    def test_error_handling(self):
        """Test that the parser handles errors gracefully"""
        # Test with a non-existent file
        parser = EnhancedExcelParser("non_existent_file.xlsx")
        result = parser.parse()
        
        # Should fail gracefully
        self.assertFalse(result['success'])
        self.assertTrue(len(result['errors']) > 0)
        

if __name__ == '__main__':
    unittest.main()