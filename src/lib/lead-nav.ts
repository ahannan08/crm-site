export interface LeadNavItem {
  href: string;
  label: string;
  match: (path: string) => boolean;
}

export const adminLeadSubItems: LeadNavItem[] = [
  {
    href: "/leads/enquiries",
    label: "Enquiry",
    match: (path) => path.startsWith("/leads/enquiries") || path.startsWith("/enquiries"),
  },
  {
    href: "/leads",
    label: "Lead",
    match: (path) =>
      path === "/leads" ||
      (path.startsWith("/leads/") &&
        !path.startsWith("/leads/enquiries") &&
        !path.startsWith("/leads/transfer") &&
        !path.startsWith("/leads/bulk-update")),
  },
  {
    href: "/leads/transfer",
    label: "Lead Transfer",
    match: (path) => path.startsWith("/leads/transfer"),
  },
  {
    href: "/leads/bulk-update",
    label: "Bulk Lead Update",
    match: (path) => path.startsWith("/leads/bulk-update"),
  },
];

export const agentLeadSubItems: LeadNavItem[] = [
  {
    href: "/leads/enquiries",
    label: "Enquiry",
    match: (path) => path.startsWith("/leads/enquiries") || path.startsWith("/enquiries"),
  },
  {
    href: "/leads",
    label: "Lead",
    match: (path) =>
      path === "/leads" ||
      (path.startsWith("/leads/") &&
        !path.startsWith("/leads/enquiries") &&
        !path.startsWith("/leads/transfer") &&
        !path.startsWith("/leads/bulk-update")),
  },
];

export function isLeadSectionActive(path: string): boolean {
  return (
    path.startsWith("/leads") ||
    path.startsWith("/enquiries")
  );
}
