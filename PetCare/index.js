const STORAGE_KEY = "petCareState";

const ACTIONS = [
  { type: "internalDeworm", label: "内驱虫", icon: "内", quickText: "记录一次内驱虫", intervalDays: 90, configurable: true },
  { type: "externalDeworm", label: "外驱虫", icon: "外", quickText: "记录一次外驱虫", intervalDays: 30, configurable: true },
  { type: "bath", label: "洗澡", icon: "浴", quickText: "记录一次洗澡", intervalDays: 30, configurable: true },
  { type: "walk", label: "遛狗", icon: "走", quickText: "记录一次出门", intervalDays: 1 }
];

const QUICK_ACTION_TYPES = ["internalDeworm", "externalDeworm", "bath", "walk"];

const STOOL_OPTIONS = [
  { value: "normal", label: "正常" },
  { value: "soft", label: "软便" },
  { value: "diarrhea", label: "拉稀" },
  { value: "none", label: "没拉" }
];

const CALENDAR_WEEKDAYS = ["一", "二", "三", "四", "五", "六", "日"];

const RECORD_DOT_CLASSES = {
  internalDeworm: "green",
  externalDeworm: "blue",
  bath: "amber",
  walk: "orange"
};

const HEALTH_SOURCES = {
  merckEmergency: {
    title: "Merck Veterinary Manual：犬猫急症初步评估",
    url: "https://www.merckvetmanual.com/special-pet-topics/emergencies/evaluation-and-initial-treatment-of-dog-and-cat-emergencies",
    note: "呼吸困难、休克、中毒、无法排尿等情况应优先急诊处理；稳定后再做血检、尿检、影像等检查。"
  },
  cornellFlutd: {
    title: "Cornell Feline Health Center：猫下尿路疾病",
    url: "https://www.vet.cornell.edu/departments-centers-and-institutes/cornell-feline-health-center/health-information/feline-health-topics/feline-lower-urinary-tract-disease",
    note: "猫尿频、血尿、排尿困难可能来自多种下尿路疾病；疑似尿道阻塞需要立即兽医处理。"
  },
  merckVomiting: {
    title: "Merck Veterinary Manual：犬呕吐",
    url: "https://www.merckvetmanual.com/dog-owners/digestive-disorders-of-dogs/vomiting-in-dogs",
    note: "短期呕吐通常需结合病史和体检判断；反复、长期或伴随虚弱脱水时需要进一步检查。"
  },
  merckDiarrhea: {
    title: "Merck Veterinary Manual：单胃动物腹泻用药原则",
    url: "https://www.merckvetmanual.com/pharmacology/systemic-pharmacotherapeutics-of-the-digestive-system/drugs-used-to-treat-diarrhea-in-monogastric-animals",
    note: "腹泻治疗核心包括补液、电解质和酸碱平衡管理，幼龄动物恶化可能很快。"
  },
  vcaDiarrheaTesting: {
    title: "VCA Animal Hospitals：腹泻检查",
    url: "https://vcahospitals.com/know-your-pet/testing-for-diarrhea",
    note: "多数腹泻病例需要根据体况和病史选择粪检、血常规、生化、尿检等筛查。"
  },
  merckRespiratorySigns: {
    title: "Merck Veterinary Manual：动物呼吸道症状",
    url: "https://www.merckvetmanual.com/respiratory-system/respiratory-system-introduction/clinical-signs-of-respiratory-disease-in-animals",
    note: "咳嗽、喷嚏、鼻涕、呼吸费力等可提示呼吸道病变位置和严重程度。"
  },
  merckRespiratoryDiagnostics: {
    title: "Merck Veterinary Manual：呼吸系统检查",
    url: "https://www.merckvetmanual.com/respiratory-system/respiratory-system-introduction/diagnostic-techniques-for-respiratory-disease-in-animals",
    note: "出现下呼吸道症状时，胸部影像、血氧和实验室检查常用于决定下一步治疗。"
  },
  merckEar: {
    title: "Merck Veterinary Manual：犬外耳炎",
    url: "https://www.merckvetmanual.com/dog-owners/ear-disorders-of-dogs/ear-infections-and-otitis-externa-in-dogs",
    note: "甩头、耳臭、耳红、抓挠和分泌物常见于外耳炎，治疗前通常需清洁和检查病因。"
  },
  merckDermatophyte: {
    title: "Merck Veterinary Manual：犬猫皮肤癣菌病",
    url: "https://www.merckvetmanual.com/integumentary-system/dermatophytosis/dermatophytosis-in-dogs-and-cats",
    note: "脱毛、皮屑、结痂可见于皮肤癣菌病，常用显微镜、真菌培养或PCR确认。"
  },
  merckPain: {
    title: "Merck Veterinary Manual：识别动物疼痛",
    url: "https://www.merckvetmanual.com/special-pet-topics/pain-management/recognizing-and-assessing-pain-in-animals",
    note: "动物疼痛可能表现隐蔽，行为改变、活动减少、跛行都需要结合体检评估。"
  }
};

