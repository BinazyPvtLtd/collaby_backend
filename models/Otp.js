import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import xss from "xss";

const Otp = sequelize.define(
  "Otp",
  {
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        is: /^[6-9]\d{9}$/, // Indian mobile validation
      },
    },

    otp_code: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        is: /^\d{4,6}$/, // 4–6 digit OTP
      },
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: {
        isDate: true,
        isAfterNow(value) {
          if (new Date(value) <= new Date()) {
            throw new Error("OTP expiry must be in future");
          }
        },
      },
    },

    is_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: "otps",
    timestamps: true,

    hooks: {
      beforeValidate: (data) => {
        sanitizeOtp(data);
      },
    },
  },
);

// 🔐 Sanitizer
function sanitizeOtp(data) {
  if (data.phone) {
    data.phone = xss(data.phone.trim());
  }

  if (data.otp_code) {
    data.otp_code = xss(data.otp_code.trim());
  }
}

export default Otp;
