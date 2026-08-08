import sequelize from "../config/database.js";
import UserIdentity from "../models/UserIdentity.js";

/**
 * IdentityService
 *
 * Central place to resolve / create the universal UserIdentity mapping.
 *
* Every actor (business, influencer, admin) is mapped to ONE UserIdentity.id.
 * The JWT carries `identityId` after login, but this service allows resolving
 * identities from any of the legacy references (business id, influencer id,
 * admin id) so that existing callers keep working without changes.
 */
class IdentityService {
  /**
   * Resolve a UserIdentity from a "soft" actor reference.
   *
   * Supported input shapes:
   *   { identityId }                       -> already resolved
   *   { userId, userType }                 -> legacy generic reference
   *   { businessId }                       -> business
   *   { influencerId }                     -> influencer
   *   { adminId }                          -> admin
   *
   * Returns the UserIdentity instance (creating it if necessary).
   */
  async resolve(input, options = {}) {
    const transaction = options.transaction || null;

    // 1) Already resolved
    if (input.identityId) {
      const identity = await UserIdentity.findByPk(input.identityId, {
        transaction,
      });
      if (identity) return identity;
    }

    // 2) Canonical typed references
    const businessId =
      input.businessId ?? (input.userType === "business" ? input.userId : null);
    const influencerId =
      input.influencerId ??
      (input.userType === "influencer" ? input.userId : null);
    const adminId =
      input.adminId ?? (input.userType === "admin" ? input.userId : null);

    const where = { userType: input.userType };

    if (businessId) where.businessId = businessId;
    else if (input.userType === "business") {
      throw new Error("businessId is required to resolve a business identity");
    }

    if (influencerId) where.influencerId = influencerId;
    else if (input.userType === "influencer") {
      throw new Error("influencerId is required to resolve an influencer identity");
    }

    if (adminId) where.adminId = adminId;
    else if (input.userType === "admin") {
      throw new Error("adminId is required to resolve an admin identity");
    }

    const existing = await UserIdentity.findOne({ where, transaction });
    if (existing) return existing;

    // 3) Create a new identity
    return UserIdentity.create(
      {
        userType: input.userType,
        businessId: businessId || null,
        influencerId: influencerId || null,
        adminId: adminId || null,
        label: input.label || null,
      },
      { transaction }
    );
  }

  /**
   * Resolve many identities for a list of recipients.
   * Batch resolution to avoid N+1 queries in notification flows.
   */
  async resolveMany(users, options = {}) {
    const transaction = options.transaction || null;

    // Fast path: all already resolved
    if (users.every((u) => u.identityId)) {
      return Promise.all(
        users.map((u) => this.resolve(u, { transaction }))
      );
    }

// Pre-fetch all distinct business ids and influencer ids in one query.
    const businessIds = users
      .map((u) => u.businessId ?? (u.userType === "business" ? u.userId : null))
      .filter(Boolean);
    const influencerIds = users
      .map(
        (u) => u.influencerId ?? (u.userType === "influencer" ? u.userId : null)
      )
      .filter(Boolean);

    const businessMap = new Map();
    const influencerMap = new Map();

    if (businessIds.length) {
      const rows = await UserIdentity.findAll({
        where: { userType: "business", businessId: businessIds },
        transaction,
      });
      rows.forEach((r) => businessMap.set(r.businessId, r));
    }

    if (influencerIds.length) {
      const rows = await UserIdentity.findAll({
        where: { userType: "influencer", influencerId: influencerIds },
        transaction,
      });
      rows.forEach((r) => influencerMap.set(r.influencerId, r));
    }

    const results = [];

    for (const user of users) {
      if (user.identityId) {
        results.push(await this.resolve(user, { transaction }));
        continue;
      }

      let identity = null;

      if (user.userType === "business") {
        const bid = user.businessId ?? (user.userId ? user.userId : null);
        identity = bid ? businessMap.get(bid) : null;
      } else if (user.userType === "influencer") {
        const iid = user.influencerId ?? (user.userId ? user.userId : null);
        identity = iid ? influencerMap.get(iid) : null;
      } else if (user.userType === "admin") {
        identity = (await this.resolve(user, { transaction })) || null;
      }

      if (!identity) {
        identity = await this.resolve(user, { transaction });
      }

      results.push(identity);
    }

    return results;
  }
}

export default new IdentityService();
