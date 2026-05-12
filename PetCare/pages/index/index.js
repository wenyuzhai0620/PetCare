const STORAGE_KEY = "petCareState";

const ACTIONS = [
  { type: "internalDeworm", label: "内驱虫", icon: "内", quickText: "记录一次内驱虫", intervalDays: 90, configurable: true },
  { type: "externalDeworm", label: "外驱虫", icon: "外", quickText: "记录一次外驱虫", intervalDays: 30, configurable: true },
  { type: "bath", label: "洗澡", icon: "浴", quickText: "记录一次洗澡", intervalDays: 30, configurable: true },
  { type: "walk", label: "遛狗", icon: "走", quickText: "记录一次出门", intervalDays: 1 },
  { type: "poop", label: "拉屎", icon: "便", quickText: "次数 +1", intervalDays: 1 }
];

const DEFAULT_STATE = {
  pets: [
    { id: "pet-cat", name: "小橘", type: "cat", age: "1岁", careIntervals: { internalDeworm: 90, externalDeworm: 30, bath: 180 } },
    { id: "pet-dog", name: "豆豆", type: "dog", age: "3岁", careIntervals: { internalDeworm: 90, externalDeworm: 30, bath: 30 } }
  ],
  activePetId: "pet-cat",
  records: []
};

const LEGACY_ACTIONS = {
  deworm: { label: "驱虫" }
};

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

function formatDate(value) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
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
    actionLabels: ACTIONS.map((item) => item.label),
    allRecords: [],
    displayRecords: [],
    todayStats: {},
    todayStatItems: [],
    reminders: [],
    petFormVisible: false,
    recordFormVisible: false,
    editingPetId: "",
    petForm: { name: "", type: "cat", age: "", careIntervals: getDefaultIntervals("cat") },
    recordTypeIndex: 0,
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

    this.setData({
      activePet: activePet ? { ...activePet, typeLabel: activePet.type === "dog" ? "狗狗" : "猫咪" } : null,
      displayRecords: petRecords,
      todayStats: this.buildTodayStats(petRecords),
      todayStatItems: this.buildTodayStatItems(petRecords),
      reminders: this.buildReminders(petRecords, activePet)
    });
    this.persist();
  },

  buildTodayStats(records) {
    const key = todayKey();
    return ACTIONS.reduce((stats, action) => {
      stats[action.type] = records.filter((record) => record.type === action.type && todayKey(new Date(record.createdAt)) === key).length;
      return stats;
    }, {});
  },

  buildTodayStatItems(records) {
    const stats = this.buildTodayStats(records);
    return ACTIONS.map((action) => ({
      type: action.type,
      label: action.label,
      count: stats[action.type] || 0
    }));
  },

  buildReminders(records, pet) {
    if (!pet) return [];
    const now = new Date();
    return ACTIONS.filter((action) => action.type !== "poop").map((action) => {
      const latest = records.find((record) => record.type === action.type);
      if (!latest) {
        return { type: action.type, label: action.label, text: "还未记录", status: "warn" };
      }
      const nextDate = addDays(new Date(latest.createdAt), getCareInterval(pet, action));
      const diffDays = Math.ceil((nextDate - now) / 86400000);
      const text = diffDays < 0 ? `已超 ${Math.abs(diffDays)} 天` : diffDays === 0 ? "今天" : `${diffDays} 天后`;
      return {
        type: action.type,
        label: action.label,
        text,
        status: diffDays <= 0 ? "warn" : diffDays <= 3 ? "soon" : "ok"
      };
    });
  },

  selectPet(event) {
    this.setData({ activePetId: event.currentTarget.dataset.id }, () => this.refreshView());
  },

  quickRecord(event) {
    const action = ACTIONS.find((item) => item.type === event.currentTarget.dataset.type);
    const recordTypeIndex = ACTIONS.findIndex((item) => item.type === action.type);
    this.showRecordForm(recordTypeIndex);
  },

  addRecord(type, note, dateKey = todayKey()) {
    if (!this.data.activePetId) return;
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

  showPetForm() {
    const pet = this.data.activePet;
    this.setData({
      petFormVisible: true,
      editingPetId: pet ? pet.id : "",
      petForm: pet
        ? { name: pet.name, type: pet.type, age: pet.age, careIntervals: normalizeIntervals(pet.type, pet.careIntervals) }
        : { name: "", type: "cat", age: "", careIntervals: getDefaultIntervals("cat") }
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
    this.setData({
      recordFormVisible: true,
      recordTypeIndex,
      recordDate: todayKey(),
      recordMaxDate: todayKey(),
      recordNote: ""
    }, () => this.updateRecordDuePreview());
  },

  showCustomRecord() {
    this.showRecordForm(0);
  },

  hideRecordForm() {
    this.setData({ recordFormVisible: false });
  },

  setRecordType(event) {
    this.setData({ recordTypeIndex: Number(event.detail.value) }, () => this.updateRecordDuePreview());
  },

  setRecordDate(event) {
    this.setData({ recordDate: event.detail.value }, () => this.updateRecordDuePreview());
  },

  updateRecordNote(event) {
    this.setData({ recordNote: event.detail.value });
  },

  updateRecordDuePreview() {
    const action = ACTIONS[this.data.recordTypeIndex];
    const pet = this.data.activePet;
    if (!action || !pet || action.type === "poop") {
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
    const action = ACTIONS[this.data.recordTypeIndex];
    this.setData({ recordFormVisible: false }, () => {
      this.addRecord(action.type, this.data.recordNote.trim() || action.quickText, this.data.recordDate);
    });
  }
});
