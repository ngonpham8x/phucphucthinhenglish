import type {
  CenterPayload,
  CenterChanges,
  CenterCollection,
} from "../src/lib/centerChanges.js";
import { CENTER_COLLECTIONS } from "../src/lib/centerChanges.js";
import {
  normalizePermissions,
  canSeeDebt,
  canSeeRevenue,
  canExportCenter,
} from "../src/lib/access.js";
import {
  reconcileReceiptBalances,
  feeStatusForReceipts,
  paymentKindOf,
} from "../src/lib/tuition.js";
import {
  newReceiptCodeConflicts,
  newTuitionOverpayments,
} from "../src/lib/receiptPolicy.js";
import { MODULE_LABELS, FIELD_LABELS } from "../src/lib/activityLog.js";
import type { StaffPermissions, ActivityLog } from "../src/types.js";

export interface CenterActor {
  id: string;
  full_name: string;
  role: "owner" | "staff";
  is_active: boolean;
  permissions: unknown;
}
export class PolicyError extends Error {
  constructor(
    message: string,
    public status = 403,
  ) {
    super(message);
  }
}
const copy = <T>(value: T): T => structuredClone(value);
const own = (actor: CenterActor) => actor.role === "owner";
const equal = (a: unknown, b: unknown) =>
  JSON.stringify(a) === JSON.stringify(b);
const bad = (message: string): never => {
  throw new PolicyError(message, 400);
};
const deny = (allowed: boolean) => {
  if (!allowed)
    throw new PolicyError("Tài khoản không được phép thay đổi dữ liệu này.");
};
const fields: Record<CenterCollection, string[]> = {
  students: [
    "code",
    "name",
    "avatar",
    "dob",
    "gender",
    "school",
    "gradeLevel",
    "programId",
    "classId",
    "extraClassIds",
    "address",
    "email",
    "phone",
    "parentName",
    "parentPhone",
    "parentConsent",
    "enrollDate",
    "notes",
    "status",
  ],
  teachers: [
    "name",
    "avatar",
    "phone",
    "email",
    "address",
    "specialty",
    "scheduleNotes",
    "notes",
  ],
  classes: [
    "code",
    "name",
    "programId",
    "teacherId",
    "roomId",
    "scheduleTime",
    "days",
    "capacity",
  ],
  programs: ["code", "name", "category", "tuitionFee", "description"],
  rooms: ["name", "capacity", "status", "notes"],
  timetableSlots: [
    "classId",
    "teacherId",
    "roomId",
    "dayOfWeek",
    "startTime",
    "endTime",
  ],
  grades: [
    "studentId",
    "classId",
    "listening",
    "speaking",
    "reading",
    "writing",
    "midterm",
    "finalExam",
    "attendance",
  ],
  receipts: [
    "code",
    "studentId",
    "classId",
    "courseFee",
    "monthlyFee",
    "paymentKind",
    "billingPeriod",
    "discount",
    "paidAmount",
    "debtAmount",
    "status",
    "paymentDate",
    "paymentMethod",
    "notes",
    "collectorName",
  ],
  backups: ["filename", "timestamp", "sizeKb", "type", "status"],
};
const emptyStudent = {
  code: "",
  name: "",
  dob: "",
  gender: "Chưa xác định",
  school: "",
  gradeLevel: "",
  programId: "",
  classId: "",
  extraClassIds: [],
  address: "",
  email: "",
  phone: "",
  parentName: "",
  parentPhone: "",
  enrollDate: "",
  status: "active",
  feeStatus: "unpaid",
};

export function canonicalCenter(input: CenterPayload): CenterPayload {
  const data = copy(input);
  for (const key of CENTER_COLLECTIONS) (data as any)[key] ||= [];
  data.activityLogs ||= [];
  data.receipts = reconcileReceiptBalances(data.receipts);
  data.students = data.students.map((student) => ({
    ...student,
    extraClassIds: [
      ...new Set(
        student.extraClassIds ||
          data.classes
            .filter((classroom) => classroom.studentIds?.includes(student.id))
            .map((classroom) => classroom.id),
      ),
    ].filter((id) => id !== student.classId),
    feeStatus: feeStatusForReceipts(
      data.receipts.filter((receipt) => receipt.studentId === student.id),
    ),
  }));
  data.classes = data.classes.map((classroom) => ({
    ...classroom,
    studentIds: data.students
      .filter(
        (student) =>
          student.classId === classroom.id ||
          student.extraClassIds?.includes(classroom.id),
      )
      .map((student) => student.id),
  }));
  data.teachers = data.teachers.map((teacher) => ({
    ...teacher,
    assignedClassIds: data.classes
      .filter((classroom) => classroom.teacherId === teacher.id)
      .map((classroom) => classroom.id),
  }));
  return data;
}

