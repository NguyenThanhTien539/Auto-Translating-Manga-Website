import { Request, Response } from "express";
import * as requestTranslateService from "../../services/client/request_translate_manga.service";

export const translateSinglePage = async (
  req: Request,
  res: Response,
): Promise<Response | void> => {
  try {
    const { pageId, targetLanguage } = req.body;
    const result = await requestTranslateService.translateSinglePage({
      pageId: Number(pageId),
      targetLanguage: String(targetLanguage),
    });

    res.json({
      code: "success",
      message: result.message,
      pageId: result.pageId,
      imageUrl: result.imageUrl,
    });
  } catch (error: any) {
    console.error("Error in translateSinglePage:", error);

    if (error instanceof requestTranslateService.RequestTranslateServiceError) {
      return res.status(error.status).json({
        code: "error",
        message: error.message,
      });
    }

    res.status(500).json({
      code: "error",
      message: error.message || "Translation failed",
    });
  }
};
