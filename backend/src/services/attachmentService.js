import { getCloudinaryClient } from "../config/cloudinary.js";
import AppError from "../utils/AppError.js";
import { validateAttachmentFile } from "../utils/validateAttachment.js";

function uploadToCloudinary(client, file, metadata) {
  return new Promise((resolve, reject) => {
    const stream = client.uploader.upload_stream(
      {
        folder: "supporthub/ticket-attachments",
        resource_type: "raw",
        type: "private",
        use_filename: false,
        unique_filename: true,
        filename_override: metadata.fileName,
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(result);
      },
    );
    stream.end(file.buffer);
  });
}

async function removeUploadedAssets(client, assets) {
  const results = await Promise.allSettled(
    assets.map((asset) =>
      client.uploader.destroy(asset.publicId, {
        resource_type: "raw",
        type: "private",
      }),
    ),
  );
  results.forEach((result, index) => {
    if (result.status === "rejected") {
      console.error(
        `Could not remove temporary Cloudinary asset ${assets[index].publicId}.`,
        result.reason,
      );
    }
  });
}

export async function uploadTicketAttachments(files = []) {
  if (!files.length) {
    return [];
  }

  const preparedFiles = files.map((file) => ({
    file,
    metadata: validateAttachmentFile(file),
  }));
  const client = getCloudinaryClient();
  const uploaded = [];

  try {
    for (const { file, metadata } of preparedFiles) {
      const result = await uploadToCloudinary(client, file, metadata);
      uploaded.push({
        ...metadata,
        publicId: result.public_id,
      });
    }
  } catch (error) {
    await removeUploadedAssets(client, uploaded);
    console.error("Cloudinary ticket attachment upload failed:", error);
    throw new AppError(502, "A ticket attachment could not be uploaded.");
  }

  return uploaded;
}

export async function removeTicketAttachments(attachments) {
  if (!attachments.length) {
    return;
  }
  await removeUploadedAssets(getCloudinaryClient(), attachments);
}

export function createPrivateAttachmentDownloadUrl(attachment) {
  const client = getCloudinaryClient();
  return client.utils.private_download_url(
    attachment.publicId,
    attachment.format,
    {
      attachment: true,
      expires_at: Math.floor(Date.now() / 1000) + 60,
      resource_type: "raw",
      type: "private",
    },
  );
}
