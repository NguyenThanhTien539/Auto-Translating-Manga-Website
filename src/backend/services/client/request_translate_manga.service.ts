import axios from "axios";
import * as Manga from "../../models/manga.model";
import cloudinary from "cloudinary";

const cloudinaryV2 = cloudinary.v2;

cloudinaryV2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export class RequestTranslateServiceError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export const translateSinglePage = async (params: {
  pageId: number;
  targetLanguage: string;
}): Promise<{ message: string; pageId: number; imageUrl: string }> => {
  const { pageId, targetLanguage } = params;

  if (!pageId || !targetLanguage) {
    throw new RequestTranslateServiceError(
      400,
      "Missing pageId or targetLanguage",
    );
  }

  const validLanguages = ["vi", "en"];
  if (!validLanguages.includes(targetLanguage)) {
    throw new RequestTranslateServiceError(
      400,
      "Invalid target language. Must be 'vi' or 'en'",
    );
  }

  const originalPage = await Manga.getPageById(pageId);
  if (!originalPage) {
    throw new RequestTranslateServiceError(404, "Page not found");
  }

  const existingTranslation = await Manga.getPageByChapterAndLanguage(
    originalPage.chapter_id,
    originalPage.page_number,
    targetLanguage,
  );

  if (
    existingTranslation &&
    existingTranslation.image_url &&
    existingTranslation.image_url !== ""
  ) {
    return {
      message: "Translation already exists",
      pageId: existingTranslation.page_id,
      imageUrl: existingTranslation.image_url,
    };
  }

  const chapter = await Manga.getChapterByChapterId(originalPage.chapter_id);
  const manga = await Manga.getMangaById(chapter!.manga_id);
  const sourceLanguage = manga?.original_language || "ja";

  const languageMap: Record<string, string> = {
    vi: "Vietnamese",
    en: "English",
    ja: "Japanese",
    ko: "Korean",
    zh: "Chinese",
  };

  const sourceLang = languageMap[sourceLanguage] || "Japanese";
  const targetLang = languageMap[targetLanguage] || "Vietnamese";

  const fastApiUrl = process.env.FAST_API_URL || "http://localhost:8000";

  console.log(`Calling translation API for page ${pageId}...`);
  console.log(`Source: ${sourceLang}, Target: ${targetLang}`);
  console.log(`Image URL: ${originalPage.image_url}`);

  const imageResponse = await axios.get(originalPage.image_url, {
    responseType: "arraybuffer",
  });
  const imageBuffer = Buffer.from(imageResponse.data, "binary");

  const FormData = require("form-data");
  const formData = new FormData();

  formData.append("file", imageBuffer, {
    filename: "page.jpg",
    contentType: "image/jpeg",
  });
  formData.append("source_lang", sourceLang);
  formData.append("target_lang", targetLang);
  formData.append("detector", "RT-DETR-V2");
  formData.append("ocr_model", "Default");
  formData.append("translator", "Google Translate");
  formData.append("inpainter", "LaMa");
  formData.append("gpu", "false");
  formData.append("include_inpainted", "true");
  formData.append("render_text", "true");
  formData.append("init_font_size", "60");
  formData.append("min_font_size", "16");
  formData.append("bbox_expand_ratio", "1.15");

  const response = await axios.post(
    `${fastApiUrl}/api/v1/translate`,
    formData,
    {
      headers: {
        ...formData.getHeaders(),
      },
      timeout: 300000,
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    },
  );

  console.log("FastAPI response received");
  console.log("Response keys:", Object.keys(response.data));
  console.log("Response status field:", response.data.status);

  if (!response.data.rendered_image) {
    console.error(
      "No rendered_image in response:",
      JSON.stringify(response.data, null, 2),
    );
    const errorMsg =
      response.data.message ||
      response.data.error ||
      "Translation failed: No rendered image";
    throw new RequestTranslateServiceError(500, errorMsg);
  }

  console.log("Translation successful, rendered image received");
  const renderedImageBase64 = response.data.rendered_image;

  console.log("Uploading translated image to Cloudinary...");
  const uploadResult = await new Promise<any>((resolve, reject) => {
    cloudinaryV2.uploader.upload(
      `data:image/png;base64,${renderedImageBase64}`,
      {
        folder: `manga/${chapter!.manga_id}/chapter_${originalPage.chapter_id}`,
        resource_type: "image",
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      },
    );
  });

  let translatedPageId;
  if (existingTranslation) {
    console.log(
      "Updating existing translation with result, page_id:",
      existingTranslation.page_id,
    );
    await Manga.updatePageImageUrl(
      existingTranslation.page_id,
      uploadResult.secure_url,
    );
    translatedPageId = existingTranslation.page_id;
  } else {
    console.log("Creating new page with translation result");
    const newPageData = {
      chapter_id: originalPage.chapter_id,
      page_number: originalPage.page_number,
      image_url: uploadResult.secure_url,
      language: targetLanguage,
    };
    const result = await Manga.createPages([newPageData]);
    console.log("Created page result:", result);
    translatedPageId = result[0].page_id;
    console.log("New translated page ID:", translatedPageId);
  }

  return {
    message: "Translation completed",
    pageId: translatedPageId,
    imageUrl: uploadResult.secure_url,
  };
};
