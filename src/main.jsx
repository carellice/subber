import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { createPortal } from "react-dom";
import { App as CapacitorApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import { FaAmazon, FaMicrosoft, FaXbox } from "react-icons/fa";
import { SiOpenai } from "react-icons/si";
import {
  siApple,
  siDazn,
  siDropbox,
  siFigma,
  siGoogle,
  siIcloud,
  siNetflix,
  siNotion,
  siNow,
  siPlaystation,
  siSky,
  siSpotify,
  siVodafone,
  siYoutube
} from "simple-icons/icons";
import {
  ArrowDownAZ,
  ArrowUpAZ,
  Bell,
  CalendarClock,
  Check,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Download,
  Edit3,
  Filter,
  FolderKanban,
  Home,
  LayoutDashboard,
  Monitor,
  Moon,
  Palette,
  Plus,
  Search,
  Settings,
  Sparkles,
  Sun,
  Tag,
  Trash2,
  Upload,
  WalletCards,
  X
} from "lucide-react";
import "./styles.css";

const STORAGE_KEY = "subber-data-v1";
const REMINDER_DAYS = [1, 3, 7, 14, 30];
const SORT_OPTIONS = [
  { value: "name", label: "Nome" },
  { value: "renewal", label: "Scadenza" },
  { value: "price", label: "Prezzo" },
  { value: "category", label: "Categoria" }
];
const textSorter = new Intl.Collator("it-IT", { sensitivity: "base", numeric: true });
const BRAND_PRESETS = [
  { id: "netflix", name: "Netflix", label: "N", bg: "#e50914", fg: "#ffffff", icon: siNetflix, aliases: ["netflix"] },
  { id: "prime", name: "Prime Video", label: "PV", bg: "#00a8e1", fg: "#001018", Icon: FaAmazon, aliases: ["prime", "amazon"] },
  {
    id: "disney",
    name: "Disney+",
    label: "D+",
    bg: "#113ccf",
    fg: "#ffffff",
    imageSrc: "/brand/disney-plus.svg",
    imageFilter: "brightness(0) invert(1)",
    aliases: ["disney"]
  },
  { id: "spotify", name: "Spotify", label: "S", bg: "#1db954", fg: "#06130a", icon: siSpotify, aliases: ["spotify"] },
  { id: "youtube", name: "YouTube", label: "YT", bg: "#ff0033", fg: "#ffffff", icon: siYoutube, aliases: ["youtube"] },
  { id: "apple", name: "Apple", label: "", bg: "#f5f5f7", fg: "#111111", icon: siApple, aliases: ["apple"] },
  { id: "icloud", name: "iCloud", label: "iC", bg: "#f5f5f7", fg: "#111111", icon: siIcloud, aliases: ["icloud"] },
  { id: "adobe", name: "Adobe", label: "A", bg: "#ff0000", fg: "#ffffff", aliases: ["adobe"] },
  { id: "figma", name: "Figma", label: "F", bg: "#a259ff", fg: "#ffffff", icon: siFigma, aliases: ["figma"] },
  { id: "notion", name: "Notion", label: "N", bg: "#f7f6f3", fg: "#111111", icon: siNotion, aliases: ["notion"] },
  { id: "dropbox", name: "Dropbox", label: "Db", bg: "#0061ff", fg: "#ffffff", icon: siDropbox, aliases: ["dropbox"] },
  { id: "google", name: "Google One", label: "G", bg: "#34a853", fg: "#ffffff", icon: siGoogle, aliases: ["google", "google one"] },
  { id: "microsoft", name: "Microsoft 365", label: "M", bg: "#f25022", fg: "#ffffff", Icon: FaMicrosoft, aliases: ["microsoft", "office", "365"] },
  { id: "dazn", name: "DAZN", label: "D", bg: "#f8ff13", fg: "#050505", icon: siDazn, aliases: ["dazn"] },
  { id: "sky", name: "Sky", label: "Sky", bg: "#ffffff", fg: "#0a4fd7", icon: siSky, aliases: ["sky"] },
  { id: "now", name: "NOW", label: "NOW", bg: "#00e0b8", fg: "#001b18", icon: siNow, aliases: ["now", "now tv"] },
  { id: "playstation", name: "PlayStation", label: "PS", bg: "#006fcd", fg: "#ffffff", icon: siPlaystation, aliases: ["playstation", "ps plus"] },
  { id: "xbox", name: "Xbox", label: "X", bg: "#107c10", fg: "#ffffff", Icon: FaXbox, aliases: ["xbox", "game pass"] },
  { id: "chatgpt", name: "ChatGPT", label: "AI", bg: "#10a37f", fg: "#ffffff", Icon: SiOpenai, aliases: ["chatgpt", "openai"] },
  { id: "aruba", name: "Aruba", label: "Aruba", bg: "#d71920", fg: "#ffffff", wordmark: true, aliases: ["aruba"] },
  { id: "iliad", name: "Iliad", label: "iliad", bg: "#c00a1e", fg: "#ffffff", wordmark: true, aliases: ["iliad"] },
  { id: "tim", name: "TIM", label: "TIM", bg: "#004990", fg: "#ffffff", wordmark: true, aliases: ["tim", "telecom italia"] },
  { id: "vodafone", name: "Vodafone", label: "V", bg: "#e60000", fg: "#ffffff", icon: siVodafone, aliases: ["vodafone"] },
  { id: "windtre", name: "WINDTRE", label: "W3", bg: "#ff7a00", fg: "#ffffff", wordmark: true, aliases: ["windtre", "wind tre", "wind3", "wind"] },
  { id: "serenis", name: "Serenis", label: "Serenis", bg: "#173b3f", fg: "#b7f36d", wordmark: true, aliases: ["serenis"] }
];

const defaultCategories = [
  { id: "streaming", name: "Streaming", color: "#17d5f4" },
  { id: "work", name: "Lavoro", color: "#8b5cf6" },
  { id: "wellness", name: "Benessere", color: "#34d399" },
  { id: "cloud", name: "Cloud", color: "#f59e0b" }
];

const defaultSubscriptions = [];

function nextDate(offset) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
}

function loadData() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved?.subscriptions && saved?.categories) {
      return {
        ...saved,
        onboardingCompleted: saved.onboardingCompleted ?? true,
        showMonthlyInList: saved.showMonthlyInList ?? false
      };
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }

  return initialData();
}

function initialData() {
  return {
    subscriptions: defaultSubscriptions,
    categories: defaultCategories,
    currency: "EUR",
    notificationsEnabled: false,
    dismissedNotifications: {},
    onboardingCompleted: false,
    showMonthlyInList: false
  };
}

function currency(value, code = "EUR") {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: code }).format(Number(value || 0));
}

function formatDate(value) {
  return new Intl.DateTimeFormat("it-IT", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

function daysUntil(value) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(value);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target - today) / 86400000);
}

function monthlyCost(subscription) {
  const price = Number(subscription.price || 0);
  if (subscription.cadence === "yearly") return price / 12;
  if (subscription.cadence === "biannual") return price / 24;
  if (subscription.cadence === "weekly") return price * 4.345;
  return price;
}

function cadenceLabel(cadence) {
  return { monthly: "Mensile", yearly: "Annuale", biannual: "Biannuale", weekly: "Settimanale" }[cadence] || "Mensile";
}

function sortSubscriptions(items, sortMode, sortDirection, categories = []) {
  const categoryById = Object.fromEntries(categories.map((category) => [category.id, category.name]));
  const sorted = [...items];

  sorted.sort((a, b) => {
    let result;

    if (sortMode === "renewal") {
      result = daysUntil(a.renewalDate) - daysUntil(b.renewalDate);
    } else if (sortMode === "price") {
      result = monthlyCost(a) - monthlyCost(b);
    } else if (sortMode === "category") {
      result = textSorter.compare(categoryById[a.categoryId] || "", categoryById[b.categoryId] || "");
    } else {
      result = textSorter.compare(a.name, b.name);
    }

    const fallback = textSorter.compare(a.name, b.name);
    return (sortDirection === "desc" ? -result : result) || fallback;
  });

  return sorted;
}

