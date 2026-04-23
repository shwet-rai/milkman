import { connectToDatabase } from "@/lib/db/connect";
import type { CalendarStatus } from "@/lib/calendar";
import { Area } from "@/models/area";
import { CustomerProfile } from "@/models/customer-profile";
import { Delivery } from "@/models/delivery";
import { MilkPlan } from "@/models/milk-plan";
import { Payment } from "@/models/payment";
import { Product } from "@/models/product";
import { PurchaseEntry } from "@/models/purchase-entry";
import { User } from "@/models/user";
import { Vendor } from "@/models/vendor";

type PlainArea = {
  _id: string;
  code: string;
  name: string;
  isActive?: boolean;
  sortOrder?: number;
};

type PlainUser = {
  _id: string;
  name: string;
  phone: string;
  preferredLanguage?: string;
  status?: string;
};

type PlainCustomerProfile = {
  _id: string;
  userId: string;
  customerCode: string;
  addressLine1: string;
  addressLine2?: string;
  areaCode: string;
  areaName: string;
  landmark?: string;
  notes?: string;
  isActive?: boolean;
};

type PlainMilkPlan = {
  _id: string;
  customerId: string;
  quantityLiters: number;
  pricePerLiter: number;
  unitLabel?: string;
  isActive?: boolean;
  startDate: Date | string;
  endDate?: Date | string;
};

type DeliveryItem = {
  productCode?: string;
  productName?: string;
  category?: string;
  unit?: string;
  quantity?: number;
  rate?: number;
  totalAmount?: number;
};

type PlainDelivery = {
  _id: string;
  customerId: string;
  date: Date | string;
  quantityDelivered?: number;
  baseQuantity?: number;
  extraQuantity?: number;
  finalQuantity?: number;
  pricePerLiter?: number;
  status: "DELIVERED" | "SKIPPED" | "PAUSED";
  note?: string;
  items?: DeliveryItem[];
};

type PlainPayment = {
  _id: string;
  customerId: string;
  amount: number;
  date: Date | string;
  mode: string;
  note?: string;
};

type PlainProduct = {
  _id: string;
  code: string;
  name: string;
  category: "MILK" | "DAIRY_ADDON" | "OTHER";
  unit: string;
  defaultRate: number;
  isActive?: boolean;
  sortOrder?: number;
};

type PlainVendor = {
  _id: string;
  code: string;
  name: string;
  phone?: string;
  areaCode?: string;
  areaName?: string;
  notes?: string;
  isActive?: boolean;
  sortOrder?: number;
};

type PlainPurchase = {
  _id: string;
  vendorId: string;
  vendorCode: string;
  vendorName: string;
  productId: string;
  productCode: string;
  productName: string;
  productCategory: "MILK" | "DAIRY_ADDON" | "OTHER";
  unit: string;
  quantity: number;
  rate: number;
  totalAmount: number;
  date: Date | string;
  paymentStatus: "UNPAID" | "PARTIAL" | "PAID";
  note?: string;
};

