import admin from "../config/firebaseAdmin.js";

/**
 * FirebaseService
 *
 * Thin wrapper around Firebase Cloud Messaging. Keeps the notification service
 * decoupled from firebase-admin specifics and returns normalized results
 * (including per-token success/failure and collected invalid tokens).
 */
class FirebaseService {
  /**
   * Send notification to a single device
   */
  async sendToDevice({ token, title, body, imageUrl = "", data = {} }) {
    try {
      const message = this.buildMessage(token, title, body, imageUrl, data);

      const response = await admin.messaging().send(message);

      return {
        success: true,
        messageId: response,
      };
    } catch (error) {
      console.error("Firebase Error:", error.message || error);

      return {
        success: false,
        error,
      };
    }
  }

  /**
   * Send notification to multiple devices (batched, max 500 per call).
   *
   * Returns:
   *   {
   *     success: boolean,
   *     responses: [...],
   *     invalidTokens: string[],
   *     perTokenResults: [{ token, success, errorCode }]
   *   }
   */
  async sendToMultipleDevices({
    tokens,
    title,
    body,
    imageUrl = "",
    data = {},
  }) {
    if (!tokens.length) {
      return {
        success: true,
        responses: [],
        invalidTokens: [],
        perTokenResults: [],
      };
    }

    const batchSize = 500;

    const responses = [];

    const invalidTokens = [];

    const perTokenResults = [];

    for (let i = 0; i < tokens.length; i += batchSize) {
      const batchTokens = tokens.slice(i, i + batchSize);

      const message = this.buildMessage(null, title, body, imageUrl, data, {
        tokens: batchTokens,
      });

      const response = await admin.messaging().sendEachForMulticast(message);

      responses.push(response);

      response.responses.forEach((result, index) => {
        const token = batchTokens[index];

        const errorCode = result.error?.code || "";

        const isInvalid =
          errorCode === "messaging/registration-token-not-registered" ||
          errorCode === "messaging/invalid-registration-token";

        perTokenResults.push({
          token,
          success: result.success,
          errorCode: isInvalid
            ? errorCode
            : result.success
              ? ""
              : result.error?.message || "unknown",
        });

        if (isInvalid) {
          invalidTokens.push(token);
        }
      });
    }

    return {
      success: invalidTokens.length === 0,
      responses,
      invalidTokens,
      perTokenResults,
    };
  }

  /**
   * Validate FCM Token
   */
  async validateToken(token) {
    try {
      await admin.messaging().send({
        token,
        data: { validate: "true" },
      });

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Build a firebase-admin message object.
   * Supports single (token) or multicast (tokens) delivery.
   */
  buildMessage(token, title, body, imageUrl, data, extra = {}) {
    return {
      ...(token ? { token } : {}),
      ...(extra.tokens ? { tokens: extra.tokens } : {}),
      notification: {
        title,
        body,
        ...(imageUrl && { imageUrl }),
      },
      data,
      android: {
        priority: "high",
      },
      apns: {
        payload: {
          aps: {
            sound: "default",
          },
        },
      },
    };
  }
}

export default new FirebaseService();
