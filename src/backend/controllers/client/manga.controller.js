const Manga = require("../../models/manga.model");
const AdmZip = require("adm-zip");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");
const crypto = require("crypto");

// Configure Cloudinary (Ensure these env vars are set)
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_KEY,
  api_secret: process.env.CLOUD_SECRET,
});

// Secret key for signing URLs (should be in .env)
const URL_SECRET = process.env.URL_SECRET || "your-secret-key-change-this";

// Generate signed token for image URL
const generateSignedToken = (pageId, expiresIn = 3600) => {
  const expirationTime = Math.floor(Date.now() / 1000) + expiresIn; // 1 hour default
  const data = `${pageId}:${expirationTime}`;
  const signature = crypto
    .createHmac("sha256", URL_SECRET)
    .update(data)
    .digest("hex");
  return `${signature}:${expirationTime}`;
};

// Verify signed token
const verifySignedToken = (pageId, token) => {
  try {
    const [signature, expirationTime] = token.split(":");
    const currentTime = Math.floor(Date.now() / 1000);

    // Check if token expired
    if (currentTime > parseInt(expirationTime)) {
      return { valid: false, reason: "Token expired" };
    }

    // Verify signature
    const data = `${pageId}:${expirationTime}`;
    const expectedSignature = crypto
      .createHmac("sha256", URL_SECRET)
      .update(data)
      .digest("hex");

    if (signature !== expectedSignature) {
      return { valid: false, reason: "Invalid signature" };
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, reason: "Invalid token format" };
  }
};

// Helper to upload buffer to Cloudinary
const uploadFromBuffer = (buffer) => {
  return new Promise((resolve, reject) => {
    let cld_upload_stream = cloudinary.uploader.upload_stream(
      {
        folder: "manga_content",
      },
      (error, result) => {
        if (result) {
          resolve(result);
        } else {
          reject(error);
        }
      }
    );
    streamifier.createReadStream(buffer).pipe(cld_upload_stream);
  });
};

// Background processing function
const processChaptersInBackground = async (
  currentMangaId,
  uploader_id,
  fileContentBuffer,
  language
) => {
  try {
    console.log(`Starting background processing for manga ${currentMangaId}`);

    // Process ZIP file and extract chapters
    const zip = new AdmZip(fileContentBuffer);
    const zipEntries = zip.getEntries();

    // Group images by folder (each folder = one chapter)
    const chaptersMap = new Map();

    zipEntries.forEach((entry) => {
      if (entry.isDirectory) return;
      if (!entry.entryName.match(/\.(jpg|jpeg|png|gif|webp)$/i)) return;

      // Parse path structure
      const parts = entry.entryName.split("/").filter((p) => p);

      if (parts.length === 0) return;

      let chapterFolder = "Chapter 1"; // default

      if (parts.length > 1) {
        // If structure is: ChapterFolder/image.jpg
        chapterFolder = parts[parts.length - 2];
      }

      if (!chaptersMap.has(chapterFolder)) {
        chaptersMap.set(chapterFolder, []);
      }
      chaptersMap.get(chapterFolder).push(entry);
    });

    // If no folders detected, treat all images as Chapter 1
    if (chaptersMap.size === 0) {
      const images = zipEntries.filter((e) =>
        e.entryName.match(/\.(jpg|jpeg|png|gif|webp)$/i)
      );
      if (images.length > 0) {
        chaptersMap.set("Chapter 1", images);
      }
    }

    // Process each chapter
    let chapterIndex = 0;
    for (const [folderName, entries] of chaptersMap) {
      chapterIndex++;

      // Try to extract chapter number from folder name
      const numberMatch = folderName.match(/(\d+)/);
      const chapterNumber = numberMatch
        ? parseFloat(numberMatch[1])
        : chapterIndex;

      // Create Chapter Record
      const chapterData = {
        manga_id: currentMangaId,
        uploader_id: uploader_id,
        chapter_number: chapterNumber,
        title: folderName,
      };

      const newChapter = await Manga.createChapter(chapterData);
      const chapterId = newChapter.id;

      console.log(`Chapter ${chapterNumber} created with ID:`, chapterId);

      // Upload all pages for this chapter
      const sortedEntries = entries.sort((a, b) =>
        a.entryName.localeCompare(b.entryName, undefined, { numeric: true })
      );

      const pagesData = [];

      for (let i = 0; i < sortedEntries.length; i++) {
        const entry = sortedEntries[i];
        console.log(
          `  Uploading page ${i + 1}/${sortedEntries.length}: ${
            entry.entryName
          }`
        );

        const buffer = entry.getData();
        const uploadResult = await uploadFromBuffer(buffer);

        pagesData.push({
          chapter_id: chapterId,
          image_url: uploadResult.secure_url,
          page_number: i + 1,
          language: language || "en",
        });
      }

      // Insert all pages for this chapter
      if (pagesData.length > 0) {
        await Manga.createPages(pagesData);
      }
    }
  } catch (error) {
    console.error(
      `Error in background processing for manga ${currentMangaId}:`,
      error
    );
  }
};

