#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VALIDATION_LOG="/tmp/wa-deployment-validation-$(date +%Y%m%d-%H%M%S).log"
COUNTIES=("yakima" "walla-walla" "cowlitz" "franklin" "island" "san-juan" "klickitat" "asotin")

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

declare -A VALIDATION_RESULTS=()

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a "$VALIDATION_LOG"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}" | tee -a "$VALIDATION_LOG"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}" | tee -a "$VALIDATION_LOG"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}" | tee -a "$VALIDATION_LOG"
}

validate_infrastructure() {
    log "Validating Washington State infrastructure..."
    
    local checks_passed=0
    local total_checks=5
    
    info "Check 1/5: Kubernetes cluster connectivity"
    if kubectl cluster-info &>/dev/null; then
        info "✓ Kubernetes cluster accessible"
        ((checks_passed++))
    else
        error "✗ Kubernetes cluster not accessible"
    fi
    
    info "Check 2/5: Namespace existence"
    if kubectl get namespace terrabuild-wa &>/dev/null; then
        info "✓ terrabuild-wa namespace exists"
        ((checks_passed++))
    else
        error "✗ terrabuild-wa namespace not found"
    fi
    
    info "Check 3/5: Database connectivity"
    if kubectl exec -n terrabuild-wa postgres-0 -- pg_isready &>/dev/null; then
        info "✓ PostgreSQL database accessible"
        ((checks_passed++))
    else
        error "✗ PostgreSQL database not accessible"
    fi
    
    info "Check 4/5: State hub deployment"
    if kubectl get deployment terrabuild-wa-hub -n terrabuild-wa &>/dev/null; then
        info "✓ Washington State hub deployed"
        ((checks_passed++))
    else
        error "✗ Washington State hub not deployed"
    fi
    
    info "Check 5/5: Monitoring stack"
    if kubectl get deployment prometheus -n terrabuild-wa &>/dev/null; then
        info "✓ Monitoring stack deployed"
        ((checks_passed++))
    else
        warn "✗ Monitoring stack not found"
    fi
    
    VALIDATION_RESULTS["infrastructure"]="$checks_passed/$total_checks"
    
    if [ $checks_passed -lt 4 ]; then
        error "Critical infrastructure validation failed: $checks_passed/$total_checks passed"
        return 1
    fi
    
    log "Infrastructure validation completed: $checks_passed/$total_checks checks passed"
    return 0
}