export function projectCenter(
  input: CenterPayload,
  actor: CenterActor,
): CenterPayload {
  const full = canonicalCenter(input);
  if (own(actor)) return full;
  const p = normalizePermissions(actor.permissions);
  const debt = canSeeDebt(false, p),
    revenue = canSeeRevenue(false, p);
  const school =
    p.student.view ||
    p.teacher.view ||
    p.grade.view ||
    p.tuition.view ||
    revenue;
  const students = p.student.view || p.grade.view || p.tuition.view;
  const result = copy(full);
  result.settings = {
    name: full.settings?.name || "",
    slogan: full.settings?.slogan || "",
    address: full.settings?.address || "",
    phone: full.settings?.phone || "",
    email: "",
    adminReportEmail: "",
    autoEmailReport: false,
    autoBackup: false,
    sheetsConfig: {
      spreadsheetId: "",
      sheetName: "",
      autoSync: false,
      syncInterval: "daily",
      connected: false,
    },
  };
  result.students = students
    ? (full.students.map((student) => ({
        ...emptyStudent,
        ...(p.student.view
          ? student
          : {
              id: student.id,
              code: student.code,
              name: student.name,
              classId: student.classId,
              extraClassIds: student.extraClassIds,
              status: student.status,
            }),
        feeStatus: debt ? student.feeStatus : "unpaid",
      })) as any)
    : [];
  result.classes = school
    ? full.classes.map((classroom) => ({
        ...classroom,
        studentIds: students ? classroom.studentIds : [],
      }))
    : [];
  result.programs = school
    ? full.programs.map((program) => ({
        ...program,
        tuitionFee: debt ? program.tuitionFee : 0,
      }))
    : [];
  result.teachers = p.teacher.view
    ? full.teachers
    : school
      ? full.teachers.map((teacher) => ({
          id: teacher.id,
          name: teacher.name,
          phone: "",
          email: "",
          address: "",
          specialty: "",
          assignedClassIds: teacher.assignedClassIds,
        }))
      : [];
  result.rooms = school ? full.rooms : [];
  result.timetableSlots = school ? full.timetableSlots : [];
  result.grades = p.grade.view ? full.grades : [];
  if (p.tuition.view)
    result.receipts = full.receipts.map((receipt) => ({
      ...receipt,
      courseFee: debt ? receipt.courseFee : 0,
      monthlyFee: debt ? receipt.monthlyFee : 0,
      discount: debt ? receipt.discount : 0,
      debtAmount: debt ? receipt.debtAmount : 0,
      status: debt ? receipt.status : "unpaid",
    }));
  else if (revenue) {
    const groups = new Map<string, any>();
    for (const receipt of full.receipts) {
      const month = receipt.paymentDate.slice(0, 7),
        kind = paymentKindOf(receipt),
        key = JSON.stringify([month, receipt.classId, kind]);
      const entry = groups.get(key) || {
        id: `REPORT:${key}`,
        code: "TỔNG HỢP",
        studentId: "",
        classId: receipt.classId,
        paymentKind: kind,
        courseFee: 0,
        monthlyFee: 0,
        billingPeriod: month,
        discount: 0,
        paidAmount: 0,
        debtAmount: 0,
        paymentDate: `${month}-01`,
        collectorName: "",
        paymentMethod: "Chưa xác định",
        status: "paid",
      };
      entry.paidAmount += receipt.paidAmount;
      entry[kind === "course" ? "courseFee" : "monthlyFee"] = entry.paidAmount;
      groups.set(key, entry);
    }
    result.receipts = [...groups.values()];
  } else result.receipts = [];
  result.backups = [];
  result.activityLogs = [];
  return result;
}

function mayChange(
  actor: CenterActor,
  p: StaffPermissions,
  name: CenterCollection,
  operation: "add" | "edit" | "delete",
) {
  if (own(actor)) return true;
  if (name === "students") return p.student.view && p.student[operation];
  if (name === "programs")
    return (
      operation === "add" && p.student.view && (p.student.add || p.student.edit)
    );
  if (name === "teachers")
    return (
      p.teacher.view &&
      (operation === "delete" ? p.teacher.delete : p.teacher.edit)
    );
  if (name === "grades")
    return p.grade.view && p.grade.edit && operation !== "delete";
  if (name === "receipts")
    return (
      p.tuition.view &&
      p.tuition.showDebt &&
      (operation === "delete" ? p.tuition.delete : p.tuition.collect)
    );
  return false;
}

