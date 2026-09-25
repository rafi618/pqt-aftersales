import { getValidLink } from "@/lib/archive/service";
import PublicFrame, { LinkInvalid } from "@/components/archive/PublicFrame";
import UploadBox from "@/components/archive/UploadBox";

export const dynamic = "force-dynamic";

export default async function PublicVoucherUpload({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const link = await getValidLink(token, "voucher-upload");
  if (!link) return <LinkInvalid />;
  return (
    <PublicFrame
      title={link.client ? `Send receipts for ${link.client.name}` : "Send receipts & vouchers to PQT"}
      subtitle="Upload receipts, bills, bank slips or invoices — photos are fine. Each one is numbered and sent to the PQT accounts team."
    >
      <UploadBox endpoint={`/api/s/${token}/vouchers`} askUploaderName askClientName={!link.client} clientRequired={false} showDetails={false} />
      {link.expiresAt && <p className="text-xs text-gray-500">This link works until {link.expiresAt.toLocaleDateString("en-GB")}.</p>}
    </PublicFrame>
  );
}