module.exports.uploadManga = async (req, res) => {
  try {
    const { title, author, description, genres, language } = req.body;
    const files = req.files;

    // Get user ID from request (set by auth middleware)
    const uploader_id = req.infoUser.user_id;

    // Parse genres (sent as JSON string from frontend)
    let genreIds = [];
    if (genres) {
      try {
        genreIds = JSON.parse(genres);
      } catch (e) {
        console.error("Error parsing genres:", e);
      }
    }

    // 1. Upload cover image to Cloudinary
    const coverUpload = await uploadFromBuffer(files.cover_image[0].buffer);

    // 2. Create or get Author
    let author_id;
    if (author && author.trim()) {
      // Create new author with the provided name
      const newAuthor = await Manga.createAuthor({
        author_name: author.trim(),
      });
      author_id = newAuthor.id;
    }

    // 3. Create Manga Record
    const mangaData = {
      title,
      author_id: author_id,
      description,
      cover_image: coverUpload.secure_url,
      uploader_id: uploader_id,
      status: "OnGoing", // Valid values: 'OnGoing', 'Completed', 'Dropped'
      original_language: language,
    };

    const newManga = await Manga.createManga(mangaData);
    const currentMangaId = newManga.id;

    // 4. Insert manga-genre relationships
    if (genreIds.length > 0) {
      const mangaGenreData = genreIds.map((genreId) => ({
        manga_id: currentMangaId,
        genre_id: genreId,
      }));
      await Manga.createMangaGenres(mangaGenreData);
    }

    // 5. Get ZIP file buffer for background processing
    const fileContentBuffer = files.file_content[0].buffer;

    // ⚡ Respond immediately to frontend
    res.json({
      code: "success",
      message: "Manga của bạn đang được xử lý.",
    });

    // 6. Process chapters in background (non-blocking)
    // Don't await this - let it run in background
    processChaptersInBackground(
      currentMangaId,
      uploader_id,
      fileContentBuffer,
      language
    ).catch((err) => {
      console.error("Background processing error:", err);
    });
  } catch (error) {
    console.error("Error in uploadManga:", error);
    res.status(500).json({
      code: "error",
      message: "Lỗi server: " + error.message,
    });
  }
};

module.exports.getMyMangas = async (req, res) => {
  try {
    const uploader_id = req.infoUser.user_id;

    const mangas = await Manga.getMangasByUploader(uploader_id);
    res.json({ code: "success", data: mangas });
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: "error", message: "Lỗi server" });
  }
};

module.exports.getLanguages = async (req, res) => {
  try {
    const languages = await Manga.getAllLanguages();
    res.json({ code: "success", data: languages });
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: "error", message: "Lỗi server" });
  }
};

module.exports.getGenres = async (req, res) => {
  try {
    const genres = await Manga.getAllGenres();
    res.json({ code: "success", data: genres });
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: "error", message: "Lỗi server" });
  }
};

module.exports.getAllMangasOfClient = async (req, res) => {
  try {
    const mangas = await Manga.getAllMangasOfClient();
    for (const manga of mangas) {
      const chapterCount = await Manga.countChaptersByMangaId(manga.manga_id);
      manga.total_chapters = chapterCount;

      const genres = await Manga.getGenresByMangaId(manga.manga_id);
      manga.genres = genres.map((g) => g.genre_name);

      const author = await Manga.getAuthorDetailByAuthorId(manga.author_id);
      manga.author_name = author ? author.author_name : "Unknown";

      const averageRating = await Manga.calculateAverageRating(manga.manga_id);
      manga.average_rating = averageRating;
    }

    res.json({ code: "success", mangas: mangas });
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: "error", message: "Lỗi server" });
  }
};

