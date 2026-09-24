import { getValidLink } from "@/lib/archive/service";
import PublicFrame, { LinkInvalid } from "@/components/archive/PublicFrame";
import UploadBox from "@/components/archive/UploadBox";

export const dynamic = "force-dynamic";

export default async function PublicUpload({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const link = await getValidLink(token, "upload");
  if (!link) return <LinkInvalid />;
  return (
    <PublicFrame
      title={link.client ? `Send documents for ${link.client.name}` : "Send client documents"}
      subtitle="Add as many files as you like — PDFs, photos or scans. Each one is filed in the client's archive automatically and gets a reference number."
    >
      <UploadBox endpoint={`/api/s/${token}/upload`} askClientName={!link.client} askUploaderName showDetails={false} />
      {link.expiresAt && (
        <p className="text-xs text-gray-500">This link works until {link.expiresAt.toLocaleDateString("en-GB")}.</p>
      )}
    </PublicFrame>
  );
}
