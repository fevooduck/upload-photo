// backend/__tests__/upload.test.js

const request = require('supertest');
const { app } = require('../server');// Importa o app Express
const fs = require('fs');
const path = require('path');
const slugify = require('slugify');

const UPLOADS_FOLDER = path.join(__dirname, '../uploads');

// Função de utilidade para sanitizar nomes (copiada do server.js para teste unitário)
const sanitizeFolderName = (name) => {
    const preSanitizedName = name.replace(/&/g, '-');
    return slugify(preSanitizedName, {
        lower: true,
        strict: true,
        replacement: '-',
        trim: true
    });
};

// --- Bloco de Testes ---
describe('Upload de Arquivos', () => {

    // Limpa a pasta de uploads antes e depois dos testes
    beforeAll(() => {
        if (fs.existsSync(UPLOADS_FOLDER)) {
            fs.rmSync(UPLOADS_FOLDER, { recursive: true, force: true });
        }
        fs.mkdirSync(UPLOADS_FOLDER, { recursive: true });
    });

    // Teste unitário para a função de sanitização
    describe('Sanitização de Nomes de Pasta', () => {
        it('deve remover acentos, espaços e o caractere &', () => {
            const input = 'João & Maria';
            const expected = 'joao-maria';
            expect(sanitizeFolderName(input)).toBe(expected);
        });

        it('deve converter para minúsculas e remover caracteres especiais', () => {
            const input = 'Festa@2025!';
            const expected = 'festa2025';
            expect(sanitizeFolderName(input)).toBe(expected);
        });
    });

    // Teste de integração para o endpoint de upload
    describe('POST /api/upload', () => {
        it('deve fazer upload de um arquivo para uma pasta com nome sanitizado', async () => {
            const testName = 'Usuário de Teste';
            const sanitizedName = 'usuario-de-teste';
            const testFilePath = path.join(__dirname, 'test-image.png');

            // Cria um arquivo de imagem falso para o teste
            fs.writeFileSync(testFilePath, 'fake image data');

            const response = await request(app)
                .post('/api/upload')
                .field('name', testName) // Simula o campo 'name'
                .attach('photos', testFilePath); // Anexa o arquivo com o nome do campo 'photos'

            // Verifica a resposta da API
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Upload realizado com sucesso!');
            expect(response.body.files).toHaveLength(1);
            expect(response.body.files[0].url).toContain(`/uploads/${sanitizedName}/`);

            // Verifica se o arquivo e a pasta foram criados no sistema de arquivos
            const userFolderPath = path.join(UPLOADS_FOLDER, sanitizedName);
            expect(fs.existsSync(userFolderPath)).toBe(true);
            const filesInFolder = fs.readdirSync(userFolderPath);
            expect(filesInFolder).toHaveLength(1);

            // Limpa o arquivo de teste
            fs.unlinkSync(testFilePath);
        });

         it('deve retornar erro 400 se nenhum arquivo for enviado', async () => {
            const response = await request(app)
                .post('/api/upload')
                .field('name', 'Teste Sem Arquivo');
            
            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Nenhum arquivo foi enviado.');
        });
    });
});