function toDate(value?: Date | string | null) {
  return value ? new Date(value) : null;
}

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatDateLabel(value: Date | string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function mapById<T extends { _id: string }>(items: T[]) {
  return new Map(items.map((item) => [String(item._id), item]));
}

async function getReferenceDate() {
  await connectToDatabase();

  const [latestDelivery, latestPayment, latestPurchase] = await Promise.all([
    Delivery.findOne().sort({ date: -1 }).lean<PlainDelivery | null>(),
    Payment.findOne().sort({ date: -1 }).lean<PlainPayment | null>(),
    PurchaseEntry.findOne().sort({ date: -1 }).lean<PlainPurchase | null>(),
  ]);

  const candidateDates = [latestDelivery?.date, latestPayment?.date, latestPurchase?.date]
    .map((value) => toDate(value))
    .filter((value): value is Date => Boolean(value));

  if (!candidateDates.length) {
    return new Date();
  }

  return candidateDates.sort((left, right) => right.getTime() - left.getTime())[0];
}

async function getBaseData() {
  await connectToDatabase();
  const referenceDate = await getReferenceDate();
  const monthStart = startOfMonth(referenceDate);
  const monthEnd = endOfMonth(referenceDate);
  const todayStart = startOfDay(referenceDate);
  const todayEnd = endOfDay(referenceDate);

  const [areas, profiles, users, plans, deliveriesMonth, deliveriesToday, paymentsMonth, products, vendors, purchasesMonth] =
    await Promise.all([
      Area.find().sort({ sortOrder: 1, name: 1 }).lean<PlainArea[]>(),
      CustomerProfile.find().sort({ customerCode: 1 }).lean<PlainCustomerProfile[]>(),
      User.find().lean<PlainUser[]>(),
      MilkPlan.find({ isActive: true }).sort({ startDate: -1 }).lean<PlainMilkPlan[]>(),
      Delivery.find({ date: { $gte: monthStart, $lte: monthEnd } }).sort({ date: -1 }).lean<PlainDelivery[]>(),
      Delivery.find({ date: { $gte: todayStart, $lte: todayEnd } }).lean<PlainDelivery[]>(),
      Payment.find({ date: { $gte: monthStart, $lte: monthEnd } }).sort({ date: -1 }).lean<PlainPayment[]>(),
      Product.find().sort({ sortOrder: 1, name: 1 }).lean<PlainProduct[]>(),
      Vendor.find().sort({ sortOrder: 1, name: 1 }).lean<PlainVendor[]>(),
      PurchaseEntry.find({ date: { $gte: monthStart, $lte: monthEnd } })
        .sort({ date: -1 })
        .lean<PlainPurchase[]>(),
    ]);

  return {
    referenceDate,
    monthStart,
    monthEnd,
    todayStart,
    todayEnd,
    areas,
    profiles,
    users,
    plans,
    deliveriesMonth,
    deliveriesToday,
    paymentsMonth,
    products,
    vendors,
    purchasesMonth,
  };
}

function buildCustomerEntities(base: Awaited<ReturnType<typeof getBaseData>>) {
  const userMap = mapById(base.users);
  const plansByCustomer = new Map<string, PlainMilkPlan>();

  for (const plan of base.plans) {
    const key = String(plan.customerId);
    if (!plansByCustomer.has(key)) {
      plansByCustomer.set(key, plan);
    }
  }

  return base.profiles.map((profile) => {
    const user = userMap.get(String(profile.userId));
    const activePlan = plansByCustomer.get(String(profile._id));
    const monthDeliveries = base.deliveriesMonth.filter(
      (delivery) => String(delivery.customerId) === String(profile._id),
    );
    const todayDelivery =
      base.deliveriesToday.find((delivery) => String(delivery.customerId) === String(profile._id)) ||
      null;
    const payments = base.paymentsMonth.filter(
      (payment) => String(payment.customerId) === String(profile._id),
    );

    const milkAmount = monthDeliveries.reduce((total, delivery) => {
      if (delivery.status !== "DELIVERED") {
        return total;
      }

      const liters =
        delivery.finalQuantity ?? delivery.quantityDelivered ?? delivery.baseQuantity ?? 0;
      const rate = delivery.pricePerLiter ?? activePlan?.pricePerLiter ?? 0;

      return total + liters * rate;
    }, 0);

    const addonAmount = monthDeliveries.reduce((total, delivery) => {
      return (
        total +
        (delivery.items || []).reduce(
          (itemTotal, item) => itemTotal + (item.totalAmount ?? 0),
          0,
        )
      );
    }, 0);

    const paidAmount = payments.reduce((total, payment) => total + payment.amount, 0);
    const totalAmount = milkAmount + addonAmount;
    const dueAmount = Math.max(totalAmount - paidAmount, 0);
    const deliveredDays = monthDeliveries.filter((entry) => entry.status === "DELIVERED").length;

    return {
      profile,
      user,
      activePlan,
      monthDeliveries,
      todayDelivery,
      payments,
      totals: {
        milkAmount,
        addonAmount,
        totalAmount,
        paidAmount,
        dueAmount,
        deliveredDays,
        monthlyLiters: monthDeliveries.reduce(
          (total, delivery) =>
            total +
            (delivery.status === "DELIVERED"
              ? delivery.finalQuantity ?? delivery.quantityDelivered ?? 0
              : 0),
          0,
        ),
      },
    };
  });
}

export async function getCustomerListData() {
  const base = await getBaseData();
  const customerEntities = buildCustomerEntities(base);

  return customerEntities.map((entry) => ({
    customerCode: entry.profile.customerCode,
    name: entry.user?.name || entry.profile.customerCode,
    phone: entry.user?.phone || "",
    areaCode: entry.profile.areaCode,
    areaName: entry.profile.areaName,
    address: [entry.profile.addressLine1, entry.profile.addressLine2, entry.profile.landmark]
      .filter(Boolean)
      .join(", "),
    quantityLabel: `${(entry.activePlan?.quantityLiters || 0).toFixed(1)} ${entry.activePlan?.unitLabel || "L"}`,
    quantity: entry.activePlan?.quantityLiters || 0,
    rate: entry.activePlan?.pricePerLiter || 0,
    due: entry.totals.dueAmount,
    billed: entry.totals.totalAmount,
    paid: entry.totals.paidAmount,
    notes: entry.profile.notes || "",
    deliverySlot: "Morning",
    status:
      entry.profile.isActive === false || entry.user?.status === "INACTIVE"
        ? "INACTIVE"
        : entry.todayDelivery?.status === "PAUSED"
          ? "PAUSED"
          : "ACTIVE",
  }));
}

export async function getCustomerDetailData(customerCode: string) {
  const customers = await getCustomerListData();
  const customer = customers.find((entry) => entry.customerCode === customerCode);

  if (!customer) {
    return null;
  }

  const base = await getBaseData();
  const entity = buildCustomerEntities(base).find(
    (entry) => entry.profile.customerCode === customerCode,
  );

  if (!entity) {
    return null;
  }

  return {
    ...customer,
    preferredLanguage: entity.user?.preferredLanguage || "en",
    addressLine1: entity.profile.addressLine1,
    addressLine2: entity.profile.addressLine2 || "",
    landmark: entity.profile.landmark || "",
    recentDeliveries: entity.monthDeliveries.slice(0, 10).map((delivery) => ({
      dateLabel: formatDateLabel(delivery.date),
      status: delivery.status,
      finalQuantity: delivery.finalQuantity ?? delivery.quantityDelivered ?? 0,
      extraQuantity: delivery.extraQuantity ?? 0,
      addOnItems: delivery.items || [],
      note: delivery.note || "",
    })),
  };
}

export async function getDefaultCustomerCode() {
  const customers = await getCustomerListData();
  return customers[0]?.customerCode || null;
}

export async function getDashboardData() {
  const base = await getBaseData();
  const entities = buildCustomerEntities(base);

  const activeCustomers = entities.filter(
    (entry) => entry.profile.isActive !== false && entry.user?.status !== "INACTIVE",
  ).length;
  const todayDelivered = base.deliveriesToday.filter((entry) => entry.status === "DELIVERED").length;
  const todayPending = Math.max(activeCustomers - todayDelivered, 0);
  const monthlySales = entities.reduce((total, entry) => total + entry.totals.totalAmount, 0);
  const monthlyDue = entities.reduce((total, entry) => total + entry.totals.dueAmount, 0);

  const routeSnapshot = base.areas.map((area) => {
    const areaCustomers = entities.filter((entry) => entry.profile.areaCode === area.code);
    const delivered = areaCustomers.filter(
      (entry) => entry.todayDelivery?.status === "DELIVERED",
    ).length;

    return {
      areaCode: area.code,
      areaName: area.name,
      customerCount: areaCustomers.length,
      deliveredCount: delivered,
      liters: areaCustomers.reduce(
        (total, entry) =>
          total +
          (entry.todayDelivery?.status === "DELIVERED"
            ? entry.todayDelivery.finalQuantity ??
            entry.todayDelivery.quantityDelivered ??
            entry.activePlan?.quantityLiters ??
            0
            : 0),
        0,
      ),
    };
  });

  const attentionCustomers = entities
    .filter((entry) => entry.totals.dueAmount > 0 || entry.todayDelivery?.status !== "DELIVERED")
    .slice(0, 6)
    .map((entry) => ({
      customerCode: entry.profile.customerCode,
      name: entry.user?.name || entry.profile.customerCode,
      info: `${(entry.activePlan?.quantityLiters || 0).toFixed(1)} L • ${entry.profile.areaName}`,
      issue:
        entry.totals.dueAmount > 0
          ? "Payment overdue"
          : entry.todayDelivery?.status === "PAUSED"
            ? "Delivery paused"
            : "Delivery pending",
      tone:
        entry.totals.dueAmount > 0
          ? "danger"
          : entry.todayDelivery?.status === "PAUSED"
            ? "warning"
            : "blue",
    }));

  return {
    referenceDate: base.referenceDate,
    kpis: {
      activeCustomers,
      todayDelivered,
      todayPending,
      monthlySales,
      monthlyDue,
    },
    routeSnapshot,
    attentionCustomers,
  };
}

export async function getTodayDeliveriesData() {
  const base = await getBaseData();
  const entities = buildCustomerEntities(base);

  return entities.map((entry) => {
    const today = entry.todayDelivery;
    const planQuantity = entry.activePlan?.quantityLiters || 0;

    return {
      customerCode: entry.profile.customerCode,
      customerName: entry.user?.name || entry.profile.customerCode,
      quantityLabel: `${planQuantity.toFixed(1)} ${entry.activePlan?.unitLabel || "L"}`,
      status: today?.status || "PENDING",
      note: today?.note || entry.profile.notes || "",
      route: entry.profile.areaName,
      areaCode: entry.profile.areaCode,
      baseQuantity: today?.baseQuantity ?? planQuantity,
      extraQuantity: today?.extraQuantity ?? 0,
      finalQuantity: today?.finalQuantity ?? today?.quantityDelivered ?? planQuantity,
      productItems: today?.items || [],
    };
  });
}

export async function getBillingData() {
  const customers = await getCustomerListData();
  const base = await getBaseData();

  return {
    summary: {
      billedAmount: customers.reduce((total, customer) => total + customer.billed, 0),
      paidAmount: customers.reduce((total, customer) => total + customer.paid, 0),
      dueAmount: customers.reduce((total, customer) => total + customer.due, 0),
    },
    customers,
    recentPayments: base.paymentsMonth.slice(0, 12).map((payment) => {
      const customer = customers.find(
        (entry) => entry.customerCode ===
          base.profiles.find((profile) => String(profile._id) === String(payment.customerId))
            ?.customerCode,
      );

      return {
        id: String(payment._id),
        customerCode: customer?.customerCode || "",
        customerName: customer?.name || "Unknown",
        amount: payment.amount,
        mode: payment.mode,
        dateLabel: formatDateLabel(payment.date),
        note: payment.note || "",
      };
    }),
  };
}

export async function getAreaAnalyticsData() {
  const base = await getBaseData();
  const entities = buildCustomerEntities(base);

  return base.areas.map((area) => {
    const areaCustomers = entities.filter((entry) => entry.profile.areaCode === area.code);

    return {
      code: area.code,
      name: area.name,
      customerCount: areaCustomers.length,
      dailyConsumption: areaCustomers.reduce(
        (total, entry) =>
          total +
          (entry.todayDelivery?.status === "DELIVERED"
            ? entry.todayDelivery.finalQuantity ??
            entry.todayDelivery.quantityDelivered ??
            entry.activePlan?.quantityLiters ??
            0
            : 0),
        0,
      ),
      monthlyConsumption: areaCustomers.reduce(
        (total, entry) => total + entry.totals.monthlyLiters,
        0,
      ),
      monthlyBilled: areaCustomers.reduce((total, entry) => total + entry.totals.totalAmount, 0),
      dueAmount: areaCustomers.reduce((total, entry) => total + entry.totals.dueAmount, 0),
    };
  });
}

export async function getAreasData() {
  const base = await getBaseData();
  return base.areas;
}

export async function getAdminCalendarData() {
  const base = await getBaseData();
  const referenceMonthKey = monthKey(base.referenceDate);
  const daysInMonth = new Date(
    base.referenceDate.getFullYear(),
    base.referenceDate.getMonth() + 1,
    0,
  ).getDate();
  const leadingBlankSlots = new Date(
    base.referenceDate.getFullYear(),
    base.referenceDate.getMonth(),
    1,
  ).getDay();

  const dayRecords = Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1;
    const date = new Date(base.referenceDate.getFullYear(), base.referenceDate.getMonth(), day);
    const entries = base.deliveriesMonth.filter(
      (delivery) => toDate(delivery.date)?.toDateString() === date.toDateString(),
    );
    const deliveredCount = entries.filter((entry) => entry.status === "DELIVERED").length;
    const pausedCount = entries.filter((entry) => entry.status === "PAUSED").length;
    const skippedCount = entries.filter((entry) => entry.status === "SKIPPED").length;
    const liters = entries.reduce(
      (total, entry) =>
        total +
        (entry.status === "DELIVERED"
          ? entry.finalQuantity ?? entry.quantityDelivered ?? 0
          : 0),
      0,
    );

    return {
      dateKey: `${referenceMonthKey}-${String(day).padStart(2, "0")}`,
      dateLabel: formatDateLabel(date),
      dayOfMonth: day,
      weekdayLabel: new Intl.DateTimeFormat("en-IN", { weekday: "short" }).format(date),
      liters,
      status:
        deliveredCount > 0
          ? "DELIVERED"
          : pausedCount > 0
            ? "PAUSED"
            : "SKIPPED" as CalendarStatus,
      deliveredCount,
      pausedCount,
      skippedCount,
    };
  });

  const areaBreakdown = await getAreaAnalyticsData();
  const peakDay = [...dayRecords].sort((left, right) => right.liters - left.liters)[0];

  return {
    monthMeta: {
      monthLabel: new Intl.DateTimeFormat("en-IN", {
        month: "long",
        year: "numeric",
      }).format(base.referenceDate),
      leadingBlankSlots,
    },
    days: dayRecords,
    areaBreakdown,
    summary: {
      totalLiters: dayRecords.reduce((total, day) => total + day.liters, 0),
      activeCustomers: (await getCustomerListData()).filter((entry) => entry.status === "ACTIVE")
        .length,
      peakDay,
      totalRevenueEstimate: areaBreakdown.reduce(
        (total, area) => total + area.monthlyBilled,
        0,
      ),
    },
  };
}