function validate(
  data: CenterPayload,
  touched: Set<CenterCollection>,
  before: CenterPayload,
) {
  for (const name of CENTER_COLLECTIONS) {
    const ids = new Set<string>();
    for (const row of data[name] as any[]) {
      if (
        typeof row.id !== "string" ||
        !row.id ||
        row.id.length > 150 ||
        ids.has(row.id)
      )
        bad("ID dữ liệu bị trùng hoặc không hợp lệ.");
      ids.add(row.id);
    }
  }
  for (const name of ["students", "classes", "programs"] as const) {
    const codes = new Set<string>();
    for (const row of data[name]) {
      if (
        typeof row.code !== "string" ||
        !row.code.trim() ||
        typeof row.name !== "string" ||
        !row.name.trim()
      )
        bad("Mã và họ tên/tên danh mục không được để trống.");
      const code = row.code.trim().toLocaleUpperCase("vi-VN");
      if (codes.has(code)) bad(`Mã bị trùng: ${row.code}`);
      codes.add(code);
    }
  }
  const ids = (name: CenterCollection) =>
    new Set((data[name] as any[]).map((row) => row.id));
  const studentIds = ids("students"),
    classIds = ids("classes"),
    teacherIds = ids("teachers"),
    roomIds = ids("rooms"),
    programIds = ids("programs");
  const reference = (id: unknown, allowed: Set<string>) => {
    if (id && (typeof id !== "string" || !allowed.has(id)))
      bad("Có liên kết đến hồ sơ/lớp/danh mục không tồn tại.");
  };
  for (const student of data.students) {
    reference(student.classId, classIds);
    reference(student.programId, programIds);
    if (!Array.isArray(student.extraClassIds || []))
      bad("Danh sách lớp bổ sung không hợp lệ.");
    for (const id of student.extraClassIds || []) reference(id, classIds);
    if (!["active", "reserved", "dropped"].includes(student.status))
      bad("Trạng thái học viên không hợp lệ.");
  }
  for (const classroom of data.classes) {
    reference(classroom.programId, programIds);
    reference(classroom.teacherId, teacherIds);
    reference(classroom.roomId, roomIds);
  }
  for (const slot of data.timetableSlots) {
    reference(slot.classId, classIds);
    reference(slot.teacherId, teacherIds);
    reference(slot.roomId, roomIds);
  }
  for (const grade of data.grades) {
    reference(grade.studentId, studentIds);
    reference(grade.classId, classIds);
    for (const key of [
      "listening",
      "speaking",
      "reading",
      "writing",
      "midterm",
      "finalExam",
      "attendance",
    ] as const) {
      if (
        typeof grade[key] !== "number" ||
        !Number.isFinite(grade[key]) ||
        grade[key] < 0 ||
        grade[key] > 10
      )
        bad("Điểm số phải từ 0 đến 10.");
    }
    grade.average =
      Math.round(
        (((grade.listening + grade.speaking + grade.reading + grade.writing) /
          4) *
          0.4 +
          grade.midterm * 0.2 +
          grade.finalExam * 0.3 +
          grade.attendance * 0.1) *
          10,
      ) / 10;
  }
  for (const receipt of data.receipts) {
    if (typeof receipt.code !== "string" || !receipt.code.trim())
      bad("Mã phiếu thu không hợp lệ.");
    if (!receipt.studentId) bad("Phiếu thu cần liên kết học viên.");
    reference(receipt.studentId, studentIds);
    reference(receipt.classId, classIds);
    if (touched.has("receipts")) {
      for (const key of [
        "courseFee",
        "monthlyFee",
        "paidAmount",
        "discount",
        "debtAmount",
      ] as const) {
        const amount = receipt[key] ?? 0;
        if (
          typeof amount !== "number" ||
          !Number.isFinite(amount) ||
          amount < 0
        )
          bad("Số tiền học phí không hợp lệ.");
      }
      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(receipt.paymentDate) ||
        Number.isNaN(Date.parse(receipt.paymentDate)) ||
        new Date(receipt.paymentDate).toISOString().slice(0, 10) !==
          receipt.paymentDate
      )
        bad("Ngày thu không hợp lệ.");
      if (
        receipt.paymentKind &&
        !["course", "monthly"].includes(receipt.paymentKind)
      )
        bad("Khoản thu không hợp lệ.");
    }
  }
  if (touched.has("receipts")) {
    if (newReceiptCodeConflicts(data.receipts).length)
      bad("Mã phiếu thu từ ngày 19/11/2026 phải duy nhất trên hệ thống.");
    const previous = new Map(
      newTuitionOverpayments(before.receipts).map((group) => [
        group.key,
        group.excess,
      ]),
    );
    for (const { key, excess } of newTuitionOverpayments(data.receipts)) {
      if (excess > (previous.get(key) || 0))
        bad("Tổng thu vượt học phí phải đóng của học viên trong kỳ.");
    }
  }
}

