'use client';

import { useState } from 'react';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Toaster, toast } from 'sonner';
import { Label } from '@/components/ui/label'; // <-- NOVO: Importa o Label

// NOVO: Adicione o componente Label se ainda não o tiver
// npx shadcn-ui@latest add label

// NOVO: Interface para gerenciar o estado de cada arquivo na fila
interface UploadableFile {
    id: string;
    file: File;
    status: 'queued' | 'uploading' | 'success' | 'error';
    progress: number;
    url?: string;
}

const statusTranslations: Record<UploadableFile['status'], string> = {
    queued: 'Na fila',
    uploading: 'Enviando...',
    success: 'Sucesso',
    error: 'Erro'
};

export default function Uploader() {
    const [name, setName] = useState<string>('');
    const [queue, setQueue] = useState<UploadableFile[]>([]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            const newFiles: UploadableFile[] = Array.from(event.target.files).map(file => ({
                id: `${file.name}-${file.lastModified}`,
                file,
                status: 'queued',
                progress: 0,
            }));
            setQueue(newFiles);
        }
    };

    const processQueue = async () => {
        if (name.trim() === '') {
            toast.error("Por favor, preencha seu nome.");
            return;
        }

        for (const uploadableFile of queue) {
            // Só faz upload de arquivos que ainda não foram enviados
            if (uploadableFile.status === 'queued' || uploadableFile.status === 'error') {
                await uploadFile(uploadableFile);
            }
        }
        toast.info("Todos os uploads foram concluídos.");
    };

    const uploadFile = async (uploadableFile: UploadableFile) => {
        // Atualiza o status do arquivo para 'uploading'
        setQueue(prevQueue =>
            prevQueue.map(item =>
                item.id === uploadableFile.id ? { ...item, status: 'uploading' } : item
            )
        );

        const formData = new FormData();
        // O backend espera um array com o nome 'photos'
        formData.append('photos', uploadableFile.file);
        // Enviamos o nome do participante em cada requisição
        formData.append('name', name);

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || ''; // Adiciona um fallback
            const response = await axios.post(`${apiUrl}/api/upload`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (progressEvent) => {
                    if (progressEvent.total) {
                        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        // Atualiza o progresso do arquivo específico
                        setQueue(prevQueue =>
                            prevQueue.map(item =>
                                item.id === uploadableFile.id ? { ...item, progress: percentCompleted } : item
                            )
                        );
                    }
                },
            });

            // Atualiza o status para 'success' e armazena a URL
            setQueue(prevQueue =>
                prevQueue.map(item =>
                    item.id === uploadableFile.id ? { ...item, status: 'success', url: response.data.files[0].url } : item
                )
            );
            toast.success(`'${uploadableFile.file.name}' enviado com sucesso!`);
        } catch (error) {
            // Atualiza o status para 'error'
            setQueue(prevQueue =>
                prevQueue.map(item =>
                    item.id === uploadableFile.id ? { ...item, status: 'error', progress: 0 } : item
                )
            );
            toast.error(`Falha ao enviar '${uploadableFile.file.name}'.`);
            console.error(error);
        }
    };

    const isUploading = queue.some(file => file.status === 'uploading');

    return (
        <>
            <Toaster position="top-center" richColors />
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Enviar Fotos para o Evento</CardTitle>
                    <CardDescription>Escolha suas melhores fotos e compartilhe conosco!</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Seu Nome</Label>
                        <Input id="name" type="text" placeholder="João da Silva" value={name} onChange={(e) => setName(e.target.value)} disabled={isUploading} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="picture">Fotos</Label>
                        {/* NOVO: Permite múltiplos arquivos */}
                        <Input id="picture" type="file" onChange={handleFileChange} disabled={isUploading} accept="image/*" multiple />
                    </div>

                    {/* NOVO: Exibição da fila de upload */}
                    {queue.length > 0 && (
                        <div className="space-y-3 pt-4">
                            <h3 className="font-semibold">Fila de Upload</h3>
                            {queue.map(item => (
                                <div key={item.id}>
                                    <p className="text-sm truncate">{item.file.name} - <span className="font-mono text-xs">{statusTranslations[item.status]}</span></p>
                                    {(item.status === 'uploading' || item.status === 'success') && (
                                        <Progress value={item.progress} className="w-full mt-1" />
                                    )}
                                    {item.status === 'success' && <a href={item.url} target="_blank" className="text-xs text-blue-500 hover:underline">Ver foto</a>}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
                <CardFooter>
                    <Button onClick={processQueue} disabled={isUploading || queue.length === 0} className="w-full">
                        {isUploading ? "Enviando..." : `Enviar ${queue.length} Foto(s)`}
                    </Button>
                </CardFooter>
            </Card>
        </>
    );
}