module.exports.getMangaDetailOfClient = async (req, res) => {
  try {
    const mangaId = req.params.id;
    const manga = await Manga.getMangaById(mangaId);
    const genres = await Manga.getGenresByMangaId(mangaId);
    manga.genres = genres.map((g) => g.genre_name);
    const author = await Manga.getAuthorDetailByAuthorId(manga.author_id);
    manga.author_name = author ? author.author_name : "Unknown";
    const chapters = await Manga.getChaptersByMangaIdOfClient(mangaId);
    manga.totalChapters = chapters.length;

    const averageRating = await Manga.calculateAverageRating(manga.manga_id);
    manga.average_rating = averageRating;

    const finalDetail = { manga, chapters };
    res.json({ code: "success", data: finalDetail });
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: "error", message: "Lỗi server" });
  }
};

module.exports.getChapterPages = async (req, res) => {
  try {
    const chapterId = req.params.id;
    const { language } = req.query; // Get language from query parameter
    
    let pages;
    
    if (language) {
      // Get pages for specific language
      pages = await Manga.getChapterPagesByLanguage(chapterId, language);
      
      // If no pages found for this language, get original pages
      if (pages.length === 0) {
        pages = await Manga.getChapterPages(chapterId);
      } else {
        // Get all original pages to compare
        const allOriginalPages = await Manga.getChapterPages(chapterId);
        const originalPageNumbers = allOriginalPages.map(p => p.page_number);
        const translatedPageNumbers = pages.map(p => p.page_number);
        
        // Find missing pages
        const missingPageNumbers = originalPageNumbers.filter(
          num => !translatedPageNumbers.includes(num)
        );
        
        // Add missing pages from original
        const missingPages = allOriginalPages.filter(
          p => missingPageNumbers.includes(p.page_number)
        );
        
        pages = [...pages, ...missingPages].sort((a, b) => a.page_number - b.page_number);
      }
    } else {
      // Get all pages (original language)
      pages = await Manga.getChapterPages(chapterId);
    }
    
    // Get base URL from request or use default
    const protocol = req.protocol;
    const host = req.get("host");
    const baseUrl = `${protocol}://${host}`;

    // Return proxy URLs with signed tokens (expires in 1 hour)
    const securePages = pages.map((page) => {
      const token = generateSignedToken(page.page_id, 3600); // 1 hour
      
      // Determine translation status
      let translationStatus = "original";
      
      if (language) {
        // If language is requested and page.language matches it
        if (page.language === language) {
          if (page.image_url === "processing") {
            translationStatus = "processing";
          } else if (page.image_url === "" || !page.image_url) {
            translationStatus = "not_translated";
          } else {
            translationStatus = "translated";
          }
        } else {
          // Page is in different language (original), needs translation
          translationStatus = "original";
        }
      } else {
        // No language filter, all pages are original
        translationStatus = "original";
      }
      
      return {
        page_id: page.page_id,
        page_number: page.page_number,
        language: page.language,
        chapter_id: page.chapter_id,
        translation_status: translationStatus,
        image_url: page.image_url && page.image_url !== "processing" && page.image_url !== ""
          ? `${baseUrl}/manga/page-image/${page.page_id}?token=${token}`
          : null,
      };
    });

    res.json({ code: "success", data: securePages });
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: "error", message: "Lỗi server" });
  }
};

