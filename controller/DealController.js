import Deal from "../models/Deal.js";
/**
 * @desc Get all deals for logged-in influencer
 * @route GET /api/deals/influencer
 * @access Influencer
 */
export const getInfluencerDeals = async (req, res) => {
  try {
    if (req.user.userType !== "influencer") {
      return res.status(403).json({
        success: false,
        message: "Only influencers can access their deals",
      });
    }

    const deals = await Deal.findAll({
      where: { influencer_id: req.user.userId },
      order: [["createdAt", "DESC"]],
    });

    res.json({ success: true, data: deals });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Get all deals for logged-in business
 * @route GET /api/deals/business
 * @access Business that accept appliaction so accepted application must be logged here
 */

export const getMyDealsByBusiness = async (req, res) => {
  try {
    const businessId = req.user.userId;

    const deals = await Deal.findAll({
      where: {
        business_id: businessId,
      },
      order: [["createdAt", "DESC"]],
    });

    res.json({
      success: true,
      count: deals.length,
      data: deals,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
/**
 * @desc Influencer submits work
 * @route POST /api/deals/:id/submit
 * @access Influencer
 */
export const submitWork = async (req, res) => {
  try {
    const { id } = req.params;
    const { contentLink, proofFiles } = req.body;

    const deal = await Deal.findByPk(id);

    if (!deal) {
      return res.status(404).json({
        success: false,
        message: "Deal not found",
      });
    }

    // 🔐 Ownership check
    if (deal.influencer_id !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to submit this deal",
      });
    }

    // ✅ Status validation
    if (deal.deal_status !== "accepted" && deal.deal_status !== "rejected") {
      return res.status(400).json({
        success: false,
        message: "Deal is not ready for submission",
      });
    }

    // 📝 Update deal
    deal.deal_status = "submitted";
    deal.content_link = contentLink;
    deal.proof_files = proofFiles;
    deal.submitted_at = new Date();

    await deal.save();

    res.json({
      success: true,
      message: "Work submitted successfully",
      data: deal,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Brand starts reviewing submitted work
 * @route POST /api/deals/:id/review
 * @access Brand
 */

export const startReview = async (req, res) => {
  try {
    const deal = await Deal.findByPk(req.params.id);

    if (!deal) {
      return res
        .status(404)
        .json({ success: false, message: "Deal not found" });
    }

    if (deal.business_id !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    if (deal.deal_status !== "submitted") {
      return res.status(400).json({
        success: false,
        message: "Work not submitted yet",
      });
    }

    deal.deal_status = "under_review";
    await deal.save();

    res.json({ success: true, message: "Review started", data: deal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Brand approves submitted work
 * @route POST /api/deals/:id/approve
 * @access Brand
 */
export const approveWork = async (req, res) => {
  try {
    const deal = await Deal.findByPk(req.params.id);

    if (!deal) {
      return res
        .status(404)
        .json({ success: false, message: "Deal not found" });
    }

    if (deal.business_id !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    if (!["submitted", "under_review"].includes(deal.deal_status)) {
      return res.status(400).json({
        success: false,
        message: "Deal cannot be approved at this stage",
      });
    }

    deal.deal_status = "approved";
    deal.approved_at = new Date();

    await deal.save();

    // 🔥 Payment trigger will be added later

    res.json({
      success: true,
      message: "Work approved successfully",
      data: deal,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Brand rejects submitted work
 * @route POST /api/deals/:id/reject
 * @access Brand
 */
export const rejectWork = async (req, res) => {
  try {
    const deal = await Deal.findByPk(req.params.id);

    if (!deal) {
      return res
        .status(404)
        .json({ success: false, message: "Deal not found" });
    }

    if (deal.business_id !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    if (!["submitted", "under_review"].includes(deal.deal_status)) {
      return res.status(400).json({
        success: false,
        message: "Cannot reject at this stage",
      });
    }

    deal.deal_status = "rejected";

    await deal.save();

    res.json({
      success: true,
      message: "Work rejected",
      data: deal,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
