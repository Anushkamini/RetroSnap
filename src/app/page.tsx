"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Camera,
  Download,
  Wand2,
  Type,
  Undo2,
  Loader,
  X,
  Plus,
  Minus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { dreamifyPhoto } from "@/ai/flows/dreamify-photo";
import { cn } from "@/lib/utils";

const FILTERS = [
  { name: "None", className: "" },
  { name: "Sepia", className: "sepia-[.8]" },
  { name: "Pastel", className: "saturate-75 contrast-125" },
  { name: "B&W", className: "grayscale" },
  { name: "Grainy", className: "grain" },
  { name: "Glitch", className: "glitch" },
];

const FILTER_TO_CANVAS = {
  "sepia-[.8]": "sepia(0.8)",
  "saturate-75 contrast-125": "saturate(0.75) contrast(1.25)",
  "grayscale": "grayscale(1)",
};

type FilterClass = (typeof FILTERS)[number]["className"];

export default function Home() {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [dreamifiedImageSrc, setDreamifiedImageSrc] = useState<string | null>(null);
  
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isTextEditing, setIsTextEditing] = useState(false);
  
  const [filterClass, setFilterClass] = useState<FilterClass>("");

  const [text, setText] = useState("RetroSnap");
  const [textSize, setTextSize] = useState(24);

  useEffect(() => {
    async function setupCamera() {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.onloadedmetadata = () => {
              setIsCameraReady(true);
            };
          }
        } catch (error) {
          console.error("Error accessing camera:", error);
          toast({
            variant: "destructive",
            title: "Camera Error",
            description: "Could not access the camera. Please check permissions and try again.",
          });
        }
      }
    }
    if (!imageSrc) {
      setupCamera();
    }
  }, [imageSrc, toast]);

  const takeSnapshot = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        const dataUrl = canvas.toDataURL("image/jpeg");
        setImageSrc(dataUrl);
        setDreamifiedImageSrc(null); // Reset dreamified image
      }
    }
  };

  const handleRetake = () => {
    setImageSrc(null);
    setDreamifiedImageSrc(null);
    setFilterClass("");
    setIsCameraReady(false);
  };

  const handleDreamify = async () => {
    if (!imageSrc) return;
    setIsLoading(true);
    try {
      const result = await dreamifyPhoto({ photoDataUri: imageSrc });
      setDreamifiedImageSrc(result.dreamifiedPhotoDataUri);
    } catch (error) {
      console.error("Dreamify failed:", error);
      toast({
        variant: "destructive",
        title: "Dreamify Failed",
        description: "Something went wrong while creating your dream photo.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    const imageToDraw = dreamifiedImageSrc || imageSrc;
    if (!imageToDraw) return;
  
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
  
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageToDraw;
  
    img.onload = () => {
      const polaroidWidth = 800;
      const padding = 30;
      const textSpace = 120;
      const imageWidth = polaroidWidth - padding * 2;
      const imageHeight = imageWidth * (img.height / img.width);
      const polaroidHeight = imageHeight + textSpace + padding * 2;
  
      canvas.width = polaroidWidth;
      canvas.height = polaroidHeight;
  
      // Polaroid background
      ctx.fillStyle = '#fdfdfc';
      ctx.shadowColor = 'rgba(0,0,0,0.15)';
      ctx.shadowBlur = 25;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 8;
      ctx.fillRect(0, 0, polaroidWidth, polaroidHeight);
      ctx.shadowColor = 'transparent';
  
      // Apply filter
      if (FILTER_TO_CANVAS[filterClass as keyof typeof FILTER_TO_CANVAS]) {
        ctx.filter = FILTER_TO_CANVAS[filterClass as keyof typeof FILTER_TO_CANVAS];
      }
      
      // Draw image
      ctx.drawImage(img, padding, padding, imageWidth, imageHeight);
  
      // Reset filter for text
      ctx.filter = 'none';

      // Grain effect for download
      if (filterClass === 'grain') {
          const grainCanvas = document.createElement('canvas');
          const grainCtx = grainCanvas.getContext('2d');
          const w = 100, h = 100;
          grainCanvas.width = w;
          grainCanvas.height = h;
          const id = grainCtx!.createImageData(w, h);
          const buf = new Uint32Array(id.data.buffer);
          for (let i = 0; i < w*h; i++) {
              if (Math.random() < 0.5) buf[i] = 0x1A000000;
          }
          grainCtx!.putImageData(id, 0, 0);
          ctx.globalAlpha = 0.1;
          ctx.fillStyle = ctx.createPattern(grainCanvas, 'repeat')!;
          ctx.fillRect(padding, padding, imageWidth, imageHeight);
          ctx.globalAlpha = 1.0;
      }
  
      // Draw text
      if (text) {
        ctx.fillStyle = '#4a4a4a';
        ctx.font = `${textSize * 2}px 'Special Elite', cursive`; // Increase size for higher res canvas
        ctx.textAlign = 'center';
        const textY = padding + imageHeight + (textSpace / 2) + (textSize);
        ctx.fillText(text, polaroidWidth / 2, textY);
      }
  
      // Trigger download
      const link = document.createElement('a');
      link.download = 'retrosnap.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
  };

  const renderCameraView = () => (
    <div className="w-full max-w-lg mx-auto flex flex-col items-center gap-4 animate-in fade-in duration-500">
      <h1 className="text-5xl md:text-6xl text-primary-foreground/80 font-headline text-center">RetroSnap</h1>
      <p className="text-center text-muted-foreground mb-4">Point, shoot, and time travel to the 90s.</p>
      <div className="w-full aspect-square bg-muted rounded-lg overflow-hidden shadow-lg border-4 border-card">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        {!isCameraReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80">
            <Loader className="animate-spin h-12 w-12 text-primary" />
          </div>
        )}
      </div>
      <Button onClick={takeSnapshot} size="lg" className="w-full" disabled={!isCameraReady}>
        <Camera className="mr-2" />
        Capture Snapshot
      </Button>
    </div>
  );

  const renderEditorView = () => (
    <div className="w-full max-w-4xl mx-auto flex flex-col lg:flex-row items-start gap-8 animate-in fade-in duration-500">
      {/* Polaroid Preview */}
      <div className="w-full lg:w-1/2 flex-shrink-0">
        <div className="bg-[#fdfdfc] p-4 pb-6 shadow-2xl rounded-sm transform -rotate-2">
            <div className={cn("relative w-full aspect-square bg-black overflow-hidden", filterClass)}>
                {isLoading && (
                    <div className="absolute inset-0 bg-background/50 flex flex-col items-center justify-center z-20">
                    <Wand2 className="h-10 w-10 animate-pulse text-primary-foreground" />
                    <p className="mt-2 text-primary-foreground">Dreamifying...</p>
                    </div>
                )}
                <img src={dreamifiedImageSrc || imageSrc!} alt="Snapshot" className="w-full h-full object-cover" />
            </div>
            <div className="mt-4 h-[60px] flex items-center justify-center">
                {isTextEditing ? (
                    <div className="flex items-center gap-2 w-full">
                        <Input 
                            type="text"
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            className="text-center font-body text-xl !bg-transparent border-0 border-b-2 border-dashed rounded-none focus-visible:ring-0"
                            placeholder="Add a caption..."
                        />
                        <Button variant="ghost" size="icon" onClick={() => setIsTextEditing(false)}><X className="h-4 w-4"/></Button>
                    </div>
                ) : (
                    <button onClick={() => setIsTextEditing(true)} className="w-full h-full">
                        <p className="text-center text-muted-foreground font-body" style={{ fontSize: `${textSize}px` }}>
                            {text || "Click to add text"}
                        </p>
                    </button>
                )}
            </div>
        </div>
      </div>

      {/* Editing Controls */}
      <div className="w-full lg:w-1/2 flex flex-col gap-6">
        <div>
          <h3 className="font-headline text-2xl mb-2">Filters</h3>
          <div className="grid grid-cols-3 gap-2">
            {FILTERS.map((filter) => (
              <Button
                key={filter.name}
                variant={filterClass === filter.className ? "default" : "secondary"}
                onClick={() => setFilterClass(filter.className)}
              >
                {filter.name}
              </Button>
            ))}
          </div>
        </div>

        <div>
            <h3 className="font-headline text-2xl mb-2">Caption</h3>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" onClick={() => setTextSize(s => Math.max(12, s - 2))}><Minus className="h-4 w-4"/></Button>
              <Slider
                value={[textSize]}
                onValueChange={(value) => setTextSize(value[0])}
                min={12}
                max={48}
                step={1}
              />
              <Button variant="outline" size="icon" onClick={() => setTextSize(s => Math.min(48, s + 2))}><Plus className="h-4 w-4"/></Button>
            </div>
        </div>
        
        <div>
          <h3 className="font-headline text-2xl mb-2">Magic</h3>
          <Button onClick={handleDreamify} className="w-full" disabled={isLoading}>
            <Wand2 className="mr-2" />
            Dreamify with AI
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
            <Button onClick={handleRetake} variant="outline" className="w-full">
                <Undo2 className="mr-2" /> Retake
            </Button>
            <Button onClick={handleDownload} className="w-full">
                <Download className="mr-2" /> Download
            </Button>
        </div>
      </div>
    </div>
  );

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4 sm:p-8 font-body overflow-x-hidden">
      <canvas ref={canvasRef} className="hidden" />
      {imageSrc ? renderEditorView() : renderCameraView()}
    </main>
  );
}
