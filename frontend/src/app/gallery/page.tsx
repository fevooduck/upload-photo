// src/app/gallery/page.tsx

import ImageGallery from "../components/ImageGallery";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// Define o tipo de dados que esperamos da API
type ImageData = {
  user: string;
  originalUrl: string;
  thumbnailUrl: string;
};

// Função para buscar os dados da API
async function getImages(): Promise<ImageData[]> {
  try {
    // Usamos a variável de ambiente para a URL da API
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    const response = await fetch(`${apiUrl}/api/images`, {
      // Revalida os dados a cada 60 segundos para mostrar novas fotos
      next: { revalidate: 60 } 
    });
    if (!response.ok) {
      return [];
    }
    return response.json();
  } catch (error) {
    console.error("Falha ao buscar imagens:", error);
    return [];
  }
}

export default async function GalleryPage() {
  const images = await getImages();

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Galeria de Fotos do Evento</h1>
        <Button asChild>
          <Link href="/">Enviar mais fotos</Link>
        </Button>
      </div>
      {images.length > 0 ? (
        <ImageGallery images={images} />
      ) : (
        <p className="text-center text-gray-500">Ainda não há fotos na galeria. Seja o primeiro a enviar!</p>
      )}
    </main>
  );
}