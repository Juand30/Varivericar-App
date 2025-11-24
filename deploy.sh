cat << 'EOF' > deploy.sh
#!/bin/bash
set -e
echo "--- INICIO MANUAL ---"
npm install
npm run build
cd backend
npm install
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
fi
pm2 delete varivericar 2> /dev/null || true
pm2 start server.js --name "varivericar"
echo "--- FIN ---"
EOF
chmod +x deploy.sh
./deploy.sh