export async function getCustomerCalendarData(customerCode?: string | null) {
  const base = await getBaseData();
  const customerId =
    customerCode || (await getDefaultCustomerCode()) || base.profiles[0]?.customerCode || "";
  const entity = buildCustomerEntities(base).find(
    (entry) => entry.profile.customerCode === customerId,
  );

  if (!entity) {
    return null;
  }

  const daysInMonth = new Date(
    base.referenceDate.getFullYear(),
    base.referenceDate.getMonth() + 1,
    0,
  ).getDate();
  const leadingBlankSlots = new Date(
    base.referenceDate.getFullYear(),
    base.referenceDate.getMonth(),
    1,
  ).getDay();

  const days = Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1;
    const date = new Date(base.referenceDate.getFullYear(), base.referenceDate.getMonth(), day);
    const entry =
      entity.monthDeliveries.find(
        (delivery) => toDate(delivery.date)?.toDateString() === date.toDateString(),
      ) || null;
    const liters =
      entry?.status === "DELIVERED"
        ? entry.finalQuantity ?? entry.quantityDelivered ?? entity.activePlan?.quantityLiters ?? 0
        : 0;

    return {
      dateKey: `${monthKey(base.referenceDate)}-${String(day).padStart(2, "0")}`,
      dateLabel: formatDateLabel(date),
      dayOfMonth: day,
      weekdayLabel: new Intl.DateTimeFormat("en-IN", { weekday: "short" }).format(date),
      liters,
      status: (entry?.status || "SKIPPED") as CalendarStatus,
      itemCount: entry?.items?.length || 0,
    };
  });

  return {
    customerCode: entity.profile.customerCode,
    customer: {
      name: entity.user?.name || entity.profile.customerCode,
      areaName: entity.profile.areaName,
      quantityLabel: `${(entity.activePlan?.quantityLiters || 0).toFixed(1)} ${entity.activePlan?.unitLabel || "L"}`,
      rate: entity.activePlan?.pricePerLiter || 0,
    },
    monthMeta: {
      monthLabel: new Intl.DateTimeFormat("en-IN", {
        month: "long",
        year: "numeric",
      }).format(base.referenceDate),
      leadingBlankSlots,
    },
    days,
    summary: {
      totalLiters: days.reduce((total, day) => total + day.liters, 0),
      deliveredDays: days.filter((day) => day.status === "DELIVERED").length,
      skippedDays: days.filter((day) => day.status === "SKIPPED").length,
      pausedDays: days.filter((day) => day.status === "PAUSED").length,
      estimatedBill: entity.totals.totalAmount,
    },
  };
}

