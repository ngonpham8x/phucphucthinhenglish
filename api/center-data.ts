import { randomUUID } from "node:crypto";
import { allowedOrigin, authorizeCenter, sendJson } from "../server/auth";
import {
  applyCenterChanges,
  canonicalCenter,
  PolicyError,
  projectCenter,
} from "../server/centerPolicy";
import { initialSettings } from "../src/mock/initialData";
import type { CenterPayload } from "../src/lib/centerChanges";

export default async function handler(req: any, res: any) {
  if (!["GET", "PATCH"].includes(req.method)) {
    res.setHeader("Allow", "GET, PATCH");
    return sendJson(res, 405, { error: "Phương thức không được hỗ trợ." });
  }
  try {
    if (!allowedOrigin(req))
      throw new PolicyError("Nguồn yêu cầu không được phép.");
    const { client, actor } = await authorizeCenter(req);
    const { data: row, error } = await client
      .from("center_data")
      .select("payload,updated_at,last_request_id,last_request_actor")
      .eq("id", "primary")
      .maybeSingle();
    if (error) throw new Error("Không thể tải dữ liệu trung tâm.");
    const full = canonicalCenter({
      settings: initialSettings,
      ...(row?.payload || {}),
    } as CenterPayload);
    if (req.method === "GET")
      return sendJson(res, 200, {
        payload: projectCenter(full, actor),
        version: row?.updated_at || null,
      });
    let body = req.body;
    if (typeof body === "string") {
      if (Buffer.byteLength(body) > 4_000_000)
        throw new PolicyError("Gói cập nhật quá lớn.", 413);
      try {
        body = JSON.parse(body);
      } catch {
        throw new PolicyError("Nội dung cập nhật không hợp lệ.", 400);
      }
    }
    if (
      !body ||
      Array.isArray(body) ||
      typeof body !== "object" ||
      Buffer.byteLength(JSON.stringify(body)) > 4_000_000
    )
      throw new PolicyError("Gói cập nhật không hợp lệ hoặc quá lớn.", 400);
    if (
      !/^[0-9a-f-]{36}$/i.test(body.requestId || "") ||
      (body.version !== null && typeof body.version !== "string")
    )
      throw new PolicyError("Phiên bản cập nhật không hợp lệ.", 400);
    if (
      row?.last_request_id === body.requestId &&
      row.last_request_actor === actor.id
    )
      return sendJson(res, 200, {
        payload: projectCenter(full, actor),
        version: row.updated_at,
      });
    if ((row?.updated_at || null) !== body.version)
      throw new PolicyError(
        "Dữ liệu đã được người khác cập nhật. Hãy xuất backup thay đổi trước khi tải lại trang.",
        409,
      );
    // The transaction checks version and current permissions again. Repeating a
    // completed request is idempotent when its response was lost in transit.
    const { payload } = applyCenterChanges(
      full,
      body.changes,
      actor,
      body.requestId || randomUUID(),
    );
    const { data: saved, error: saveError } = await client.rpc(
      "commit_center_data",
      {
        p_actor: actor.id,
        p_role: actor.role,
        p_permissions: actor.permissions,
        p_version: body.version,
        p_payload: payload,
        p_request_id: body.requestId,
      },
    );
    if (saveError) {
      if (saveError.message?.includes("CENTER_CONFLICT"))
        throw new PolicyError(
          "Dữ liệu đã được người khác cập nhật. Hãy xuất backup thay đổi trước khi tải lại trang.",
          409,
        );
      if (saveError.message?.includes("CENTER_FORBIDDEN"))
        throw new PolicyError(
          "Quyền tài khoản đã thay đổi. Hãy tải lại trang.",
          403,
        );
      throw new Error("Không thể lưu dữ liệu trung tâm.");
    }
    return sendJson(res, 200, {
      payload: projectCenter(saved.payload, actor),
      version: saved.updated_at,
    });
  } catch (error) {
    return sendJson(res, error instanceof PolicyError ? error.status : 500, {
      error:
        error instanceof Error ? error.message : "Không thể xử lý yêu cầu.",
    });
  }
}
