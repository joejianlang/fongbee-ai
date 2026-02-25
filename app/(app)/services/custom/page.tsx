'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, ArrowRight, CheckCircle, Info,
  Home, BookOpen, Truck, Flower2, Calculator,
  Wrench, Camera, Languages, Scissors, PawPrint,
  UtensilsCrossed, HelpCircle, ImagePlus, X,
} from 'lucide-react';

// ─── 类别定义 ────────────────────────────────────────────────────────────────

interface Category {
  id: string;
  label: string;
  icon: React.ReactNode;
  desc: string;
  color: string;
}

const CATEGORIES: Category[] = [
  { id: 'cleaning',     label: '家居清洁',  icon: <Home size={22} />,         desc: '深度清洁、日常保洁、搬入/搬出清洁',  color: 'bg-blue-50 text-blue-600 border-blue-200' },
  { id: 'education',    label: '教育辅导',  icon: <BookOpen size={22} />,      desc: '课外辅导、语言学习、才艺培训',          color: 'bg-purple-50 text-purple-600 border-purple-200' },
  { id: 'moving',       label: '搬家运输',  icon: <Truck size={22} />,         desc: '本地搬家、大件运输、打包服务',          color: 'bg-orange-50 text-orange-600 border-orange-200' },
  { id: 'gardening',    label: '园艺绿化',  icon: <Flower2 size={22} />,       desc: '草坪修剪、景观设计、种植养护',          color: 'bg-green-50 text-green-600 border-green-200' },
  { id: 'tax',          label: '财税咨询',  icon: <Calculator size={22} />,    desc: '个人报税、公司报税、移民财务规划',      color: 'bg-yellow-50 text-yellow-600 border-yellow-200' },
  { id: 'repair',       label: '房屋维修',  icon: <Wrench size={22} />,        desc: '水电维修、家具安装、油漆装修',          color: 'bg-red-50 text-red-600 border-red-200' },
  { id: 'photography',  label: '摄影摄像',  icon: <Camera size={22} />,        desc: '婚礼、活动、证件、商业摄影',            color: 'bg-pink-50 text-pink-600 border-pink-200' },
  { id: 'translation',  label: '翻译口译',  icon: <Languages size={22} />,     desc: '文件翻译、现场口译、公证翻译',          color: 'bg-indigo-50 text-indigo-600 border-indigo-200' },
  { id: 'beauty',       label: '美容美发',  icon: <Scissors size={22} />,      desc: '上门美发、美甲、按摩养生',              color: 'bg-rose-50 text-rose-600 border-rose-200' },
  { id: 'pet',          label: '宠物服务',  icon: <PawPrint size={22} />,      desc: '宠物美容、寄养、遛狗、训练',            color: 'bg-amber-50 text-amber-600 border-amber-200' },
  { id: 'catering',     label: '餐饮外卖',  icon: <UtensilsCrossed size={22}/>, desc: '私厨上门、宴席定制、烘焙甜点',          color: 'bg-lime-50 text-lime-600 border-lime-200' },
  { id: 'other',        label: '其他需求',  icon: <HelpCircle size={22} />,    desc: '上述分类中没有的特殊需求',              color: 'bg-gray-50 text-gray-600 border-gray-200' },
];

// ─── 字段组件 ────────────────────────────────────────────────────────────────

interface ChipGroupProps {
  label: string;
  required?: boolean;
  options: string[];
  value: string;
  onChange: (v: string) => void;
  multi?: boolean;
  multiValue?: string[];
  onMultiChange?: (v: string[]) => void;
}

