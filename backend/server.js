// backend/server.js

// Importações
require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const slugify = require('slugify'); // <-- NOVO: Importa o slugify

// Configurações
const PORT = process.env.PORT || 4000;
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
app.post('/api/upload', upload.array('photos', 10), (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'Nenhum arquivo foi enviado.' });
    }

    // Agora, req.body.name está garantido que existe.
    const name = req.body.name || 'geral';
    const preSanitizedName = name.replace(/&/g, '-');
    const folderName = slugify(preSanitizedName, { lower: true, strict: true, replacement: '-', trim: true });
    const userFolderPath = path.join(UPLOADS_FOLDER, folderName);

    // Cria a pasta do usuário se ela não existir
    fs.mkdirSync(userFolderPath, { recursive: true });

    // Mapeia os arquivos e os move para a pasta correta
    const filesData = req.files.map(file => {
        const oldPath = file.path; // Caminho temporário (ex: uploads/photo-123.jpg)
        const newPath = path.join(userFolderPath, file.filename); // Caminho final (ex: uploads/joao-silva/photo-123.jpg)

        // Move o arquivo
        fs.renameSync(oldPath, newPath);

        return {
            filename: file.filename,
            url: `http://localhost:${PORT}/uploads/${folderName}/${file.filename}`
        };
    });

    res.status(200).json({
        message: 'Upload realizado com sucesso!',
        files: filesData
    });
});

const server = process.env.NODE_ENV !== 'test'
    ? app.listen(PORT, () => console.log(`🎉 Servidor backend rodando na porta ${PORT}`))
    : null;

module.exports = { app, server };