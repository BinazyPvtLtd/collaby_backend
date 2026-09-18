export const CAMPAIGN_STATUSES = [
  "Draft",
  "Pending Review",
  "Live",
  "Closed",
  "Completed",
  "Cancelled",
  "Suspended",
];
export const ADMIN_CAMPAIGN_PERMISSIONS = [
  "campaign:read:any",
  "campaign:support-edit",
  "campaign:moderate",
  "campaign:close:any",
  "campaign:reopen:any",
  "campaign:complete:any",
  "campaign:cancel:any",
  "campaign:delete:any",
  "application:read:any",
  "application:support",
  "deal:read:any",
  "deal:resolve:any",
];

export class CampaignError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
export const requireCondition = (condition, status, message) => {
  if (!condition) throw new CampaignError(status, message);
};
export const positiveId = (value) => {
  requireCondition(
    /^[1-9]\d*$/.test(String(value)) &&
      Number.isSafeInteger(Number(value)) &&
      Number(value) <= 2147483647,
    400,
    "Invalid ID",
  );
  return Number(value);
};
export const actorFrom = (req) =>
  req.admin
    ? {
        id: req.admin.id,
        type: "admin",
        permissions: req.admin.permissions || [],
      }
    : { id: req.user?.userId, type: req.user?.userType };
export const requirePermission = (actor, permission) => {
  requireCondition(
    actor.type === "admin" && actor.permissions?.includes(permission),
    403,
    `Permission required: ${permission}`,
  );
};
export const requireOwner = (actor, campaign) => {
  requireCondition(
    actor.type === "business" && Number(actor.id) === Number(campaign.user_id),
    403,
    "Campaign owner access required",
  );
};
export const authorize = (actor, campaign, permission) => {
  if (actor.type === "admin") requirePermission(actor, permission);
  else requireOwner(actor, campaign);
};
export const requireReason = (value) => {
  requireCondition(
    typeof value === "string" &&
      value.trim().length >= 5 &&
      value.trim().length <= 2000,
    400,
    "A reason of 5 to 2000 characters is required",
  );
  return value.trim();
};
export const requireSupport = (input) => {
  requireReason(input.reason);
  requireCondition(
    typeof input.supportCaseId === "string" &&
      input.supportCaseId.trim().length > 0 &&
      input.supportCaseId.length <= 150,
    400,
    "A supportCaseId is required for this support action",
  );
};

export function planTransition(campaign, actor, input, moderation = false) {
  const current = campaign.campaignStatus;
  const target = input.campaignStatus;
  requireCondition(
    CAMPAIGN_STATUSES.includes(target),
    400,
    "Invalid campaignStatus",
  );
  requireCondition(
    !["Completed", "Cancelled"].includes(current),
    409,
    "Final campaigns cannot change status",
  );
  requireCondition(current !== target, 409, "Campaign already has this status");
  if (actor.type === "admin") requireReason(input.reason);
  else requireOwner(actor, campaign);

  if (target === "Suspended") {
    requirePermission(actor, "campaign:moderate");
    requireCondition(
      ["Live", "Closed"].includes(current),
      409,
      "Only live or closed campaigns can be suspended",
    );
    return { campaignStatus: target, suspendedFrom: current };
  }
  if (current === "Suspended") {
    requirePermission(actor, "campaign:moderate");
    requireCondition(
      target === campaign.suspendedFrom || (campaign.suspendedFrom === "Live" && target === "Closed"),
      409,
      "Restore must return to the previous status or close a previously live campaign",
    );
    requireCondition(
      input.reviewConfirmed === true,
      400,
      "Restoration requires reviewConfirmed: true",
    );
    return { campaignStatus: target, suspendedFrom: null };
  }
  const edges = {
    Draft: ["Live", "Pending Review", "Cancelled"],
    "Pending Review": ["Live", "Draft", "Cancelled"],
    Live: ["Closed", "Cancelled"],
    Closed: ["Live", "Completed", "Cancelled"],
  };
  requireCondition(
    edges[current]?.includes(target),
    409,
    `Cannot change campaign from ${current} to ${target}`,
  );
  if (target === "Live" && current !== "Closed") {
    if (moderation || current === "Pending Review") {
      requirePermission(actor, "campaign:moderate");
      requireCondition(
        current === "Pending Review",
        409,
        "Campaign must be submitted for review first",
      );
    } else {
      requireOwner(actor, campaign);
    }
  } else if (target === "Pending Review") {
    requireCondition(moderation, 409, "Campaign moderation is disabled");
    requireOwner(actor, campaign);
  } else if (target === "Draft") {
    requirePermission(actor, "campaign:moderate");
  } else {
    const permission = {
      Live: "campaign:reopen:any",
      Closed: "campaign:close:any",
      Completed: "campaign:complete:any",
      Cancelled: "campaign:cancel:any",
    }[target];
    authorize(actor, campaign, permission);
  }
  if (target === "Cancelled") requireReason(input.reason);
  return { campaignStatus: target };
}

export function assertObligations(target, applications, deals) {
  if (target === "Completed") {
    requireCondition(
      !applications.some((row) => row.status === "pending"),
      409,
      "Resolve pending applications before completion",
    );
    requireCondition(
      deals.every((row) => ["approved", "completed"].includes(row.deal_status)),
      409,
      "All deal work must be approved before completion",
    );
  }
  requireCondition(
    deals.every((row) => row.obligationsResolvedAt),
    409,
    "Resolve all deal obligations before completing or cancelling the campaign",
  );
}