const HEALTH_RULES = [
  {
    id: "urinary",
    species: ["cat"],
    keywords: ["尿不出", "不尿", "尿闭", "频繁蹲", "蹲猫砂", "尿血", "血尿", "尿频", "排尿困难", "排尿痛", "乱尿"],
    diagnosisTitle: "优先怀疑猫下尿路疾病，公猫需警惕尿道阻塞",
    explanation: "这些表现符合猫下尿路症状。若几乎没有尿、频繁进出猫砂盆、痛叫或精神变差，尿道阻塞会快速危及生命。",
    confidence: "中到高：症状文字命中泌尿系统高风险关键词。",
    medications: [
      "不要自行喂利尿药、止痛药或人用消炎药。",
      "到院后通常先考虑镇痛、解痉、补液；若阻塞需导尿和住院监护。",
      "抗菌药只有在尿检、培养或医生判断支持感染时才考虑。"
    ],
    testsImportant: [
      "立刻做体格检查和膀胱触诊，判断是否尿闭。",
      "尿检和尿沉渣，确认炎症、结晶、血尿或感染线索。",
      "血液生化和电解质，优先排查肾损伤和高钾风险。",
      "病情稳定后按需做X光或腹部超声查结石。"
    ],
    testsOptional: [
      "过敏原检测、粪检通常不是这类症状的首选。",
      "病情稳定前可暂缓CT、内窥镜等高级检查。"
    ],
    sources: ["cornellFlutd", "merckEmergency"]
  },
  {
    id: "digestive",
    species: ["cat", "dog"],
    keywords: ["吐", "呕吐", "腹泻", "拉稀", "软便", "便血", "黑便", "不吃", "食欲差", "没胃口", "流口水", "误食", "吃了", "肚子痛"],
    diagnosisTitle: "优先考虑胃肠炎、寄生虫、误食异物或胰腺炎等消化道问题",
    explanation: "呕吐、腹泻、食欲下降可来自饮食变化、感染、寄生虫、异物、中毒或胰腺炎。幼宠、持续呕吐、血便、明显精神差或脱水需要尽快就医。",
    confidence: "中等：消化道症状常见但病因范围较宽。",
    medications: [
      "轻症可先少量多次饮水，避免油腻食物；幼宠、频繁呕吐或血便不要在家观察太久。",
      "可与兽医讨论益生菌、口服补液、止吐药如 maropitant，具体剂量需按体重和禁忌决定。",
      "驱虫药、抗生素、止泻药应基于粪检、病史或医生判断，不建议自行套用。"
    ],
    testsImportant: [
      "先做体格检查，评估脱水、腹痛和体温。",
      "粪检优先，排查寄生虫、贾第虫等。",
      "若持续超过24小时、幼宠、精神差或便血，优先血常规、生化、电解质和尿检。",
      "怀疑异物、胰腺炎或腹痛明显时，做X光、腹部超声或胰腺相关检测。"
    ],
    testsOptional: [
      "第一次轻微软便且精神食欲正常，可先不做内窥镜、CT或过敏原检测。",
      "没有感染证据时可先不做细菌培养和抗生素敏感试验。"
    ],
    sources: ["merckVomiting", "merckDiarrhea", "vcaDiarrheaTesting"]
  },
  {
    id: "respiratory",
    species: ["cat", "dog"],
    keywords: ["咳", "咳嗽", "喷嚏", "打喷嚏", "鼻涕", "流鼻涕", "呼吸急促", "喘", "张口呼吸", "呼吸困难", "气喘"],
    diagnosisTitle: "优先考虑上呼吸道感染、气管/支气管炎、肺炎、哮喘或心肺问题",
    explanation: "喷嚏和鼻涕更偏上呼吸道，咳嗽、喘、呼吸急促或张口呼吸提示可能累及下呼吸道或心肺系统。呼吸费力属于急症。",
    confidence: "中等：需要听诊、血氧和影像区分感染、炎症、心脏或气道问题。",
    medications: [
      "呼吸困难时不要强行喂药，应先保持安静并急诊吸氧评估。",
      "可与兽医讨论雾化、支气管扩张药、抗炎药或抗菌药，前提是检查支持相应病因。",
      "不要自行喂人用感冒药、止咳药或抗生素。"
    ],
    testsImportant: [
      "先做体格检查、听诊和呼吸频率评估。",
      "呼吸急促或费力时优先测血氧，必要时先吸氧再检查。",
      "咳嗽、喘或疑似肺部问题时优先胸部X光或床旁超声。",
      "按病史选择血常规、炎症指标、病原检测或心脏相关检查。"
    ],
    testsOptional: [
      "只有轻微喷嚏、精神食欲正常时，可先不做CT或支气管镜。",
      "没有细菌感染证据时，抗生素敏感试验通常不是第一步。"
    ],
    sources: ["merckRespiratorySigns", "merckRespiratoryDiagnostics", "merckEmergency"]
  },
  {
    id: "skinEar",
    species: ["cat", "dog"],
    keywords: ["痒", "抓", "挠", "舔毛", "掉毛", "脱毛", "皮屑", "结痂", "红疹", "耳朵臭", "耳臭", "甩头", "耳螨", "耳屎"],
    diagnosisTitle: "优先考虑外耳炎、寄生虫、过敏或皮肤癣菌感染",
    explanation: "抓挠、脱毛、皮屑、结痂和耳部异味常见于皮肤或耳道问题。癣菌有传染给人的风险，耳道用药前也需要确认鼓膜和感染类型。",
    confidence: "中等：皮肤病外观相似，通常需要显微镜或细胞学确认。",
    medications: [
      "可与兽医讨论外驱虫、耳道清洁、抗真菌药或耳药，先确认病因再用药。",
      "不要在未检查鼓膜时自行滴耳药，也不要随意使用激素软膏。",
      "若怀疑癣菌，需同时做环境清洁和隔离管理。"
    ],
    testsImportant: [
      "先做皮肤和耳道体检，耳部症状优先耳镜检查。",
      "皮肤刮片、拔毛检查或胶带细胞学，排查螨虫、细菌和酵母。",
      "环形脱毛、结痂或人也发痒时，优先真菌培养或PCR。",
      "反复发作时再评估过敏、内分泌或免疫相关原因。"
    ],
    testsOptional: [
      "局部轻症且精神正常时，血常规、生化通常不是第一优先。",
      "首次发作可暂缓昂贵的过敏原筛查，除非反复或季节性明显。"
    ],
    sources: ["merckEar", "merckDermatophyte"]
  },
  {
    id: "pain",
    species: ["cat", "dog"],
    keywords: ["瘸", "跛", "不走", "不敢跳", "摔", "撞", "外伤", "疼", "痛", "骨折", "站不起来", "腿"],
    diagnosisTitle: "优先考虑软组织损伤、骨折、关节问题或疼痛性疾病",
    explanation: "跛行、拒绝活动、外伤或触碰疼痛都需要先判断是否骨折、脱位、韧带损伤或神经问题。",
    confidence: "中等：疼痛部位和严重度需要体检定位。",
    medications: [
      "限制活动，避免跳跃和奔跑。",
      "只使用兽医开的犬猫专用止痛药或抗炎药。",
      "不要自行喂布洛芬、对乙酰氨基酚、阿司匹林等人用止痛药。"
    ],
    testsImportant: [
      "先做步态观察、触诊和神经反射检查。",
      "外伤、不能负重、明显肿胀或疼痛强烈时优先X光。",
      "若怀疑感染、免疫性关节炎或全身病，再做血检和关节液检查。"
    ],
    testsOptional: [
      "轻微扭伤且24到48小时内明显好转，可暂缓CT或MRI。",
      "没有皮肤破口或发热时，细菌培养通常不是第一步。"
    ],
    sources: ["merckPain", "merckEmergency"]
  }
];

