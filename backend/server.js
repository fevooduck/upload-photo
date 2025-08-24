// backend/server.js

// Importações
require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const slugify = require('slugify'); // <-- NOVO: Importa o slugify
const sharp = require('sharp');

// Configurações
const PORT = process.env.PORT || 4000;
const BASE_URL = process.env.APP_URL || `http://localhost:${PORT}`;
const UPLOADS_FOLDER = 'uploads/';

// Garante que a pasta de uploads principal exista
if (!fs.existsSync(UPLOADS_FOLDER)) {
    fs.mkdirSync(UPLOADS_FOLDER);
}

// Inicializa o app Express
const app = express();

// Middlewares
app.use(cors());
// Agora servimos a pasta 'uploads' inteira, que conterá as subpastas
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configuração do Multer para armazenamento de arquivos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOADS_FOLDER);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + extension);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 15 * 1024 * 1024 // Limite de 15MB por arquivo
    }
});

// Rota principal da API
app.get('/api', (req, res) => {
    res.json({ message: 'API de upload de fotos funcionando!' });
});

// Rota de Upload - MODIFICADA PARA MÚLTIPLOS ARQUIVOS
// 'photos' é o nome do campo, e 10 é o número máximo de arquivos por requisição
app.post('/api/upload', upload.array('photos', 10), async (req, res) => { // <-- 2. Torne a função async
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'Nenhum arquivo foi enviado.' });
    }
    
    try {
        const name = req.body.name || 'geral';
        const preSanitizedName = name.replace(/&/g, '-');
        const folderName = slugify(preSanitizedName, { lower: true, strict: true, replacement: '-', trim: true });
        const userFolderPath = path.join(UPLOADS_FOLDER, folderName);
        const thumbnailsFolderPath = path.join(userFolderPath, 'thumbnails'); // <-- 3. Defina a pasta de thumbnails

        fs.mkdirSync(thumbnailsFolderPath, { recursive: true });

        // 4. Use Promise.all para processar todas as imagens em paralelo
        const filesDataPromises = req.files.map(async (file) => {
            const oldPath = file.path;
            const newPath = path.join(userFolderPath, file.filename);
            const thumbnailPath = path.join(thumbnailsFolderPath, file.filename);

            fs.renameSync(oldPath, newPath);

            // --- CRIAÇÃO DA THUMBNAIL ---
            await sharp(newPath)
                .resize({ width: 400 }) // Redimensiona para 400px de largura, mantendo o aspect ratio
                .toFile(thumbnailPath);

            return {
                filename: file.filename,
                originalUrl: `${BASE_URL}/uploads/${folderName}/${file.filename}`,
                thumbnailUrl: `${BASE_URL}/uploads/${folderName}/thumbnails/${file.filename}`,
            };
        });

        const filesData = await Promise.all(filesDataPromises);

        res.status(200).json({
            message: 'Upload realizado com sucesso!',
            files: filesData
        });
    } catch (error) {
        console.error("Erro no processamento de upload:", error);
        res.status(500).json({ error: 'Ocorreu um erro ao processar os arquivos.' });
    }
});

app.get('/api/images', (req, res) => {
    try {
        const allImages = [];
        // Lê todas as pastas de usuário na pasta 'uploads'
        const userRoutes = fs.readdirSync(UPLOADS_FOLDER, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);

        for (const userFolder of userRoutes) {
            const userFolderPath = path.join(UPLOADS_FOLDER, userFolder);
            // Lê todos os arquivos na pasta do usuário (ignorando a pasta de thumbnails)
            const imageFiles = fs.readdirSync(userFolderPath)
                .filter(file => file !== 'thumbnails');

            for (const imageFile of imageFiles) {
                // Monta o objeto de dados para cada imagem
                allImages.push({
                    user: userFolder,
                    originalUrl: `${BASE_URL}/uploads/${userFolder}/${imageFile}`,
                    thumbnailUrl: `${BASE_URL}/uploads/${userFolder}/thumbnails/${imageFile}`,
                });
            }
        }
        res.status(200).json(allImages);
    } catch (error) {
        console.error("Erro ao listar imagens:", error);
        res.status(500).json({ error: 'Não foi possível listar as imagens.' });
    }
});

const server = process.env.NODE_ENV !== 'test'
    ? app.listen(PORT, () => console.log(`🎉 Servidor backend rodando na porta ${PORT}`))
    : null;

module.exports = { app, server };