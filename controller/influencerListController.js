import InfluencerList from "../models/InfluencerList.js";
import InfluencerUser from "../models/InfluencerUser.js";
import Brand from "../models/Brand.js";

export const getInfluencerDashboard = async (req, res) => {
  try {
    // const baseUrl = "http://:5000/";
      const baseUrl = "http://13.201.88.246"

    const influencerList = await InfluencerList.findAll();
    const totalInfluencers = await InfluencerUser.count();
    const totalBrands = await Brand.count();

    const brands = await Brand.findAll({
      attributes: ["id", "logo"],
    });

    // modify brand logos
    const brandLogos = brands.map((brand) => ({
      id: brand.id.toString(),
      logo: brand.logo ? `${baseUrl}${brand.logo.replace(/\\/g, "/")}` : null,
    }));

    // convert sequelize instances to plain objects
    const updatedInfluencerList = influencerList.map((influencer) => {
      const data = influencer.toJSON();

      return {
        ...data,
        id: data.id.toString(),
      };
    });

    return res.json({
      response: {
        status: true,
        message: "Dashboard data fetched successfully!",
        influencer_list: updatedInfluencerList,
        total_influencers: totalInfluencers.toString(),
        total_brands: totalBrands.toString(),
        brand_logos: brandLogos,
      },
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      status: false,
      message: error.message || "Internal Server Error",
    });
  }
};