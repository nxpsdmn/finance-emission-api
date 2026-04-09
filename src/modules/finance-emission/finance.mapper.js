const toRequesterContext = (auth = {}) => ({
  subject: auth.subject,
  ownerCompanyId: auth.companyId || null,
  clientCompanyKey: auth.companyKey || auth.companyId || null,
  clientUserId: auth.subject,
  email: auth.email || null,
  displayName: auth.displayName || null,
});

const normalizeDataEntry = (entry = {}) => {
  const normalized = { ...entry };

  if (entry.attribution_factor) {
    normalized.attributionFactor_value = entry.attribution_factor.value;
    normalized.attributionFactor_key = entry.attribution_factor.key;
  }

  if (entry.attributionFactor) {
    normalized.attributionFactor_value = entry.attributionFactor.value;
    normalized.attributionFactor_key = entry.attributionFactor.key;
  }

  delete normalized.attributionFactor;
  delete normalized.attribution_factor;

  return normalized;
};

module.exports = {
  toRequesterContext,
  normalizeDataEntry,
};