function textHasAny(text, keywords) {
  return keywords.some((keyword) => text.indexOf(keyword) >= 0);
}

function getEmergencySigns(text) {
  const signs = [
    { keyword: "呼吸困难", label: "呼吸困难" },
    { keyword: "张口呼吸", label: "张口呼吸" },
    { keyword: "抽搐", label: "抽搐或持续癫痫" },
    { keyword: "昏迷", label: "昏迷或意识异常" },
    { keyword: "站不起来", label: "无法站立" },
    { keyword: "大出血", label: "严重出血" },
    { keyword: "中毒", label: "疑似中毒" },
    { keyword: "误食药", label: "误食药物" },
    { keyword: "尿不出", label: "无法排尿" },
    { keyword: "尿闭", label: "尿闭" },
    { keyword: "难产", label: "难产" },
    { keyword: "中暑", label: "中暑" }
  ];
  return signs.filter((item) => text.indexOf(item.keyword) >= 0).map((item) => item.label);
}

function getHealthSourceList(ids) {
  return ids.map((id) => HEALTH_SOURCES[id]).filter(Boolean);
}

function buildFallbackHealthRule(hasOnlyMedia) {
  return {
    diagnosisTitle: hasOnlyMedia ? "目前只能确认已上传就诊资料，无法仅凭附件判断具体疾病" : "信息不足，暂按非特异性不适分诊",
    explanation: hasOnlyMedia
      ? "当前小程序不会自动识别图片或视频内容。请补充症状文字，例如持续多久、是否呕吐腹泻、精神食欲、排尿排便和体温。"
      : "提供的描述没有命中明确疾病方向。建议按精神、食欲、呼吸、排尿排便和疼痛表现继续补充信息。",
    confidence: "低：证据不足，不能替代兽医面诊。",
    medications: [
      "不要自行喂人用药、抗生素或止痛药。",
      "精神正常时先保证清水、安静和保暖，记录症状发生时间。",
      "若出现呼吸困难、无法排尿、抽搐、昏迷、持续呕吐、血便或明显疼痛，直接急诊。"
    ],
    testsImportant: [
      "先做体格检查和生命体征评估。",
      "若精神食欲差、症状持续或年龄很小，优先血常规、生化、电解质和尿检。",
      "根据具体症状再选择粪检、X光、超声、皮肤检查或呼吸道检查。"
    ],
    testsOptional: [
      "症状不明确时，不建议一开始就做CT、MRI、过敏原筛查或内窥镜。",
      "没有感染证据时，抗生素相关检查可后置。"
    ],
    sources: ["merckEmergency"]
  };
}

function buildHealthReport(pet, healthText, mediaFiles) {
  const text = (healthText || "").trim();
  const hasOnlyMedia = !text && mediaFiles.length > 0;
  const matchedRule = HEALTH_RULES.find((rule) => (
    rule.species.includes(pet.type) && textHasAny(text, rule.keywords)
  ));
  const rule = matchedRule || buildFallbackHealthRule(hasOnlyMedia);
  const emergencySigns = getEmergencySigns(text);
  const sourceIds = [...rule.sources];
  if (emergencySigns.length && !sourceIds.includes("merckEmergency")) {
    sourceIds.unshift("merckEmergency");
  }

  return {
    urgent: emergencySigns.length > 0,
    statusText: emergencySigns.length ? `急诊优先：${emergencySigns.join("、")}` : "可先按症状分诊，持续或加重请就医",
    diagnosisTitle: rule.diagnosisTitle,
    explanation: rule.explanation,
    confidenceText: rule.confidence,
    evidenceText: text || "未填写文字症状；已上传的图片/视频可作为就诊资料，但本地规则无法自动读图或读视频。",
    mediaSummary: mediaFiles.length ? `已上传 ${mediaFiles.length} 个附件（图片/视频可给兽医查看）` : "未上传附件",
    medications: rule.medications,
    testsImportant: emergencySigns.length
      ? ["先去急诊稳定生命体征，再由医生决定后续检查。", ...rule.testsImportant]
      : rule.testsImportant,
    testsOptional: rule.testsOptional,
    sources: getHealthSourceList(sourceIds)
  };
}

const DEFAULT_AVATARS = {
  cat: "data:image/svg+xml;utf8,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%20120%20120'%3E%3Crect%20width='120'%20height='120'%20rx='28'%20fill='%23ffe7b8'/%3E%3Cpath%20d='M32%2051%2025%2026%2049%2039M88%2051%2095%2026%2071%2039'%20fill='%23ffb85c'/%3E%3Ccircle%20cx='60'%20cy='64'%20r='35'%20fill='%23ffcb7b'/%3E%3Ccircle%20cx='47'%20cy='58'%20r='5'%20fill='%23242426'/%3E%3Ccircle%20cx='73'%20cy='58'%20r='5'%20fill='%23242426'/%3E%3Cpath%20d='M55%2072h10l-5%206z'%20fill='%23ff7777'/%3E%3Cpath%20d='M47%2078c8%208%2018%208%2026%200'%20fill='none'%20stroke='%23242426'%20stroke-width='4'%20stroke-linecap='round'/%3E%3C/svg%3E",
  dog: "data:image/svg+xml;utf8,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%20120%20120'%3E%3Crect%20width='120'%20height='120'%20rx='28'%20fill='%23dff6ff'/%3E%3Cellipse%20cx='34'%20cy='56'%20rx='15'%20ry='25'%20fill='%23986a3b'/%3E%3Cellipse%20cx='86'%20cy='56'%20rx='15'%20ry='25'%20fill='%23986a3b'/%3E%3Ccircle%20cx='60'%20cy='64'%20r='36'%20fill='%23f0c07a'/%3E%3Ccircle%20cx='47'%20cy='59'%20r='5'%20fill='%23242426'/%3E%3Ccircle%20cx='73'%20cy='59'%20r='5'%20fill='%23242426'/%3E%3Cellipse%20cx='60'%20cy='72'%20rx='9'%20ry='7'%20fill='%23242426'/%3E%3Cpath%20d='M50%2082c7%207%2013%207%2020%200'%20fill='none'%20stroke='%23242426'%20stroke-width='4'%20stroke-linecap='round'/%3E%3C/svg%3E"
};