module.exports.getPageImage = async (req, res) => {
  try {
    const pageId = req.params.pageId;
    const token = req.query.token;

    // 1. Verify token
    if (!token) {
      return res.status(403).json({ code: "error", message: "Missing token" });
    }

    const verification = verifySignedToken(pageId, token);
    if (!verification.valid) {
      return res
        .status(403)
        .json({ code: "error", message: verification.reason });
    }

    // 2. STRICT referrer check - MUST have referrer from allowed origins
    const referrer = req.get("referer") || req.get("referrer");
    const allowedOrigins = ["http://localhost:3000", "http://localhost:5000"];

    if (!referrer) {
      return res.status(403).json({
        code: "error",
        message:
          "Direct access forbidden. This image can only be loaded from our website.",
      });
    }

    const referrerOrigin = new URL(referrer).origin;
    if (!allowedOrigins.includes(referrerOrigin)) {
      return res.status(403).json({
        code: "error",
        message: "Invalid referrer. Access denied.",
      });
    }

    // 3. Get page data from database
    const page = await Manga.getPageById(pageId);

    if (!page) {
      return res.status(404).json({ code: "error", message: "Page not found" });
    }

    // 4. Fetch image from Cloudinary and stream to client
    const https = require("https");
    const url = require("url");

    const parsedUrl = url.parse(page.image_url);

    https
      .get(
        {
          hostname: parsedUrl.hostname,
          path: parsedUrl.path,
          headers: {
            "User-Agent": "Mozilla/5.0",
          },
        },
        (cloudinaryRes) => {
          // Set proper headers
          res.set(
            "Content-Type",
            cloudinaryRes.headers["content-type"] || "image/jpeg"
          );
          res.set("Cache-Control", "private, max-age=3600"); // Cache 1 hour
          res.set("X-Content-Type-Options", "nosniff");
          res.set("X-Frame-Options", "SAMEORIGIN"); // Prevent embedding in iframes

          // Stream image to client
          cloudinaryRes.pipe(res);
        }
      )
      .on("error", (err) => {
        console.error("Error fetching image from Cloudinary:", err);
        res.status(500).send("Error loading image");
      });
  } catch (error) {
    console.error("Error in getPageImage:", error);
    res.status(500).json({ code: "error", message: "Error loading image" });
  }
};

const processSingleChapterInBackground = async (
  mangaId,
  uploader_id,
  fileContentBuffer,
  language
) => {
  try {
    console.log(
      `Starting background processing for chapter in manga ${mangaId}`
    );

    // Process ZIP file and extract chapters
    const zip = new AdmZip(fileContentBuffer);
    const zipEntries = zip.getEntries();

    // Group images by folder (each folder = one chapter)
    const chaptersMap = new Map();

    zipEntries.forEach((entry) => {
      if (entry.isDirectory) return;
      if (!entry.entryName.match(/\.(jpg|jpeg|png|gif|webp)$/i)) return;

      // Parse path structure
      const parts = entry.entryName.split("/").filter((p) => p);

      if (parts.length === 0) return;

      let chapterFolder = "Chapter 1"; // default

      if (parts.length > 1) {
        // If structure is: ChapterFolder/image.jpg
        chapterFolder = parts[parts.length - 2];
      }

      if (!chaptersMap.has(chapterFolder)) {
        chaptersMap.set(chapterFolder, []);
      }
      chaptersMap.get(chapterFolder).push(entry);
    });

    // If no folders detected, treat all images as Chapter 1
    if (chaptersMap.size === 0) {
      const images = zipEntries.filter((e) =>
        e.entryName.match(/\.(jpg|jpeg|png|gif|webp)$/i)
      );
      if (images.length > 0) {
        chaptersMap.set("Chapter 1", images);
      }
    }

    // Process each chapter
    let chapterIndex = 0;
    for (const [folderName, entries] of chaptersMap) {
      chapterIndex++;

      // Try to extract chapter number from folder name
      const numberMatch = folderName.match(/(\d+)/);
      const chapterNumber = numberMatch
        ? parseFloat(numberMatch[1])
        : chapterIndex;

      // Create Chapter Record
      const chapterData = {
        manga_id: mangaId,
        uploader_id: uploader_id,
        chapter_number: chapterNumber,
        title: folderName,
      };

      const newChapter = await Manga.createChapter(chapterData);
      const chapterId = newChapter.id;

      console.log(`Chapter ${chapterNumber} created with ID:`, chapterId);

      // Upload all pages for this chapter
      const sortedEntries = entries.sort((a, b) =>
        a.entryName.localeCompare(b.entryName, undefined, { numeric: true })
      );

      const pagesData = [];

      for (let i = 0; i < sortedEntries.length; i++) {
        const entry = sortedEntries[i];
        console.log(
          `  Uploading page ${i + 1}/${sortedEntries.length}: ${
            entry.entryName
          }`
        );

        const buffer = entry.getData();
        const uploadResult = await uploadFromBuffer(buffer);

        pagesData.push({
          chapter_id: chapterId,
          image_url: uploadResult.secure_url,
          page_number: i + 1,
          language: language || "en",
        });
      }

      // Insert all pages for this chapter
      if (pagesData.length > 0) {
        await Manga.createPages(pagesData);
      }
    }
  } catch (error) {
    console.error(
      `Error in background chapter processing for manga ${mangaId}:`,
      error
    );
  }
};

