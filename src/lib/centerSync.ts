import {
  buildCenterChanges,
  hasCenterChanges,
  type CenterChanges,
  type CenterPayload,
} from "./centerChanges";

export interface CenterSnapshot {
  payload: CenterPayload;
  version: string | null;
}
export class CenterSyncConflict extends Error {
  constructor(
    message = "Dữ liệu đã được người khác cập nhật. Hãy xuất backup thay đổi trước khi tải lại trang.",
  ) {
    super(message);
  }
}
export async function centerRequest(
  token: string,
  body?: { version: string | null; requestId: string; changes: CenterChanges },
): Promise<CenterSnapshot> {
  const serialized = body ? JSON.stringify(body) : undefined;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25_000);
  let response: Response;
  try {
    response = await fetch("/api/center-data", {
      method: body ? "PATCH" : "GET",
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: serialized,
      keepalive: Boolean(
        serialized && new TextEncoder().encode(serialized).length < 60_000,
      ),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
  const data = await response
    .json()
    .catch(() => ({ error: "Máy chủ trả về nội dung không hợp lệ." }));
  if (response.status === 409) throw new CenterSyncConflict(data.error);
  if (!response.ok) throw new Error(data.error || "Không thể kết nối máy chủ.");
  return data;
}

// Drain edits made during an in-flight request. Failed requests retain their
// id and body, so a retry cannot apply the same mutation twice.
export class CenterSyncQueue {
  private baseline: CenterPayload;
  private latest: CenterPayload;
  private running: Promise<void> | null = null;
  private attempt: {
    snapshot: CenterPayload;
    body: { version: string | null; requestId: string; changes: CenterChanges };
  } | null = null;
  private version: string | null;
  error: Error | null = null;
  constructor(
    snapshot: CenterSnapshot,
    private send: (body: {
      version: string | null;
      requestId: string;
      changes: CenterChanges;
    }) => Promise<CenterSnapshot>,
    private changed: () => void = () => {},
    private saved: (
      result: CenterSnapshot,
      sent: CenterPayload,
    ) => void = () => {},
  ) {
    this.baseline = snapshot.payload;
    this.latest = snapshot.payload;
    this.version = snapshot.version;
  }
  get dirty() {
    return this.hasChanges(this.latest);
  }
  hasChanges(payload:CenterPayload) {
    return Boolean(this.attempt || hasCenterChanges(buildCenterChanges(this.baseline,payload)));
  }
  get saving() {
    return Boolean(this.running);
  }
  update(payload: CenterPayload) {
    this.latest = payload;
  }
  flush(): Promise<void> {
    if (this.running) return this.running;
    this.running = this.drain().finally(() => {
      this.running = null;
      this.changed();
    });
    this.changed();
    return this.running;
  }
  private async drain() {
    this.error = null;
    try {
      while (this.dirty) {
        if (!this.attempt)
          this.attempt = {
            snapshot: this.latest,
            body: {
              version: this.version,
              requestId: crypto.randomUUID(),
              changes: buildCenterChanges(this.baseline, this.latest),
            },
          };
        const attempt = this.attempt;
        const result = await this.send(attempt.body);
        this.version = result.version;
        this.baseline = attempt.snapshot;
        this.attempt = null;
        this.saved(result, attempt.snapshot);
      }
    } catch (error) {
      this.error =
        error instanceof Error ? error : new Error("Không thể lưu dữ liệu.");
      throw this.error;
    }
  }
}
