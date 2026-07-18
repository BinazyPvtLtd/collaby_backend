    import express from "express";
    import { getBusinessHackData } from "../controller/getCampaignRecords.js";
    import { verifyToken } from "../middleware/AuthMiddleware.js";

    const router = express.Router();

    router.get("/get-campaign-list",verifyToken, getBusinessHackData);

    export default router;