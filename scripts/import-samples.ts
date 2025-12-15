// scripts/import-samples.ts
import fs from "fs/promises";
import path from "path";
import prisma from "@/lib/prisma";

type ItemSample = {
  id?: string;
  name: string;
  description?: string;
  price?: number;
  mrp?: number;
  purchasePrice?: number;
  sellingPrice?: number;
  gst?: number;
  discount?: number;
  openingStock?: number;
  currentStock?: number;
  reorderLevel?: number;
  unit?: string;
  barcode?: string;
  brand?: string;
  model?: string;
  size?: string;
  color?: string;
  variants?: any;
  imageUrl?: string;
  gallery?: string[];
  categoryId?: string;
  clerkId?: string;
  userId?: string;
};

type PartySample = {
  id?: string;
  name: string;
  phone: string;
  address?: string;
  dob?: string;
  createdBy?: string; // clerkId
};

type ProductLine = {
  productId: string;
  quantity: number;
  price: number;
  discount?: number | null;
  gst?: number | null;
  total: number;
};

type BillSample = {
  id?: string;
  userClerkId: string;
  customerId?: string; // Party id
  products: ProductLine[];
  total: number;
  discount?: number;
  gst?: number;
  grandTotal?: number;
  paymentMode?: string;
  paymentStatus?: string;
  notes?: string;
  dueDate?: string; // ISO
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  contactPerson?: string;
  logoUrl?: string;
  signatureUrl?: string;
  websiteUrl?: string;
};

async function readJson<T>(name: string): Promise<T | null> {
  const file = path.join(process.cwd(), name);
  try {
    const raw = await fs.readFile(file, "utf8");
    return JSON.parse(raw) as T;
  } catch (e) {
    console.warn(`File not found or invalid JSON: ${name} — skipping.`);
    return null;
  }
}

async function ensureProductFromItem(itemId: string) {
  // Try find Product by id
  const prod = await prisma.product.findUnique({ where: { id: itemId } }).catch(() => null);
  if (prod) return prod;

  // If not found, try find Item and create Product copy
  const item = await prisma.item.findUnique({ where: { id: itemId } }).catch(() => null);
  if (!item) return null;

  return prisma.product.create({
    data: {
      id: item.id, // reuse same id so existing productId references keep working
      name: item.name,
      price: item.sellingPrice ?? item.price ?? 0,
    },
  });
}

