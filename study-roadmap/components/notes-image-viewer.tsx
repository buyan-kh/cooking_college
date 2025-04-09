"use client";

import { useState } from "react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, Maximize, Minimize, X } from "lucide-react";

interface NotesImageViewerProps {
  imageUrl: string;
  altText?: string;
}

export function NotesImageViewer({
  imageUrl,
  altText = "Notes image",
}: NotesImageViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  const zoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.2, 3));
  };

  const zoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.2, 0.5));
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    // Reset zoom when toggling fullscreen
    setZoomLevel(1);
  };

  if (!imageUrl) return null;

  return (
    <>
      <Card className="p-4">
        <div className="mb-2 flex justify-between items-center">
          <p className="text-sm font-medium">Image from Notes</p>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={zoomOut}
              disabled={zoomLevel <= 0.5}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={zoomIn}
              disabled={zoomLevel >= 3}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={toggleFullscreen}>
              {isFullscreen ? (
                <Minimize className="h-4 w-4" />
              ) : (
                <Maximize className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        <div className="relative w-full h-48 overflow-hidden rounded-md">
          <Image
            src={imageUrl}
            alt={altText}
            fill
            className="object-contain transition-transform duration-200"
            style={{ transform: `scale(${zoomLevel})` }}
          />
        </div>
      </Card>

      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center">
          <div className="relative w-full max-w-3xl max-h-[90vh]">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 z-10 bg-background/50 rounded-full p-2 m-2"
              onClick={toggleFullscreen}
            >
              <X className="h-5 w-5" />
            </Button>
            <div className="p-6 bg-card rounded-lg shadow-xl flex flex-col items-center">
              <div className="mb-4 flex justify-center space-x-4">
                <Button
                  variant="outline"
                  onClick={zoomOut}
                  disabled={zoomLevel <= 0.5}
                >
                  <ZoomOut className="h-4 w-4 mr-2" /> Zoom Out
                </Button>
                <Button
                  variant="outline"
                  onClick={zoomIn}
                  disabled={zoomLevel >= 3}
                >
                  <ZoomIn className="h-4 w-4 mr-2" /> Zoom In
                </Button>
              </div>
              <div className="relative w-full h-[calc(90vh-10rem)] overflow-hidden">
                <Image
                  src={imageUrl}
                  alt={altText}
                  fill
                  className="object-contain transition-transform duration-200"
                  style={{ transform: `scale(${zoomLevel})` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
