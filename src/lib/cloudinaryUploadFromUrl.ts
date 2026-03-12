import cloudinary from "@/lib/cloudinary";
import fetch from "node-fetch";

export async function uploadExternalImageToCloudinary(
  imageUrl: string
): Promise<string> {
  // Already Cloudinary → return as-is
  if (imageUrl.includes("res.cloudinary.com")) {
    return imageUrl;
  }

  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error("Failed to download external image");
  }

  const buffer = Buffer.from(await response.arrayBuffer());

  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder: "items",
          resource_type: "image",
        },
        (error, result) => {
          if (error || !result?.secure_url) {
            reject(error || new Error("Cloudinary upload failed"));
          } else {
            resolve(result.secure_url);
          }
        }
      )
      .end(buffer);
  });
}
