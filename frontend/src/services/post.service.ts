const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:7287/api';

export interface SignatureResponse {
  signature: string;
  timestamp: number;
  apiKey: string;
  uploadPreset: string;
  folder: string;
  cloudName: string;
}

export interface PostResponse {
  id: number;
  userId: number;
  caption: string;
  imageUrl: string;
  cloudinaryPublicId: string;
  createdAt: string;
}

/**
 * Co-ordinates the 3-step signed upload process:
 * 1. Fetch upload signature from backend.
 * 2. Upload file directly to Cloudinary.
 * 3. Send image URL and public ID back to the backend to insert SQL Server metadata record.
 */
export async function createPost(caption: string, file: File): Promise<PostResponse> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (!token) {
    throw new Error('Authentication required. Please log in.');
  }

  // Step 1: Request signature parameters from the backend
  const sigResponse = await fetch(`${API_URL}/media/signature`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!sigResponse.ok) {
    if (sigResponse.status === 401) {
      throw new Error('Session expired or unauthorized. Please log in again.');
    }
    const errData = await sigResponse.json().catch(() => ({}));
    throw new Error(errData.message || 'Failed to retrieve secure upload signature.');
  }

  const sigData: SignatureResponse = await sigResponse.json();

  // Step 2: Upload file directly to Cloudinary
  const formData = new FormData();
  formData.append('file', file);
  formData.append('signature', sigData.signature);
  formData.append('timestamp', sigData.timestamp.toString());
  formData.append('api_key', sigData.apiKey);
  formData.append('upload_preset', sigData.uploadPreset);
  formData.append('folder', sigData.folder);

  const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${sigData.cloudName}/image/upload`;
  const uploadResponse = await fetch(cloudinaryUrl, {
    method: 'POST',
    body: formData,
  });

  if (!uploadResponse.ok) {
    const errData = await uploadResponse.json().catch(() => ({}));
    throw new Error(errData.error?.message || 'Failed to upload binary to Cloudinary.');
  }

  const uploadData = await uploadResponse.json();

  // Step 3: Save post details on the backend
  const postResponse = await fetch(`${API_URL}/posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      caption,
      imageUrl: uploadData.secure_url,
      cloudinaryPublicId: uploadData.public_id,
    }),
  });

  if (!postResponse.ok) {
    if (postResponse.status === 401) {
      throw new Error('Session expired or unauthorized. Please log in again.');
    }
    const errData = await postResponse.json().catch(() => ({}));
    throw new Error(errData.message || 'Failed to create post record in backend database.');
  }

  return await postResponse.json();
}
