export type DocumentStatus = "pending" | "received" | "verified" | "rejected";

export interface ClientDocument {
  id: string;
  clientName: string;
  documentName: string;
  type: string;
  status: DocumentStatus;
  assignedTo: string;
  uploadedOn: string;
  service: string;
  notes?: string;
}

export interface ChecklistItem {
  id: string;
  name: string;
  visaType: string;
  category: string;
  required: boolean;
}

export const DUMMY_DOCUMENTS: ClientDocument[] = [
  {
    id: "doc-1",
    clientName: "Priya Sharma",
    documentName: "Passport Copy",
    type: "Passport",
    status: "verified",
    assignedTo: "Priya Sharma",
    uploadedOn: "2026-09-08",
    service: "Visitor Visa - Australia",
    notes: "Valid until 2031",
  },
  {
    id: "doc-2",
    clientName: "Mohd Saleem",
    documentName: "Bank Statement",
    type: "Financial",
    status: "received",
    assignedTo: "Abdul Rasheed",
    uploadedOn: "2026-09-09",
    service: "Schengen Work Visa",
  },
  {
    id: "doc-3",
    clientName: "Irfan Syed",
    documentName: "ITR FY 2024-25",
    type: "Financial",
    status: "pending",
    assignedTo: "Sohaib Mohammad",
    uploadedOn: "2026-09-10",
    service: "Visitor Visa - Australia",
  },
  {
    id: "doc-4",
    clientName: "Anita Desai",
    documentName: "Employment Letter",
    type: "Employment",
    status: "rejected",
    assignedTo: "Priya Sharma",
    uploadedOn: "2026-09-07",
    service: "Work Permit Europe",
    notes: "Needs company letterhead",
  },
  {
    id: "doc-5",
    clientName: "Rahul Khan",
    documentName: "Passport Photos",
    type: "Identity",
    status: "verified",
    assignedTo: "Abdul Rasheed",
    uploadedOn: "2026-09-06",
    service: "Visitor Visa - UK",
  },
  {
    id: "doc-6",
    clientName: "Mohd Masthan Baba",
    documentName: "Travel Insurance",
    type: "Insurance",
    status: "received",
    assignedTo: "Sohaib Mohammad",
    uploadedOn: "2026-09-11",
    service: "Schengen Work Visa",
  },
];

export const DUMMY_CHECKLIST: ChecklistItem[] = [
  { id: "cl-1", name: "Passport Copy (front & back)", visaType: "Visitor Visa", category: "Identity", required: true },
  { id: "cl-2", name: "Passport-size Photographs", visaType: "Visitor Visa", category: "Identity", required: true },
  { id: "cl-3", name: "Bank Statement (6 months)", visaType: "Visitor Visa", category: "Financial", required: true },
  { id: "cl-4", name: "ITR / Tax Returns", visaType: "Visitor Visa", category: "Financial", required: true },
  { id: "cl-5", name: "Employment Letter", visaType: "Work Permit", category: "Employment", required: true },
  { id: "cl-6", name: "Offer Letter", visaType: "Work Permit", category: "Employment", required: true },
  { id: "cl-7", name: "Educational Certificates", visaType: "Student Visa", category: "Education", required: true },
  { id: "cl-8", name: "Admission Letter", visaType: "Student Visa", category: "Education", required: true },
  { id: "cl-9", name: "Travel Insurance", visaType: "Schengen Visa", category: "Travel", required: false },
  { id: "cl-10", name: "Cover Letter", visaType: "Schengen Visa", category: "Application", required: false },
];

export const DOCUMENT_STATUSES: { value: DocumentStatus; label: string; color: string }[] = [
  { value: "pending", label: "Pending", color: "bg-amber-100 text-amber-800" },
  { value: "received", label: "Received", color: "bg-blue-100 text-blue-800" },
  { value: "verified", label: "Verified", color: "bg-green-100 text-green-800" },
  { value: "rejected", label: "Rejected", color: "bg-red-100 text-red-700" },
];

export const DOCUMENT_TYPES = ["Passport", "Financial", "Employment", "Identity", "Insurance", "Education", "Other"];

export const ASSIGNEES = ["Priya Sharma", "Abdul Rasheed", "Sohaib Mohammad"];

export function labelForDocumentStatus(status: DocumentStatus): string {
  return DOCUMENT_STATUSES.find((s) => s.value === status)?.label ?? status;
}

export function documentStatusColor(status: DocumentStatus): string {
  return DOCUMENT_STATUSES.find((s) => s.value === status)?.color ?? "bg-gray-100 text-gray-800";
}
