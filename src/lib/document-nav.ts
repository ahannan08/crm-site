export interface NavSubItem {
  href: string;
  label: string;
  match: (path: string) => boolean;
}

export const documentSubItems: NavSubItem[] = [
  {
    href: "/documents",
    label: "Document List",
    match: (path) => path === "/documents",
  },
  {
    href: "/documents/checklist",
    label: "Document Checklist",
    match: (path) => path.startsWith("/documents/checklist"),
  },
  {
    href: "/documents/add",
    label: "Add Document",
    match: (path) => path.startsWith("/documents/add"),
  },
  {
    href: "/documents/update",
    label: "Update Doc",
    match: (path) => path.startsWith("/documents/update"),
  },
];

export function isDocumentSectionActive(path: string): boolean {
  return path.startsWith("/documents");
}
