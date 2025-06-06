#!/usr/bin/env python3
"""
Benton County Cost Matrix Data Analyzer

This script analyzes the parsed cost matrix data from Benton County
to provide insights into building costs, regional variations, and other
cost metrics for different building types.
"""

import json
import sys
import os
from datetime import datetime
import statistics

class BentonCountyDataAnalyzer:
    def __init__(self, json_file_path):
        self.json_file_path = json_file_path
        self.data = None
        self.regions = []
        self.building_types = []
        self.by_region = {}
        self.by_building_type = {}
        self.summary = {}
        
    def load_data(self):
        """Load the JSON data file"""
        print(f"Loading data from: {self.json_file_path}")
        try:
            with open(self.json_file_path, 'r') as f:
                self.data = json.load(f)
                
            # Extract basic info
            self.regions = self.data.get('regions', [])
            self.building_types = self.data.get('buildingTypes', [])
            matrix_entries = self.data.get('data', [])
            
            print(f"Found {len(matrix_entries)} matrix entries across {len(self.regions)} regions")
            print(f"Building types: {', '.join(self.building_types)}")
            
            return True
        except Exception as e:
            print(f"Error loading data: {str(e)}")
            return False
    
    def analyze(self):
        """Analyze the cost matrix data"""
        if not self.data:
            print("No data loaded. Run load_data() first.")
            return False
        
        matrix_entries = self.data.get('data', [])
        
        # Initialize collections
        self.by_region = {region: [] for region in self.regions}
        self.by_building_type = {bt: [] for bt in self.building_types}
        
        # Group entries by region and building type
        for entry in matrix_entries:
            region = entry.get('region')
            building_type = entry.get('buildingType')
            
            if region and region in self.by_region:
                self.by_region[region].append(entry)
            
            if building_type and building_type in self.by_building_type:
                self.by_building_type[building_type].append(entry)
        
        # Analyze by region
        region_costs = {}
        for region, entries in self.by_region.items():
            if not entries:
                continue
                
            base_costs = [entry.get('baseCost', 0) for entry in entries]
            min_costs = [entry.get('minCost', 0) for entry in entries]
            max_costs = [entry.get('maxCost', 0) for entry in entries]
            
            region_costs[region] = {
                'count': len(entries),
                'avg_base_cost': statistics.mean(base_costs) if base_costs else 0,
                'median_base_cost': statistics.median(base_costs) if base_costs else 0,
                'min_cost': min(min_costs) if min_costs else 0,
                'max_cost': max(max_costs) if max_costs else 0,
                'std_dev': statistics.stdev(base_costs) if len(base_costs) > 1 else 0
            }
        
        # Analyze by building type
        building_costs = {}
        for bt, entries in self.by_building_type.items():
            if not entries:
                continue
                
            base_costs = [entry.get('baseCost', 0) for entry in entries]
            min_costs = [entry.get('minCost', 0) for entry in entries]
            max_costs = [entry.get('maxCost', 0) for entry in entries]
            
            building_costs[bt] = {
                'count': len(entries),
                'avg_base_cost': statistics.mean(base_costs) if base_costs else 0,
                'median_base_cost': statistics.median(base_costs) if base_costs else 0,
                'min_cost': min(min_costs) if min_costs else 0,
                'max_cost': max(max_costs) if max_costs else 0,
                'std_dev': statistics.stdev(base_costs) if len(base_costs) > 1 else 0,
                'description': entries[0].get('buildingTypeDescription', bt) if entries else bt
            }
        
        # Create overall summary
        all_base_costs = [entry.get('baseCost', 0) for entry in matrix_entries]
        
        self.summary = {
            'regions': self.regions,
            'buildingTypes': self.building_types,
            'totalEntries': len(matrix_entries),
            'averageCost': statistics.mean(all_base_costs) if all_base_costs else 0,
            'medianCost': statistics.median(all_base_costs) if all_base_costs else 0,
            'minCost': min([entry.get('minCost', 0) for entry in matrix_entries]) if matrix_entries else 0,
            'maxCost': max([entry.get('maxCost', 0) for entry in matrix_entries]) if matrix_entries else 0,
            'regionAnalysis': region_costs,
            'buildingTypeAnalysis': building_costs,
            'costRanges': self._analyze_cost_ranges(all_base_costs),
            'dataPoints': self._count_data_points(matrix_entries),
            'year': self.data.get('matrixYear', datetime.now().year)
        }
        
        return True
    
    def _analyze_cost_ranges(self, costs):
        """Analyze the distribution of costs in different ranges"""
        if not costs:
            return {}
            
        ranges = {
            '< 1000': 0,
            '1000-2500': 0,
            '2500-5000': 0,
            '5000-7500': 0,
            '7500-10000': 0,
            '> 10000': 0
        }
        
        for cost in costs:
            if cost < 1000:
                ranges['< 1000'] += 1
            elif cost < 2500:
                ranges['1000-2500'] += 1
            elif cost < 5000:
                ranges['2500-5000'] += 1
            elif cost < 7500:
                ranges['5000-7500'] += 1
            elif cost < 10000:
                ranges['7500-10000'] += 1
            else:
                ranges['> 10000'] += 1
        
        # Convert to percentages
        total = len(costs)
        for k in ranges:
            ranges[k] = round((ranges[k] / total) * 100, 2)
            
        return ranges
    
    def _count_data_points(self, entries):
        """Count the total number of data points across all matrices"""
        return sum([entry.get('dataPoints', 0) for entry in entries])
    
    def get_summary(self):
        """Get the summary data as a dictionary"""
        return self.summary
    
    def print_summary(self):
        """Print a summary of the analysis"""
        if not self.summary:
            print("No analysis performed. Run analyze() first.")
            return
        
        print("\n=== BENTON COUNTY COST MATRIX ANALYSIS ===")
        print(f"Year: {self.summary['year']}")
        print(f"Total Matrix Entries: {self.summary['totalEntries']}")
        print(f"Total Data Points: {self.summary['dataPoints']}")
        print("\n--- OVERALL COST METRICS ---")
        print(f"Average Base Cost: ${self.summary['averageCost']:.2f}")
        print(f"Median Base Cost: ${self.summary['medianCost']:.2f}")
        print(f"Min Cost: ${self.summary['minCost']:.2f}")
        print(f"Max Cost: ${self.summary['maxCost']:.2f}")
        
        print("\n--- COST DISTRIBUTION ---")
        for range_name, percentage in self.summary['costRanges'].items():
            print(f"{range_name}: {percentage}%")
        
        print("\n--- BUILDING TYPE ANALYSIS ---")
        for bt, data in self.summary['buildingTypeAnalysis'].items():
            print(f"{bt} - {data['description']}:")
            print(f"  Count: {data['count']}")
            print(f"  Avg Cost: ${data['avg_base_cost']:.2f}")
            print(f"  Median Cost: ${data['median_base_cost']:.2f}")
            print(f"  Range: ${data['min_cost']:.2f} - ${data['max_cost']:.2f}")
        
        print("\n--- REGION ANALYSIS ---")
        for region, data in self.summary['regionAnalysis'].items():
            print(f"{region}:")
            print(f"  Count: {data['count']}")
            print(f"  Avg Cost: ${data['avg_base_cost']:.2f}")
            print(f"  Median Cost: ${data['median_base_cost']:.2f}")
            print(f"  Range: ${data['min_cost']:.2f} - ${data['max_cost']:.2f}")
    
    def save_summary(self, output_file):
        """Save the summary data to a JSON file"""
        if not self.summary:
            print("No analysis performed. Run analyze() first.")
            return False
        
        try:
            with open(output_file, 'w') as f:
                json.dump(self.summary, f, indent=2)
            print(f"Summary saved to: {output_file}")
            return True
        except Exception as e:
            print(f"Error saving summary: {str(e)}")
            return False

def main():
    if len(sys.argv) < 2:
        print(f"Usage: {sys.argv[0]} <json_file> [output_file]")
        sys.exit(1)
    
    json_file = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else "benton_county_data_summary.json"
    
    analyzer = BentonCountyDataAnalyzer(json_file)
    if analyzer.load_data():
        if analyzer.analyze():
            analyzer.print_summary()
            analyzer.save_summary(output_file)

if __name__ == "__main__":
    main()