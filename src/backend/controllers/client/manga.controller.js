const Manga = require("../../models/manga.model");
const AdmZip = require("adm-zip");
const cloudinary = require("cloudinary").v2;
const streamifier = require('streamifier');

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
                folder: "manga_content"
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
        const { type, title, author, description, genres, manga_id, chapter_number, chapter_title } = req.body;
        const files = req.files;
        
        // Get user ID from request (set by auth middleware)
        const uploader_id = req.infoUser ? req.infoUser.user_id : null;

        if (!uploader_id) {
             return res.status(401).json({ code: "error", message: "Unauthorized" });
        }

        let currentMangaId = manga_id;

        // 1. Handle New Manga Creation
        if (type === "new-manga") {
            if (!files || !files.cover_image) {
                return res.status(400).json({ code: "error", message: "Thiếu ảnh bìa" });
            }

            // Upload cover
            const coverUpload = await uploadFromBuffer(files.cover_image[0].buffer);
            
            // Create Manga Record
            const mangaData = {
                title,
                author,
                description,
                cover_image: coverUpload.secure_url,
                uploader_id: uploader_id,
                // genres: genres // Need to handle genres relation if needed
            };
            
            const newManga = await Manga.createManga(mangaData);
            currentMangaId = newManga.id; 
        }

        // 2. Process Zip File & Handle Chapters
        if (!files || !files.file_content) {
             return res.status(400).json({ code: "error", message: "Thiếu file nội dung" });
        }

        const zip = new AdmZip(files.file_content[0].buffer);
        const zipEntries = zip.getEntries();

        // Group images by folder (Chapter)
        const chaptersMap = new Map();

        zipEntries.forEach(entry => {
            if (entry.isDirectory) return;
            if (!entry.entryName.match(/\.(jpg|jpeg|png|gif)$/i)) return;

            // Parse path: "MangaName/ChapterName/Image.jpg" or "ChapterName/Image.jpg"
            const parts = entry.entryName.split('/');
            let chapterName = "Default Chapter";
            
            if (parts.length > 1) {
                // If structure is Manga/Chapter/Image, take the second to last part as chapter name
                // If structure is Chapter/Image, take the first part
                // We assume the folder containing the image is the chapter folder
                chapterName = parts[parts.length - 2];
            }

            if (!chaptersMap.has(chapterName)) {
                chaptersMap.set(chapterName, []);
            }
            chaptersMap.get(chapterName).push(entry);
        });

        // If no folders detected, treat all images as one chapter
        if (chaptersMap.size === 0 && zipEntries.some(e => e.entryName.match(/\.(jpg|jpeg|png|gif)$/i))) {
             const images = zipEntries.filter(e => e.entryName.match(/\.(jpg|jpeg|png|gif)$/i));
             chaptersMap.set(chapter_title || `Chapter ${chapter_number || 1}`, images);
        }

        // Process each chapter
        for (const [chapName, entries] of chaptersMap) {
            // Try to extract number from chapter name (e.g. "Chapter 10" -> 10)
            const numberMatch = chapName.match(/\d+/);
            const chapNum = numberMatch ? parseInt(numberMatch[0]) : (parseInt(chapter_number) || 1);

            // Create Chapter Record
            const chapterData = {
                manga_id: currentMangaId,
                chapter_number: chapNum,
                title: chapName
            };
            
            const newChapter = await Manga.createChapter(chapterData);
            const chapterId = newChapter.id;

            // Upload Pages for this chapter
            const pagePromises = entries
                .sort((a, b) => a.entryName.localeCompare(b.entryName))
                .map(async (entry, index) => {
                    const buffer = entry.getData();
                    const uploadResult = await uploadFromBuffer(buffer);
                    return {
                        chapter_id: chapterId,
                        image_url: uploadResult.secure_url,
                        page_number: index + 1
                    };
                });

            const pagesData = await Promise.all(pagePromises);
            
            if (pagesData.length > 0) {
                await Manga.createPages(pagesData);
            }
        }

        res.json({ code: "success", message: "Upload thành công" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ code: "error", message: "Lỗi server: " + error.message });
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
