#!/bin/bash
# Shared helpers sourced by all nethys-search scripts.
# Usage: source "$(dirname "$0")/common.sh"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FIXTURES_DIR="$SCRIPT_DIR/fixtures"

# Load credentials
ENV_FILE="$SCRIPT_DIR/../.env"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERROR: .env file not found at $ENV_FILE" >&2
  exit 1
fi
# shellcheck disable=SC1090
source "$ENV_FILE"

# Constants
ENGINE_NAME="nethys"
INDEX_NAME="search-nethys"
DOMAIN_ID="6419c4ebb35f0f52d96c2b33"
PIPELINE_NAME="search-nethys@custom"

# Derive ES and Kibana hosts from Cloud ID
# Cloud ID format: <label>:<base64(region$es_uuid$kibana_uuid)>
_decode_cloud_id() {
  local encoded
  encoded=$(echo "$ES_CLOUD_ID" | cut -d: -f2)
  echo "$encoded" | base64 -d 2>/dev/null || echo "$encoded" | base64 -D 2>/dev/null
}

get_es_host() {
  local decoded region es_uuid
  decoded=$(_decode_cloud_id)
  region=$(echo "$decoded" | cut -d'$' -f1)
  es_uuid=$(echo "$decoded" | cut -d'$' -f2)
  echo "https://${es_uuid}.${region}"
}

get_kibana_host() {
  local decoded region kibana_uuid
  decoded=$(_decode_cloud_id)
  region=$(echo "$decoded" | cut -d'$' -f1)
  kibana_uuid=$(echo "$decoded" | cut -d'$' -f3)
  echo "https://${kibana_uuid}.${region}"
}

# Check required tools
check_deps() {
  local missing=()
  for cmd in curl; do
    command -v "$cmd" &>/dev/null || missing+=("$cmd")
  done
  if [[ ${#missing[@]} -gt 0 ]]; then
    echo "ERROR: Missing required commands: ${missing[*]}" >&2
    exit 1
  fi
}

# JSON parse helper: try jq, fall back to python3
jq_or_python() {
  local filter="$1"
  local input="$2"
  if command -v jq &>/dev/null; then
    echo "$input" | jq -r "$filter"
  else
    # Convert jq filter to a rough python3 equivalent for simple cases
    echo "$input" | python3 -c "
import json, sys
data = json.load(sys.stdin)
# Execute the filter as a Python expression via eval
# This handles simple cases like .field, .field.subfield, etc.
filter = '''$filter'''
# Strip leading dot and split on dots for basic field access
parts = filter.lstrip('.').split('.')
result = data
for part in parts:
    if part:
        result = result[part]
if isinstance(result, (dict, list)):
    print(json.dumps(result, indent=2))
else:
    print(result)
"
  fi
}

# Make a curl call, print response body, return HTTP status code
# Usage: http_call <method> <url> <auth_header> [extra_curl_args...]
# Sets HTTP_STATUS and HTTP_BODY globals
http_call() {
  local method="$1"
  local url="$2"
  local auth_header="$3"
  shift 3

  local tmpfile
  tmpfile=$(mktemp)
  HTTP_STATUS=$(curl -s -o "$tmpfile" -w "%{http_code}" \
    -X "$method" \
    -H "$auth_header" \
    -H "Content-Type: application/json" \
    "$@" \
    "$url")
  HTTP_BODY=$(cat "$tmpfile")
  rm -f "$tmpfile"
}

check_deps