export async function getCustomerHistoryData(customerCode?: string | null) {
  const detail = await getCustomerDetailData(
    customerCode || (await getDefaultCustomerCode()) || "",
  );

  return detail?.recentDeliveries || [];
}

export async function getCustomerProfileData(customerCode?: string | null) {
  const detail = await getCustomerDetailData(
    customerCode || (await getDefaultCustomerCode()) || "",
  );

  if (!detail) {
    return null;
  }

  return {
    name: detail.name,
    phone: detail.phone,
    address: detail.address,
    preferredLanguage: detail.preferredLanguage,
    areaCode: detail.areaCode,
    areaName: detail.areaName,
  };
}

export async function getReportsData() {
  const areaAnalytics = await getAreaAnalyticsData();
  const billing = await getBillingData();
  const purchases = await getPurchaseLedgerData();

  return {
    areaAnalytics,
    summary: {
      collectionRate:
        billing.summary.billedAmount > 0
          ? Math.round((billing.summary.paidAmount / billing.summary.billedAmount) * 100)
          : 0,
      purchaseTotal: purchases.summary.totalPurchaseAmount,
      topArea:
        [...areaAnalytics].sort((left, right) => right.monthlyConsumption - left.monthlyConsumption)[0] ||
        null,
    },
  };
}