function ChipGroup({ label, required, options, value, onChange, multi, multiValue = [], onMultiChange }: ChipGroupProps) {
  return (
    <div>
      <p className="text-xs font-semibold text-text-muted mb-2">
        {label} {required && <span className="text-red-400">*</span>}
      </p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = multi ? multiValue.includes(opt) : value === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => {
                if (multi && onMultiChange) {
                  onMultiChange(active ? multiValue.filter((v) => v !== opt) : [...multiValue, opt]);
                } else {
                  onChange(active ? '' : opt);
                }
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                active
                  ? 'bg-[#0d9488] text-white border-[#0d9488]'
                  : 'border-border-primary text-text-secondary hover:border-[#0d9488] dark:border-gray-600'
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface TextFieldProps {
  label: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  textarea?: boolean;
  rows?: number;
  hint?: string;
}

function TextField({ label, required, value, onChange, placeholder, type = 'text', textarea, rows = 3, hint }: TextFieldProps) {
  const cls = 'w-full bg-transparent text-sm text-text-primary dark:text-white placeholder-text-muted outline-none resize-none';
  return (
    <div>
      <p className="text-xs font-semibold text-text-muted mb-2">
        {label} {required && <span className="text-red-400">*</span>}
      </p>
      {textarea ? (
        <textarea rows={rows} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={cls} />
      ) : (
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={cls} />
      )}
      {hint && <p className="text-xs text-text-muted mt-1.5">{hint}</p>}
    </div>
  );
}

// ─── 每个类别的专属表单 ───────────────────────────────────────────────────────

function CleaningForm({ fields, set }: { fields: Record<string, string | string[]>; set: (k: string, v: string | string[]) => void }) {
  return (
    <>
      <ChipGroup label="清洁类型" required options={['日常保洁','深度清洁','搬入/搬出清洁','厨房专项','窗户清洁','地毯清洁']} value={fields.type as string} onChange={(v) => set('type', v)} />
      <ChipGroup label="住宅类型" required options={['公寓(1卧)','公寓(2卧)','公寓(3卧+)','独立屋','联排别墅','商业场所']} value={fields.houseType as string} onChange={(v) => set('houseType', v)} />
      <ChipGroup label="大概面积" options={['500sqft以下','500–1000sqft','1000–1500sqft','1500–2500sqft','2500sqft以上']} value={fields.area as string} onChange={(v) => set('area', v)} />
      <ChipGroup label="特殊要求" options={['宠物家庭','婴幼儿家庭','过敏体质','需要环保清洁剂','自带工具耗材']} value="" onChange={() => {}} multi multiValue={fields.special as string[]} onMultiChange={(v) => set('special', v)} />
      <TextField label="补充说明" value={fields.note as string} onChange={(v) => set('note', v)} placeholder="如：有猫砂需处理，冰箱需要内部清洁..." textarea rows={3} />
    </>
  );
}

function EducationForm({ fields, set }: { fields: Record<string, string | string[]>; set: (k: string, v: string | string[]) => void }) {
  return (
    <>
      <ChipGroup label="辅导类型" required options={['学科辅导','语言学习','音乐/艺术','体育训练','STEM编程','升学规划']} value={fields.type as string} onChange={(v) => set('type', v)} />
      <ChipGroup label="学生年级" required options={['幼儿园','小学1–3年级','小学4–6年级','初中','高中','大学/成人']} value={fields.grade as string} onChange={(v) => set('grade', v)} />
      <ChipGroup label="辅导科目" options={['数学','英语','中文','法语','科学','历史','物理','化学']} value="" onChange={() => {}} multi multiValue={fields.subjects as string[]} onMultiChange={(v) => set('subjects', v)} />
      <ChipGroup label="上课方式" options={['上门辅导','学生去老师处','线上视频','均可']} value={fields.mode as string} onChange={(v) => set('mode', v)} />
      <ChipGroup label="每周课时" options={['每周1次','每周2次','每周3次以上','不定期']} value={fields.frequency as string} onChange={(v) => set('frequency', v)} />
      <TextField label="补充要求" value={fields.note as string} onChange={(v) => set('note', v)} placeholder="如：孩子中文基础薄弱，普通话优先；老师需有教学经验..." textarea rows={3} />
    </>
  );
}

function MovingForm({ fields, set }: { fields: Record<string, string | string[]>; set: (k: string, v: string | string[]) => void }) {
  return (
    <>
      <ChipGroup label="搬家类型" required options={['居家搬家','办公室搬迁','单件大型家具','钢琴/特殊物品','长途搬运']} value={fields.type as string} onChange={(v) => set('type', v)} />
      <ChipGroup label="住宅规模" required options={['单间/Studio','1居室','2居室','3居室','4居室以上','办公室']} value={fields.size as string} onChange={(v) => set('size', v)} />
      <TextField label="起点地址" required value={fields.from as string} onChange={(v) => set('from', v)} placeholder="如：123 Gordon St, Guelph, ON" />
      <TextField label="目的地地址" required value={fields.to as string} onChange={(v) => set('to', v)} placeholder="如：456 Stone Rd, Waterloo, ON" />
      <ChipGroup label="附加服务" options={['提供打包材料','协助拆装家具','楼梯搬运','钢琴搬运','需要吊装']} value="" onChange={() => {}} multi multiValue={fields.extras as string[]} onMultiChange={(v) => set('extras', v)} />
      <TextField label="特殊物品说明" value={fields.note as string} onChange={(v) => set('note', v)} placeholder="如：有鱼缸、古董家具需特别保护..." textarea rows={2} />
    </>
  );
}

function GardeningForm({ fields, set }: { fields: Record<string, string | string[]>; set: (k: string, v: string | string[]) => void }) {
  return (
    <>
      <ChipGroup label="园艺服务类型" required options={['草坪修剪','庭院清理','景观设计施工','树木修剪','种植花草','铺砌路砖','除草除虫','冬季除雪']} value={fields.type as string} onChange={(v) => set('type', v)} />
      <ChipGroup label="庭院面积" required options={['小型(<500sqft)','中型(500–1500sqft)','大型(1500–3000sqft)','超大(3000sqft+)']} value={fields.area as string} onChange={(v) => set('area', v)} />
      <ChipGroup label="服务频率" options={['单次','每周','每两周','每月','季节性']} value={fields.frequency as string} onChange={(v) => set('frequency', v)} />
      <TextField label="具体要求" value={fields.note as string} onChange={(v) => set('note', v)} placeholder="如：需保留玫瑰丛，草坪上有儿童游乐设施..." textarea rows={3} />
    </>
  );
}

function TaxForm({ fields, set }: { fields: Record<string, string | string[]>; set: (k: string, v: string | string[]) => void }) {
  return (
    <>
      <ChipGroup label="报税类型" required options={['个人报税(T1)','夫妻联合申报','小生意/自雇(T2125)','公司法人(T2)','HST申报','工资单(payroll)','遗产税']} value={fields.type as string} onChange={(v) => set('type', v)} />
      <ChipGroup label="移民身份" options={['公民','永久居民','工签','学签','新移民(首年)','不确定']} value={fields.status as string} onChange={(v) => set('status', v)} />
      <ChipGroup label="收入来源" options={['T4工资','自雇收入','投资/股息','海外收入','租金收入','无收入']} value="" onChange={() => {}} multi multiValue={fields.income as string[]} onMultiChange={(v) => set('income', v)} />
      <ChipGroup label="附加服务" options={['RRSP规划','TFSA优化','移民前税务规划','补报往年税表','CRA应对/审计']} value="" onChange={() => {}} multi multiValue={fields.extras as string[]} onMultiChange={(v) => set('extras', v)} />
      <TextField label="特殊情况说明" value={fields.note as string} onChange={(v) => set('note', v)} placeholder="如：当年有海外资产申报需求，或有多个雇主..." textarea rows={3} />
    </>
  );
}

function RepairForm({ fields, set }: { fields: Record<string, string | string[]>; set: (k: string, v: string | string[]) => void }) {
  return (
    <>
      <ChipGroup label="维修类型" required options={['水管/漏水','电路/插座','暖气/空调','门窗/锁','地板/瓷砖','油漆粉刷','家具安装','屋顶/外墙','紧急维修']} value={fields.type as string} onChange={(v) => set('type', v)} />
      <ChipGroup label="问题紧急程度" required options={['紧急（24h内）','较急（3天内）','正常（一周内）','不急（灵活安排）']} value={fields.urgency as string} onChange={(v) => set('urgency', v)} />
      <TextField label="问题描述" required value={fields.desc as string} onChange={(v) => set('desc', v)} placeholder="如：厨房水龙头漏水，已关总阀；卫生间瓷砖脱落约20cm..." textarea rows={4} hint="描述越详细，服务商估价越准确" />
      <ChipGroup label="房屋类型" options={['公寓','联排别墅','独立屋','商业场所']} value={fields.houseType as string} onChange={(v) => set('houseType', v)} />
    </>
  );
}

function PhotographyForm({ fields, set }: { fields: Record<string, string | string[]>; set: (k: string, v: string | string[]) => void }) {
  return (
    <>
      <ChipGroup label="拍摄类型" required options={['婚礼摄影','婚礼摄像','订婚写真','家庭照','儿童写真','证件照','企业/商业','活动纪实','产品拍摄']} value={fields.type as string} onChange={(v) => set('type', v)} />
      <TextField label="拍摄日期" required value={fields.date as string} onChange={(v) => set('date', v)} placeholder="如：2026-05-20" type="text" hint="如日期未定，请填写大概时间范围" />
      <TextField label="拍摄地点" value={fields.location as string} onChange={(v) => set('location', v)} placeholder="如：Guelph 市区、家中、酒店..." />
      <ChipGroup label="拍摄时长" options={['1小时以内','2–3小时','半天(4小时)','全天','多天']} value={fields.duration as string} onChange={(v) => set('duration', v)} />
      <ChipGroup label="附加需求" options={['精修照片','相册/打印','RAW源文件','MV剪辑','航拍无人机','现场直播']} value="" onChange={() => {}} multi multiValue={fields.extras as string[]} onMultiChange={(v) => set('extras', v)} />
      <TextField label="风格参考/补充" value={fields.note as string} onChange={(v) => set('note', v)} placeholder="如：喜欢自然光胶片风格，共5位成员..." textarea rows={2} />
    </>
  );
}

function TranslationForm({ fields, set }: { fields: Record<string, string | string[]>; set: (k: string, v: string | string[]) => void }) {
  return (
    <>
      <ChipGroup label="服务类型" required options={['文件翻译','现场口译','电话/视频口译','公证翻译','同声传译','字幕翻译']} value={fields.type as string} onChange={(v) => set('type', v)} />
      <ChipGroup label="语言方向" required options={['中文→英文','英文→中文','中文→法文','英文→法文','粤语口译','其他']} value={fields.lang as string} onChange={(v) => set('lang', v)} />
      <ChipGroup label="文件类型" options={['移民材料','法律文件','医疗报告','学术/学历','商业合同','个人证件','其他']} value={fields.docType as string} onChange={(v) => set('docType', v)} />
      <TextField label="字数/时长估计" value={fields.volume as string} onChange={(v) => set('volume', v)} placeholder="如：约2000字文件，或需要2小时现场口译" />
      <TextField label="补充说明" value={fields.note as string} onChange={(v) => set('note', v)} placeholder="如：需要翻译公司盖章、CIC移民局接受格式..." textarea rows={2} />
    </>
  );
}

function BeautyForm({ fields, set }: { fields: Record<string, string | string[]>; set: (k: string, v: string | string[]) => void }) {
  return (
    <>
      <ChipGroup label="服务类型" required options={['剪发/造型','烫发/染发','婚礼造型','美甲','睫毛嫁接','按摩/推拿','全套美容护肤','纹眉/半永久']} value={fields.type as string} onChange={(v) => set('type', v)} />
      <ChipGroup label="上门/到店" required options={['上门服务','到服务商处','均可']} value={fields.mode as string} onChange={(v) => set('mode', v)} />
      <ChipGroup label="服务对象" options={['女士','男士','儿童','新娘','全家']} value={fields.target as string} onChange={(v) => set('target', v)} />
      <TextField label="具体需求" value={fields.note as string} onChange={(v) => set('note', v)} placeholder="如：需要婚礼当天早7点上门，共4人做造型..." textarea rows={3} />
    </>
  );
}

function PetForm({ fields, set }: { fields: Record<string, string | string[]>; set: (k: string, v: string | string[]) => void }) {
  return (
    <>
      <ChipGroup label="宠物类型" required options={['小型犬','中型犬','大型犬','猫','鸟类','其他']} value={fields.petType as string} onChange={(v) => set('petType', v)} />
      <ChipGroup label="服务类型" required options={['宠物美容','遛狗','寄养(上门)','宠物寄宿','宠物训练','上门喂养','宠物摄影']} value={fields.type as string} onChange={(v) => set('type', v)} />
      <TextField label="宠物品种/年龄/体重" value={fields.petInfo as string} onChange={(v) => set('petInfo', v)} placeholder="如：金毛1岁约30kg，性格温顺，已绝育" />
      <ChipGroup label="频率" options={['单次','每日','每周几次','长期']} value={fields.frequency as string} onChange={(v) => set('frequency', v)} />
      <TextField label="特殊情况" value={fields.note as string} onChange={(v) => set('note', v)} placeholder="如：宠物有过敏史，需使用特定洗毛水..." textarea rows={2} />
    </>
  );
}

function CateringForm({ fields, set }: { fields: Record<string, string | string[]>; set: (k: string, v: string | string[]) => void }) {
  return (
    <>
      <ChipGroup label="餐饮类型" required options={['私厨上门','宴席/聚会','烘焙甜点','月子餐','早茶点心','素食定制','儿童派对']} value={fields.type as string} onChange={(v) => set('type', v)} />
      <ChipGroup label="菜系偏好" options={['粤菜','川菜','沪菜','北方菜','东南亚','西餐','日韩','无偏好']} value={fields.cuisine as string} onChange={(v) => set('cuisine', v)} />
      <TextField label="用餐人数" required value={fields.headcount as string} onChange={(v) => set('headcount', v)} placeholder="如：10人正式晚宴" type="number" />
      <TextField label="活动日期" value={fields.date as string} onChange={(v) => set('date', v)} placeholder="如：2026-03-15" />
      <ChipGroup label="饮食限制" options={['清真(Halal)','素食','无麸质','海鲜过敏','坚果过敏','无辣']} value="" onChange={() => {}} multi multiValue={fields.dietary as string[]} onMultiChange={(v) => set('dietary', v)} />
      <TextField label="特殊要求" value={fields.note as string} onChange={(v) => set('note', v)} placeholder="如：需要提供厨师服、餐具，或特定菜品..." textarea rows={2} />
    </>
  );
}

function OtherForm({ fields, set }: { fields: Record<string, string | string[]>; set: (k: string, v: string | string[]) => void }) {
  return (
    <>
      <TextField label="需求标题" required value={fields.title as string} onChange={(v) => set('title', v)} placeholder="简单描述您的需求..." />
      <TextField label="详细描述" required value={fields.desc as string} onChange={(v) => set('desc', v)} placeholder="请尽量详细说明您需要什么服务，方便平台匹配合适的服务商..." textarea rows={6} />
    </>
  );
}

// ─── 类别 → 表单渲染映射 ─────────────────────────────────────────────────────

const FORM_MAP: Record<string, React.ComponentType<{ fields: Record<string, string | string[]>; set: (k: string, v: string | string[]) => void }>> = {
  cleaning:    CleaningForm,
  education:   EducationForm,
  moving:      MovingForm,
  gardening:   GardeningForm,
  tax:         TaxForm,
  repair:      RepairForm,
  photography: PhotographyForm,
  translation: TranslationForm,
  beauty:      BeautyForm,
  pet:         PetForm,
  catering:    CateringForm,
  other:       OtherForm,
};

// ─── 通用底部字段（所有类别共用） ────────────────────────────────────────────

const BUDGET_OPTIONS = ['不限预算', '$50以内', '$50–$150', '$150–$500', '$500–$1,000', '$1,000–$3,000', '$3,000以上'];
const TIMELINE_OPTIONS = ['尽快（1–3天内）', '本周内', '两周内', '一个月内', '时间灵活'];

// ─── 主组件 ──────────────────────────────────────────────────────────────────

export default function CustomServicePage() {
  const router = useRouter();

  // Step 1: category selection
  const [step,     setStep]    = useState<'pick' | 'form'>('pick');
  const [category, setCategory] = useState<Category | null>(null);

  // Dynamic category-specific fields
  const [fields,   setFields]  = useState<Record<string, string | string[]>>({});
  const setField = (k: string, v: string | string[]) => setFields((prev) => ({ ...prev, [k]: v }));

  // Common fields
  const [budget,   setBudget]  = useState('');
  const [timeline, setTimeline]= useState('');
  const [address,  setAddress] = useState('');
  const [contact,  setContact] = useState('');
  const [images,   setImages]  = useState<string[]>([]);

  // Submit state
  const [submitting, setSubmitting] = useState(false);
  const [submitted,  setSubmitted]  = useState(false);

  const handleSelectCategory = (cat: Category) => {
    setCategory(cat);
    setFields({});
    setStep('form');
  };

  const handleSubmit = async () => {
    if (!contact.trim() || !budget || submitting) return;
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 900));
    setSubmitting(false);
    setSubmitted(true);
    setTimeout(() => router.push('/services'), 1500);
  };

  // ── 成功页 ──
  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
        <div className="w-20 h-20 rounded-full bg-[#0d9488]/10 flex items-center justify-center mb-5">
          <CheckCircle size={42} className="text-[#0d9488]" />
        </div>
        <h2 className="text-xl font-bold text-text-primary dark:text-white mb-2">需求发布成功！</h2>
        <p className="text-sm text-text-muted mb-1">我们已收到您的定制需求</p>
        <p className="text-sm text-text-muted">
          平台将在 <span className="text-[#0d9488] font-semibold">24 小时内</span> 为您匹配合适的服务商
        </p>
        <p className="text-xs text-text-muted mt-3">正在返回服务页面...</p>
      </div>
    );
  }

  // ── 顶栏 ──
  const topBar = (
    <div className="sticky top-14 z-40 bg-white dark:bg-[#2d2d30] border-b border-border-primary px-4 py-3 flex items-center gap-3">
      {step === 'form' ? (
        <button
          onClick={() => setStep('pick')}
          className="flex items-center gap-1.5 text-text-secondary hover:text-text-primary text-sm transition-colors"
        >
          <ArrowLeft size={18} />返回
        </button>
      ) : (
        <Link href="/services" className="flex items-center gap-1.5 text-text-secondary hover:text-text-primary text-sm transition-colors">
          <ArrowLeft size={18} />取消
        </Link>
      )}
      <div className="flex-1 text-center">
        <span className="font-semibold text-text-primary dark:text-white text-sm">发布定制需求</span>
        {step === 'form' && category && (
          <p className="text-xs text-[#0d9488] mt-0.5">{category.label}</p>
        )}
      </div>
      {step === 'form' ? (
        <button
          onClick={handleSubmit}
          disabled={!contact.trim() || !budget || submitting}
          className={`text-sm font-semibold px-4 py-1.5 rounded-full transition-all ${
            contact.trim() && budget && !submitting
              ? 'bg-[#0d9488] text-white hover:bg-[#0a7c71]'
              : 'bg-gray-200 dark:bg-gray-600 text-gray-400 cursor-not-allowed'
          }`}
        >
          {submitting ? '提交中…' : '提交'}
        </button>
      ) : (
        <div className="w-14" />
      )}
    </div>
  );

  // ══════════════════════════════════════════════════
  // STEP 1 — 选择服务类别
  // ══════════════════════════════════════════════════
  if (step === 'pick') {
    return (
      <div className="pb-10">
        {topBar}

        {/* 步骤指示 */}
        <div className="flex items-center gap-2 px-4 py-3 bg-[#0d9488]/5 border-b border-[#0d9488]/10">
          <div className="w-6 h-6 rounded-full bg-[#0d9488] text-white text-xs flex items-center justify-center font-bold flex-shrink-0">1</div>
          <span className="text-sm font-medium text-[#0d9488]">选择服务类别</span>
          <div className="flex-1 h-px bg-border-primary mx-2" />
          <div className="w-6 h-6 rounded-full bg-gray-200 text-gray-400 text-xs flex items-center justify-center font-bold flex-shrink-0">2</div>
          <span className="text-sm text-text-muted">填写需求详情</span>
        </div>

        <div className="px-4 md:px-0 mt-4">
          <p className="text-sm text-text-secondary dark:text-gray-300 mb-4">请先选择最符合您需求的服务类别，我们将为您展示专属的信息填写表单：</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleSelectCategory(cat)}
                className={`flex flex-col items-center gap-2.5 p-4 rounded-xl border-2 text-center transition-all hover:shadow-md hover:scale-[1.02] active:scale-100 ${cat.color}`}
              >
                <div className="w-12 h-12 rounded-full bg-white/60 flex items-center justify-center shadow-sm flex-shrink-0">
                  {cat.icon}
                </div>
                <div>
                  <p className="font-semibold text-sm">{cat.label}</p>
                  <p className="text-xs opacity-70 mt-0.5 leading-tight">{cat.desc}</p>
                </div>
                <ArrowRight size={14} className="opacity-50" />
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════
  // STEP 2 — 专属表单
  // ══════════════════════════════════════════════════
  const FormComponent = category ? FORM_MAP[category.id] : null;
  const inputClass = 'w-full bg-transparent text-sm text-text-primary dark:text-white placeholder-text-muted outline-none';

  return (
    <div className="pb-36 md:pb-10">
      {topBar}

      {/* 步骤指示 */}
      <div className="flex items-center gap-2 px-4 py-3 bg-[#0d9488]/5 border-b border-[#0d9488]/10">
        <div className="w-6 h-6 rounded-full bg-[#0d9488]/30 text-[#0d9488] text-xs flex items-center justify-center font-bold flex-shrink-0">✓</div>
        <span className="text-sm text-[#0d9488]/70">已选：{category?.label}</span>
        <div className="flex-1 h-px bg-[#0d9488]/20 mx-2" />
        <div className="w-6 h-6 rounded-full bg-[#0d9488] text-white text-xs flex items-center justify-center font-bold flex-shrink-0">2</div>
        <span className="text-sm font-medium text-[#0d9488]">填写需求详情</span>
      </div>

      <div className="px-4 md:px-0 mt-4 space-y-4">

        {/* 专属表单卡 */}
        {FormComponent && (
          <div className="bg-white dark:bg-[#2d2d30] rounded-xl shadow-sm p-4 space-y-5">
            <div className={`flex items-center gap-3 pb-3 border-b border-border-primary`}>
              <div className={`w-9 h-9 rounded-full ${category?.color} flex items-center justify-center flex-shrink-0`}>
                {category?.icon}
              </div>
              <div>
                <p className="font-semibold text-text-primary dark:text-white text-sm">{category?.label}需求详情</p>
                <p className="text-xs text-text-muted mt-0.5">请填写以下信息，帮助服务商了解您的具体需求</p>
              </div>
            </div>
            <FormComponent fields={fields} set={setField} />
          </div>
        )}

        {/* 通用：预算 & 时间 */}
        <div className="bg-white dark:bg-[#2d2d30] rounded-xl shadow-sm p-4 space-y-5">
          <ChipGroup label="预算范围" required options={BUDGET_OPTIONS} value={budget} onChange={setBudget} />
          <ChipGroup label="期望完成时间" options={TIMELINE_OPTIONS} value={timeline} onChange={setTimeline} />
        </div>

        {/* 通用：服务地址 */}
        <div className="bg-white dark:bg-[#2d2d30] rounded-xl shadow-sm p-4">
          <p className="text-xs font-semibold text-text-muted mb-2">服务地址（选填）</p>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="如：Guelph, ON 或 123 Gordon St, Guelph"
            className={inputClass}
          />
          <p className="text-xs text-text-muted mt-1.5">仅向匹配到的服务商显示城市/区域</p>
        </div>

        {/* 通用：参考图片 */}
        <div className="bg-white dark:bg-[#2d2d30] rounded-xl shadow-sm p-4">
          <p className="text-xs font-semibold text-text-muted mb-1">参考图片（选填，最多 6 张）</p>
          <p className="text-xs text-text-muted mb-3">如有参考样式或现场照片，上传后服务商可更快给出准确报价</p>
          <div className="flex flex-wrap gap-2">
            {images.map((_, i) => (
              <div key={i} className="relative w-20 h-20 rounded-lg bg-[#0d9488]/10 flex items-center justify-center">
                <ImagePlus size={20} className="text-[#0d9488]/40" />
                <button
                  onClick={() => setImages((prev) => prev.filter((__, idx) => idx !== i))}
                  className="absolute top-1 right-1 w-5 h-5 bg-black/50 rounded-full flex items-center justify-center"
                >
                  <X size={10} className="text-white" />
                </button>
              </div>
            ))}
            {images.length < 6 && (
              <button
                onClick={() => setImages((prev) => [...prev, ''])}
                className="w-20 h-20 rounded-lg border-2 border-dashed border-border-primary flex flex-col items-center justify-center gap-1 text-text-muted hover:border-[#0d9488] hover:text-[#0d9488] transition-colors"
              >
                <ImagePlus size={20} />
                <span className="text-xs">上传</span>
              </button>
            )}
          </div>
        </div>

        {/* 通用：联系方式 */}
        <div className="bg-white dark:bg-[#2d2d30] rounded-xl shadow-sm p-4">
          <p className="text-xs font-semibold text-text-muted mb-2">
            联系方式 <span className="text-red-400">*</span>
          </p>
          <input
            type="text"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="手机号或邮箱，服务商匹配后会与您联系"
            className={inputClass}
          />
          <p className="text-xs text-text-muted mt-1.5 flex items-center gap-1">
            <Info size={11} />
            联系方式仅对平台匹配的服务商可见
          </p>
        </div>

        {/* 流程说明 */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-4 text-xs text-blue-700 dark:text-blue-400 space-y-1">
          <p className="font-semibold mb-1.5">💡 定制需求流程</p>
          <p>① 填写并提交您的需求</p>
          <p>② 平台在 24 小时内为您匹配 1–3 位服务商</p>
          <p>③ 服务商主动联系您并报价</p>
          <p>④ 您选择满意的服务商，在线预约并付款</p>
        </div>
      </div>

      {/* 底部固定提交 */}
      <div className="fixed bottom-16 md:hidden left-0 right-0 bg-white dark:bg-[#2d2d30] border-t border-border-primary px-4 py-3 z-40">
        <button
          onClick={handleSubmit}
          disabled={!contact.trim() || !budget || submitting}
          className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all ${
            contact.trim() && budget && !submitting
              ? 'bg-[#0d9488] text-white hover:bg-[#0a7c71]'
              : 'bg-gray-200 dark:bg-gray-600 text-gray-400 cursor-not-allowed'
          }`}
        >
          {submitting ? '提交中...' : contact.trim() && budget ? '提交定制需求' : '请填写预算和联系方式'}
        </button>
      </div>
    </div>
  );
}