module.exports.uploadChapter = async (req, res) => {
  try {
    const { manga_id } = req.body;
    const files = req.files;

    // Get user ID from request (set by auth middleware)
    const uploader_id = req.infoUser.user_id;

    // Get ZIP file buffer for background processing
    const fileContentBuffer = files.file_content[0].buffer;

    // ⚡ Respond immediately to frontend
    res.json({
      code: "success",
      message: "Chương của bạn đang được xử lý.",
    });

    // Process chapters in background (non-blocking)
    // Don't await this - let it run in background

    const originalLanguage = await Manga.getOriginalLanguageByMangaId(manga_id);

    processSingleChapterInBackground(
      manga_id,
      uploader_id,
      fileContentBuffer,
      originalLanguage
    ).catch((err) => {
      console.error("Background chapter processing error:", err);
    });
  } catch (error) {
    console.error("Error in uploadChapter:", error);
    res.status(500).json({
      code: "error",
      message: "Lỗi server: " + error.message,
    });
  }
};

module.exports.getMangaAndSpecificChapter = async (req, res) => {
  try {
    // use query parameters to get manga and chapter
    const mangaId = req.query.manga_id;
    const chapterId = req.query.chapter_id;
    const manga = await Manga.getMangaById(mangaId);

    const author = await Manga.getAuthorDetailByAuthorId(manga.author_id);
    manga.author_name = author ? author.author_name : "Unknown";

    const chapter = await Manga.getChapterByChapterId(mangaId, chapterId);
    res.json({ code: "success", data: { manga, chapter } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: "error", message: "Lỗi server" });
  }
};

module.exports.getFilterPanelData = async (req, res) => {
  try {
    const values = await Manga.getFilterPanelData();
    res.json({ code: "success", data: values });
    console.log(values);
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: "error", message: "Lỗi server" });
  }
};

module.exports.filterMangas = async (req, res) => {
  try {
    let { chaptersMin, chaptersMax, state } = req.query;

    // normalize state nếu bị array
    if (Array.isArray(state)) state = state[0];

    // categories: string | string[]
    let categories = req.query.categories;
    if (categories == null) categories = [];
    if (!Array.isArray(categories)) categories = [categories];
    categories = categories.map((x) => String(x).trim()).filter(Boolean);

    const filters = {
      chaptersMin: chaptersMin !== undefined ? Number(chaptersMin) : undefined,
      chaptersMax: chaptersMax !== undefined ? Number(chaptersMax) : undefined,
      state: state ?? "all",
      categories,
    };

    const mangas = await Manga.filterMangas(filters);
    return res.json({ code: "success", data: mangas });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ code: "error", message: "Lỗi server" });
  }
};

module.exports.favoriteManga = async (req, res) => {
  try {
    const user_id = req.infoUser.user_id;
    const { manga_id } = req.body;
    const { type } = req.body;
    if (type === "add") {
      await Manga.addFavoriteManga(user_id, manga_id);
    } else if (type === "remove") {
      await Manga.removeFavoriteManga(user_id, manga_id);
    }
    res.json({
      code: "success",
      message: "Cập nhật danh sách yêu thích thành công",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: "error", message: "Lỗi server" });
  }
};

module.exports.getFavoriteMangaList = async (req, res) => {
  try {
    const user_id = req.infoUser.user_id;
    const mangas = await Manga.getFavoriteMangasByUserId(user_id);
    res.json({ code: "success", data: mangas });
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: "error", message: "Lỗi server" });
  }
};

module.exports.checkFavoriteManga = async (req, res) => {
  try {
    const user_id = req.infoUser.user_id;
    const manga_id = req.params.mangaId;
    const isFavorite = await Manga.isMangaFavoritedByUser(user_id, manga_id);
    res.json({ code: "success", data: { isFavorite } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: "error", message: "Lỗi server" });
  }
};