export async function getProductsData() {
  const base = await getBaseData();
  return base.products.map(p => ({
    ...p,
    _id: String(p._id)
  }));
}

export async function getVendorsData() {
  const base = await getBaseData();
  return base.vendors.map((vendor) => {
    const entries = base.purchasesMonth.filter((entry) => entry.vendorCode === vendor.code);
    const totalPurchaseAmount = entries.reduce((total, entry) => total + entry.totalAmount, 0);
    const totalMilkInward = entries
      .filter((entry) => entry.productCategory === "MILK")
      .reduce((total, entry) => total + entry.quantity, 0);

    return {
      _id: String(vendor._id),
      code: vendor.code,
      name: vendor.name,
      phone: vendor.phone ?? "",
      areaCode: vendor.areaCode ?? "",
      areaName: vendor.areaName ?? "",
      notes: vendor.notes ?? "",
      isActive: vendor.isActive ?? true,
      sortOrder: vendor.sortOrder ?? 0,
      purchaseCount: entries.length,
      totalPurchaseAmount,
      totalMilkInward,
      unpaidEntries: entries.filter((entry) => entry.paymentStatus !== "PAID").length,
      recentPurchases: entries.slice(0, 6).map((entry) => ({
        id: String(entry._id),
        productName: entry.productName,
        productCode: entry.productCode,
        quantity: entry.quantity,
        unit: entry.unit,
        totalAmount: entry.totalAmount,
        paymentStatus: entry.paymentStatus,
        dateLabel: formatDateLabel(entry.date),
        note: entry.note || "",
      })),
    };
  });
}

