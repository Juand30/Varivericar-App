require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, PutCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');

const app = express();
app.use(cors());
app.use(express.json());

// --- CONFIGURACIÓN AWS ---
const REGION = process.env.AWS_REGION || 'us-east-1';
const BUCKET_NAME = process.env.S3_BUCKET_NAME;
const DYNAMO_TABLE_REPORTS = 'Reports';
const DYNAMO_TABLE_USERS = 'Users';

// Validar credenciales al inicio solo si estamos en producción
if (process.env.NODE_ENV === 'production') {
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.S3_BUCKET_NAME) {
    console.warn("⚠️  ADVERTENCIA: Faltan variables de entorno AWS. La app funcionará, pero la subida de archivos fallará.");
  }
}

const s3Client = new S3Client({ region: REGION });
const dbClient = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(dbClient);

// --- SERVIR FRONTEND ESTATICO ---
// Express busca la carpeta 'dist' que está un nivel arriba (../dist)
const distPath = path.join(__dirname, '../dist');

// Middleware para verificar si existe el build
app.use((req, res, next) => {
  if (req.method === 'GET' && !fs.existsSync(distPath) && !req.path.startsWith('/api')) {
    return res.status(503).send('<h1>Sitio en mantenimiento</h1><p>El sistema se está compilando. Intente en unos segundos.</p>');
  }
  next();
});

app.use(express.static(distPath));

// --- API ENDPOINTS ---

// 1. S3 Upload Request
app.post('/upload-request', async (req, res) => {
  try {
    const { fileName, fileType } = req.body;
    const uniqueFileName = `evidence/${Date.now()}-${fileName}`;
    
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: uniqueFileName,
      ContentType: fileType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    const publicUrl = `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/${uniqueFileName}`;

    res.json({ uploadUrl, publicUrl });
  } catch (error) {
    console.error("Error S3:", error);
    res.status(500).json({ error: 'Error preparando subida AWS' });
  }
});

// 2. DynamoDB Generic Get
app.get('/:collection', async (req, res) => {
  const { collection } = req.params;
  // Evitar acceso a rutas que no sean de datos
  if (['upload-request', 'favicon.ico'].includes(collection)) return res.status(404).end();
  
  const tableName = collection === 'reports' ? DYNAMO_TABLE_REPORTS : DYNAMO_TABLE_USERS;

  try {
    const command = new ScanCommand({ TableName: tableName });
    const response = await docClient.send(command);
    res.json(response.Items || []);
  } catch (error) {
    console.error(`Error leyendo ${collection}:`, error);
    // Si falla (ej. tabla no existe), devolvemos array vacío para no romper el frontend
    res.json([]); 
  }
});

// 3. DynamoDB Generic Save
app.post('/:collection', async (req, res) => {
  const { collection } = req.params;
  const tableName = collection === 'reports' ? DYNAMO_TABLE_REPORTS : DYNAMO_TABLE_USERS;
  const item = req.body;

  try {
    const command = new PutCommand({
      TableName: tableName,
      Item: item
    });
    await docClient.send(command);
    res.json({ success: true, item });
  } catch (error) {
    console.error(`Error guardando en ${collection}:`, error);
    res.status(500).json({ error: 'Error guardando datos' });
  }
});

// 4. DynamoDB Generic Delete
app.delete('/:collection/:id', async (req, res) => {
  const { collection, id } = req.params;
  const tableName = collection === 'reports' ? DYNAMO_TABLE_REPORTS : DYNAMO_TABLE_USERS;

  try {
    const command = new DeleteCommand({
      TableName: tableName,
      Key: { id: id }
    });
    await docClient.send(command);
    res.json({ success: true });
  } catch (error) {
    console.error(`Error eliminando en ${collection}:`, error);
    res.status(500).json({ error: 'Error eliminando datos' });
  }
});

// --- CATCH-ALL PARA REACT ROUTER ---
// Cualquier ruta no capturada por la API devuelve index.html
app.get('*', (req, res) => {
  const indexHtml = path.join(distPath, 'index.html');
  if (fs.existsSync(indexHtml)) {
    res.sendFile(indexHtml);
  } else {
    res.status(404).send('Error: Build no encontrado. Ejecute npm run build.');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor backend iniciado en puerto ${PORT}`);
  console.log(`📂 Sirviendo frontend desde: ${distPath}`);
});