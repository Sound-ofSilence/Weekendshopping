import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 开始插入种子数据...');

  // 清空（按依赖顺序）
  await prisma.sku.deleteMany();
  await prisma.spuSpec.deleteMany();
  await prisma.spu.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.category.deleteMany();
  console.log('✅ 旧数据已清空');

  // ========== 类目 ==========
  const catWoman = await prisma.category.create({
    data: { name: '女装', level: 1, sort: 1, icon: '👗', isLeaf: false, status: 1 },
  });
  const catMan = await prisma.category.create({
    data: { name: '男装', level: 1, sort: 2, icon: '👔', isLeaf: false, status: 1 },
  });
  const catDigital = await prisma.category.create({
    data: { name: '数码', level: 1, sort: 3, icon: '📱', isLeaf: false, status: 1 },
  });
  const catHome = await prisma.category.create({
    data: { name: '家居', level: 1, sort: 4, icon: '🏠', isLeaf: false, status: 1 },
  });

  const catDress = await prisma.category.create({
    data: { parentId: catWoman.id, name: '连衣裙', level: 2, sort: 1, isLeaf: true, status: 1 },
  });
  const catCoat = await prisma.category.create({
    data: { parentId: catWoman.id, name: '羽绒服', level: 2, sort: 2, isLeaf: true, status: 1 },
  });
  const catShoes = await prisma.category.create({
    data: { parentId: catMan.id, name: '男鞋', level: 2, sort: 1, isLeaf: true, status: 1 },
  });
  const catHeadphone = await prisma.category.create({
    data: { parentId: catDigital.id, name: '耳机', level: 2, sort: 1, isLeaf: true, status: 1 },
  });
  const catWatch = await prisma.category.create({
    data: { parentId: catDigital.id, name: '智能手表', level: 2, sort: 2, isLeaf: true, status: 1 },
  });
  const catLamp = await prisma.category.create({
    data: { parentId: catHome.id, name: '台灯', level: 2, sort: 1, isLeaf: true, status: 1 },
  });
  console.log('✅ 类目：10 个（4 一级 + 6 二级）');

  // ========== 品牌 ==========
  const [uniqlo, nike, adidas, zara, hm, gucci] = await Promise.all(
    ['Uniqlo', 'Nike', 'Adidas', 'Zara', 'H&M', 'Gucci'].map((name) =>
      prisma.brand.create({ data: { name, status: 1 } }),
    ),
  );
  console.log('✅ 品牌：6 个');

  // ========== SKU 生成工具 ==========
  async function createSkus(
    spuId: number,
    colors: string[] | null,
    sizes: string[] | null,
    price: string,
    marketPrice: string,
    image: string,
  ) {
    const specs: Record<string, string>[] = [];
    if (colors && sizes) {
      for (const color of colors) for (const size of sizes) specs.push({ 颜色: color, 尺码: size });
    } else if (colors) {
      for (const color of colors) specs.push({ 颜色: color });
    } else if (sizes) {
      for (const size of sizes) specs.push({ 尺码: size });
    } else {
      specs.push({});
    }
    await prisma.sku.createMany({
      data: specs.map((spec) => ({
        spuId,
        specJson: spec,
        price,
        marketPrice,
        stock: 100,
        lockedStock: 0,
        warnStock: 5,
        image,
        status: 1,
      })),
    });
  }

  // ========== 商品 1：连衣裙 ==========
  const spu1 = await prisma.spu.create({
    data: {
      shopId: 1,
      categoryId: catDress.id,
      brandId: uniqlo.id,
      title: '2026 新款连衣裙 显瘦气质 春秋必备',
      subtitle: '精选面料 显瘦气质',
      mainImg: '👗',
      imagesJson: ['👗', '👚', '👘', '🧥'],
      detailHtml: '<p>精选优质面料，显瘦版型设计，春秋必备单品。</p>',
      status: 2,
      auditStatus: 1,
      salesCount: 12000,
      ratingAvg: '4.90',
    },
  });
  await prisma.spuSpec.createMany({
    data: [
      { spuId: spu1.id, name: '颜色', valuesJson: ['黑色', '白色', '灰色'], sort: 1 },
      { spuId: spu1.id, name: '尺码', valuesJson: ['S', 'M', 'L', 'XL'], sort: 2 },
    ],
  });
  await createSkus(spu1.id, ['黑色', '白色', '灰色'], ['S', 'M', 'L', 'XL'], '99.00', '199.00', '👗');

  // ========== 商品 2：皮鞋 ==========
  const spu2 = await prisma.spu.create({
    data: {
      shopId: 1,
      categoryId: catShoes.id,
      brandId: nike.id,
      title: '真皮男士商务休闲鞋 头层牛皮',
      subtitle: '舒适透气 商务百搭',
      mainImg: '👞',
      imagesJson: ['👞', '👟', '🥾'],
      detailHtml: '<p>头层牛皮制作，舒适透气，商务休闲两相宜。</p>',
      status: 2,
      auditStatus: 1,
      salesCount: 8560,
      ratingAvg: '4.80',
    },
  });
  await prisma.spuSpec.createMany({
    data: [
      { spuId: spu2.id, name: '颜色', valuesJson: ['黑色', '棕色'], sort: 1 },
      { spuId: spu2.id, name: '尺码', valuesJson: ['39', '40', '41', '42', '43'], sort: 2 },
    ],
  });
  await createSkus(spu2.id, ['黑色', '棕色'], ['39', '40', '41', '42', '43'], '288.00', '599.00', '👞');

  // ========== 商品 3：耳机 ==========
  const spu3 = await prisma.spu.create({
    data: {
      shopId: 2,
      categoryId: catHeadphone.id,
      brandId: adidas.id,
      title: '无线蓝牙耳机 主动降噪 长续航',
      subtitle: 'HiFi 音质 40 小时续航',
      mainImg: '🎧',
      imagesJson: ['🎧', '🎵', '🔊'],
      detailHtml: '<p>主动降噪，40 小时超长续航，HiFi 音质。</p>',
      status: 2,
      auditStatus: 1,
      salesCount: 35000,
      ratingAvg: '4.90',
    },
  });
  await prisma.spuSpec.createMany({
    data: [{ spuId: spu3.id, name: '颜色', valuesJson: ['白色', '黑色'], sort: 1 }],
  });
  await createSkus(spu3.id, ['白色', '黑色'], null, '399.00', '699.00', '🎧');

  // ========== 商品 4：台灯 ==========
  const spu4 = await prisma.spu.create({
    data: {
      shopId: 2,
      categoryId: catLamp.id,
      brandId: zara.id,
      title: '简约北欧风台灯 护眼卧室床头灯',
      subtitle: '三档调光 触控开关',
      mainImg: '💡',
      imagesJson: ['💡', '🕯️'],
      detailHtml: '<p>北欧简约设计，三档调光，护眼不刺眼。</p>',
      status: 2,
      auditStatus: 1,
      salesCount: 1243,
      ratingAvg: '4.70',
    },
  });
  await prisma.spuSpec.createMany({
    data: [{ spuId: spu4.id, name: '颜色', valuesJson: ['白色', '木色'], sort: 1 }],
  });
  await createSkus(spu4.id, ['白色', '木色'], null, '129.00', '259.00', '💡');

  // ========== 商品 5：羽绒服 ==========
  const spu5 = await prisma.spu.create({
    data: {
      shopId: 3,
      categoryId: catCoat.id,
      brandId: hm.id,
      title: '冬季加厚羽绒服 90% 白鸭绒',
      subtitle: '防风保暖 时尚百搭',
      mainImg: '🧥',
      imagesJson: ['🧥', '🧣'],
      detailHtml: '<p>90% 白鸭绒填充，防风保暖，时尚百搭。</p>',
      status: 2,
      auditStatus: 1,
      salesCount: 5678,
      ratingAvg: '4.80',
    },
  });
  await prisma.spuSpec.createMany({
    data: [
      { spuId: spu5.id, name: '颜色', valuesJson: ['黑色', '藏青', '酒红'], sort: 1 },
      { spuId: spu5.id, name: '尺码', valuesJson: ['S', 'M', 'L', 'XL', 'XXL'], sort: 2 },
    ],
  });
  await createSkus(spu5.id, ['黑色', '藏青', '酒红'], ['S', 'M', 'L', 'XL', 'XXL'], '599.00', '1299.00', '🧥');

  // ========== 商品 6：手表 ==========
  const spu6 = await prisma.spu.create({
    data: {
      shopId: 3,
      categoryId: catWatch.id,
      brandId: gucci.id,
      title: '智能手表运动款 心率监测 GPS',
      subtitle: '5ATM 防水 14 天续航',
      mainImg: '⌚',
      imagesJson: ['⌚', '📱'],
      detailHtml: '<p>心率监测、GPS 定位、5ATM 防水、14 天续航。</p>',
      status: 2,
      auditStatus: 1,
      salesCount: 21000,
      ratingAvg: '4.90',
    },
  });
  await prisma.spuSpec.createMany({
    data: [
      { spuId: spu6.id, name: '颜色', valuesJson: ['黑色', '银色'], sort: 1 },
      { spuId: spu6.id, name: '表带', valuesJson: ['硅胶', '金属'], sort: 2 },
    ],
  });
  await createSkus(spu6.id, ['黑色', '银色'], ['硅胶', '金属'], '899.00', '1599.00', '⌚');

  console.log('✅ 商品：6 个（含 SKU 和规格）');

  // 统计
  const stats = {
    categories: await prisma.category.count(),
    brands: await prisma.brand.count(),
    spus: await prisma.spu.count(),
    skus: await prisma.sku.count(),
    specs: await prisma.spuSpec.count(),
  };
  console.log('📊 数据统计：', stats);
  console.log('🎉 种子数据插入完成！');
}

main()
  .catch((e) => {
    console.error('❌ 种子失败：', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());