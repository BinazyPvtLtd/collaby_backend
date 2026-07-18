import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import xss from "xss";

const Banner = sequelize.define(
  "banners",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    image: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    timestamps: true,

    hooks: {
      beforeCreate: (banner) => {
        if (banner.image) {
          banner.image = xss(banner.image);
        }
      },

      beforeUpdate: (banner) => {
        if (banner.image) {
          banner.image = xss(banner.image);
        }
      },
    },
  },
);

export default Banner;
