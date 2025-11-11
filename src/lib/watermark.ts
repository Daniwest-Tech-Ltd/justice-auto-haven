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
      
      // Add semi-transparent overlay
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(0, canvas.height - 120, canvas.width, 120);
      
      // Add main watermark text
      ctx.font = 'bold 36px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.textAlign = 'center';
      ctx.fillText('JUSTICE ULTIMATE AUTOMOBILES', canvas.width / 2, canvas.height - 70);
      
      // Add car info
      ctx.font = '24px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.fillText(`${carInfo.year} ${carInfo.make} ${carInfo.model}`, canvas.width / 2, canvas.height - 35);
      
      // Add diagonal watermark across image
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(-Math.PI / 6); // -30 degrees
      ctx.font = 'bold 48px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.textAlign = 'center';
      ctx.fillText('JUSTICE ULTIMATE AUTOMOBILES', 0, 0);
      ctx.restore();
      
      // Add copyright symbol in corner
      ctx.font = '18px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.textAlign = 'right';
      ctx.fillText('© Justice Ultimate Automobiles', canvas.width - 20, 30);
      
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
