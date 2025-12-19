const axios = require("axios");
const Manga = require("../../models/manga.model");
const cloudinary = require("cloudinary").v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Translate a single manga page
 * POST /manga/translate-page
 * Body: { pageId, targetLanguage }
 */
module.exports.translateSinglePage = async (req, res) => {
  try {
    const { pageId, targetLanguage } = req.body;

    if (!pageId || !targetLanguage) {
      return res.status(400).json({
        code: "error",
        message: "Missing pageId or targetLanguage",
      });
    }

    // Validate target language
    const validLanguages = ["vi", "en"];
    if (!validLanguages.includes(targetLanguage)) {
      return res.status(400).json({
        code: "error",
        message: "Invalid target language. Must be 'vi' or 'en'",
      });
    }

    // 1. Get original page data
    const originalPage = await Manga.getPageById(pageId);
    if (!originalPage) {
      return res.status(404).json({
        code: "error",
        message: "Page not found",
      });
    }

    // 2. Check if translation already exists
    const existingTranslation = await Manga.getPageByChapterAndLanguage(
      originalPage.chapter_id,
      originalPage.page_number,
      targetLanguage
    );

    if (existingTranslation) {
      // If image_url is "processing", return status
      if (existingTranslation.image_url === "processing") {
        return res.json({
          code: "processing",
          message: "Translation is already in progress",
          pageId: existingTranslation.page_id,
        });
      }

      // If image_url exists and is not empty, translation is complete
      if (existingTranslation.image_url && existingTranslation.image_url !== "") {
        return res.json({
          code: "success",
          message: "Translation already exists",
          pageId: existingTranslation.page_id,
          imageUrl: existingTranslation.image_url,
        });
      }
    }

    // 3. Create/Update page record with "processing" status
    let translatedPageId;
    if (existingTranslation) {
      await Manga.updatePageImageUrl(existingTranslation.page_id, "processing");
      translatedPageId = existingTranslation.page_id;
    } else {
      const newPageData = {
        chapter_id: originalPage.chapter_id,
        page_number: originalPage.page_number,
        image_url: "processing",
        language: targetLanguage,
      };
      const result = await Manga.createPages([newPageData]);
      translatedPageId = result[0];
    }

    // 4. Get manga info for language mapping
    const chapter = await Manga.getChapterByChapterId(originalPage.chapter_id);
    const manga = await Manga.getMangaById(chapter.manga_id);
    const sourceLanguage = manga.original_language || "ja";

    // Map language codes to FastAPI format
    const languageMap = {
      vi: "Vietnamese",
      en: "English",
      ja: "Japanese",
      ko: "Korean",
      zh: "Chinese",
    };

    const sourceLang = languageMap[sourceLanguage] || "Japanese";
    const targetLang = languageMap[targetLanguage] || "Vietnamese";

    // 5. Call FastAPI translation service
    const fastApiUrl = process.env.FAST_API_URL || "http://localhost:8000";

    console.log(`Calling translation API for page ${pageId}...`);
    console.log(`Source: ${sourceLang}, Target: ${targetLang}`);
    console.log(`Image URL: ${originalPage.image_url}`);

    // Download image from Cloudinary
    const imageResponse = await axios.get(originalPage.image_url, {
      responseType: 'arraybuffer'
    });
    const imageBuffer = Buffer.from(imageResponse.data, 'binary');

    // Create FormData for multipart/form-data request
    const FormData = require('form-data');
    const formData = new FormData();
    
    formData.append('file', imageBuffer, {
      filename: 'page.jpg',
      contentType: 'image/jpeg'
    });
    formData.append('source_lang', sourceLang);
    formData.append('target_lang', targetLang);
    formData.append('detector', 'RT-DETR-V2');
    formData.append('ocr_model', 'Default');
    formData.append('translator', 'Google Translate');
    formData.append('inpainter', 'LaMa');
    formData.append('gpu', 'false');
    formData.append('include_inpainted', 'true');
    formData.append('render_text', 'true');
    formData.append('init_font_size', '60');
    formData.append('min_font_size', '16');
    formData.append('bbox_expand_ratio', '1.15');

    const response = await axios.post(
      `${fastApiUrl}/api/v1/translate`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
        },
        timeout: 300000, // 5 minutes timeout
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      }
    );

    console.log("FastAPI response received");
    console.log("Response keys:", Object.keys(response.data));
    console.log("Response status field:", response.data.status);
    
    // Check if we have the rendered image (main indicator of success)
    if (!response.data.rendered_image) {
      console.error("No rendered_image in response:", JSON.stringify(response.data, null, 2));
      const errorMsg = response.data.message || response.data.error || "Translation failed: No rendered image";
      throw new Error(errorMsg);
    }

    console.log("Translation successful, rendered image received");
    const renderedImageBase64 = response.data.rendered_image;

    // 6. Upload translated image to Cloudinary
    console.log("Uploading translated image to Cloudinary...");
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload(
        `data:image/png;base64,${renderedImageBase64}`,
        {
          folder: `manga/${chapter.manga_id}/chapter_${originalPage.chapter_id}`,
          resource_type: "image",
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
    });

    // 7. Update page record with actual image URL
    await Manga.updatePageImageUrl(translatedPageId, uploadResult.secure_url);

    // 8. Return success response
    res.json({
      code: "success",
      message: "Translation completed",
      pageId: translatedPageId,
      imageUrl: uploadResult.secure_url,
    });
  } catch (error) {
    console.error("Error in translateSinglePage:", error);

    // Update page status to empty if it was processing
    if (req.body.pageId) {
      try {
        const originalPage = await Manga.getPageById(req.body.pageId);
        if (originalPage) {
          const existingTranslation = await Manga.getPageByChapterAndLanguage(
            originalPage.chapter_id,
            originalPage.page_number,
            req.body.targetLanguage
          );
          if (existingTranslation && existingTranslation.image_url === "processing") {
            await Manga.updatePageImageUrl(existingTranslation.page_id, "");
          }
        }
      } catch (cleanupError) {
        console.error("Error during cleanup:", cleanupError);
      }
    }

    res.status(500).json({
      code: "error",
      message: error.message || "Translation failed",
    });
  }
};
