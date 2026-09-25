import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "http://localhost:5000";

function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const toRadians = (value) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/* =========================================================
   SMALL REUSABLE COMPONENTS
   ========================================================= */

function StatusBadge({ status }) {
  return (
    <span
      className={`status-badge ${String(status)
        .toLowerCase()
        .replaceAll(" ", "-")}`}
    >
      {status}
    </span>
  );
}

function DeliveryTracking({ status }) {
  const steps = [
    "Pending",
    "Accepted",
    "Preparing",
    "Out for Delivery",
    "Delivered",
  ];

  if (status === "Rejected") {
    return (
      <div className="delivery-tracking">
        <div className="tracking-rejected">
          <strong>Order Rejected</strong>
          <p>The farmer has rejected this order.</p>
        </div>
      </div>
    );
  }

  const currentIndex = steps.indexOf(status);

  return (
    <div className="delivery-tracking">
      {steps.map((step, index) => (
        <div className="tracking-step" key={step}>
          <div
            className={`tracking-circle ${
              index <= currentIndex ? "active" : ""
            }`}
          >
            {index < currentIndex ? "✓" : index + 1}
          </div>

          <div
            className={`tracking-label ${
              index <= currentIndex ? "active" : ""
            }`}
          >
            {step}
          </div>

          {index < steps.length - 1 && (
            <div
              className={`tracking-line ${
                index < currentIndex ? "active" : ""
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
function VoiceAssistant({ setPage }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [language, setLanguage] = useState("en-IN");
  const languages = [
  { code: "en-IN", name: "English", flag: "🇬🇧" },
  { code: "hi-IN", name: "हिन्दी", flag: "🇮🇳" },
  { code: "mr-IN", name: "मराठी", flag: "🇮🇳" },
  { code: "gu-IN", name: "ગુજરાતી", flag: "🇮🇳" },
  { code: "pa-IN", name: "ਪੰਜਾਬੀ", flag: "🇮🇳" },
  { code: "bn-IN", name: "বাংলা", flag: "🇮🇳" },
  { code: "ta-IN", name: "தமிழ்", flag: "🇮🇳" },
  { code: "te-IN", name: "తెలుగు", flag: "🇮🇳" },
  { code: "kn-IN", name: "ಕನ್ನಡ", flag: "🇮🇳" },
  { code: "ml-IN", name: "മലയാളം", flag: "🇮🇳" },
];
  const [message, setMessage] = useState(
    "Hello! How can I help you?"
  );

  // =========================================
  // SPEAK TEXT
  // =========================================

  function speak(text) {
    if (!("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    utterance.lang = language;
    utterance.rate = 0.9;
    utterance.pitch = 1;

    window.speechSynthesis.speak(utterance);
  }

  // =========================================
  // LANGUAGE NAME
  // =========================================

  function getLanguageName() {
    if (language === "hi-IN") return "Hindi";
    if (language === "mr-IN") return "Marathi";

    return "English";
  }

  // =========================================
  // AI ASSISTANT
  // =========================================

  async function askFarmConnectAI(question) {
    try {
      setIsThinking(true);

      const thinkingMessage =
        language === "hi-IN"
          ? "सोच रहा हूँ..."
          : language === "mr-IN"
          ? "विचार करत आहे..."
          : "Thinking...";

      setMessage(thinkingMessage);

      /*
       * During local development:
       * http://localhost:5000
       *
       * On deployed website:
       * https://farmconnect-hawh.onrender.com
       */

      const AI_API_URL =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1"
          ? "http://localhost:5000"
          : API_URL;

      const response = await fetch(
        `${AI_API_URL}/api/ai/chat`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            message: question,
            language: language,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "AI request failed"
        );
      }

      const answer =
        data.answer ||
        "Sorry, I could not generate an answer.";

      setMessage(answer);

      speak(answer);

    } catch (error) {
      console.error(
        "FarmConnect AI error:",
        error
      );

      const errorMessage =
        language === "hi-IN"
          ? "माफ़ कीजिए, अभी AI सेवा उपलब्ध नहीं है। कृपया थोड़ी देर बाद फिर कोशिश करें।"
          : language === "mr-IN"
          ? "माफ करा, सध्या AI सेवा उपलब्ध नाही. कृपया थोड्या वेळाने पुन्हा प्रयत्न करा."
          : "Sorry, the AI assistant is currently unavailable. Please try again later.";

      setMessage(errorMessage);

      speak(errorMessage);

    } finally {
      setIsThinking(false);
    }
  }

  // =========================================
  // HANDLE COMMAND
  // =========================================

  async function handleCommand(command) {
    const text = command.toLowerCase().trim();

    if (!text) return;

    // =========================================
    // HOME
    // =========================================

    if (
      text.includes("home") ||
      text.includes("होम") ||
      text.includes("मुख्य पृष्ठ") ||
      text.includes("मुख्यपृष्ठ") ||
      text.includes("घर")
    ) {
      setPage("home");

      const reply =
        language === "hi-IN"
          ? "मैं आपको होम पेज पर ले जा रहा हूँ।"
          : language === "mr-IN"
          ? "मी तुम्हाला होम पेजवर घेऊन जात आहे."
          : "Taking you to the home page.";

      setMessage(reply);
      speak(reply);

      return;
    }

    // =========================================
    // MARKETPLACE
    // =========================================

    if (
      text.includes("marketplace") ||
      text.includes("market") ||
      text.includes("products") ||
      text.includes("vegetables") ||
      text.includes("बाजार") ||
      text.includes("मार्केट") ||
      text.includes("सब्जी") ||
      text.includes("भाजी") ||
      text.includes("उत्पादने")
    ) {
      setPage("marketplace");

      const reply =
        language === "hi-IN"
          ? "मैं आपके लिए मार्केटप्लेस खोल रहा हूँ।"
          : language === "mr-IN"
          ? "मी तुमच्यासाठी मार्केटप्लेस उघडत आहे."
          : "Opening the FarmConnect marketplace.";

      setMessage(reply);
      speak(reply);

      return;
    }

    // =========================================
    // FARMER
    // =========================================

    if (
      text.includes("farmer") ||
      text.includes("sell") ||
      text.includes("farmer dashboard") ||
      text.includes("किसान") ||
      text.includes("बेचना") ||
      text.includes("शेतकरी") ||
      text.includes("विकायचे") ||
      text.includes("विकायचं")
    ) {
      setPage("farmer");

      const reply =
        language === "hi-IN"
          ? "मैं किसान डैशबोर्ड खोल रहा हूँ।"
          : language === "mr-IN"
          ? "मी शेतकरी डॅशबोर्ड उघडत आहे."
          : "Opening the farmer dashboard.";

      setMessage(reply);
      speak(reply);

      return;
    }

    // =========================================
    // RETAILER
    // =========================================

    if (
      text.includes("retailer") ||
      text.includes("wholesale") ||
      text.includes("रिटेलर") ||
      text.includes("थोक") ||
      text.includes("किरकोळ") ||
      text.includes("घाऊक")
    ) {
      setPage("retailer");

      const reply =
        language === "hi-IN"
          ? "मैं रिटेलर पेज खोल रहा हूँ।"
          : language === "mr-IN"
          ? "मी रिटेलर पेज उघडत आहे."
          : "Opening the retailer page.";

      setMessage(reply);
      speak(reply);

      return;
    }

    // =========================================
    // MY ORDERS
    // =========================================

    if (
      text.includes("my orders") ||
      text.includes("orders") ||
      text.includes("order") ||
      text.includes("मेरे ऑर्डर") ||
      text.includes("ऑर्डर") ||
      text.includes("माझे ऑर्डर") ||
      text.includes("ऑर्डर दाखवा")
    ) {
      setPage("myorders");

      const reply =
        language === "hi-IN"
          ? "मैं आपके ऑर्डर खोल रहा हूँ।"
          : language === "mr-IN"
          ? "मी तुमचे ऑर्डर उघडत आहे."
          : "Opening your orders.";

      setMessage(reply);
      speak(reply);

      return;
    }

    // =========================================
    // LOGIN
    // =========================================

    if (
      text.includes("login") ||
      text.includes("log in") ||
      text.includes("sign in") ||
      text.includes("लॉगिन") ||
      text.includes("लॉग इन") ||
      text.includes("लॉग इन करा")
    ) {
      setPage("auth");

      const reply =
        language === "hi-IN"
          ? "मैं लॉगिन पेज खोल रहा हूँ।"
          : language === "mr-IN"
          ? "मी लॉगिन पेज उघडत आहे."
          : "Opening the login page.";

      setMessage(reply);
      speak(reply);

      return;
    }

    // =========================================
    // HELP
    // =========================================

    if (
      text.includes("help") ||
      text.includes("what can you do") ||
      text.includes("मदद") ||
      text.includes("क्या कर सकते") ||
      text.includes("मदत") ||
      text.includes("तुम्ही काय करू शकता")
    ) {
      const reply =
        language === "hi-IN"
          ? "आप मुझसे खेती, फसल, मिट्टी, सिंचाई, कीट, फसल की बीमारी और खेती से जुड़े सवाल पूछ सकते हैं। आप मार्केटप्लेस, ऑर्डर, किसान पेज, रिटेलर पेज या होम पेज भी खोल सकते हैं।"
          : language === "mr-IN"
          ? "तुम्ही मला शेती, पिके, माती, सिंचन, कीड, पिकांचे रोग आणि शेतीशी संबंधित प्रश्न विचारू शकता. तुम्ही मार्केटप्लेस, ऑर्डर, शेतकरी पेज, रिटेलर पेज किंवा होम पेज देखील उघडू शकता."
          : "You can ask me about crops, soil, irrigation, pests, crop diseases, harvesting and farming. You can also ask me to open the marketplace, your orders, farmer page, retailer page or home page.";

      setMessage(reply);
      speak(reply);

      return;
    }

    // =========================================
    // OTHERWISE → ASK AI
    // =========================================

    await askFarmConnectAI(command);
  }

  // =========================================
  // START LISTENING
  // =========================================

  function startListening() {
    if (isListening || isThinking) return;

    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      const reply =
        language === "hi-IN"
          ? "इस ब्राउज़र में वॉइस रिकग्निशन उपलब्ध नहीं है। कृपया Google Chrome का उपयोग करें।"
          : language === "mr-IN"
          ? "या ब्राउझरमध्ये व्हॉइस रिकग्निशन उपलब्ध नाही. कृपया Google Chrome वापरा."
          : "Voice recognition is not supported in this browser. Please use Google Chrome.";

      setMessage(reply);
      speak(reply);

      return;
    }

    const recognition =
      new SpeechRecognition();

    recognition.lang = language;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);

      const listeningMessage =
        language === "hi-IN"
          ? "सुन रहा हूँ..."
          : language === "mr-IN"
          ? "ऐकत आहे..."
          : "Listening...";

      setMessage(listeningMessage);
    };

    recognition.onresult = (event) => {
      const transcript =
        event.results[0][0].transcript;

      setMessage(`"${transcript}"`);

      handleCommand(transcript);
    };

    recognition.onerror = (event) => {
      console.error(
        "Voice recognition error:",
        event.error
      );

      setIsListening(false);

      let errorMessage =
        "I couldn't hear you. Please try again.";

      if (language === "hi-IN") {
        errorMessage =
          "मैं आपकी आवाज़ नहीं सुन पाया। कृपया फिर से कोशिश करें।";
      }

      if (language === "mr-IN") {
        errorMessage =
          "मला तुमचा आवाज ऐकू आला नाही. कृपया पुन्हा प्रयत्न करा.";
      }

      setMessage(errorMessage);
      speak(errorMessage);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  }

  function changeLanguage(event) {
  const nextLanguage = event.target.value;

  setLanguage(nextLanguage);

  const selectedLanguage = languages.find(
    (lang) => lang.code === nextLanguage
  );

  const reply =
    nextLanguage === "en-IN"
      ? "I will now assist you in English."
      : nextLanguage === "hi-IN"
      ? "अब मैं हिंदी में आपकी सहायता करूंगा।"
      : nextLanguage === "mr-IN"
      ? "आता मी तुम्हाला मराठीत मदत करेन."
      : nextLanguage === "gu-IN"
      ? "હવે હું તમને ગુજરાતીમાં મદદ કરીશ."
      : nextLanguage === "pa-IN"
      ? "ਹੁਣ ਮੈਂ ਪੰਜਾਬੀ ਵਿੱਚ ਤੁਹਾਡੀ ਮਦਦ ਕਰਾਂਗਾ।"
      : nextLanguage === "bn-IN"
      ? "এখন আমি আপনাকে বাংলায় সাহায্য করব।"
      : nextLanguage === "ta-IN"
      ? "இப்போது நான் உங்களுக்கு தமிழில் உதவுவேன்."
      : nextLanguage === "te-IN"
      ? "ఇప్పుడు నేను మీకు తెలుగులో సహాయం చేస్తాను."
      : nextLanguage === "kn-IN"
      ? "ಈಗ ನಾನು ನಿಮಗೆ ಕನ್ನಡದಲ್ಲಿ ಸಹಾಯ ಮಾಡುತ್ತೇನೆ."
      : nextLanguage === "ml-IN"
      ? "ഇനി ഞാൻ നിങ്ങളെ മലയാളത്തിൽ സഹായിക്കും."
      : `I will assist you in ${selectedLanguage?.name || "English"}.`;

  setMessage(reply);
  speak(reply);
}

  // =========================================
  // LANGUAGE BUTTON TEXT
  // =========================================

  function getLanguageButtonText() {
    if (language === "en-IN") {
      return "हिंदी में बोलें";
    }

    if (language === "hi-IN") {
      return "मराठीमध्ये बोला";
    }

    return "Speak in English";
  }

  // =========================================
  // RENDER
  // =========================================

 return (
  <>
    {isOpen && (
      <div className="voice-assistant-panel">

        {/* HEADER */}
        <div className="voice-assistant-header">
          <div>
            <span className="voice-small-label">
              FARMCONNECT
            </span>

            <h3>AI Farming Assistant</h3>
          </div>

          <button
            type="button"
            className="voice-close-btn"
            onClick={() => {
              setIsOpen(false);
              window.speechSynthesis?.cancel();
            }}
          >
            ×
          </button>
        </div>

        {/* ICON */}
        <div className="voice-assistant-icon">
          {isListening
            ? "🔴"
            : isThinking
            ? "🤖"
            : "🌱"}
        </div>

        {/* AI MESSAGE */}
        <p className="voice-status">
          {message}
        </p>

        {/* TEXT INPUT */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            marginBottom: "10px",
          }}
        >
          <input
            type="text"
            placeholder={
              language === "hi-IN"
                ? "अपना सवाल लिखें..."
                : language === "mr-IN"
                ? "तुमचा प्रश्न लिहा..."
                : "Type your farming question..."
            }
            id="farmconnect-ai-input"
            disabled={isThinking || isListening}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                const input =
                  event.currentTarget.value.trim();

                if (!input) return;

                event.currentTarget.value = "";

                handleCommand(input);
              }
            }}
            style={{
              flex: 1,
              padding: "12px",
              border: "1px solid #d9e5dc",
              borderRadius: "10px",
              outline: "none",
              fontSize: "14px",
            }}
          />

          <button
            type="button"
            disabled={isThinking || isListening}
            onClick={() => {
              const input =
                document.getElementById(
                  "farmconnect-ai-input"
                );

              if (!input) return;

              const question =
                input.value.trim();

              if (!question) return;

              input.value = "";

              handleCommand(question);
            }}
            style={{
              padding: "10px 14px",
              border: "none",
              borderRadius: "10px",
              background: "#2e7d32",
              color: "white",
              fontWeight: "700",
              cursor: "pointer",
            }}
          >
            ➤
          </button>
        </div>

        {/* VOICE BUTTON */}
        <button
          type="button"
          className={`voice-listen-btn ${
            isListening ? "listening" : ""
          }`}
          onClick={startListening}
          disabled={isListening || isThinking}
        >
          {isListening
            ? "🔴 Listening..."
            : isThinking
            ? "🤖 Thinking..."
            : "🎤 Tap to Speak"}
        </button>

       {/* LANGUAGE SELECTOR */}
<select
  className="voice-language-btn"
  value={language}
  onChange={changeLanguage}
  disabled={isListening || isThinking}
  aria-label="Select language"
>
  {languages.map((lang) => (
    <option key={lang.code} value={lang.code}>
      {lang.flag} {lang.name}
    </option>
  ))}
</select>

        {/* LANGUAGE */}
        <div
          style={{
            marginTop: "8px",
            fontSize: "12px",
            opacity: 0.7,
            textAlign: "center",
          }}
        >
          Language: {getLanguageName()}
        </div>

        {/* EXAMPLES */}
        <div className="voice-examples">

          <span>Try asking:</span>

          {language === "en-IN" ? (
            <>
              <button
                type="button"
                onClick={() =>
                  handleCommand(
                    "What fertilizer is good for tomato?"
                  )
                }
              >
                "What fertilizer is good for tomato?"
              </button>

              <button
                type="button"
                onClick={() =>
                  handleCommand(
                    "How often should I water my crops?"
                  )
                }
              >
                "How often should I water my crops?"
              </button>

              <button
                type="button"
                onClick={() =>
                  handleCommand(
                    "How can I control pests naturally?"
                  )
                }
              >
                "How can I control pests naturally?"
              </button>
            </>
          ) : language === "hi-IN" ? (
            <>
              <button
                type="button"
                onClick={() =>
                  handleCommand(
                    "टमाटर के लिए कौन सा खाद अच्छा है?"
                  )
                }
              >
                "टमाटर के लिए कौन सा खाद अच्छा है?"
              </button>

              <button
                type="button"
                onClick={() =>
                  handleCommand(
                    "फसल में कितनी बार पानी देना चाहिए?"
                  )
                }
              >
                "फसल में कितनी बार पानी देना चाहिए?"
              </button>

              <button
                type="button"
                onClick={() =>
                  handleCommand(
                    "कीटों को प्राकृतिक तरीके से कैसे नियंत्रित करें?"
                  )
                }
              >
                "कीटों को प्राकृतिक तरीके से कैसे नियंत्रित करें?"
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() =>
                  handleCommand(
                    "टोमॅटोसाठी कोणते खत चांगले आहे?"
                  )
                }
              >
                "टोमॅटोसाठी कोणते खत चांगले आहे?"
              </button>

              <button
                type="button"
                onClick={() =>
                  handleCommand(
                    "पिकांना किती वेळा पाणी द्यावे?"
                  )
                }
              >
                "पिकांना किती वेळा पाणी द्यावे?"
              </button>

              <button
                type="button"
                onClick={() =>
                  handleCommand(
                    "किडींवर नैसर्गिक पद्धतीने नियंत्रण कसे करावे?"
                  )
                }
              >
                "किडींवर नैसर्गिक पद्धतीने नियंत्रण कसे करावे?"
              </button>
            </>
          )}

        </div>

      </div>
    )}

    {/* FLOATING BUTTON */}
    <button
      type="button"
      className={`voice-floating-button ${
        isListening ? "active" : ""
      }`}
      onClick={() =>
        setIsOpen(
          (previous) => !previous
        )
      }
      aria-label="Open FarmConnect AI assistant"
    >
      {isListening
        ? "🔴"
        : isThinking
        ? "🤖"
        : "🎙️"}

      <span className="voice-floating-label">
        AI Assistant
      </span>
    </button>
  </>
);
}

/* =========================================================
   NAVBAR
   ========================================================= */

function Navbar({
  user,
  setPage,
  handleLogout,
  fetchMyOrders,
}) {
  return (
    <nav className="navbar">
      <button
        className="logo"
        onClick={() => setPage("home")}
        type="button"
      >
        🌱 FarmConnect
      </button>

      <div className="nav-links">
        <button type="button" onClick={() => setPage("home")}>
          Home
        </button>

        <button
          type="button"
          onClick={() => setPage("marketplace")}
        >
          Marketplace
        </button>

        {user?.role === "Farmer" && (
          <button
            type="button"
            onClick={() => setPage("farmer")}
          >
            Farmer
          </button>
        )}

        {user?.role === "Retailer" && (
          <button
            type="button"
            onClick={() => setPage("retailer")}
          >
            Retailer
          </button>
        )}

        {user && (
          <button
            type="button"
            onClick={() => {
              fetchMyOrders();
              setPage("myorders");
            }}
          >
            My Orders
          </button>
        )}

        {user ? (
          <>
            <span className="user-name">👤 {user.name}</span>

            <button
              className="login-nav-btn"
              type="button"
              onClick={handleLogout}
            >
              Logout
            </button>
          </>
        ) : (
          <button
            className="login-nav-btn"
            type="button"
            onClick={() => setPage("auth")}
          >
            Login
          </button>
        )}
      </div>
    </nav>
  );
}

/* =========================================================
   HOME PAGE
   ========================================================= */

function HomePage({ user, setPage }) {
  return (
    <>
      {/* =====================================================
          HERO
      ===================================================== */}
      <section className="hero hero-modern">
        <div className="hero-content">
          <div className="hero-badge">
            <span>🌱</span>
            DIRECT • TRANSPARENT • LOCAL
          </div>

          <h1>
            Fresh From Indian
            <span> Farms. Direct To You.</span>
          </h1>

          <p className="hero-description">
            FarmConnect connects farmers directly with consumers
            and retailers, making fresh agricultural produce more
            accessible, transparent and fairly priced.
          </p>

          <div className="hero-buttons">
            <button
              className="primary-btn hero-primary"
              type="button"
              onClick={() => setPage("marketplace")}
            >
              🛒 Explore Marketplace
            </button>

            {!user && (
              <button
                className="secondary-btn hero-secondary"
                type="button"
                onClick={() => setPage("auth")}
              >
                🤝 Join FarmConnect
              </button>
            )}
          </div>

          <div className="hero-trust">
            <div className="hero-trust-item">
              <div className="trust-icon">🌾</div>
              <div>
                <strong>Direct from farms</strong>
                <span>Buy closer to the source</span>
              </div>
            </div>

            <div className="hero-trust-item">
              <div className="trust-icon">₹</div>
              <div>
                <strong>Transparent pricing</strong>
                <span>See the listed farm price</span>
              </div>
            </div>

            <div className="hero-trust-item">
              <div className="trust-icon">🔍</div>
              <div>
                <strong>Know your food</strong>
                <span>View farming information</span>
              </div>
            </div>
          </div>
        </div>

        {/* REAL FARMER IMAGE */}
        <div className="hero-photo-area">
          <div className="hero-photo-frame">
            <img
              src="/images/hero-farmer.jpg"
              alt="Indian farmer working in an agricultural field"
              className="hero-farmer-image"
            />

            <div className="photo-overlay"></div>

            <div className="photo-location">
              <span>📍</span>
              <div>
                <strong>Indian Farms</strong>
                <small>Fresh produce • Local farmers</small>
              </div>
            </div>
          </div>

          <div className="hero-floating-card card-top">
            <div className="floating-icon">🥬</div>
            <div>
              <strong>Fresh Produce</strong>
              <small>Direct from the farm</small>
            </div>
          </div>

          <div className="hero-floating-card card-bottom">
            <div className="floating-check">✓</div>
            <div>
              <strong>Food Transparency</strong>
              <small>Know how it was grown</small>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          WHY FARMCONNECT
      ===================================================== */}
      <section className="section modern-section">
        <div className="section-heading modern-heading">
          <span className="section-label">WHY FARMCONNECT</span>

          <h2>
            Connecting the people who
            <span> grow food</span> with the people who buy it.
          </h2>

          <p>
            A farm-to-buyer marketplace designed to make
            agricultural trade simpler and more transparent.
          </p>
        </div>

        <div className="feature-grid modern-feature-grid">
          <div className="feature-card modern-feature-card">
            <div className="feature-icon">🚜</div>

            <span className="feature-number">01</span>

            <h3>Direct From Farmers</h3>

            <p>
              Farmers can list their produce directly and reach
              consumers and retailers without unnecessary layers.
            </p>

            <div className="feature-link">
              Farmer → Buyer
            </div>
          </div>

          <div className="feature-card modern-feature-card">
            <div className="feature-icon">₹</div>

            <span className="feature-number">02</span>

            <h3>Price Transparency</h3>

            <p>
              Buyers can see the farmer's listed price before
              placing an order.
            </p>

            <div className="feature-link">
              Clear pricing
            </div>
          </div>

          <div className="feature-card modern-feature-card">
            <div className="feature-icon">🔍</div>

            <span className="feature-number">03</span>

            <h3>Food Transparency</h3>

            <p>
              View farming method, pesticide information and
              harvest date declared by the farmer.
            </p>

            <div className="feature-link">
              Know your food
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          HOW IT WORKS
      ===================================================== */}
      <section className="how-section modern-how-section">
        <div className="section-heading modern-heading">
          <span className="section-label">HOW IT WORKS</span>

          <h2>
            From the <span>farm</span> to your doorstep.
          </h2>

          <p>
            Four simple steps connect farmers with buyers.
          </p>
        </div>

        <div className="steps-grid modern-steps-grid">
          <div className="step-card modern-step-card">
            <div className="step-number">01</div>
            <div className="step-icon">🌾</div>

            <h3>Farmer Lists Produce</h3>

            <p>
              Farmers add produce, quantity, price and food
              information.
            </p>
          </div>

          <div className="step-card modern-step-card">
            <div className="step-number">02</div>
            <div className="step-icon">🛒</div>

            <h3>Buyer Places Order</h3>

            <p>
              Consumers or retailers browse produce and place
              an order.
            </p>
          </div>

          <div className="step-card modern-step-card">
            <div className="step-number">03</div>
            <div className="step-icon">🤝</div>

            <h3>Farmer Accepts</h3>

            <p>
              The farmer receives the order and prepares the
              requested produce.
            </p>
          </div>

          <div className="step-card modern-step-card">
            <div className="step-number">04</div>
            <div className="step-icon">🚚</div>

            <h3>Delivery</h3>

            <p>
              The order moves towards the buyer until it is
              completed.
            </p>
          </div>
        </div>
      </section>

      {/* =====================================================
          FOOD TRANSPARENCY
      ===================================================== */}
      <section className="transparency-section modern-transparency">
        <div className="transparency-content">
          <div className="transparency-text">
            <span className="section-label">
              FOOD TRANSPARENCY
            </span>

            <h2>
              Know more about
              <span> what you eat.</span>
            </h2>

            <p>
              FarmConnect gives buyers information declared by
              the farmer about how produce was grown and
              harvested.
            </p>

            <button
              className="primary-btn"
              type="button"
              onClick={() => setPage("marketplace")}
            >
              Explore Produce →
            </button>
          </div>

          <div className="transparency-grid">
            <div className="transparency-card">
              <span>🌱</span>
              <h3>Farming Method</h3>
              <p>
                See the farming method declared by the farmer.
              </p>
            </div>

            <div className="transparency-card">
              <span>🧪</span>
              <h3>Pesticide Information</h3>
              <p>
                Farmers can disclose pesticide usage information.
              </p>
            </div>

            <div className="transparency-card">
              <span>📅</span>
              <h3>Harvest Date</h3>
              <p>
                See when the produce was harvested.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          CTA
      ===================================================== */}
      {!user && (
        <section className="cta-section modern-cta">
          <div className="cta-inner">
            <span className="section-label">
              GET STARTED
            </span>

            <h2>
              Your food has a story.
              <span> Know it.</span>
            </h2>

            <p>
              Join FarmConnect and discover a simpler way to
              buy and sell agricultural produce.
            </p>

            <button
              className="primary-btn"
              type="button"
              onClick={() => setPage("auth")}
            >
              Create Your Account →
            </button>
          </div>
        </section>
      )}

      {/* =====================================================
          FOOTER
      ===================================================== */}
      <footer className="footer modern-footer">
        <div className="footer-brand">
          <h3>🌱 FarmConnect</h3>
          <p>Connecting farms with people.</p>
        </div>

        <div className="footer-info">
          <span>Direct Marketplace</span>
          <span>Price Transparency</span>
          <span>Food Transparency</span>
        </div>

        <div className="footer-bottom">
          © 2026 FarmConnect. Connecting Farms With People.
        </div>
      </footer>
    </>
  );
}

/* =========================================================
   AUTH PAGE
   IMPORTANT: OUTSIDE App() SO INPUT FOCUS IS NEVER LOST
   ========================================================= */

function AuthPage({
  authMode,
  setAuthMode,
  authForm,
  setAuthForm,
  handleLogin,
  handleSignup,
  loading,
  message,
}) {
  function updateField(field, value) {
    setAuthForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  const submitHandler =
    authMode === "login" ? handleLogin : handleSignup;

  return (
    <div className="page-container">
      <div className="auth-container">
        <div className="auth-header">
          <div className="auth-logo">🌱</div>

          <h1>
            {authMode === "login"
              ? "Welcome Back"
              : "Join FarmConnect"}
          </h1>

          <p>
            {authMode === "login"
              ? "Login to your FarmConnect account."
              : "Create your FarmConnect account."}
          </p>
        </div>

        {message && <div className="message">{message}</div>}

        <form className="auth-form" onSubmit={submitHandler}>
          {authMode === "signup" && (
            <>
              <label htmlFor="auth-name">Name</label>
              <input
                id="auth-name"
                type="text"
                value={authForm.name}
                onChange={(event) =>
                  updateField("name", event.target.value)
                }
                placeholder="Enter your name"
                autoComplete="name"
                required
              />

              <label htmlFor="auth-location">Location</label>
              <input
                id="auth-location"
                type="text"
                value={authForm.location}
                onChange={(event) =>
                  updateField("location", event.target.value)
                }
                placeholder="e.g. Pune"
                autoComplete="address-level2"
                required
              />

              <label htmlFor="auth-role">Role</label>
              <select
                id="auth-role"
                value={authForm.role}
                onChange={(event) =>
                  updateField("role", event.target.value)
                }
              >
                <option value="Consumer">Consumer</option>
                <option value="Farmer">Farmer</option>
                <option value="Retailer">Retailer</option>
              </select>
            </>
          )}

          <label htmlFor="auth-email">Email</label>
          <input
            id="auth-email"
            type="email"
            value={authForm.email}
            onChange={(event) =>
              updateField("email", event.target.value)
            }
            placeholder="Enter email"
            autoComplete="email"
            required
          />

          <label htmlFor="auth-password">Password</label>
          <input
            id="auth-password"
            type="password"
            value={authForm.password}
            onChange={(event) =>
              updateField("password", event.target.value)
            }
            placeholder="Enter password"
            autoComplete={
              authMode === "login"
                ? "current-password"
                : "new-password"
            }
            required
          />

          <button
            className="primary-btn auth-submit"
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Please wait..."
              : authMode === "login"
              ? "Login"
              : "Create Account"}
          </button>
        </form>

        <div className="auth-switch">
          {authMode === "login" ? (
            <>
              Don&apos;t have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setAuthMode("signup");
                }}
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setAuthMode("login");
                }}
              >
                Login
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   FARMER PAGE
   ========================================================= */

function FarmerPage({
  user,
  message,
  produceForm,
  setProduceForm,
  handleAddProduce,
  loading,
  myProduce,
  orders,
  updateOrderStatus,
  bulkRequirements,
  bulkLoading,
  selectedBulkRequirement,
  setSelectedBulkRequirement,
  bulkOfferForm,
  setBulkOfferForm,
  bulkOfferLoading,
}) {
  if (!user || user.role !== "Farmer") {
    return (
      <div className="page-container">
        <div className="empty-state">
          <h2>Access Denied</h2>
          <p>Only farmers can access this page.</p>
        </div>
      </div>
    );
  }

  function updateProduceField(field, value) {
    setProduceForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }
  function calculateDistance(lat1, lon1, lat2, lon2) {
  const toRadians = (degrees) => {
    return degrees * (Math.PI / 180);
  };

  const R = 6371; // Earth radius in km

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c =
    2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}
const filteredBulkRequirements = bulkRequirements.filter(
  (requirement) => {
    // If user selected "Any distance", show everything
    if (bulkDistance === "any") {
      return true;
    }

    // If farmer location is not available,
    // don't filter anything yet
    if (
      farmerLocation.latitude === null ||
      farmerLocation.longitude === null
    ) {
      return true;
    }

    // If retailer did not provide coordinates,
    // we cannot calculate distance
    if (
      requirement.deliveryLatitude === null ||
      requirement.deliveryLatitude === undefined ||
      requirement.deliveryLongitude === null ||
      requirement.deliveryLongitude === undefined
    ) {
      return false;
    }

    const distance = calculateDistance(
      farmerLocation.latitude,
      farmerLocation.longitude,
      requirement.deliveryLatitude,
      requirement.deliveryLongitude
    );

    return distance <= Number(bulkDistance);
  }
);

  return (
    <div className="page-container">
      <div className="page-header">
        <span className="section-label">FARMER PORTAL</span>
        <h1>Farmer Dashboard 🚜</h1>
        <p>
          Welcome, {user.name}. Manage your produce and incoming
          orders.
        </p>
      </div>

      {message && <div className="message">{message}</div>}

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h2>Add Produce</h2>

          <form className="produce-form" onSubmit={handleAddProduce}>
            <label htmlFor="produce-name">Produce Name</label>
            <input
              id="produce-name"
              value={produceForm.name}
              onChange={(event) =>
                updateProduceField("name", event.target.value)
              }
              placeholder="e.g. Tomato"
              required
            />
            {/* CROP PHOTO */}
<label htmlFor="crop-photo">Crop Photo</label>

<input
  id="crop-photo"
  type="file"
  accept="image/*"
  onChange={(event) =>
    updateProduceField("image", event.target.files[0])
  }
/>

{produceForm.image && (
  <div className="image-preview">
    <img
      src={URL.createObjectURL(produceForm.image)}
      alt="Crop preview"
    />
  </div>
)}

            <label htmlFor="produce-quantity">Quantity (kg)</label>
            <input
              id="produce-quantity"
              type="number"
              min="1"
              value={produceForm.quantity}
              onChange={(event) =>
                updateProduceField("quantity", event.target.value)
              }
              required
            />

            <label htmlFor="produce-price">Price per kg (₹)</label>
            <input
              id="produce-price"
              type="number"
              min="1"
              value={produceForm.price}
              onChange={(event) =>
                updateProduceField("price", event.target.value)
              }
              required
            />

            <label htmlFor="produce-location">Location</label>
            <input
              id="produce-location"
              value={produceForm.location}
              onChange={(event) =>
                updateProduceField("location", event.target.value)
              }
              placeholder="e.g. Pune"
              required
            />

            <div className="coordinates-row">
              <div>
                <label htmlFor="produce-latitude">Latitude</label>
                <input
                  id="produce-latitude"
                  type="number"
                  step="any"
                  value={produceForm.latitude}
                  onChange={(event) =>
                    updateProduceField("latitude", event.target.value)
                  }
                  placeholder="e.g. 18.5204"
                />
              </div>

              <div>
                <label htmlFor="produce-longitude">Longitude</label>
                <input
                  id="produce-longitude"
                  type="number"
                  step="any"
                  value={produceForm.longitude}
                  onChange={(event) =>
                    updateProduceField("longitude", event.target.value)
                  }
                  placeholder="e.g. 73.8567"
                />
              </div>
            </div>

            <button
              className="secondary-btn location-btn"
              type="button"
              onClick={() => {
                if (!navigator.geolocation) {
                  alert("Geolocation is not supported by this browser.");
                  return;
                }

                navigator.geolocation.getCurrentPosition(
                  (position) => {
                    updateProduceField("latitude", position.coords.latitude.toFixed(6));
                    updateProduceField("longitude", position.coords.longitude.toFixed(6));
                  },
                  () => {
                    alert("Please allow location access in your browser.");
                  },
                  { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
                );
              }}
            >
              📍 Use My Farm Location
            </button>

            <label htmlFor="produce-date">Harvest Date</label>
            <input
              id="produce-date"
              type="date"
              value={produceForm.harvestDate}
              onChange={(event) =>
                updateProduceField("harvestDate", event.target.value)
              }
              required
            />

            <label htmlFor="produce-method">Farming Method</label>
            <input
              id="produce-method"
              value={produceForm.farmingMethod}
              onChange={(event) =>
                updateProduceField(
                  "farmingMethod",
                  event.target.value
                )
              }
              placeholder="e.g. Conventional"
            />

            <label htmlFor="produce-pesticide">
              Pesticide Information
            </label>
            <input
              id="produce-pesticide"
              value={produceForm.pesticide}
              onChange={(event) =>
                updateProduceField(
                  "pesticide",
                  event.target.value
                )
              }
              placeholder="Enter declared information"
            />

            <button
              className="primary-btn"
              type="submit"
              disabled={loading}
            >
              {loading ? "Adding..." : "Add Produce"}
            </button>
          </form>
        </div>

        <div className="dashboard-card">
          <h2>My Listed Produce</h2>

          {myProduce.length === 0 ? (
            <div className="empty-small">
              <span>🌾</span>
              <p>No produce listed yet.</p>
            </div>
          ) : (
            <div className="mini-list">
              {myProduce.map((item) => (
                <div className="mini-item" key={item._id}>
                  <strong>{item.name}</strong>
                  <span>{item.quantity} kg</span>
                  <span>₹{item.price}/kg</span>
                  <span>📍 {item.location}</span>
                </div>
              ))}
            </div>
          )}
        </div>
            </div>

      {/* =====================================================
          BULK REQUIREMENTS FROM RETAILERS
          ===================================================== */}

      <section className="orders-section">
        <div className="section-heading">
         <span className="section-label">BULK MARKETPLACE</span>

<h2>Bulk Requirements from Retailers</h2>

<p>
  Find bulk produce requirements from retailers
  near your location.
</p>

<div className="bulk-filter-bar">
  <button
    className="secondary-btn location-btn"
    type="button"
    onClick={() => {
      if (!navigator.geolocation) {
        alert(
          "Geolocation is not supported by this browser."
        );
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFarmerLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });

          alert(
            "Your location has been captured successfully."
          );
        },
        () => {
          alert(
            "Please allow location access in your browser."
          );
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000,
        }
      );
    }}
  >
    📍 Use My Location
  </button>
</div>
        </div>

        {bulkLoading ? (
          <div className="empty-state">
            <h3>Loading bulk requirements...</h3>
          </div>
        ) : bulkRequirements.length === 0 ? (
          <div className="empty-state">
            <h3>No bulk requirements available</h3>
            <p>
              New retailer requirements will appear here.
            </p>
          </div>
        ) : (
          <div className="orders-grid">
           {filteredBulkRequirements.map((requirement) => (
              <div
                className="order-card"
                key={requirement._id}
              >
                <div className="order-card-header">
                  <h3>{requirement.produceName}</h3>

                  <span className="available-pill">
                    {requirement.status}
                  </span>
                </div>

                <p>
                  <strong>Required Quantity:</strong>{" "}
                  {requirement.quantity} kg
                </p>

                <p>
                  <strong>Expected Price:</strong>{" "}
                  ₹{requirement.expectedPrice}/kg
                </p>

                <p>
                  <strong>Delivery Location:</strong>{" "}
                  {requirement.deliveryLocation}
                </p>
                {farmerLocation.latitude !== null &&
  farmerLocation.longitude !== null &&
  requirement.deliveryLatitude !== null &&
  requirement.deliveryLatitude !== undefined &&
  requirement.deliveryLongitude !== null &&
  requirement.deliveryLongitude !== undefined && (
    <p>
      <strong>Distance:</strong>{" "}
      {calculateDistance(
        farmerLocation.latitude,
        farmerLocation.longitude,
        requirement.deliveryLatitude,
        requirement.deliveryLongitude
      ).toFixed(1)}{" "}
      km away
    </p>
  )}

                <p>
                  <strong>Required By:</strong>{" "}
                  {new Date(
                    requirement.requiredBy
                  ).toLocaleDateString("en-IN")}
                </p>

                {requirement.requirements && (
                  <p>
                    <strong>Requirements:</strong>{" "}
                    {requirement.requirements}
                  </p>
                )}

                {requirement.retailerId && (
                  <p>
                    <strong>Retailer:</strong>{" "}
                    {requirement.retailerId.name}
                  </p>
                )}

                <button
  className="primary-btn"
  type="button"
  onClick={() => {
    setSelectedBulkRequirement(requirement);

    setBulkOfferForm({
      offeredQuantity: "",
      offeredPrice: "",
      message: "",
    });
  }}
>
  Make an Offer
</button>
              </div>
            ))}
                   </div>
        )}

        {/* =====================================================
            BULK OFFER FORM
            ===================================================== */}

        {selectedBulkRequirement && (
          <div className="dashboard-card">
            <h2>
              Make an Offer for{" "}
              {selectedBulkRequirement.produceName}
            </h2>

            <p>
              Retailer needs{" "}
              <strong>
                {selectedBulkRequirement.quantity} kg
              </strong>
              {" "}and expects around{" "}
              <strong>
                ₹{selectedBulkRequirement.expectedPrice}/kg
              </strong>
              .
            </p>

            <form
              className="produce-form"
              onSubmit={async (event) => {
                event.preventDefault();

                if (!selectedBulkRequirement) {
                  return;
                }

                try {
                  setBulkOfferForm((previous) => ({
                    ...previous,
                  }));

                  const response = await fetch(
                    `${API_URL}/api/bulk-requirements/${selectedBulkRequirement._id}/offers`,
                    {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                      },
                      body: JSON.stringify({
                        offeredQuantity: Number(
                          bulkOfferForm.offeredQuantity
                        ),
                        offeredPrice: Number(
                          bulkOfferForm.offeredPrice
                        ),
                        message: bulkOfferForm.message,
                      }),
                    }
                  );

                  const data = await response.json();

                  if (!response.ok) {
                    throw new Error(
                      data.message ||
                        "Failed to submit offer."
                    );
                  }

                  alert(
                    "Offer submitted successfully!"
                  );

                  setSelectedBulkRequirement(null);

                  setBulkOfferForm({
                    offeredQuantity: "",
                    offeredPrice: "",
                    message: "",
                  });
                } catch (error) {
                  console.error(
                    "Submit bulk offer error:",
                    error
                  );

                  alert(
                    error.message ||
                      "Failed to submit offer."
                  );
                }
              }}
            >
              <label htmlFor="bulk-offer-quantity">
                Your Available Quantity (kg)
              </label>

              <input
                id="bulk-offer-quantity"
                type="number"
                min="1"
                max={selectedBulkRequirement.quantity}
                value={bulkOfferForm.offeredQuantity}
                onChange={(event) =>
                  setBulkOfferForm((previous) => ({
                    ...previous,
                    offeredQuantity:
                      event.target.value,
                  }))
                }
                placeholder="e.g. 30"
                required
              />

              <label htmlFor="bulk-offer-price">
                Your Price per kg (₹)
              </label>

              <input
                id="bulk-offer-price"
                type="number"
                min="0"
                step="0.01"
                value={bulkOfferForm.offeredPrice}
                onChange={(event) =>
                  setBulkOfferForm((previous) => ({
                    ...previous,
                    offeredPrice:
                      event.target.value,
                  }))
                }
                placeholder="e.g. 28"
                required
              />

              <label htmlFor="bulk-offer-message">
                Message to Retailer
              </label>

              <textarea
                id="bulk-offer-message"
                value={bulkOfferForm.message}
                onChange={(event) =>
                  setBulkOfferForm((previous) => ({
                    ...previous,
                    message: event.target.value,
                  }))
                }
                placeholder="e.g. I can supply fresh tomatoes."
                rows="4"
              />

              <div className="order-actions">
                <button
                  className="primary-btn"
                  type="submit"
                  disabled={bulkOfferLoading}
                >
                  {bulkOfferLoading
                    ? "Submitting..."
                    : "Submit Offer"}
                </button>

                <button
                  className="secondary-btn"
                  type="button"
                  onClick={() => {
                    setSelectedBulkRequirement(null);

                    setBulkOfferForm({
                      offeredQuantity: "",
                      offeredPrice: "",
                      message: "",
                    });
                  }}
                  disabled={bulkOfferLoading}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </section>

      <section className="orders-section">
        <div className="section-heading">
          <span className="section-label">ORDERS</span>
          <h2>Incoming Orders</h2>
          <p>Accept, reject and update delivery status.</p>
        </div>
        {orders.length === 0 ? (
          <div className="empty-state">
            <h3>No orders yet</h3>
            <p>Orders placed by buyers will appear here.</p>
          </div>
        ) : (
          <div className="orders-grid">
            {orders.map((order) => (
              <div className="order-card" key={order._id}>
                <div className="order-card-header">
                  <h3>{order.produceName}</h3>
                  <StatusBadge status={order.status} />
                </div>

                <p>
                  <strong>Buyer:</strong> {order.buyerName}
                </p>
                <p>
                  <strong>Type:</strong> {order.buyerType}
                </p>
                <p>
                  <strong>Quantity:</strong> {order.quantity} kg
                </p>
                <p>
                  <strong>Total:</strong> ₹{order.totalPrice}
                </p>
                <div className="transparency-box">
                  <strong>💳 Payment</strong>
                  <p>
                    Method: {order.paymentMethod === "ONLINE" ? "Online Payment" : "Cash on Delivery"}
                  </p>
                  <p>
                    Status: {order.paymentStatus === "Paid" ? "Paid ✅" : "Payment Pending"}
                  </p>
                </div>
                <p>
                  <strong>Location:</strong> {order.buyerLocation}
                </p>

                <div className="order-actions">
                  {order.status === "Pending" && (
                    <>
                      <button
                        className="primary-btn"
                        type="button"
                        onClick={() =>
                          updateOrderStatus(order._id, "Accepted")
                        }
                      >
                        Accept
                      </button>

                      <button
                        className="danger-btn"
                        type="button"
                        onClick={() =>
                          updateOrderStatus(order._id, "Rejected")
                        }
                      >
                        Reject
                      </button>
                    </>
                  )}

                  {order.status === "Accepted" && (
                    <button
                      className="primary-btn"
                      type="button"
                      onClick={() =>
                        updateOrderStatus(order._id, "Preparing")
                      }
                    >
                      Mark Preparing
                    </button>
                  )}

                  {order.status === "Preparing" && (
                    <button
                      className="primary-btn"
                      type="button"
                      onClick={() =>
                        updateOrderStatus(
                          order._id,
                          "Out for Delivery"
                        )
                      }
                    >
                      Out for Delivery
                    </button>
                  )}

                  {order.status === "Out for Delivery" && (
                    <button
                      className="primary-btn"
                      type="button"
                      onClick={() =>
                        updateOrderStatus(order._id, "Delivered")
                      }
                    >
                      Mark Delivered
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

/* =========================================================
   MARKETPLACE
   ========================================================= */

function MarketplacePage({
  produce,
  user,
  message,
  openOrderPage,
  openFarmerProfile,
  setPage,
}) {
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [sort, setSort] = useState("");
  const [quantityFilter, setQuantityFilter] = useState("");
  const [userLocation, setUserLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationMessage, setLocationMessage] = useState("");

  const availableProduce = produce.filter(
    (item) => Number(item.quantity) > 0
  );

  const locations = [
    ...new Set(
      availableProduce
        .map((item) => item.location)
        .filter(Boolean)
    ),
  ];

  let filteredProduce = availableProduce.filter((item) => {
    const searchText = search.trim().toLowerCase();

    const matchesSearch =
      !searchText ||
      item.name?.toLowerCase().includes(searchText) ||
      item.location?.toLowerCase().includes(searchText) ||
      item.farmerId?.name?.toLowerCase().includes(searchText);

    const matchesLocation =
      !location ||
      item.location?.toLowerCase() === location.toLowerCase();

    let matchesQuantity = true;

    if (quantityFilter === "small") {
      matchesQuantity = Number(item.quantity) <= 20;
    }

    if (quantityFilter === "medium") {
      matchesQuantity =
        Number(item.quantity) > 20 &&
        Number(item.quantity) <= 100;
    }

    if (quantityFilter === "bulk") {
      matchesQuantity = Number(item.quantity) > 100;
    }

    return matchesSearch && matchesLocation && matchesQuantity;
  });

  if (sort === "price-low") {
    filteredProduce.sort(
      (a, b) => Number(a.price) - Number(b.price)
    );
  }

  if (sort === "price-high") {
    filteredProduce.sort(
      (a, b) => Number(b.price) - Number(a.price)
    );
  }

  if (sort === "quantity-high") {
    filteredProduce.sort(
      (a, b) => Number(b.quantity) - Number(a.quantity)
    );
  }

  if (sort === "quantity-low") {
    filteredProduce.sort(
      (a, b) => Number(a.quantity) - Number(b.quantity)
    );
  }

  if (sort === "nearest" && userLocation) {
    filteredProduce = filteredProduce
      .map((item) => {
        const latitude = Number(item.latitude);
        const longitude = Number(item.longitude);

        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
          return { ...item, distanceKm: null };
        }

        return {
          ...item,
          distanceKm: calculateDistanceKm(
            userLocation.latitude,
            userLocation.longitude,
            latitude,
            longitude
          ),
        };
      })
      .sort((a, b) => {
        if (a.distanceKm === null) return 1;
        if (b.distanceKm === null) return -1;
        return a.distanceKm - b.distanceKm;
      });
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      setLocationMessage("Geolocation is not supported by this browser.");
      return;
    }

    setLocationLoading(true);
    setLocationMessage("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        setUserLocation(coords);
        setSort("nearest");
        setLocationMessage("Your location is being used to show nearby produce.");
        setLocationLoading(false);
      },
      (error) => {
        console.error("Location error:", error);
        setLocationLoading(false);
        setLocationMessage(
          "Location access was not allowed. You can still use the location filter."
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  }

  const clearFilters = () => {
    setSearch("");
    setLocation("");
    setSort("");
    setQuantityFilter("");
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <span className="section-label">MARKETPLACE</span>
        <h1>Fresh Produce 🛒</h1>
        <p>
          Buy fresh produce directly from farmers. Search,
          compare and choose what you need.
        </p>
      </div>

      {message && <div className="message">{message}</div>}

      <div className="nearby-location-box">
        <div>
          <strong>📍 Find produce near you</strong>
          <p>Use your device location to sort produce by distance.</p>
        </div>
        <button
          className="secondary-btn location-btn"
          type="button"
          onClick={useMyLocation}
          disabled={locationLoading}
        >
          {locationLoading ? "Getting Location..." : "📍 Use My Location"}
        </button>
      </div>

      {locationMessage && (
        <div className="location-message">{locationMessage}</div>
      )}

      <div className="marketplace-filters">
        <div className="filter-search">
          <label htmlFor="market-search">🔍 Search Produce</label>
          <input
            id="market-search"
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search tomato, onion, Pune..."
          />
        </div>

        <div className="filter-item">
          <label htmlFor="market-location">📍 Location</label>
          <select
            id="market-location"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
          >
            <option value="">All locations</option>
            {locations.map((place) => (
              <option key={place} value={place}>
                {place}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-item">
          <label htmlFor="quantity-filter">📦 Quantity</label>
          <select
            id="quantity-filter"
            value={quantityFilter}
            onChange={(event) => setQuantityFilter(event.target.value)}
          >
            <option value="">All quantities</option>
            <option value="small">Small — up to 20 kg</option>
            <option value="medium">Medium — 21 to 100 kg</option>
            <option value="bulk">Bulk — above 100 kg</option>
          </select>
        </div>

        <div className="filter-item">
          <label htmlFor="market-sort">↕ Sort By</label>
          <select
            id="market-sort"
            value={sort}
            onChange={(event) => setSort(event.target.value)}
          >
            <option value="">Default</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="quantity-high">Quantity: High to Low</option>
            <option value="quantity-low">Quantity: Low to High</option>
            <option value="nearest" disabled={!userLocation}>Nearest to Me</option>
          </select>
        </div>

        <button
          className="secondary-btn clear-filter-btn"
          type="button"
          onClick={clearFilters}
        >
          Clear Filters
        </button>
      </div>

      <div className="marketplace-result-bar">
        <div>
          <strong>{filteredProduce.length}</strong> produce item
          {filteredProduce.length !== 1 ? "s" : ""} found
        </div>

        {(search || location || sort || quantityFilter) && (
          <span>Filters applied</span>
        )}
      </div>

      {availableProduce.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🌾</div>
          <h2>No produce available</h2>
          <p>Farmers haven&apos;t listed any produce yet.</p>
        </div>
      ) : filteredProduce.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <h2>No matching produce</h2>
          <p>Try changing your search or filters.</p>
          <button
            className="primary-btn"
            type="button"
            onClick={clearFilters}
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="marketplace-grid">
          {filteredProduce.map((item) => (
           <div className="produce-card" key={item._id}>
  {item.imageUrl && (
    <img
      src={item.imageUrl}
      alt={item.name}
      className="produce-marketplace-image"
    />
  )}

  <div className="produce-card-top">
    <span className="available-pill">
      {item.quantity} kg available
    </span>
  </div>
              <h2>{item.name}</h2>

              <p className="produce-price">
                ₹{item.price}
                <small>/kg</small>
              </p>

              <div className="produce-meta">
                <p>
                  <strong>📍 Location:</strong> {item.location}
                </p>
                {item.distanceKm !== undefined && (
                  <p>
                    <strong>📏 Distance:</strong>{" "}
                    {item.distanceKm === null
                      ? "Location coordinates not available"
                      : `${item.distanceKm.toFixed(1)} km away`}
                  </p>
                )}
                <p>
                  <strong>📅 Harvested:</strong>{" "}
                  {item.harvestDate
                    ? new Date(item.harvestDate).toLocaleDateString("en-IN")
                    : "Not provided"}
                </p>
              </div>

              {item.farmerId && (
                <>
                  <div className="transparency-box">
                    <strong>👨‍🌾 Farmer</strong>
                    <p>Name: {item.farmerId.name}</p>
                    <p>Location: {item.farmerId.location}</p>
                  </div>

                  <button
                    className="secondary-btn full-btn"
                    type="button"
                    onClick={() => openFarmerProfile(item.farmerId)}
                  >
                    👨‍🌾 View Farmer
                  </button>
                </>
              )}

              <div className="transparency-box">
                <strong>🔍 Food Information</strong>
                <p>
                  Farming: {item.farmingMethod || "Not provided"}
                </p>
                <p>
                  Pesticide: {item.pesticide || "Not provided"}
                </p>
              </div>

              {user &&
                (user.role === "Consumer" || user.role === "Retailer") && (
                  <button
                    className="primary-btn full-btn"
                    type="button"
                    onClick={() => openOrderPage(item)}
                  >
                    Buy Now →
                  </button>
                )}

              {!user && (
                <button
                  className="primary-btn full-btn"
                  type="button"
                  onClick={() => setPage("auth")}
                >
                  Login to Buy
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   FARMER PROFILE
   ========================================================= */

function FarmerProfile({
  farmer,
  produce,
  openOrderPage,
  setPage,
}) {
  if (!farmer) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <h2>Farmer not found</h2>
          <button
            className="primary-btn"
            type="button"
            onClick={() => setPage("marketplace")}
          >
            Back to Marketplace
          </button>
        </div>
      </div>
    );
  }

  const farmerProduce = produce.filter(
    (item) =>
      item.farmerId?._id === farmer._id ||
      String(item.farmerId?._id) === String(farmer._id)
  );

  return (
    <div className="page-container">
      <div className="page-header">
        <span className="section-label">FARMER PROFILE</span>
        <h1>👨‍🌾 {farmer.name}</h1>
        <p>Connect directly with a farmer on FarmConnect.</p>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <div className="farmer-profile-avatar">👨‍🌾</div>
          <h2>{farmer.name}</h2>
          <p>
            <strong>📍 Location:</strong> {farmer.location || "Not provided"}
          </p>
          <p>
            <strong>✉️ Email:</strong> {farmer.email || "Not provided"}
          </p>

          <button
            className="secondary-btn"
            type="button"
            onClick={() => setPage("marketplace")}
          >
            ← Back to Marketplace
          </button>
        </div>

        <div className="dashboard-card">
          <h2>Produce Listed</h2>

          {farmerProduce.length === 0 ? (
            <div className="empty-small">
              <span>🌾</span>
              <p>No currently available produce.</p>
            </div>
          ) : (
            <div className="mini-list">
              {farmerProduce.map((item) => (
                <div className="mini-item" key={item._id}>
                  <strong>{item.name}</strong>
                  <span>₹{item.price}/kg</span>
                  <span>{item.quantity} kg</span>
                  {Number(item.quantity) > 0 && (
                    <button
                      className="primary-btn"
                      type="button"
                      onClick={() => openOrderPage(item)}
                    >
                      Buy
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   RETAILER
   ========================================================= */

function RetailerPage({
  user,
  message,
  produce,
  openOrderPage,
  openFarmerProfile,
  setPage,
  token,
}) {
  const [bulkForm, setBulkForm] = useState({
  produceName: "",
  quantity: "",
  expectedPrice: "",
  deliveryLocation: "",
  deliveryLatitude: "",
  deliveryLongitude: "",
  requiredBy: "",
  requirements: "",
});

  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [bulkMessage, setBulkMessage] = useState("");

  if (!user || user.role !== "Retailer") {
    return (
      <div className="page-container">
        <div className="empty-state">
          <h2>Access Denied</h2>
          <p>Only retailers can access this page.</p>
        </div>
      </div>
    );
  }

  function updateBulkField(field, value) {
    setBulkForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  async function handlePostBulkRequirement(event) {
    event.preventDefault();

    if (!token) {
      setBulkMessage("Please login again.");
      return;
    }

    try {
      setBulkSubmitting(true);
      setBulkMessage("");

      const response = await fetch(
        `${API_URL}/api/bulk-requirements`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
         body: JSON.stringify({
  produceName: bulkForm.produceName,
  quantity: Number(bulkForm.quantity),
  expectedPrice: Number(bulkForm.expectedPrice),
  deliveryLocation: bulkForm.deliveryLocation,

  deliveryLatitude:
    bulkForm.deliveryLatitude === ""
      ? null
      : Number(bulkForm.deliveryLatitude),

  deliveryLongitude:
    bulkForm.deliveryLongitude === ""
      ? null
      : Number(bulkForm.deliveryLongitude),

  requiredBy: bulkForm.requiredBy,
  requirements: bulkForm.requirements,
}),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to post bulk requirement."
        );
      }

      setBulkMessage(
        "Bulk requirement posted successfully! Farmers can now see it."
      );

      setBulkForm({
  produceName: "",
  quantity: "",
  expectedPrice: "",
  deliveryLocation: "",
  deliveryLatitude: "",
  deliveryLongitude: "",
  requiredBy: "",
  requirements: "",
});
    } catch (error) {
      console.error(
        "Post bulk requirement error:",
        error
      );

      setBulkMessage(
        error.message ||
          "Failed to post bulk requirement."
      );
    } finally {
      setBulkSubmitting(false);
    }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <span className="section-label">
          RETAILER PORTAL
        </span>

        <h1>Retailer Portal 🏪</h1>

        <p>
          Purchase agricultural produce in bulk directly
          from farmers.
        </p>
      </div>

      {message && (
        <div className="message">
          {message}
        </div>
      )}

      {/* =====================================================
    POST BULK REQUIREMENT
    ===================================================== */}

<section className="orders-section">
  <div className="section-heading">
    <span className="section-label">
      BULK MARKETPLACE
    </span>

    <h2>Post a Bulk Requirement</h2>

    <p>
      Tell farmers what quantity of produce you need.
      Farmers can then send you offers.
    </p>
  </div>

  {bulkMessage && (
    <div className="message">
      {bulkMessage}
    </div>
  )}

  <div className="dashboard-card">
    <form
      className="produce-form"
      onSubmit={handlePostBulkRequirement}
    >
      <label htmlFor="bulk-produce-name">
        Produce Name
      </label>

      <input
        id="bulk-produce-name"
        value={bulkForm.produceName}
        onChange={(event) =>
          updateBulkField(
            "produceName",
            event.target.value
          )
        }
        placeholder="e.g. Tomato"
        required
      />

      <label htmlFor="bulk-quantity">
        Quantity Required (kg)
      </label>

      <input
        id="bulk-quantity"
        type="number"
        min="1"
        value={bulkForm.quantity}
        onChange={(event) =>
          updateBulkField(
            "quantity",
            event.target.value
          )
        }
        placeholder="e.g. 70"
        required
      />

      <label htmlFor="bulk-price">
        Expected Price per kg (₹)
      </label>

      <input
        id="bulk-price"
        type="number"
        min="0"
        step="0.01"
        value={bulkForm.expectedPrice}
        onChange={(event) =>
          updateBulkField(
            "expectedPrice",
            event.target.value
          )
        }
        placeholder="e.g. 30"
        required
      />

      <label htmlFor="bulk-location">
        Delivery Location
      </label>

      <input
        id="bulk-location"
        value={bulkForm.deliveryLocation}
        onChange={(event) =>
          updateBulkField(
            "deliveryLocation",
            event.target.value
          )
        }
        placeholder="e.g. Pune"
        required
      />

      <button
        className="secondary-btn location-btn"
        type="button"
        onClick={() => {
          if (!navigator.geolocation) {
            alert(
              "Geolocation is not supported by this browser."
            );
            return;
          }

          navigator.geolocation.getCurrentPosition(
            (position) => {
              updateBulkField(
                "deliveryLatitude",
                position.coords.latitude.toFixed(6)
              );

              updateBulkField(
                "deliveryLongitude",
                position.coords.longitude.toFixed(6)
              );

              alert(
                "Delivery location coordinates captured successfully."
              );
            },
            () => {
              alert(
                "Please allow location access in your browser."
              );
            },
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 300000,
            }
          );
        }}
      >
        📍 Use My Delivery Location
      </button>

      <label htmlFor="bulk-required-by">
        Required By
      </label>

      <input
        id="bulk-required-by"
        type="date"
        value={bulkForm.requiredBy}
        onChange={(event) =>
          updateBulkField(
            "requiredBy",
            event.target.value
          )
        }
        required
      />

      <label htmlFor="bulk-requirements">
        Additional Requirements
      </label>

      <textarea
        id="bulk-requirements"
        value={bulkForm.requirements}
        onChange={(event) =>
          updateBulkField(
            "requirements",
            event.target.value
          )
        }
        placeholder="e.g. Fresh tomatoes, good quality, no damaged produce"
        rows="4"
      />

      <button
        className="primary-btn"
        type="submit"
        disabled={bulkSubmitting}
      >
        {bulkSubmitting
          ? "Posting..."
          : "Post Bulk Requirement"}
      </button>
    </form>
  </div>
</section>

      {/* =====================================================
          NORMAL MARKETPLACE
          ===================================================== */}

      <MarketplacePage
        produce={produce}
        user={user}
        message={message}
        openOrderPage={openOrderPage}
        openFarmerProfile={openFarmerProfile}
        setPage={setPage}
      />
    </div>
  );
}

/* =========================================================
   ORDER PAGE
   ========================================================= */

function OrderPage({
  user,
  selectedProduce,
  buyerType,
  orderQuantity,
  setOrderQuantity,
  buyerName,
  buyerLocation,
  setBuyerLocation,
  paymentMethod,
  setPaymentMethod,
  handlePlaceOrder,
  loading,
  message,
  setPage,
}) {
  if (!selectedProduce) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <h2>No product selected</h2>
          <p>Please choose a product from the marketplace.</p>

          <button
            className="primary-btn"
            type="button"
            onClick={() => setPage("marketplace")}
          >
            Back to Marketplace
          </button>
        </div>
      </div>
    );
  }

  const total =
    Number(orderQuantity || 0) *
    Number(selectedProduce.price || 0);

  return (
    <div className="page-container">
      <div className="page-header">
        <span className="section-label">CHECKOUT</span>
        <h1>Place Order 📦</h1>
        <p>Buy directly from the farmer.</p>
      </div>

      {message && <div className="message">{message}</div>}

      <div className="order-page-grid">
        <div className="selected-produce">
          <div className="produce-card-icon">🌾</div>

          <h2>{selectedProduce.name}</h2>

          <p className="produce-price">
            ₹{selectedProduce.price}
            <small>/kg</small>
          </p>

          <p>
            <strong>Available:</strong>{" "}
            {selectedProduce.quantity} kg
          </p>

          <p>
            <strong>Location:</strong>{" "}
            {selectedProduce.location}
          </p>

          {selectedProduce.farmerId && (
            <div className="transparency-box">
              <strong>👨‍🌾 Farmer</strong>
              <p>Name: {selectedProduce.farmerId.name}</p>
              <p>
                Location: {selectedProduce.farmerId.location}
              </p>
            </div>
          )}

          <div className="transparency-box">
            <strong>🔍 Food Information</strong>
            <p>
              Farming: {selectedProduce.farmingMethod || "Not provided"}
            </p>
            <p>
              Pesticide: {selectedProduce.pesticide || "Not provided"}
            </p>
          </div>
        </div>

        <form
          className="order-form"
          onSubmit={handlePlaceOrder}
        >
          <label htmlFor="buyer-type">Buyer Type</label>
          <input
            id="buyer-type"
            value={user?.role || buyerType}
            readOnly
          />

          <label htmlFor="order-quantity">
            Quantity (kg)
          </label>
          <input
            id="order-quantity"
            type="number"
            min="1"
            max={selectedProduce.quantity}
            value={orderQuantity}
            onChange={(event) =>
              setOrderQuantity(event.target.value)
            }
            required
          />

          <label htmlFor="buyer-name">Your Name</label>
          <input
            id="buyer-name"
            value={buyerName}
            readOnly
          />

          <label htmlFor="buyer-location">
            Delivery Location
          </label>
          <input
            id="buyer-location"
            value={buyerLocation}
            onChange={(event) =>
              setBuyerLocation(event.target.value)
            }
            required
          />

          <div className="payment-section">
            <h3>💳 Payment Method</h3>

            <label className="payment-option">
              <input
                type="radio"
                name="paymentMethod"
                value="COD"
                checked={paymentMethod === "COD"}
                onChange={(event) =>
                  setPaymentMethod(event.target.value)
                }
              />
              <span>
                <strong>💵 Cash on Delivery</strong>
                <small>Pay when your produce is delivered.</small>
              </span>
            </label>

            <label className="payment-option">
              <input
                type="radio"
                name="paymentMethod"
                value="ONLINE"
                checked={paymentMethod === "ONLINE"}
                onChange={(event) =>
                  setPaymentMethod(event.target.value)
                }
              />
              <span>
                <strong>💳 Online Payment</strong>
                <small>
                  Pay securely using Razorpay — UPI, cards and
                  supported online methods.
                </small>
              </span>
            </label>
          </div>

          <div className="order-total">
            <span>Total Price</span>
            <strong>₹{total}</strong>
          </div>

          <button
            className="primary-btn"
            type="submit"
            disabled={loading}
          >
            {loading
              ? paymentMethod === "ONLINE"
                ? "Opening Payment..."
                : "Placing Order..."
              : paymentMethod === "ONLINE"
                ? "Pay & Place Order"
                : "Place COD Order"}
          </button>

          <button
            className="secondary-btn"
            type="button"
            onClick={() => setPage("marketplace")}
            disabled={loading}
          >
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
}

/* =========================================================
   MY ORDERS
   ========================================================= */

function MyOrdersPage({
  user,
  buyerOrders,
  message,
  setPage,
}) {
  if (!user) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <h2>Please Login</h2>
          <p>You need to login to view your orders.</p>

          <button
            className="primary-btn"
            type="button"
            onClick={() => setPage("auth")}
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <span className="section-label">ORDERS</span>
        <h1>My Orders 📦</h1>
        <p>Orders connected to your FarmConnect account.</p>
      </div>

      {message && <div className="message">{message}</div>}

      {buyerOrders.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <h2>No orders yet</h2>
          <p>
            Your orders will appear here after you purchase
            produce.
          </p>

          <button
            className="primary-btn"
            type="button"
            onClick={() => setPage("marketplace")}
          >
            Explore Marketplace
          </button>
        </div>
      ) : (
        <div className="orders-grid">
          {buyerOrders.map((order) => (
            <div className="order-card" key={order._id}>
              <div className="order-card-header">
                <h3>{order.produceName}</h3>
                <StatusBadge status={order.status} />
              </div>

              <p>
                <strong>Quantity:</strong> {order.quantity} kg
              </p>

              <p>
                <strong>Price:</strong> ₹
                {order.pricePerKg}/kg
              </p>

              <p>
                <strong>Total:</strong> ₹{order.totalPrice}
              </p>

              <div className="transparency-box">
                <strong>💳 Payment</strong>
                <p>
                  Method: {order.paymentMethod === "ONLINE" ? "Online Payment" : "Cash on Delivery"}
                </p>
                <p>
                  Status: {order.paymentStatus === "Paid" ? "Paid ✅" : "Payment Pending"}
                </p>
              </div>

              {order.farmerId && (
                <div className="transparency-box">
                  <strong>👨‍🌾 Farmer</strong>
                  <p>Name: {order.farmerId.name}</p>
                  <p>Location: {order.farmerId.location}</p>
                </div>
              )}

              <p>
                <strong>Delivery:</strong>{" "}
                {order.buyerLocation}
              </p>

              <DeliveryTracking status={order.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   MAIN APP
   ========================================================= */

function App() {
  const [page, setPage] = useState("home");

  const [user, setUser] = useState(() => {
    try {
      const savedUser =
        localStorage.getItem("farmconnect_user");

      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() =>
    localStorage.getItem("farmconnect_token")
  );

  const [authMode, setAuthMode] = useState("login");

  const [produce, setProduce] = useState([]);
  const [myProduce, setMyProduce] = useState([]);
  const [orders, setOrders] = useState([]);
  const [buyerOrders, setBuyerOrders] = useState([]);

  const [selectedProduce, setSelectedProduce] =
    useState(null);

  const [selectedFarmer, setSelectedFarmer] =
    useState(null);

  const [buyerType, setBuyerType] =
    useState("Consumer");

  const [orderQuantity, setOrderQuantity] = useState(1);
  const [buyerName, setBuyerName] = useState("");
  const [buyerLocation, setBuyerLocation] =
    useState("");

  const [paymentMethod, setPaymentMethod] =
    useState("COD");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [bulkRequirements, setBulkRequirements] = useState([]);
const [bulkLoading, setBulkLoading] = useState(false);
const [selectedBulkRequirement, setSelectedBulkRequirement] =
  useState(null);

const [bulkOfferForm, setBulkOfferForm] = useState({
  offeredQuantity: "",
  offeredPrice: "",
  message: "",
});

const [bulkOfferLoading, setBulkOfferLoading] =
  useState(false);
  const [farmerLocation, setFarmerLocation] = useState({
  latitude: null,
  longitude: null,
});

const [bulkDistance, setBulkDistance] = useState("50");
const [bulkLocationFilter, setBulkLocationFilter] =
  useState("");

  const [authForm, setAuthForm] = useState({
    name: "",
    email: "",
    password: "",
    location: "",
    role: "Consumer",
  });

 const [produceForm, setProduceForm] =
  useState({
    name: "",
    quantity: "",
    price: "",
    location: "",
    harvestDate: "",
    farmingMethod: "",
    pesticide: "",
    image: null,
  });

  /* -------------------------------------------------------
     FETCH PRODUCE
     ------------------------------------------------------- */

  async function fetchProduce() {
    try {
      const response = await fetch(
        `${API_URL}/api/produce`
      );

      const data = await response.json();

      if (response.ok) {
        setProduce(data);
      }
    } catch (error) {
      console.error("Fetch produce error:", error);
    }
  }

  async function fetchMyProduce() {
    if (!token) return;

    try {
      const response = await fetch(
        `${API_URL}/api/produce/my`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setMyProduce(data);
      } else {
        console.error(data.message);
      }
    } catch (error) {
      console.error("Fetch my produce error:", error);
    }
  }

  async function fetchOrders() {
    if (!token || !user || user.role !== "Farmer") {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/orders`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setOrders(data);
      } else {
        console.error(data.message);
      }
    } catch (error) {
      console.error("Fetch farmer orders error:", error);
    }
  }

  async function fetchMyOrders() {
    if (
      !token ||
      !user ||
      (user.role !== "Consumer" &&
        user.role !== "Retailer")
    ) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/orders/my`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setBuyerOrders(data);
      } else {
        console.error(data.message);
      }
    } catch (error) {
      console.error("Fetch my orders error:", error);
    }
  }
  async function fetchBulkRequirements() {
    if (!token || !user || user.role !== "Farmer") {
      return;
    }

    try {
      setBulkLoading(true);

      const response = await fetch(
        `${API_URL}/api/bulk-requirements`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setBulkRequirements(data.requirements || []);
      } else {
        console.error(data.message);
      }
    } catch (error) {
      console.error(
        "Fetch bulk requirements error:",
        error
      );
    } finally {
      setBulkLoading(false);
    }
  }

  useEffect(() => {
    fetchProduce();
  }, []);

  useEffect(() => {
    if (!token || !user) return;

    if (
      user.role === "Consumer" ||
      user.role === "Retailer"
    ) {
      fetchMyOrders();
    }

    if (user.role === "Farmer") {
  fetchOrders();
  fetchMyProduce();
  fetchBulkRequirements();
}
  }, [token, user]);

  /* -------------------------------------------------------
     LOGIN
     ------------------------------------------------------- */

  async function handleLogin(event) {
    event.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        `${API_URL}/api/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: authForm.email,
            password: authForm.password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Login failed.");
        return;
      }

      localStorage.setItem(
        "farmconnect_token",
        data.token
      );

      localStorage.setItem(
        "farmconnect_user",
        JSON.stringify(data.user)
      );

      setToken(data.token);
      setUser(data.user);

      setMessage("Login successful! 🌱");

      if (data.user.role === "Farmer") {
        setPage("farmer");
      } else if (data.user.role === "Retailer") {
        setPage("retailer");
      } else {
        setPage("marketplace");
      }

      setAuthForm({
        name: "",
        email: "",
        password: "",
        location: "",
        role: "Consumer",
      });
    } catch (error) {
      console.error("Login error:", error);
      setMessage("Unable to connect to server.");
    } finally {
      setLoading(false);
    }
  }

  /* -------------------------------------------------------
     SIGNUP
     ------------------------------------------------------- */

  async function handleSignup(event) {
    event.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        `${API_URL}/api/auth/signup`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(authForm),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Signup failed.");
        return;
      }

      localStorage.setItem(
        "farmconnect_token",
        data.token
      );

      localStorage.setItem(
        "farmconnect_user",
        JSON.stringify(data.user)
      );

      setToken(data.token);
      setUser(data.user);

      setMessage("Account created successfully! 🌱");

      if (data.user.role === "Farmer") {
        setPage("farmer");
      } else if (data.user.role === "Retailer") {
        setPage("retailer");
      } else {
        setPage("marketplace");
      }

      setAuthForm({
        name: "",
        email: "",
        password: "",
        location: "",
        role: "Consumer",
      });
    } catch (error) {
      console.error("Signup error:", error);
      setMessage("Unable to connect to server.");
    } finally {
      setLoading(false);
    }
  }

  /* -------------------------------------------------------
     LOGOUT
     ------------------------------------------------------- */

  function handleLogout() {
    localStorage.removeItem("farmconnect_token");
    localStorage.removeItem("farmconnect_user");

    setToken(null);
    setUser(null);
    setBuyerOrders([]);
    setOrders([]);
    setMyProduce([]);
    setSelectedProduce(null);
    setPage("home");
    setMessage("Logged out successfully.");
  }

  /* -------------------------------------------------------
     ADD PRODUCE
     ------------------------------------------------------- */

  async function handleAddProduce(event) {
    event.preventDefault();

    if (!token) {
      setMessage("Please login first.");
      setPage("auth");
      return;
    }

    if (!user || user.role !== "Farmer") {
      setMessage("Only farmers can add produce.");
      return;
    }

    setLoading(true);
    setMessage("");

   try {
  const formData = new FormData();

  formData.append("name", produceForm.name);
  formData.append("quantity", Number(produceForm.quantity));
  formData.append("price", Number(produceForm.price));
  formData.append("location", produceForm.location);
  formData.append("harvestDate", produceForm.harvestDate);
  formData.append("farmingMethod", produceForm.farmingMethod);
  formData.append("pesticide", produceForm.pesticide);

  formData.append(
    "latitude",
    produceForm.latitude === ""
      ? ""
      : Number(produceForm.latitude)
  );

  formData.append(
    "longitude",
    produceForm.longitude === ""
      ? ""
      : Number(produceForm.longitude)
  );

  if (produceForm.image) {
    formData.append("image", produceForm.image);
  }

  const response = await fetch(
    `${API_URL}/api/produce`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    }
  );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.message || "Unable to add produce."
        );
        return;
      }

      setMessage("Produce added successfully! 🌾");

      setProduceForm({
        name: "",
        quantity: "",
        price: "",
        location: "",
        harvestDate: "",
        farmingMethod: "",
        pesticide: "",
        latitude: "",
        longitude: "",
      });

      await fetchProduce();
      await fetchMyProduce();
    } catch (error) {
      console.error("Add produce error:", error);
      setMessage("Unable to connect to server.");
    } finally {
      setLoading(false);
    }
  }

  /* -------------------------------------------------------
     OPEN FARMER PROFILE
     ------------------------------------------------------- */

  function openFarmerProfile(farmer) {
    if (!farmer) {
      setMessage("Farmer information is not available.");
      return;
    }

    setSelectedFarmer(farmer);
    setMessage("");
    setPage("farmerprofile");
  }

  /* -------------------------------------------------------
     OPEN ORDER PAGE
     ------------------------------------------------------- */

  function openOrderPage(item) {
  // No product
  if (!item) {
    setMessage("This produce is no longer available.");
    return;
  }

  // Product was sold out while the page was open
  const availableQuantity = Number(item.quantity);

  if (!Number.isFinite(availableQuantity) || availableQuantity <= 0) {
    setMessage(
      "Sorry, this produce has just been sold out. 🌾"
    );

    // Refresh marketplace data
    fetchProduce();

    return;
  }

  // User must be logged in
  if (!user) {
    setMessage("Please login to place an order.");
    setPage("auth");
    return;
  }

  // Only buyers can order
  if (
    user.role !== "Consumer" &&
    user.role !== "Retailer"
  ) {
    setMessage(
      "Only consumers and retailers can place orders."
    );
    return;
  }

  // Everything is valid
  setSelectedProduce(item);
  setBuyerType(user.role);
  setOrderQuantity(1);
  setBuyerName(user.name);
  setBuyerLocation(user.location || "");
  setMessage("");
  setPage("order");
}
  /* -------------------------------------------------------
     PLACE ORDER
     ------------------------------------------------------- */

  function loadRazorpayScript() {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }

  async function handlePlaceOrder(event) {
    event.preventDefault();

    if (!token || !user) {
      setMessage("Please login first.");
      setPage("auth");
      return;
    }

    if (!selectedProduce) {
      setMessage("No produce selected.");
      return;
    }

    const quantity = Number(orderQuantity);
    const currentAvailableQuantity =
  Number(selectedProduce.quantity);

if (
  !Number.isFinite(currentAvailableQuantity) ||
  currentAvailableQuantity <= 0
) {
  setMessage(
    "Sorry, this produce has just been sold out. 🌾"
  );

  setSelectedProduce(null);
  await fetchProduce();
  setPage("marketplace");

  return;
}

    if (!Number.isFinite(quantity) || quantity < 1) {
      setMessage("Order quantity must be at least 1 kg.");
      return;
    }

    if (quantity > Number(selectedProduce.quantity)) {
      setMessage("Requested quantity is not available.");
      return;
    }

    if (!buyerLocation.trim()) {
      setMessage("Please enter your delivery location.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      /* ---------------- COD ---------------- */
      if (paymentMethod === "COD") {
        const response = await fetch(
          `${API_URL}/api/orders`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              produceId: selectedProduce._id,
              quantity,
              buyerName: user.name,
              buyerLocation: buyerLocation.trim(),
              paymentMethod: "COD",
            }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          setMessage(data.message || "Unable to place order.");
          return;
        }

        setMessage("Order placed with Cash on Delivery! 🎉");
        setSelectedProduce(null);
        await fetchProduce();
        await fetchMyOrders();
        setPage("myorders");
        return;
      }

      /* ---------------- ONLINE PAYMENT ---------------- */
      const scriptLoaded = await loadRazorpayScript();

      if (!scriptLoaded) {
        setMessage("Unable to load the online payment system.");
        return;
      }

      const createResponse = await fetch(
        `${API_URL}/api/orders`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            produceId: selectedProduce._id,
            quantity,
            buyerName: user.name,
            buyerLocation: buyerLocation.trim(),
            paymentMethod: "ONLINE",
          }),
        }
      );

      const razorpayData = await createResponse.json();

      if (!createResponse.ok) {
        setMessage(
          razorpayData.message ||
            "Unable to start online payment."
        );
        return;
      }

      if (
        !razorpayData.razorpayKey ||
        !razorpayData.razorpayOrder?.id
      ) {
        setMessage(
          "Online payment could not be started. Please check Razorpay configuration."
        );
        return;
      }

      const options = {
        key: razorpayData.razorpayKey,
        amount: razorpayData.razorpayOrder?.amount,
        currency: razorpayData.razorpayOrder?.currency || "INR",
        name: "FarmConnect",
        description: `${selectedProduce.name} - ${quantity} kg`,
        order_id: razorpayData.razorpayOrder?.id,
        prefill: {
          name: user.name,
          email: user.email,
        },
        notes: {
          delivery_location: buyerLocation.trim(),
        },
        theme: {
          color: "#2f7d32",
        },
        handler: async function (paymentResponse) {
          try {
            setMessage("Verifying your payment...");

            const verifyResponse = await fetch(
              `${API_URL}/api/payments/verify`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  produceId: selectedProduce._id,
                  quantity,
                  buyerName: user.name,
                  buyerLocation: buyerLocation.trim(),
                  razorpayOrderId:
                    paymentResponse.razorpay_order_id,
                  razorpayPaymentId:
                    paymentResponse.razorpay_payment_id,
                  razorpaySignature:
                    paymentResponse.razorpay_signature,
                }),
              }
            );

            const verifyData = await verifyResponse.json();

            if (!verifyResponse.ok) {
              setMessage(
                verifyData.message ||
                  "Payment verification failed."
              );
              return;
            }

            setMessage(
              "Payment successful and order confirmed! 🎉"
            );
            setSelectedProduce(null);
            await fetchProduce();
            await fetchMyOrders();
            setPage("myorders");
          } catch (error) {
            console.error(
              "Payment verification error:",
              error
            );
            setMessage(
              "Payment was completed, but order verification could not be completed. Please check My Orders before trying again."
            );
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            setMessage("Online payment was cancelled.");
            setLoading(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);

      razorpay.on("payment.failed", function (response) {
        console.error("Razorpay payment failed:", response.error);
        setMessage("Online payment failed. Your order was not created.");
        setLoading(false);
      });

      razorpay.open();
    } catch (error) {
      console.error("Place order/payment error:", error);
      setMessage("Unable to connect to server.");
      setLoading(false);
    }
  }

  /* -------------------------------------------------------
     UPDATE ORDER STATUS
     ------------------------------------------------------- */

  async function updateOrderStatus(orderId, status) {
    if (!token) {
      setMessage("Please login first.");
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/orders/${orderId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.message || "Unable to update order."
        );
        return;
      }

      setMessage(`Order status updated to "${status}".`);

      await fetchOrders();
      await fetchMyOrders();
    } catch (error) {
      console.error("Update order error:", error);
      setMessage("Unable to connect to server.");
    }
  }

  /* -------------------------------------------------------
     ROUTER
     ------------------------------------------------------- */

  function renderPage() {
    switch (page) {
      case "home":
        return (
          <HomePage
            user={user}
            setPage={setPage}
          />
        );

      case "auth":
        return (
          <AuthPage
            authMode={authMode}
            setAuthMode={setAuthMode}
            authForm={authForm}
            setAuthForm={setAuthForm}
            handleLogin={handleLogin}
            handleSignup={handleSignup}
            loading={loading}
            message={message}
          />
        );

      case "farmer":
        return (
          <FarmerPage
            user={user}
            message={message}
            produceForm={produceForm}
            setProduceForm={setProduceForm}
            handleAddProduce={handleAddProduce}
            loading={loading}
            myProduce={myProduce}
            orders={orders}
            updateOrderStatus={updateOrderStatus}
            bulkRequirements={bulkRequirements}
bulkLoading={bulkLoading}
selectedBulkRequirement={selectedBulkRequirement}
setSelectedBulkRequirement={setSelectedBulkRequirement}
bulkOfferForm={bulkOfferForm}
setBulkOfferForm={setBulkOfferForm}
bulkOfferLoading={bulkOfferLoading}
          />
        );

      case "marketplace":
        return (
          <MarketplacePage
            produce={produce}
            user={user}
            message={message}
            openOrderPage={openOrderPage}
            openFarmerProfile={openFarmerProfile}
            setPage={setPage}
          />
        );

      case "farmerprofile":
        return (
          <FarmerProfile
            farmer={selectedFarmer}
            produce={produce}
            openOrderPage={openOrderPage}
            setPage={setPage}
          />
        );

      case "retailer":
        return (
          <RetailerPage
            user={user}
            message={message}
            produce={produce}
            openOrderPage={openOrderPage}
            openFarmerProfile={openFarmerProfile}
            setPage={setPage}
            token={token}
          />
        );

      case "order":
        return (
          <OrderPage
            user={user}
            selectedProduce={selectedProduce}
            buyerType={buyerType}
            orderQuantity={orderQuantity}
            setOrderQuantity={setOrderQuantity}
            buyerName={buyerName}
            buyerLocation={buyerLocation}
            setBuyerLocation={setBuyerLocation}
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            handlePlaceOrder={handlePlaceOrder}
            loading={loading}
            message={message}
            setPage={setPage}
          />
        );

      case "myorders":
        return (
          <MyOrdersPage
            user={user}
            buyerOrders={buyerOrders}
            message={message}
            setPage={setPage}
          />
        );

      default:
        return (
          <HomePage
            user={user}
            setPage={setPage}
          />
        );
    }
  }

  return (
    <>
      <Navbar
        user={user}
        setPage={setPage}
        handleLogout={handleLogout}
        fetchMyOrders={fetchMyOrders}
      />

      {renderPage()}
      <VoiceAssistant setPage={setPage} />
    </>
  );
}

export default App;