export async function getPurchaseLedgerData() {
  const base = await getBaseData();
  return {
    entries: base.purchasesMonth.map((entry) => ({
      id: String(entry._id),
      vendorCode: entry.vendorCode,
      vendorName: entry.vendorName,
      productCode: entry.productCode,
      productName: entry.productName,
      productCategory: entry.productCategory,
      unit: entry.unit,
      quantity: entry.quantity,
      rate: entry.rate,
      totalAmount: entry.totalAmount,
      paymentStatus: entry.paymentStatus,
      dateLabel: formatDateLabel(entry.date),
      note: entry.note || "",
    })),
    summary: {
      totalPurchaseAmount: base.purchasesMonth.reduce(
        (total, entry) => total + entry.totalAmount,
        0,
      ),
      totalMilkInward: base.purchasesMonth
        .filter((entry) => entry.productCategory === "MILK")
        .reduce((total, entry) => total + entry.quantity, 0),
      unpaidEntries: base.purchasesMonth.filter((entry) => entry.paymentStatus !== "PAID").length,
    },
  };
}

export async function getDeliveryOperationOptions() {
  const [customers, products] = await Promise.all([getCustomerListData(), getProductsData()]);

  return {
    customers,
    products: products.filter((product) => product.isActive !== false),
  };
}