const DEFAULT_STATE = {
  pets: [
    { id: "pet-cat", name: "小橘", type: "cat", birthMonth: "2025-05", weight: "4.2", careIntervals: { internalDeworm: 90, externalDeworm: 30, bath: 180 } },
    { id: "pet-dog", name: "豆豆", type: "dog", birthMonth: "2023-05", weight: "12.5", careIntervals: { internalDeworm: 90, externalDeworm: 30, bath: 30 } }
  ],
  activePetId: "pet-cat",
  records: []
};

const LEGACY_ACTIONS = {
  deworm: { label: "驱虫" }
};

function getAvailableActions(pet) {
  if (!pet) return [];
  return ACTIONS.filter((action) => pet.type === "dog" || action.type !== "walk");
}

function getDefaultIntervals(type) {
  return {
    internalDeworm: 90,
    externalDeworm: 30,
    bath: type === "cat" ? 180 : 30
  };
}

function getWalkTimesPerDay(value) {
  const times = Number(value);
  return times > 0 ? Math.min(Math.round(times), 8) : 2;
}

function normalizeIntervals(type, intervals = {}) {
  const defaults = getDefaultIntervals(type);
  return Object.keys(defaults).reduce((result, key) => {
    const value = Number(intervals[key]);
    result[key] = value > 0 ? value : defaults[key];
    return result;
  }, {});
}

function normalizePet(pet) {
  return {
    ...pet,
    birthMonth: pet.birthMonth || inferBirthMonthFromAge(pet.age) || monthKey(),
    weight: pet.weight || "",
    avatarUrl: pet.avatarUrl || "",
    walkTimesPerDay: getWalkTimesPerDay(pet.walkTimesPerDay),
    careIntervals: normalizeIntervals(pet.type, pet.careIntervals)
  };
}

function createDefaultPetForm(type = "cat") {
  return {
    name: "",
    type,
    birthMonth: monthKey(),
    weight: "",
    avatarUrl: "",
    walkTimesPerDay: type === "dog" ? 2 : 0,
    careIntervals: getDefaultIntervals(type)
  };
}

function getPetAvatarSrc(pet = {}) {
  return pet.avatarUrl || DEFAULT_AVATARS[pet.type] || DEFAULT_AVATARS.cat;
}

function getActionLabel(type) {
  const action = ACTIONS.find((item) => item.type === type) || LEGACY_ACTIONS[type];
  return action ? action.label : "其他";
}

function getCareInterval(pet, action) {
  if (!action.configurable) return action.intervalDays;
  return normalizeIntervals(pet.type, pet.careIntervals)[action.type];
}

function todayKey(date = new Date()) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function timeKey(date = new Date()) {
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");
  return `${hours}:${minutes}`;
}

function monthKey(date = new Date()) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  return `${year}-${month}`;
}

function formatCalendarTitle(value) {
  const [year, month] = value.split("-").map(Number);
  return `${year}年${month}月`;
}

function getDateKey(year, month, day) {
  return `${year}-${`${month}`.padStart(2, "0")}-${`${day}`.padStart(2, "0")}`;
}

function getMonthDateKey(monthValue, day = 1) {
  const [year, month] = monthValue.split("-").map(Number);
  return getDateKey(year, month, day);
}

function shiftMonth(value, offset) {
  const [year, month] = value.split("-").map(Number);
  const date = new Date(year, month - 1 + offset, 1);
  return monthKey(date);
}

function inferBirthMonthFromAge(age) {
  const match = String(age || "").match(/\d+/);
  const years = Number(match ? match[0] : 0);
  if (!years) return "";
  const date = new Date();
  date.setFullYear(date.getFullYear() - years);
  return monthKey(date);
}

function formatPetAge(birthMonth) {
  if (!birthMonth) return "年龄未填";
  const [birthYear, birthMonthIndex] = birthMonth.split("-").map(Number);
  if (!birthYear || !birthMonthIndex) return "年龄未填";

  const now = new Date();
  let months = (now.getFullYear() - birthYear) * 12 + now.getMonth() + 1 - birthMonthIndex;
  if (months < 0) months = 0;
  const years = Math.floor(months / 12);
  const restMonths = months % 12;

  if (years === 0) return `${restMonths}个月`;
  if (restMonths === 0) return `${years}岁`;
  return `${years}岁${restMonths}个月`;
}

function formatWeight(weight) {
  return weight ? `${weight} kg` : "体重未填";
}

