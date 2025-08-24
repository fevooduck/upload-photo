import Uploader from "./components/Uploader";
import Link from "next/link";
import { Button } from "@/components/ui/button";
export default function Home() {
	return (
		<main className="flex min-h-screen flex-col items-center justify-center bg-gray-100 dark:bg-gray-900">
			<div className="absolute top-4 right-4">
				<Button variant="outline" asChild>
					<Link href="/gallery">Ver Galeria</Link>
				</Button>
			</div>
			<Uploader />
		</main>
	);
}