function presetForSubscription(subscription) {
  if (subscription.imagePreset) {
    return BRAND_PRESETS.find((preset) => preset.id === subscription.imagePreset);
  }

  const name = subscription.name?.toLowerCase() || "";
  return BRAND_PRESETS.find((preset) => preset.aliases.some((alias) => name.includes(alias)));
}

function BrandMark({ preset }) {
  if (preset.wordmark) {
    return <span className="brand-wordmark">{preset.label}</span>;
  }

  if (preset.imageSrc) {
    return <img src={preset.imageSrc} alt="" />;
  }

  if (preset.Icon) {
    const Icon = preset.Icon;
    return <Icon aria-hidden="true" />;
  }

  if (preset.icon) {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d={preset.icon.path} />
      </svg>
    );
  }

  return preset.label;
}

function systemTheme() {
  return window.matchMedia?.("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function themeLabel(theme) {
  return { system: "Automatico", dark: "Scuro", light: "Chiaro" }[theme] || "Automatico";
}

function isNativeApp() {
  return Capacitor.isNativePlatform?.() || false;
}

function notificationId(subscription, suffix = 0) {
  const text = `${subscription.id}-${subscription.renewalDate}-${suffix}`;
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) >>> 0;
  }
  return (hash % 2147480000) + 1000;
}

function reminderDate(subscription) {
  const date = new Date(subscription.renewalDate);
  date.setDate(date.getDate() - Number(subscription.reminderDays || 3));
  date.setHours(9, 0, 0, 0);
  return date;
}

async function nativeNotificationPermission() {
  const current = await LocalNotifications.checkPermissions();
  if (current.display === "granted") return true;
  const requested = await LocalNotifications.requestPermissions();
  return requested.display === "granted";
}

