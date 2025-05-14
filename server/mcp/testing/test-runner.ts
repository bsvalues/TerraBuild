/**
 * MCP Agent Test Runner
 * 
 * This module provides utilities for running MCP agent tests
 * and generating test reports.
 */

import { agentTesting, TestResult } from './agent-testing';
import { 
  dataQualityTestCases,
  complianceTestCases, 
  costAnalysisTestCases 
} from './test-cases';
import { logger } from '../../utils/logger';

interface TestRunResult {
  agentId: string;
  agentName: string;
  passed: number;
  failed: number;
  total: number;
  passRate: number;
  results: TestResult[];
  timestamp: number;
  duration: number;
}

/**
 * Agent Test Runner Service
 * 
 * Provides utilities for running agent test suites
 */
class TestRunnerService {
  /**
   * Run all tests for the specified agent
   * 
   * @param agentId Agent ID
   * @param agentName Agent name
   * @returns Test run results
   */
  async runTests(agentId: string, agentName: string): Promise<TestRunResult> {
    logger.info(`[TestRunner] Starting test run for ${agentName} (${agentId})`);
    
    const startTime = Date.now();
    let results: TestResult[] = [];
    
    try {
      // Select appropriate test cases based on agent ID
      let testCases = [];
      
      if (agentId === 'data-quality-agent') {
        testCases = dataQualityTestCases;
      } else if (agentId === 'compliance-agent') {
        testCases = complianceTestCases;
      } else if (agentId === 'cost-analysis-agent') {
        testCases = costAnalysisTestCases;
      } else {
        logger.warn(`[TestRunner] No predefined test cases for agent: ${agentId}`);
      }
      
      // Run the test suite
      results = await agentTesting.runTestSuite(agentId, testCases);
      
      // Calculate results
      const endTime = Date.now();
      const passed = results.filter(r => r.success).length;
      const failed = results.length - passed;
      const passRate = results.length > 0 ? (passed / results.length) * 100 : 0;
      
      const runResult: TestRunResult = {
        agentId,
        agentName,
        passed,
        failed,
        total: results.length,
        passRate,
        results,
        timestamp: startTime,
        duration: endTime - startTime
      };
      
      logger.info(`[TestRunner] Test run completed for ${agentName}: ${passed}/${results.length} tests passed (${passRate.toFixed(1)}%)`);
      
      return runResult;
    } catch (error) {
      logger.error(`[TestRunner] Error running tests for ${agentName}:`, error);
      
      const endTime = Date.now();
      
      return {
        agentId,
        agentName,
        passed: 0,
        failed: results.length,
        total: results.length,
        passRate: 0,
        results,
        timestamp: startTime,
        duration: endTime - startTime
      };
    }
  }
  
  /**
   * Run tests for all MCP agents
   * 
   * @returns Test run results for all agents
   */
  async runAllTests(): Promise<TestRunResult[]> {
    logger.info('[TestRunner] Starting test run for all agents');
    
    const results: TestRunResult[] = [];
    
    // Test data quality agent
    results.push(await this.runTests('data-quality-agent', 'Data Quality Agent'));
    
    // Test compliance agent
    results.push(await this.runTests('compliance-agent', 'Compliance Agent'));
    
    // Test cost analysis agent
    results.push(await this.runTests('cost-analysis-agent', 'Cost Analysis Agent'));
    
    // Summarize results
    const totalTests = results.reduce((sum, r) => sum + r.total, 0);
    const totalPassed = results.reduce((sum, r) => sum + r.passed, 0);
    const overallPassRate = totalTests > 0 ? (totalPassed / totalTests) * 100 : 0;
    
    logger.info(`[TestRunner] All tests completed: ${totalPassed}/${totalTests} tests passed (${overallPassRate.toFixed(1)}%)`);
    
    return results;
  }
  
  /**
   * Generate a simple report string from test results
   * 
   * @param results Test run results
   * @returns Formatted report string
   */
  generateReport(results: TestRunResult[]): string {
    const timestamp = new Date().toISOString();
    const totalTests = results.reduce((sum, r) => sum + r.total, 0);
    const totalPassed = results.reduce((sum, r) => sum + r.passed, 0);
    const overallPassRate = totalTests > 0 ? (totalPassed / totalTests) * 100 : 0;
    
    let report = `
=======================================================
  MCP AGENT TEST REPORT
  Generated: ${timestamp}
=======================================================

SUMMARY:
  Total Tests: ${totalTests}
  Tests Passed: ${totalPassed}
  Tests Failed: ${totalTests - totalPassed}
  Overall Pass Rate: ${overallPassRate.toFixed(1)}%

RESULTS BY AGENT:
`;
    
    for (const result of results) {
      report += `
  ${result.agentName} (${result.agentId}):
    Tests: ${result.total}
    Passed: ${result.passed}
    Failed: ${result.failed}
    Pass Rate: ${result.passRate.toFixed(1)}%
    Duration: ${(result.duration / 1000).toFixed(2)}s
      
    Failures:
`;
      
      const failures = result.results.filter(r => !r.success);
      
      if (failures.length === 0) {
        report += '      None\n';
      } else {
        for (const failure of failures) {
          report += `      - ${failure.description}\n`;
          if (failure.details?.error) {
            report += `        Error: ${failure.details.error}\n`;
          }
        }
      }
      
      report += '\n';
    }
    
    report += `
=======================================================
  END OF REPORT
=======================================================
`;
    
    return report;
  }
}

// Create the singleton instance
export const testRunner = new TestRunnerService();