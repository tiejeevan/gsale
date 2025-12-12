#!/bin/bash

# Create certificates directory
mkdir -p certs

# Generate self-signed certificate for local development
openssl req -x509 -newkey rsa:4096 -keyout certs/key.pem -out certs/cert.pem -days 365 -nodes -subj "/C=US/ST=State/L=City/O=Organization/CN=192.168.1.107"

echo "HTTPS certificates created!"
echo "To use HTTPS, run: HTTPS=true npm run dev"
echo "Then access: https://192.168.1.107:5173"
echo ""
echo "Note: You'll need to accept the self-signed certificate warning in your browser."