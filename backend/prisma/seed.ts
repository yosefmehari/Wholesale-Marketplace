import {
  PrismaClient,
  UserRole,
  UserStatus,
  BusinessType,
  BusinessMemberRole,
  VerificationStatus,
  WholesaleUnit,
  ProductStatus,
} from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('❌ Refusing to run development seed in production environment!');
  }

  console.log('🌱 Starting WholesaleHub Ethiopia development database seed...');

  // 1. Platform Settings
  console.log('-> Seeding platform settings...');
  const settings = [
    { key: 'platform_name', value: 'WholesaleHub Ethiopia', description: 'Platform brand name', isPublic: true },
    { key: 'default_currency', value: 'ETB', description: 'Authoritative transaction currency', isPublic: true },
    { key: 'default_timezone', value: 'Africa/Addis_Ababa', description: 'Operational timezone', isPublic: true },
    { key: 'default_commission_rate', value: '0.05', description: 'Default platform commission (5%)', isPublic: false },
    { key: 'support_phone', value: '+251 11 661 2345', description: 'Support contact phone', isPublic: true },
    { key: 'support_email', value: 'support@wholesalehub.et', description: 'Support contact email', isPublic: true },
    { key: 'min_order_default_etb', value: '1000.00', description: 'Platform minimum order amount', isPublic: true },
  ];

  for (const s of settings) {
    await prisma.platformSetting.upsert({
      where: { key: s.key },
      update: { value: s.value, description: s.description, isPublic: s.isPublic },
      create: s,
    });
  }

  // 2. Categories
  console.log('-> Seeding product categories...');
  const initialCategories = [
    {
      name: 'Food & Beverages',
      slug: 'food-and-beverages',
      description: 'Grain, edible oil, coffee, tea, pulses, spices, and packaged food products.',
      icon: 'Utensils',
      sortOrder: 1,
    },
    {
      name: 'Clothing & Textiles',
      slug: 'clothing-and-textiles',
      description: 'Traditional Ethiopian apparel, industrial uniforms, cotton fabrics, and yarns.',
      icon: 'Shirt',
      sortOrder: 2,
    },
    {
      name: 'Electronics & Accessories',
      slug: 'electronics-and-accessories',
      description: 'Cables, smart accessories, commercial lighting, audio systems, and power equipment.',
      icon: 'Zap',
      sortOrder: 3,
    },
    {
      name: 'Computers & Office Equipment',
      slug: 'computers-and-office',
      description: 'Laptops, point of sale hardware, network routers, and office supplies.',
      icon: 'Laptop',
      sortOrder: 4,
    },
    {
      name: 'Home & Kitchen',
      slug: 'home-and-kitchen',
      description: 'Cookware, dinnerware, cleaning equipment, storage containers, and plastic ware.',
      icon: 'Home',
      sortOrder: 5,
    },
    {
      name: 'Construction Materials',
      slug: 'construction-materials',
      description: 'Cement, rebar, paints, ceramic tiles, plumbing pipes, and electrical conduit.',
      icon: 'Hammer',
      sortOrder: 6,
    },
    {
      name: 'Industrial Supplies',
      slug: 'industrial-supplies',
      description: 'Safety gear, mechanical lubricants, hardware fasteners, and warehouse equipment.',
      icon: 'Wrench',
      sortOrder: 7,
    },
    {
      name: 'Beauty & Personal Care',
      slug: 'beauty-and-personal-care',
      description: 'Soaps, lotions, hair care products, hygiene essentials, and cosmetic packaging.',
      icon: 'Sparkles',
      sortOrder: 8,
    },
    {
      name: 'Agriculture & Farming',
      slug: 'agriculture-and-farming',
      description: 'Seeds, organic fertilizers, irrigation equipment, and agrochemical supplies.',
      icon: 'Wheat',
      sortOrder: 9,
    },
    {
      name: 'Packaging & Cleaning Supplies',
      slug: 'packaging-and-cleaning',
      description: 'Corrugated cartons, woven polypropylene bags, detergents, and industrial disinfectants.',
      icon: 'Package',
      sortOrder: 10,
    },
  ];

  const categoryMap = new Map<string, string>();
  for (const cat of initialCategories) {
    const record = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, description: cat.description, icon: cat.icon, sortOrder: cat.sortOrder },
      create: cat,
    });
    categoryMap.set(cat.slug, record.id);
  }

  // 3. Commission Rules
  console.log('-> Seeding commission rules...');
  await prisma.commissionRule.upsert({
    where: { id: 'default-global-commission' },
    update: { percentage: 0.05, name: 'Default 5% Platform Commission' },
    create: {
      id: 'default-global-commission',
      name: 'Default 5% Platform Commission',
      percentage: 0.05,
      isActive: true,
    },
  });

  // 4. Seed Development Test Password
  const testPasswordHash = await bcrypt.hash('WholesaleHub2026!', 10);

  // 5. Test Users
  console.log('-> Seeding development test users...');

  // 5A. Admin User
  const adminUser = await prisma.user.upsert({
    where: { email: 'dev-admin@wholesalehub.et' },
    update: {},
    create: {
      email: 'dev-admin@wholesalehub.et',
      passwordHash: testPasswordHash,
      fullName: 'Abebe Kebede (Dev Admin)',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
      isPhoneVerified: true,
      phone: '+251911000001',
    },
  });

  // 5B. Verified Supplier User & Business
  const supplierUser = await prisma.user.upsert({
    where: { email: 'dev-supplier@wholesalehub.et' },
    update: {},
    create: {
      email: 'dev-supplier@wholesalehub.et',
      passwordHash: testPasswordHash,
      fullName: 'Tewodros Kassahun (Dev Supplier)',
      role: UserRole.SUPPLIER,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
      isPhoneVerified: true,
      phone: '+251911000002',
    },
  });

  const supplierBusiness = await prisma.business.upsert({
    where: { slug: 'abyssinia-agro-food-plc' },
    update: { isVerified: true },
    create: {
      name: 'Abyssinia Agro & Food Processing PLC',
      slug: 'abyssinia-agro-food-plc',
      businessType: BusinessType.MANUFACTURER,
      tinNumber: '0012345678',
      registrationNumber: 'AA/OR/01/2021',
      email: 'sales@abyssinia-agro.et',
      phone: '+251114345678',
      city: 'Addis Ababa',
      subCity: 'Akaki Kality',
      woreda: 'Woreda 04',
      addressLine: 'Industrial Zone, Building 14',
      isVerified: true,
      description: 'Premier Ethiopian coffee, grain, and edible oil agro-processor and manufacturer.',
    },
  });

  await prisma.businessMembership.upsert({
    where: {
      businessId_userId: {
        businessId: supplierBusiness.id,
        userId: supplierUser.id,
      },
    },
    update: {},
    create: {
      businessId: supplierBusiness.id,
      userId: supplierUser.id,
      role: BusinessMemberRole.OWNER,
    },
  });

  const supplierProfile = await prisma.supplierProfile.upsert({
    where: { businessId: supplierBusiness.id },
    update: { verificationStatus: VerificationStatus.APPROVED },
    create: {
      businessId: supplierBusiness.id,
      verificationStatus: VerificationStatus.APPROVED,
      verifiedAt: new Date(),
      establishedYear: 2012,
      minimumOrderAmount: 5000.0,
      deliveryTerms: 'Factory gate pickup in Akaki Kality or delivery within Addis Ababa for orders over 50,000 ETB.',
      paymentTerms: 'Telebirr, CBE Bank Transfer, or 30% advance with balance upon dispatch.',
      commissionRate: 0.05,
    },
  });

  // 5C. Buyer User & Business
  const buyerUser = await prisma.user.upsert({
    where: { email: 'dev-buyer@wholesalehub.et' },
    update: {},
    create: {
      email: 'dev-buyer@wholesalehub.et',
      passwordHash: testPasswordHash,
      fullName: 'Hiwot Hailu (Dev Buyer)',
      role: UserRole.BUYER,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
      isPhoneVerified: true,
      phone: '+251911000003',
    },
  });

  const buyerBusiness = await prisma.business.upsert({
    where: { slug: 'merkato-retailers-cooperative' },
    update: { isVerified: true },
    create: {
      name: 'Merkato Retailers Cooperative',
      slug: 'merkato-retailers-cooperative',
      businessType: BusinessType.RETAILER,
      tinNumber: '0098765432',
      email: 'procurement@merkato-coop.et',
      phone: '+251112765432',
      city: 'Addis Ababa',
      subCity: 'Addis Ketema',
      woreda: 'Woreda 01',
      addressLine: 'Merkato Commercial Center, Shop 312',
      isVerified: true,
      description: 'Consortium of retail grocery and dry goods shop owners in Addis Ababa.',
    },
  });

  await prisma.businessMembership.upsert({
    where: {
      businessId_userId: {
        businessId: buyerBusiness.id,
        userId: buyerUser.id,
      },
    },
    update: {},
    create: {
      businessId: buyerBusiness.id,
      userId: buyerUser.id,
      role: BusinessMemberRole.OWNER,
    },
  });

  // Seed default address for buyer
  await prisma.address.create({
    data: {
      businessId: buyerBusiness.id,
      userId: buyerUser.id,
      recipientName: 'Hiwot Hailu',
      phoneNumber: '+251911000003',
      city: 'Addis Ababa',
      subCity: 'Addis Ketema',
      woreda: '01',
      landmark: 'Near Grand Mosque, Merkato',
      isDefault: true,
    },
  });

  // 5D. Pending Verification Supplier
  const pendingSupplierUser = await prisma.user.upsert({
    where: { email: 'dev-pending@wholesalehub.et' },
    update: {},
    create: {
      email: 'dev-pending@wholesalehub.et',
      passwordHash: testPasswordHash,
      fullName: 'Dawit Mengistu (Pending Supplier)',
      role: UserRole.SUPPLIER,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
      phone: '+251911000004',
    },
  });

  const pendingBusiness = await prisma.business.upsert({
    where: { slug: 'bole-electronics-importers' },
    update: {},
    create: {
      name: 'Bole Electronics & Appliance Importers',
      slug: 'bole-electronics-importers',
      businessType: BusinessType.IMPORTER,
      tinNumber: '0055443322',
      email: 'info@bole-electronics.et',
      phone: '+251116633221',
      city: 'Addis Ababa',
      subCity: 'Bole',
      woreda: 'Woreda 03',
      addressLine: 'Cameroon Street, Next to Edna Mall',
      isVerified: false,
      description: 'Direct importer of consumer appliances and commercial electrical equipment.',
    },
  });

  await prisma.businessMembership.upsert({
    where: {
      businessId_userId: {
        businessId: pendingBusiness.id,
        userId: pendingSupplierUser.id,
      },
    },
    update: {},
    create: {
      businessId: pendingBusiness.id,
      userId: pendingSupplierUser.id,
      role: BusinessMemberRole.OWNER,
    },
  });

  await prisma.supplierProfile.upsert({
    where: { businessId: pendingBusiness.id },
    update: {},
    create: {
      businessId: pendingBusiness.id,
      verificationStatus: VerificationStatus.PENDING,
      establishedYear: 2022,
    },
  });

  // 6. Sample Wholesale Products with Quantity Tiers & Inventory
  console.log('-> Seeding wholesale products and tiered pricing...');

  const foodCategoryId = categoryMap.get('food-and-beverages')!;
  const textilesCategoryId = categoryMap.get('clothing-and-textiles')!;

  // Product 1: Coffee Beans
  const product1 = await prisma.product.upsert({
    where: { slug: 'yirgacheffe-green-coffee-beans-carton' },
    update: {},
    create: {
      businessId: supplierBusiness.id,
      categoryId: foodCategoryId,
      name: 'Ethiopian Yirgacheffe Grade 1 Specialty Green Coffee (Carton of 12 x 1kg Bags)',
      slug: 'yirgacheffe-green-coffee-beans-carton',
      sku: 'AGRO-COF-YRG-01',
      brand: 'Abyssinia Premium',
      description:
        'Certified Grade 1 washed Yirgacheffe green coffee beans. Sourced directly from Gedeo Zone smallholder cooperatives. Moisture content 10.5-11.5%. Screen size 15+.',
      wholesaleUnit: WholesaleUnit.CARTON,
      minOrderQuantity: 5,
      packageWeightKg: 12.5,
      packageDimensions: '40x30x25 cm',
      leadTimeDays: 2,
      status: ProductStatus.PUBLISHED,
      isFeatured: true,
      inventory: {
        create: {
          quantity: 250,
          reorderThreshold: 20,
        },
      },
      priceTiers: {
        create: [
          { minQuantity: 5, maxQuantity: 19, unitPrice: 2800.0 },
          { minQuantity: 20, maxQuantity: 49, unitPrice: 2650.0 },
          { minQuantity: 50, maxQuantity: null, unitPrice: 2500.0 },
        ],
      },
      images: {
        create: [
          {
            url: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=800&q=80',
            altText: 'Yirgacheffe Green Coffee Beans in bulk burlap bags',
            isPrimary: true,
            sortOrder: 0,
          },
        ],
      },
    },
  });

  // Product 2: Cooking Oil
  const product2 = await prisma.product.upsert({
    where: { slug: 'pure-sunflower-cooking-oil-20l' },
    update: {},
    create: {
      businessId: supplierBusiness.id,
      categoryId: foodCategoryId,
      name: 'Fortified Pure Sunflower Cooking Oil (Jerrycan 20 Liters)',
      slug: 'pure-sunflower-cooking-oil-20l',
      sku: 'AGRO-OIL-SNF-20L',
      brand: 'Abyssinia Gold',
      description:
        'Triple-refined, vitamin A & D fortified edible sunflower oil. Packed in heavy-duty food-grade HDPE 20L jerrycans with tamper-evident seals.',
      wholesaleUnit: WholesaleUnit.CARTON,
      minOrderQuantity: 10,
      packageWeightKg: 19.2,
      leadTimeDays: 1,
      status: ProductStatus.PUBLISHED,
      isFeatured: true,
      inventory: {
        create: {
          quantity: 600,
          reorderThreshold: 50,
        },
      },
      priceTiers: {
        create: [
          { minQuantity: 10, maxQuantity: 49, unitPrice: 3200.0 },
          { minQuantity: 50, maxQuantity: 99, unitPrice: 3050.0 },
          { minQuantity: 100, maxQuantity: null, unitPrice: 2900.0 },
        ],
      },
      images: {
        create: [
          {
            url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=800&q=80',
            altText: '20L Wholesale Cooking Oil Container',
            isPrimary: true,
            sortOrder: 0,
          },
        ],
      },
    },
  });

  // Product 3: Ethiopian Cotton Gabi
  const product3 = await prisma.product.upsert({
    where: { slug: 'traditional-ethiopian-cotton-gabi-box-10' },
    update: {},
    create: {
      businessId: supplierBusiness.id,
      categoryId: textilesCategoryId,
      name: 'Handwoven 100% Pure Ethiopian Cotton Gabi & Netela (Box of 10 Sets)',
      slug: 'traditional-ethiopian-cotton-gabi-box-10',
      sku: 'TXT-GAB-TRD-10',
      brand: 'Sheba Loomworks',
      description:
        'Four-layer premium carded Ethiopian cotton warm gabi with intricate Tibeb borders. Ideal for souvenir retailers, hotels, and department stores.',
      wholesaleUnit: WholesaleUnit.BOX,
      minOrderQuantity: 2,
      packageWeightKg: 14.0,
      leadTimeDays: 3,
      status: ProductStatus.PUBLISHED,
      isFeatured: true,
      inventory: {
        create: {
          quantity: 85,
          reorderThreshold: 10,
        },
      },
      priceTiers: {
        create: [
          { minQuantity: 2, maxQuantity: 9, unitPrice: 12000.0 },
          { minQuantity: 10, maxQuantity: 24, unitPrice: 11200.0 },
          { minQuantity: 25, maxQuantity: null, unitPrice: 10500.0 },
        ],
      },
      images: {
        create: [
          {
            url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=800&q=80',
            altText: 'Traditional handwoven Ethiopian cotton fabric',
            isPrimary: true,
            sortOrder: 0,
          },
        ],
      },
    },
  });

  console.log('✅ Seed completed successfully:');
  console.log(`   - 10 Configurable Categories`);
  console.log(`   - 7 Platform Settings`);
  console.log(`   - 4 Test Users (Admin, Supplier, Buyer, Pending Supplier)`);
  console.log(`   - 3 Wholesale Products with Tiered Pricing & Stock`);
  console.log(`   - Default Test Password: WholesaleHub2026!`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed with error:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
