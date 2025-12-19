const Manga = require("../../models/manga.model");
module.exports.home = async (req, res) => {
  res.send("Thanh Tien ne");
};

const slugify = (input = "") =>
  input
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

module.exports.getSearchResults = async (req, res) => {
  try {
    const keyword = (req.query.keyword ?? "").toString().trim();
    if (!keyword) return res.json({ code: "success", data: [] });

    const slug = slugify(keyword);

    // danh sách manga từ search (ít nhất phải có manga_id)
    const mangas = await Manga.searchMangaBySlug({ slug });

    // tính rating cho từng manga (chạy song song)
    const mangasWithRating = await Promise.all(
      (mangas || []).map(async (m) => {
        const mangaId = m?.manga_id; 

        if (!mangaId) {
          return { ...m, average_rating: 0 };
        }

        const avg = await Manga.calculateAverageRating(mangaId);
        return { ...m, average_rating: Number(avg) || 0 };
      })
    );

    return res.json({ code: "success", data: mangasWithRating });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ code: "error", message: "Lỗi server" });
  }
};