export function applyCenterChanges(
  input: CenterPayload,
  changes: CenterChanges,
  actor: CenterActor,
  requestId: string,
) {
  if (!actor.is_active) throw new PolicyError("Tài khoản đã bị khóa.");
  if (
    !changes ||
    typeof changes !== "object" ||
    Array.isArray(changes) ||
    Object.keys(changes).some(
      (key) => !["settings", "collections", "events"].includes(key),
    )
  )
    bad("Gói cập nhật không hợp lệ.");
  if (
    changes.events &&
    (!Array.isArray(changes.events) || changes.events.length > 500)
  )
    bad("Nhật ký cập nhật không hợp lệ.");
  if (
    changes.collections &&
    (typeof changes.collections !== "object" ||
      Array.isArray(changes.collections))
  )
    bad("Phân hệ cập nhật không hợp lệ.");
  const p = normalizePermissions(actor.permissions),
    data = canonicalCenter(input),
    visible = projectCenter(data, actor);
  const touched = new Set<CenterCollection>();
  const logs: ActivityLog[] = [];
  const log = (
    action: ActivityLog["action"],
    module: string,
    details: string,
  ) =>
    logs.push({
      id: `AUDIT_${requestId}_${logs.length}`,
      timestamp: new Date().toLocaleString("vi-VN"),
      userEmail: "",
      userName: actor.full_name,
      action,
      module,
      details,
    });
  if (changes.settings && !equal(changes.settings, visible.settings)) {
    deny(own(actor));
    if (
      typeof changes.settings !== "object" ||
      Array.isArray(changes.settings) ||
      typeof changes.settings.name !== "string" ||
      !changes.settings.name.trim() ||
      !changes.settings.sheetsConfig ||
      typeof changes.settings.sheetsConfig !== "object"
    )
      bad("Cài đặt trung tâm không hợp lệ.");
    data.settings = copy(changes.settings) as any;
    log("SỬA", "Cài đặt", "Cập nhật cài đặt trung tâm.");
  }
  for (const [key, patch] of Object.entries(changes.collections || {})) {
    if (!(CENTER_COLLECTIONS as readonly string[]).includes(key))
      bad("Phân hệ không hợp lệ.");
    const name = key as CenterCollection;
    if (
      !patch ||
      !Array.isArray(patch.upsert) ||
      !Array.isArray(patch.remove) ||
      patch.upsert.length + patch.remove.length > 3000
    )
      bad("Gói cập nhật không hợp lệ hoặc quá lớn.");
    const rows = new Map<string, any>(
      (data[name] as any[]).map((row) => [row.id, row]),
    );
    for (const id of patch.remove) {
      const deletedStudentGrade =
        name === "grades" &&
        changes.collections?.students?.remove.includes(
          rows.get(id)?.studentId,
        ) &&
        mayChange(actor, p, "students", "delete");
      deny(Boolean(deletedStudentGrade) || mayChange(actor, p, name, "delete"));
      if (!rows.has(id)) bad("Hồ sơ cần xóa không còn tồn tại.");
      const removed = rows.get(id);
      rows.delete(id);
      touched.add(name);
      const moduleLabel = MODULE_LABELS[name] || name;
      log("XÓA", moduleLabel, `Xóa ${moduleLabel.toLowerCase()} ${removed.code || removed.name || id}.`);
    }
    for (const record of patch.upsert) {
      if (
        !record ||
        typeof record.id !== "string" ||
        !record.id ||
        record.id.length > 150
      )
        bad("ID cập nhật không hợp lệ.");
      const original = rows.get(record.id),
        operation = original ? "edit" : "add";
      const allowed = fields[name];
      for (const field of Object.keys(record))
        if (field !== "id" && !allowed.includes(field))
          bad("Có trường dữ liệu không được phép cập nhật.");
      for (const [field, value] of Object.entries(record)) {
        if (typeof value === "string" && value.length > 10_000)
          bad("Nội dung trường dữ liệu quá dài.");
        if (
          value !== null &&
          typeof value === "object" &&
          !["extraClassIds", "days"].includes(field)
        )
          bad("Kiểu dữ liệu trường cập nhật không hợp lệ.");
      }
      if (Object.keys(record).length === 1) continue;
      deny(mayChange(actor, p, name, operation));
      const value = {
        ...(name === "students" ? emptyStudent : {}),
        ...original,
        ...copy(record),
      };
      if (
        name === "students" &&
        original &&
        value.classId !== original.classId
      ) {
        data.grades = data.grades.map((grade) =>
          grade.studentId === record.id && !grade.classId
            ? { ...grade, classId: original.classId }
            : grade,
        );
      }
      if (name === "programs" && !own(actor) && value.tuitionFee !== 0)
        deny(false);
      if (name === "receipts")
        value.collectorName = original?.collectorName || actor.full_name;
      rows.set(record.id, value);
      touched.add(name);
      const changed = Object.keys(record).filter(
        (field) => field !== "id" && !equal(original?.[field], record[field]),
      );
      const moduleLabel = MODULE_LABELS[name] || name;
      let logDetail = "";
      if (!original) {
        if (name === "receipts") {
          const amountStr = value.paidAmount ? ` - Số tiền: ${Number(value.paidAmount).toLocaleString("vi-VN")} đ` : "";
          logDetail = `Lập phiếu thu mới ${value.code || record.id}${amountStr}`;
        } else if (name === "students") {
          logDetail = `Thêm mới học sinh ${value.name ? `${value.name} ` : ""}(${value.code || record.id})`;
        } else if (name === "classes") {
          logDetail = `Tạo lớp học mới ${value.name ? `${value.name} ` : ""}(${value.code || record.id})`;
        } else if (name === "teachers") {
          logDetail = `Thêm giáo viên mới ${value.name || record.id}`;
        } else if (name === "rooms") {
          logDetail = `Thêm phòng học mới ${value.name || record.id}`;
        } else if (name === "programs") {
          logDetail = `Tạo chương trình học mới ${value.name || value.code || record.id}`;
        } else if (name === "timetableSlots") {
          logDetail = `Thêm ca học mới vào thời khóa biểu`;
        } else if (name === "grades") {
          logDetail = `Cập nhật điểm học sinh`;
        } else {
          logDetail = `Thêm mới ${moduleLabel.toLowerCase()} ${value.name || value.code || record.id}`;
        }
      } else {
        const changedLabels = changed.map((f) => FIELD_LABELS[f] || f);
        const changeStr = changedLabels.length > 0 ? ` (thay đổi: ${changedLabels.join(", ")})` : "";
        if (name === "receipts") {
          logDetail = `Cập nhật phiếu thu ${value.code || record.id}${changeStr}`;
        } else if (name === "students") {
          logDetail = `Cập nhật thông tin học sinh ${value.name ? `${value.name} ` : ""}(${value.code || record.id})${changeStr}`;
        } else if (name === "classes") {
          logDetail = `Cập nhật thông tin lớp học ${value.name || value.code || record.id}${changeStr}`;
        } else {
          logDetail = `Cập nhật ${moduleLabel.toLowerCase()} ${value.name || value.code || record.id}${changeStr}`;
        }
      }

      log(
        original ? "SỬA" : "THÊM",
        moduleLabel,
        logDetail,
      );
    }
    (data as any)[name] = [...rows.values()];
  }
  if (touched.has("students"))
    data.grades = data.grades.filter((grade) =>
      data.students.some((student) => student.id === grade.studentId),
    );
  validate(data, touched, input);
  const result = canonicalCenter(data);
  for (const event of changes.events || []) {
    if (
      !event ||
      typeof event.id !== "string" ||
      typeof event.module !== "string" ||
      typeof event.details !== "string"
    )
      bad("Nhật ký thao tác không hợp lệ.");
    if (event.action === "ĐĂNG NHẬP")
      log("ĐĂNG NHẬP", "Xác thực", "Đăng nhập vào hệ thống quản lý trung tâm.");
    if (event.action === "EXPORT") {
      deny(canExportCenter({ role: actor.role, permissions: p }));
      log("EXPORT", "Excel", "Yêu cầu xuất báo cáo Excel.");
    }
    if (event.action === "BACKUP") {
      deny(own(actor));
      log("BACKUP", "Sao lưu", "Yêu cầu xuất bản sao lưu dữ liệu trung tâm.");
    }
  }
  result.activityLogs = [
    ...logs.reverse(),
    ...(input.activityLogs || []),
  ].slice(0, 500);
  return { payload: result, logs: result.activityLogs };
}
