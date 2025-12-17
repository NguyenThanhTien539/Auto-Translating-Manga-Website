const Manga = require("../../models/manga.model");
const AdmZip = require("adm-zip");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");

// Configure Cloudinary (Ensure these env vars are set)
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_KEY,
  api_secret: process.env.CLOUD_SECRET,
});

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

    // 2. Create Manga Record (without genres field)
    const mangaData = {
      title,
      author,
      description,
      cover_image: coverUpload.secure_url,
      uploader_id: uploader_id,
      status: "OnGoing", // Valid values: 'OnGoing', 'Completed', 'Dropped'
    };

    const newManga = await Manga.createManga(mangaData);
    const currentMangaId = newManga.id;

    // 3. Insert manga-genre relationships
    if (genreIds.length > 0) {
      const mangaGenreData = genreIds.map((genreId) => ({
        manga_id: currentMangaId,
        genre_id: genreId,
      }));
      await Manga.createMangaGenres(mangaGenreData);
    }

    // 4. Process ZIP file and extract chapters
    const zip = new AdmZip(files.file_content[0].buffer);
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

    // 4. Process each chapter
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
          language: language || "en", // use language from form or default 'en'
        });
      }

      // Insert all pages for this chapter
      if (pagesData.length > 0) {
        await Manga.createPages(pagesData);
      }
    }

    res.json({
      code: "success",
      message: "Upload manga thành công!",
      data: {
        manga_id: currentMangaId,
        chapters_count: chaptersMap.size,
      },
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
    const uploader_id = req.infoUser ? req.infoUser.user_id : null;
    if (!uploader_id) {
      return res.status(401).json({ code: "error", message: "Unauthorized" });
    }
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

module.exports.getAllMangas = async (req, res) => {
  try {
    const mangas = await Manga.getAllMangas();
    for (const manga of mangas) {
      const chapterCount = await Manga.countChaptersByMangaId(manga.manga_id);
      manga.total_chapters = chapterCount;

      const genres = await Manga.getGenresByMangaId(manga.manga_id);
      manga.genres = genres.map((g) => g.genre_name);
    }
    res.json({ code: "success", mangas: mangas });
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: "error", message: "Lỗi server" });
  }
};

module.exports.getMangaDetail = async (req, res) => {
  try {
    const mangaId = req.params.id;
    const manga = await Manga.getMangaById(mangaId);
    const genres = await Manga.getGenresByMangaId(mangaId);
    manga.genres = genres.map((g) => g.genre_name);

    const chapters = await Manga.getChaptersByMangaId(mangaId);
    const totalChaper = await Manga.countChaptersByMangaId(mangaId);
    manga.totalChapters = totalChaper;
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
    const pages = await Manga.getChapterPages(chapterId);
    res.json({ code: "success", data: pages });
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: "error", message: "Lỗi server" });
  }
};
