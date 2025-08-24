// This is a React component for cropping user avatars.
// using the react-easy-crop library. It allows users to select a portion of an image
// and save it as their avatar. The component handles file reading, cropping, and saving
// the cropped image as a Blob. It also provides zoom controls for better cropping precision.
// Note: the logic for saving the original image uploaded and the coordinates and zoom
// technically is using the original image state in WelcomePage.tsx, so this component
// does not need to handle the original file itself, just the cropped result.

"use client";

import React, { useEffect } from "react";
import Cropper, { type Area } from "react-easy-crop";

export type AvatarCropState = {
    crop: { x: number; y: number };
    zoom: number;
    croppedAreaPixels: Area | null;
};

interface AvatarCropperProps {
    file: File;
    onCancel: () => void;
    onSave: (blob: Blob, state: AvatarCropState) => void;
    initialCrop?: { x: number; y: number }; // this is needed to restore previous crop box
    initialZoom?: number; // this is also how we restore previous zoom
}

const AvatarCropper: React.FC<AvatarCropperProps> = ({
    file,
    onCancel,
    onSave,
    initialCrop,
    initialZoom,
}) => {
    const [imageSrc, setImageSrc] = React.useState<string | null>(null);
    const [crop, setCrop] = React.useState<{ x: number; y: number }>(initialCrop ?? { x: 0, y: 0 });
    const [zoom, setZoom] = React.useState<number>(initialZoom ?? 1);
    const [croppedAreaPixels, setCroppedAreaPixels] = React.useState<Area | null>(null);

    // Read the file only once (or when file changes)
    useEffect(() => {
        let cancelled = false;
        const reader = new FileReader();
        reader.onload = () => {
            if (!cancelled) setImageSrc(reader.result as string);
        };
        reader.readAsDataURL(file);
        return () => {
            cancelled = true;
        };
    }, [file]);

    // If parent changes the initial crop/zoom between opens, update here
    useEffect(() => {
        if (initialCrop) setCrop(initialCrop);
    }, [initialCrop?.x, initialCrop?.y]);

    useEffect(() => {
        if (initialZoom != null) setZoom(initialZoom);
    }, [initialZoom]);

    const onCropComplete = (_: Area, pixels: Area) => setCroppedAreaPixels(pixels);

    const getCroppedBlob = async (src: string, pixels: Area): Promise<Blob> => {
        const img = new Image();
        img.src = src;
        await new Promise((r) => (img.onload = r));

        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(pixels.width));
        canvas.height = Math.max(1, Math.round(pixels.height));
        const ctx = canvas.getContext("2d")!;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(
            img,
            pixels.x,
            pixels.y,
            pixels.width,
            pixels.height,
            0,
            0,
            canvas.width,
            canvas.height
        );
        return new Promise((resolve) => {
            // need to keep a PNG for consistency
            canvas.toBlob((b) => resolve(b as Blob), "image/png");
        });
    };

    const handleSave = async () => {
        if (!imageSrc || !croppedAreaPixels) return;
        const blob = await getCroppedBlob(imageSrc, croppedAreaPixels);
        onSave(blob, { crop, zoom, croppedAreaPixels });
    };

    return (
        <div className="p-4">
            <div className="relative w-full h-64 bg-black rounded-lg overflow-hidden">
                {imageSrc && (
                    <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        aspect={1}
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onCropComplete={onCropComplete}
                        restrictPosition
                    />
                )}
            </div>

            <div className="mt-4 flex items-center gap-4">
                <label className="text-sm text-gray-600">Zoom</label>
                <input
                    type="range"
                    min={1}
                    max={4}
                    step={0.01}
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="w-full"
                />
            </div>

            <div className="mt-5 flex justify-between">
                <button
                    type="button"
                    className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
                    onClick={onCancel}
                >
                    Cancel
                </button>
                <button
                    type="button"
                    className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                    onClick={handleSave}
                >
                    Save
                </button>
            </div>
        </div>
    );
};

export default AvatarCropper;