export async function main() {
  // 1) Items
  const items = (await readJson<ItemSample[]>("items_sample.json")) || [];
  for (const it of items) {
    try {
      // if id provided, upsert by id
      if (it.id) {
        await prisma.item.upsert({
          where: { id: it.id },
          update: {
            name: it.name,
            description: it.description ?? null,
            price: it.price ?? null,
            mrp: it.mrp ?? null,
            purchasePrice: it.purchasePrice ?? null,
            sellingPrice: it.sellingPrice ?? null,
            gst: it.gst ?? null,
            discount: it.discount ?? null,
            openingStock: it.openingStock ?? null,
            currentStock: it.currentStock ?? it.openingStock ?? null,
            reorderLevel: it.reorderLevel ?? null,
            unit: it.unit ?? null,
            barcode: it.barcode ?? null,
            brand: it.brand ?? null,
            model: it.model ?? null,
            size: it.size ?? null,
            color: it.color ?? null,
            variants: it.variants ?? null,
            imageUrl: it.imageUrl ?? null,
            gallery: Array.isArray(it.gallery) ? it.gallery : [],
            clerkId: it.clerkId ?? undefined,
            userId: it.userId ?? "",
            categoryId: it.categoryId ?? null,
          },
          create: {
            id: it.id,
            name: it.name,
            description: it.description ?? null,
            price: it.price ?? null,
            mrp: it.mrp ?? null,
            purchasePrice: it.purchasePrice ?? null,
            sellingPrice: it.sellingPrice ?? null,
            gst: it.gst ?? null,
            discount: it.discount ?? null,
            openingStock: it.openingStock ?? null,
            currentStock: it.currentStock ?? it.openingStock ?? null,
            reorderLevel: it.reorderLevel ?? null,
            unit: it.unit ?? null,
            barcode: it.barcode ?? null,
            brand: it.brand ?? null,
            model: it.model ?? null,
            size: it.size ?? null,
            color: it.color ?? null,
            variants: it.variants ?? null,
            imageUrl: it.imageUrl ?? null,
            gallery: Array.isArray(it.gallery) ? it.gallery : [],
            categoryId: it.categoryId ?? null,
            clerkId: it.clerkId ?? "",
            userId: it.userId ?? "",
          },
        });
      } else {
        await prisma.item.create({
          data: {
            name: it.name,
            description: it.description ?? null,
            price: it.price ?? null,
            mrp: it.mrp ?? null,
            purchasePrice: it.purchasePrice ?? null,
            sellingPrice: it.sellingPrice ?? null,
            gst: it.gst ?? null,
            discount: it.discount ?? null,
            openingStock: it.openingStock ?? null,
            currentStock: it.currentStock ?? it.openingStock ?? null,
            reorderLevel: it.reorderLevel ?? null,
            unit: it.unit ?? null,
            barcode: it.barcode ?? null,
            brand: it.brand ?? null,
            model: it.model ?? null,
            size: it.size ?? null,
            color: it.color ?? null,
            variants: it.variants ?? null,
            imageUrl: it.imageUrl ?? null,
            gallery: Array.isArray(it.gallery) ? it.gallery : [],
            categoryId: it.categoryId ?? null,
            clerkId: it.clerkId ?? "",
            userId: it.userId ?? "",
          },
        });
      }
    } catch (e: any) {
      console.error("Failed to upsert item", it.name, e.message || e);
    }
  }

  // 2) Parties
  const parties = (await readJson<PartySample[]>("parties_sample.json")) || [];
  for (const p of parties) {
    try {
      await prisma.party.upsert({
        where: { phone: p.phone },
        update: {
          name: p.name,
          address: p.address ?? null,
          dob: p.dob ? new Date(p.dob) : null,
          createdBy: p.createdBy ?? "",
        },
        create: {
          name: p.name,
          phone: p.phone,
          address: p.address ?? null,
          dob: p.dob ? new Date(p.dob) : null,
          createdBy: p.createdBy ?? "",
        },
      });
    } catch (e: any) {
      console.error("Failed to upsert party", p.phone, e.message || e);
    }
  }

  // 3) Bills
  const bills = (await readJson<BillSample[]>("bills_sample.json")) || [];
  for (const b of bills) {
    try {
      // Resolve user by clerkId
      const dbUser = await prisma.user.findUnique({ where: { clerkId: b.userClerkId } });
      if (!dbUser) {
        console.warn(`User not found for clerkId=${b.userClerkId}. Skipping bill.`);
        continue;
      }

      // Resolve / ensure Product rows
      const billProductsData = [];
      for (const pl of b.products) {
        // Prefer existing Product
        let prod = await prisma.product.findUnique({ where: { id: pl.productId } }).catch(() => null);
        if (!prod) {
          // try item fallback
          prod = await ensureProductFromItem(pl.productId);
        }
        // If still not found, create a minimal product record (id will be autogenerated)
        if (!prod) {
          const newProd = await prisma.product.create({
            data: { name: pl.productId, price: pl.price ?? 0 },
          });
          prod = newProd;
        }

        billProductsData.push({
          productId: prod.id,
          productName: pl.productId, // we'll overwrite with product.name below if needed
          quantity: pl.quantity,
          price: pl.price,
          discount: pl.discount ?? null,
          gst: pl.gst ?? null,
          total: pl.total ?? (pl.price * pl.quantity),
        });
      }

      // Create bill inside transaction to keep atomic
      const createdBill = await prisma.$transaction(async (tx) => {
        const newBill = await tx.bill.create({
          data: {
            userId: dbUser.id,
            customerId: b.customerId ?? undefined,
            total: b.total,
            discount: b.discount ?? null,
            gst: b.gst ?? null,
            grandTotal: b.grandTotal ?? null,
            paymentMode: b.paymentMode ?? null,
            paymentStatus: b.paymentStatus ?? null,
            notes: b.notes ?? null,
            dueDate: b.dueDate ? new Date(b.dueDate) : null,
            companyName: b.companyName ?? null,
            companyAddress: b.companyAddress ?? null,
            companyPhone: b.companyPhone ?? null,
            contactPerson: b.contactPerson ?? null,
            logoUrl: b.logoUrl ?? null,
            signatureUrl: b.signatureUrl ?? null,
            websiteUrl: b.websiteUrl ?? null,
            products: {
              create: billProductsData.map((bp) => ({
                productId: bp.productId,
                productName: bp.productName,
                quantity: bp.quantity,
                price: bp.price,
                discount: bp.discount,
                gst: bp.gst,
                total: bp.total,
              })),
            },
            history: {
              create: {
                snapshot: b as any,
              },
            },
          },
          include: { products: true, history: true },
        });

        return newBill;
      });

      console.log("Created bill:", createdBill.id);
    } catch (e: any) {
      console.error("Failed to create bill:", e.message || e);
    }
  }

  console.log("Import finished.");
}

if (require.main === module) {
  main()
    .catch((e) => {
      console.error("Fatal error:", e);
    })
    .finally(() => prisma.$disconnect());
}
