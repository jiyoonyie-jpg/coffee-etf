import { useEffect, useMemo, useState } from "react";
import Confetti from "react-confetti";

const GOALS = [
  { key: "dining", label: "외식 🍽️", shortLabel: "외식 🍽️", target: 50000 },
  { key: "shopping", label: "쇼핑 👚", shortLabel: "쇼핑 👚", target: 80000 },
  { key: "travel", label: "여행 ✈️", shortLabel: "여행 ✈️", target: 300000 },
  { key: "custom", label: "직접 추가 ✍️", shortLabel: "직접추가 ✍️", target: 100000 },
];

const DAILY_SAVE_AMOUNT = 6000;

function formatWon(value) {
  return `${value.toLocaleString()}원`;
}

function getTodayKey() {
  const now = new Date();
  const y = now.getFullYear();
  const m = `${now.getMonth() + 1}`.padStart(2, "0");
  const d = `${now.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getTodayDisplay() {
  const now = new Date();
  return `${now.getFullYear()}. ${now.getMonth() + 1}. ${now.getDate()}`;
}

function buildLast30Days(records) {
  const days = [];
  const today = new Date();

  for (let i = 29; i >= 0; i -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);

    const y = date.getFullYear();
    const m = `${date.getMonth() + 1}`.padStart(2, "0");
    const d = `${date.getDate()}`.padStart(2, "0");
    const key = `${y}-${m}-${d}`;

    let status = "empty";
    if (records[key] === "saved") status = "saved";
    if (records[key] === "spent") status = "spent";

    days.push({ key, status });
  }

  return days;
}

export default function App() {
  const [selectedGoal, setSelectedGoal] = useState(GOALS[0]);
  const [customGoalName, setCustomGoalName] = useState("나만의 목표");
  const [customGoalAmount, setCustomGoalAmount] = useState(100000);

  const [records, setRecords] = useState({});
  const [copied, setCopied] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const todayKey = getTodayKey();
  const todayStatus = records[todayKey] || null;

  useEffect(() => {
    const savedGoalKey = localStorage.getItem("coffee_goal_key");
    const savedCustomGoalName = localStorage.getItem("coffee_custom_goal_name");
    const savedCustomGoalAmount = localStorage.getItem("coffee_custom_goal_amount");
    const savedRecords = localStorage.getItem("coffee_records");

    if (savedGoalKey) {
      const found = GOALS.find((goal) => goal.key === savedGoalKey);
      if (found) {
        setSelectedGoal(found);
      }
    }

    if (savedCustomGoalName) {
      setCustomGoalName(savedCustomGoalName);
    }

    if (savedCustomGoalAmount) {
      const parsed = Number(savedCustomGoalAmount);
      if (!Number.isNaN(parsed) && parsed > 0) {
        setCustomGoalAmount(parsed);
      }
    }

    if (savedRecords) {
      try {
        const parsed = JSON.parse(savedRecords);
        setRecords(parsed);
      } catch (error) {
        console.error("기록 불러오기 실패:", error);
      }
    }

    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem("coffee_goal_key", selectedGoal.key);
  }, [selectedGoal, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem("coffee_custom_goal_name", customGoalName);
  }, [customGoalName, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem("coffee_custom_goal_amount", String(customGoalAmount));
  }, [customGoalAmount, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem("coffee_records", JSON.stringify(records));
  }, [records, isLoaded]);

  useEffect(() => {
    if (!showConfetti) return;

    const timer = setTimeout(() => {
      setShowConfetti(false);
    }, 2800);

    return () => clearTimeout(timer);
  }, [showConfetti]);

  useEffect(() => {
    if (!showToast) return;

    const timer = setTimeout(() => {
      setShowToast(false);
    }, 1800);

    return () => clearTimeout(timer);
  }, [showToast]);

  const effectiveGoal = useMemo(() => {
    if (selectedGoal.key !== "custom") return selectedGoal;

    return {
      ...selectedGoal,
      label: `${customGoalName} ✨`,
      shortLabel: `${customGoalName} ✨`,
      target: customGoalAmount,
    };
  }, [selectedGoal, customGoalName, customGoalAmount]);

  const totalSaved =
    Object.values(records).filter((value) => value === "saved").length * DAILY_SAVE_AMOUNT;

  const streak = useMemo(() => {
    let count = 0;
    const cursor = new Date();

    while (true) {
      const y = cursor.getFullYear();
      const m = `${cursor.getMonth() + 1}`.padStart(2, "0");
      const d = `${cursor.getDate()}`.padStart(2, "0");
      const key = `${y}-${m}-${d}`;

      if (records[key] === "saved") {
        count += 1;
        cursor.setDate(cursor.getDate() - 1);
      } else {
        break;
      }
    }

    return count;
  }, [records]);

  const progress = Math.min((totalSaved / effectiveGoal.target) * 100, 100);
  const remaining = Math.max(effectiveGoal.target - totalSaved, 0);
  const last30Days = buildLast30Days(records);

  const handleSaveToday = () => {
    if (!isLoaded || todayStatus === "saved") return;

    setRecords((prev) => ({
      ...prev,
      [todayKey]: "saved",
    }));
    setShowConfetti(true);
    setShowToast(true);
  };

  const handleSpentToday = () => {
    if (!isLoaded) return;

    setRecords((prev) => ({
      ...prev,
      [todayKey]: "spent",
    }));
  };

  const handleCopy = async () => {
    const text = `나는 오늘 커피 대신\n${formatWon(DAILY_SAVE_AMOUNT)}을 아꼈어요 ☕`;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (error) {
      console.error("복사 실패:", error);
    }
  };

  const statusMessage =
    todayStatus === "saved"
      ? "목표에 더 가까워졌어요"
      : todayStatus === "spent"
      ? "오늘은 쉬어가도 괜찮아요"
      : "목표에 한 걸음 더 가까워져요 💰";

  return (
    <div className="min-h-screen bg-[#f2f3f5] pb-36 text-[#191f28]">
      <style>{`
        @keyframes toastFadeInDown {
          from {
            opacity: 0;
            transform: translate(-50%, -8px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }

        @keyframes todayCellPopGlow {
          0% {
            transform: scale(1);
            box-shadow: 0 0 0 rgba(49, 130, 246, 0);
          }
          35% {
            transform: scale(1.18);
            box-shadow: 0 0 0 6px rgba(49, 130, 246, 0.16);
          }
          70% {
            transform: scale(0.96);
            box-shadow: 0 0 0 10px rgba(49, 130, 246, 0.08);
          }
          100% {
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(49, 130, 246, 0);
          }
        }
      `}</style>

      {showConfetti && (
        <Confetti
          recycle={false}
          numberOfPieces={110}
          gravity={0.18}
          initialVelocityY={7}
          tweenDuration={2800}
          colors={["#c7d2fe", "#bfdbfe", "#dbeafe", "#e9d5ff", "#ddd6fe"]}
        />
      )}

      {showToast && (
        <div
          className="fixed left-1/2 top-8 z-[9999]"
          style={{ animation: "toastFadeInDown 0.28s ease-out forwards" }}
        >
          <div className="rounded-full bg-[#191f28] px-5 py-3 text-[14px] font-semibold text-white shadow-[0_8px_24px_rgba(0,0,0,0.18)]">
            🎉 오늘도 절약 성공!
          </div>
        </div>
      )}

      <div className="mx-auto max-w-[420px] px-4 pt-4">
        <div className="py-3 text-center">
          <p className="text-[12px] font-semibold text-[#3182f6]">
            커피 한 잔부터 시작하는 절약
          </p>

          <h1 className="mt-2 text-[40px] font-extrabold tracking-[-0.03em]">
            ☕ 커피 절약 루틴
          </h1>

          <p className="mt-2 text-[14px] text-[#8b95a1]">
            오늘의 절약이 내일의 여유가 됩니다
          </p>
        </div>

        <section className="rounded-[28px] bg-white p-4 shadow-[0_8px_24px_rgba(0,0,0,0.04)]">
          <div className="rounded-[20px] bg-[#f7f8fa] p-2">
            <div className="grid grid-cols-4 gap-2">
              {GOALS.map((goal) => {
                const active = selectedGoal.key === goal.key;

                return (
                  <button
                    key={goal.key}
                    onClick={() => setSelectedGoal(goal)}
                    className={`min-w-0 rounded-full px-2 py-2 text-[13px] font-semibold leading-none transition ${
                      active
                        ? "bg-white text-[#3182f6] shadow-sm"
                        : "text-[#4e5968]"
                    }`}
                  >
                    {goal.shortLabel}
                  </button>
                );
              })}
            </div>
          </div>

          {selectedGoal.key === "custom" && (
            <div className="mt-4 grid gap-3 rounded-[20px] bg-[#f7f8fa] p-4">
              <div>
                <label className="mb-2 block text-[13px] font-medium text-[#4e5968]">
                  목표 이름
                </label>
                <input
                  value={customGoalName}
                  onChange={(e) => setCustomGoalName(e.target.value || "나만의 목표")}
                  className="w-full rounded-2xl border border-[#e5e8eb] bg-white px-4 py-3 text-[15px] outline-none"
                  placeholder="예: 운동화, 책, 비상금"
                />
              </div>

              <div>
                <label className="mb-2 block text-[13px] font-medium text-[#4e5968]">
                  목표 금액
                </label>
                <input
                  type="number"
                  value={customGoalAmount}
                  onChange={(e) => setCustomGoalAmount(Number(e.target.value) || 0)}
                  className="w-full rounded-2xl border border-[#e5e8eb] bg-white px-4 py-3 text-[15px] outline-none"
                  placeholder="금액 입력"
                />
              </div>
            </div>
          )}

          <div className="mt-4 rounded-[22px] bg-[#f7f8fa] px-5 py-6 text-center">
            <p className="text-[14px] text-[#8b95a1]">이번 목표</p>
            <h2 className="mt-2 text-[22px] font-bold">{effectiveGoal.shortLabel}</h2>

            <div className="mt-5 rounded-[18px] bg-white px-4 py-5">
              <p className="text-[14px] text-[#8b95a1]">목표 금액</p>
              <p className="mt-2 text-[18px] font-bold">{formatWon(effectiveGoal.target)}</p>
            </div>

            <div className="mt-4 rounded-[18px] bg-white px-4 py-5">
              <p className="text-[14px] text-[#8b95a1]">
                오늘 커피{" "}
                <span className="font-semibold text-[#3182f6]">
                  {formatWon(DAILY_SAVE_AMOUNT)}
                </span>
                을 아끼면
              </p>
              <p className="mt-2 text-[16px] font-bold text-[#3182f6]">{statusMessage}</p>
            </div>
          </div>
        </section>

        <section className="mt-4 rounded-[28px] bg-white p-4 shadow-[0_8px_24px_rgba(0,0,0,0.04)]">
          <p className="text-[13px] text-[#8b95a1]">누적 절약</p>
          <p className="mt-2 text-[22px] font-extrabold">{formatWon(totalSaved)}</p>

          <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-[#f2f4f6]">
            <div
              className="h-full rounded-full bg-[#3182f6] transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="mt-2 flex items-center justify-between text-[12px] text-[#8b95a1]">
            <span>목표 달성률</span>
            <span>{progress.toFixed(1)}%</span>
          </div>

          <div className="mt-4 rounded-[18px] bg-[#f7f8fa] px-4 py-4">
            <div className="flex items-center justify-between">
              <span className="text-[14px] text-[#8b95a1]">남은 금액</span>
              <span className="text-[16px] font-bold">{formatWon(remaining)}</span>
            </div>
          </div>

          {todayStatus === "saved" && (
            <div className="mt-4 flex items-center justify-center gap-1 text-[14px] font-semibold text-[#3182f6]">
              <span>✔</span>
              <span>오늘 절약 완료</span>
            </div>
          )}

          {todayStatus === "spent" && (
            <div className="mt-4 flex items-center justify-center gap-1 text-[14px] font-semibold text-[#8b95a1]">
              <span>☕</span>
              <span>오늘은 마셨어요</span>
            </div>
          )}
        </section>

        <section className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-[22px] bg-white p-4 shadow-[0_8px_24px_rgba(0,0,0,0.04)]">
            <p className="text-[13px] text-[#8b95a1]">연속 기록</p>
            <p className="mt-3 text-[26px] font-extrabold">🔥 {streak}일</p>
          </div>

          <div className="rounded-[22px] bg-white p-4 shadow-[0_8px_24px_rgba(0,0,0,0.04)]">
            <p className="text-[13px] text-[#8b95a1]">오늘 절약 금액</p>
            <p className="mt-3 text-[26px] font-extrabold">
              {todayStatus === "saved" ? formatWon(DAILY_SAVE_AMOUNT) : "0원"}
            </p>
          </div>
        </section>

        <section className="mt-4 rounded-[28px] bg-white p-4 shadow-[0_8px_24px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between">
            <p className="text-[13px] text-[#8b95a1]">최근 절약 기록</p>
            <p className="text-[12px] text-[#8b95a1]">최근 30일</p>
          </div>

          <div className="mt-4 grid grid-cols-10 gap-2">
            {last30Days.map((day) => {
              const baseClass = "h-5 w-5 rounded-[4px] transition-transform";
              const colorClass =
                day.status === "saved"
                  ? "bg-[#3182f6]"
                  : day.status === "spent"
                  ? "bg-[#191f28]"
                  : "bg-[#e5e8eb]";

              const isTodaySaved = day.key === todayKey && day.status === "saved";

              return (
                <div
                  key={day.key}
                  className={`${baseClass} ${colorClass}`}
                  style={
                    isTodaySaved
                      ? {
                          animation: "todayCellPopGlow 0.7s ease-out",
                          boxShadow: "0 0 0 3px rgba(49,130,246,0.12)",
                        }
                      : undefined
                  }
                />
              );
            })}
          </div>

          <div className="mt-4 flex items-center gap-4 text-[11px] text-[#8b95a1]">
            <div className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-[#3182f6]" />
              <span>절약 성공</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-[#191f28]" />
              <span>마심</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-[#e5e8eb]" />
              <span>미기록</span>
            </div>
          </div>
        </section>

        <section className="mt-4 rounded-[28px] bg-white p-4 shadow-[0_8px_24px_rgba(0,0,0,0.04)]">
          <p className="text-[13px] text-[#8b95a1]">공유하기</p>

          <div className="mt-3 rounded-[18px] bg-[#eef5ff] p-4">
            <p className="text-[11px] text-[#8b95a1]">{getTodayDisplay()}</p>
            <p className="mt-2 whitespace-pre-line text-[15px] font-semibold text-[#191f28]">
              {`나는 오늘 커피 대신\n${formatWon(DAILY_SAVE_AMOUNT)}을 아꼈어요 ☕`}
            </p>
          </div>

          <button
            onClick={handleCopy}
            className="mt-3 w-full rounded-[16px] bg-[#f2f4f6] px-4 py-3 text-[15px] font-semibold text-[#3182f6]"
          >
            {copied ? "복사 완료!" : "문구 복사하기"}
          </button>
        </section>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-[#f2f3f5] via-[#f2f3f5] to-transparent px-4 pb-6 pt-10">
        <div className="mx-auto max-w-[420px] rounded-[28px] bg-white p-4 shadow-[0_-8px_24px_rgba(0,0,0,0.04)]">
          <button
            onClick={handleSaveToday}
            disabled={!isLoaded || todayStatus === "saved"}
            className={`w-full rounded-[18px] px-4 py-4 text-[15px] font-bold transition ${
              !isLoaded || todayStatus === "saved"
                ? "bg-[#e9edf3] text-[#8b95a1]"
                : "bg-[#eaf2ff] text-[#3182f6]"
            }`}
          >
            {!isLoaded
              ? "불러오는 중..."
              : todayStatus === "saved"
              ? "오늘 절약 완료 💰"
              : "오늘 절약 완료 💰"}
          </button>

          <button
            onClick={handleSpentToday}
            disabled={!isLoaded || todayStatus === "spent"}
            className={`mt-3 w-full rounded-[18px] px-4 py-4 text-[15px] font-semibold transition ${
              !isLoaded || todayStatus === "spent"
                ? "bg-[#f2f4f6] text-[#8b95a1]"
                : "bg-white text-[#8b95a1]"
            }`}
          >
           오늘은 마실래요 ☕️
      </button>
    </div>
  </div>

 <footer className="w-full bg-[#f3f4f6] py-10 mt-5 border-t border-gray-100">
  <div className="max-w-md mx-auto px-6 flex flex-col items-center gap-3">
    {/* Contact Section: This is a single clickable block */}
    <a 
      href="mailto:y2s2@hanmail.net" 
      className="flex flex-col items-center gap-1.5 group"
    >
      <span className="text-[10px] text-gray-400 font-medium tracking-wider uppercase">
        Contact & Advertise
      </span>
      {/* Clickable text without showing email */}
      <span className="text-sm text-gray-500 group-hover:text-blue-600 transition-colors font-semibold underline underline-offset-4 decoration-gray-300">
        [광고/제휴 문의 ✉️] 
      </span>
    </a>
    {/* Copyright text without showing name directly */}
    <p className="text-[10px] text-gray-300 mt-2 italic">© 2026. All rights reserved.</p>
  </div>
</footer>
</div>
);
}