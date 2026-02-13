const C2M2 = {
  name: "C2M2",
  domains: [
    { name: "Asset Management", keywords: ["asset", "inventory", "ownership"] },
    { name: "Access Control", keywords: ["access", "authentication", "authorization"] },
    { name: "Incident Response", keywords: ["incident", "response", "recovery"] }
  ]
};

const NIST = {
  name: "NIST",
  domains: [
    { name: "Identify", keywords: ["risk", "asset", "governance"] },
    { name: "Protect", keywords: ["access control", "training"] },
    { name: "Detect", keywords: ["monitoring", "detection"] }
  ]
};

const ISO27001 = {
  name: "ISO27001",
  domains: [
    { name: "Policy", keywords: ["policy", "management"] },
    { name: "Organization", keywords: ["roles", "responsibilities"] },
    { name: "HR Security", keywords: ["employee", "training"] }
  ]
};

module.exports = { C2M2, NIST, ISO27001 };
