import { useEffect, useMemo, useRef, useState } from "react"

const COFFEE_PRICE = 6000

const DEFAULT_GOALS = [
  { id: "dining", name: "외식", emoji: "🍽️", targetAmount: 50000 },
  { id: "shopping", name: "쇼핑", emoji: "👚", targetAmount: 500000 },
  { id: "travel", name: "여행", emoji: "✈️", targetAmount: 1000000 },
]

const SUCCESS_MESSAGES = [
  "오늘도 절약 성공!",
  "좋은 선택이에요 👏",
  "한 걸음 더 가까워졌어요",
  "잘하고 있어요 👍",
  "오늘 기록 완료",
]

function useCountUp(value, duration = 500) {
  const [displayValue, setDisplayValue] = useState(value)
  const previousRef = useRef(value)

  useEffect(() => {
    const startValue = previousRef.current
    const endValue = value
    const startTime = performance.now()

    let frameId

    const animate = (now) => {
      const progress = Math.min((now - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const nextValue = Math.round(startValue + (endValue - startValue) * eased)
      setDisplayValue(nextValue)

      if (progress < 1) {
        frameId = requestAnimationFrame(animate)
      } else {
        previousRef.current = endValue
      }
    }

    frameId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frameId)
  }, [value, duration])

  return displayValue
}

function getTodayKey() {
  return new Date().toISOString().slice(0, 10)
}

function formatShareDate() {
  const date = new Date()
  return `${date.getFullYear()}. ${date.getMonth() + 1}. ${date.getDate()}.`
}

function formatWon(value) {
  return `${value.toLocaleString()}원`
}

export default function App() {
  const [selectedGoalId, setSelectedGoalId] = useState(DEFAULT_GOALS[0].id)
  const [savedMoney, setSavedMoney] = useState(0)
  const [streak, setStreak] = useState(0)
  const [historyMap, setHistoryMap] = useState({})
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showSkipModal, setShowSkipModal] = useState(false)
  const [confetti, setConfetti] = useState(false)
  const [shareToast, setShareToast] = useState(false)
  const [moneyPop, setMoneyPop] = useState(false)
  const [successMessage, setSuccessMessage] = useState(SUCCESS_MESSAGES[0])

  const [customGoals, setCustomGoals] = useState([])
  const [showGoalModal, setShowGoalModal] = useState(false)
  const [newGoalName, setNewGoalName] = useState("")
  const [newGoalEmoji, setNewGoalEmoji] = useState("🎯")
  const [newGoalAmount, setNewGoalAmount] = useState("")

  useEffect(() => {
    const savedMoneyValue = localStorage.getItem("savedMoney")
    const savedStreak = localStorage.getItem("streak")
    const savedHistoryMap = localStorage.getItem("historyMap")
    const savedCustomGoals = localStorage.getItem("customGoals")
    const savedSelectedGoalId = localStorage.getItem("selectedGoalId")

    if (savedMoneyValue) setSavedMoney(Number(savedMoneyValue))
    if (savedStreak) setStreak(Number(savedStreak))
    if (savedHistoryMap) setHistoryMap(JSON.parse(savedHistoryMap))
    if (savedCustomGoals) setCustomGoals(JSON.parse(savedCustomGoals))
    if (savedSelectedGoalId) setSelectedGoalId(savedSelectedGoalId)
  }, [])

  const allGoals = useMemo(() => [...DEFAULT_GOALS, ...customGoals], [customGoals])

  const selectedGoal =
    allGoals.find((goal) => goal.id === selectedGoalId) || allGoals[0]

  const targetAmount = selectedGoal?.targetAmount || 0
  const progress =
    targetAmount > 0 ? Math.min((savedMoney / targetAmount) * 100, 100) : 0
  const remainingMoney = Math.max(0, targetAmount - savedMoney)

  const animatedMoney = useCountUp(savedMoney, 450)
  const animatedStreak = useCountUp(streak, 350)

  const todayKey = getTodayKey()
  const todayStatus = historyMap[todayKey] || "none"
  const isDone = todayStatus === "save"

  const calendarDays = (() => {
    const days = []

    for (let i = 29; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const key = date.toISOString().slice(0, 10)

      days.push({
        key,
        status: historyMap[key] || "none",
      })
    }

    return days
  })()

  const triggerMoneyPop = () => {
    setMoneyPop(false)
    window.setTimeout(() => {
      setMoneyPop(true)
      window.setTimeout(() => setMoneyPop(false), 320)
    }, 10)
  }

  const handleSaveCoffee = () => {
    const today = getTodayKey()
    const currentStatus = historyMap[today]

    if (currentStatus === "save") {
      setShowSuccessModal(true)
      return
    }

    let newMoney = savedMoney + COFFEE_PRICE
    let newStreak = streak + 1
    let newHistoryMap = {
      ...historyMap,
      [today]: "save",
    }

    if (currentStatus === "skip") {
      newHistoryMap = {
        ...historyMap,
        [today]: "save",
      }
      newStreak = 1
    }

    setSavedMoney(newMoney)
    setHistoryMap(newHistoryMap)
    setStreak(newStreak)

    localStorage.setItem("savedMoney", String(newMoney))
    localStorage.setItem("historyMap", JSON.stringify(newHistoryMap))
    localStorage.setItem("streak", String(newStreak))

    triggerMoneyPop()
    setSuccessMessage(
      SUCCESS_MESSAGES[Math.floor(Math.random() * SUCCESS_MESSAGES.length)],
    )
    setConfetti(true)
    setShowSuccessModal(true)
    window.setTimeout(() => setConfetti(false), 1400)
  }

  const handleSkipCoffee = () => {
    const today = getTodayKey()
    const currentStatus = historyMap[today]

    if (currentStatus === "skip") {
      setShowSkipModal(true)
      return
    }

    let newMoney = savedMoney
    const newHistoryMap = {
      ...historyMap,
      [today]: "skip",
    }

    if (currentStatus === "save") {
      newMoney = Math.max(0, savedMoney - COFFEE_PRICE)
    }

    setSavedMoney(newMoney)
    setHistoryMap(newHistoryMap)
    setStreak(0)

    localStorage.setItem("savedMoney", String(newMoney))
    localStorage.setItem("historyMap", JSON.stringify(newHistoryMap))
    localStorage.setItem("streak", "0")

    setShowSkipModal(true)
  }

  const handleShare = async () => {
    const text = `${formatShareDate()}
나는 오늘 커피 대신
${formatWon(COFFEE_PRICE)}을 아꼈다 ☕`

    try {
      await navigator.clipboard.writeText(text)
      setShareToast(true)
      window.setTimeout(() => setShareToast(false), 1800)
    } catch {
      alert(text)
    }
  }

  const handleOpenGoalModal = () => {
    setNewGoalName("")
    setNewGoalEmoji("🎯")
    setNewGoalAmount("")
    setShowGoalModal(true)
  }

  const handleAddGoal = () => {
    const trimmedName = newGoalName.trim()
    const amount = Number(newGoalAmount)

    if (!trimmedName || !amount) return

    const newGoal = {
      id: `custom-${Date.now()}`,
      name: trimmedName,
      emoji: newGoalEmoji.trim() || "🎯",
      targetAmount: amount,
    }

    const nextGoals = [...customGoals, newGoal]
    setCustomGoals(nextGoals)
    setSelectedGoalId(newGoal.id)

    localStorage.setItem("customGoals", JSON.stringify(nextGoals))
    localStorage.setItem("selectedGoalId", newGoal.id)

    setShowGoalModal(false)
  }

  const handleSelectGoal = (goalId) => {
    setSelectedGoalId(goalId)
    localStorage.setItem("selectedGoalId", goalId)
  }

  return (
    <>
      <style>{`
        @keyframes modalUp {
          from {
            opacity: 0;
            transform: translateY(16px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes toastUp {
          from {
            opacity: 0;
            transform: translate(-50%, 10px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }

        @keyframes confettiDrop {
          0% {
            opacity: 0;
            transform: translateY(-10px) scale(0.8) rotate(0deg);
          }
          15% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translateY(120px) scale(1) rotate(260deg);
          }
        }

        @keyframes sparkle {
          0%, 100% {
            transform: scale(0.9);
            opacity: 0.6;
          }
          50% {
            transform: scale(1.08);
            opacity: 1;
          }
        }

        @keyframes moneyPopBlue {
          0% {
            transform: scale(1);
            color: #191F28;
          }
          35% {
            transform: scale(1.065);
            color: #3182F6;
          }
          100% {
            transform: scale(1);
            color: #191F28;
          }
        }
      `}</style>

      <div className="min-h-screen bg-[#F9FAFB] text-[#191F28] flex justify-center px-5 py-6 relative overflow-hidden">
        {confetti && (
          <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden">
            <div className="absolute left-1/2 top-[92px] -translate-x-1/2">
              <div className="absolute -left-10 top-2 text-[18px] animate-[sparkle_900ms_ease-in-out]">
                ✨
              </div>
              <div className="absolute left-16 -top-1 text-[18px] animate-[sparkle_950ms_ease-in-out]">
                ✨
              </div>
            </div>

            {[...Array(22)].map((_, i) => {
              const isBlue = i % 3 !== 0
              const size = i % 4 === 0 ? 10 : 8
              return (
                <div
                  key={i}
                  className={`absolute rounded-full ${
                    isBlue ? "bg-[#3182F6]" : "bg-[#AFCFFF]"
                  }`}
                  style={{
                    width: `${size}px`,
                    height: `${size}px`,
                    left: `${12 + Math.random() * 76}%`,
                    top: `${6 + Math.random() * 10}%`,
                    animation: `confettiDrop ${900 + Math.random() * 700}ms ease-out forwards`,
                    animationDelay: `${Math.random() * 180}ms`,
                  }}
                />
              )
            })}
          </div>
        )}

        <div className="w-full max-w-md pb-44">
          <div className="text-center mb-5 px-2">
            <p className="text-[13px] font-semibold text-[#3182F6] tracking-[-0.01em]">
              커피 한 잔부터 시작하는 절약
            </p>
            <h1 className="text-[30px] leading-[36px] font-bold tracking-[-0.04em] mt-2">
              ☕ 커피 절약 루틴
            </h1>
            <p className="text-sm text-[#8B95A1] mt-2 leading-6">
              오늘 한 번 덜 쓰고, 목표에 한 걸음 더 가까워져요
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-[24px] p-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
              <div className="bg-[#F2F4F6] rounded-2xl p-1 flex gap-1 overflow-x-auto">
                {allGoals.map((goal) => (
                  <button
                    key={goal.id}
                    onClick={() => handleSelectGoal(goal.id)}
                    className={`shrink-0 min-w-fit px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
                      selectedGoalId === goal.id
                        ? "bg-white text-[#3182F6] shadow-sm"
                        : "text-[#6B7684]"
                    }`}
                  >
                    {goal.name} {goal.emoji}
                  </button>
                ))}

                <button
                  onClick={handleOpenGoalModal}
                  className="shrink-0 min-w-fit px-4 py-2.5 rounded-xl text-sm font-semibold text-[#6B7684] transition"
                >
                  직접 추가 ✍️
                </button>
              </div>

              <div className="text-center mt-5">
                <p className="text-sm text-[#8B95A1]">이번 목표</p>
                <h2 className="text-[25px] leading-[31px] font-bold tracking-[-0.035em] mt-1">
                  {selectedGoal.name} {selectedGoal.emoji}
                </h2>

                <div className="mt-4 bg-[#F9FAFB] rounded-2xl px-4 py-4">
                  <p className="text-[14px] text-[#6B7684] leading-6">목표 금액</p>
                  <p className="text-[#191F28] font-bold text-[18px] leading-7 mt-1 tracking-[-0.02em]">
                    {formatWon(selectedGoal.targetAmount)}
                  </p>
                </div>

                <div className="mt-3 bg-[#F9FAFB] rounded-2xl px-4 py-4">
                  <p className="text-[14px] text-[#6B7684] leading-6">
                    오늘 커피 {formatWon(COFFEE_PRICE)}을 아끼면
                  </p>
                  <p className="text-[#3182F6] font-bold text-[18px] leading-7 mt-1 tracking-[-0.02em]">
                    목표에 더 가까워져요
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[24px] p-6 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
              <p className="text-sm text-[#8B95A1]">누적 절약</p>

              <p
                className={`text-[34px] leading-[40px] font-bold tracking-[-0.04em] mt-2 origin-center ${
                  moneyPop ? "animate-[moneyPopBlue_320ms_ease-out]" : ""
                }`}
              >
                {animatedMoney.toLocaleString()}원
              </p>

              <div className="w-full bg-[#F2F4F6] h-3 rounded-full mt-5 overflow-hidden">
                <div
                  className="bg-[#3182F6] h-3 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="flex items-center justify-between mt-2 text-xs text-[#8B95A1]">
                <span>목표 달성률</span>
                <span>{progress.toFixed(1)}%</span>
              </div>

              <div className="mt-4 bg-[#F9FAFB] rounded-2xl px-4 py-3.5 flex items-center justify-between">
                <span className="text-sm text-[#6B7684]">남은 금액</span>
                <span className="text-[18px] font-bold tracking-[-0.02em]">
                  {formatWon(remainingMoney)}
                </span>
              </div>

              {todayStatus === "save" && (
                <div className="mt-4 bg-[#EEF6FF] rounded-2xl px-4 py-3.5">
                  <p className="text-[14px] font-semibold text-[#3182F6] text-center">
                    ✔ 오늘 절약 완료
                  </p>
                </div>
              )}

              {todayStatus === "skip" && (
                <div className="mt-4 bg-[#F2F4F6] rounded-2xl px-4 py-3.5">
                  <p className="text-[14px] font-semibold text-[#4E5968] text-center">
                    ☕ 오늘은 쉬는날
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-[24px] p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
                <p className="text-sm text-[#8B95A1]">연속 기록</p>
                <p className="text-[24px] font-bold mt-2 tracking-[-0.03em]">
                  🔥 {animatedStreak}일
                </p>
              </div>

              <div className="bg-white rounded-[24px] p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
                <p className="text-sm text-[#8B95A1]">오늘 절약 금액</p>
                <p className="text-[22px] font-bold mt-2 tracking-[-0.03em]">
                  {formatWon(COFFEE_PRICE)}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-[24px] p-6 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-[#8B95A1]">최근 절약 기록</p>
                <span className="text-xs text-[#8B95A1]">최근 30일</span>
              </div>

              <div className="grid grid-cols-10 gap-2">
                {calendarDays.map(({ key, status }) => (
                  <div
                    key={key}
                    title={
                      status === "save"
                        ? "절약 성공"
                        : status === "skip"
                          ? "마심"
                          : "미접속"
                    }
                    className={`w-6 h-6 rounded-md ${
                      status === "save"
                        ? "bg-[#3182F6]"
                        : status === "skip"
                          ? "bg-[#6B7684]"
                          : "bg-[#E5E8EB]"
                    }`}
                  />
                ))}
              </div>

              <div className="flex items-center gap-4 mt-4 text-xs text-[#8B95A1]">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-[4px] bg-[#3182F6]" />
                  <span>절약 성공</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-[4px] bg-[#6B7684]" />
                  <span>마심</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-[4px] bg-[#E5E8EB]" />
                  <span>미접속</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[24px] p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
              <p className="text-sm text-[#8B95A1] mb-3">공유하기</p>

              <div className="bg-[#EEF6FF] rounded-2xl p-4">
                <p className="text-xs text-[#8B95A1] mb-2">{formatShareDate()}</p>

                <p className="text-[15px] leading-6 text-[#191F28] font-semibold tracking-[-0.01em]">
                  나는 오늘 커피 대신
                  <br />
                  {formatWon(COFFEE_PRICE)}을 아꼈다 ☕
                </p>
              </div>

              <button
                onClick={handleShare}
                className="w-full mt-4 bg-[#F2F4F6] text-[#3182F6] py-3.5 rounded-2xl font-semibold active:scale-[0.99] transition"
              >
                공유 문구 복사하기
              </button>
            </div>
          </div>

          <div className="fixed bottom-5 left-1/2 -translate-x-1/2 w-[calc(100%-32px)] max-w-md z-30">
            <div className="rounded-[28px] bg-[rgba(249,250,251,0.88)] backdrop-blur-xl border border-[rgba(229,232,235,0.9)] shadow-[0_16px_40px_rgba(15,23,42,0.12)] p-3">
              <button
                onClick={handleSaveCoffee}
                disabled={isDone}
                className={`w-full rounded-[22px] px-5 py-4 transition ${
                  isDone
                    ? "bg-[#E5E8EB] text-[#8B95A1] cursor-not-allowed shadow-none"
                    : "bg-[#3182F6] text-white shadow-[0_10px_20px_rgba(49,130,246,0.25)] hover:brightness-95 active:scale-[0.99]"
                }`}
              >
                <div
                  className={`flex items-center ${
                    isDone ? "justify-center" : "justify-between"
                  } gap-4`}
                >
                  <div className={isDone ? "text-center" : "text-left"}>
                    <p className="text-[17px] leading-[22px] font-bold tracking-[-0.03em]">
                      {isDone ? "오늘 절약 완료 ✔" : "오늘도 커피 참기 ☕"}
                    </p>

                    {!isDone && (
                      <p className="text-[12px] leading-4 text-[rgba(255,255,255,0.82)] mt-1">
                        커피 한 잔 대신 {formatWon(COFFEE_PRICE)} 절약하기
                      </p>
                    )}
                  </div>

                  {!isDone && <div className="shrink-0 text-[20px]">→</div>}
                </div>
              </button>

              <button
                onClick={handleSkipCoffee}
                disabled={isDone}
                className={`w-full mt-2.5 py-3 rounded-[18px] font-semibold text-[15px] transition ${
                  isDone
                    ? "bg-transparent text-[#D1D6DB] cursor-not-allowed"
                    : "bg-transparent text-[#6B7684] hover:bg-[#F2F4F6] active:scale-[0.99]"
                }`}
              >
                오늘은 마실래요 ☕
              </button>
            </div>
          </div>
        </div>

        {showSuccessModal && (
          <div className="fixed inset-0 z-50 bg-[rgba(25,31,40,0.46)] flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0">
            <div className="w-full max-w-sm bg-white rounded-[32px] px-6 pt-6 pb-5 text-center shadow-[0_24px_48px_rgba(15,23,42,0.18)] animate-[modalUp_.22s_ease-out]">
              <div className="relative w-16 h-16 mx-auto">
                <div className="absolute inset-0 rounded-full bg-[#EEF6FF]" />
                <div className="relative w-full h-full flex items-center justify-center text-[30px]">
                  🎉
                </div>
              </div>

              <h2 className="mt-4 text-[24px] leading-[30px] font-bold tracking-[-0.03em]">
                절약 성공
              </h2>

              <p className="mt-2 text-sm leading-6 text-[#4E5968]">
                {successMessage}
              </p>

              <div className="mt-5 bg-[#F9FAFB] rounded-2xl px-4 py-4">
                <p className="text-xs text-[#8B95A1]">이번 절약으로</p>
                <p className="mt-1 text-[18px] font-bold tracking-[-0.02em] text-[#191F28]">
                  {formatWon(COFFEE_PRICE)} 추가
                </p>
              </div>

              <div className="mt-3 bg-[#F9FAFB] rounded-2xl px-4 py-4">
                <p className="text-xs text-[#8B95A1]">현재 목표</p>
                <p className="mt-1 text-[16px] font-bold tracking-[-0.02em] text-[#191F28]">
                  {selectedGoal.name} {selectedGoal.emoji}
                </p>
              </div>

              <div className="mt-6 space-y-2.5">
                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="w-full bg-[#3182F6] text-white py-3.5 rounded-2xl font-semibold"
                >
                  확인
                </button>
              </div>
            </div>
          </div>
        )}

        {showSkipModal && (
          <div className="fixed inset-0 z-50 bg-[rgba(25,31,40,0.46)] flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0">
            <div className="w-full max-w-sm bg-white rounded-[32px] px-6 pt-6 pb-5 text-center shadow-[0_24px_48px_rgba(15,23,42,0.18)] animate-[modalUp_.22s_ease-out]">
              <div className="w-14 h-14 mx-auto rounded-full bg-[#F2F4F6] flex items-center justify-center text-[28px]">
                ☕
              </div>

              <h2 className="mt-4 text-[24px] leading-[30px] font-bold tracking-[-0.03em]">
                오늘은 쉬는날
              </h2>

              <p className="mt-2 text-sm leading-6 text-[#4E5968]">
                가끔은 마셔도 괜찮아요.
                <br />
                내일 다시 시작하면 됩니다.
              </p>

              <div className="mt-6 space-y-2.5">
                <button
                  onClick={() => setShowSkipModal(false)}
                  className="w-full bg-[#F2F4F6] text-[#4E5968] py-3.5 rounded-2xl font-semibold"
                >
                  확인
                </button>
              </div>
            </div>
          </div>
        )}

        {shareToast && (
          <div className="fixed bottom-36 left-1/2 -translate-x-1/2 bg-[#191F28] text-white text-sm px-4 py-2 rounded-full shadow-lg animate-[toastUp_.18s_ease-out] z-50">
            공유 문구를 복사했어요
          </div>
        )}

        {showGoalModal && (
          <div className="fixed inset-0 z-50 bg-[rgba(25,31,40,0.46)] flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0">
            <div className="w-full max-w-sm bg-white rounded-[32px] px-6 pt-6 pb-5 shadow-[0_24px_48px_rgba(15,23,42,0.18)] animate-[modalUp_.22s_ease-out]">
              <h2 className="text-[22px] leading-[28px] font-bold tracking-[-0.03em] text-center">
                새 목표 만들기
              </h2>

              <div className="mt-5 space-y-3">
                <div>
                  <label className="text-xs text-[#6B7684]">목표 이름</label>
                  <input
                    value={newGoalName}
                    onChange={(e) => setNewGoalName(e.target.value)}
                    placeholder="예: 운동화, 데이트, 주말여행"
                    className="w-full mt-1 rounded-2xl border border-[#E5E8EB] bg-white px-4 py-3 outline-none focus:border-[#3182F6]"
                  />
                </div>

                <div>
                  <label className="text-xs text-[#6B7684]">이모지</label>
                  <input
                    value={newGoalEmoji}
                    onChange={(e) => setNewGoalEmoji(e.target.value)}
                    placeholder="예: 👟"
                    className="w-full mt-1 rounded-2xl border border-[#E5E8EB] bg-white px-4 py-3 outline-none focus:border-[#3182F6]"
                  />
                </div>

                <div>
                  <label className="text-xs text-[#6B7684]">목표 금액</label>
                  <input
                    type="number"
                    value={newGoalAmount}
                    onChange={(e) => setNewGoalAmount(e.target.value)}
                    placeholder="예: 30000"
                    className="w-full mt-1 rounded-2xl border border-[#E5E8EB] bg-white px-4 py-3 outline-none focus:border-[#3182F6]"
                  />
                </div>
              </div>

              <div className="mt-6 space-y-2.5">
                <button
                  onClick={handleAddGoal}
                  className="w-full bg-[#3182F6] text-white py-3.5 rounded-2xl font-semibold"
                >
                  추가하기
                </button>

                <button
                  onClick={() => setShowGoalModal(false)}
                  className="w-full bg-[#F2F4F6] text-[#4E5968] py-3.5 rounded-2xl font-semibold"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}