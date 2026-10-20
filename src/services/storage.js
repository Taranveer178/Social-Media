import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { auth, storage } from '../../firebase';
import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from '../cloudinaryConfig';

function fileToCompressedDataUrl(file, maxDimension = 960, quality = 0.72) {
  return new Promise((resolve, reject) => {
    if (!file.type?.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Failed to read media file.'));
      reader.readAsDataURL(file);
      return;
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;
      if (width > maxDimension || height > maxDimension) {
        if (width >= height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Failed to read image file.'));
      reader.readAsDataURL(file);
    };
    img.src = objectUrl;
  });
}

async function uploadToCloudinary(file) {
  const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {};
  const cloudName = env.VITE_CLOUDINARY_CLOUD_NAME || CLOUDINARY_CLOUD_NAME;
  const uploadPreset = env.VITE_CLOUDINARY_UPLOAD_PRESET || CLOUDINARY_UPLOAD_PRESET;
  if (!cloudName || !uploadPreset) {
    throw new Error('Cloudinary configuration missing.');
  }
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) {
    throw new Error('Cloudinary upload failed.');
  }
  const data = await response.json();
  if (!data.secure_url) {
    throw new Error('Cloudinary did not return a URL.');
  }
  return data.secure_url;
}

export async function uploadMedia(file, mediaType = 'image') {
  const user = auth.currentUser;
  if (!user) throw new Error('Sign in before uploading media.');
  if (!(file instanceof Blob)) {
    throw new TypeError('Media uploads require a File or Blob.');
  }

  // 1. Primary: Firebase Cloud Storage
  try {
    const extension = mediaType === 'audio'
      ? file.type.includes('mp4') ? 'm4a' : file.type.includes('ogg') ? 'ogg' : 'webm'
      : file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
    const fileName = `${crypto.randomUUID()}.${extension}`;
    const mediaRef = ref(storage, `users/${user.uid}/media/${fileName}`);
    await uploadBytes(mediaRef, file, {
      contentType: file.type || (mediaType === 'audio' ? 'audio/webm' : 'image/jpeg'),
    });
    return await getDownloadURL(mediaRef);
  } catch (storageError) {
    // 2. Fallback: Cloudinary unsigned upload
    try {
      return await uploadToCloudinary(file);
    } catch (cloudinaryError) {
      if (mediaType === 'audio') {
        throw new Error(`Voice upload failed: ${cloudinaryError.message || storageError.message}`, {
          cause: cloudinaryError,
        });
      }
      // 3. Final fallback: Compressed Data URL for Firestore persistence
      return await fileToCompressedDataUrl(file);
    }
  }
}