function App() {
  const [data, setData] = useState(loadData);
  const [activeCategory, setActiveCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [editingSub, setEditingSub] = useState(null);
  const [selectedSub, setSelectedSub] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [closingModal, setClosingModal] = useState(null);
  const [subscriptionSort, setSubscriptionSort] = useState("name");
  const [subscriptionSortDirection, setSubscriptionSortDirection] = useState("asc");
  const [theme, setTheme] = useState("system");
  const [activeTab, setActiveTab] = useState("home");
  const [desktopMenuOpen, setDesktopMenuOpen] = useState(false);
  const modalHistoryActive = useRef(false);
  const pendingModalClose = useRef(null);
  const backupInputRef = useRef(null);

  function selectTab(tab) {
    setActiveTab(tab);
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      document.querySelector(".app-shell")?.scrollTo?.({ top: 0, left: 0, behavior: "instant" });
    });
  }

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [activeTab]);

  useEffect(() => {
    const media = window.matchMedia?.("(prefers-color-scheme: light)");
    const applyTheme = () => {
      document.documentElement.dataset.theme = theme === "system" ? systemTheme() : theme;
    };

    applyTheme();
    if (theme !== "system" || !media) return undefined;
    media.addEventListener("change", applyTheme);
    return () => media.removeEventListener("change", applyTheme);
  }, [theme]);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js");
    }
  }, []);

  useEffect(() => {
    function preventNumberWheel(event) {
      if (event.target instanceof HTMLInputElement && event.target.type === "number") {
        event.preventDefault();
      }
    }

    document.addEventListener("wheel", preventNumberWheel, { passive: false });
    return () => document.removeEventListener("wheel", preventNumberWheel);
  }, []);

  useEffect(() => {
    if (isNativeApp()) return undefined;
    if (!data.notificationsEnabled || Notification.permission !== "granted") return;

    const runCheck = () => {
      const todayKey = new Date().toISOString().slice(0, 10);
      const due = data.subscriptions.filter((sub) => {
        const days = daysUntil(sub.renewalDate);
        const key = `${sub.id}-${todayKey}`;
        return days >= 0 && days <= Number(sub.reminderDays || 3) && !data.dismissedNotifications[key];
      });

      if (!due.length) return;

      due.forEach((sub) => {
        const days = daysUntil(sub.renewalDate);
        const payload = {
          title: `${sub.name} si rinnova ${days === 0 ? "oggi" : `tra ${days} giorni`}`,
          body: `${currency(sub.price, data.currency)} - ${formatDate(sub.renewalDate)}`
        };

        if (navigator.serviceWorker?.controller) {
          navigator.serviceWorker.controller.postMessage({ type: "SUBBER_NOTIFY", payload });
        } else {
          new Notification(payload.title, { body: payload.body, icon: "/logo.png" });
        }
      });

      setData((current) => ({
        ...current,
        dismissedNotifications: {
          ...current.dismissedNotifications,
          ...Object.fromEntries(due.map((sub) => [`${sub.id}-${todayKey}`, true]))
        }
      }));
    };

    runCheck();
    const timer = window.setInterval(runCheck, 60 * 60 * 1000);
    return () => window.clearInterval(timer);
  }, [data.notificationsEnabled, data.subscriptions, data.currency, data.dismissedNotifications]);

  useEffect(() => {
    if (!isNativeApp() || !data.notificationsEnabled) return undefined;

    let cancelled = false;

    async function scheduleNativeReminders() {
      const granted = await nativeNotificationPermission();
      if (!granted || cancelled) return;

      try {
        await LocalNotifications.createChannel?.({
          id: "renewals",
          name: "Promemoria rinnovi",
          description: "Notifiche locali per gli abbonamenti in scadenza",
          importance: 5,
          visibility: 1,
          sound: "default"
        });
      } catch {
        // Il canale puo' gia' esistere o non essere richiesto su alcune piattaforme.
      }

      const pending = await LocalNotifications.getPending();
      const renewalIds = pending.notifications
        .filter((notification) => String(notification.extra?.source || "").startsWith("subber-renewal"))
        .map((notification) => ({ id: notification.id }));

      if (renewalIds.length) {
        await LocalNotifications.cancel({ notifications: renewalIds });
      }

      const now = new Date();
      const notifications = data.subscriptions
        .map((sub) => {
          const at = reminderDate(sub);
          if (at <= now) return null;

          const days = Number(sub.reminderDays || 3);
          return {
            id: notificationId(sub),
            title: `${sub.name} si rinnova tra ${days} ${days === 1 ? "giorno" : "giorni"}`,
            body: `${currency(sub.price, data.currency)} - ${formatDate(sub.renewalDate)}`,
            schedule: { at },
            channelId: "renewals",
            smallIcon: "ic_stat_subber",
            iconColor: "#7BE8FF",
            extra: { source: "subber-renewal", subscriptionId: sub.id }
          };
        })
        .filter(Boolean);

      if (notifications.length) {
        await LocalNotifications.schedule({ notifications });
      }
    }

    scheduleNativeReminders();
    return () => {
      cancelled = true;
    };
  }, [data.notificationsEnabled, data.subscriptions, data.currency]);

  const categories = useMemo(
    () => [...data.categories].sort((a, b) => textSorter.compare(a.name, b.name)),
    [data.categories]
  );
  const subscriptions = data.subscriptions;

  const filtered = useMemo(() => {
    const visible = subscriptions
      .filter((sub) => activeCategory === "all" || sub.categoryId === activeCategory)
      .filter((sub) => `${sub.name} ${sub.note}`.toLowerCase().includes(query.toLowerCase()));

    return sortSubscriptions(visible, subscriptionSort, subscriptionSortDirection, categories);
  }, [subscriptions, activeCategory, query, subscriptionSort, subscriptionSortDirection, categories]);

  const stats = useMemo(() => {
    const monthly = subscriptions.reduce((sum, sub) => sum + monthlyCost(sub), 0);
    const next = [...subscriptions].sort((a, b) => daysUntil(a.renewalDate) - daysUntil(b.renewalDate))[0];
    const soon = subscriptions.filter((sub) => daysUntil(sub.renewalDate) <= Number(sub.reminderDays || 3)).length;
    return { monthly, yearly: monthly * 12, next, soon };
  }, [subscriptions]);

  const categoryTotals = useMemo(() => {
    return categories
      .map((category) => ({
        ...category,
        count: subscriptions.filter((sub) => sub.categoryId === category.id).length,
        total: subscriptions
          .filter((sub) => sub.categoryId === category.id)
          .reduce((sum, sub) => sum + monthlyCost(sub), 0)
      }))
      .sort((a, b) => textSorter.compare(a.name, b.name));
  }, [categories, subscriptions]);

  async function enableNotifications() {
    if (isNativeApp()) {
      const granted = await nativeNotificationPermission();
      setData((current) => ({ ...current, notificationsEnabled: granted }));
      if (!granted) {
        window.alert("Permesso notifiche non concesso. Abilitalo nelle impostazioni del sistema.");
      }
      return;
    }

    if (!("Notification" in window)) return;
    const permission = await Notification.requestPermission();
    setData((current) => ({ ...current, notificationsEnabled: permission === "granted" }));
  }

  async function triggerTestNotification() {
    if (isNativeApp()) {
      const granted = await nativeNotificationPermission();
      setData((current) => ({ ...current, notificationsEnabled: granted }));

      if (!granted) {
        window.alert("Permesso notifiche non concesso. Abilitalo nelle impostazioni del sistema.");
        return;
      }

      await LocalNotifications.schedule({
        notifications: [
          {
            id: Date.now() % 2147480000,
            title: "Subber funziona",
            body: "Questa e' una notifica di test nativa dell'app.",
            schedule: { at: new Date(Date.now() + 1000) },
            channelId: "renewals",
            smallIcon: "ic_stat_subber",
            iconColor: "#7BE8FF",
            extra: { source: "subber-test" }
          }
        ]
      });
      return;
    }

    if (!("Notification" in window)) {
      window.alert("Le notifiche non sono supportate su questo dispositivo.");
      return;
    }

    let permission = Notification.permission;
    if (permission !== "granted") {
      permission = await Notification.requestPermission();
      setData((current) => ({ ...current, notificationsEnabled: permission === "granted" }));
    }

    if (permission !== "granted") {
      window.alert("Permesso notifiche non concesso. Abilitalo nelle impostazioni del browser o del sistema.");
      return;
    }

    const payload = {
      title: "Subber funziona",
      body: "Questa e' una notifica di test per i promemoria rinnovi."
    };

    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(payload.title, {
        body: payload.body,
        icon: "/logo.png",
        badge: "/logo.png",
        tag: `subber-test-${Date.now()}`
      });
    } else {
      new Notification(payload.title, { body: payload.body, icon: "/logo.png" });
    }
  }

  function exportBackup() {
    const payload = {
      app: "Subber",
      schema: 1,
      exportedAt: new Date().toISOString(),
      data
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `subber-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function importBackupFile(file) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        const imported = parsed.data || parsed;

        if (!Array.isArray(imported.subscriptions) || !Array.isArray(imported.categories)) {
          throw new Error("Formato non valido");
        }

        setData({
          subscriptions: imported.subscriptions,
          categories: imported.categories,
          currency: imported.currency || "EUR",
          notificationsEnabled: Boolean(imported.notificationsEnabled),
          dismissedNotifications: imported.dismissedNotifications || {},
          onboardingCompleted: true,
          showMonthlyInList: Boolean(imported.showMonthlyInList)
        });
        window.alert("Backup ripristinato correttamente.");
      } catch {
        window.alert("Il file selezionato non sembra un backup valido di Subber.");
      } finally {
        if (backupInputRef.current) backupInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  }

  async function clearAppData() {
    const firstConfirmation = window.confirm(
      "Vuoi cancellare tutti i dati di Subber da questo dispositivo? L'operazione non puo' essere annullata."
    );
    if (!firstConfirmation) return;

    const secondConfirmation = window.confirm(
      "Confermi la cancellazione definitiva di abbonamenti, categorie, impostazioni e promemoria?"
    );
    if (!secondConfirmation) return;

    if (isNativeApp()) {
      try {
        const pending = await LocalNotifications.getPending();
        const subberNotifications = pending.notifications
          .filter((notification) => String(notification.extra?.source || "").startsWith("subber-"))
          .map((notification) => ({ id: notification.id }));

        if (subberNotifications.length) {
          await LocalNotifications.cancel({ notifications: subberNotifications });
        }
      } catch {
        // Se la cancellazione delle notifiche fallisce, i dati locali vengono comunque rimossi.
      }
    }

    localStorage.removeItem(STORAGE_KEY);
    setActiveCategory("all");
    setQuery("");
    setEditingSub(null);
    setSelectedSub(null);
    setEditingCategory(null);
    setData(initialData());
    selectTab("home");
    window.alert("Tutti i dati di Subber sono stati cancellati.");
  }

  function saveSubscription(subscription) {
    setData((current) => {
      const exists = current.subscriptions.some((item) => item.id === subscription.id);
      return {
        ...current,
        subscriptions: exists
          ? current.subscriptions.map((item) => (item.id === subscription.id ? subscription : item))
          : [{ ...subscription, id: crypto.randomUUID() }, ...current.subscriptions]
      };
    });
  }

  function removeSubscription(id) {
    setData((current) => ({
      ...current,
      subscriptions: current.subscriptions.filter((sub) => sub.id !== id)
    }));
  }

  function saveCategory(category) {
    setData((current) => {
      const exists = current.categories.some((item) => item.id === category.id);
      return {
        ...current,
        categories: exists
          ? current.categories.map((item) => (item.id === category.id ? category : item))
          : [...current.categories, { ...category, id: crypto.randomUUID() }]
      };
    });
  }

  function closeWithAnimation(key, afterClose) {
    setClosingModal(key);
    window.setTimeout(() => {
      afterClose();
      setClosingModal((current) => (current === key ? null : current));
    }, 260);
  }

  function closeTopModal() {
    if (editingSub) {
      closeWithAnimation("subscription", () => setEditingSub(null));
      return;
    }

    if (selectedSub) {
      closeWithAnimation("detail", () => setSelectedSub(null));
      return;
    }

    if (editingCategory) {
      closeWithAnimation("category", () => setEditingCategory(null));
    }
  }

  function handleNativeBackButton() {
    if (!data.onboardingCompleted) {
      setData((current) => ({ ...current, onboardingCompleted: true }));
      return;
    }

    if (editingSub || selectedSub || editingCategory) {
      closeTopModal();
      return;
    }

    if (activeTab !== "home") {
      selectTab("home");
      return;
    }

    CapacitorApp.exitApp();
  }

  function closeModal(key, afterClose) {
    if (modalHistoryActive.current) {
      pendingModalClose.current = { key, afterClose };
      window.history.back();
      return;
    }

    closeWithAnimation(key, afterClose);
  }

  useEffect(() => {
    const modalOpen = Boolean(editingSub || selectedSub || editingCategory);

    if (modalOpen && !modalHistoryActive.current && !closingModal) {
      window.history.pushState({ subberModal: true }, "");
      modalHistoryActive.current = true;
    }

    function handlePopState() {
      if (!modalHistoryActive.current) return;

      modalHistoryActive.current = false;
      const pending = pendingModalClose.current;
      pendingModalClose.current = null;

      if (pending) {
        closeWithAnimation(pending.key, pending.afterClose);
        return;
      }

      closeTopModal();
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [editingSub, selectedSub, editingCategory, closingModal]);

  useEffect(() => {
    if (!isNativeApp()) return undefined;

    let listener;
    CapacitorApp.addListener("backButton", () => handleNativeBackButton()).then((handle) => {
      listener = handle;
    });

    return () => listener?.remove();
  }, [data.onboardingCompleted, editingSub, selectedSub, editingCategory, activeTab]);

  function removeCategory(id) {
    const fallback = categories.find((cat) => cat.id !== id)?.id || "streaming";
    setData((current) => ({
      ...current,
      categories: current.categories.filter((cat) => cat.id !== id),
      subscriptions: current.subscriptions.map((sub) => (sub.categoryId === id ? { ...sub, categoryId: fallback } : sub))
    }));
    if (activeCategory === id) setActiveCategory("all");
  }

  const pageTitle = {
    home: "Panoramica",
    subscriptions: "Abbonamenti",
    categories: "Categorie",
    settings: "Impostazioni"
  }[activeTab];
  const activeNavIndex = ["home", "subscriptions", "categories", "settings"].indexOf(activeTab);
  const navItems = [
    { id: "home", icon: <Home />, label: "Home" },
    { id: "subscriptions", icon: <LayoutDashboard />, label: "Lista" },
    { id: "categories", icon: <FolderKanban />, label: "Categorie" },
    { id: "settings", icon: <Settings />, label: "Impostazioni" }
  ];

  return (
    <main className={`app-shell ${desktopMenuOpen ? "desktop-menu-open" : ""}`}>
      <header className="app-bar">
        <div className="desktop-nav">
          <button
            className={`desktop-menu-button ${desktopMenuOpen ? "open" : ""}`}
            type="button"
            aria-label="Apri menu"
            aria-expanded={desktopMenuOpen}
            onClick={() => setDesktopMenuOpen((open) => !open)}
          >
            <span />
            <span />
            <span />
          </button>

        </div>

        <div className="app-brand">
          <img src="/logo.png" alt="Subber" />
          <div>
            <span>Subber</span>
            <strong>{pageTitle}</strong>
          </div>
        </div>
      </header>

      <aside className={`desktop-menu ${desktopMenuOpen ? "open" : ""}`} aria-label="Navigazione principale">
        <div>
          <span>Menu</span>
          <strong>{pageTitle}</strong>
        </div>
        <nav>
          {navItems.map((item) => (
            <button
              key={item.id}
              className={activeTab === item.id ? "active" : ""}
              type="button"
              onClick={() => selectTab(item.id)}
            >
              <span>{React.cloneElement(item.icon, { size: 19 })}</span>
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <section className={`page ${activeTab}`} key={activeTab}>
        {activeTab === "home" && (
          <HomePage
            stats={stats}
            subscriptions={subscriptions}
            categories={categories}
            categoryTotals={categoryTotals}
            currencyCode={data.currency}
            onCreate={() => setEditingSub(emptySubscription(categories[0]?.id))}
            onCreateCategory={() => setEditingCategory(emptyCategory())}
            onOpenSubscriptions={() => selectTab("subscriptions")}
            onOpenCategories={() => selectTab("categories")}
            onOpenCategorySubscriptions={(categoryId) => {
              setActiveCategory(categoryId);
              selectTab("subscriptions");
            }}
            onOpenDetail={setSelectedSub}
            onEditSubscription={setEditingSub}
            onDeleteSubscription={removeSubscription}
          />
        )}

        {activeTab === "subscriptions" && (
          <SubscriptionsPage
            filtered={filtered}
            query={query}
            setQuery={setQuery}
            sortMode={subscriptionSort}
            setSortMode={setSubscriptionSort}
            sortDirection={subscriptionSortDirection}
            setSortDirection={setSubscriptionSortDirection}
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
            categories={categories}
            stats={stats}
            currencyCode={data.currency}
            showMonthlyInList={data.showMonthlyInList}
            onCreate={() => setEditingSub(emptySubscription(categories[0]?.id))}
            onOpenDetail={setSelectedSub}
            onEditSubscription={setEditingSub}
            onDeleteSubscription={removeSubscription}
          />
        )}

        {activeTab === "categories" && (
          <CategoriesPage
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
            categoryTotals={categoryTotals}
            currencyCode={data.currency}
            onCreate={() => setEditingCategory(emptyCategory())}
            onEdit={setEditingCategory}
            onDelete={removeCategory}
            onOpenSubscriptions={() => selectTab("subscriptions")}
          />
        )}

        {activeTab === "settings" && (
          <SettingsPage
            notificationsEnabled={data.notificationsEnabled}
            theme={theme}
            onEnableNotifications={enableNotifications}
            onTestNotification={triggerTestNotification}
            onExportBackup={exportBackup}
            onImportBackup={() => backupInputRef.current?.click()}
            onSelectTheme={setTheme}
            showMonthlyInList={data.showMonthlyInList}
            onToggleMonthlyInList={() => setData((current) => ({ ...current, showMonthlyInList: !current.showMonthlyInList }))}
            onClearAppData={clearAppData}
          />
        )}
      </section>

      <input
        ref={backupInputRef}
        className="backup-file-input"
        type="file"
        accept="application/json,.json"
        onChange={(event) => importBackupFile(event.target.files?.[0])}
      />

      {!data.onboardingCompleted && (
        <Onboarding
          onStart={() => {
            setData((current) => ({ ...current, onboardingCompleted: true }));
            selectTab("subscriptions");
            setEditingSub(emptySubscription(categories[0]?.id));
          }}
          onClose={() => setData((current) => ({ ...current, onboardingCompleted: true }))}
        />
      )}

      {activeTab !== "settings" && activeTab !== "home" && (
        <button
          className="fab"
          title={activeTab === "categories" ? "Nuova categoria" : "Nuovo abbonamento"}
          onClick={() => {
            if (activeTab === "categories") {
              setEditingCategory(emptyCategory());
            } else {
              setEditingSub(emptySubscription(categories[0]?.id));
            }
          }}
        >
          <Plus size={28} />
        </button>
      )}

      <nav className="bottom-nav" aria-label="Navigazione principale" style={{ "--active-index": activeNavIndex }}>
        <span className="nav-indicator" aria-hidden="true" />
        {navItems.map((item) => (
          <NavItem key={item.id} id={item.id} active={activeTab} onClick={selectTab} icon={item.icon} label={item.label} />
        ))}
      </nav>

      {editingSub && (
        <SubscriptionModal
          subscription={editingSub}
          categories={categories}
          currencyCode={data.currency}
          closing={closingModal === "subscription"}
          onClose={() => closeModal("subscription", () => setEditingSub(null))}
          onSave={(subscription) => {
            saveSubscription(subscription);
            closeModal("subscription", () => setEditingSub(null));
          }}
        />
      )}

      {selectedSub && (
        <SubscriptionDetailModal
          subscription={selectedSub}
          category={categories.find((cat) => cat.id === selectedSub.categoryId)}
          currencyCode={data.currency}
          closing={closingModal === "detail"}
          onClose={() => closeModal("detail", () => setSelectedSub(null))}
          onEdit={() => {
            closeWithAnimation("detail", () => {
              setSelectedSub(null);
              setEditingSub(selectedSub);
            });
          }}
          onDelete={() => {
            removeSubscription(selectedSub.id);
            closeModal("detail", () => setSelectedSub(null));
          }}
        />
      )}

      {editingCategory && (
        <CategoryModal
          category={editingCategory}
          closing={closingModal === "category"}
          onClose={() => closeModal("category", () => setEditingCategory(null))}
          onSave={(category) => {
            saveCategory(category);
            closeModal("category", () => setEditingCategory(null));
          }}
          onDelete={editingCategory.id ? () => removeCategory(editingCategory.id) : null}
        />
      )}
    </main>
  );
}

function HomePage({
  stats,
  subscriptions,
  categories,
  categoryTotals,
  currencyCode,
  onCreate,
  onCreateCategory,
  onOpenSubscriptions,
  onOpenCategories,
  onOpenCategorySubscriptions,
  onOpenDetail,
  onEditSubscription,
  onDeleteSubscription
}) {
  const upcoming = subscriptions
    .slice()
    .sort((a, b) => daysUntil(a.renewalDate) - daysUntil(b.renewalDate))
    .slice(0, 3);
  const topCategory = categoryTotals
    .map((category) => ({
      ...category,
      count: subscriptions.filter((subscription) => subscription.categoryId === category.id).length
    }))
    .filter((category) => category.count > 0)
    .sort((a, b) => b.count - a.count || b.total - a.total)[0];

  if (!subscriptions.length) {
    return (
      <div className="screen-grid home-grid">
        <section className="home-empty-start">
          <div className="home-empty-copy">
            <span className="eyebrow"><Sparkles size={15} /> Primo avvio</span>
            <h1>Costruisci il tuo primo promemoria.</h1>
            <p>
              Aggiungi un abbonamento per vedere subito rinnovi, spesa mensile e categorie nella panoramica.
            </p>
            <div className="home-empty-actions">
              <button className="primary pill" onClick={onCreate} type="button">
                <Plus size={18} />
                Primo abbonamento
              </button>
              <button className="ghost pill" onClick={onCreateCategory} type="button">
                <Tag size={18} />
                Nuova categoria
              </button>
            </div>
          </div>

          <div className="home-empty-panel" aria-label="Percorso iniziale">
            <div>
              <span>1</span>
              <strong>Crea una categoria</strong>
              <small>Usa quelle gia' pronte o personalizzane una.</small>
            </div>
            <div>
              <span>2</span>
              <strong>Aggiungi un rinnovo</strong>
              <small>Nome, prezzo, data e cadenza bastano per partire.</small>
            </div>
            <div>
              <span>3</span>
              <strong>Attiva un promemoria</strong>
              <small>Subber ti avvisa prima della prossima scadenza.</small>
            </div>
          </div>
        </section>

        <SectionHeader title="Categorie disponibili" action="Gestisci" onClick={onOpenCategories} />
        <div className="category-chips">
          {categoryTotals.map((category) => (
            <button
              className="category-chip-card"
              key={category.id}
              onClick={() => onOpenCategorySubscriptions(category.id)}
              type="button"
            >
              <i style={{ background: category.color }} />
              <span>{category.name}</span>
              <strong>{currency(category.total, currencyCode)}</strong>
              <ChevronRight size={18} />
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="screen-grid home-grid">
      <section className="expressive-hero">
        <div className="home-hero-top">
          <div className="eyebrow"><Sparkles size={15} /> Oggi</div>
        </div>
        <div className="today-compact-grid">
          <button
            className="today-next"
            onClick={() => stats.next && onOpenDetail(stats.next)}
            disabled={!stats.next}
            type="button"
          >
            <small>Prossimo rinnovo</small>
            <b>{stats.next ? stats.next.name : "-"}</b>
            <span>{stats.next ? formatDate(stats.next.renewalDate) : "Nessun rinnovo"}</span>
            <ChevronRight size={17} />
          </button>
          <div className="today-money">
            <small>Mensile</small>
            <strong>{currency(stats.monthly, currencyCode)}</strong>
          </div>
          <div className="today-money annual">
            <small>Annuale</small>
            <strong>{currency(stats.yearly, currencyCode)}</strong>
          </div>
        </div>
      </section>

      <button
        className="money-card home-summary"
        onClick={() => topCategory?.id && onOpenCategorySubscriptions(topCategory.id)}
        type="button"
      >
        <div className="summary-ring">
          <div>
            <span>{topCategory?.count || 0}</span>
            <small>attivi</small>
          </div>
        </div>
        <div className="home-summary-copy">
          <span>Categoria principale</span>
          <strong>{topCategory?.name || "-"}</strong>
          <small>{currency(topCategory?.total || 0, currencyCode)} / mese</small>
        </div>
        <ChevronRight size={20} />
      </button>

      <SectionHeader title="Prossimi rinnovi" action="Vedi tutti" onClick={onOpenSubscriptions} />
      <div className="subscription-list compact-list">
        {upcoming.map((subscription) => (
          <SubscriptionCard
            key={subscription.id}
            subscription={subscription}
            category={categories.find((cat) => cat.id === subscription.categoryId)}
            currencyCode={currencyCode}
            onOpen={() => onOpenDetail(subscription)}
            onEdit={() => onEditSubscription(subscription)}
            onDelete={() => onDeleteSubscription(subscription.id)}
          />
        ))}
      </div>

      <SectionHeader title="Categorie" action="Gestisci" onClick={onOpenCategories} />
      <div className="category-chips">
        {categoryTotals.map((category) => (
          <button
            className="category-chip-card"
            key={category.id}
            onClick={() => onOpenCategorySubscriptions(category.id)}
            type="button"
          >
            <i style={{ background: category.color }} />
            <span>{category.name}</span>
            <strong>{currency(category.total, currencyCode)}</strong>
            <ChevronRight size={18} />
          </button>
        ))}
      </div>
    </div>
  );
}

function SubscriptionsPage({
  filtered,
  query,
  setQuery,
  sortMode,
  setSortMode,
  sortDirection,
  setSortDirection,
  activeCategory,
  setActiveCategory,
  categories,
  stats,
  currencyCode,
  showMonthlyInList,
  onCreate,
  onOpenDetail,
  onEditSubscription,
  onDeleteSubscription
}) {
  return (
    <div className="screen-grid">
      <div className="search-box expressive-search">
        <Search size={19} />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cerca abbonamento" />
      </div>

      <div className="category-filter-row">
        <button className={activeCategory === "all" ? "active" : ""} onClick={() => setActiveCategory("all")}>
          Tutti
          <strong>{currency(stats.monthly, currencyCode)}</strong>
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            className={activeCategory === category.id ? "active" : ""}
            onClick={() => setActiveCategory(category.id)}
          >
            <i style={{ background: category.color }} />
            {category.name}
          </button>
        ))}
      </div>

      <div className="list-toolbar">
        <SectionHeader title="Abbonamenti" action={`${filtered.length} risultati`} icon={<Filter size={16} />} />
        <div className="sort-panel" aria-label="Ordinamento abbonamenti">
          <label className="sort-control">
            <span>Ordina per</span>
            <select value={sortMode} onChange={(event) => setSortMode(event.target.value)}>
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <button
            className="sort-direction"
            type="button"
            onClick={() => setSortDirection(sortDirection === "asc" ? "desc" : "asc")}
            title={sortDirection === "asc" ? "Crescente" : "Decrescente"}
            aria-label={sortDirection === "asc" ? "Ordinamento crescente" : "Ordinamento decrescente"}
          >
            {sortDirection === "asc" ? <ArrowDownAZ size={18} /> : <ArrowUpAZ size={18} />}
            <span>{sortDirection === "asc" ? "Crescente" : "Decrescente"}</span>
          </button>
        </div>
      </div>

      <div className="subscription-list">
        {filtered.map((subscription) => (
          <SubscriptionCard
            key={subscription.id}
            subscription={subscription}
            category={categories.find((cat) => cat.id === subscription.categoryId)}
            currencyCode={currencyCode}
            showMonthlyInList={showMonthlyInList}
            onOpen={() => onOpenDetail(subscription)}
            onEdit={() => onEditSubscription(subscription)}
            onDelete={() => onDeleteSubscription(subscription.id)}
          />
        ))}
        {!filtered.length && (
          <div className="empty-state">
            <CalendarClock size={42} />
            <strong>Nessun abbonamento trovato</strong>
            <span>Aggiungine uno o cambia filtro categoria.</span>
            <button className="primary pill" onClick={onCreate}>
              <Plus size={18} />
              Nuovo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function CategoriesPage({ activeCategory, setActiveCategory, categoryTotals, currencyCode, onEdit, onDelete, onOpenSubscriptions }) {
  const total = categoryTotals.reduce((sum, category) => sum + category.total, 0);

  return (
    <div className="screen-grid">
      <section className="page-hero small-hero">
        <span><Palette size={18} /> Categorie personalizzate</span>
        <p>Ogni categoria mostra quanti abbonamenti contiene e il totale mensile collegato.</p>
      </section>

      <SectionHeader title="Tutte le categorie" meta={`${currency(total, currencyCode)} / mese`} />
      <div className="category-list">
        {categoryTotals.map((category) => (
          <CategoryButton
            key={category.id}
            active={activeCategory === category.id}
            currencyCode={currencyCode}
            {...category}
            onClick={() => {
              setActiveCategory(category.id);
              onOpenSubscriptions();
            }}
            onEdit={() => onEdit(category)}
            onDelete={() => onDelete(category.id)}
          />
        ))}
      </div>
    </div>
  );
}

function SettingsPage({
  notificationsEnabled,
  theme,
  onEnableNotifications,
  onTestNotification,
  onExportBackup,
  onImportBackup,
  onSelectTheme,
  showMonthlyInList,
  onToggleMonthlyInList,
  onClearAppData
}) {
  const themeOptions = [
    { value: "system", label: "Auto", Icon: Monitor },
    { value: "dark", label: "Scuro", Icon: Moon },
    { value: "light", label: "Chiaro", Icon: Sun }
  ];

  return (
    <div className="screen-grid">
      <section className="page-hero settings-hero">
        <span><Settings size={18} /> Preferenze</span>
        <p>Gestisci promemoria, tema e salvataggio locale dell'app.</p>
      </section>

      <button className="settings-row" onClick={onEnableNotifications}>
        <span className="icon-surface"><Bell size={20} /></span>
        <div>
          <strong>Promemoria rinnovi</strong>
          <small>{notificationsEnabled ? "Autorizzati" : "Richiedi autorizzazione browser"}</small>
        </div>
        <ChevronRight size={19} />
      </button>

      <button className="settings-row" onClick={onTestNotification}>
        <span className="icon-surface"><Bell size={20} /></span>
        <div>
          <strong>Notifica di test</strong>
          <small>Invia subito una notifica di prova</small>
        </div>
        <ChevronRight size={19} />
      </button>

      <div className="settings-row control-row theme-row">
        <span className="icon-surface"><Moon size={20} /></span>
        <div>
          <strong>Tema app</strong>
          <small>{themeLabel(theme)}</small>
        </div>
        <div className="theme-segment" role="radiogroup" aria-label="Tema app">
          {themeOptions.map(({ value, label, Icon }) => (
            <button
              key={value}
              type="button"
              className={theme === value ? "active" : ""}
              role="radio"
              aria-checked={theme === value}
              onClick={() => onSelectTheme(value)}
            >
              <Icon size={16} />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="settings-row passive">
        <span className="icon-surface"><WalletCards size={20} /></span>
        <div>
          <strong>Archivio locale</strong>
          <small>Salvataggio automatico su questo dispositivo</small>
        </div>
        <Check size={19} />
      </div>

      <button className="settings-row" onClick={onToggleMonthlyInList}>
        <span className="icon-surface"><CircleDollarSign size={20} /></span>
        <div>
          <strong>Prezzo mensile in lista</strong>
          <small>{showMonthlyInList ? "Mostra il costo mensile stimato" : "Mostra il prezzo originale"}</small>
        </div>
        <span className={`switch-control ${showMonthlyInList ? "active" : ""}`} aria-hidden="true" />
      </button>

      <button className="settings-row" onClick={onExportBackup}>
        <span className="icon-surface"><Download size={20} /></span>
        <div>
          <strong>Backup JSON</strong>
          <small>Esporta abbonamenti e categorie in un file</small>
        </div>
        <ChevronRight size={19} />
      </button>

      <button className="settings-row" onClick={onImportBackup}>
        <span className="icon-surface"><Upload size={20} /></span>
        <div>
          <strong>Ripristina backup</strong>
          <small>Importa un file JSON salvato da Subber</small>
        </div>
        <ChevronRight size={19} />
      </button>

      <button className="settings-row danger" onClick={onClearAppData}>
        <span className="icon-surface"><Trash2 size={20} /></span>
        <div>
          <strong>Cancella tutti i dati</strong>
          <small>Doppia conferma prima della rimozione definitiva</small>
        </div>
        <ChevronRight size={19} />
      </button>
    </div>
  );
}

function NavItem({ id, active, onClick, icon, label }) {
  const isActive = active === id;

  return (
    <button className={isActive ? "active" : ""} onClick={() => onClick(id)}>
      <span>{React.cloneElement(icon, { size: 22 })}</span>
      <small>{label}</small>
    </button>
  );
}

function SectionHeader({ title, action, onClick, icon, meta }) {
  return (
    <div className="section-header">
      <div className="section-heading">
        <strong>{title}</strong>
        {meta && <span>{meta}</span>}
      </div>
      {action && (
        <button onClick={onClick} type="button">
          {icon}
          {action}
        </button>
      )}
    </div>
  );
}

function Metric({ icon, label, value }) {
  return (
    <div className="metric">
      {React.cloneElement(icon, { size: 18 })}
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function CategoryButton({ active, name, total, count, color, currencyCode, onClick, onEdit, onDelete }) {
  const [menuState, setMenuState] = useState("closed");
  const longPressTimer = useRef(null);
  const longPressTriggered = useRef(false);
  const menuOpen = menuState !== "closed";

  function clearLongPress() {
    window.clearTimeout(longPressTimer.current);
    longPressTimer.current = null;
  }

  function openMenu() {
    setMenuState("open");
  }

  function closeMenu() {
    setMenuState("closing");
    window.setTimeout(() => setMenuState("closed"), 190);
  }

  function runMenuAction(action) {
    closeMenu();
    window.setTimeout(action, 160);
  }

  function startLongPress() {
    longPressTriggered.current = false;
    clearLongPress();
    longPressTimer.current = window.setTimeout(() => {
      longPressTriggered.current = true;
      openMenu();
    }, 520);
  }

  function finishPress() {
    clearLongPress();
  }

  function handleClick() {
    if (longPressTriggered.current) {
      longPressTriggered.current = false;
      return;
    }
    if (menuOpen) {
      closeMenu();
      return;
    }
    onClick();
  }

  return (
    <div className={`category-row ${active ? "active" : ""}`}>
      <button
        onClick={handleClick}
        onPointerDown={startLongPress}
        onPointerUp={finishPress}
        onPointerCancel={finishPress}
        onPointerLeave={finishPress}
        onContextMenu={(event) => {
          event.preventDefault();
          openMenu();
        }}
      >
        <i style={{ background: color }} />
        <span>
          <b>{name}</b>
          <small>{count} {count === 1 ? "abbonamento" : "abbonamenti"}</small>
        </span>
        <strong>{currency(total, currencyCode)}</strong>
        <ChevronRight size={18} />
      </button>
      {menuOpen && createPortal(
        <div
          className={`context-layer ${menuState === "closing" ? "closing" : ""}`}
          onClick={(event) => {
            event.stopPropagation();
            closeMenu();
          }}
          onPointerDown={(event) => event.stopPropagation()}
        >
          <div
            className="context-menu"
            onClick={(event) => event.stopPropagation()}
            onPointerDown={(event) => event.stopPropagation()}
          >
            <div className="context-grabber" />
            <div className="context-preview" style={{ "--accent": color }}>
              <div className="logo-dot" style={{ "--accent": color }}>
                {name.slice(0, 1).toUpperCase()}
              </div>
              <div>
                <strong>{name}</strong>
                <span>{count} {count === 1 ? "abbonamento" : "abbonamenti"} · {currency(total, currencyCode)}</span>
              </div>
            </div>
            <button onClick={() => runMenuAction(onClick)}>
              <LayoutDashboard size={20} />
              <span>Mostra abbonamenti</span>
              <ChevronRight size={18} />
            </button>
            <button onClick={() => runMenuAction(onEdit)}>
              <Edit3 size={20} />
              <span>Modifica</span>
              <ChevronRight size={18} />
            </button>
            <button className="danger-text" onClick={() => runMenuAction(onDelete)}>
              <Trash2 size={20} />
              <span>Elimina</span>
              <ChevronRight size={18} />
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

function SubscriptionAvatar({ subscription, category, size = "" }) {
  const preset = presetForSubscription(subscription);
  const accent = category?.color || "#17d5f4";

  if (subscription.imageData) {
    return (
      <div className={`logo-dot image ${size}`} style={{ "--accent": accent }}>
        <img src={subscription.imageData} alt="" />
      </div>
    );
  }

  if (preset) {
    return (
      <div
        className={`logo-dot brand ${size}`}
        style={{
          "--accent": preset.bg,
          "--brand-bg": preset.bg,
          "--brand-fg": preset.fg,
          "--brand-img-filter": preset.imageFilter || "none"
        }}
      >
        <BrandMark preset={preset} />
      </div>
    );
  }

  return (
    <div className={`logo-dot ${size}`} style={{ "--accent": accent }}>
      {subscription.name.slice(0, 1).toUpperCase()}
    </div>
  );
}

function SubscriptionCard({ subscription, category, currencyCode, showMonthlyInList, onOpen, onEdit, onDelete }) {
  const days = daysUntil(subscription.renewalDate);
  const urgency = days <= 1 ? "danger" : days <= subscription.reminderDays ? "warning" : "calm";
  const note = subscription.note?.trim();
  const displayPrice = showMonthlyInList ? monthlyCost(subscription) : subscription.price;
  const [menuState, setMenuState] = useState("closed");
  const longPressTimer = useRef(null);
  const longPressTriggered = useRef(false);
  const menuOpen = menuState !== "closed";

  function clearLongPress() {
    window.clearTimeout(longPressTimer.current);
    longPressTimer.current = null;
  }

  function startLongPress() {
    longPressTriggered.current = false;
    clearLongPress();
    longPressTimer.current = window.setTimeout(() => {
      longPressTriggered.current = true;
      openMenu();
    }, 520);
  }

  function finishPress() {
    clearLongPress();
  }

  function handleClick() {
    if (longPressTriggered.current) {
      longPressTriggered.current = false;
      return;
    }
    if (menuOpen) {
      closeMenu();
      return;
    }
    onOpen();
  }

  function openMenu() {
    setMenuState("open");
  }

  function closeMenu() {
    setMenuState("closing");
    window.setTimeout(() => setMenuState("closed"), 190);
  }

  function runMenuAction(action) {
    closeMenu();
    window.setTimeout(action, 160);
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpen();
    }
  }

  return (
    <article
      className={`sub-card ${urgency} ${menuOpen ? "menu-open" : ""}`}
      style={{ "--accent": category?.color || "#17d5f4" }}
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onPointerDown={startLongPress}
      onPointerUp={finishPress}
      onPointerCancel={finishPress}
      onPointerLeave={finishPress}
      onContextMenu={(event) => {
        event.preventDefault();
        openMenu();
      }}
    >
      <div className="sub-card-glow" style={{ "--accent": category?.color || "#17d5f4" }} />
      <div className="sub-main">
        <SubscriptionAvatar subscription={subscription} category={category} />
        <div>
          <h3>{subscription.name}</h3>
          <div className="sub-descriptors">
            <span>{category?.name || "Senza categoria"}</span>
            {note && <span>{note}</span>}
          </div>
        </div>
      </div>
      <div className="sub-meta">
        <span className="cadence-badge">{cadenceLabel(subscription.cadence)}</span>
        <strong>{currency(displayPrice, currencyCode)}</strong>
        {showMonthlyInList && subscription.cadence !== "monthly" && <small>/ mese</small>}
      </div>
      <div className="renewal-pill">
        <CalendarClock size={16} />
        <span>{days < 0 ? "Scaduto" : days === 0 ? "Oggi" : `${days} giorni`}</span>
      </div>
      <div className="sub-actions">
        <ChevronRight size={20} />
      </div>
      {menuOpen && createPortal(
        <div
          className={`context-layer ${menuState === "closing" ? "closing" : ""}`}
          onClick={(event) => {
            event.stopPropagation();
            closeMenu();
          }}
          onPointerDown={(event) => event.stopPropagation()}
        >
          <div
            className="context-menu"
            onClick={(event) => event.stopPropagation()}
            onPointerDown={(event) => event.stopPropagation()}
          >
            <div className="context-grabber" />
            <div className="context-preview" style={{ "--accent": category?.color || "#17d5f4" }}>
              <SubscriptionAvatar subscription={subscription} category={category} />
              <div>
                <strong>{subscription.name}</strong>
                <span>{category?.name || "Senza categoria"} · {currency(subscription.price, currencyCode)}</span>
              </div>
            </div>
            <button onClick={() => runMenuAction(onOpen)}>
              <CalendarClock size={20} />
              <span>Dettaglio</span>
              <ChevronRight size={18} />
            </button>
            <button onClick={() => runMenuAction(onEdit)}>
              <Edit3 size={20} />
              <span>Modifica</span>
              <ChevronRight size={18} />
            </button>
            <button className="danger-text" onClick={() => runMenuAction(onDelete)}>
              <Trash2 size={20} />
              <span>Elimina</span>
              <ChevronRight size={18} />
            </button>
          </div>
        </div>,
        document.body
      )}
    </article>
  );
}

function SubscriptionDetailModal({ subscription, category, currencyCode, closing, onClose, onEdit, onDelete }) {
  const days = daysUntil(subscription.renewalDate);

  return (
    <Modal title={subscription.name} closing={closing} onClose={onClose}>
      <div className="detail-sheet">
        <div className="detail-hero" style={{ "--accent": category?.color || "#17d5f4" }}>
          <SubscriptionAvatar subscription={subscription} category={category} size="large" />
          <div>
            <span>{category?.name || "Senza categoria"}</span>
            <strong>{currency(subscription.price, currencyCode)}</strong>
            <small>{cadenceLabel(subscription.cadence)}</small>
          </div>
        </div>

        <div className="detail-grid">
          <DetailTile label="Rinnovo" value={formatDate(subscription.renewalDate)} icon={<CalendarClock />} />
          <DetailTile label="Mancano" value={days < 0 ? "Scaduto" : days === 0 ? "Oggi" : `${days} giorni`} icon={<Clock3 />} />
          <DetailTile label="Promemoria" value={`${subscription.reminderDays} giorni prima`} icon={<Bell />} />
          <DetailTile label="Costo mensile" value={currency(monthlyCost(subscription), currencyCode)} icon={<CircleDollarSign />} />
        </div>

        <div className="detail-note">
          <span>Nota</span>
          <p>{subscription.note || "Nessuna nota salvata per questo abbonamento."}</p>
        </div>

        <div className="modal-actions detail-actions">
          <button className="ghost danger-text" type="button" onClick={onDelete}>
            <Trash2 size={17} />
            Elimina
          </button>
          <button className="primary" type="button" onClick={onEdit}>
            <Edit3 size={17} />
            Modifica
          </button>
        </div>
      </div>
    </Modal>
  );
}

function DetailTile({ icon, label, value }) {
  return (
    <div className="detail-tile">
      {React.cloneElement(icon, { size: 18 })}
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function SubscriptionModal({ subscription, categories, currencyCode, closing, onClose, onSave }) {
  const [draft, setDraft] = useState(subscription);
  const previewCategory = categories.find((category) => category.id === draft.categoryId);

  function update(field, value) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function updatePrice(value) {
    update("price", value.replace(",", ".").replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1"));
  }

  function handleImageUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setDraft((current) => ({
        ...current,
        imageData: reader.result,
        imagePreset: ""
      }));
    };
    reader.readAsDataURL(file);
  }

  return (
    <Modal title={subscription.id ? "Modifica abbonamento" : "Nuovo abbonamento"} closing={closing} onClose={onClose}>
      <form className="modal-form" onSubmit={(event) => { event.preventDefault(); onSave(draft); }}>
        <label>
          Nome
          <input required value={draft.name} onChange={(event) => update("name", event.target.value)} placeholder="Spotify, Adobe, palestra..." />
        </label>
        <div className="image-picker">
          <div className="image-picker-preview">
            <SubscriptionAvatar subscription={draft} category={previewCategory} size="large" />
            <div>
              <strong>Immagine abbonamento</strong>
              <span>Preset famosi o immagine personalizzata locale.</span>
            </div>
          </div>
          <div className="preset-grid" aria-label="Preset abbonamenti famosi">
            {BRAND_PRESETS.map((preset) => (
              <button
                key={preset.id}
                className={draft.imagePreset === preset.id && !draft.imageData ? "active" : ""}
                type="button"
                onClick={() => setDraft((current) => ({ ...current, imagePreset: preset.id, imageData: "" }))}
                title={preset.name}
              >
                <span
                  style={{
                    "--brand-bg": preset.bg,
                    "--brand-fg": preset.fg,
                    "--brand-img-filter": preset.imageFilter || "none"
                  }}
                >
                  <BrandMark preset={preset} />
                </span>
                <small>{preset.name}</small>
              </button>
            ))}
          </div>
          <div className="image-actions">
            <label className="upload-button">
              Carica immagine
              <input accept="image/*" type="file" onChange={handleImageUpload} />
            </label>
            {(draft.imageData || draft.imagePreset) && (
              <button
                className="ghost"
                type="button"
                onClick={() => setDraft((current) => ({ ...current, imageData: "", imagePreset: "" }))}
              >
                Rimuovi
              </button>
            )}
          </div>
        </div>
        <div className="form-grid">
          <label>
            Prezzo
            <input
              required
              inputMode="decimal"
              value={draft.price}
              onChange={(event) => updatePrice(event.target.value)}
            />
          </label>
          <label>
            Frequenza
            <select value={draft.cadence} onChange={(event) => update("cadence", event.target.value)}>
              <option value="monthly">Mensile</option>
              <option value="yearly">Annuale</option>
              <option value="biannual">Biannuale</option>
              <option value="weekly">Settimanale</option>
            </select>
          </label>
        </div>
        <div className="form-grid">
          <label>
            Rinnovo
            <input required type="date" value={draft.renewalDate} onChange={(event) => update("renewalDate", event.target.value)} />
          </label>
          <label>
            Promemoria
            <select value={draft.reminderDays} onChange={(event) => update("reminderDays", Number(event.target.value))}>
              {REMINDER_DAYS.map((days) => <option key={days} value={days}>{days} giorni prima</option>)}
            </select>
          </label>
        </div>
        <label>
          Categoria
          <select value={draft.categoryId} onChange={(event) => update("categoryId", event.target.value)}>
            {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
          </select>
        </label>
        <label>
          Nota
          <textarea value={draft.note} onChange={(event) => update("note", event.target.value)} placeholder="Piano, account, dettagli utili" />
        </label>
        <div className="modal-total">
          <Tag size={17} />
          Impatto mensile stimato: <strong>{currency(monthlyCost(draft), currencyCode)}</strong>
        </div>
        <button className="primary" type="submit">
          <Check size={18} />
          Salva
        </button>
      </form>
    </Modal>
  );
}

function CategoryModal({ category, closing, onClose, onSave, onDelete }) {
  const [draft, setDraft] = useState(category);

  return (
    <Modal title={category.id ? "Modifica categoria" : "Nuova categoria"} closing={closing} onClose={onClose}>
      <form className="modal-form" onSubmit={(event) => { event.preventDefault(); onSave(draft); }}>
        <label>
          Nome
          <input required value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
        </label>
        <label>
          Colore
          <div className="color-input">
            <Palette size={18} />
            <input type="color" value={draft.color} onChange={(event) => setDraft({ ...draft, color: event.target.value })} />
            <span>{draft.color}</span>
          </div>
        </label>
        <div className="modal-actions">
          {onDelete && (
            <button className="ghost danger-text" type="button" onClick={() => { onDelete(); onClose(); }}>
              <Trash2 size={17} />
              Elimina
            </button>
          )}
          <button className="primary" type="submit">
            <Check size={18} />
            Salva
          </button>
        </div>
      </form>
    </Modal>
  );
}

function Onboarding({ onStart, onClose }) {
  const steps = [
    {
      title: "Tieni tutto sotto controllo",
      text: "Salva abbonamenti, prezzo, categoria e data di rinnovo in un unico posto semplice e locale.",
      icon: <WalletCards />
    },
    {
      title: "Promemoria prima del rinnovo",
      text: "Scegli quanti giorni prima vuoi essere avvisato e Subber ti ricorda le scadenze importanti.",
      icon: <Bell />
    },
    {
      title: "I tuoi dati restano tuoi",
      text: "Tutto vive sul dispositivo. Quando vuoi, puoi esportare o ripristinare un backup JSON.",
      icon: <Download />
    }
  ];

  return createPortal(
    <div className="onboarding-layer" role="dialog" aria-modal="true">
      <section className="onboarding-card">
        <div className="onboarding-orbit" aria-hidden="true">
          <img src="/logo.png" alt="" />
        </div>
        <div className="onboarding-copy">
          <span className="eyebrow"><Sparkles size={15} /> Benvenuto in Subber</span>
          <h2>La tua app per non perdere piu' un rinnovo.</h2>
          <p>Parti da una lista vuota e costruisci il tuo archivio di abbonamenti con categorie, loghi, costi e notifiche.</p>
        </div>
        <div className="onboarding-steps">
          {steps.map((step, index) => (
            <article key={step.title} style={{ "--delay": `${index * 80}ms` }}>
              <span>{React.cloneElement(step.icon, { size: 20 })}</span>
              <div>
                <strong>{step.title}</strong>
                <p>{step.text}</p>
              </div>
            </article>
          ))}
        </div>
        <div className="onboarding-actions">
          <button className="ghost" type="button" onClick={onClose}>
            Più tardi
          </button>
          <button className="primary" type="button" onClick={onStart}>
            <Plus size={18} />
            Aggiungi il primo
          </button>
        </div>
      </section>
    </div>,
    document.body
  );
}

function Modal({ title, children, closing, onClose }) {
  return (
    <div className={`modal-backdrop ${closing ? "closing" : ""}`} role="dialog" aria-modal="true" onClick={onClose}>
      <div className="modal-card" onClick={(event) => event.stopPropagation()}>
        <div className="modal-head">
          <strong>{title}</strong>
          <button className="icon-button small" title="Chiudi" onClick={onClose}>
            <X size={17} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function emptySubscription(categoryId) {
  return {
    id: "",
    name: "",
    price: "",
    cadence: "monthly",
    categoryId,
    renewalDate: nextDate(7),
    reminderDays: 3,
    imagePreset: "",
    imageData: "",
    note: ""
  };
}

function emptyCategory() {
  return { id: "", name: "", color: "#17d5f4" };
}

createRoot(document.getElementById("root")).render(<App />);
