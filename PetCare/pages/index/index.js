const STORAGE_KEY = "petCareState";

const ACTIONS = [
  { type: "internalDeworm", label: "内驱虫", icon: "内", quickText: "记录一次内驱虫", intervalDays: 90, configurable: true },
  { type: "externalDeworm", label: "外驱虫", icon: "外", quickText: "记录一次外驱虫", intervalDays: 30, configurable: true },
  { type: "bath", label: "洗澡", icon: "浴", quickText: "记录一次洗澡", intervalDays: 30, configurable: true },
  { type: "walk", label: "遛狗", icon: "走", quickText: "记录一次出门", intervalDays: 1 }
];

const QUICK_ACTION_TYPES = ["internalDeworm", "externalDeworm", "bath"];

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
    careIntervals: normalizeIntervals(pet.type, pet.careIntervals)
  };
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

function monthKey(date = new Date()) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  return `${year}-${month}`;
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

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

Page({
  data: {
    pets: [],
    activePetId: "",
    activePet: null,
    actions: ACTIONS,
    quickActions: [],
    actionLabels: ACTIONS.map((item) => item.label),
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
    petForm: { name: "", type: "cat", birthMonth: monthKey(), weight: "", careIntervals: getDefaultIntervals("cat") },
    birthMaxMonth: monthKey(),
    recordTypeIndex: 0,
    selectedRecordType: "",
    recordDate: todayKey(),
    recordMaxDate: todayKey(),
    recordDuePreview: "",
    recordNote: ""
  },

  onLoad() {
    const saved = wx.getStorageSync(STORAGE_KEY);
    const state = saved
      ? { ...saved, allRecords: saved.allRecords || saved.records || [] }
      : { ...DEFAULT_STATE, allRecords: DEFAULT_STATE.records };
    state.pets = (state.pets || []).map(normalizePet);
    state.allRecords = (state.allRecords || []).filter((record) => record.type !== "poop");
    this.setData(state, () => this.refreshView());
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
        dateText: formatDate(record.createdAt)
      }));

    const actions = getAvailableActions(activePet);

    this.setData({
      activePet: activePet ? {
        ...activePet,
        typeLabel: activePet.type === "dog" ? "狗狗" : "猫咪",
        ageText: formatPetAge(activePet.birthMonth),
        weightText: formatWeight(activePet.weight)
      } : null,
      actions,
      quickActions: actions.filter((action) => QUICK_ACTION_TYPES.includes(action.type)),
      actionLabels: actions.map((item) => item.label),
      displayRecords: petRecords,
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
      recordNote: ""
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

  addRecord(type, note, dateKey = todayKey()) {
    if (!this.data.activePetId || type === "poop") return;
    const recordDate = parseDateKey(dateKey);
    const record = {
      id: `record-${Date.now()}`,
      petId: this.data.activePetId,
      type,
      note,
      createdAt: recordDate.getTime()
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

  showPetForm() {
    const pet = this.data.activePet;
    this.setData({
      petFormVisible: true,
      editingPetId: pet ? pet.id : "",
      petForm: pet
        ? { name: pet.name, type: pet.type, birthMonth: pet.birthMonth || monthKey(), weight: pet.weight || "", careIntervals: normalizeIntervals(pet.type, pet.careIntervals) }
        : { name: "", type: "cat", birthMonth: monthKey(), weight: "", careIntervals: getDefaultIntervals("cat") }
    });
  },

  hidePetForm() {
    this.setData({ petFormVisible: false });
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
      "petForm.careIntervals": normalizeIntervals(nextType, careIntervals)
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
      recordNote: ""
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

  updateRecordDuePreview() {
    const action = this.data.actions[this.data.recordTypeIndex];
    const pet = this.data.activePet;
    if (!action || !pet) {
      this.setData({ recordDuePreview: "" });
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
    this.setData({ recordFormVisible: false }, () => {
      this.addRecord(action.type, this.data.recordNote.trim() || action.quickText, this.data.recordDate);
    });
  }
});
