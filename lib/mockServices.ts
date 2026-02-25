export interface MockService {
  id: string;
  title: string;
  description: string;
  basePrice: number;
  priceUnit: string;
  category: string;
  rating: number;
  reviewCount: number;
  providerName: string;
  isVerified: boolean;
  location: string;
  imageUrl: string;
}

export const MOCK_SERVICES: MockService[] = [
  {
    id: '1',
    title: '专业家居深度清洁',
    description: '两居室起，包含厨房油烟机、卫生间瓷砖深度清洁，环保无害洗剂。我们的团队拥有超过5年专业清洁经验，所有清洁剂均通过环保认证，对宠物和儿童安全无害。',
    basePrice: 120,
    priceUnit: '次',
    category: '家居清洁',
    rating: 4.9,
    reviewCount: 134,
    providerName: '洁净之家',
    isVerified: true,
    location: 'Guelph, ON',
    imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&h=250&fit=crop',
  },
  {
    id: '2',
    title: '儿童中文家教',
    description: '专业华裔教师，针对海外华人子女，普通话/粤语均可，寓教于乐。持有教师资格证，已帮助超过200名海外华裔儿童掌握中文读写能力。',
    basePrice: 45,
    priceUnit: '小时',
    category: '教育辅导',
    rating: 5.0,
    reviewCount: 56,
    providerName: '张老师',
    isVerified: true,
    location: 'Waterloo, ON',
    imageUrl: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=250&fit=crop',
  },
  {
    id: '3',
    title: '搬家打包运输服务',
    description: '本地搬家，提供打包材料，小件到大件家具均可，准时高效。拥有专业搬家车辆和设备，全程保险，安全有保障。',
    basePrice: 200,
    priceUnit: '次起',
    category: '搬家运输',
    rating: 4.7,
    reviewCount: 89,
    providerName: '快捷搬家',
    isVerified: true,
    location: 'Guelph, ON',
    imageUrl: 'https://images.unsplash.com/photo-1600518464441-9154a4dea21b?w=400&h=250&fit=crop',
  },
  {
    id: '4',
    title: '草坪修剪 & 园艺护理',
    description: '季节性草坪护理，包含修剪、施肥、除草，按月订阅可享折扣。专业园艺团队，熟悉加拿大气候条件下的植物养护。',
    basePrice: 60,
    priceUnit: '次',
    category: '园艺',
    rating: 4.8,
    reviewCount: 72,
    providerName: '绿拇指园艺',
    isVerified: false,
    location: 'Cambridge, ON',
    imageUrl: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=250&fit=crop',
  },
  {
    id: '5',
    title: '华人注册会计师报税',
    description: 'CPA 持证，专为华人移民提供个人/家庭/小生意报税，含 RRSP 规划。精通中英双语，了解移民报税的特殊需求，已服务超过500个家庭。',
    basePrice: 150,
    priceUnit: '份',
    category: '财税',
    rating: 4.9,
    reviewCount: 201,
    providerName: '李会计事务所',
    isVerified: true,
    location: 'Mississauga, ON',
    imageUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=250&fit=crop',
  },
  {
    id: '6',
    title: '水电暖气维修',
    description: '持牌技工，漏水、电路、暖气故障均可上门，24小时紧急服务。拥有安省持牌证书，全程操作符合本地建筑规范，工程质量有保障。',
    basePrice: 80,
    priceUnit: '小时',
    category: '房屋维修',
    rating: 4.6,
    reviewCount: 167,
    providerName: '全能师傅',
    isVerified: true,
    location: 'Guelph, ON',
    imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&h=250&fit=crop',
  },
];
