// src/app/components/ImageGallery.tsx
'use client';

// Reutilizamos o mesmo tipo de dados
type ImageData = {
    user: string;
    originalUrl: string;
    thumbnailUrl: string;
};

type ImageGalleryProps = {
    images: ImageData[];
};

export default function ImageGallery({ images }: ImageGalleryProps) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {images.map((image, index) => (
                // O `group` aqui permite que o hover em qualquer lugar deste div
                // afete os elementos filhos que usam a classe `group-hover`.
                <div key={index} className="group relative rounded-lg overflow-hidden">
                    <a 
                        href={image.originalUrl} 
                        download
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="block"
                    >
                        <img 
                            src={image.thumbnailUrl} 
                            alt={`Foto de ${image.user}`} 
                            className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        
                        {/* --- A LINHA MODIFICADA --- */}
                        <div 
                            className="
                                absolute inset-0 
                                bg-gradient-to-b from-transparent to-black
                                bg-opacity-0 group-hover:bg-opacity-50
                                flex items-center justify-center 
                                transition-all duration-300 ease-in-out"
                        >
                            <p 
                                className="
                                    text-white font-bold tracking-wider
                                    opacity-0 group-hover:opacity-100
                                    transform scale-90 group-hover:scale-100
                                    transition-all duration-300 ease-in-out
                                "
                            >
                                Baixar Original
                            </p>
                        </div>
                    </a>
                </div>
            ))}
        </div>
    );
}