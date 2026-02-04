This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
# kravy-pos-website




generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mongodb"
  url      = env("DATABASE_URL")
}

//////////////////////////////////////////////////
// ENUMS
//////////////////////////////////////////////////

enum Role {
  USER
  ADMIN
  SELLER
}

enum FieldType {
  INPUT
  SELECT
  CHECKBOX
  RADIO
  FILE
}

//////////////////////////////////////////////////
// CATEGORY
//////////////////////////////////////////////////

model Category {
  id      String  @id @default(auto()) @map("_id") @db.ObjectId
  name    String
  clerkId String?

  parentId String?    @db.ObjectId
  parent   Category?  @relation("Subcategories", fields: [parentId], references: [id], onDelete: NoAction, onUpdate: NoAction)
  children Category[] @relation("Subcategories")

  items     Item[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

//////////////////////////////////////////////////
model Item {
  id           String  @id @default(auto()) @map("_id") @db.ObjectId
  name         String
  description  String?
  price        Float?
  sellingPrice Float?
  gst          Float?
  unit         String?
  barcode      String?
  imageUrl     String?
  image        String?   // ✅ THIS MUST EXIST

  categoryId String?   @db.ObjectId
  category   Category? @relation(fields: [categoryId], references: [id])

  clerkId String
  userId  String @db.ObjectId

  isActive     Boolean  @default(true)

  user    User   @relation(fields: [userId], references: [id])

  purchases Purchase[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

//////////////////////////////////////////////////
// PARTY (CUSTOMER)
//////////////////////////////////////////////////

model Party {
  id        String    @id @default(auto()) @map("_id") @db.ObjectId
  name      String
  phone     String    @unique
  address   String?
  dob       DateTime?
  createdBy String
  user      User?     @relation(fields: [createdBy], references: [clerkId])
  bills     Bill[]
  createdAt DateTime  @default(now())
}

//////////////////////////////////////////////////
// BILL HISTORY
//////////////////////////////////////////////////

model BillHistory {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  billId    String   @db.ObjectId
  bill      Bill     @relation(fields: [billId], references: [id])
  action    String
  snapshot  Json
  createdAt DateTime @default(now())
}

//////////////////////////////////////////////////
// PAYMENT
//////////////////////////////////////////////////

model Payment {
  id     String   @id @default(auto()) @map("_id") @db.ObjectId
  billId String   @db.ObjectId
  bill   Bill     @relation(fields: [billId], references: [id])
  amount Float
  mode   String
  txnRef String?
  paidAt DateTime @default(now())
}

//////////////////////////////////////////////////
// USER
//////////////////////////////////////////////////

model User {
  id      String @id @default(auto()) @map("_id") @db.ObjectId
  name    String
  email   String @unique
  clerkId String @unique
  role    Role   @default(USER)

  items    Item[]
  bills    Bill[]
  parties  Party[]
  forms    Form[]
  profiles BusinessProfile[]
  uploads  Upload[]

  isDisabled Boolean @default(false)

  createdAt DateTime   @default(now())
  purchases Purchase[]

  activities ActivityLog[]
}

//////////////////////////////////////////////////
// FORM BUILDER
//////////////////////////////////////////////////

model Form {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  title     String
  fields    Field[]
  userId    String
  user      User     @relation(fields: [userId], references: [clerkId])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Field {
  id        String    @id @default(auto()) @map("_id") @db.ObjectId
  formId    String    @db.ObjectId
  form      Form      @relation(fields: [formId], references: [id])
  label     String
  type      FieldType
  required  Boolean   @default(false)
  options   String[]
  value     String?
  createdAt DateTime  @default(now())
}

//////////////////////////////////////////////////
// BUSINESS PROFILE
//////////////////////////////////////////////////

model BusinessProfile {
  id     String @id @default(auto()) @map("_id") @db.ObjectId

  userId String @unique
  user   User   @relation(fields: [userId], references: [clerkId])

  businessType       String?
  businessName       String?
  businessTagLine    String?

  contactPersonName  String?
  contactPersonPhone String?
  contactPersonEmail String?

  upi                String?

  profileImageUrl    String?
  logoUrl            String?
  signatureUrl       String?

  gstNumber          String?
  businessAddress    String?
  state              String?
  district           String?
  pinCode            String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

//////////////////////////////////////////////////
// UPLOAD
//////////////////////////////////////////////////

model Upload {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  imageUrl  String
  userId    String
  user      User     @relation(fields: [userId], references: [clerkId])
  createdAt DateTime @default(now())
}

//////////////////////////////////////////////////
// Purchase
//////////////////////////////////////////////////

model Purchase {
  id     String @id @default(auto()) @map("_id") @db.ObjectId
  userId String
  user   User   @relation(fields: [userId], references: [clerkId])

  itemId String @db.ObjectId
  item   Item   @relation(fields: [itemId], references: [id])

  quantity Float
  price    Float
  total    Float

  createdAt DateTime @default(now())
}

//////////////////////////////////////////////////
// ActivityLog
//////////////////////////////////////////////////

model ActivityLog {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  userId    String   @db.ObjectId
  action    String
  meta      String?
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id])
}


//////////////////////////////////////////////////
// BillManager
//////////////////////////////////////////////////

model BillManager {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId

  clerkUserId   String
  billNumber    String   @unique
  createdAt     DateTime @default(now())

  items         Json

  subtotal      Float
  tax           Float?
  total         Float

  paymentMode   String
  paymentStatus String
  upiTxnRef     String?
  isHeld        Boolean  @default(false)
  customerName  String?
  customerPhone String?

  isDeleted       Boolean  @default(false)
  deletedAt       DateTime?
  deletedSnapshot Json?
}
