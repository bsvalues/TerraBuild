##
## Vault Configuration Templates for TerraFusion
##

# Agent Policy Template
agent_policy = <<EOT
# Agent access policy
path "secret/data/terrafusion/agents/{{identity.entity.aliases.${auth_mount_accessor}.name}}/*" {
  capabilities = ["read"]
}

# Allow agents to write telemetry data
path "secret/data/terrafusion/telemetry/{{identity.entity.aliases.${auth_mount_accessor}.name}}/*" {
  capabilities = ["create", "update"]
}

# Read common agent configuration
path "secret/data/terrafusion/agents/common/*" {
  capabilities = ["read"]
}

# Deny all other paths
path "*" {
  capabilities = ["deny"]
}
EOT

# Service Policy Template
service_policy = <<EOT
# Service access policy
path "secret/data/terrafusion/services/{{identity.entity.aliases.${auth_mount_accessor}.name}}/*" {
  capabilities = ["read"]
}

# Allow services to read agent public keys
path "secret/data/terrafusion/agents/*/public_key" {
  capabilities = ["read"]
}

# Allow services to request dynamic database credentials
path "database/creds/{{identity.entity.aliases.${auth_mount_accessor}.name}}" {
  capabilities = ["read"]
}

# Deny all other paths
path "*" {
  capabilities = ["deny"]
}
EOT

# Admin Policy Template
admin_policy = <<EOT
# Admin access policy
path "secret/data/terrafusion/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

path "secret/metadata/terrafusion/*" {
  capabilities = ["list"]
}

# Allow admins to manage policies
path "sys/policies/acl/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

# Allow admins to manage entities and groups
path "identity/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

# Allow admins to manage auth methods
path "auth/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

# Allow admins to manage database configuration
path "database/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

# Allow rotation of root credentials
path "database/rotate-root/*" {
  capabilities = ["update"]
}
EOT

# Agent Kubernetes Auth Role Template
agent_kubernetes_auth_role = <<EOT
{
  "bound_service_account_names": "{{service_account}}",
  "bound_service_account_namespaces": "{{namespace}}",
  "policies": ["agent-{{agent_name}}"],
  "ttl": "1h",
  "max_ttl": "24h"
}
EOT

# Service Kubernetes Auth Role Template
service_kubernetes_auth_role = <<EOT
{
  "bound_service_account_names": "{{service_account}}",
  "bound_service_account_namespaces": "{{namespace}}",
  "policies": ["service-{{service_name}}"],
  "ttl": "1h",
  "max_ttl": "24h"
}
EOT

# Database Role Template
database_role = <<EOT
{
  "db_name": "postgres",
  "creation_statements": [
    "CREATE ROLE \"{{name}}\" WITH LOGIN PASSWORD '{{password}}' VALID UNTIL '{{expiration}}';",
    "GRANT SELECT ON ALL TABLES IN SCHEMA public TO \"{{name}}\";",
    "GRANT INSERT ON {{insert_tables}} TO \"{{name}}\";",
    "GRANT UPDATE ON {{update_tables}} TO \"{{name}}\";",
    "GRANT DELETE ON {{delete_tables}} TO \"{{name}}\";"
  ],
  "revocation_statements": [
    "REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM \"{{name}}\";",
    "REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM \"{{name}}\";",
    "REVOKE USAGE ON SCHEMA public FROM \"{{name}}\";",
    "DROP ROLE IF EXISTS \"{{name}}\";"
  ],
  "default_ttl": "1h",
  "max_ttl": "24h"
}
EOT

# Secret Template for AI API Keys
ai_api_keys_template = <<EOT
{
  "data": {
    "openai": "{{openai_api_key}}",
    "anthropic": "{{anthropic_api_key}}",
    "replicate": "{{replicate_api_key}}",
    "huggingface": "{{huggingface_api_key}}"
  }
}
EOT

# Secret Template for Database Credentials
database_credentials_template = <<EOT
{
  "data": {
    "host": "{{database_host}}",
    "port": "{{database_port}}",
    "username": "{{database_username}}",
    "password": "{{database_password}}",
    "dbname": "{{database_name}}"
  }
}
EOT

# Secret Template for Agent Keys
agent_keys_template = <<EOT
{
  "data": {
    "private_key": "{{agent_private_key}}",
    "public_key": "{{agent_public_key}}",
    "api_key": "{{agent_api_key}}"
  }
}
EOT

# Secret Template for JWT Authentication
jwt_auth_template = <<EOT
{
  "data": {
    "secret_key": "{{jwt_secret_key}}",
    "public_key": "{{jwt_public_key}}",
    "private_key": "{{jwt_private_key}}",
    "expiry": "{{jwt_expiry}}"
  }
}
EOT