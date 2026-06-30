"use client";

import { useState, useRef } from "react";
import { Upload, FileText, Image, Trash2, ExternalLink } from "lucide-react";

interface Document {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  filePath: string;
  label: string | null;
  createdAt: string;
}

interface Props {
  documents: Document[];
  entityType: "ticketId" | "warrantyClaimId" | "invoiceId";
  entityId: string;
  onUpdate: () => void;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentSection({
  documents,
  entityType,
  entityId,
  onUpdate,
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [label, setLabel] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleUpload(file: File) {
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append(entityType, entityId);
    if (label.trim()) formData.append("label", label.trim());

    const res = await fetch("/api/documents", {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      setLabel("");
      if (fileRef.current) fileRef.current.value = "";
      onUpdate();
    }
    setUploading(false);
  }

  async function handleDelete(docId: string) {
    const res = await fetch(`/api/documents/${docId}`, { method: "DELETE" });
    if (res.ok) onUpdate();
  }

  function getIcon(mimeType: string) {
    if (mimeType.startsWith("image/"))
      return <Image className="h-5 w-5 text-blue-500" />;
    return <FileText className="h-5 w-5 text-gray-500" />;
  }

  return (
    <div className="border-t border-gray-200 pt-6">
      <h4 className="font-medium text-gray-900 mb-4">Documents</h4>

      {documents.length > 0 && (
        <div className="space-y-2 mb-4">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg group"
            >
              {getIcon(doc.mimeType)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {doc.label || doc.fileName}
                </p>
                <p className="text-xs text-gray-500">
                  {doc.fileName} &middot; {formatFileSize(doc.fileSize)}
                </p>
              </div>
              <a
                href={doc.filePath}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                title="Open file"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
              <button
                onClick={() => handleDelete(doc.id)}
                className="p-1.5 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all"
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-3">
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Label (optional)
          </label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Receipt, Purchase proof, Photo..."
          />
        </div>
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleUpload(file);
          }}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50 transition-colors"
        >
          <Upload className="h-4 w-4" />
          {uploading ? "Uploading..." : "Upload File"}
        </button>
      </div>
    </div>
  );
}
