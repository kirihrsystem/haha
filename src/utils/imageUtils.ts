export const compressImage = (file: File, maxWidth = 800, maxHeight = 800, quality = 0.7, autoCropSquare = false): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        let offsetX = 0;
        let offsetY = 0;
        let drawWidth = width;
        let drawHeight = height;

        if (autoCropSquare) {
          const size = Math.min(width, height);
          offsetX = (width - size) / 2;
          offsetY = (height - size) / 2;
          width = size;
          height = size;
          drawWidth = size;
          drawHeight = size;
        }

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height *= maxWidth / width));
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width *= maxHeight / height));
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }
        
        if (autoCropSquare) {
          ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight, 0, 0, width, height);
        } else {
          ctx.drawImage(img, 0, 0, width, height);
        }
        
        // Use JPEG for better compression, unless it's a PNG and we need transparency
        // But for profiles/QRs, JPEG is fine and much smaller
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};
