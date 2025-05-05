#!/bin/bash

# Create a tar archive of the MCP Matrix Upload Module
echo "Creating tar archive of the MCP Matrix Upload Module..."
tar -czf mcp-matrix-upload-module.tar.gz -C mcp-matrix-upload-module .

# Check if the archive was created successfully
if [ -f mcp-matrix-upload-module.tar.gz ]; then
  echo "Archive created successfully: mcp-matrix-upload-module.tar.gz"
  echo "Size: $(du -h mcp-matrix-upload-module.tar.gz | cut -f1)"
  echo "Contents:"
  tar -tzf mcp-matrix-upload-module.tar.gz
else
  echo "Failed to create archive."
  exit 1
fi