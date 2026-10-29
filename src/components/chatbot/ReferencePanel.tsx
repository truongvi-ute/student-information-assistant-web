import { FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReferencePanelProps {
  onClose: () => void;
}

export function ReferencePanel({ onClose }: ReferencePanelProps) {
  return (
    <aside className="flex h-full w-full flex-col border-l border-[#E2E8F0] bg-white lg:w-72">
      <div className="flex items-center justify-between border-b border-[#E2E8F0] p-4">
        <h2 className="text-sm font-semibold">Nguồn tài liệu tham khảo</h2>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onClose}
          aria-label="Đóng tài liệu tham khảo"
          className="h-8 w-8"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="rounded-xl border border-[#E2E8F0] p-4 text-center">
          <FileText className="mx-auto mb-3 h-7 w-7 text-[#94A3B8]" />
          <p className="text-xs leading-relaxed text-[#64748B]">
            Tài liệu liên quan sẽ xuất hiện tại đây khi câu trả lời có nguồn tham khảo.
          </p>
        </div>
      </div>
    </aside>
  );
}