function formatDate(value) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatHeaderDate(date = new Date()) {
  const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

function parseDateKey(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

function parseDateTimeKey(dateValue, timeValue) {
  const [year, month, day] = dateValue.split("-").map(Number);
  const [hours, minutes] = (timeValue || "12:00").split(":").map(Number);
  return new Date(year, month - 1, day, hours || 0, minutes || 0, 0, 0);
}

function getStoolLabel(value) {
  const option = STOOL_OPTIONS.find((item) => item.value === value);
  return option ? option.label : "正常";
}

function buildRecordDots(records) {
  const usedTypes = [];
  records.forEach((record) => {
    if (!usedTypes.includes(record.type)) {
      usedTypes.push(record.type);
    }
  });
  return usedTypes.slice(0, 4).map((type) => ({
    type,
    dotClass: RECORD_DOT_CLASSES[type] || "gray"
  }));
}

function buildCalendarDays(monthValue, records, selectedDate) {
  const [year, month] = monthValue.split("-").map(Number);
  const firstDay = new Date(year, month - 1, 1);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const startDate = new Date(year, month - 1, 1 - startOffset);
  const today = todayKey();

  return Array.from({ length: 42 }).map((_, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);
    const dateKey = getDateKey(date.getFullYear(), date.getMonth() + 1, date.getDate());
    const dayRecords = records.filter((record) => formatDate(record.createdAt) === dateKey);
    return {
      dateKey,
      dayText: date.getDate(),
      inMonth: date.getMonth() === month - 1,
      isToday: dateKey === today,
      selected: dateKey === selectedDate,
      dots: buildRecordDots(dayRecords)
    };
  });
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

Page({
  data: {
    activeTab: "home",
    pets: [],
    displayPets: [],
    activePetId: "",
    activePet: null,
    actions: ACTIONS,
    quickActions: [],
    actionLabels: ACTIONS.map((item) => item.label),
    stoolOptions: STOOL_OPTIONS,
    calendarWeekdays: CALENDAR_WEEKDAYS,
    calendarMonth: monthKey(),
    calendarTitle: formatCalendarTitle(monthKey()),
    calendarDays: [],
    selectedCalendarDate: todayKey(),
    selectedCalendarDateText: todayKey(),
    selectedDayRecords: [],
    allRecords: [],
    displayRecords: [],
    overviewItems: [],
    currentDateText: formatHeaderDate(),
    petFormVisible: false,
    recordFormVisible: false,
    detailDrawerVisible: false,
    detailActionLabel: "",
    detailActionType: "",
    detailRecords: [],
    editingPetId: "",
    petForm: createDefaultPetForm(),
    petFormAvatarSrc: getPetAvatarSrc(createDefaultPetForm()),
    birthMaxMonth: monthKey(),
    recordTypeIndex: 0,
    selectedRecordType: "",
    recordDate: todayKey(),
    recordMaxDate: todayKey(),
    recordDuePreview: "",
    recordNote: "",
    walkTime: timeKey(),
    walkDuration: "20",
    stoolStatus: "normal",
    healthText: "",
    healthMediaFiles: [],
    healthResult: null
  },

  onLoad() {
    if (wx.showShareMenu) {
      wx.showShareMenu({
        withShareTicket: true,
        menus: ["shareAppMessage", "shareTimeline"]
      });
    }

    const saved = wx.getStorageSync(STORAGE_KEY);
    const state = saved
      ? { ...saved, allRecords: saved.allRecords || saved.records || [] }
      : { ...DEFAULT_STATE, allRecords: DEFAULT_STATE.records };
    state.pets = (state.pets || []).map(normalizePet);
    state.allRecords = (state.allRecords || []).filter((record) => record.type !== "poop");
    this.setData(state, () => this.refreshView());
  },

  onShareAppMessage() {
    const petName = this.data.activePet ? this.data.activePet.name : "猫狗";
    return {
      title: `${petName}的照护记录，护理和健康都能记`,
      path: "/pages/index/index"
    };
  },

  onShareTimeline() {
    const petName = this.data.activePet ? this.data.activePet.name : "猫狗";
    return {
      title: `${petName}的宠物照护记录`,
      query: ""
    };
  },

  persist() {
    wx.setStorageSync(STORAGE_KEY, {
      pets: this.data.pets,
      activePetId: this.data.activePetId,
      allRecords: this.data.allRecords
    });
  },

  refreshView() {
    const activePet = this.data.pets.find((pet) => pet.id === this.data.activePetId) || null;
    const petRecords = this.data.allRecords
      .filter((record) => record.petId === this.data.activePetId)
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((record) => ({
        ...record,
        label: getActionLabel(record.type),
        dateText: record.type === "walk" && record.walkTime
          ? `${formatDate(record.createdAt)} ${record.walkTime}`
          : formatDate(record.createdAt)
      }));

    const actions = getAvailableActions(activePet);
    const calendarMonth = this.data.calendarMonth || monthKey();
    const selectedCalendarDate = this.data.selectedCalendarDate || todayKey();
    const selectedDayRecords = petRecords.filter((record) => formatDate(record.createdAt) === selectedCalendarDate);

    this.setData({
      activePet: activePet ? {
        ...activePet,
        typeLabel: activePet.type === "dog" ? "狗狗" : "猫咪",
        ageText: formatPetAge(activePet.birthMonth),
        weightText: formatWeight(activePet.weight),
        avatarSrc: getPetAvatarSrc(activePet)
      } : null,
      displayPets: this.data.pets.map((pet) => ({
        ...pet,
        typeText: pet.type === "dog" ? "狗狗" : "猫咪",
        avatarText: pet.type === "dog" ? "狗" : "猫",
        avatarSrc: getPetAvatarSrc(pet),
        weightText: formatWeight(pet.weight),
        walkTimesPerDay: getWalkTimesPerDay(pet.walkTimesPerDay)
      })),
      actions,
      quickActions: actions.filter((action) => QUICK_ACTION_TYPES.includes(action.type)),
      actionLabels: actions.map((item) => item.label),
      displayRecords: petRecords,
      calendarTitle: formatCalendarTitle(calendarMonth),
      calendarDays: buildCalendarDays(calendarMonth, petRecords, selectedCalendarDate),
      selectedCalendarDate,
      selectedCalendarDateText: selectedCalendarDate,
      selectedDayRecords,
      overviewItems: this.buildOverviewItems(petRecords, activePet, actions),
      detailRecords: this.data.detailActionType ? this.filterRecordsByType(petRecords, this.data.detailActionType) : this.data.detailRecords,
      recordTypeIndex: Math.min(this.data.recordTypeIndex, Math.max(actions.length - 1, 0))
    });
    this.persist();
  },

  buildOverviewItems(records, pet, actions = this.data.actions) {
    return actions.map((action, index) => ({
      type: action.type,
      label: action.label,
      ...this.buildActionSummary(records, pet, action),
      tone: index % 4
    }));
  },

  buildActionSummary(records, pet, action) {
    const actionRecords = this.filterRecordsByType(records, action.type);
    const latest = actionRecords[0];
    if (action.type === "walk" && pet) {
      const today = todayKey();
      const todayWalkCount = actionRecords.filter((record) => formatDate(record.createdAt) === today).length;
      const targetCount = getWalkTimesPerDay(pet.walkTimesPerDay);
      const remainingCount = Math.max(targetCount - todayWalkCount, 0);
      return {
        count: todayWalkCount,
        lastText: latest ? latest.dateText : "未记录",
        nextText: remainingCount > 0 ? `今日还需 ${remainingCount} 次` : "今日已完成",
        nextStatus: remainingCount > 0 ? "soon" : "ok"
      };
    }

    if (!latest || !pet) {
      return {
        count: actionRecords.length,
        lastText: "未记录",
        nextText: "暂无",
        nextStatus: "warn"
      };
    }

    const nextDate = addDays(new Date(latest.createdAt), getCareInterval(pet, action));
    const diffDays = Math.ceil((nextDate - new Date()) / 86400000);
    return {
      count: actionRecords.length,
      lastText: latest.dateText,
      nextText: diffDays < 0 ? `已超 ${Math.abs(diffDays)} 天` : diffDays === 0 ? "今天" : `${diffDays} 天`,
      nextStatus: diffDays <= 0 ? "warn" : diffDays <= 3 ? "soon" : "ok"
    };
  },

  filterRecordsByType(records, type) {
    return records.filter((record) => record.type === type);
  },

  selectPet(event) {
    this.setData({ activePetId: event.currentTarget.dataset.id }, () => this.refreshView());
  },

  setActiveTab(event) {
    const tab = event.currentTarget.dataset.tab;
    this.setData({ activeTab: tab });
  },

  changeCalendarMonth(event) {
    const offset = Number(event.currentTarget.dataset.offset || 0);
    const calendarMonth = shiftMonth(this.data.calendarMonth, offset);
    const selectedCalendarDate = getMonthDateKey(calendarMonth);
    this.setData({
      calendarMonth,
      selectedCalendarDate
    }, () => this.refreshView());
  },

  selectCalendarDate(event) {
    const selectedCalendarDate = event.currentTarget.dataset.date;
    const calendarMonth = monthKey(parseDateKey(selectedCalendarDate));
    this.setData({
      selectedCalendarDate,
      calendarMonth
    }, () => this.refreshView());
  },

  updateHealthText(event) {
    this.setData({ healthText: event.detail.value });
  },

  chooseHealthMedia(event) {
    const type = event.currentTarget.dataset.type || "image";
    const remainingCount = 6 - this.data.healthMediaFiles.length;
    if (remainingCount <= 0) {
      wx.showToast({ title: "最多上传6个附件", icon: "none" });
      return;
    }

    const appendMedia = (files) => {
      if (!files.length) return;
      const nextFiles = [
        ...this.data.healthMediaFiles,
        ...files.map((file) => ({
          id: `media-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          type,
          path: file.tempFilePath || file,
          sizeText: file.size ? `${Math.max(1, Math.round(file.size / 1024))} KB` : ""
        }))
      ].slice(0, 6);
      this.setData({ healthMediaFiles: nextFiles });
    };

    if (wx.chooseMedia) {
      wx.chooseMedia({
        count: remainingCount,
        mediaType: [type],
        sourceType: ["album", "camera"],
        success: (result) => appendMedia(result.tempFiles || [])
      });
      return;
    }

    if (type === "video" && wx.chooseVideo) {
      wx.chooseVideo({
        sourceType: ["album", "camera"],
        success: (result) => appendMedia([{ tempFilePath: result.tempFilePath, size: result.size }])
      });
      return;
    }

    wx.chooseImage({
      count: remainingCount,
      sourceType: ["album", "camera"],
      sizeType: ["compressed"],
      success: (result) => appendMedia((result.tempFilePaths || []).map((path) => ({ tempFilePath: path })))
    });
  },

  removeHealthMedia(event) {
    const id = event.currentTarget.dataset.id;
    this.setData({
      healthMediaFiles: this.data.healthMediaFiles.filter((file) => file.id !== id)
    });
  },

  analyzeHealth() {
    if (!this.data.activePet) {
      wx.showToast({ title: "请先添加宠物", icon: "none" });
      return;
    }

    if (!this.data.healthText.trim() && this.data.healthMediaFiles.length === 0) {
      wx.showToast({ title: "请填写症状或上传附件", icon: "none" });
      return;
    }

    this.setData({
      healthResult: buildHealthReport(this.data.activePet, this.data.healthText, this.data.healthMediaFiles)
    });
  },

  clearHealthForm() {
    this.setData({
      healthText: "",
      healthMediaFiles: [],
      healthResult: null
    });
  },

  editPetFromList(event) {
    const petId = event.currentTarget.dataset.id;
    const pet = this.data.pets.find((item) => item.id === petId);
    if (!pet) return;
    this.setData({
      activePetId: petId,
      petFormVisible: true,
      editingPetId: pet.id,
      petForm: {
        name: pet.name,
        type: pet.type,
        birthMonth: pet.birthMonth || monthKey(),
        weight: pet.weight || "",
        avatarUrl: pet.avatarUrl || "",
        walkTimesPerDay: getWalkTimesPerDay(pet.walkTimesPerDay),
        careIntervals: normalizeIntervals(pet.type, pet.careIntervals)
      },
      petFormAvatarSrc: getPetAvatarSrc(pet)
    }, () => this.refreshView());
  },

  quickRecord(event) {
    const action = this.data.actions.find((item) => item.type === event.currentTarget.dataset.type);
    if (!action) return;
    const recordTypeIndex = this.data.actions.findIndex((item) => item.type === action.type);
    this.showRecordForm(recordTypeIndex);
  },

  showQuickDrawer() {
    const firstQuickAction = this.data.quickActions[0];
    const recordTypeIndex = this.data.actions.findIndex((item) => firstQuickAction && item.type === firstQuickAction.type);
    this.setData({
      recordFormVisible: true,
      recordTypeIndex: recordTypeIndex >= 0 ? recordTypeIndex : 0,
      selectedRecordType: firstQuickAction ? firstQuickAction.type : "",
      recordDate: todayKey(),
      recordMaxDate: todayKey(),
      recordDuePreview: "",
      recordNote: "",
      walkTime: timeKey(),
      walkDuration: "20",
      stoolStatus: "normal"
    }, () => this.updateRecordDuePreview());
  },

  hideQuickDrawer() {
    this.setData({ recordFormVisible: false });
  },

  selectQuickAction(event) {
    const type = event.currentTarget.dataset.type;
    const recordTypeIndex = this.data.actions.findIndex((item) => item.type === type);
    if (recordTypeIndex < 0) return;
    this.setData({ recordTypeIndex, selectedRecordType: type }, () => this.updateRecordDuePreview());
  },

  addRecord(type, note, dateKey = todayKey(), extra = {}) {
    if (!this.data.activePetId || type === "poop") return;
    const recordDate = type === "walk" ? parseDateTimeKey(dateKey, extra.walkTime) : parseDateKey(dateKey);
    const record = {
      id: `record-${Date.now()}`,
      petId: this.data.activePetId,
      type,
      note,
      createdAt: recordDate.getTime(),
      ...extra
    };
    this.setData({ allRecords: [record, ...this.data.allRecords] }, () => {
      this.refreshView();
      wx.showToast({ title: "已记录", icon: "success" });
    });
  },

  deleteRecord(event) {
    const id = event.currentTarget.dataset.id;
    this.setData({ allRecords: this.data.allRecords.filter((record) => record.id !== id) }, () => this.refreshView());
  },

  showActionDetail(event) {
    const type = event.currentTarget.dataset.type;
    const action = this.data.actions.find((item) => item.type === type);
    if (!action) return;
    this.setData({
      detailDrawerVisible: true,
      detailActionType: type,
      detailActionLabel: action.label,
      detailRecords: this.filterRecordsByType(this.data.displayRecords, type)
    });
  },

  hideActionDetail() {
    this.setData({
      detailDrawerVisible: false,
      detailActionType: "",
      detailActionLabel: "",
      detailRecords: []
    });
  },

  noop() {},

  showAddPetForm() {
    const petForm = createDefaultPetForm();
    this.setData({
      petFormVisible: true,
      editingPetId: "",
      petForm,
      petFormAvatarSrc: getPetAvatarSrc(petForm)
    });
  },

  showEditPetForm() {
    const pet = this.data.activePet;
    if (!pet) {
      this.showAddPetForm();
      return;
    }
    this.setData({
      petFormVisible: true,
      editingPetId: pet.id,
      petForm: {
        name: pet.name,
        type: pet.type,
        birthMonth: pet.birthMonth || monthKey(),
        weight: pet.weight || "",
        avatarUrl: pet.avatarUrl || "",
        walkTimesPerDay: getWalkTimesPerDay(pet.walkTimesPerDay),
        careIntervals: normalizeIntervals(pet.type, pet.careIntervals)
      },
      petFormAvatarSrc: getPetAvatarSrc(pet)
    });
  },

  hidePetForm() {
    this.setData({ petFormVisible: false });
  },

  deletePet() {
    const petId = this.data.editingPetId;
    const pet = this.data.pets.find((item) => item.id === petId);
    if (!pet) return;

    wx.showModal({
      title: "删除宠物",
      content: `确定删除${pet.name}吗？相关护理记录也会一起删除。`,
      confirmText: "删除",
      confirmColor: "#ff7777",
      success: (result) => {
        if (!result.confirm) return;
        const pets = this.data.pets.filter((item) => item.id !== petId);
        const nextActivePet = pets[0] || null;
        this.setData({
          pets,
          activePetId: nextActivePet ? nextActivePet.id : "",
          allRecords: this.data.allRecords.filter((record) => record.petId !== petId),
          petFormVisible: false,
          editingPetId: "",
          detailDrawerVisible: false,
          detailActionType: "",
          detailActionLabel: "",
          detailRecords: []
        }, () => {
          this.refreshView();
          wx.showToast({ title: "已删除", icon: "success" });
        });
      }
    });
  },

  updatePetForm(event) {
    const field = event.currentTarget.dataset.field;
    this.setData({ [`petForm.${field}`]: event.detail.value });
  },

  setPetType(event) {
    const nextType = event.currentTarget.dataset.type;
    const currentType = this.data.petForm.type;
    const currentIntervals = normalizeIntervals(currentType, this.data.petForm.careIntervals);
    const currentDefaults = getDefaultIntervals(currentType);
    const nextDefaults = getDefaultIntervals(nextType);
    const careIntervals = {
      ...currentIntervals,
      bath: currentIntervals.bath === currentDefaults.bath ? nextDefaults.bath : currentIntervals.bath
    };
    this.setData({
      "petForm.type": nextType,
      "petForm.walkTimesPerDay": nextType === "dog" ? getWalkTimesPerDay(this.data.petForm.walkTimesPerDay) : 0,
      "petForm.careIntervals": normalizeIntervals(nextType, careIntervals),
      petFormAvatarSrc: this.data.petForm.avatarUrl ? this.data.petFormAvatarSrc : getPetAvatarSrc({ type: nextType })
    });
  },

  choosePetAvatar() {
    const saveAvatar = (tempFilePath) => {
      if (!tempFilePath) return;
      const setAvatar = (avatarUrl) => {
        this.setData({
          "petForm.avatarUrl": avatarUrl,
          petFormAvatarSrc: avatarUrl
        });
      };

      if (!wx.saveFile) {
        setAvatar(tempFilePath);
        return;
      }

      wx.saveFile({
        tempFilePath,
        success: (result) => setAvatar(result.savedFilePath || tempFilePath),
        fail: () => setAvatar(tempFilePath)
      });
    };

    if (wx.chooseMedia) {
      wx.chooseMedia({
        count: 1,
        mediaType: ["image"],
        sourceType: ["album", "camera"],
        success: (result) => {
          const file = result.tempFiles && result.tempFiles[0];
          saveAvatar(file && file.tempFilePath);
        }
      });
      return;
    }

    wx.chooseImage({
      count: 1,
      sourceType: ["album", "camera"],
      sizeType: ["compressed"],
      success: (result) => saveAvatar(result.tempFilePaths && result.tempFilePaths[0])
    });
  },

  setPetBirthMonth(event) {
    this.setData({ "petForm.birthMonth": event.detail.value });
  },

  updateCareInterval(event) {
    const field = event.currentTarget.dataset.field;
    this.setData({ [`petForm.careIntervals.${field}`]: event.detail.value });
  },

  savePet() {
    const name = this.data.petForm.name.trim();
    if (!name) {
      wx.showToast({ title: "请填写名字", icon: "none" });
      return;
    }
    const petForm = {
      ...this.data.petForm,
      weight: `${this.data.petForm.weight || ""}`.trim(),
      birthMonth: this.data.petForm.birthMonth || monthKey(),
      walkTimesPerDay: this.data.petForm.type === "dog" ? getWalkTimesPerDay(this.data.petForm.walkTimesPerDay) : 0,
      careIntervals: normalizeIntervals(this.data.petForm.type, this.data.petForm.careIntervals)
    };

    if (this.data.editingPetId) {
      const pets = this.data.pets.map((pet) => (
        pet.id === this.data.editingPetId ? { ...pet, ...petForm, name } : pet
      ));
      this.setData({ pets, petFormVisible: false }, () => this.refreshView());
      return;
    }

    const pet = { ...petForm, name, id: `pet-${Date.now()}` };
    this.setData({
      pets: [...this.data.pets, pet],
      activePetId: pet.id,
      petFormVisible: false
    }, () => this.refreshView());
  },

  showRecordForm(recordTypeIndex = 0) {
    if (this.data.actions.length === 0) return;
    const safeIndex = Math.min(recordTypeIndex, this.data.actions.length - 1);
    this.setData({
      recordFormVisible: true,
      recordTypeIndex: safeIndex,
      selectedRecordType: this.data.actions[safeIndex].type,
      recordDate: todayKey(),
      recordMaxDate: todayKey(),
      recordNote: "",
      walkTime: timeKey(),
      walkDuration: "20",
      stoolStatus: "normal"
    }, () => this.updateRecordDuePreview());
  },

  hideRecordForm() {
    this.setData({ recordFormVisible: false });
  },

  setRecordType(event) {
    const recordTypeIndex = Number(event.detail.value);
    this.setData({
      recordTypeIndex,
      selectedRecordType: this.data.actions[recordTypeIndex].type
    }, () => this.updateRecordDuePreview());
  },

  setRecordDate(event) {
    this.setData({ recordDate: event.detail.value }, () => this.updateRecordDuePreview());
  },

  updateRecordNote(event) {
    this.setData({ recordNote: event.detail.value });
  },

  setWalkTime(event) {
    this.setData({ walkTime: event.detail.value });
  },

  updateWalkDuration(event) {
    this.setData({ walkDuration: event.detail.value });
  },

  setStoolStatus(event) {
    this.setData({ stoolStatus: event.currentTarget.dataset.value || "normal" });
  },

  updateRecordDuePreview() {
    const action = this.data.actions[this.data.recordTypeIndex];
    const pet = this.data.activePet;
    if (!action || !pet) {
      this.setData({ recordDuePreview: "" });
      return;
    }

    if (action.type === "walk") {
      const targetCount = getWalkTimesPerDay(pet.walkTimesPerDay);
      const todayWalkCount = this.data.displayRecords.filter((record) => (
        record.type === "walk" && formatDate(record.createdAt) === todayKey()
      )).length;
      const remainingCount = Math.max(targetCount - todayWalkCount, 0);
      this.setData({
        recordDuePreview: remainingCount > 0
          ? `今日遛狗目标：${targetCount} 次，已记录 ${todayWalkCount} 次，还需 ${remainingCount} 次`
          : `今日遛狗目标：${targetCount} 次，已完成`
      });
      return;
    }

    const intervalDays = getCareInterval(pet, action);
    const nextDate = addDays(parseDateKey(this.data.recordDate), intervalDays);
    const diffDays = Math.ceil((nextDate - new Date()) / 86400000);
    const dueText = diffDays < 0 ? `已超 ${Math.abs(diffDays)} 天` : diffDays === 0 ? "今天" : `还需 ${diffDays} 天`;
    this.setData({
      recordDuePreview: `下次${action.label}：${dueText}（${formatDate(nextDate)}）`
    });
  },

  saveCustomRecord() {
    const action = this.data.actions[this.data.recordTypeIndex];
    if (!action) return;
    const trimmedNote = this.data.recordNote.trim();
    const isWalk = action.type === "walk";
    const walkDuration = Math.max(1, Number(this.data.walkDuration) || 20);
    const note = isWalk
      ? [`遛狗时间：${this.data.walkTime}`, `时长：${walkDuration}分钟`, `便便：${getStoolLabel(this.data.stoolStatus)}`, trimmedNote].filter(Boolean).join(" · ")
      : trimmedNote || action.quickText;
    const extra = isWalk
      ? { walkTime: this.data.walkTime, walkDuration, stoolStatus: this.data.stoolStatus, stoolLabel: getStoolLabel(this.data.stoolStatus) }
      : {};

    this.setData({ recordFormVisible: false }, () => {
      this.addRecord(action.type, note, this.data.recordDate, extra);
    });
  }
});
