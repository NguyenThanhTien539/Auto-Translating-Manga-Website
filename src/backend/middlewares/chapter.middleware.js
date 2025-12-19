const db = require("../config/database.config");

// module.exports.checkChapterAccess = async (req, res, next) => {
//   try {
//     const chapterId = req.params.id;
//     const chapter = await db("chapters").where("chapter_id", chapterId).first();
//     if (!chapter) {
//       return res.status(404).json({
//         code: "error",
//         message: "Chapter không tồn tại",
//       });
//     }

//     if (chapter.status !== "Published") {
//       return res.status(403).json({
//         code: "error",
//         message: "Chapter chưa được xuất bản",
//       });
//     }

//     const chapterPrice = parseFloat(chapter.price);

//     // Nếu chapter miễn phí, cho phép truy cập
//     if (chapterPrice === 0) {
//       return next();
//     }

//     // // Nếu chapter có giá, kiểm tra user đã đăng nhập chưa
//     // if (!req.infoUser || !req.infoUser.user_id) {
//     //   return res.status(401).json({
//     //     code: "error",
//     //     message: "Vui lòng đăng nhập để đọc chapter này",
//     //   });
//     // }

//     const userId = req.infoUser.user_id;

//     // Kiểm tra user đã mua chapter chưa
//     const purchased = await db("purchased_chapters")
//       .where({
//         user_id: userId,
//         chapter_id: chapterId,
//       })
//       .first();

//     if (!purchased) {
//       return res.status(403).json({
//         code: "error",
//         message: "Bạn chưa mua chapter này. Vui lòng mua để tiếp tục đọc.",
//         requirePurchase: true,
//         chapterPrice: chapterPrice,
//       });
//     }

//     // User đã mua, cho phép truy cập
//     next();
//   } catch (error) {
//     console.error("Chapter access check error:", error);
//     res.status(500).json({
//       code: "error",
//       message: "Lỗi server khi kiểm tra quyền truy cập",
//     });
//   }
// };

/**
 * Middleware kiểm tra quyền truy cập chapter (cho phép guest xem chapter miễn phí)
 * Sử dụng cho các endpoint cần hỗ trợ cả user đã đăng nhập và chưa đăng nhập
 */
module.exports.checkChapterAccessOptional = async (req, res, next) => {
  try {
    const chapterId = req.params.id;
    // Lấy thông tin chapter
    const chapter = await db("chapters").where("chapter_id", chapterId).first();

    if (!chapter) {
      return res.status(404).json({
        code: "error",
        message: "Chapter không tồn tại",
      });
    }

    // Kiểm tra chapter đã được publish chưa
    if (chapter.status !== "Published") {
      return res.status(403).json({
        code: "error",
        message: "Chapter chưa được xuất bản",
      });
    }

    const chapterPrice = parseFloat(chapter.price);

    // Nếu chapter miễn phí, cho phép truy cập ngay
    if (chapterPrice === 0) {
      return next();
    }

    // // Chapter có giá - kiểm tra user
    const userId = req.infoUser?.user_id || null;
    console.log("User ID from req.infoUser:", userId);
    // Kiểm tra đã mua chưa
    const purchased = await db("purchased_chapters")
      .where({
        user_id: userId,
        chapter_id: chapterId,
      })
      .first();

    if (!purchased) {
      return res.status(403).json({
        code: "error",
        message: "Bạn chưa mua chapter này. Vui lòng mua để tiếp tục đọc.",
        requirePurchase: true,
        chapterPrice: chapterPrice,
      });
    }
    next();
  } catch (error) {
    console.error("Chapter access check error:", error);
    res.status(500).json({
      code: "error",
      message: "Lỗi server khi kiểm tra quyền truy cập",
    });
  }
};
