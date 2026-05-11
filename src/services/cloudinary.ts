const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

export interface CloudinaryUploadResult {
  secure_url: string
  public_id: string
}

export function cloudinaryConfigured(): boolean {
  return Boolean(CLOUD_NAME && UPLOAD_PRESET)
}

export async function uploadImageToCloudinary(
  file: File,
): Promise<CloudinaryUploadResult> {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error(
      'Configure VITE_CLOUDINARY_CLOUD_NAME e VITE_CLOUDINARY_UPLOAD_PRESET no .env',
    )
  }

  const body = new FormData()
  body.append('file', file)
  body.append('upload_preset', UPLOAD_PRESET)

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: 'POST', body },
  )

  const json = (await res.json()) as {
    secure_url?: string
    public_id?: string
    error?: { message?: string }
  }

  if (!res.ok) {
    throw new Error(
      json.error?.message ?? `Falha no upload (${res.status}). Tente novamente.`,
    )
  }

  if (!json.secure_url || !json.public_id) {
    throw new Error('Resposta inválida do Cloudinary.')
  }

  return { secure_url: json.secure_url, public_id: json.public_id }
}

export async function uploadManyToCloudinary(
  files: File[],
  onProgress?: (done: number, total: number) => void,
): Promise<CloudinaryUploadResult[]> {
  const results: CloudinaryUploadResult[] = []
  let i = 0
  for (const file of files) {
    results.push(await uploadImageToCloudinary(file))
    i += 1
    onProgress?.(i, files.length)
  }
  return results
}