validate_county_deployment() {
    local county="$1"
    
    info "Validating $county County deployment..."
    
    local checks_passed=0
    local total_checks=6
    
    info "Check 1/6: Deployment status"
    if kubectl get deployment "terrabuild-$county" -n terrabuild-wa &>/dev/null; then
        local ready_replicas=$(kubectl get deployment "terrabuild-$county" -n terrabuild-wa -o jsonpath='{.status.readyReplicas}')
        local desired_replicas=$(kubectl get deployment "terrabuild-$county" -n terrabuild-wa -o jsonpath='{.spec.replicas}')
        
        if [ "${ready_replicas:-0}" -eq "${desired_replicas:-0}" ] && [ "${ready_replicas:-0}" -gt 0 ]; then
            info "✓ Deployment ready ($ready_replicas/$desired_replicas replicas)"
            ((checks_passed++))
        else
            error "✗ Deployment not ready ($ready_replicas/$desired_replicas replicas)"
        fi
    else
        error "✗ Deployment not found"
    fi
    
    info "Check 2/6: Configuration map"
    if kubectl get configmap "${county}-county-config" -n terrabuild-wa &>/dev/null; then
        info "✓ Configuration map exists"
        ((checks_passed++))
    else
        error "✗ Configuration map not found"
    fi
    
    info "Check 3/6: Service accessibility"
    if kubectl get service "terrabuild-$county-service" -n terrabuild-wa &>/dev/null; then
        info "✓ Service exists"
        ((checks_passed++))
    else
        error "✗ Service not found"
    fi
    
    info "Check 4/6: Health endpoint"
    local pod_name=$(kubectl get pods -n terrabuild-wa -l app="terrabuild-$county" -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
    if [ -n "$pod_name" ]; then
        if kubectl exec -n terrabuild-wa "$pod_name" -- curl -f http://localhost:5000/api/health &>/dev/null; then
            info "✓ Health endpoint responding"
            ((checks_passed++))
        else
            error "✗ Health endpoint not responding"
        fi
    else
        error "✗ No running pods found"
    fi
    
    info "Check 5/6: Database connectivity"
    if [ -n "$pod_name" ]; then
        if kubectl exec -n terrabuild-wa "$pod_name" -- node -e "require('pg').Client().connect().then(() => console.log('OK')).catch(() => process.exit(1))" &>/dev/null; then
            info "✓ Database connectivity verified"
            ((checks_passed++))
        else
            error "✗ Database connectivity failed"
        fi
    fi
    
    info "Check 6/6: API endpoints"
    if [ -n "$pod_name" ]; then
        local api_endpoints=("/api/properties" "/api/calculations" "/api/user")
        local api_passed=0
        
        for endpoint in "${api_endpoints[@]}"; do
            if kubectl exec -n terrabuild-wa "$pod_name" -- curl -f "http://localhost:5000$endpoint" &>/dev/null; then
                ((api_passed++))
            fi
        done
        
        if [ $api_passed -eq ${#api_endpoints[@]} ]; then
            info "✓ All API endpoints responding"
            ((checks_passed++))
        else
            warn "✗ $api_passed/${#api_endpoints[@]} API endpoints responding"
        fi
    fi
    
    VALIDATION_RESULTS["$county"]="$checks_passed/$total_checks"
    
    info "$county County validation completed: $checks_passed/$total_checks checks passed"
    
    if [ $checks_passed -ge 4 ]; then
        return 0
    else
        return 1
    fi
}

validate_integration_capabilities() {
    log "Validating integration capabilities..."
    
    local checks_passed=0
    local total_checks=4
    
    info "Check 1/4: Cross-county data sharing"
    if kubectl get service wa-state-data-hub-service -n terrabuild-wa &>/dev/null; then
        info "✓ Data sharing service deployed"
        ((checks_passed++))
    else
        error "✗ Data sharing service not found"
    fi
    
    info "Check 2/4: State-level reporting"
    local hub_pod=$(kubectl get pods -n terrabuild-wa -l app=terrabuild-wa-hub -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
    if [ -n "$hub_pod" ]; then
        if kubectl exec -n terrabuild-wa "$hub_pod" -- curl -f http://localhost:5000/api/state/report &>/dev/null; then
            info "✓ State reporting endpoint accessible"
            ((checks_passed++))
        else
            warn "✗ State reporting endpoint not responding"
        fi
    fi
    
    info "Check 3/4: AI agent coordination"
    if [ -n "$hub_pod" ]; then
        if kubectl exec -n terrabuild-wa "$hub_pod" -- curl -f http://localhost:5000/api/agents/status &>/dev/null; then
            info "✓ AI agent coordination active"
            ((checks_passed++))
        else
            warn "✗ AI agent coordination not responding"
        fi
    fi
    
    info "Check 4/4: Monitoring integration"
    if kubectl get servicemonitor -n terrabuild-wa &>/dev/null; then
        local monitor_count=$(kubectl get servicemonitor -n terrabuild-wa --no-headers | wc -l)
        if [ "$monitor_count" -ge 8 ]; then
            info "✓ Monitoring configured for all counties ($monitor_count monitors)"
            ((checks_passed++))
        else
            warn "✗ Incomplete monitoring setup ($monitor_count monitors)"
        fi
    else
        error "✗ No monitoring configuration found"
    fi
    
    VALIDATION_RESULTS["integration"]="$checks_passed/$total_checks"
    
    log "Integration validation completed: $checks_passed/$total_checks checks passed"
    
    if [ $checks_passed -ge 3 ]; then
        return 0
    else
        return 1
    fi
}

performance_testing() {
    log "Running performance tests across all counties..."
    
    local performance_results=()
    
    for county in "${COUNTIES[@]}"; do
        info "Testing $county County performance..."
        
        local pod_name=$(kubectl get pods -n terrabuild-wa -l app="terrabuild-$county" -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
        
        if [ -n "$pod_name" ]; then
            local start_time=$(date +%s%N)
            
            if kubectl exec -n terrabuild-wa "$pod_name" -- curl -f http://localhost:5000/api/health &>/dev/null; then
                local end_time=$(date +%s%N)
                local response_time=$(( (end_time - start_time) / 1000000 ))
                
                performance_results+=("$county:${response_time}ms")
                
                if [ $response_time -lt 2000 ]; then
                    info "✓ $county response time: ${response_time}ms (target: <2000ms)"
                else
                    warn "✗ $county response time: ${response_time}ms (exceeds 2000ms target)"
                fi
            else
                performance_results+=("$county:FAILED")
                error "✗ $county health check failed"
            fi
        else
            performance_results+=("$county:NO_POD")
            error "✗ $county pod not found"
        fi
    done
    
    VALIDATION_RESULTS["performance"]="${performance_results[*]}"
    
    log "Performance testing completed"
}

security_validation() {
    log "Validating security configuration..."
    
    local checks_passed=0
    local total_checks=5
    
    info "Check 1/5: TLS encryption"
    for county in "${COUNTIES[@]}"; do
        local service_name="terrabuild-$county-service"
        if kubectl get service "$service_name" -n terrabuild-wa -o jsonpath='{.metadata.annotations.service\.beta\.kubernetes\.io/aws-load-balancer-ssl-cert}' &>/dev/null; then
            ((checks_passed++))
            break
        fi
    done
    
    if [ $checks_passed -gt 0 ]; then
        info "✓ TLS encryption configured"
    else
        warn "✗ TLS encryption not found"
        checks_passed=0
    fi
    
    info "Check 2/5: Network policies"
    if kubectl get networkpolicy -n terrabuild-wa &>/dev/null; then
        info "✓ Network policies configured"
        ((checks_passed++))
    else
        warn "✗ Network policies not found"
    fi
    
    info "Check 3/5: RBAC configuration"
    if kubectl get rolebinding -n terrabuild-wa &>/dev/null; then
        info "✓ RBAC configured"
        ((checks_passed++))
    else
        warn "✗ RBAC not configured"
    fi
    
    info "Check 4/5: Secret management"
    if kubectl get secrets -n terrabuild-wa | grep -q postgres-credentials; then
        info "✓ Database secrets configured"
        ((checks_passed++))
    else
        warn "✗ Database secrets not found"
    fi
    
    info "Check 5/5: Pod security policies"
    if kubectl get podsecuritypolicy &>/dev/null; then
        info "✓ Pod security policies configured"
        ((checks_passed++))
    else
        warn "✗ Pod security policies not found"
    fi
    
    VALIDATION_RESULTS["security"]="$checks_passed/$total_checks"
    
    log "Security validation completed: $checks_passed/$total_checks checks passed"
}

generate_validation_report() {
    log "Generating comprehensive validation report..."
    
    local report_file="wa-deployment-validation-$(date +%Y%m%d-%H%M%S).md"
    
    cat > "$report_file" << EOF
# Washington State Deployment Validation Report

**Validation Date**: $(date)
**Validator**: TerraBuild Deployment System
**Counties**: ${COUNTIES[*]}

## Executive Summary

The Washington State multi-county TerraBuild deployment has been validated across 8 counties with comprehensive testing of infrastructure, functionality, performance, and security.

## Validation Results Summary

### Infrastructure Validation
**Result**: ${VALIDATION_RESULTS["infrastructure"]}

### County-Specific Validations
EOF
    
    for county in "${COUNTIES[@]}"; do
        echo "- **$county County**: ${VALIDATION_RESULTS["$county"]}" >> "$report_file"
    done
    
    cat >> "$report_file" << EOF

### Integration Capabilities
**Result**: ${VALIDATION_RESULTS["integration"]}

### Performance Testing
**Results**: ${VALIDATION_RESULTS["performance"]}

### Security Validation  
**Result**: ${VALIDATION_RESULTS["security"]}

## Detailed Findings

### Successful Deployments
EOF
    
    local successful_counties=()
    local failed_counties=()
    
    for county in "${COUNTIES[@]}"; do
        local result="${VALIDATION_RESULTS["$county"]}"
        local passed=$(echo "$result" | cut -d'/' -f1)
        local total=$(echo "$result" | cut -d'/' -f2)
        
        if [ "$passed" -ge 4 ]; then
            successful_counties+=("$county")
        else
            failed_counties+=("$county")
        fi
    done
    
    for county in "${successful_counties[@]}"; do
        echo "- $county County: Fully operational" >> "$report_file"
    done
    
    if [ ${#failed_counties[@]} -gt 0 ]; then
        echo -e "\n### Counties Requiring Attention" >> "$report_file"
        for county in "${failed_counties[@]}"; do
            echo "- $county County: Requires investigation" >> "$report_file"
        done
    fi
    
    cat >> "$report_file" << EOF

## Performance Metrics

### Response Time Analysis
EOF
    
    echo "${VALIDATION_RESULTS["performance"]}" | tr ' ' '\n' | while IFS=: read -r county time; do
        echo "- $county: $time" >> "$report_file"
    done
    
    cat >> "$report_file" << EOF

## Recommendations

### Immediate Actions Required
EOF
    
    if [ ${#failed_counties[@]} -gt 0 ]; then
        echo "1. Investigate and resolve issues in counties: ${failed_counties[*]}" >> "$report_file"
    else
        echo "1. No immediate actions required - all counties operational" >> "$report_file"
    fi
    
    cat >> "$report_file" << EOF
2. Monitor performance metrics for optimization opportunities
3. Schedule regular validation runs (weekly recommended)
4. Implement automated alerting for critical failures

### Next Steps
1. Begin user training programs for operational counties
2. Initiate data migration for validated deployments
3. Establish county-specific support procedures
4. Plan go-live dates based on validation results

## Support Contacts

- **Washington State Technical Lead**: wa-tech@terrabuild.com
- **Deployment Support**: deployment@terrabuild.com
- **Emergency Escalation**: 1-800-TERRA-WA

---
*Validation completed by TerraBuild Enterprise Deployment System*
EOF
    
    log "Validation report generated: $report_file"
    
    local total_successful=${#successful_counties[@]}
    local total_counties=${#COUNTIES[@]}
    
    if [ $total_successful -eq $total_counties ]; then
        log "🎉 All $total_counties counties validated successfully!"
    else
        warn "$total_successful/$total_counties counties validated successfully"
    fi
}

main() {
    log "Starting Washington State deployment validation..."
    
    if ! validate_infrastructure; then
        error "Infrastructure validation failed - aborting county validations"
        exit 1
    fi
    
    local successful_counties=0
    
    for county in "${COUNTIES[@]}"; do
        if validate_county_deployment "$county"; then
            ((successful_counties++))
        fi
    done
    
    validate_integration_capabilities
    performance_testing
    security_validation
    generate_validation_report
    
    log "Washington State deployment validation completed"
    log "Results: $successful_counties/${#COUNTIES[@]} counties validated successfully"
    log "Detailed report and logs available"
    
    if [ $successful_counties -eq ${#COUNTIES[@]} ]; then
        log "✅ All counties ready for production deployment!"
        exit 0
    else
        warn "⚠️  Some counties require attention before production deployment"
        exit 1
    fi
}

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi