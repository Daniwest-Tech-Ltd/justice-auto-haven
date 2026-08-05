/**
 * Add watermark to images before download
 * Protects copyright for Justice Ultimate Automobiles
 */

export const addWatermarkToImage = async (
  imageUrl: string,
  carInfo: { make: string; model: string; year: number }
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      // Set canvas dimensions
      canvas.width = img.width;
      canvas.height = img.height;
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      // Draw original image
      ctx.drawImage(img, 0, 0);
      
      // Calculate dynamic sizing based on image width
      const scaleFactor = canvas.width / 1200;
      const barHeight = 120 * scaleFactor;
      const fontSizeLarge = Math.round(42 * scaleFactor);
      const fontSizeMedium = Math.round(24 * scaleFactor);
      const fontSizeSmall = Math.round(18 * scaleFactor);

      // Add semi-transparent overlay at bottom
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(0, canvas.height - barHeight, canvas.width, barHeight);
      
      // Add main watermark text
      ctx.font = `black ${fontSizeLarge}px system-ui, -apple-system, sans-serif`;
      ctx.textAlign = 'center';

      // Draw "JUSTICE" in white
      const fullText = "JUSTICE ULTIMATE AUTOMOBILES";
      ctx.fillStyle = 'white';
      ctx.fillText(fullText, canvas.width / 2, canvas.height - (barHeight * 0.6));
      
      // Add car info
      ctx.font = `bold ${fontSizeMedium}px system-ui, -apple-system, sans-serif`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fillText(`${carInfo.year} ${carInfo.make} ${carInfo.model}`.toUpperCase(), canvas.width / 2, canvas.height - (barHeight * 0.3));
      
      // Add massive diagonal watermark across center
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(-Math.PI / 4); // -45 degrees
      ctx.font = `black ${fontSizeLarge * 2.5}px system-ui, -apple-system, sans-serif`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.textAlign = 'center';
      ctx.fillText('JUSTICE ULTIMATE', 0, 0);
      ctx.restore();
      
      // Add official company corner badge
      ctx.font = `bold ${fontSizeSmall}px system-ui, -apple-system, sans-serif`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.textAlign = 'right';
      ctx.fillText('© JUSTICE ULTIMATE AUTOMOBILES 2026', canvas.width - (20 * scaleFactor), fontSizeLarge);
      
      // Convert to blob
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          resolve(url);
        } else {
          reject(new Error('Failed to create blob'));
        }
      }, 'image/jpeg', 0.95);
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    img.src = imageUrl;
  });
};

/**
 * Download image with watermark
 */
export const downloadImageWithWatermark = async (
  imageUrl: string,
  carInfo: { make: string; model: string; year: number },
  filename?: string
) => {
  try {
    const watermarkedUrl = await addWatermarkToImage(imageUrl, carInfo);
    
    // Create download link
    const link = document.createElement('a');
    link.href = watermarkedUrl;
    link.download = filename || `${carInfo.year}_${carInfo.make}_${carInfo.model}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    setTimeout(() => URL.revokeObjectURL(watermarkedUrl), 100);
    
    return true;
  } catch (error) {
    console.error('Error adding watermark:', error);
    throw error;
  }
};
