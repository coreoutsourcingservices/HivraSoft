class HivraProAssistant {
    constructor() {
        this.container = document.getElementById('chatbot-container');
        this.launcher = document.getElementById('launcher-wrapper');
        this.bubble = document.getElementById('name-bubble');
        this.messagesArea = document.getElementById('chat-messages');
        this.userInput = document.getElementById('user-input');
        this.sendBtn = document.getElementById('send-btn');
        this.btnClose = document.getElementById('close-chat');
        this.btnReset = document.getElementById('reset-chat'); 
        
        let existingName = "";
        if (this.bubble) {
            let bubbleText = this.bubble.innerText.trim();
            if (bubbleText.startsWith("Hi, ") && !bubbleText.includes("Guest")) {
                existingName = bubbleText.replace("Hi, ", "").trim();
            }
        }
        this.userName = '';
        this.apiBase = String(window.HIVRA_CHATBOT_API_BASE || '').replace(/\/$/, '');
        this.authUserId = null;
        this.authLoaded = false;
        this.knowledge = [];
        this.isTracking = false; 
        
        this.isTracking = false; 
        this.isSomethingElse = false;
        this.braData = { underbust: 0, bust: 0 };
        this.lastBubbleRect = null;
        
        this.userLanguage = 'English'; 
        this.userGenderCode = ''; 

        // Hivra Soft custom flow values - added without removing existing chatbot features.
        this.selectedProductType = '';
        this.selectedCatalogProduct = null;
        this.catalogRequestSeq = 0;
        this.hivraWebsite = window.location.origin + '/';
        this.hivraSupportPhone = '+919420980536';
        this.hivraSupportEmail = 'hivrasoft@gmail.com';

        // Session memory: keeps chat data while the site/tab is open.
        // Data is deleted when customer closes the chat using X/Reset, or when the browser tab/session closes.
        this.chatSessionKey = 'hivrasoft_chatbot_active_session_v1';
        this.chatSessionRestored = false;

        this.i18n = {
            'English': {
                ui: {
                    placeholder: "Ask us anything...", sendBtn: "Send",
                    greet: "Hello! Welcome to Hivra Soft. ✨",
                    genderQ: "For a personalized experience, please select your gender:",
                    gM: "Male 👨", gF: "Female 👩",
                    ready: "All set! I am ready to help you find the perfect fit.",
                    menuMsg: "How can I help you today?",
                    bTrack: "🚚 Order Tracking", bSize: "📏 Size Fitting", bKnow: "✨ Know More", bFaq: "❓ FAQ & Contact", bElse: "🤔 Something Else", bHome: "🏠 Main Menu", bBack: "⬅️ Back", bLang: "🌐 Language",
                    trackQ: "Please type your <b>Tracking Number</b> below:",
                    trackScan: (id) => `Scanning database for ID: <b>${id}</b>...`,
                    trackRes: "📦 <b>Status:</b> In Transit<br>🚚 <b>Partner:</b> Delhivery / BlueDart<br>📅 <b>Est. Delivery:</b> 2-4 Days",
                    knowRes: "<b>About Hivra Soft:</b> We specialize in ultra-premium intimate wear for 'Intimate Comfort'.",
                    elseQ: "Select a topic below, or type your own query:", typeReq: "Please type your query below:", bTypeQuery: "✍️ Type Query",
                    callReqQ: "Would you like us to request to call you?",
                    bCallReq: "📞 Request Call", bEndChat: "🚫 End Chat", reqSent: "Request sent!", endRes: "Thank you for visiting! Chat session ended.",
                    catQ: "Select Category:", bMen: "👕 Men's", bWomen: "🩲 Women's",
                    waistQ: "Select <b>Waist Size</b> (inches):", recSize: (s) => `Recommended Size: <b>${s}</b>`,
                    bPanty: "🩲 Panty Size", bBra: "👙 Bra Calculator",
                    bra1: "<b>Step 1:</b> Select your <b>Underbust</b>:", bra2: "<b>Step 2:</b> Select your <b>Full Bust</b>:", braRes: (s) => `Your Size: <b>${s}</b>`,
                    faqDel: "🚚 Delivery", faqRet: "🔄 Return",
                    contactQ: "Choose an option:", bCallUs: "📞 Call Us", bEmailUs: "📧 Email Us", callOp: "📞 Call option opened.", emailOp: "📧 Email option opened.",
                    fallback: "Thank you for your message! Our team will get back to you shortly.",
                    kmM1: "📏 Size Guide", kmM2: "🩳 Briefs vs Trunks", kmM3: "☁️ Best Fabric", kmM4: "🏋️‍♂️ Gym Wear", kmM5: "✨ Prevent Chafing",
                    kmF1: "👙 Bra Size Guide", kmF2: "🌸 Straps Slipping", kmF3: "✅ Cup Gaps", kmF4: "👚 Daily Bra", kmF5: "🚫 Tight Band",
                    seM1: "🌬️ Odor Building", seM2: "💦 Sweating", seM3: "🌿 Skin Irritation", seM4: "⚕️ Health Issues", seM5: "✈️ Travel Discomfort", seM6: "😴 Sleep Discomfort", seM7: "🧶 Fabric Pilling",
                    seF1: "👗 Style Preference", seF2: "🧵 Material Choice", seF3: "🩸 Period Leaks", seF4: "🤰 Maternity Changes", seF5: "🤱 Postpartum", seF6: "⚕️ Health Issues", seF7: "🦵 Thigh Chafing", seF8: "🍼 Nursing", seF9: "👚 Nipple Coverage"
                },
                kb: [
                    { keys: ['hi', 'hey'], ans: "Hi there! How can I assist you today? ✨" },
                    { keys: ['delivery', 'shipping'], ans: "Standard shipping usually takes <b>5-7 working days</b>. 🚚" },
                    { keys: ['return', 'exchange'], ans: "We offer a <b>7-day easy size exchange</b> policy. 🔄" },
                    { keys: ['price', 'cost'], ans: "Our premium innerwear starts from <b>₹499</b>. 💸" },
                    { keys: ['boxer', 'brief', 'trunk'], ans: "Trunks for daily use, Boxers for sleep! 🩳" },
                    { keys: ['_m1'], ans: "Use our size guide! Measure your waist and choose the corresponding size. A snug fit without tight marks is perfect. 📏", gender: 'M' },
                    { keys: ['_m2'], ans: "Briefs for support, Trunks for everyday wear, Boxers for relaxed lounging. 🩳", gender: 'M' },
                    { keys: ['_m3'], ans: "Cotton blends or Modal fabrics are best for breathability and all-day softness. ☁️", gender: 'M' },
                    { keys: ['_m4'], ans: "Moisture-wicking microfiber or spandex blends provide the best stretch and sweat control. 🏋️‍♂️", gender: 'M' },
                    { keys: ['_m5'], ans: "Choose seamless designs or longer trunks made of moisture-wicking fabric to prevent rubbing. ✨", gender: 'M' },
                    { keys: ['_f1'], ans: "Measure your underbust for band size, and full bust for cup size. Use our Bra Calculator! 👙", gender: 'F' },
                    { keys: ['_f2'], ans: "Slipping straps usually mean the band is too loose, or the straps need tightening. 🌸", gender: 'F' },
                    { keys: ['_f3'], ans: "Cup gaps mean the cup size is too large. Try sizing down the cup. ✅", gender: 'F' },
                    { keys: ['_f4'], ans: "Seamless, wire-free, or lightly padded T-shirt bras offer the best comfort for everyday use. 👚", gender: 'F' },
                    { keys: ['_f5'], ans: "If it leaves deep red marks or rides up your back, it's too tight. It should sit comfortably snug. 🚫", gender: 'F' },
                    { keys: ['_sem1'], ans: "To prevent odor, choose breathable, natural fabrics like bamboo.", gender: 'M' },
                    { keys: ['_sem2'], ans: "Wear moisture-wicking fabrics that pull sweat away to evaporate.", gender: 'M' },
                    { keys: ['_sem3'], ans: "Switch to seamless, tagless clothing made from soft, hypoallergenic cotton.", gender: 'M' },
                    { keys: ['_sem4'], ans: "Keep the area dry with loose-fitting, breathable cotton underwear.", gender: 'M' },
                    { keys: ['_sem5'], ans: "Wear loose, stretchable garments with non-restrictive waistbands for better circulation.", gender: 'M' },
                    { keys: ['_sem6'], ans: "Choose loose, lightweight, breathable nightwear to keep your body cool.", gender: 'M' },
                    { keys: ['_sem7'], ans: "Wash clothes inside out gently, and avoid washing with jeans.", gender: 'M' },
                    { keys: ['_sef1'], ans: "What occasion are you dressing for? Tap an option below:", gender: 'F' },
                    { keys: ['_sef2'], ans: "Different fabrics serve different needs. Tap an option below:", gender: 'F' },
                    { keys: ['_sef3'], ans: "Wear snug bottoms or high-absorbency period underwear for extra backup.", gender: 'F' },
                    { keys: ['_sef4'], ans: "Switch to wire-free, highly stretchable bras with adjustable, soft bands.", gender: 'F' },
                    { keys: ['_sef5'], ans: "Wear high-waisted, breathable cotton underwear for gentle healing and support.", gender: 'F' },
                    { keys: ['_sef6'], ans: "Always choose innerwear with a breathable, 100% cotton lining (gusset).", gender: 'F' },
                    { keys: ['_sef7'], ans: "Wear seamless anti-chafing slip shorts or apply anti-friction balms.", gender: 'F' },
                    { keys: ['_sef8'], ans: "Choose wire-free nursing bras with easy-access, drop-down front clips.", gender: 'F' },
                    { keys: ['_sef9'], ans: "Opt for lightly padded cups or reusable silicone nipple covers.", gender: 'F' }
                ]
            },
            'Hindi': {
                ui: {
                    placeholder: "Yahan likhein...", sendBtn: "Bhejein",
                    greet: "Namaste! Hivra Soft mein aapka swagat hai. ✨",
                    genderQ: "Behtar anubhav ke liye apna gender chunein:",
                    gM: "Purush 👨", gF: "Mahila 👩",
                    ready: "Sab set hai! Main aapki madad ke liye taiyar hoon.",
                    menuMsg: "Bataiye, main aapki kaise madad kar sakta hoon?",
                    bTrack: "🚚 Order Pata Karein", bSize: "📏 Sahi Size", bKnow: "✨ Aur Janiye", bFaq: "❓ Sawal & Sampark", bElse: "🤔 Kuch Aur", bHome: "🏠 Main Menu", bBack: "⬅️ Piche", bLang: "🌐 Language",
                    trackQ: "Kripya apna <b>Tracking Number</b> niche likhein:",
                    trackScan: (id) => `ID check ho rahi hai: <b>${id}</b>...`,
                    trackRes: "📦 <b>Status:</b> Raste mein<br>🚚 <b>Partner:</b> Delhivery<br>📅 <b>Est. Delivery:</b> 2-4 Din",
                    knowRes: "<b>Hivra Soft:</b> Hum 'Intimate Comfort' ke liye premium innerwear banate hain.",
                    elseQ: "Niche ek topic chunein ya apna sawal likhein:", typeReq: "Kripya apna sawal yahan likhein:", bTypeQuery: "✍️ Sawal Likhein",
                    callReqQ: "Kya aap chahte hain hum aapko call karein?",
                    bCallReq: "📞 Call Request", bEndChat: "🚫 Chat Band Karein", reqSent: "Request bhej di gayi hai!", endRes: "Aane ke liye shukriya! Chat khatam hui.",
                    catQ: "Category chunein:", bMen: "👕 Aadmi", bWomen: "🩲 Aurat",
                    waistQ: "Kamar ka size (inches) chunein:", recSize: (s) => `Sahi Size: <b>${s}</b>`,
                    bPanty: "🩲 Panty Ka Size", bBra: "👙 Bra Ka Size",
                    bra1: "<b>Step 1:</b> Apna <b>Underbust</b> chunein:", bra2: "<b>Step 2:</b> Apna <b>Full Bust</b> chunein:", braRes: (s) => `Aapka Size: <b>${s}</b>`,
                    faqDel: "🚚 Delivery", faqRet: "🔄 Wapsi (Return)",
                    contactQ: "Ek option chunein:", bCallUs: "📞 Call Karein", bEmailUs: "📧 Email Karein", callOp: "📞 Call option khul gaya.", emailOp: "📧 Email option khul gaya.",
                    fallback: "Aapke message ke liye shukriya! Hamari team jald hi sampark karegi.",
                    kmM1: "📏 Sahi Size", kmM2: "🩳 Briefs ya Trunks", kmM3: "☁️ Sahi Kapda", kmM4: "🏋️‍♂️ Gym Wear", kmM5: "✨ Rashes se Bachao",
                    kmF1: "👙 Bra Size Guide", kmF2: "🌸 Straps Girna", kmF3: "✅ Cups mein Gap", kmF4: "👚 Rozana Bra", kmF5: "🚫 Tight Band",
                    seM1: "🌬️ Badboo (Odor)", seM2: "💦 Paseena", seM3: "🌿 Skin Rashes", seM4: "⚕️ Health", seM5: "✈️ Safar (Travel)", seM6: "😴 Neend me aaram", seM7: "🧶 Kapde pe ruve",
                    seF1: "👗 Style", seF2: "🧵 Material", seF3: "🩸 Period Leaks", seF4: "🤰 Maternity", seF5: "🤱 Delivery ke baad", seF6: "⚕️ Health", seF7: "🦵 Thigh chafing", seF8: "🍼 Nursing", seF9: "👚 Nipple Coverage"
                },
                kb: [
                    { keys: ['hi', 'namaste'], ans: "Namaste! Main aapki kaise madad kar sakta hoon? ✨" },
                    { keys: ['delivery', 'din', 'kab'], ans: "Aam taur par delivery mein <b>5-7 din</b> lagte hain. 🚚" },
                    { keys: ['return', 'wapas', 'badalna'], ans: "Humari <b>7-din ki aasan size exchange</b> policy hai. 🔄" },
                    { keys: ['price', 'daam', 'kitne'], ans: "Hamare premium innerwear <b>₹499</b> se shuru hote hain. 💸" },
                    { keys: ['boxer', 'brief', 'trunk'], ans: "Roz ke liye Trunks, sone ke liye Boxers best hain. 🩳" },
                    { keys: ['_m1'], ans: "Sahi size ke liye apna kamar naapein. Ekdum snug fit jo nishan na chhode, wahi perfect hai. 📏", gender: 'M' },
                    { keys: ['_m2'], ans: "Support ke liye Briefs, rozana ke liye Trunks, aur sone ke liye Boxers best hain. 🩳", gender: 'M' },
                    { keys: ['_m3'], ans: "Rozana aaram ke liye Cotton blends ya Modal fabric sabse badiya hote hain. ☁️", gender: 'M' },
                    { keys: ['_m4'], ans: "Workout ke liye moisture-wicking microfiber ya spandex provide the best stretch and sweat control. 🏋️‍♂️", gender: 'M' },
                    { keys: ['_m5'], ans: "Ragad (chafing) se bachne ke liye seamless design chunein. ✨", gender: 'M' },
                    { keys: ['_f1'], ans: "Band ke liye underbust aur cup ke liye full bust naapein. 👙", gender: 'F' },
                    { keys: ['_f2'], ans: "Agar straps gir rahe hain, toh band loose ho sakta hai ya straps tight karein. 🌸", gender: 'F' },
                    { keys: ['_f3'], ans: "Cups mein gap ka matlab hai size bada hai. Ek cup size chota try karein. ✅", gender: 'F' },
                    { keys: ['_f4'], ans: "Roz pehanne ke liye seamless, wire-free T-shirt bra sabse aaramdayak hai. 👚", gender: 'F' },
                    { keys: ['_f5'], ans: "Agar band nishan chhode ya upar khiske, toh woh bahut tight hai. 🚫", gender: 'F' },
                    { keys: ['_sem1'], ans: "Badboo se bachne ke liye bamboo jaise natural fabric chunein.", gender: 'M' },
                    { keys: ['_sem2'], ans: "Paseena sokhne wale (moisture-wicking) kapde pehnein jo aapko sukha rakhein.", gender: 'M' },
                    { keys: ['_sem3'], ans: "Rashes se bachne ke liye bina tag wale, mulayam cotton kapde pehnein.", gender: 'M' },
                    { keys: ['_sem4'], ans: "Dheele aur hawaadaar cotton underwear pehankar us hisse ko sukha rakhein.", gender: 'M' },
                    { keys: ['_sem5'], ans: "Lambe safar ke liye dheele, stretchable aur aaramdayak kapde pehnein.", gender: 'M' },
                    { keys: ['_sem6'], ans: "Acchi neend ke liye halke aur dheele raat ke kapde pehnein.", gender: 'M' },
                    { keys: ['_sem7'], ans: "Ruve se bachne ke liye kapdo ko ulta karke dhoyein.", gender: 'M' },
                    { keys: ['_sef1'], ans: "Aap kis mauke ke liye kapde dekh rahi hain? Niche chunein:", gender: 'F' },
                    { keys: ['_sef2'], ans: "Aapko kaun sa fabric pasand hai? Niche chunein:", gender: 'F' },
                    { keys: ['_sef3'], ans: "Extra safety ke liye period underwear ya tight bottoms pehnein.", gender: 'F' },
                    { keys: ['_sef4'], ans: "Bina wire wali aur zyada stretch hone wali maternity bra chunein.", gender: 'F' },
                    { keys: ['_sef5'], ans: "Jaldi recovery ke liye high-waist aur aaramdayak cotton underwear pehnein.", gender: 'F' },
                    { keys: ['_sef6'], ans: "Hamesha 100% cotton lining wale innerwear hi chunein.", gender: 'F' },
                    { keys: ['_sef7'], ans: "Jangho ki ragad rokne ke liye seamless slip-shorts pehnein.", gender: 'F' },
                    { keys: ['_sef8'], ans: "Doodh pilane mein aasaani ke liye aage se khulne wali bra chunein.", gender: 'F' },
                    { keys: ['_sef9'], ans: "Halke pad wale cup ya silicone nipple cover ka istemaal karein.", gender: 'F' }
                ]
            },
            'Telgu': {
                ui: {
                    placeholder: "Ikkada rayandi...", sendBtn: "Pampandi",
                    greet: "Namaskaram! Hivra Soft ku swagatham. ✨",
                    genderQ: "Manchi anubhavam kosam mee gender nu ennukondi:",
                    gM: "Magavallu 👨", gF: "Aadavallu 👩",
                    ready: "Anni set ayyayi! Nenu meeku sahayam cheyadaniki ready.",
                    menuMsg: "Cheppandi, nenu meeku yela sahayam cheyagalanu?",
                    bTrack: "🚚 Order Vetakandi", bSize: "📏 Saina Size", bKnow: "✨ Inka Telusukondi", bFaq: "❓ Prashnalu & Contact", bElse: "🤔 Inkemaina", bHome: "🏠 Main Menu", bBack: "⬅️ Venakki", bLang: "🌐 Language",
                    trackQ: "Mee <b>Tracking Number</b> nu kinda type cheyandi:",
                    trackScan: (id) => `ID check avuthondi: <b>${id}</b>...`,
                    trackRes: "📦 <b>Status:</b> Darilo undi<br>🚚 <b>Partner:</b> Delhivery<br>📅 <b>Est. Delivery:</b> 2-4 Rojulu",
                    knowRes: "<b>Hivra Soft:</b> Memu premium innerwear tayaru chesthamu.",
                    elseQ: "Top topic nu ennukondi, leda mee prashnanu rayandi:", typeReq: "Mee prashnanu kinda rayandi:", bTypeQuery: "✍️ Prashna Rayandi",
                    callReqQ: "Memu mimmalni call cheyalani meeru korukuntunnara?",
                    bCallReq: "📞 Call Request", bEndChat: "🚫 Chat Mugimpu", reqSent: "Request pampabadindi!", endRes: "Vachinanduku dhanyavadalu! Chat mugisindi.",
                    catQ: "Category ennukondi:", bMen: "👕 Magavallu", bWomen: "🩲 Aadavallu",
                    waistQ: "Nadumu size (inches) ennukondi:", recSize: (s) => `Sariaina Size: <b>${s}</b>`,
                    bPanty: "🩲 Panty Size", bBra: "👙 Bra Size",
                    bra1: "<b>Step 1:</b> Mee <b>Underbust</b> ennukondi:", bra2: "<b>Step 2:</b> Mee <b>Full Bust</b> ennukondi:", braRes: (s) => `Mee Size: <b>${s}</b>`,
                    faqDel: "🚚 Delivery", faqRet: "🔄 Return",
                    contactQ: "Oka option ennukondi:", bCallUs: "📞 Call Cheyandi", bEmailUs: "📧 Email Cheyandi", callOp: "📞 Call option teruchukundi.", emailOp: "📧 Email option teruchukundi.",
                    fallback: "Mee message ku dhanyavadalu! Ma team twaralo sampradisthundi.",
                    kmM1: "📏 Size Guide", kmM2: "🩳 Briefs a Trunks a", kmM3: "☁️ Best Fabric", kmM4: "🏋️‍♂️ Gym Wear", kmM5: "✨ Rashes Nivarana",
                    kmF1: "👙 Bra Size Guide", kmF2: "🌸 Straps Jaaradam", kmF3: "✅ Cups lo Gap", kmF4: "👚 Roju Bra", kmF5: "🚫 Tight Band",
                    seM1: "🌬️ Vasana (Odor)", seM2: "💦 Chemata (Sweat)", seM3: "🌿 Rashes", seM4: "⚕️ Health", seM5: "✈️ Travel", seM6: "😴 Nidra (Sleep)", seM7: "🧶 Pilling",
                    seF1: "👗 Style", seF2: "🧵 Material", seF3: "🩸 Period Leaks", seF4: "🤰 Maternity", seF5: "🤱 Delivery Tarvata", seF6: "⚕️ Health", seF7: "🦵 Chafing", seF8: "🍼 Nursing", seF9: "👚 Coverage"
                },
                kb: [
                    { keys: ['hi', 'namaskaram'], ans: "Namaskaram! Nenu meeku yela sahayam cheyagalanu? ✨" },
                    { keys: ['delivery', 'eppudu'], ans: "Sadharananga delivery ki <b>5-7 rojulu</b> paduthundi. 🚚" },
                    { keys: ['return', 'venakki'], ans: "Ma daggara <b>7-rojula easy size exchange</b> policy undi. 🔄" },
                    { keys: ['price', 'dhara', 'entha'], ans: "Ma premium innerwear <b>₹499</b> nundi modalavuthundi. 💸" },
                    { keys: ['boxer', 'brief', 'trunk'], ans: "Roju vadataniki Trunks, padukovadaniki Boxers best. 🩳" },
                    { keys: ['_m1'], ans: "Sariaina size kosam mee nadumu kolavandi. Marks padakunda snug ga unde size perfect. 📏", gender: 'M' },
                    { keys: ['_m2'], ans: "Support kosam Briefs, roju vadataniki Trunks, aur sone ke liye Boxers best hain. 🩳", gender: 'M' },
                    { keys: ['_m3'], ans: "Roju aaram kosam Cotton blends leda Modal fabric chala manchidi. ☁️", gender: 'M' },
                    { keys: ['_m4'], ans: "Gym kosam chemata peelche microfiber leda spandex best hain. 🏋️‍♂️", gender: 'M' },
                    { keys: ['_m5'], ans: "Ragad (chafing) se bachne ke liye seamless design chunein. ✨", gender: 'M' },
                    { keys: ['_f1'], ans: "Band size ki underbust aur cup ke liye full bust naapein. 👙", gender: 'F' },
                    { keys: ['_f2'], ans: "Straps jaarutunte band loose ga undachu leda straps tight cheyali. 🌸", gender: 'F' },
                    { keys: ['_f3'], ans: "Cups lo gap unte size peddadi ani artham. Oka cup size tagginchi chudandi. ✅", gender: 'F' },
                    { keys: ['_f4'], ans: "Roju vadataniki seamless, wire-free T-shirt bras chala aaram ga untayi. 👚", gender: 'F' },
                    { keys: ['_f5'], ans: "Band errati machalu chesthunte leda paiki velthunte adhi chala tight ga undani artham. 🚫", gender: 'F' },
                    { keys: ['_sem1'], ans: "Vasana rakunda undataniki bamboo lanti natural fabrics ennukondi.", gender: 'M' },
                    { keys: ['_sem2'], ans: "Chemata peelchukunna (moisture-wicking) battalu dharinchandi.", gender: 'M' },
                    { keys: ['_sem3'], ans: "Rashes nivariyadaniki tag leni, soft cotton battalu vadandi.", gender: 'M' },
                    { keys: ['_sem4'], ans: "Gali aade loose cotton underwear tho aa prantham dry ga unchandi.", gender: 'M' },
                    { keys: ['_sem5'], ans: "Prayanam lo loose, stretchable battalu dharinchandi.", gender: 'M' },
                    { keys: ['_sem6'], ans: "Manchi nidra kosam thelikapati nightwear ennukondi.", gender: 'M' },
                    { keys: ['_sem7'], ans: "Battalanu eppudu lopali vaipu thippi uthakandi.", gender: 'M' },
                    { keys: ['_sef1'], ans: "Meeru ye sandarbham kosam chustunnaru? Kinda ennukondi:", gender: 'F' },
                    { keys: ['_sef2'], ans: "Meeku ye fabric ishtam? Kinda ennukondi:", gender: 'F' },
                    { keys: ['_sef3'], ans: "Extra safety kosam period underwear leda tight bottoms vadandi.", gender: 'F' },
                    { keys: ['_sef4'], ans: "Wire leni, baga sage maternity bra ennukondi.", gender: 'F' },
                    { keys: ['_sef5'], ans: "Twaraga recovery kosam high-waist, cotton underwear dharinchandi.", gender: 'F' },
                    { keys: ['_sef6'], ans: "Eppudu 100% cotton lining unna innerwear matrame ennukondi.", gender: 'F' },
                    { keys: ['_sef7'], ans: "Thodala raapidi aapataniki seamless slip-shorts dharinchandi.", gender: 'F' },
                    { keys: ['_sef8'], ans: "Feeding ivvadaniki mundu bhagam teruchukune bra ennukondi.", gender: 'F' },
                    { keys: ['_sef9'], ans: "Light pad unna cups leda silicone nipple covers vadandi.", gender: 'F' }
                ]
            },
            'Tamil': {
                ui: {
                    placeholder: "Inge type seiyavum...", sendBtn: "Anuppu",
                    greet: "Vanakkam! Hivra Soft-kku varaverkirom. ✨",
                    genderQ: "Sirantha anubhavathirku ungal gender-ai thervu seiyavum:",
                    gM: "Aangal 👨", gF: "Pengal 👩",
                    ready: "Ellam ready! Naan ungalukku udhava thayar.",
                    menuMsg: "Sollunga, naan eppadi udhava mudiyum?",
                    bTrack: "🚚 Order Thedu", bSize: "📏 Sariyana Size", bKnow: "✨ Melum Ariya", bFaq: "❓ FAQ-Kelvigal", bElse: "🤔 Veru Yedhavathu", bHome: "🏠 Main Menu", bBack: "⬅️ Pinnal", bLang: "🌐 Language",
                    trackQ: "Ungal <b>Tracking Number</b>-ai keezhe ullidavum:",
                    trackScan: (id) => `ID check seiyappadugirathu: <b>${id}</b>...`,
                    trackRes: "📦 <b>Status:</b> Vazhiyil ullathu<br>🚚 <b>Partner:</b> Delhivery<br>📅 <b>Est. Delivery:</b> 2-4 Naatkal",
                    knowRes: "<b>Hivra Soft:</b> Nangal premium innerwear uruvakkugirom.",
                    elseQ: "Keezhe oru topic-ai thervu seiyavum, allathu type seiyavum:", typeReq: "Ungal kelviyai keezhe type seiyavum:", bTypeQuery: "✍️ Kelviyai Type Sei",
                    callReqQ: "Nangal ungalai alaika virumbugirirgala?",
                    bCallReq: "📞 Call Request", bEndChat: "🚫 Chat Mudi", reqSent: "Request anuppappattathu!", endRes: "Vanthatharku nandri! Chat mudinthathu.",
                    catQ: "Category-ai thervu seiyavum:", bMen: "👕 Aangal", bWomen: "🩲 Pengal",
                    waistQ: "Iduppu alavai (inches) thervu seiyavum:", recSize: (s) => `Sariyana Size: <b>${s}</b>`,
                    bPanty: "🩲 Panty Size", bBra: "👙 Bra Size",
                    bra1: "<b>Step 1:</b> Ungal <b>Underbust</b>-ai thervu seiyavum:", bra2: "<b>Step 2:</b> Ungal <b>Full Bust</b>-ai thervu seiyavum:", braRes: (s) => `Ungal Size: <b>${s}</b>`,
                    faqDel: "🚚 Delivery", faqRet: "🔄 Return",
                    contactQ: "Oru option-ai thervu seiyavum:", bCallUs: "📞 Call Seiyavum", bEmailUs: "📧 Email Seiyavum", callOp: "📞 Call option thiranthathu.", emailOp: "📧 Email option thiranthathu.",
                    fallback: "Ungal thagavalukku nandri! Engal kuzhu viraivil thodarbu kollum.",
                    kmM1: "📏 Size Guide", kmM2: "🩳 Briefs vs Trunks", kmM3: "☁️ Best Fabric", kmM4: "🏋️‍♂️ Gym Wear", kmM5: "✨ Prevent Chafing",
                    kmF1: "👙 Bra Size Guide", kmF2: "🌸 Straps Slipping", kmF3: "✅ Cup Gaps", kmF4: "👚 Daily Bra", kmF5: "🚫 Tight Band",
                    seM1: "🌬️ Vaadai (Odor)", seM2: "💦 Viyarvai (Sweat)", seM3: "🌿 Rashes", seM4: "⚕️ Health", seM5: "✈️ Travel", seM6: "😴 Thukkam (Sleep)", seM7: "🧶 Pilling",
                    seF1: "👗 Style", seF2: "🧵 Material", seF3: "🩸 Period Leaks", seF4: "🤰 Maternity", seF5: "🤱 Delivery Pin", seF6: "⚕️ Health", seF7: "🦵 Chafing", seF8: "🍼 Nursing", seF9: "👚 Coverage"
                },
                kb: [
                    { keys: ['hi', 'vanakkam'], ans: "Vanakkam! Naan ungalukku eppadi udhava mudiyum? ✨" },
                    { keys: ['delivery', 'eppo'], ans: "Satharanama delivery aaga <b>5-7 naatkal</b> aagum. 🚚" },
                    { keys: ['return', 'thiruppi'], ans: "Engalidam <b>7-naatkal sulabhamana size exchange</b> policy ullathu. 🔄" },
                    { keys: ['price', 'vilai'], ans: "Engal premium innerwear <b>₹499</b> muthal thodangugirathu. 💸" },
                    { keys: ['boxer', 'brief', 'trunk'], ans: "Dhinamum aniya Trunks, thoonga Boxers best. 🩳" },
                    { keys: ['_m1'], ans: "Sariyana alavukku ungal iduppai alakkavum. Thazhumbugal illatha snug fit siranthathu. 📏", gender: 'M' },
                    { keys: ['_m2'], ans: "Support-kku Briefs, dhinamum aniya Trunks, thoonguvatharku Boxers siranthathu. 🩳", gender: 'M' },
                    { keys: ['_m3'], ans: "Dhinamum aaramaga irukka Cotton blends allathu Modal thunigal siranthathu. ☁️", gender: 'M' },
                    { keys: ['_m4'], ans: "Udarpeyirchikkum gym-kkum viyarvaiyai urinjum microfiber thunigal best. 🏋️‍♂️", gender: 'M' },
                    { keys: ['_m5'], ans: "Thol urayvai thavirkka seamless design aniyavum. ✨", gender: 'M' },
                    { keys: ['_f1'], ans: "Band size-kku underbust, cup size-kku full bust alakkavum. 👙", gender: 'F' },
                    { keys: ['_f2'], ans: "Straps nazhuvinal band loose-aaga irukkalam. Straps-ai tight seiyavum. 🌸", gender: 'F' },
                    { keys: ['_f3'], ans: "Cups-il idaiveli irunthal alavu periyathu. ✅", gender: 'F' },
                    { keys: ['_f4'], ans: "Dhinamum aniyavatharku seamless, wire-free T-shirt bras mighavum vasathiyanathu. 👚", gender: 'F' },
                    { keys: ['_f5'], ans: "Band sivappu thazhumbugalai erpaduthinal adhu tight-aaga ullathu ena artham. 🚫", gender: 'F' },
                    { keys: ['_sem1'], ans: "Vaadaiyai thadukka bamboo pondra natural fabrics-ai thervu seiyavum.", gender: 'M' },
                    { keys: ['_sem2'], ans: "Viyarvaiyai urinji veliyetrum (moisture-wicking) aadaigalai aniyavum.", gender: 'M' },
                    { keys: ['_sem3'], ans: "Rashes-ai thavirkka tag illatha soft cotton aadaigalai aniyavum.", gender: 'M' },
                    { keys: ['_sem4'], ans: "Kaatroteamaana loose cotton underwear aninthu dry aaga vaithukkollavum.", gender: 'M' },
                    { keys: ['_sem5'], ans: "Neenda payanathirku loose-aana, stretchable aadaigalai aniyavum.", gender: 'M' },
                    { keys: ['_sem6'], ans: "Nalla thukkathirku lesaana, thalarvaana nightwear aniyavum.", gender: 'M' },
                    { keys: ['_sem7'], ans: "Thunigalai eppothum thiruppi thuvaikkavum, jeans-udan serthu thuvaikkathirgal.", gender: 'M' },
                    { keys: ['_sef1'], ans: "Neengal entha nigalvirku aadaigal thedugirirgal? Keezhe thervu seiyavum:", gender: 'F' },
                    { keys: ['_sef2'], ans: "Ungalukku entha fabric pidikkum? Keezhe thervu seiyavum:", gender: 'F' },
                    { keys: ['_sef3'], ans: "Extra safety-kku period underwear allathu tight bottoms aniyavum.", gender: 'F' },
                    { keys: ['_sef4'], ans: "Wire illatha, nangu neelum maternity bras-ai thervu seiyavum.", gender: 'F' },
                    { keys: ['_sef5'], ans: "Viraivil gunamadaiya high-waist, cotton underwear aniyavum.", gender: 'F' },
                    { keys: ['_sef6'], ans: "Eppothum 100% cotton lining ulla innerwear-ai mattume thervu seiyavum.", gender: 'F' },
                    { keys: ['_sef7'], ans: "Thodai uraivai thadukka seamless slip-shorts aniyavum.", gender: 'F' },
                    { keys: ['_sef8'], ans: "Paalutta vasathiyaga munpakkam thirakkakkudiya bra-vai thervu seiyavum.", gender: 'F' },
                    { keys: ['_sef9'], ans: "Light pad ulla cups allathu silicone nipple covers payanpaduthavum.", gender: 'F' }
                ]
            },
            'Punjabi': {
                ui: {
                    placeholder: "Itthe likho...", sendBtn: "Bhejo",
                    greet: "Sat Sri Akal! Hivra Soft vich tuhada swagat hai. ✨",
                    genderQ: "Vadiya anubhav layi apna gender chuno:",
                    gM: "Munde 👨", gF: "Kudiya 👩",
                    ready: "Sab set hai! Main tuhadi madad layi taiyar haan.",
                    menuMsg: "Dasso, main tuhadi kivein madad kar sakda haan?",
                    bTrack: "🚚 Order Pata Karo", bSize: "📏 Sahi Size", bKnow: "✨ Hor Jano", bFaq: "❓ FAQ-Sawal", bElse: "🤔 Kuch Hor", bHome: "🏠 Main Menu", bBack: "⬅️ Piche", bLang: "🌐 Language",
                    trackQ: "Kripa karke apna <b>Tracking Number</b> thalle likho:",
                    trackScan: (id) => `ID check ho rahi hai: <b>${id}</b>...`,
                    trackRes: "📦 <b>Status:</b> Raste vich<br>🚚 <b>Partner:</b> Delhivery<br>📅 <b>Est. Delivery:</b> 2-4 Din",
                    knowRes: "<b>Hivra Soft:</b> Assi 'Intimate Comfort' layi premium innerwear banande haan.",
                    elseQ: "Thalle topic chuno, ya apna sawal likho:", typeReq: "Kripa karke apna sawal likho:", bTypeQuery: "✍️ Sawal Likho",
                    callReqQ: "Ki tusi chahte ho assi tuhanu call kariye?",
                    bCallReq: "📞 Call Request", bEndChat: "🚫 Chat Band Karo", reqSent: "Request bhej diti gayi hai!", endRes: "Aun layi shukriya! Chat khatam hui.",
                    catQ: "Category chuno:", bMen: "👕 Munde", bWomen: "🩲 Kudiya",
                    waistQ: "Lakk da size (inches) chuno:", recSize: (s) => `Sahi Size: <b>${s}</b>`,
                    bPanty: "🩲 Panty Size", bBra: "👙 Bra Size",
                    bra1: "<b>Step 1:</b> Apna <b>Underbust</b> chuno:", bra2: "<b>Step 2:</b> Apna <b>Full Bust</b> chuno:", braRes: (s) => `Tuhada Size: <b>${s}</b>`,
                    faqDel: "🚚 Delivery", faqRet: "🔄 Return",
                    contactQ: "Ek option chuno:", bCallUs: "📞 Call Karo", bEmailUs: "📧 Email Karo", callOp: "📞 Call option khul gaya.", emailOp: "📧 Email option khul gaya.",
                    fallback: "Tuhade message layi shukriya! Saadi team jaldi hi sampark karegi.",
                    kmM1: "📏 Size Guide", kmM2: "🩳 Briefs vs Trunks", kmM3: "☁️ Best Fabric", kmM4: "🏋️‍♂️ Gym Wear", kmM5: "✨ Prevent Chafing",
                    kmF1: "👙 Bra Size Guide", kmF2: "🌸 Straps Slipping", kmF3: "✅ Cup Gaps", kmF4: "👚 Daily Bra", kmF5: "🚫 Tight Band",
                    seM1: "🌬️ Badboo (Odor)", seM2: "💦 Pasina (Sweat)", seM3: "🌿 Rashes", seM4: "⚕️ Health", seM5: "✈️ Safar (Travel)", seM6: "😴 Neend (Sleep)", seM7: "🧶 Pilling",
                    seF1: "👗 Style", seF2: "🧵 Material", seF3: "🩸 Period Leaks", seF4: "🤰 Maternity", seF5: "🤱 Delivery Baad", seF6: "⚕️ Health", seF7: "🦵 Chafing", seF8: "🍼 Nursing", seF9: "👚 Coverage"
                },
                kb: [
                    { keys: ['hi', 'sat sri akal'], ans: "Sat Sri Akal! Main tuhadi kivein madad kar sakda haan? ✨" },
                    { keys: ['delivery', 'kado'], ans: "Aam taur te delivery vich <b>5-7 din</b> lagde ne. 🚚" },
                    { keys: ['return', 'wapis'], ans: "Saadi <b>7-din di aasan size exchange</b> policy hai. 🔄" },
                    { keys: ['price', 'rate', 'kinne'], ans: "Kinne paise? Saade premium innerwear <b>₹499</b> ton shuru hunde ne. 💸" },
                    { keys: ['boxer', 'brief', 'trunk'], ans: "Rozana layi Trunks, saun layi Boxers vadiya ne. 🩳" },
                    { keys: ['_m1'], ans: "Sahi size layi apna lakk napo. Bina nishan chadde snug fit sabton vadiya hai. 📏", gender: 'M' },
                    { keys: ['_m2'], ans: "Support layi Briefs, rozana layi Trunks, te saun layi Boxers best ne. 🩳", gender: 'M' },
                    { keys: ['_m3'], ans: "Rozana aaram layi Cotton blends ya Modal fabric sabton vadiya hunde ne. ☁️", gender: 'M' },
                    { keys: ['_m4'], ans: "Gym layi pasina sokhan wale microfiber ya spandex best ne. 🏋️‍♂️", gender: 'M' },
                    { keys: ['_m5'], ans: "Ragad ton bachan layi seamless design chuno. ✨", gender: 'M' },
                    { keys: ['_f1'], ans: "Band size layi underbust te cup layi full bust napo. 👙", gender: 'F' },
                    { keys: ['_f2'], ans: "Je straps dig rahe ne, taan band loose ho sakda hai. 🌸", gender: 'F' },
                    { keys: ['_f3'], ans: "Cups vich gap da matlab hai size wadda hai. Ik cup size chota try karo. ✅", gender: 'F' },
                    { keys: ['_f4'], ans: "Roz pehnan layi seamless, wire-free T-shirt bra sabton vadiya hai. 👚", gender: 'F' },
                    { keys: ['_f5'], ans: "Je band laal nishan chadde ya pitth te utte khiske, taan oh bahut tight hai. 🚫", gender: 'F' },
                    { keys: ['_sem1'], ans: "Badboo ton bachan layi bamboo varge natural fabric chuno.", gender: 'M' },
                    { keys: ['_sem2'], ans: "Pasina sokhan wale (moisture-wicking) kapde pao.", gender: 'M' },
                    { keys: ['_sem3'], ans: "Rashes ton bachan layi bina tag wale soft cotton kapde pao.", gender: 'M' },
                    { keys: ['_sem4'], ans: "Khullhe te hawaadar cotton underwear naal jagah nu sukka rakho.", gender: 'M' },
                    { keys: ['_sem5'], ans: "Lame safar layi khullhe te stretchable kapde pao.", gender: 'M' },
                    { keys: ['_sem6'], ans: "Changi neend layi halke te khullhe raat de kapde pao.", gender: 'M' },
                    { keys: ['_sem7'], ans: "Kapdeyan nu hamesha puttha karke dhovo.", gender: 'M' },
                    { keys: ['_sef1'], ans: "Tusi kis mauke layi kapde dekh rahe ho? Thalle chuno:", gender: 'F' },
                    { keys: ['_sef2'], ans: "Tuhanu kehda fabric pasand hai? Thalle chuno:", gender: 'F' },
                    { keys: ['_sef3'], ans: "Extra safety layi period underwear ya tight bottoms pao.", gender: 'F' },
                    { keys: ['_sef4'], ans: "Bina wire wali te zyada stretch hon wali maternity bra chuno.", gender: 'F' },
                    { keys: ['_sef5'], ans: "Jaldi recovery layi high-waist te aaramdayak cotton underwear pao.", gender: 'F' },
                    { keys: ['_sef6'], ans: "Hamesha 100% cotton lining wale innerwear hi chuno.", gender: 'F' },
                    { keys: ['_sef7'], ans: "Pattan di ragad rokan layi seamless slip-shorts pao.", gender: 'F' },
                    { keys: ['_sef8'], ans: "Duddh pilaun vich aasani layi agge ton khullan wali bra chuno.", gender: 'F' },
                    { keys: ['_sef9'], ans: "Halke pad wale cup ya silicone nipple cover varto.", gender: 'F' }
                ]
            },
            'Marathi': {
                ui: {
                    placeholder: "Yethe liha...", sendBtn: "Pathva",
                    greet: "Namaskar! Hivra Soft madhye tumche swagat aahe. ✨",
                    genderQ: "Changlya anubhavasathi tumche gender nivada:",
                    gM: "Purush 👨", gF: "Mahila 👩",
                    ready: "Sagle set aahe! Mi tumchi madat karayla tayar aahe.",
                    menuMsg: "Sanga, mi tumchi kashi madat karu shakto?",
                    bTrack: "🚚 Order Paha", bSize: "📏 Sahi Size", bKnow: "✨ Aani Mahiti", bFaq: "❓ FAQ-Prashna", bElse: "🤔 Itar Kahi", bHome: "🏠 Main Menu", bBack: "⬅️ Mage", bLang: "🌐 Language",
                    trackQ: "Krupa karun tumcha <b>Tracking Number</b> khali liha:",
                    trackScan: (id) => `ID check hot aahe: <b>${id}</b>...`,
                    trackRes: "📦 <b>Status:</b> Rastyat aahe<br>🚚 <b>Partner:</b> Delhivery<br>📅 <b>Est. Delivery:</b> 2-4 Divas",
                    knowRes: "<b>Hivra Soft:</b> Aamhi premium innerwear banavto.",
                    elseQ: "Khali topic nivada kinva tumcha prashna liha:", typeReq: "Krupa karun tumcha prashna khali liha:", bTypeQuery: "✍️ Prashna Liha",
                    callReqQ: "Aamhi tumhala call karava ase tumhala vatate ka?",
                    bCallReq: "📞 Call Request", bEndChat: "🚫 Chat Band Kara", reqSent: "Request pathvli aahe!", endRes: "Bhet dilyabaddal dhanyavad! Chat sampali.",
                    catQ: "Category nivada:", bMen: "👕 Purush", bWomen: "🩲 Mahila",
                    waistQ: "Kambrecha size (inches) nivada:", recSize: (s) => `Yogya Size: <b>${s}</b>`,
                    bPanty: "🩲 Panty Size", bBra: "👙 Bra Size",
                    bra1: "<b>Step 1:</b> Tumche <b>Underbust</b> nivada:", bra2: "<b>Step 2:</b> Tumche <b>Full Bust</b> nivada:", braRes: (s) => `Tumcha Size: <b>${s}</b>`,
                    faqDel: "🚚 Delivery", faqRet: "🔄 Return",
                    contactQ: "Ek pariay nivada:", bCallUs: "📞 Call Kara", bEmailUs: "📧 Email Kara", callOp: "📞 Call option ughadle.", emailOp: "📧 Email option ughadle.",
                    fallback: "Tumchya sandeshasathi dhanyavad! Amchi team lavkarch sampark karel.",
                    kmM1: "📏 Size Guide", kmM2: "🩳 Briefs vs Trunks", kmM3: "☁️ Best Fabric", kmM4: "🏋️‍♂️ Gym Wear", kmM5: "✨ Prevent Chafing",
                    kmF1: "👙 Bra Size Guide", kmF2: "🌸 Straps Slipping", kmF3: "✅ Cup Gaps", kmF4: "👚 Daily Bra", kmF5: "🚫 Tight Band",
                    seM1: "🌬️ Durgandhi (Odor)", seM2: "💦 Gham (Sweat)", seM3: "🌿 Rashes", seM4: "⚕️ Health", seM5: "✈️ Pravas (Travel)", seM6: "😴 Zop (Sleep)", seM7: "🧶 Pilling",
                    seF1: "👗 Style", seF2: "🧵 Material", seF3: "🩸 Period Leaks", seF4: "🤰 Maternity", seF5: "🤱 Delivery Nantr", seF6: "⚕️ Health", seF7: "🦵 Chafing", seF8: "🍼 Nursing", seF9: "👚 Coverage"
                },
                kb: [
                    { keys: ['hi', 'namaskar'], ans: "Namaskar! Mi tumchi kashi madat karu shakto? ✨" },
                    { keys: ['delivery', 'kadhi'], ans: "Samanyatah delivery sathi <b>5-7 divas</b> lagtat. 🚚" },
                    { keys: ['return', 'parat'], ans: "Amchi <b>7-divsanchi sopi size exchange</b> policy aahe. 🔄" },
                    { keys: ['price', 'kimmat', 'kiti'], ans: "Amche premium innerwear <b>₹499</b> pasun suru hotat. 💸" },
                    { keys: ['boxer', 'brief', 'trunk'], ans: "Rojchya vaprasathi Trunks, jhopnyasathi Boxers best ahet. 🩳" },
                    { keys: ['_m1'], ans: "Yogya size sathi tumchi kambar moza. Nishan na sodta snug fit perfect aahe. 📏", gender: 'M' },
                    { keys: ['_m2'], ans: "Support sathi Briefs, rojachya vaprasathi Trunks, aani zopnyasathi Boxers best aahet. 🩳", gender: 'M' },
                    { keys: ['_m3'], ans: "Rojchya aaramasathi Cotton blends kinva Modal fabric sarvottam ahe. ☁️", gender: 'M' },
                    { keys: ['_m4'], ans: "Gym sathi gham shoshnare microfiber best aahet. 🏋️‍♂️", gender: 'M' },
                    { keys: ['_m5'], ans: "Rashes pasun vachnyasathi seamless design nivada. ✨", gender: 'M' },
                    { keys: ['_f1'], ans: "Band size sathi underbust aani cup sathi full bust moza. 👙", gender: 'F' },
                    { keys: ['_f2'], ans: "Straps padat aslyas band loose asu shakto. Straps tight kara. 🌸", gender: 'F' },
                    { keys: ['_f3'], ans: "Cups madhye gap aslyas size motha aahe. ✅", gender: 'F' },
                    { keys: ['_f4'], ans: "Rojchya vaprasathi seamless T-shirt bra sarvadhik aaramdayak ahe. 👚", gender: 'F' },
                    { keys: ['_f5'], ans: "Jara band lal nishan sodat asel tar to khup tight aahe. 🚫", gender: 'F' },
                    { keys: ['_sem1'], ans: "Durgandhi talnyasathi bamboo sarkhe natural fabric nivada.", gender: 'M' },
                    { keys: ['_sem2'], ans: "Gham shoshnare (moisture-wicking) kapde ghala.", gender: 'M' },
                    { keys: ['_sem3'], ans: "Rashes pasun vachnyasathi tag naslele soft cotton kapde ghala.", gender: 'M' },
                    { keys: ['_sem4'], ans: "Sail aani haveshir cotton underwear ghalun jaga kordi theva.", gender: 'M' },
                    { keys: ['_sem5'], ans: "Pravasasathi sail aani stretchable kapde ghala.", gender: 'M' },
                    { keys: ['_sem6'], ans: "Changlya zopesathi halke aani sail ratriche kapde ghala.", gender: 'M' },
                    { keys: ['_sem7'], ans: "Kapde nehmi ulte karun dhuva aani jeans sobat dhuvu naka.", gender: 'M' },
                    { keys: ['_sef1'], ans: "Tumhi kontya prasangasathi kapde pahat aahat? Khali nivada:", gender: 'F' },
                    { keys: ['_sef2'], ans: "Tumhala konte fabric aavadte? Khali nivada:", gender: 'F' },
                    { keys: ['_sef3'], ans: "Extra safety sathi period underwear kinva tight bottoms ghala.", gender: 'F' },
                    { keys: ['_sef4'], ans: "Wire nasleli aani jast stretch honari maternity bra nivada.", gender: 'F' },
                    { keys: ['_sef5'], ans: "Laukar bare honyasathi high-waist aani aaramdayak cotton underwear ghala.", gender: 'F' },
                    { keys: ['_sef6'], ans: "Nehmi 100% cotton lining aslele innerwear nivada.", gender: 'F' },
                    { keys: ['_sef7'], ans: "Mandya ghasne talnyasathi seamless slip-shorts ghala.", gender: 'F' },
                    { keys: ['_sef8'], ans: "Dudh pajnyasathi pudhun ughadnari bra nivada.", gender: 'F' },
                    { keys: ['_sef9'], ans: "Halke pad aslele cup kinva silicone nipple cover vapra.", gender: 'F' }
                ]
            },
            'Gujrati': {
                ui: {
                    placeholder: "Ahiya lakho...", sendBtn: "Moklo",
                    greet: "Namaste! Hivra Soft ma tamaru swagat che. ✨",
                    genderQ: "Sara anubhav mate tamaru gender pasand karo:",
                    gM: "Purush 👨", gF: "Mahila 👩",
                    ready: "Badhu set che! Hu tamari madad karva taiyar chu.",
                    menuMsg: "Bolo, hu tamari kevi rite madad kari shaku?",
                    bTrack: "🚚 Order Check Karo", bSize: "📏 Sachi Size", bKnow: "✨ Vadu Jano", bFaq: "❓ FAQ-Prashno", bElse: "🤔 Biju Kai", bHome: "🏠 Main Menu", bBack: "⬅️ Pachhu", bLang: "🌐 Language",
                    trackQ: "Krupa kari tamaro <b>Tracking Number</b> niche lakho:",
                    trackScan: (id) => `ID check thai rahi che: <b>${id}</b>...`,
                    trackRes: "📦 <b>Status:</b> Rasta ma che<br>🚚 <b>Partner:</b> Delhivery<br>📅 <b>Est. Delivery:</b> 2-4 Divas",
                    knowRes: "<b>Hivra Soft:</b> Ame premium innerwear banaviye chiye.",
                    elseQ: "Niche topic pasand karo, athva lakho:", typeReq: "Tamaro prashn niche lakho:", bTypeQuery: "✍️ Prashn Lakho",
                    callReqQ: "Shu tame iccho cho ke ame tamne call kariye?",
                    bCallReq: "📞 Call Request", bEndChat: "🚫 Chat Bandh Karo", reqSent: "Request moklai gai che!", endRes: "Aavva mate aabhar! Chat puri thai.",
                    catQ: "Category pasand karo:", bMen: "👕 Purush", bWomen: "🩲 Mahila",
                    waistQ: "Kamar no size (inches) pasand karo:", recSize: (s) => `Sachi Size: <b>${s}</b>`,
                    bPanty: "🩲 Panty Size", bBra: "👙 Bra Size",
                    bra1: "<b>Step 1:</b> Tamaru <b>Underbust</b> pasand karo:", bra2: "<b>Step 2:</b> Tamaru <b>Full Bust</b> pasand karo:", braRes: (s) => `Tamaro Size: <b>${s}</b>`,
                    faqDel: "🚚 Delivery", faqRet: "🔄 Return",
                    contactQ: "Ek vikalp pasand karo:", bCallUs: "📞 Call Karo", bEmailUs: "📧 Email Karo", callOp: "📞 Call option khuli gayu.", emailOp: "📧 Email option khuli gayu.",
                    fallback: "Tamara message mate aabhar! Amari team jaldi thi sampark karshe.",
                    kmM1: "📏 Size Guide", kmM2: "🩳 Briefs vs Trunks", kmM3: "☁️ Best Fabric", kmM4: "🏋️‍♂️ Gym Wear", kmM5: "✨ Prevent Chafing",
                    kmF1: "👙 Bra Size Guide", kmF2: "🌸 Straps Slipping", kmF3: "✅ Cup Gaps", kmF4: "👚 Daily Bra", kmF5: "🚫 Tight Band",
                    seM1: "🌬️ Durgandh (Odor)", seM2: "💦 Parsevo (Sweat)", seM3: "🌿 Rashes", seM4: "⚕️ Health", seM5: "✈️ Musafari (Travel)", seM6: "😴 Ungh (Sleep)", seM7: "🧶 Pilling",
                    seF1: "👗 Style", seF2: "🧵 Material", seF3: "🩸 Period Leaks", seF4: "🤰 Maternity", seF5: "🤱 Delivery Pachi", seF6: "⚕️ Health", seF7: "🦵 Chafing", seF8: "🍼 Nursing", seF9: "👚 Coverage"
                },
                kb: [
                    { keys: ['hi', 'namaste'], ans: "Namaste! Hu tamari kevi rite madad kari shaku? ✨" },
                    { keys: ['delivery', 'divas'], ans: "Samanya rite delivery ma <b>5-7 divas</b> lage che. 🚚" },
                    { keys: ['return', 'pachhu'], ans: "Amari <b>7-divas ni saral size exchange</b> policy che. 🔄" },
                    { keys: ['price', 'bhav', 'ketla'], ans: "Amara premium innerwear <b>₹499</b> thi sharu thay che. 💸" },
                    { keys: ['boxer', 'brief', 'trunk'], ans: "Roj mate Trunks, suv mate Boxers best che. 🩳" },
                    { keys: ['_m1'], ans: "Sachi size mate tamari kamar mapo. Nishan vagar no snug fit perfect che. 📏", gender: 'M' },
                    { keys: ['_m2'], ans: "Support mate Briefs, roj mate Trunks, ane suv mate Boxers best che. 🩳", gender: 'M' },
                    { keys: ['_m3'], ans: "Roj aaram mate Cotton blends ke Modal fabric sau thi sara che. ☁️", gender: 'M' },
                    { keys: ['_m4'], ans: "Gym mate parsevo shoshnar microfiber best che. 🏋️‍♂️", gender: 'M' },
                    { keys: ['_m5'], ans: "Rashes thi bachva seamless design pasand karo. ✨", gender: 'M' },
                    { keys: ['_f1'], ans: "Band size mate underbust ane cup mate full bust mapo. 👙", gender: 'F' },
                    { keys: ['_f2'], ans: "Jo straps padi rahya che, to band loose hoi shake che. 🌸", gender: 'F' },
                    { keys: ['_f3'], ans: "Cups ma gap no matlab size moto che. ✅", gender: 'F' },
                    { keys: ['_f4'], ans: "Roj paherela mate seamless T-shirt bra sau thi aaramdayak che. 👚", gender: 'F' },
                    { keys: ['_f5'], ans: "Jo band lal nishan chode to te khub tight che. 🚫", gender: 'F' },
                    { keys: ['_sem1'], ans: "Durgandh talva bamboo jeva natural fabric pasand karo.", gender: 'M' },
                    { keys: ['_sem2'], ans: "Parsevo shoshnar (moisture-wicking) kapda pahero.", gender: 'M' },
                    { keys: ['_sem3'], ans: "Rashes thi bachva tag vagar na naram cotton kapda pahero.", gender: 'M' },
                    { keys: ['_sem4'], ans: "Dhila ane havadar cotton underwear paherine jagya suki rakho.", gender: 'M' },
                    { keys: ['_sem5'], ans: "Lambi musafari mate dhila ane stretchable kapda pahero.", gender: 'M' },
                    { keys: ['_sem6'], ans: "Sari ungh mate halva ane dhila raat na kapda pahero.", gender: 'M' },
                    { keys: ['_sem7'], ans: "Kapda hamesha undha karine dhovo ane jeans sathe na dhovo.", gender: 'M' },
                    { keys: ['_sef1'], ans: "Tame kaya prasang mate kapda joi rahya cho? Niche pasand karo:", gender: 'F' },
                    { keys: ['_sef2'], ans: "Tamne kayu fabric pasand che? Niche pasand karo:", gender: 'F' },
                    { keys: ['_sef3'], ans: "Extra safety mate period underwear ke tight bottoms pahero.", gender: 'F' },
                    { keys: ['_sef4'], ans: "Wire vagar ni ane vadhare stretch thati maternity bra pasand karo.", gender: 'F' },
                    { keys: ['_sef5'], ans: "Jhadap thi recovery mate high-waist ane aaramdayak cotton underwear pahero.", gender: 'F' },
                    { keys: ['_sef6'], ans: "Hamesha 100% cotton lining vala innerwear j pasand karo.", gender: 'F' },
                    { keys: ['_sef7'], ans: "Jangh no ghasaro atkavva seamless slip-shorts pahero.", gender: 'F' },
                    { keys: ['_sef8'], ans: "Dudh pivdavva mate aagal thi khulti bra pasand karo.", gender: 'F' },
                    { keys: ['_sef9'], ans: "Halva pad vala cup ke silicone nipple cover vapro.", gender: 'F' }
                ]
            },
            'Bengali': {
                ui: {
                    placeholder: "Ekhane likhun...", sendBtn: "Pathan",
                    greet: "Nomoshkar! Hivra Soft e apnake swagoto. ✨",
                    genderQ: "Bhalo obhiggottar jonno apnar gender bachhun:",
                    gM: "Purush 👨", gF: "Mohila 👩",
                    ready: "Sob toiri! Ami apnake sahajjo korte prostut.",
                    menuMsg: "Bolun, ami apnake kivabe sahajjo korte pari?",
                    bTrack: "🚚 Order Dekhun", bSize: "📏 Sothik Size", bKnow: "✨ Aro Janun", bFaq: "❓ FAQ-Jogajog", bElse: "🤔 Onno Kichu", bHome: "🏠 Main Menu", bBack: "⬅️ Piche", bLang: "🌐 Language",
                    trackQ: "Doya kore apnar <b>Tracking Number</b> niche likhun:",
                    trackScan: (id) => `ID check hocche: <b>${id}</b>...`,
                    trackRes: "📦 <b>Status:</b> Rastaay<br>🚚 <b>Partner:</b> Delhivery<br>📅 <b>Est. Delivery:</b> 2-4 Din",
                    knowRes: "<b>Hivra Soft:</b> Amra premium innerwear toiri kori.",
                    elseQ: "Niche topic bachhun, ba apnar proshno likhun:", typeReq: "Apnar proshno niche likhun:", bTypeQuery: "✍️ Proshno Likhun",
                    callReqQ: "Apni ki chan amra apnake call kori?",
                    bCallReq: "📞 Call Request", bEndChat: "🚫 Chat Bondho Korun", reqSent: "Request pathano hoyeche!", endRes: "Asar jonno dhonnobad! Chat sesh.",
                    catQ: "Category bachhun:", bMen: "👕 Purush", bWomen: "🩲 Mohila",
                    waistQ: "Komor er size (inches) bachhun:", recSize: (s) => `Sothik Size: <b>${s}</b>`,
                    bPanty: "🩲 Panty Size", bBra: "👙 Bra Size",
                    bra1: "<b>Step 1:</b> Apnar <b>Underbust</b> bachhun:", bra2: "<b>Step 2:</b> Apnar <b>Full Bust</b> bachhun:", braRes: (s) => `Apnar Size: <b>${s}</b>`,
                    faqDel: "🚚 Delivery", faqRet: "🔄 Return",
                    contactQ: "Ekটি option bachhun:", bCallUs: "📞 Call Korun", bEmailUs: "📧 Email Korun", callOp: "📞 Call option khuleche.", emailOp: "📧 Email option khuleche.",
                    fallback: "Apnar message er jonno dhonnobad! Amader team siggroi jogajog korbe.",
                    kmM1: "📏 Size Guide", kmM2: "🩳 Briefs vs Trunks", kmM3: "☁️ Best Fabric", kmM4: "🏋️‍♂️ Gym Wear", kmM5: "✨ Prevent Chafing",
                    kmF1: "👙 Bra Size Guide", kmF2: "🌸 Straps Slipping", kmF3: "✅ Cup Gaps", kmF4: "👚 Daily Bra", kmF5: "🚫 Tight Band",
                    seM1: "🌬️ Durgondho (Odor)", seM2: "💦 Gham (Sweat)", seM3: "🌿 Rashes", seM4: "⚕️ Health", seM5: "✈️ Bhromon (Travel)", seM6: "😴 Ghum (Sleep)", seM7: "🧶 Pilling",
                    seF1: "👗 Style", seF2: "🧵 Material", seF3: "🩸 Period Leaks", seF4: "🤰 Maternity", seF5: "🤱 Delivery Por", seF6: "⚕️ Health", seF7: "🦵 Chafing", seF8: "🍼 Nursing", seF9: "👚 Coverage"
                },
                kb: [
                    { keys: ['hi', 'nomoskar'], ans: "Nomoskar! Ami apnake kivabe sahajjo korte pari? ✨" },
                    { keys: ['delivery', 'kobe'], ans: "Sadharonoto delivery te <b>5-7 din</b> shomoy lage. 🚚" },
                    { keys: ['return', 'ferot'], ans: "Amader <b>7-din er shohoj size exchange</b> policy ache. 🔄" },
                    { keys: ['price', 'daam', 'koto'], ans: "Amader premium innerwear <b>₹499</b> theke shuru. 💸" },
                    { keys: ['boxer', 'brief', 'trunk'], ans: "Rojkar jonno Trunks, ghumanor jonno Boxers best. 🩳" },
                    { keys: ['_m1'], ans: "Sothik size er jonno apnar komor mapun. Daag na fela snug fit ekdom thik. 📏", gender: 'M' },
                    { keys: ['_m2'], ans: "Support er jonno Briefs, rojekar jonno Trunks best. 🩳", gender: 'M' },
                    { keys: ['_m3'], ans: "Rojkar aaram er jonno Cotton blends ba Modal fabric shobcheye bhalo. ☁️", gender: 'M' },
                    { keys: ['_m4'], ans: "Gym er jonno gham shoshanokari microfiber best. 🏋️‍♂️", gender: 'M' },
                    { keys: ['_m5'], ans: "Rash theke bachte seamless design bachhun. ✨", gender: 'M' },
                    { keys: ['_f1'], ans: "Band size er jonno underbust ar cup er jonno full bust mapun. 👙", gender: 'F' },
                    { keys: ['_f2'], ans: "Strap pore gele band loose hote pare. 🌸", gender: 'F' },
                    { keys: ['_f3'], ans: "Cup a faka thakar ortho size boro. ✅", gender: 'F' },
                    { keys: ['_f4'], ans: "Roj porar jonno seamless T-shirt bra shobcheye aaramdayak. 👚", gender: 'F' },
                    { keys: ['_f5'], ans: "Jodi band laal daag fele tobe eta bishon tight. 🚫", gender: 'F' },
                    { keys: ['_sem1'], ans: "Durgondho edate bamboo er moto natural fabric bachhun.", gender: 'M' },
                    { keys: ['_sem2'], ans: "Gham shushe ney (moisture-wicking) emon bhalo kapor porun.", gender: 'M' },
                    { keys: ['_sem3'], ans: "Rashes theke bachte tag chhara norom cotton kapor porun.", gender: 'M' },
                    { keys: ['_sem4'], ans: "Dhile-dhala ebon batas chola-chol kore emon cotton underwear porun.", gender: 'M' },
                    { keys: ['_sem5'], ans: "Bhromon er jonno dhile-dhala ebon stretchable kapor porun.", gender: 'M' },
                    { keys: ['_sem6'], ans: "Bhalo ghumer jonno halka ebon dhile-dhala rater kapor porun.", gender: 'M' },
                    { keys: ['_sem7'], ans: "Kapor shobshomoy ulto kore dhoben ebon jeans er sathe dhoben na.", gender: 'M' },
                    { keys: ['_sef1'], ans: "Apni kon onushthaner jonno kapor khunjchhen? Niche bachhun:", gender: 'F' },
                    { keys: ['_sef2'], ans: "Apnar kon fabric pochhondo? Niche bachhun:", gender: 'F' },
                    { keys: ['_sef3'], ans: "Extra safety er jonno period underwear ba tight bottoms porun.", gender: 'F' },
                    { keys: ['_sef4'], ans: "Wire-chhara ebon beshi stretch hoy emon maternity bra bachhun.", gender: 'F' },
                    { keys: ['_sef5'], ans: "Taratari recovery er jonno high-waist ebon aaramdayok cotton underwear porun.", gender: 'F' },
                    { keys: ['_sef6'], ans: "Shobshomoy 100% cotton lining thaka innerwear bachhun.", gender: 'F' },
                    { keys: ['_sef7'], ans: "Urur ghosha roth korte seamless slip-shorts porun.", gender: 'F' },
                    { keys: ['_sef8'], ans: "Dudh khaowanote subidhar jonno samne theke khola jay emon bra bachhun.", gender: 'F' },
                    { keys: ['_sef9'], ans: "Halka pad thaka cup ba silicone nipple cover bebohar korun.", gender: 'F' }
                ]
            },
            'Kannada': {
                ui: {
                    placeholder: "Illi type madi...", sendBtn: "Kaluhisi",
                    greet: "Namaskara! Hivra Soft ge swagata. ✨",
                    genderQ: "Olleya anubhavakkagi nimma gender aayke madi:",
                    gM: "Gandu 👨", gF: "Hennu 👩",
                    ready: "Yella set agide! Naanu nimage sahayamadalu ready.",
                    menuMsg: "Heli, naanu nimage hege sahayamadaballe?",
                    bTrack: "🚚 Order Huduki", bSize: "📏 Sariyada Size", bKnow: "✨ Inku Tilidu", bFaq: "❓ FAQ-Prashne", bElse: "🤔 Bere Yenu", bHome: "🏠 Main Menu", bBack: "⬅️ Hinde", bLang: "🌐 Language",
                    trackQ: "Nimma <b>Tracking Number</b> kelage type madi:",
                    trackScan: (id) => `ID check aguttide: <b>${id}</b>...`,
                    trackRes: "📦 <b>Status:</b> Dariyallide<br>🚚 <b>Partner:</b> Delhivery<br>📅 <b>Est. Delivery:</b> 2-4 Dinagalu",
                    knowRes: "<b>Hivra Soft:</b> Navu premium innerwear tayarisutheve.",
                    elseQ: "Kelage topic aayke madi, athava type madi:", typeReq: "Nimma prashne kelage type madi:", bTypeQuery: "✍️ Prashne Type Madi",
                    callReqQ: "Navu nimage call madabeku endu neevu bayasuttira?",
                    bCallReq: "📞 Call Request", bEndChat: "🚫 Chat Mugisu", reqSent: "Request kaluhisalagide!", endRes: "Bandiddakke dhanyavada! Chat mugidide.",
                    catQ: "Category aayke madi:", bMen: "👕 Gandu", bWomen: "🩲 Hennu",
                    waistQ: "Sontada size (inches) aayke madi:", recSize: (s) => `Sariyada Size: <b>${s}</b>`,
                    bPanty: "🩲 Panty Size", bBra: "👙 Bra Size",
                    bra1: "<b>Step 1:</b> Nimma <b>Underbust</b> aayke madi:", bra2: "<b>Step 2:</b> Nimma <b>Full Bust</b> aayke madi:", braRes: (s) => `Nimma Size: <b>${s}</b>`,
                    faqDel: "🚚 Delivery", faqRet: "🔄 Return",
                    contactQ: "Ondu option aayke madi:", bCallUs: "📞 Call Madi", bEmailUs: "📧 Email Madi", callOp: "📞 Call option teredide.", emailOp: "📧 Email option teredide.",
                    fallback: "Nimma sandeshakke dhanyavada! Namma thanda shighradalli samparkisuttade.",
                    kmM1: "📏 Size Guide", kmM2: "🩳 Briefs vs Trunks", kmM3: "☁️ Best Fabric", kmM4: "🏋️‍♂️ Gym Wear", kmM5: "✨ Prevent Chafing",
                    kmF1: "👙 Bra Size Guide", kmF2: "🌸 Straps Slipping", kmF3: "✅ Cup Gaps", kmF4: "👚 Daily Bra", kmF5: "🚫 Tight Band",
                    seM1: "🌬️ Vasane (Odor)", seM2: "💦 Bevaru (Sweat)", seM3: "🌿 Rashes", seM4: "⚕️ Health", seM5: "✈️ Prayana (Travel)", seM6: "😴 Nidde (Sleep)", seM7: "🧶 Pilling",
                    seF1: "👗 Style", seF2: "🧵 Material", seF3: "🩸 Period Leaks", seF4: "🤰 Maternity", seF5: "🤱 Delivery Nantara", seF6: "⚕️ Health", seF7: "🦵 Chafing", seF8: "🍼 Nursing", seF9: "👚 Coverage"
                },
                kb: [
                    { keys: ['hi', 'namaskara'], ans: "Namaskara! Naanu nimage hege sahayamadaballe? ✨" },
                    { keys: ['delivery', 'yavaga'], ans: "Samanyavagi delivery ge <b>5-7 dinagalu</b> bekaguttade. 🚚" },
                    { keys: ['return', 'hindirugisu'], ans: "Namma hathira <b>7-dinada sulabha size exchange</b> policy ide. 🔄" },
                    { keys: ['price', 'bele', 'eshtu'], ans: "Namma premium innerwear <b>₹499</b> inda shuru aguttade. 💸" },
                    { keys: ['boxer', 'brief', 'trunk'], ans: "Dinagalu balasukke Trunks, malagoke Boxers best. 🩳" },
                    { keys: ['_m1'], ans: "Sariyada size ge nimma sonta aleyiri. Marks illada snug fit perfect. 📏", gender: 'M' },
                    { keys: ['_m2'], ans: "Support ge Briefs, dina balasukke Trunks best. 🩳", gender: 'M' },
                    { keys: ['_m3'], ans: "Dina aaramakkagi Cotton blends tumba olleyadu. ☁️", gender: 'M' },
                    { keys: ['_m4'], ans: "Gym ge bevaru hiraikolluva microfiber best. 🏋️‍♂️", gender: 'M' },
                    { keys: ['_m5'], ans: "Rashes thappisalu seamless design aayke madi. ✨", gender: 'M' },
                    { keys: ['_f1'], ans: "Band size ge underbust, cup size ge full bust aleyiri. 👙", gender: 'F' },
                    { keys: ['_f2'], ans: "Straps kelage biluttidre band loose irabahudu. 🌸", gender: 'F' },
                    { keys: ['_f3'], ans: "Cups nalli gap idre size doddadu anta artha. ✅", gender: 'F' },
                    { keys: ['_f4'], ans: "Dina hakokke seamless T-shirt bras aaramadayaka. 👚", gender: 'F' },
                    { keys: ['_f5'], ans: "Band kempu marks madutidre adu tumba tight ide. 🚫", gender: 'F' },
                    { keys: ['_sem1'], ans: "Vasane thappisalu bamboo antha natural fabric aayke madi.", gender: 'M' },
                    { keys: ['_sem2'], ans: "Bevaru heerikolluva (moisture-wicking) battagalannu dharisi.", gender: 'M' },
                    { keys: ['_sem3'], ans: "Rashes thappisalu tag illada soft cotton battagalannu dharisi.", gender: 'M' },
                    { keys: ['_sem4'], ans: "Gali aaduva loose cotton underwear dharisi a jaga dry agi idi.", gender: 'M' },
                    { keys: ['_sem5'], ans: "Prayanakkagi loose, stretchable battagalannu dharisi.", gender: 'M' },
                    { keys: ['_sem6'], ans: "Olleya niddegagi haguravada loose nightwear dharisi.", gender: 'M' },
                    { keys: ['_sem7'], ans: "Battagalannu yavagalu ulta madi tholeyeri, jeans jote tholeyabedi.", gender: 'M' },
                    { keys: ['_sef1'], ans: "Neevu yava sandarbhakkagi batte hudukuttidira? Kelage aayke madi:", gender: 'F' },
                    { keys: ['_sef2'], ans: "Nimage yava fabric ishta? Kelage aayke madi:", gender: 'F' },
                    { keys: ['_sef3'], ans: "Extra safety ge period underwear athava tight bottoms dharisi.", gender: 'F' },
                    { keys: ['_sef4'], ans: "Wire illada, chennagi stretch aguwa maternity bra aayke madi.", gender: 'F' },
                    { keys: ['_sef5'], ans: "Bega recovery agalu high-waist, aaramadayaka cotton underwear dharisi.", gender: 'F' },
                    { keys: ['_sef6'], ans: "Yavagalu 100% cotton lining iruva innerwear matra aayke madi.", gender: 'F' },
                    { keys: ['_sef7'], ans: "Thodegala ujjuvike thappisalu seamless slip-shorts dharisi.", gender: 'F' },
                    { keys: ['_sef8'], ans: "Makkalige halu kudisalu anukulavaguva munde thegeyuva bra aayke madi.", gender: 'F' },
                    { keys: ['_sef9'], ans: "Light pad iruva cups athava silicone nipple covers balasi.", gender: 'F' }
                ]
            }
        };

        this.init();
        this.updateBubble();
        this.loadKnowledge();
        this.pendingAfterLogin = false;
        this.refreshAuth().then(() => this.restoreChatSession());
        window.addEventListener('hivrasoft-auth-changed', async () => {
            const resumeAfterLogin = this.pendingAfterLogin;
            const user = await this.refreshAuth();
            if (user && resumeAfterLogin) {
                this.pendingAfterLogin = false;
                this.startTracking();
            }
        });
        window.addEventListener('hivrasoft-auth-logout', () => { this.handleLogout(); });
        window.addEventListener('focus', () => { this.refreshAuth(); });
    }

    t(key) { return (this.i18n[this.userLanguage] && this.i18n[this.userLanguage].ui[key]) || (this.i18n['English'] && this.i18n['English'].ui[key]) || key; }

    ht(key) {
        const pack = {
            English: {
                mainIntro: "Please select product type or issue. I can help you choose products, check size, track orders, and guide you for replacement/exchange.",
                mainMenuQ: "Please choose an option:", men: "👕 Men", women: "🩲 Women", haveIssue: "🛠️ Have an Issue", somethingElse: "🤔 Something Else",
                menProductQ: "Please choose men's product type:", womenProductQ: "Please choose women's product type:",
                menBrief: "🩲 Men Brief", trunkBoxer: "🩳 Trunk / Boxer", menSizeHelp: "📏 Men Size Help",
                braPadded: "👙 Bra / Padded Bra", feedingBra: "🤱 Feeding / Nursing Bra", sportsBra: "🏋️ Sports Bra", panty: "🩲 Panty", combo: "🎁 Bra & Panty Combo",
                sizeAfterGenderNote: "Size fitting is shown according to the selected Men/Women section.",
                otherHelpQ: "Other help options:", orderTracking: "🚚 Order Tracking", sizeFitting: "📏 Size Fitting", knowMore: "✨ Know More", faqContact: "❓ FAQ & Contact", typeQuery: "✍️ Type Query",
                selectedProduct: "You selected", waistQ: "Please select waist size in inches:", topSizeQ: "Please select your usual top size for Sports Bra:",
                recommended: "Recommended size", nextOptions: "I can now help you open Hivra Soft products, request size guidance, or connect support.",
                issueQ: "No problem. Please select what issue you are facing:", sizeIssue: "📏 Issue with Size", replaceExchange: "🔄 Replace / Exchange Product", trackMyOrder: "🚚 Track My Order", wrongDamaged: "📦 Wrong / Damaged Product", paymentCod: "💳 Payment / COD Issue", talkSupport: "💬 Talk to Support",
                sizeIssueText1: "For size issues, I can help you check the correct size and guide you for replacement/exchange if eligible.",
                sizeIssueText2: "Please keep ready:<br>• Order ID<br>• Product name<br>• Current size received<br>• Size required<br>• Registered mobile number",
                replacementText1: "For replacement/exchange, Hivra Soft support will check your order and guide you with the next step.",
                replacementText2: "Please share:<br>• Order ID<br>• Product name<br>• Reason for replacement<br>• Photo/video if required<br>• Registered mobile number",
                damagedText1: "For wrong or damaged product, please do not remove tags/packaging if possible and share clear photos/videos.",
                damagedText2: "Please share:<br>• Order ID<br>• Product received<br>• Product ordered<br>• Photos/video<br>• Registered mobile number",
                paymentText1: "For payment or COD issues, Hivra Soft support can verify and guide you.",
                paymentText2: "Please share:<br>• Order ID<br>• Payment mode<br>• Payment screenshot if amount deducted<br>• Registered mobile number",
                supportText: "You can contact Hivra Soft support through these options:",
                sendSizeWhatsapp: "💬 Send Size Issue on WhatsApp", requestWhatsapp: "💬 Request on WhatsApp", reportWhatsapp: "💬 Report on WhatsApp", sendPaymentWhatsapp: "💬 Send Payment Issue on WhatsApp", whatsappSupport: "💬 WhatsApp Support", callSupport: "📞 Call Support", emailSupport: "📧 Email Support", emailReplacement: "📧 Email Replacement Request", emailIssue: "📧 Email Issue", emailPayment: "📧 Email Payment Issue", visitWebsite: "🌐 Visit Website",
                openProductPage: "🌐 Open Product Page", askWhatsapp: "💬 Ask on WhatsApp", needReplacement: "🔄 Need Replacement", backToProducts: "⬅️ Back to Products",
                openedProduct: "Product page opened in a new tab. You can continue from here:", openedWhatsapp: "WhatsApp opened. You can continue from here:", openedEmail: "Email option opened. You can continue from here:", openedCall: "Call option opened. You can continue from here:", openedWebsite: "Website opened. You can continue from here:",
                trackRedirect: "Opening Hivra Soft tracking page...", onlyAfterGender: "For size fitting, please select Men or Women first so I can show the correct size flow."
            },
            Hindi: {
                mainIntro: "Product type ya issue select karein. Main product choose karne, size check karne, order track karne aur replacement/exchange guide karne mein help kar sakta hoon.",
                mainMenuQ: "Ek option select karein:", men: "👕 Men", women: "🩲 Women", haveIssue: "🛠️ Issue Hai", somethingElse: "🤔 Something Else",
                menProductQ: "Men's product type choose karein:", womenProductQ: "Women's product type choose karein:", menBrief: "🩲 Men Brief", trunkBoxer: "🩳 Trunk / Boxer", menSizeHelp: "📏 Men Size Help", braPadded: "👙 Bra / Padded Bra", feedingBra: "🤱 Feeding / Nursing Bra", sportsBra: "🏋️ Sports Bra", panty: "🩲 Panty", combo: "🎁 Bra & Panty Combo",
                sizeAfterGenderNote: "Size fitting selected Men/Women section ke according hi dikhega.", otherHelpQ: "Other help options:", orderTracking: "🚚 Order Tracking", sizeFitting: "📏 Size Fitting", knowMore: "✨ Know More", faqContact: "❓ FAQ & Contact", typeQuery: "✍️ Query Type Karein", selectedProduct: "Aapne select kiya", waistQ: "Waist size inches mein select karein:", topSizeQ: "Sports Bra ke liye apna usual top size select karein:", recommended: "Recommended size", nextOptions: "Ab main Hivra Soft products open karne, size guidance ya support connect karne mein help kar sakta hoon.", issueQ: "Koi baat nahi. Aapka issue select karein:", sizeIssue: "📏 Size Issue", replaceExchange: "🔄 Replace / Exchange Product", trackMyOrder: "🚚 Track My Order", wrongDamaged: "📦 Wrong / Damaged Product", paymentCod: "💳 Payment / COD Issue", talkSupport: "💬 Support se Baat Karein", sizeIssueText1: "Size issue mein main correct size check karke replacement/exchange guide kar sakta hoon.", sizeIssueText2: "Ye details ready rakhein:<br>• Order ID<br>• Product name<br>• Current size received<br>• Required size<br>• Registered mobile number", replacementText1: "Replacement/exchange ke liye Hivra Soft support order check karke next step batayega.", replacementText2: "Please share karein:<br>• Order ID<br>• Product name<br>• Replacement reason<br>• Photo/video if required<br>• Registered mobile number", damagedText1: "Wrong/damaged product ke liye tags/packaging remove na karein aur clear photos/videos share karein.", damagedText2: "Please share karein:<br>• Order ID<br>• Product received<br>• Product ordered<br>• Photos/video<br>• Registered mobile number", paymentText1: "Payment ya COD issue mein Hivra Soft support verify karke guide karega.", paymentText2: "Please share karein:<br>• Order ID<br>• Payment mode<br>• Payment screenshot if deducted<br>• Registered mobile number", supportText: "Hivra Soft support se contact karne ke options:", sendSizeWhatsapp: "💬 Size Issue WhatsApp Karein", requestWhatsapp: "💬 WhatsApp Request", reportWhatsapp: "💬 WhatsApp Report", sendPaymentWhatsapp: "💬 Payment Issue WhatsApp Karein", whatsappSupport: "💬 WhatsApp Support", callSupport: "📞 Call Support", emailSupport: "📧 Email Support", emailReplacement: "📧 Replacement Email", emailIssue: "📧 Issue Email", emailPayment: "📧 Payment Email", visitWebsite: "🌐 Website Visit Karein", openProductPage: "🌐 Product Page Open Karein", askWhatsapp: "💬 WhatsApp Par Puchhein", needReplacement: "🔄 Replacement Chahiye", backToProducts: "⬅️ Products Par Wapas", openedProduct: "Product page new tab mein open ho gaya. Aap yahan se continue kar sakte hain:", openedWhatsapp: "WhatsApp open ho gaya. Aap yahan se continue kar sakte hain:", openedEmail: "Email option open ho gaya. Aap yahan se continue kar sakte hain:", openedCall: "Call option open ho gaya. Aap yahan se continue kar sakte hain:", openedWebsite: "Website open ho gayi. Aap yahan se continue kar sakte hain:", trackRedirect: "Hivra Soft tracking page open ho raha hai...", onlyAfterGender: "Size fitting ke liye pehle Men ya Women select karein, phir sahi size flow dikhega."
            }
        };
        Object.assign(pack, {
            Telgu: Object.assign({}, pack.English, {"mainIntro": "Product type leda issue select cheyandi. Nenu products choose cheyadaniki, size check cheyadaniki, orders track cheyadaniki, replacement/exchange guide cheyadaniki help chestanu.", "mainMenuQ": "Oka option select cheyandi:", "men": "👕 Magavallu", "women": "🩲 Aadavallu", "haveIssue": "🛠️ Issue Unda", "somethingElse": "🤔 Inkemaina", "menProductQ": "Men product type choose cheyandi:", "womenProductQ": "Women product type choose cheyandi:", "menBrief": "🩲 Men Brief", "trunkBoxer": "🩳 Trunk / Boxer", "menSizeHelp": "📏 Men Size Help", "braPadded": "👙 Bra / Padded Bra", "feedingBra": "🤱 Feeding / Nursing Bra", "sportsBra": "🏋️ Sports Bra", "panty": "🩲 Panty", "combo": "🎁 Bra & Panty Combo", "otherHelpQ": "Other help options:", "orderTracking": "🚚 Order Tracking", "sizeFitting": "📏 Size Fitting", "knowMore": "✨ Inka Telusukondi", "faqContact": "❓ FAQ & Contact", "typeQuery": "✍️ Query Type Cheyandi", "selectedProduct": "Meeru select chesindi", "waistQ": "Waist size inches lo select cheyandi:", "topSizeQ": "Sports Bra kosam mee usual top size select cheyandi:", "recommended": "Recommended size", "nextOptions": "Ippudu nenu Hivra Soft products open cheyadaniki, size guidance ivvadaniki, leda support connect cheyadaniki help chestanu.", "issueQ": "Parledu. Mee issue select cheyandi:", "sizeIssue": "📏 Size Issue", "replaceExchange": "🔄 Replace / Exchange Product", "trackMyOrder": "🚚 Track My Order", "wrongDamaged": "📦 Wrong / Damaged Product", "paymentCod": "💳 Payment / COD Issue", "talkSupport": "💬 Support tho matladandi", "sizeIssueText1": "Size issue kosam correct size check chesi replacement/exchange guide chestanu.", "sizeIssueText2": "Ee details ready pettukondi:<br>• Order ID<br>• Product name<br>• Current size received<br>• Size required<br>• Registered mobile number", "replacementText1": "Replacement/exchange kosam Hivra Soft support order check chesi next step cheptaru.", "replacementText2": "Please share cheyandi:<br>• Order ID<br>• Product name<br>• Reason for replacement<br>• Photo/video if required<br>• Registered mobile number", "damagedText1": "Wrong/damaged product kosam tags/packaging remove cheyakandi; clear photos/videos share cheyandi.", "damagedText2": "Please share cheyandi:<br>• Order ID<br>• Product received<br>• Product ordered<br>• Photos/video<br>• Registered mobile number", "paymentText1": "Payment/COD issue kosam Hivra Soft support verify chesi guide chestaru.", "paymentText2": "Please share cheyandi:<br>• Order ID<br>• Payment mode<br>• Payment screenshot if deducted<br>• Registered mobile number", "supportText": "Hivra Soft support contact options:", "sendSizeWhatsapp": "💬 Size Issue WhatsApp", "requestWhatsapp": "💬 WhatsApp Request", "reportWhatsapp": "💬 WhatsApp Report", "sendPaymentWhatsapp": "💬 Payment Issue WhatsApp", "whatsappSupport": "💬 WhatsApp Support", "callSupport": "📞 Call Support", "emailSupport": "📧 Email Support", "emailReplacement": "📧 Replacement Email", "emailIssue": "📧 Issue Email", "emailPayment": "📧 Payment Email", "visitWebsite": "🌐 Website Visit", "openProductPage": "🌐 Open Product Page", "askWhatsapp": "💬 WhatsApp lo Adagandi", "needReplacement": "🔄 Replacement Kavali", "backToProducts": "⬅️ Products ki Back", "openedProduct": "Product page new tab lo open ayyindi. Ikkada nundi continue cheyandi:", "openedWhatsapp": "WhatsApp open ayyindi. Ikkada nundi continue cheyandi:", "openedEmail": "Email option open ayyindi. Ikkada nundi continue cheyandi:", "openedCall": "Call option open ayyindi. Ikkada nundi continue cheyandi:", "openedWebsite": "Website open ayyindi. Ikkada nundi continue cheyandi:", "trackRedirect": "Hivra Soft tracking page open avuthondi...", "onlyAfterGender": "Size fitting kosam mundu Men leda Women select cheyandi."}),
            Tamil: Object.assign({}, pack.English, {"mainIntro": "Product type allathu issue select seiyavum. Products choose seiya, size check seiya, orders track seiya, replacement/exchange guide seiya naan help seiven.", "mainMenuQ": "Oru option select seiyavum:", "men": "👕 Aangal", "women": "🩲 Pengal", "haveIssue": "🛠️ Issue Ullatha", "somethingElse": "🤔 Veru Yedhavathu", "menProductQ": "Men product type choose seiyavum:", "womenProductQ": "Women product type choose seiyavum:", "menBrief": "🩲 Men Brief", "trunkBoxer": "🩳 Trunk / Boxer", "menSizeHelp": "📏 Men Size Help", "braPadded": "👙 Bra / Padded Bra", "feedingBra": "🤱 Feeding / Nursing Bra", "sportsBra": "🏋️ Sports Bra", "panty": "🩲 Panty", "combo": "🎁 Bra & Panty Combo", "otherHelpQ": "Other help options:", "orderTracking": "🚚 Order Tracking", "sizeFitting": "📏 Size Fitting", "knowMore": "✨ Melum Ariya", "faqContact": "❓ FAQ & Contact", "typeQuery": "✍️ Query Type Seiyavum", "selectedProduct": "Neengal select seithathu", "waistQ": "Waist size inches-il select seiyavum:", "topSizeQ": "Sports Bra-kku ungal usual top size select seiyavum:", "recommended": "Recommended size", "nextOptions": "Ippoluthu Hivra Soft products open seiya, size guidance kodukka, allathu support connect seiya naan help seiven.", "issueQ": "Parava illai. Ungal issue select seiyavum:", "sizeIssue": "📏 Size Issue", "replaceExchange": "🔄 Replace / Exchange Product", "trackMyOrder": "🚚 Track My Order", "wrongDamaged": "📦 Wrong / Damaged Product", "paymentCod": "💳 Payment / COD Issue", "talkSupport": "💬 Support-udan Pesavum", "sizeIssueText1": "Size issue-kku correct size check seithu replacement/exchange guide seiven.", "sizeIssueText2": "Indha details ready vaithukkollavum:<br>• Order ID<br>• Product name<br>• Current size received<br>• Size required<br>• Registered mobile number", "replacementText1": "Replacement/exchange-kku Hivra Soft support order check seithu next step solvargal.", "replacementText2": "Please share seiyavum:<br>• Order ID<br>• Product name<br>• Reason for replacement<br>• Photo/video if required<br>• Registered mobile number", "damagedText1": "Wrong/damaged product-kku tags/packaging remove seiyamal clear photos/videos share seiyavum.", "damagedText2": "Please share seiyavum:<br>• Order ID<br>• Product received<br>• Product ordered<br>• Photos/video<br>• Registered mobile number", "paymentText1": "Payment/COD issue-kku Hivra Soft support verify seithu guide seivargal.", "paymentText2": "Please share seiyavum:<br>• Order ID<br>• Payment mode<br>• Payment screenshot if deducted<br>• Registered mobile number", "supportText": "Hivra Soft support contact options:", "sendSizeWhatsapp": "💬 Size Issue WhatsApp", "requestWhatsapp": "💬 WhatsApp Request", "reportWhatsapp": "💬 WhatsApp Report", "sendPaymentWhatsapp": "💬 Payment Issue WhatsApp", "whatsappSupport": "💬 WhatsApp Support", "callSupport": "📞 Call Support", "emailSupport": "📧 Email Support", "emailReplacement": "📧 Replacement Email", "emailIssue": "📧 Issue Email", "emailPayment": "📧 Payment Email", "visitWebsite": "🌐 Website Visit", "openProductPage": "🌐 Open Product Page", "askWhatsapp": "💬 WhatsApp-il Kelungal", "needReplacement": "🔄 Replacement Vendum", "backToProducts": "⬅️ Products-ku Back", "openedProduct": "Product page new tab-il open aagiyathu. Inge irundhu continue seiyavum:", "openedWhatsapp": "WhatsApp open aagiyathu. Inge irundhu continue seiyavum:", "openedEmail": "Email option open aagiyathu. Inge irundhu continue seiyavum:", "openedCall": "Call option open aagiyathu. Inge irundhu continue seiyavum:", "openedWebsite": "Website open aagiyathu. Inge irundhu continue seiyavum:", "trackRedirect": "Hivra Soft tracking page open aagugirathu...", "onlyAfterGender": "Size fitting-kku mudhalil Men allathu Women select seiyavum."}),
            Punjabi: Object.assign({}, pack.English, {"mainIntro": "Product type ya issue select karo. Main product choose karan, size check karan, order track karan te replacement/exchange guide karan vich madad kar sakda haan.", "mainMenuQ": "Ik option select karo:", "men": "👕 Munde", "women": "🩲 Kudiya", "haveIssue": "🛠️ Issue Hai", "somethingElse": "🤔 Kuch Hor", "menProductQ": "Men product type choose karo:", "womenProductQ": "Women product type choose karo:", "menBrief": "🩲 Men Brief", "trunkBoxer": "🩳 Trunk / Boxer", "menSizeHelp": "📏 Men Size Help", "braPadded": "👙 Bra / Padded Bra", "feedingBra": "🤱 Feeding / Nursing Bra", "sportsBra": "🏋️ Sports Bra", "panty": "🩲 Panty", "combo": "🎁 Bra & Panty Combo", "otherHelpQ": "Other help options:", "orderTracking": "🚚 Order Tracking", "sizeFitting": "📏 Size Fitting", "knowMore": "✨ Hor Jano", "faqContact": "❓ FAQ & Contact", "typeQuery": "✍️ Query Type Karo", "selectedProduct": "Tusi select kita", "waistQ": "Waist size inches vich select karo:", "topSizeQ": "Sports Bra layi apna usual top size select karo:", "recommended": "Recommended size", "nextOptions": "Hun main Hivra Soft products open karan, size guidance, ya support connect karan vich help kar sakda haan.", "issueQ": "Koi gall nahi. Apna issue select karo:", "sizeIssue": "📏 Size Issue", "replaceExchange": "🔄 Replace / Exchange Product", "trackMyOrder": "🚚 Track My Order", "wrongDamaged": "📦 Wrong / Damaged Product", "paymentCod": "💳 Payment / COD Issue", "talkSupport": "💬 Support naal Gall Karo", "sizeIssueText1": "Size issue layi main correct size check karke replacement/exchange guide kar sakda haan.", "sizeIssueText2": "Eh details ready rakho:<br>• Order ID<br>• Product name<br>• Current size received<br>• Size required<br>• Registered mobile number", "replacementText1": "Replacement/exchange layi Hivra Soft support order check karke next step dasega.", "replacementText2": "Please share karo:<br>• Order ID<br>• Product name<br>• Reason for replacement<br>• Photo/video if required<br>• Registered mobile number", "damagedText1": "Wrong/damaged product layi tags/packaging remove na karo te clear photos/videos share karo.", "damagedText2": "Please share karo:<br>• Order ID<br>• Product received<br>• Product ordered<br>• Photos/video<br>• Registered mobile number", "paymentText1": "Payment/COD issue layi Hivra Soft support verify karke guide karega.", "paymentText2": "Please share karo:<br>• Order ID<br>• Payment mode<br>• Payment screenshot if deducted<br>• Registered mobile number", "supportText": "Hivra Soft support contact options:", "sendSizeWhatsapp": "💬 Size Issue WhatsApp", "requestWhatsapp": "💬 WhatsApp Request", "reportWhatsapp": "💬 WhatsApp Report", "sendPaymentWhatsapp": "💬 Payment Issue WhatsApp", "whatsappSupport": "💬 WhatsApp Support", "callSupport": "📞 Call Support", "emailSupport": "📧 Email Support", "emailReplacement": "📧 Replacement Email", "emailIssue": "📧 Issue Email", "emailPayment": "📧 Payment Email", "visitWebsite": "🌐 Website Visit", "openProductPage": "🌐 Open Product Page", "askWhatsapp": "💬 WhatsApp Te Pucho", "needReplacement": "🔄 Replacement Chahidi", "backToProducts": "⬅️ Products Te Wapas", "openedProduct": "Product page new tab vich open ho gaya. Tusi ithon continue kar sakde ho:", "openedWhatsapp": "WhatsApp open ho gaya. Tusi ithon continue kar sakde ho:", "openedEmail": "Email option open ho gaya. Tusi ithon continue kar sakde ho:", "openedCall": "Call option open ho gaya. Tusi ithon continue kar sakde ho:", "openedWebsite": "Website open ho gayi. Tusi ithon continue kar sakde ho:", "trackRedirect": "Hivra Soft tracking page open ho reha hai...", "onlyAfterGender": "Size fitting layi pehle Men ya Women select karo."}),
            Marathi: Object.assign({}, pack.English, {"mainIntro": "Product type kiwa issue select kara. Mi products choose karne, size check karne, order track karne ani replacement/exchange guide karne yat madat karu shakto.", "mainMenuQ": "Ek option select kara:", "men": "👕 Purush", "women": "🩲 Mahila", "haveIssue": "🛠️ Issue Aahe", "somethingElse": "🤔 Itar Kahi", "menProductQ": "Men product type choose kara:", "womenProductQ": "Women product type choose kara:", "menBrief": "🩲 Men Brief", "trunkBoxer": "🩳 Trunk / Boxer", "menSizeHelp": "📏 Men Size Help", "braPadded": "👙 Bra / Padded Bra", "feedingBra": "🤱 Feeding / Nursing Bra", "sportsBra": "🏋️ Sports Bra", "panty": "🩲 Panty", "combo": "🎁 Bra & Panty Combo", "otherHelpQ": "Other help options:", "orderTracking": "🚚 Order Tracking", "sizeFitting": "📏 Size Fitting", "knowMore": "✨ Aani Mahiti", "faqContact": "❓ FAQ & Contact", "typeQuery": "✍️ Query Type Kara", "selectedProduct": "Tumhi select kele", "waistQ": "Waist size inches madhye select kara:", "topSizeQ": "Sports Bra sathi tumcha usual top size select kara:", "recommended": "Recommended size", "nextOptions": "Ata mi Hivra Soft products open karne, size guidance, kiwa support connect karne yat help karu shakto.", "issueQ": "Kahi problem nahi. Tumcha issue select kara:", "sizeIssue": "📏 Size Issue", "replaceExchange": "🔄 Replace / Exchange Product", "trackMyOrder": "🚚 Track My Order", "wrongDamaged": "📦 Wrong / Damaged Product", "paymentCod": "💳 Payment / COD Issue", "talkSupport": "💬 Support shi Bola", "sizeIssueText1": "Size issue sathi mi correct size check karun replacement/exchange guide karu shakto.", "sizeIssueText2": "He details ready theva:<br>• Order ID<br>• Product name<br>• Current size received<br>• Size required<br>• Registered mobile number", "replacementText1": "Replacement/exchange sathi Hivra Soft support order check karun next step sangel.", "replacementText2": "Please share kara:<br>• Order ID<br>• Product name<br>• Reason for replacement<br>• Photo/video if required<br>• Registered mobile number", "damagedText1": "Wrong/damaged product sathi tags/packaging remove karu naka ani clear photos/videos share kara.", "damagedText2": "Please share kara:<br>• Order ID<br>• Product received<br>• Product ordered<br>• Photos/video<br>• Registered mobile number", "paymentText1": "Payment/COD issue sathi Hivra Soft support verify karun guide karel.", "paymentText2": "Please share kara:<br>• Order ID<br>• Payment mode<br>• Payment screenshot if deducted<br>• Registered mobile number", "supportText": "Hivra Soft support contact options:", "sendSizeWhatsapp": "💬 Size Issue WhatsApp", "requestWhatsapp": "💬 WhatsApp Request", "reportWhatsapp": "💬 WhatsApp Report", "sendPaymentWhatsapp": "💬 Payment Issue WhatsApp", "whatsappSupport": "💬 WhatsApp Support", "callSupport": "📞 Call Support", "emailSupport": "📧 Email Support", "emailReplacement": "📧 Replacement Email", "emailIssue": "📧 Issue Email", "emailPayment": "📧 Payment Email", "visitWebsite": "🌐 Website Visit", "openProductPage": "🌐 Open Product Page", "askWhatsapp": "💬 WhatsApp Var Vichara", "needReplacement": "🔄 Replacement Hava", "backToProducts": "⬅️ Products kade Parat", "openedProduct": "Product page new tab madhye open zala. Tumhi ithun continue karu shakta:", "openedWhatsapp": "WhatsApp open zala. Tumhi ithun continue karu shakta:", "openedEmail": "Email option open zala. Tumhi ithun continue karu shakta:", "openedCall": "Call option open zala. Tumhi ithun continue karu shakta:", "openedWebsite": "Website open zali. Tumhi ithun continue karu shakta:", "trackRedirect": "Hivra Soft tracking page open hot aahe...", "onlyAfterGender": "Size fitting sathi pehle Men kiwa Women select kara."}),
            Gujrati: Object.assign({}, pack.English, {"mainIntro": "Product type athva issue select karo. Hu products choose karva, size check karva, order track karva ane replacement/exchange guide karva help kari shaku chu.", "mainMenuQ": "Ek option select karo:", "men": "👕 Purush", "women": "🩲 Mahila", "haveIssue": "🛠️ Issue Che", "somethingElse": "🤔 Biju Kai", "menProductQ": "Men product type choose karo:", "womenProductQ": "Women product type choose karo:", "menBrief": "🩲 Men Brief", "trunkBoxer": "🩳 Trunk / Boxer", "menSizeHelp": "📏 Men Size Help", "braPadded": "👙 Bra / Padded Bra", "feedingBra": "🤱 Feeding / Nursing Bra", "sportsBra": "🏋️ Sports Bra", "panty": "🩲 Panty", "combo": "🎁 Bra & Panty Combo", "otherHelpQ": "Other help options:", "orderTracking": "🚚 Order Tracking", "sizeFitting": "📏 Size Fitting", "knowMore": "✨ Vadu Jano", "faqContact": "❓ FAQ & Contact", "typeQuery": "✍️ Query Type Karo", "selectedProduct": "Tame select karyu", "waistQ": "Waist size inches ma select karo:", "topSizeQ": "Sports Bra mate tamaru usual top size select karo:", "recommended": "Recommended size", "nextOptions": "Have hu Hivra Soft products open karva, size guidance, athva support connect karva help kari shaku chu.", "issueQ": "Koi vaat nahi. Tamaru issue select karo:", "sizeIssue": "📏 Size Issue", "replaceExchange": "🔄 Replace / Exchange Product", "trackMyOrder": "🚚 Track My Order", "wrongDamaged": "📦 Wrong / Damaged Product", "paymentCod": "💳 Payment / COD Issue", "talkSupport": "💬 Support Sathe Bolo", "sizeIssueText1": "Size issue mate hu correct size check kari replacement/exchange guide kari shaku chu.", "sizeIssueText2": "Aa details ready rakho:<br>• Order ID<br>• Product name<br>• Current size received<br>• Size required<br>• Registered mobile number", "replacementText1": "Replacement/exchange mate Hivra Soft support order check kari next step janavshe.", "replacementText2": "Please share karo:<br>• Order ID<br>• Product name<br>• Reason for replacement<br>• Photo/video if required<br>• Registered mobile number", "damagedText1": "Wrong/damaged product mate tags/packaging remove na karo ane clear photos/videos share karo.", "damagedText2": "Please share karo:<br>• Order ID<br>• Product received<br>• Product ordered<br>• Photos/video<br>• Registered mobile number", "paymentText1": "Payment/COD issue mate Hivra Soft support verify kari guide karshe.", "paymentText2": "Please share karo:<br>• Order ID<br>• Payment mode<br>• Payment screenshot if deducted<br>• Registered mobile number", "supportText": "Hivra Soft support contact options:", "sendSizeWhatsapp": "💬 Size Issue WhatsApp", "requestWhatsapp": "💬 WhatsApp Request", "reportWhatsapp": "💬 WhatsApp Report", "sendPaymentWhatsapp": "💬 Payment Issue WhatsApp", "whatsappSupport": "💬 WhatsApp Support", "callSupport": "📞 Call Support", "emailSupport": "📧 Email Support", "emailReplacement": "📧 Replacement Email", "emailIssue": "📧 Issue Email", "emailPayment": "📧 Payment Email", "visitWebsite": "🌐 Website Visit", "openProductPage": "🌐 Open Product Page", "askWhatsapp": "💬 WhatsApp par Pucho", "needReplacement": "🔄 Replacement Joie", "backToProducts": "⬅️ Products par Pachha", "openedProduct": "Product page new tab ma open thayu. Tame ahiya thi continue kari shako cho:", "openedWhatsapp": "WhatsApp open thayu. Tame ahiya thi continue kari shako cho:", "openedEmail": "Email option open thayu. Tame ahiya thi continue kari shako cho:", "openedCall": "Call option open thayu. Tame ahiya thi continue kari shako cho:", "openedWebsite": "Website open thayu. Tame ahiya thi continue kari shako cho:", "trackRedirect": "Hivra Soft tracking page open thai rahyu che...", "onlyAfterGender": "Size fitting mate pehla Men athva Women select karo."}),
            Bengali: Object.assign({}, pack.English, {"mainIntro": "Product type ba issue select korun. Ami product choose, size check, order track, replacement/exchange guide korte help korte pari.", "mainMenuQ": "Ekta option select korun:", "men": "👕 Purush", "women": "🩲 Mohila", "haveIssue": "🛠️ Issue Ache", "somethingElse": "🤔 Onno Kichu", "menProductQ": "Men product type choose korun:", "womenProductQ": "Women product type choose korun:", "menBrief": "🩲 Men Brief", "trunkBoxer": "🩳 Trunk / Boxer", "menSizeHelp": "📏 Men Size Help", "braPadded": "👙 Bra / Padded Bra", "feedingBra": "🤱 Feeding / Nursing Bra", "sportsBra": "🏋️ Sports Bra", "panty": "🩲 Panty", "combo": "🎁 Bra & Panty Combo", "otherHelpQ": "Other help options:", "orderTracking": "🚚 Order Tracking", "sizeFitting": "📏 Size Fitting", "knowMore": "✨ Aro Janun", "faqContact": "❓ FAQ & Contact", "typeQuery": "✍️ Query Type Korun", "selectedProduct": "Apni select korechen", "waistQ": "Waist size inches-e select korun:", "topSizeQ": "Sports Bra-r jonno apnar usual top size select korun:", "recommended": "Recommended size", "nextOptions": "Ekhon ami Hivra Soft products open, size guidance, ba support connect korte help korte pari.", "issueQ": "Kono problem nei. Apnar issue select korun:", "sizeIssue": "📏 Size Issue", "replaceExchange": "🔄 Replace / Exchange Product", "trackMyOrder": "🚚 Track My Order", "wrongDamaged": "📦 Wrong / Damaged Product", "paymentCod": "💳 Payment / COD Issue", "talkSupport": "💬 Support-er Sathe Kotha Bolun", "sizeIssueText1": "Size issue-r jonno ami correct size check kore replacement/exchange guide korte pari.", "sizeIssueText2": "Ei details ready rakhun:<br>• Order ID<br>• Product name<br>• Current size received<br>• Size required<br>• Registered mobile number", "replacementText1": "Replacement/exchange-r jonno Hivra Soft support order check kore next step bolbe.", "replacementText2": "Please share korun:<br>• Order ID<br>• Product name<br>• Reason for replacement<br>• Photo/video if required<br>• Registered mobile number", "damagedText1": "Wrong/damaged product-r jonno tags/packaging remove korben na, clear photos/videos share korun.", "damagedText2": "Please share korun:<br>• Order ID<br>• Product received<br>• Product ordered<br>• Photos/video<br>• Registered mobile number", "paymentText1": "Payment/COD issue-r jonno Hivra Soft support verify kore guide korbe.", "paymentText2": "Please share korun:<br>• Order ID<br>• Payment mode<br>• Payment screenshot if deducted<br>• Registered mobile number", "supportText": "Hivra Soft support contact options:", "sendSizeWhatsapp": "💬 Size Issue WhatsApp", "requestWhatsapp": "💬 WhatsApp Request", "reportWhatsapp": "💬 WhatsApp Report", "sendPaymentWhatsapp": "💬 Payment Issue WhatsApp", "whatsappSupport": "💬 WhatsApp Support", "callSupport": "📞 Call Support", "emailSupport": "📧 Email Support", "emailReplacement": "📧 Replacement Email", "emailIssue": "📧 Issue Email", "emailPayment": "📧 Payment Email", "visitWebsite": "🌐 Website Visit", "openProductPage": "🌐 Open Product Page", "askWhatsapp": "💬 WhatsApp-e Jiggesh Korun", "needReplacement": "🔄 Replacement Lagbe", "backToProducts": "⬅️ Products-e Back", "openedProduct": "Product page new tab-e open hoyeche. Ekhon ekhane theke continue korun:", "openedWhatsapp": "WhatsApp open hoyeche. Ekhon ekhane theke continue korun:", "openedEmail": "Email option open hoyeche. Ekhon ekhane theke continue korun:", "openedCall": "Call option open hoyeche. Ekhon ekhane theke continue korun:", "openedWebsite": "Website open hoyeche. Ekhon ekhane theke continue korun:", "trackRedirect": "Hivra Soft tracking page open hocche...", "onlyAfterGender": "Size fitting-r jonno prothome Men ba Women select korun."}),
            Kannada: Object.assign({}, pack.English, {"mainIntro": "Product type athava issue select madi. Naanu products choose madalu, size check madalu, order track madalu, replacement/exchange guide madalu help maduthene.", "mainMenuQ": "Ondu option select madi:", "men": "👕 Purusharu", "women": "🩲 Mahileyaru", "haveIssue": "🛠️ Issue Ide", "somethingElse": "🤔 Bere Enadaru", "menProductQ": "Men product type choose madi:", "womenProductQ": "Women product type choose madi:", "menBrief": "🩲 Men Brief", "trunkBoxer": "🩳 Trunk / Boxer", "menSizeHelp": "📏 Men Size Help", "braPadded": "👙 Bra / Padded Bra", "feedingBra": "🤱 Feeding / Nursing Bra", "sportsBra": "🏋️ Sports Bra", "panty": "🩲 Panty", "combo": "🎁 Bra & Panty Combo", "otherHelpQ": "Other help options:", "orderTracking": "🚚 Order Tracking", "sizeFitting": "📏 Size Fitting", "knowMore": "✨ Innu Tiliyiri", "faqContact": "❓ FAQ & Contact", "typeQuery": "✍️ Query Type Madi", "selectedProduct": "Neevu select madiddu", "waistQ": "Waist size inches nalli select madi:", "topSizeQ": "Sports Bra ge nimma usual top size select madi:", "recommended": "Recommended size", "nextOptions": "Iga naanu Hivra Soft products open madalu, size guidance, athava support connect madalu help maduthene.", "issueQ": "Problem illa. Nimma issue select madi:", "sizeIssue": "📏 Size Issue", "replaceExchange": "🔄 Replace / Exchange Product", "trackMyOrder": "🚚 Track My Order", "wrongDamaged": "📦 Wrong / Damaged Product", "paymentCod": "💳 Payment / COD Issue", "talkSupport": "💬 Support Jothe Mathadi", "sizeIssueText1": "Size issue ge correct size check madi replacement/exchange guide maduthene.", "sizeIssueText2": "Ee details ready idi:<br>• Order ID<br>• Product name<br>• Current size received<br>• Size required<br>• Registered mobile number", "replacementText1": "Replacement/exchange ge Hivra Soft support order check madi next step helthare.", "replacementText2": "Please share madi:<br>• Order ID<br>• Product name<br>• Reason for replacement<br>• Photo/video if required<br>• Registered mobile number", "damagedText1": "Wrong/damaged product ge tags/packaging remove madabedi mattu clear photos/videos share madi.", "damagedText2": "Please share madi:<br>• Order ID<br>• Product received<br>• Product ordered<br>• Photos/video<br>• Registered mobile number", "paymentText1": "Payment/COD issue ge Hivra Soft support verify madi guide madthare.", "paymentText2": "Please share madi:<br>• Order ID<br>• Payment mode<br>• Payment screenshot if deducted<br>• Registered mobile number", "supportText": "Hivra Soft support contact options:", "sendSizeWhatsapp": "💬 Size Issue WhatsApp", "requestWhatsapp": "💬 WhatsApp Request", "reportWhatsapp": "💬 WhatsApp Report", "sendPaymentWhatsapp": "💬 Payment Issue WhatsApp", "whatsappSupport": "💬 WhatsApp Support", "callSupport": "📞 Call Support", "emailSupport": "📧 Email Support", "emailReplacement": "📧 Replacement Email", "emailIssue": "📧 Issue Email", "emailPayment": "📧 Payment Email", "visitWebsite": "🌐 Website Visit", "openProductPage": "🌐 Open Product Page", "askWhatsapp": "💬 WhatsApp nalli Keli", "needReplacement": "🔄 Replacement Beku", "backToProducts": "⬅️ Products ge Back", "openedProduct": "Product page new tab nalli open agide. Illinda continue madi:", "openedWhatsapp": "WhatsApp open agide. Illinda continue madi:", "openedEmail": "Email option open agide. Illinda continue madi:", "openedCall": "Call option open agide. Illinda continue madi:", "openedWebsite": "Website open agide. Illinda continue madi:", "trackRedirect": "Hivra Soft tracking page open aguttide...", "onlyAfterGender": "Size fitting ge modalu Men athava Women select madi."})
        });
        // Product-flow text added for the latest Hivra Soft catalogue.
        // This overrides only the new flow labels and keeps all existing language/FAQ/KB content untouched.
        const latestProductText = {
            English: {
                menProductQ: "Please choose men's product type:",
                womenProductQ: "Please choose women's product category:",
                menTrunk: "🩳 Trunk",
                menBrief: "🩲 Brief",
                menThongs: "🔻 Thongs",
                menGString: "〰️ G-string",
                menSizeHelp: "📏 Men Size Help",
                braMain: "👙 Bra",
                pantyMain: "🩲 Panty",
                lingerieMain: "✨ Lingerie",
                bodyShapeMain: "🧍 Shop by Body Shape",
                braCategoryQ: "Please choose bra type:",
                braSports: "🏋️ Sports Bra",
                braMaternity: "🤱 Maternity Bra",
                braTshirt: "👚 T-shirt Bra",
                braPaddedOnly: "👙 Padded Bra",
                braNonPadded: "🌿 Non-Padded Bra",
                pantyCategoryQ: "Please choose panty type:",
                pantySeamless: "✨ Seamless Panty",
                pantyHipster: "🩲 Hipster Panty",
                pantyThongs: "🔻 Thongs",
                pantyGString: "〰️ G-string",
                sizePickQ: "Please select your size:",
                braGuideTitle: "Before selecting size, please measure correctly:",
                braGuideText: "• Wear a non-padded bra while measuring.<br>• Measure underbust tightly just below the bust.<br>• Measure full bust on the fullest part, keeping tape straight.<br>• Do not hold the tape too loose or too tight.<br>• If you are between two sizes, choose the bigger band for comfort.",
                underbustQ: "<b>Step 1:</b> Select your underbust measurement in inches:",
                bustQ: "<b>Step 2:</b> Select your full bust measurement in inches:",
                menSizeResult: "For <b>{product}</b>, if your waist is <b>{waist} inches</b>, the best recommended size is <b>{size}</b>.",
                pantySizeResult: "For <b>{product}</b>, if your waist is <b>{waist} inches</b>, the best recommended size is <b>{size}</b>.",
                alphaSizeResult: "For <b>{product}</b>, selected size <b>{size}</b> should be suitable. Choose a snug-but-comfortable fit.",
                braSizeResult: "Your suggested size for <b>{product}</b> is <b>{size}</b>.",
                braFitTips: "Quick fit check:<br>• Band should sit straight and not ride up.<br>• Cups should not gap or spill.<br>• Straps should not dig into shoulders.<br>• Center part should sit comfortably on the body.",
                bodyShapeQ: "Choose your body shape for better product guidance:",
                bodyPear: "🍐 Pear Shape",
                bodyApple: "🍎 Apple Shape",
                bodyHourglass: "⏳ Hourglass",
                bodyRectangle: "▭ Rectangle",
                bodyCurvy: "🌸 Curvy / Plus",
                bodyShapeResult: "For <b>{shape}</b>, I recommend comfortable high-coverage styles, soft stretch fabric, and correct band/waist size. You can open matching Hivra Soft products or ask support for help.",
                nextOptions: "I can now help you open Hivra Soft products, request size guidance, replacement/exchange help, or connect support.",
                openProductPage: "🌐 Open Product Page",
                askWhatsapp: "💬 Ask on WhatsApp",
                needReplacement: "🔄 Need Replacement",
                backToProducts: "⬅️ Back to Products"
            },
            Hindi: {
                menProductQ: "Men's product type choose karein:",
                womenProductQ: "Women's product category choose karein:",
                menTrunk: "🩳 Trunk",
                menBrief: "🩲 Brief",
                menThongs: "🔻 Thongs",
                menGString: "〰️ G-string",
                menSizeHelp: "📏 Men Size Help",
                braMain: "👙 Bra",
                pantyMain: "🩲 Panty",
                lingerieMain: "✨ Lingerie",
                bodyShapeMain: "🧍 Body Shape ke hisaab se shop karein",
                braCategoryQ: "Bra type choose karein:",
                braSports: "🏋️ Sports Bra",
                braMaternity: "🤱 Maternity Bra",
                braTshirt: "👚 T-shirt Bra",
                braPaddedOnly: "👙 Padded Bra",
                braNonPadded: "🌿 Non-Padded Bra",
                pantyCategoryQ: "Panty type choose karein:",
                pantySeamless: "✨ Seamless Panty",
                pantyHipster: "🩲 Hipster Panty",
                pantyThongs: "🔻 Thongs",
                pantyGString: "〰️ G-string",
                sizePickQ: "Apna size select karein:",
                braGuideTitle: "Size select karne se pehle bra measurement sahi tarike se lein:",
                braGuideText: "• Measurement ke time non-padded bra pehnein.<br>• Underbust ko bust ke just niche tight measure karein.<br>• Full bust ko sabse fuller part par straight tape se measure karein.<br>• Tape ko bahut loose ya bahut tight na rakhein.<br>• Agar aap do size ke beech hain, comfort ke liye bigger band choose karein.",
                underbustQ: "<b>Step 1:</b> Apna underbust measurement inches mein select karein:",
                bustQ: "<b>Step 2:</b> Apna full bust measurement inches mein select karein:",
                menSizeResult: "<b>{product}</b> ke liye agar aapka waist <b>{waist} inches</b> hai, to best recommended size <b>{size}</b> hai.",
                pantySizeResult: "<b>{product}</b> ke liye agar aapka waist <b>{waist} inches</b> hai, to best recommended size <b>{size}</b> hai.",
                alphaSizeResult: "<b>{product}</b> ke liye selected size <b>{size}</b> suitable rahega. Fit snug but comfortable hona chahiye.",
                braSizeResult: "<b>{product}</b> ke liye aapka suggested size <b>{size}</b> hai.",
                braFitTips: "Quick fit check:<br>• Band straight rahe, upar na chadhe.<br>• Cup mein gap ya spill na ho.<br>• Straps shoulder mein dig na karein.<br>• Center part body par comfortably sit kare.",
                bodyShapeQ: "Better product guidance ke liye body shape choose karein:",
                bodyPear: "🍐 Pear Shape",
                bodyApple: "🍎 Apple Shape",
                bodyHourglass: "⏳ Hourglass",
                bodyRectangle: "▭ Rectangle",
                bodyCurvy: "🌸 Curvy / Plus",
                bodyShapeResult: "<b>{shape}</b> ke liye high-coverage comfortable styles, soft stretch fabric aur correct band/waist size better rahega. Matching Hivra Soft products open kar sakte hain ya support se pooch sakte hain.",
                nextOptions: "Ab main Hivra Soft products open karne, size guidance, replacement/exchange help ya support connect karne mein help kar sakta hoon.",
                openProductPage: "🌐 Product Page Open Karein",
                askWhatsapp: "💬 WhatsApp Par Puchhein",
                needReplacement: "🔄 Replacement Chahiye",
                backToProducts: "⬅️ Products Par Wapas"
            }
        };
        Object.keys(pack).forEach((langKey) => {
            pack[langKey] = Object.assign({}, pack[langKey], latestProductText.English, latestProductText[langKey] || {});
        });
        const lang = this.userLanguage || 'English';
        return (pack[lang] && pack[lang][key]) || pack.English[key] || key;
    }

    updateBubble() {
        if (!this.bubble) return; 
        this.bubble.innerText = this.userName ? `Hi, ${this.userName}` : "Hi, Guest";
        this.bubble.classList.add('show-bubble');
        setTimeout(() => { this.bubble.classList.remove('show-bubble'); }, 6000);
    }

    injectCSS() {
        const style = document.createElement('style');
        style.innerHTML = `
            /* Desktop Sizing (Fix for "Small" and "Proper Buttons") */
    @media (min-width: 768px) {
                #chatbot-container {
                    width: 360px !important;
                    height: 580px !important;
                    bottom: 20px !important;
                    right: 20px !important;
                }
                #chatbot-container .chat-btn {
                    padding: 8px 12px !important;
                    font-size: 13px !important;
                    margin: 2px 0 !important;
                }
                .message {
                    font-size: 13px !important;
                }
                #user-input {
                    padding: 10px !important;
                    font-size: 13px !important;
                }
            }

            #chatbot-container .fade-in { animation: fadeIn 0.4s cubic-bezier(0.39, 0.575, 0.565, 1); }
            @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            
            #chatbot-container .typing-indicator { display: flex; gap: 4px; padding: 12px 15px !important; align-items: center; width: fit-content; background: #f1f1f1; border-radius: 15px; }
            #chatbot-container .dot { width: 6px; height: 6px; background: #888; border-radius: 50%; animation: typing 1.4s infinite ease-in-out both; }
            #chatbot-container .dot:nth-child(1) { animation-delay: -0.32s; }
            #chatbot-container .dot:nth-child(2) { animation-delay: -0.16s; }
            @keyframes typing { 0%, 80%, 100% { transform: scale(0); opacity: 0.5; } 40% { transform: scale(1); opacity: 1; } }
            
            #chatbot-container .chat-btn { transition: all 0.2s ease; transform: scale(1); cursor: pointer; }
            #chatbot-container .chat-btn:active { transform: scale(0.95); opacity: 0.8; }
        `;
        document.head.appendChild(style);
    }

    init() {
        this.injectCSS(); 

        if (this.launcher) {
            this.launcher.onclick = () => {
                const isOpen = this.container.style.display === 'flex';
                if (isOpen) {
                    this.container.style.display = 'none';
                } else {
                    let rect = (this.bubble && this.bubble.style.visibility !== 'hidden') ? this.bubble.getBoundingClientRect() : (this.lastBubbleRect || this.launcher.getBoundingClientRect());
                    this.lastBubbleRect = rect;
                    this.container.style.position = 'fixed';
                    this.container.style.display = 'flex';
                    
                    if(this.bubble) this.bubble.style.visibility = 'hidden';

                    if (this.messagesArea.innerHTML === "") { this.startOnboarding(); }
                    this.saveChatSession();
                }
            };
        }

        if (this.btnClose) {
            this.btnClose.addEventListener('click', (e) => {
                e.preventDefault(); e.stopPropagation();
                this.container.style.display = 'none';
                this.messagesArea.innerHTML = ""; 
                this.clearChatSession();
                this.enableChat();
                if(this.bubble) this.bubble.style.visibility = 'visible';
            });
        }

        if (this.btnReset) {
            this.btnReset.addEventListener('click', (e) => {
                e.preventDefault(); e.stopPropagation();
                this.messagesArea.innerHTML = "";
                this.clearChatSession();
                this.enableChat();
                this.startOnboarding(); 
            });
        }

        if (this.sendBtn) { this.sendBtn.addEventListener('click', (e) => { e.preventDefault(); this.handleInput(); }); }
        
        if (this.userInput) { 
            this.userInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') { e.preventDefault(); this.handleInput(); } }); 
            
        }

        window.addEventListener('beforeunload', () => this.saveChatSession());
    }

    scrollToBottom() { 
        if(this.messagesArea) {
            setTimeout(() => { this.messagesArea.scrollTop = this.messagesArea.scrollHeight; }, 50);
        }
    }

    async botReply(text, delay = 800) {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message bot typing-indicator fade-in';
        typingDiv.innerHTML = '<span class="dot"></span><span class="dot"></span><span class="dot"></span>';
        this.messagesArea.appendChild(typingDiv);
        this.scrollToBottom();

        await new Promise(resolve => setTimeout(resolve, delay));

        if(this.messagesArea.contains(typingDiv)) {
            this.messagesArea.removeChild(typingDiv);
        }
        
        const div = document.createElement('div');
        div.className = 'message bot fade-in'; 
        div.innerHTML = text;
        this.messagesArea.appendChild(div);
        this.scrollToBottom();
        this.saveChatSession();
    }

    addMessage(sender, text) {
        const div = document.createElement('div');
        div.className = `message ${sender} fade-in`; 
        div.textContent = text;
        this.messagesArea.appendChild(div);
        this.scrollToBottom();
        this.saveChatSession();
    }

    addButtons(options) {
        const group = document.createElement('div');
        group.className = 'fade-in'; 
        group.style.display = 'flex';
        group.style.flexDirection = 'column';
        group.style.gap = '8px';
        group.style.width = '100%';
        group.style.marginTop = '8px';

        options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'chat-btn';
            btn.innerText = opt.text;
            btn.onclick = (e) => {
                e.preventDefault();
                group.querySelectorAll('button').forEach(b => b.disabled = true);
                this.addMessage('user', opt.text);
                opt.action();
            };
            group.appendChild(btn);
        });
        this.messagesArea.appendChild(group);
        this.scrollToBottom();
    }

    addNavButtons(backAction) {
        const group = document.createElement('div');
        group.className = 'fade-in'; 
        group.style.display = 'flex';
        group.style.flexDirection = 'row';
        group.style.justifyContent = 'center'; 
        group.style.alignItems = 'flex-start';
        group.style.gap = '6px';
        group.style.width = '100%';
        group.style.marginTop = '12px';

        const options = [
            { text: this.t('bBack') || "⬅️ Back", action: backAction },
            { text: this.t('bHome') || "🏠 Main Menu", action: () => this.renderMainMenu() },
            { text: this.t('bLang') || "🌐 Language", action: () => this.changeLanguage() }
        ];

        options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'chat-btn';
            btn.style.flex = '1';
            btn.style.minWidth = '0';            
            btn.style.padding = '8px 4px'; 
            btn.style.fontSize = '12px';
            
            btn.style.display = 'flex';
            btn.style.flexDirection = 'column';
            btn.style.alignItems = 'center';
            btn.style.justifyContent = 'center';
            btn.style.overflow = 'hidden';

            let firstSpace = opt.text.indexOf(' ');
            let icon = opt.text.substring(0, firstSpace);
            let label = opt.text.substring(firstSpace + 1);

            if (firstSpace === -1) {
                btn.innerText = opt.text;
            } else {
                btn.innerHTML = `
                    <span style="font-size: 18px; margin-bottom: 4px; line-height: 1;">${icon}</span>
                    <span style="white-space: normal; text-align: center; line-height: 1.2;">${label}</span>
                `;
            }

            btn.onclick = (e) => {
                e.preventDefault();
                this.messagesArea.querySelectorAll('.chat-btn').forEach(b => b.disabled = true);
                this.addMessage('user', opt.text);
                opt.action();
            };
            group.appendChild(btn);
        });
        
        this.messagesArea.appendChild(group);
        this.scrollToBottom();
        this.saveChatSession();
    }

    addSizeGrid(sizes, callback) {
        const grid = document.createElement('div');
        grid.className = 'size-grid fade-in'; 
        sizes.forEach(s => {
            const item = document.createElement('div');
            item.className = 'size-item chat-btn'; 
            item.innerText = s + '"';
            item.onclick = () => {
                this.addMessage('user', s + ' inches');
                grid.style.pointerEvents = 'none';
                grid.style.opacity = '0.5';
                callback(s);
            };
            grid.appendChild(item);
        });
        this.messagesArea.appendChild(grid);
        this.scrollToBottom();
        this.saveChatSession();
    }

    async startOnboarding() {
        this.isTracking = false; this.isSomethingElse = false;
        await this.botReply("Select your preferred language / Apni bhasha chunein:");

        const languages = [
            { text: 'हिंदी (Hindi)', action: () => this.selectLanguage('Hindi') },
            { text: 'English', action: () => this.selectLanguage('English') },
            { text: 'বাংলা (Bengali)', action: () => this.selectLanguage('Bengali') },
            { text: 'ગુજરાતી (Gujarati)', action: () => this.selectLanguage('Gujrati') },
            { text: 'தமிழ் (Tamil)', action: () => this.selectLanguage('Tamil') },
            { text: 'తెలుగు (Telugu)', action: () => this.selectLanguage('Telgu') },
            { text: 'ಕನ್ನಡ (Kannada)', action: () => this.selectLanguage('Kannada') },
            { text: 'ਪੰਜਾਬੀ (Punjabi)', action: () => this.selectLanguage('Punjabi') },
            { text: 'मराठी (Marathi)', action: () => this.selectLanguage('Marathi') }
        ];
        this.addOnboardingGrid(languages);
    }

    async changeLanguage() {
        await this.botReply("Select your preferred language / Apni bhasha chunein:");
        const languages = [
            { text: 'हिंदी (Hindi)', action: () => this.updateLanguage('Hindi') },
            { text: 'English', action: () => this.updateLanguage('English') },
            { text: 'বাংলা (Bengali)', action: () => this.updateLanguage('Bengali') },
            { text: 'ગુજરાતી (Gujarati)', action: () => this.updateLanguage('Gujrati') },
            { text: 'தமிழ் (Tamil)', action: () => this.updateLanguage('Tamil') },
            { text: 'తెలుగు (Telugu)', action: () => this.updateLanguage('Telgu') },
            { text: 'ಕನ್ನಡ (Kannada)', action: () => this.updateLanguage('Kannada') },
            { text: 'ਪੰਜਾਬੀ (Punjabi)', action: () => this.updateLanguage('Punjabi') },
            { text: 'मराठी (Marathi)', action: () => this.updateLanguage('Marathi') }
        ];
        this.addOnboardingGrid(languages);
    }

    async updateLanguage(lang) {
        this.userLanguage = lang;
        if(this.userInput) this.userInput.placeholder = this.t('placeholder');
        if(this.sendBtn) this.sendBtn.innerText = this.t('sendBtn');
        await this.botReply("Language updated! ✨", 400); 
        this.renderMainMenu(); 
    }

    async selectLanguage(lang) {
        this.userLanguage = lang;
        if(this.userInput) this.userInput.placeholder = this.t('placeholder');
        if(this.sendBtn) this.sendBtn.innerText = this.t('sendBtn');

        await this.botReply(this.t('greet'));
        setTimeout(async () => {
            await this.botReply(this.t('genderQ'));
            const genders = [
                { text: this.t('gM'), action: () => this.selectGender('M', this.t('gM')) }, 
                { text: this.t('gF'), action: () => this.selectGender('F', this.t('gF')) }
            ];
            this.addOnboardingGrid(genders);
        }, 300); 
    }

    async selectGender(code, text) {
        this.userGenderCode = code; 
        await this.botReply(this.t('ready'));
        setTimeout(() => {
            if (code === 'M') {
                this.renderHivraMenProducts();
            } else if (code === 'F') {
                this.renderHivraWomenProducts();
            } else {
                this.renderMainMenu();
            }
        }, 300);
    }

    addOnboardingGrid(options) {
        const grid = document.createElement('div');
        grid.className = 'size-grid fade-in'; 
        options.forEach(opt => {
            const item = document.createElement('div');
            item.className = 'size-item chat-btn';
            item.innerText = opt.text;
            item.onclick = (e) => {
                e.preventDefault();
                grid.style.pointerEvents = 'none'; grid.style.opacity = '0.5';
                this.addMessage('user', opt.text);
                opt.action();
            };
            grid.appendChild(item);
        });
        this.messagesArea.appendChild(grid);
        this.scrollToBottom();
        this.saveChatSession();
    }

    async renderMainMenu() {
        this.isTracking = false; 
        this.isSomethingElse = false;
        this.selectedProductType = '';
        this.selectedCatalogProduct = null;

        // Once the customer has selected Men/Women, do not ask it again.
        // Main Menu will take them back to the correct product menu.
        if (this.userGenderCode === 'M') {
            return this.renderHivraMenProducts(false);
        }
        if (this.userGenderCode === 'F') {
            return this.renderHivraWomenProducts(false);
        }

        let prefix = this.userName ? `Hello, <b>${this.escapeHtml(this.userName)}</b>! ` : "";
        await this.botReply(prefix + this.t('menuMsg'));
        await this.botReply(this.ht('mainIntro'));
        await this.botReply(this.ht('mainMenuQ'));

        this.addButtons([
            { text: this.ht('men'), action: () => this.renderHivraMenProducts() },
            { text: this.ht('women'), action: () => this.renderHivraWomenProducts() },
            { text: this.ht('haveIssue'), action: () => this.renderHivraIssueMenu() },
            { text: this.ht('somethingElse'), action: () => this.startSomethingElse() }
        ]);
    }


    async startTracking() {
        this.isTracking = false;
        const user = await this.refreshAuth();
        if (!user) {
            this.pendingAfterLogin = true;
            await this.botReply('🔒 Order status dekhne ke liye apne HivraSoft account se login karein.');
            this.addButtons([
                { text: '🔐 Login / Sign up (OTP)', action: () => this.openLogin() },
                { text: '🏠 Main Menu', action: () => this.renderMainMenu() }
            ]);
            return;
        }
        const orderOwner = this.authUserId;
        await this.botReply('📦 Aapke account se order status live load ho raha hai...');
        try {
            const orders = await this.fetchOrders();
            if (!orderOwner || this.authUserId !== orderOwner) return;
            if (orders.length) {
                await this.botReply('Apna order select karein ya poora order number type karein:');
                this.isTracking = true;
                this.addButtons(orders.slice(0, 5).map(order => ({
                    text: `${order.orderNumber || order._id} · ${String(order.status || 'pending').replace(/_/g,' ')}`,
                    action: () => this.processTracking(String(order._id))
                })));
            } else {
                await this.botReply('Is account par abhi koi order nahi mila.');
                this.addButtons([{ text: '🛍️ Shop Products', action: () => window.open('/', '_self') }]);
            }
        } catch (error) {
            if (error.status === 401) {
                await this.botReply('Session expired. Dobara login karein.');
                this.openLogin();
            } else {
                await this.botReply('⚠️ Abhi orders load nahi ho rahe. Backend connection check karein.');
            }
        }
        this.addNavButtons(() => this.renderMainMenu());
    }

    async processTracking(id) {
        this.isTracking = false;
        try {
            const orderOwner = this.authUserId;
            const orders = await this.fetchOrders();
            if (!orderOwner || this.authUserId !== orderOwner) return;
            const key = String(id || '').trim().toLowerCase();
            const order = orders.find(o =>
                String(o.orderNumber || '').trim().toLowerCase() === key ||
                String(o._id || '').trim().toLowerCase() === key
            );
            if (!order) {
                await this.botReply('❌ Is logged-in account mein ye order nahi mila. Full order number check karein.');
                this.addButtons([{ text: '🚚 My Orders', action: () => this.startTracking() }]);
            } else {
                await this.showOrderDetails(order);
            }
        } catch (error) {
            if (error.status === 401) {
                await this.botReply('🔒 Pehle login karein.');
                this.openLogin();
            } else {
                await this.botReply('⚠️ Order API unavailable. Thodi der baad retry karein.');
            }
        }
        this.addNavButtons(() => this.startTracking());
    }

    async showOrderDetails(order) {
        this.isTracking = false;
        const label = this.escapeHtml(order.orderNumber || order._id || '');
        const status = this.escapeHtml(String(order.status || 'Pending').replace(/_/g, ' '));
        const payment = this.escapeHtml(String(order.paymentStatus || 'Pending').replace(/_/g, ' '));
        const amount = Number(order.total ?? order.grandTotal ?? 0);
        const total = Number.isFinite(amount) ? `₹${amount.toLocaleString('en-IN')}` : 'Not available';
        const tracking = order.trackingNumber || order.tracking?.awb || order.shipment?.awb;
        const trackingText = tracking ? `<br>🚚 <b>Tracking:</b> ${this.escapeHtml(tracking)}` : '';
        await this.botReply(`📦 <b>Order:</b> ${label}<br>📊 <b>Status:</b> ${status}<br>💳 <b>Payment:</b> ${payment}<br>💰 <b>Total:</b> ${total}${trackingText}`);
        this.addButtons([
            { text: '📦 All my orders', action: () => window.location.assign('/account/orders') },
            { text: '🔎 Track another order', action: () => this.startTracking() }
        ]);
    }

    getKBAnswer(key) {
        const langData = this.i18n[this.userLanguage || 'English'];
        const item = langData.kb.find(i => i.keys.includes(key));
        return item ? item.ans : this.t('fallback');
    }

    async renderKnowMore() {
        await this.botReply(this.t('knowRes'));
        
        if (this.userGenderCode === 'M') {
            this.addButtons([
                { text: this.t('kmM1'), action: async () => { await this.botReply(this.getKBAnswer('_m1')); this.addNavButtons(() => this.renderKnowMore()); }},
                { text: this.t('kmM2'), action: async () => { await this.botReply(this.getKBAnswer('_m2')); this.addNavButtons(() => this.renderKnowMore()); }},
                { text: this.t('kmM3'), action: async () => { await this.botReply(this.getKBAnswer('_m3')); this.addNavButtons(() => this.renderKnowMore()); }},
                { text: this.t('kmM4'), action: async () => { await this.botReply(this.getKBAnswer('_m4')); this.addNavButtons(() => this.renderKnowMore()); }},
                { text: this.t('kmM5'), action: async () => { await this.botReply(this.getKBAnswer('_m5')); this.addNavButtons(() => this.renderKnowMore()); }}
            ]);
        } else if (this.userGenderCode === 'F') {
            this.addButtons([
                { text: this.t('kmF1'), action: async () => { await this.botReply(this.getKBAnswer('_f1')); this.addNavButtons(() => this.renderKnowMore()); }},
                { text: this.t('kmF2'), action: async () => { await this.botReply(this.getKBAnswer('_f2')); this.addNavButtons(() => this.renderKnowMore()); }},
                { text: this.t('kmF3'), action: async () => { await this.botReply(this.getKBAnswer('_f3')); this.addNavButtons(() => this.renderKnowMore()); }},
                { text: this.t('kmF4'), action: async () => { await this.botReply(this.getKBAnswer('_f4')); this.addNavButtons(() => this.renderKnowMore()); }},
                { text: this.t('kmF5'), action: async () => { await this.botReply(this.getKBAnswer('_f5')); this.addNavButtons(() => this.renderKnowMore()); }}
            ]);
        }
        
        this.addNavButtons(() => this.renderMainMenu());
    }

    async startSomethingElse() { 
        this.isSomethingElse = false; 
        await this.botReply(this.ht('otherHelpQ')); 

        // Keep general old help features here only, so product menus do not repeat the same buttons.
        let buttonList = [
            { text: this.ht('orderTracking'), action: () => this.openTrackOrderPage() },
            { text: this.ht('knowMore'), action: () => this.renderKnowMore() },
            { text: this.ht('faqContact'), action: () => this.renderFAQMenu() }
        ];

        // Gender-specific advice stays according to the already selected Men/Women section.
        let genderButtons = [];
        if (this.userGenderCode === 'M') {
            genderButtons = [
                { text: this.t('seM1'), action: async () => { await this.botReply(this.getKBAnswer('_sem1')); this.addNavButtons(() => this.startSomethingElse()); }},
                { text: this.t('seM2'), action: async () => { await this.botReply(this.getKBAnswer('_sem2')); this.addNavButtons(() => this.startSomethingElse()); }},
                { text: this.t('seM3'), action: async () => { await this.botReply(this.getKBAnswer('_sem3')); this.addNavButtons(() => this.startSomethingElse()); }},
                { text: this.t('seM4'), action: async () => { await this.botReply(this.getKBAnswer('_sem4')); this.addNavButtons(() => this.startSomethingElse()); }},
                { text: this.t('seM5'), action: async () => { await this.botReply(this.getKBAnswer('_sem5')); this.addNavButtons(() => this.startSomethingElse()); }},
                { text: this.t('seM6'), action: async () => { await this.botReply(this.getKBAnswer('_sem6')); this.addNavButtons(() => this.startSomethingElse()); }},
                { text: this.t('seM7'), action: async () => { await this.botReply(this.getKBAnswer('_sem7')); this.addNavButtons(() => this.startSomethingElse()); }}
            ];
        } else if (this.userGenderCode === 'F') {
            genderButtons = [
                { text: this.t('seF1'), action: () => this.renderStylePreference() },
                { text: this.t('seF2'), action: () => this.renderMaterialChoice() },
                { text: this.t('seF3'), action: async () => { await this.botReply(this.getKBAnswer('_sef3')); this.addNavButtons(() => this.startSomethingElse()); }},
                { text: this.t('seF4'), action: async () => { await this.botReply(this.getKBAnswer('_sef4')); this.addNavButtons(() => this.startSomethingElse()); }},
                { text: this.t('seF5'), action: async () => { await this.botReply(this.getKBAnswer('_sef5')); this.addNavButtons(() => this.startSomethingElse()); }},
                { text: this.t('seF6'), action: async () => { await this.botReply(this.getKBAnswer('_sef6')); this.addNavButtons(() => this.startSomethingElse()); }},
                { text: this.t('seF7'), action: async () => { await this.botReply(this.getKBAnswer('_sef7')); this.addNavButtons(() => this.startSomethingElse()); }},
                { text: this.t('seF8'), action: async () => { await this.botReply(this.getKBAnswer('_sef8')); this.addNavButtons(() => this.startSomethingElse()); }},
                { text: this.t('seF9'), action: async () => { await this.botReply(this.getKBAnswer('_sef9')); this.addNavButtons(() => this.startSomethingElse()); }}
            ];
        }

        buttonList = buttonList.concat(genderButtons);
        buttonList.push({ text: this.ht('typeQuery'), action: () => this.enableTypingElse() });

        this.addButtons(buttonList);
        this.addNavButtons(this.getProductBackAction());
    }


    async renderStylePreference() {
        await this.botReply(this.getKBAnswer('_sef1'));
        this.addButtons([
            { text: "💼 Office Bra", action: async () => { await this.botReply("We recommend seamless, wire-free T-shirt bras for all-day office comfort."); this.addNavButtons(() => this.startSomethingElse()); } },
            { text: "👚 Daily Wear", action: async () => { await this.botReply("Breathable cotton, non-padded bras are perfect for everyday use."); this.addNavButtons(() => this.startSomethingElse()); } },
            { text: "✨ Party Wear", action: async () => { await this.botReply("Plunge or strapless push-up bras are ideal for party outfits."); this.addNavButtons(() => this.startSomethingElse()); } },
            { text: "🏃‍♀️ Sports/Activewear", action: async () => { await this.botReply("High-impact, moisture-wicking sports bras offer the best support."); this.addNavButtons(() => this.startSomethingElse()); } },
            { text: "🛋️ Loungewear", action: async () => { await this.botReply("Soft bralettes or slip-on styles are best for relaxing at home."); this.addNavButtons(() => this.startSomethingElse()); } }
        ]);
    }

    async renderMaterialChoice() {
        await this.botReply(this.getKBAnswer('_sef2'));
        this.addButtons([
            { text: "☁️ Breathable Cotton", action: async () => { await this.botReply("Best for daily wear and sensitive skin to prevent sweat."); this.addNavButtons(() => this.startSomethingElse()); } },
            { text: "🌸 Elegant Lace", action: async () => { await this.botReply("Perfect for occasion wear, offering a delicate and stylish look."); this.addNavButtons(() => this.startSomethingElse()); } },
            { text: "✨ Smooth Microfiber", action: async () => { await this.botReply("Ideal for a seamless look under tight or sheer clothing."); this.addNavButtons(() => this.startSomethingElse()); } },
            { text: "🌿 Soft Modal", action: async () => { await this.botReply("Ultra-soft and breathable, great for lounging and sleep."); this.addNavButtons(() => this.startSomethingElse()); } },
            { text: "💎 Luxurious Satin", action: async () => { await this.botReply("Provides a smooth, premium feel for special occasions."); this.addNavButtons(() => this.startSomethingElse()); } }
        ]);
    }

    async enableTypingElse() {
        this.isSomethingElse = true;
        await this.botReply(this.t('typeReq') || "Please type your query below:");
    }

    async handleSomethingElseReply() {
        this.isSomethingElse = false;
        await this.botReply(this.t('callReqQ'));
        this.addButtons([
            { text: this.t('bCallReq'), action: () => {
                this.botReply(this.t('reqSent'));
                this.addNavButtons(() => this.renderMainMenu());
            }},
            { text: this.t('bEndChat'), action: () => this.endChat() }
        ]);
        this.addNavButtons(() => this.renderMainMenu());
    }

    async endChat() {
        await this.botReply(this.t('endRes'));
        this.userInput.disabled = true; this.sendBtn.disabled = true;
        this.saveChatSession();
    }

    enableChat() {
        if(this.userInput && this.sendBtn) {
            this.userInput.disabled = false; this.sendBtn.disabled = false;
            this.userInput.placeholder = this.t('placeholder'); 
        }
    }

    async renderSizeMenu() {
        if (this.userGenderCode === 'M') {
            return this.renderHivraMenProducts();
        } else if (this.userGenderCode === 'F') {
            return this.renderHivraWomenProducts();
        } else {
            await this.botReply(this.t('catQ'));
            this.addButtons([
                { text: this.ht('men'), action: () => this.renderHivraMenProducts() },
                { text: this.ht('women'), action: () => this.renderHivraWomenProducts() }
            ]);
            this.addNavButtons(() => this.renderMainMenu());
        }
    }

    formatHivraText(template, values = {}) {
        return String(template || '').replace(/\{(\w+)\}/g, (match, key) => {
            return values[key] !== undefined ? values[key] : match;
        });
    }

    getMenAlphaSizeFromWaist(waist) {
        waist = Number(waist);
        if (waist <= 30) return "S";
        if (waist <= 32) return "M";
        if (waist <= 34) return "L";
        if (waist <= 36) return "XL";
        return "XXL";
    }

    getWomenBottomSizeFromWaist(waist) {
        waist = Number(waist);
        if (waist <= 28) return "S";
        if (waist <= 30) return "M";
        if (waist <= 32) return "L";
        if (waist <= 34) return "XL";
        return "XXL";
    }

    async renderMenSize(productName = "") {
        if (productName) {
            this.selectedProductType = productName;
            await this.botReply(`${this.ht('selectedProduct')} <b>${productName}</b>.`);
        }

        await this.botReply(this.ht('waistQ'));
        this.addSizeGrid([28, 30, 32, 34, 36, 38, 40, 42], async (val) => {
            let res = this.getMenAlphaSizeFromWaist(val);
            let product = this.selectedProductType || productName || "Men Innerwear";
            await this.botReply(this.formatHivraText(this.ht('menSizeResult'), { product, waist: val, size: res }));
            await this.botReply(this.ht('nextOptions'));
            this.addHivraProductActionButtons(product, res);
        });
        this.addNavButtons(() => this.renderHivraMenProducts());
    }

    async renderWomenOptions() {
        return this.renderHivraWomenProducts();
    }

    async renderPantyGrid(productName = "Panty") {
        this.selectedProductType = productName;
        await this.botReply(this.ht('waistQ'));
        this.addSizeGrid([26, 28, 30, 32, 34, 36, 38, 40], async (val) => {
            let res = this.getWomenBottomSizeFromWaist(val);
            let product = this.selectedProductType || productName || "Panty";
            await this.botReply(this.formatHivraText(this.ht('pantySizeResult'), { product, waist: val, size: res }));
            await this.botReply(this.ht('nextOptions'));
            this.addHivraProductActionButtons(product, res);
        });
        this.addNavButtons(() => this.renderHivraPantyCategories());
    }

    async renderBraStep1(showGuide = true) {
        if (showGuide) {
            await this.botReply(`<b>${this.ht('braGuideTitle')}</b><br>${this.ht('braGuideText')}`);
        }
        await this.botReply(this.ht('underbustQ'));
        this.addSizeGrid([26, 28, 30, 32, 34, 36, 38, 40, 42], (val) => {
            this.braData.underbust = Number(val);
            this.renderBraStep2();
        });
        this.addNavButtons(() => this.renderHivraBraCategories());
    }

    async renderBraStep2() {
        await this.botReply(this.ht('bustQ'));
        const underbust = Number(this.braData.underbust || 30);
        let bustSizes = [];
        for (let i = 2; i <= 9; i++) {
            bustSizes.push(underbust + i);
        }
        this.addSizeGrid(bustSizes, (val) => {
            this.braData.bust = Number(val);
            this.calculateBraResult();
        });
        this.addNavButtons(() => this.renderBraStep1(false));
    }

    getBraBandFromUnderbust(underbust) {
        underbust = Number(underbust);
        // Hivra Soft / marketplace practical guide: underbust + 4 for even, +5 for odd, rounded to even band.
        let band = underbust + (underbust % 2 === 0 ? 4 : 5);
        if (band < 30) band = 30;
        if (band % 2 !== 0) band += 1;
        return band;
    }

    getBraCupFromMeasurements(underbust, bust) {
        const diff = Number(bust) - Number(underbust);
        if (diff <= 2) return "AA";
        if (diff === 3) return "A";
        if (diff === 4) return "B";
        if (diff === 5) return "C";
        if (diff === 6) return "D";
        if (diff === 7) return "DD/E";
        if (diff === 8) return "F";
        return "G+";
    }

    async calculateBraResult() {
        let underbust = Number(this.braData.underbust);
        let bust = Number(this.braData.bust);
        let band = this.getBraBandFromUnderbust(underbust);
        let cup = this.getBraCupFromMeasurements(underbust, bust);
        let finalSize = `${band}${cup}`;
        let product = this.selectedProductType || "Bra";

        await this.botReply(this.formatHivraText(this.ht('braSizeResult'), { product, size: finalSize }));
        await this.botReply(this.ht('braFitTips'));
        await this.botReply(this.ht('nextOptions'));
        this.addHivraProductActionButtons(product, finalSize);
    }

    // -------------------------------
    // Hivra Soft requested new flow
    // Added without deleting your old language, tracking, FAQ, know-more and size features.
    // -------------------------------

    async renderHivraMenProducts() {
        this.userGenderCode = 'M';
        this.selectedProductType = '';
        await this.botReply(this.ht('menProductQ'));
        this.addButtons([
            { text: this.ht('menTrunk'), action: () => this.renderHivraCategoryCatalog('Trunk', 'M') },
            { text: this.ht('menBrief'), action: () => this.renderHivraCategoryCatalog('Brief', 'M') },
            { text: this.ht('menThongs'), action: () => this.renderHivraCategoryCatalog('Thong', 'M') },
            { text: this.ht('menGString'), action: () => this.renderHivraCategoryCatalog('G-string', 'M') },
            { text: this.ht('menSizeHelp'), action: () => this.renderHivraCategoryCatalog('Men', 'M') },
            { text: this.ht('haveIssue'), action: () => this.renderHivraIssueMenu() },
            { text: this.ht('somethingElse'), action: () => this.startSomethingElse() }
        ]);
    }


    async renderHivraWomenProducts() {
        this.userGenderCode = 'F';
        this.selectedProductType = '';
        await this.botReply(this.ht('womenProductQ'));
        this.addButtons([
            { text: this.ht('braMain'), action: () => this.renderHivraBraCategories() },
            { text: this.ht('pantyMain'), action: () => this.renderHivraPantyCategories() },
            { text: this.ht('lingerieMain'), action: () => this.renderHivraCategoryCatalog('Lingerie', 'F') },
            { text: this.ht('bodyShapeMain'), action: () => this.renderHivraBodyShapeMenu() },
            { text: this.ht('haveIssue'), action: () => this.renderHivraIssueMenu() },
            { text: this.ht('somethingElse'), action: () => this.startSomethingElse() }
        ]);
    }


    async renderHivraBraCategories() {
        this.userGenderCode = 'F';
        await this.botReply(this.ht('braCategoryQ'));
        this.addButtons([
            { text: this.ht('braSports'), action: () => this.renderHivraCategoryCatalog('Sports Bra', 'F') },
            { text: this.ht('braMaternity'), action: () => this.renderHivraCategoryCatalog('Maternity Bra', 'F') },
            { text: this.ht('braTshirt'), action: () => this.renderHivraCategoryCatalog('T-shirt Bra', 'F') },
            { text: this.ht('braPaddedOnly'), action: () => this.renderHivraCategoryCatalog('Padded Bra', 'F') },
            { text: this.ht('braNonPadded'), action: () => this.renderHivraCategoryCatalog('Non-Padded Bra', 'F') }
        ]);
        this.addNavButtons(() => this.renderHivraWomenProducts());
    }


    async renderHivraPantyCategories() {
        this.userGenderCode = 'F';
        await this.botReply(this.ht('pantyCategoryQ'));
        this.addButtons([
            { text: this.ht('pantySeamless'), action: () => this.renderHivraCategoryCatalog('Seamless Panty', 'F') },
            { text: this.ht('pantyHipster'), action: () => this.renderHivraCategoryCatalog('Hipster Panty', 'F') },
            { text: this.ht('pantyThongs'), action: () => this.renderHivraCategoryCatalog('Thong', 'F') },
            { text: this.ht('pantyGString'), action: () => this.renderHivraCategoryCatalog('G-string', 'F') }
        ]);
        this.addNavButtons(() => this.renderHivraWomenProducts());
    }


    // Show LIVE products before asking for a size (both Men and Women).
    // The search API already supplies sizes[] with active/stock information.
    chatbotProductFlowText(key) {
        const isHindi = this.userLanguage === 'Hindi';
        const labels = {
            selectProduct: isHindi ? '🛍️ Product Select Karein' : '🛍️ Select Product',
            selectPrompt: isHindi ? 'Pehle niche se product select karein. Size uske baad dikhega:' : 'First select a product below. Sizes will appear after selection:',
            sizePrompt: isHindi ? 'Is product ke API mein available sizes:' : 'Sizes available for this product:',
            noProducts: isHindi ? 'Is category mein abhi koi product nahi mila. Size choose karne se pehle product select hona zaroori hai.' : 'No products found in this category. Select a product before choosing a size.',
            apiError: isHindi ? 'Product API abhi available nahi hai. Phir se try karein ya store kholen.' : 'Product API is not available right now. Please retry or browse the store.',
            noSizes: isHindi ? 'Is product ke available sizes API mein nahi mile. Website par details check karein.' : 'No available sizes were returned for this product. Please check its product page.',
            outStock: isHindi ? 'Stock nahi hai' : 'Out of stock',
            more: isHindi ? '🔎 Aur Products' : '🔎 More Products',
            selected: isHindi ? 'Aapne size select kiya' : 'Selected size',
            chooseOther: isHindi ? '⬅️ Dusra Product Chunein' : '⬅️ Choose Another Product',
            viewProduct: isHindi ? '🌐 Product Dekhein' : '🌐 View Product',
            browse: isHindi ? '🛍️ Store Kholein' : '🛍️ Browse Store'
        };
        return labels[key] || key;
    }

    isHivraGenderProduct(product, gender) {
        // API category metadata is the source of truth when available. Never mix
        // explicitly gendered products into the opposite menu.
        const categories = Array.isArray(product?.categories) ? product.categories : [];
        const haystack = [product?.name, ...categories.flatMap(cat => [cat?.name, cat?.slug])].join(' ').toLowerCase();
        const isMen = /\b(men|mens|men's|male|man|boys)\b/i.test(haystack);
        const isWomen = /\b(women|womens|women's|female|ladies|girls)\b/i.test(haystack);
        return gender === 'M' ? !(isWomen && !isMen) : !(isMen && !isWomen);
    }

    async renderHivraCategoryCatalog(category, gender, page = 1) {
        this.userGenderCode = gender;
        this.selectedProductType = '';
        this.selectedCatalogProduct = null;
        const sequence = ++this.catalogRequestSeq;
        const back = gender === 'M' ? () => this.renderHivraMenProducts() : () => this.renderHivraWomenProducts();
        await this.botReply(this.chatbotProductFlowText('selectPrompt'));
        let data;
        try {
            data = await this.apiGet(`/api/search?q=${encodeURIComponent(category)}&page=${page}&limit=12`);
        } catch (error) {
            if (sequence !== this.catalogRequestSeq) return;
            await this.botReply(this.chatbotProductFlowText('apiError'));
            this.addButtons([
                { text: '🔄 Retry', action: () => this.renderHivraCategoryCatalog(category, gender, page) },
                { text: this.chatbotProductFlowText('browse'), action: () => window.open(gender === 'M' ? '/men' : '/women', '_blank', 'noopener,noreferrer') }
            ]);
            this.addNavButtons(back);
            return;
        }
        if (sequence !== this.catalogRequestSeq) return;
        const products = (Array.isArray(data?.products) ? data.products : []).filter(product =>
            product && product.slug && this.isHivraGenderProduct(product, gender)
        );
        if (!products.length) {
            await this.botReply(this.chatbotProductFlowText('noProducts'));
        } else {
            const group = document.createElement('div');
            group.className = 'hivra-live-products fade-in';
            products.forEach(product => {
                const card = document.createElement('div');
                card.className = 'hivra-live-product hivra-selectable-product';
                const imageUrl = typeof product.image?.url === 'string' ? product.image.url : '';
                if (/^(https?:\/\/|\/)/i.test(imageUrl) && !imageUrl.startsWith('//')) {
                    const img = document.createElement('img');
                    img.src = imageUrl;
                    img.alt = String(product.name || 'Product');
                    img.loading = 'lazy';
                    card.appendChild(img);
                }
                const info = document.createElement('span');
                const title = document.createElement('strong');
                title.textContent = String(product.name || 'Product');
                const price = document.createElement('small');
                const priceValue = Number(product.discountPrice || product.showPrice || 0);
                price.textContent = priceValue > 0 ? `₹${priceValue.toLocaleString('en-IN')}` : '';
                const choose = document.createElement('button');
                choose.type = 'button';
                choose.className = 'chat-btn hivra-choose-product';
                choose.textContent = this.chatbotProductFlowText('selectProduct');
                choose.onclick = () => {
                    group.querySelectorAll('button').forEach(btn => { btn.disabled = true; });
                    this.addMessage('user', String(product.name || 'Product'));
                    this.renderHivraSelectedCatalogProduct(product, category, gender);
                };
                info.append(title, price, choose);
                card.appendChild(info);
                group.appendChild(card);
            });
            this.messagesArea.appendChild(group);
            this.scrollToBottom();
            this.saveChatSession();
        }
        const nav = [];
        if (data?.pagination?.hasNextPage) {
            nav.push({ text: this.chatbotProductFlowText('more'), action: () => this.renderHivraCategoryCatalog(category, gender, page + 1) });
        }
        nav.push({ text: this.chatbotProductFlowText('browse'), action: () => window.open(gender === 'M' ? '/men' : '/women', '_blank', 'noopener,noreferrer') });
        this.addButtons(nav);
        this.addNavButtons(back);
    }

    async renderHivraSelectedCatalogProduct(product, category, gender) {
        ++this.catalogRequestSeq;
        this.selectedCatalogProduct = product;
        this.selectedProductType = String(product.name || category);
        const productName = this.escapeHtml(this.selectedProductType);
        await this.botReply(`${this.ht('selectedProduct')}: <b>${productName}</b>`);
        const sizes = (Array.isArray(product.sizes) ? product.sizes : []).filter(size =>
            size && size.isActive !== false && String(size.size || '').trim()
        );
        if (!sizes.length || !sizes.some(size => Number(size.stock) > 0)) {
            await this.botReply(this.chatbotProductFlowText('noSizes'));
            this.addHivraSelectedProductActions(product, '', category, gender);
            return;
        }
        await this.botReply(this.chatbotProductFlowText('sizePrompt'));
        const grid = document.createElement('div');
        grid.className = 'size-grid fade-in';
        sizes.forEach(size => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'size-item chat-btn hivra-api-size';
            btn.textContent = String(size.size).trim();
            const inStock = Number(size.stock) > 0;
            btn.disabled = !inStock;
            if (!inStock) {
                btn.title = this.chatbotProductFlowText('outStock');
                btn.className += ' hivra-size-soldout';
            }
            btn.onclick = () => {
                if (!inStock) return;
                grid.querySelectorAll('button').forEach(option => { option.disabled = true; });
                this.addMessage('user', String(size.size));
                this.renderHivraChosenCatalogSize(product, size, category, gender);
            };
            grid.appendChild(btn);
        });
        this.messagesArea.appendChild(grid);
        this.scrollToBottom();
        this.saveChatSession();
        this.addNavButtons(() => this.renderHivraCategoryCatalog(category, gender));
    }

    async renderHivraChosenCatalogSize(product, size, category, gender) {
        const name = this.escapeHtml(product.name || category);
        const selectedSize = this.escapeHtml(size.size);
        const amount = Number(size.discountPrice || size.showPrice || product.discountPrice || product.showPrice || 0);
        const price = amount > 0 ? ` · ₹${amount.toLocaleString('en-IN')}` : '';
        await this.botReply(`<b>${name}</b><br>${this.chatbotProductFlowText('selected')}: <b>${selectedSize}</b>${price}`);
        this.addHivraSelectedProductActions(product, String(size.size), category, gender);
    }

    addHivraSelectedProductActions(product, size, category, gender) {
        const back = () => this.renderHivraCategoryCatalog(category, gender);
        const productUrl = `/product/${encodeURIComponent(product.slug)}`;
        const helpText = `Hello Hivra Soft, I need help with ${product.name || category}${size ? ', size ' + size : ''}.`;
        this.addButtons([
            { text: this.chatbotProductFlowText('viewProduct'), action: () => window.open(productUrl, '_blank', 'noopener,noreferrer') },
            { text: this.ht('askWhatsapp'), action: () => this.openHivraWhatsApp(helpText, back) },
            { text: this.chatbotProductFlowText('chooseOther'), action: back },
            { text: this.t('bHome') || '🏠 Main Menu', action: () => this.renderMainMenu() }
        ]);
    }

    async renderHivraSportsBraSize() {
        this.userGenderCode = 'F';
        this.selectedProductType = "Sports Bra";
        await this.botReply(this.ht('topSizeQ'));
        this.addButtons([
            { text: "S", action: () => this.showHivraAlphaSizeResult("Sports Bra", "S") },
            { text: "M", action: () => this.showHivraAlphaSizeResult("Sports Bra", "M") },
            { text: "L", action: () => this.showHivraAlphaSizeResult("Sports Bra", "L") },
            { text: "XL", action: () => this.showHivraAlphaSizeResult("Sports Bra", "XL") },
            { text: "XXL", action: () => this.showHivraAlphaSizeResult("Sports Bra", "XXL") }
        ]);
        this.addNavButtons(() => this.renderHivraBraCategories());
    }


    async renderHivraLingerieSize() {
        this.userGenderCode = 'F';
        this.selectedProductType = "Lingerie";
        await this.botReply(this.ht('sizePickQ'));
        this.addButtons([
            { text: "S", action: () => this.showHivraAlphaSizeResult("Lingerie", "S") },
            { text: "M", action: () => this.showHivraAlphaSizeResult("Lingerie", "M") },
            { text: "L", action: () => this.showHivraAlphaSizeResult("Lingerie", "L") },
            { text: "XL", action: () => this.showHivraAlphaSizeResult("Lingerie", "XL") },
            { text: "XXL", action: () => this.showHivraAlphaSizeResult("Lingerie", "XXL") }
        ]);
        this.addNavButtons(() => this.renderHivraWomenProducts());
    }


    async showHivraAlphaSizeResult(productName, size) {
        this.selectedProductType = productName;
        await this.botReply(this.formatHivraText(this.ht('alphaSizeResult'), { product: productName, size }));
        await this.botReply(this.ht('nextOptions'));
        this.addHivraProductActionButtons(productName, size);
    }


    async renderHivraBodyShapeMenu() {
        this.userGenderCode = 'F';
        await this.botReply(this.ht('bodyShapeQ'));
        this.addButtons([
            { text: this.ht('bodyPear'), action: () => this.showHivraBodyShapeResult(this.ht('bodyPear')) },
            { text: this.ht('bodyApple'), action: () => this.showHivraBodyShapeResult(this.ht('bodyApple')) },
            { text: this.ht('bodyHourglass'), action: () => this.showHivraBodyShapeResult(this.ht('bodyHourglass')) },
            { text: this.ht('bodyRectangle'), action: () => this.showHivraBodyShapeResult(this.ht('bodyRectangle')) },
            { text: this.ht('bodyCurvy'), action: () => this.showHivraBodyShapeResult(this.ht('bodyCurvy')) }
        ]);
        this.addNavButtons(() => this.renderHivraWomenProducts());
    }


    async showHivraBodyShapeResult(shape) {
        await this.botReply(this.formatHivraText(this.ht('bodyShapeResult'), { shape }));
        this.addButtons([
            { text: this.ht('openProductPage'), action: () => this.openHivraProductPage("Women Innerwear") },
            { text: this.ht('askWhatsapp'), action: () => this.openHivraWhatsApp(`Hello Hivra Soft, please suggest products for ${shape}.`, this.getProductBackAction()) },
            { text: this.t('bHome') || "🏠 Main Menu", action: () => this.renderMainMenu() }
        ]);
        this.addNavButtons(() => this.renderHivraWomenProducts());
    }


    async renderHivraIssueMenu() {
        this.isTracking = false;
        this.isSomethingElse = false;

        await this.botReply(this.ht('issueQ'));
        this.addButtons([
            { text: this.ht('sizeIssue'), action: () => this.renderHivraSizeIssueHelp() },
            { text: this.ht('replaceExchange'), action: () => this.renderHivraReplacementHelp() },
            { text: this.ht('trackMyOrder'), action: () => this.openTrackOrderPage() },
            { text: this.ht('wrongDamaged'), action: () => this.renderHivraWrongDamagedHelp() },
            { text: this.ht('paymentCod'), action: () => this.renderHivraPaymentHelp() },
            { text: this.ht('talkSupport'), action: () => this.renderHivraSupportOptions() }
        ]);
        this.addNavButtons(() => this.renderMainMenu());
    }


    async renderHivraSizeIssueHelp() {
        await this.botReply(this.ht('sizeIssueText1'));
        await this.botReply(this.ht('sizeIssueText2'));

        const buttons = [];
        if (this.userGenderCode === 'M') {
            buttons.push({ text: this.ht('menSizeHelp'), action: () => this.renderHivraMenProducts() });
        } else if (this.userGenderCode === 'F') {
            buttons.push({ text: this.ht('women') + " " + this.ht('sizeFitting').replace('📏 ', ''), action: () => this.renderHivraWomenProducts() });
        } else {
            buttons.push({ text: this.ht('menSizeHelp'), action: () => this.renderHivraMenProducts() });
            buttons.push({ text: this.ht('women') + " " + this.ht('sizeFitting').replace('📏 ', ''), action: () => this.renderHivraWomenProducts() });
        }
        buttons.push({ text: this.ht('sendSizeWhatsapp'), action: () => this.openHivraWhatsApp("Hello Hivra Soft, I have a size issue. My Order ID is: ", () => this.renderHivraIssueMenu()) });

        this.addButtons(buttons);
        this.addNavButtons(() => this.renderHivraIssueMenu());
    }


    async renderHivraReplacementHelp() {
        await this.botReply(this.ht('replacementText1'));
        await this.botReply(this.ht('replacementText2'));
        this.addButtons([
            { text: this.ht('requestWhatsapp'), action: () => this.openHivraWhatsApp("Hello Hivra Soft, I want to replace/exchange my product. My Order ID is: ", () => this.renderHivraIssueMenu()) },
            { text: this.ht('emailReplacement'), action: () => this.openHivraEmail("Replacement / Exchange Request - Hivra Soft", () => this.renderHivraIssueMenu()) },
            { text: this.ht('callSupport'), action: () => this.callHivraSupport(() => this.renderHivraIssueMenu()) }
        ]);
        this.addNavButtons(() => this.renderHivraIssueMenu());
    }


    async renderHivraWrongDamagedHelp() {
        await this.botReply(this.ht('damagedText1'));
        await this.botReply(this.ht('damagedText2'));
        this.addButtons([
            { text: this.ht('reportWhatsapp'), action: () => this.openHivraWhatsApp("Hello Hivra Soft, I received a wrong/damaged product. My Order ID is: ", () => this.renderHivraIssueMenu()) },
            { text: this.ht('emailIssue'), action: () => this.openHivraEmail("Wrong / Damaged Product - Hivra Soft", () => this.renderHivraIssueMenu()) },
            { text: this.ht('callSupport'), action: () => this.callHivraSupport(() => this.renderHivraIssueMenu()) }
        ]);
        this.addNavButtons(() => this.renderHivraIssueMenu());
    }


    async renderHivraPaymentHelp() {
        await this.botReply(this.ht('paymentText1'));
        await this.botReply(this.ht('paymentText2'));
        this.addButtons([
            { text: this.ht('sendPaymentWhatsapp'), action: () => this.openHivraWhatsApp("Hello Hivra Soft, I need help with a payment/COD issue. My Order ID is: ", () => this.renderHivraIssueMenu()) },
            { text: this.ht('emailPayment'), action: () => this.openHivraEmail("Payment / COD Issue - Hivra Soft", () => this.renderHivraIssueMenu()) },
            { text: this.ht('callSupport'), action: () => this.callHivraSupport(() => this.renderHivraIssueMenu()) }
        ]);
        this.addNavButtons(() => this.renderHivraIssueMenu());
    }


    async renderHivraSupportOptions() {
        await this.botReply(this.ht('supportText'));
        this.addButtons([
            { text: this.ht('whatsappSupport'), action: () => this.openHivraWhatsApp("Hello Hivra Soft, I need help with my order/product.", () => this.renderHivraIssueMenu()) },
            { text: this.ht('callSupport'), action: () => this.callHivraSupport(() => this.renderHivraIssueMenu()) },
            { text: this.ht('emailSupport'), action: () => this.openHivraEmail("Support Request - Hivra Soft", () => this.renderHivraIssueMenu()) },
            { text: this.ht('visitWebsite'), action: () => this.openHivraWebsite(() => this.renderHivraIssueMenu()) }
        ]);
        this.addNavButtons(() => this.renderHivraIssueMenu());
    }


    addHivraProductActionButtons(productName, size) {
        this.addButtons([
            { text: this.ht('openProductPage'), action: () => this.openHivraProductPage(productName) },
            { text: this.ht('askWhatsapp'), action: () => this.openHivraWhatsApp(`Hello Hivra Soft, I need help with ${productName}. Suggested size is ${size}.`, this.getProductBackAction()) },
            { text: this.ht('needReplacement'), action: () => this.renderHivraReplacementHelp() },
            { text: this.t('bHome') || "🏠 Main Menu", action: () => this.renderMainMenu() }
        ]);
    }


    async openHivraProductPage(productName, page = 1) {
        const q = String(productName || '').trim() || 'innerwear';
        await this.botReply(`🔎 ${this.escapeHtml(q)} products live search ho rahe hain...`, 200);
        let data = null;
        try {
            data = await this.apiGet(`/api/search?q=${encodeURIComponent(q)}&page=${page}&limit=5`);
            const products = Array.isArray(data.products) ? data.products : [];
            if (products.length) {
                const group = document.createElement('div');
                group.className = 'hivra-live-products fade-in';
                products.forEach(product => {
                    if (!product || !product.slug) return;
                    const link = document.createElement('a');
                    link.href = `/product/${encodeURIComponent(product.slug)}`;
                    link.target = '_blank';
                    link.rel = 'noopener noreferrer';
                    link.className = 'hivra-live-product';
                    const imgUrl = typeof product.image?.url === 'string' ? product.image.url : '';
                    if (/^(https?:\/\/|\/)/i.test(imgUrl) && !imgUrl.startsWith('//')) {
                        const img = document.createElement('img');
                        img.src = imgUrl;
                        img.alt = String(product.name || 'Product');
                        img.loading = 'lazy';
                        link.appendChild(img);
                    }
                    const content = document.createElement('span');
                    const name = document.createElement('strong');
                    name.textContent = String(product.name || 'Product');
                    const price = document.createElement('small');
                    const value = Number(product.discountPrice || product.showPrice || 0);
                    price.textContent = value > 0 ? `₹${value.toLocaleString('en-IN')} · View Product ↗` : 'View Product ↗';
                    content.append(name, price);
                    link.appendChild(content);
                    group.appendChild(link);
                });
                this.messagesArea.appendChild(group);
                this.scrollToBottom();
                this.saveChatSession();
            } else {
                await this.botReply('Is search par product nahi mila. Sabhi products search kar sakte hain.');
            }
        } catch (error) {
            await this.botReply('⚠️ Product API se results nahi aa rahe. Website par search khol sakte hain.');
        }
        this.addButtons([
            ...(typeof data !== 'undefined' && data.pagination?.hasNextPage ? [
                { text: '🔎 Show more API products', action: () => this.openHivraProductPage(q, page + 1) }
            ] : []),
            { text: '🛍️ Browse Store', action: () => window.open(this.userGenderCode === 'M' ? '/men' : this.userGenderCode === 'F' ? '/women' : '/', '_blank', 'noopener,noreferrer') },
            { text: '⬅️ Back to Products', action: this.getProductBackAction() }
        ]);
    }

    openHivraWebsite(backAction) {
        window.open(this.hivraWebsite, "_blank");
        this.afterHivraExternalAction(this.ht('openedWebsite'), backAction || this.getProductBackAction());
    }

    openTrackOrderPage() {
        this.startTracking();
    }

    openHivraWhatsApp(message, backAction) {
        const phone = this.hivraSupportPhone.replace(/[^0-9]/g, "");
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank");
        this.afterHivraExternalAction(this.ht('openedWhatsapp'), backAction || this.getProductBackAction());
    }

    callHivraSupport(backAction) {
        window.location.href = `tel:${this.hivraSupportPhone}`;
        this.afterHivraExternalAction(this.ht('openedCall'), backAction || this.getProductBackAction());
    }

    openHivraEmail(subject, backAction) {
        window.location.href = `mailto:${this.hivraSupportEmail}?subject=${encodeURIComponent(subject)}`;
        this.afterHivraExternalAction(this.ht('openedEmail'), backAction || this.getProductBackAction());
    }

    async afterHivraExternalAction(message, backAction) {
        await this.botReply(message, 300);
        this.addActionNavButtons(backAction || this.getProductBackAction());
    }

    getProductBackAction() {
        if (this.userGenderCode === 'M') return () => this.renderHivraMenProducts();
        if (this.userGenderCode === 'F') return () => this.renderHivraWomenProducts();
        return () => this.renderMainMenu();
    }

    addActionNavButtons(backAction) {
        const buttons = [];
        if (typeof backAction === 'function') {
            buttons.push({ text: this.ht('backToProducts'), action: backAction });
        }
        buttons.push({ text: this.t('bHome') || "🏠 Main Menu", action: () => this.renderMainMenu() });
        this.addButtons(buttons);
    }


    isGreetingInput(input) {
        const greetings = ["hi", "hii", "hiii", "hello", "hey", "namaste", "good morning", "good afternoon", "good evening"];
        return greetings.some(word => input === word || input.startsWith(word + " "));
    }

    isHivraMenInput(input) {
        return /\b(men|man|male|mens|brief|trunk|boxer|thong|thongs|g-string|g string|underwear for men|men underwear)\b/i.test(input);
    }


    isHivraWomenInput(input) {
        return /\b(women|woman|female|ladies|lady|bra|panty|padded|non padded|feeding|maternity|nursing|sports bra|t-shirt bra|tshirt bra|lingerie|seamless|hipster|thong|thongs|g-string|g string|body shape|innerwear for women)\b/i.test(input);
    }


    isHivraIssueInput(input) {
        return /\b(issue|problem|replace|replacement|exchange|return|wrong|damage|damaged|payment|cod|refund|size issue|complaint|not fit|fitting)\b/i.test(input);
    }


    async renderFAQMenu() {
        this.addButtons([
            { text: this.t('faqDel'), action: async () => {
                await this.botReply(this.i18n[this.userLanguage].kb.find(i => i.keys.includes('delivery')).ans);
                this.addNavButtons(() => this.renderFAQMenu());
            }},
            { text: this.t('faqRet'), action: async () => {
                await this.botReply(this.i18n[this.userLanguage].kb.find(i => i.keys.includes('return')).ans);
                this.addNavButtons(() => this.renderFAQMenu());
            }},
            { text: this.t('bFaq'), action: () => this.renderContactDetails() }
        ]);
        this.addNavButtons(() => this.renderMainMenu());
    }

    async renderContactDetails() {
        await this.botReply(this.t('contactQ'));
        this.addButtons([
            { text: this.t('bCallUs'), action: () => {
                window.location.href = "tel:+919420980536";
                setTimeout(() => {
                    this.botReply(this.t('callOp'));
                    this.addNavButtons(() => this.renderContactDetails());
                }, 500);
            }},
            { text: this.t('bEmailUs'), action: () => {
                window.location.href = "mailto:support@hivrasoft.com";
                setTimeout(() => {
                    this.botReply(this.t('emailOp'));
                    this.addNavButtons(() => this.renderContactDetails());
                }, 500);
            }}
        ]);
        this.addNavButtons(() => this.renderFAQMenu());
    }

   
    saveChatSession() {
        try {
            if (!this.messagesArea || !this.chatSessionKey) return;
            const html = this.messagesArea.innerHTML || "";
            if (!html.trim()) {
                sessionStorage.removeItem(this.chatSessionKey);
                return;
            }

            const data = {
                html: html,
                inputValue: this.userInput ? this.userInput.value : "",
                isTracking: !!this.isTracking,
                isSomethingElse: !!this.isSomethingElse,
                userLanguage: this.userLanguage || 'English',
                userGenderCode: this.userGenderCode || '',
                selectedProductType: this.selectedProductType || '',
                braData: this.braData || { underbust: 0, bust: 0 },
                authUserId: this.authUserId || null,
                savedAt: Date.now()
            };

            sessionStorage.setItem(this.chatSessionKey, JSON.stringify(data));
        } catch (err) {
            console.warn('Hivra chatbot session save failed:', err);
        }
    }

    restoreChatSession() {
        try {
            if (!this.messagesArea || !this.chatSessionKey) return false;
            const raw = sessionStorage.getItem(this.chatSessionKey);
            if (!raw) return false;

            const data = JSON.parse(raw);
            if (!data || !data.html) return false;

            this.userLanguage = data.userLanguage || this.userLanguage || 'English';
            this.userGenderCode = data.userGenderCode || this.userGenderCode || '';
            this.selectedProductType = data.selectedProductType || '';
            this.isTracking = !!data.isTracking;
            this.isSomethingElse = !!data.isSomethingElse;
            this.braData = data.braData || { underbust: 0, bust: 0 };
            if ((data.authUserId || null) !== (this.authUserId || null)) {
                this.clearChatSession();
                return false;
            }

            if (this.userInput) {
                this.userInput.value = data.inputValue || '';
                this.userInput.placeholder = this.t('placeholder');
            }
            if (this.sendBtn) this.sendBtn.innerText = this.t('sendBtn');

            this.messagesArea.innerHTML = data.html;
            this.messagesArea.querySelectorAll('.hivra-session-resume').forEach(el => el.remove());
            this.disableRestoredSessionButtons();
            this.chatSessionRestored = true;
            this.addSessionResumeMenu();
            this.scrollToBottom();
            this.saveChatSession();
            return true;
        } catch (err) {
            console.warn('Hivra chatbot session restore failed:', err);
            sessionStorage.removeItem(this.chatSessionKey);
            return false;
        }
    }

    clearChatSession() {
        try {
            if (this.chatSessionKey) sessionStorage.removeItem(this.chatSessionKey);
        } catch (err) {
            console.warn('Hivra chatbot session clear failed:', err);
        }
    }

    disableRestoredSessionButtons() {
        if (!this.messagesArea) return;
        this.messagesArea.querySelectorAll('.chat-btn').forEach(btn => {
            btn.disabled = true;
            btn.style.pointerEvents = 'none';
            btn.style.opacity = '0.45';
        });
    }

    addSessionResumeMenu() {
        if (!this.messagesArea) return;

        const msg = document.createElement('div');
        msg.className = 'message bot fade-in hivra-session-resume';
        msg.innerHTML = 'Your previous chat is still here. You can continue from the correct section below.';
        this.messagesArea.appendChild(msg);

        const options = [];
        if (this.userGenderCode === 'M') {
            options.push({ text: this.ht('men') || '👕 Men', action: () => this.renderHivraMenProducts() });
        } else if (this.userGenderCode === 'F') {
            options.push({ text: this.ht('women') || '🩲 Women', action: () => this.renderHivraWomenProducts() });
        } else {
            options.push({ text: this.ht('men') || '👕 Men', action: () => this.renderHivraMenProducts() });
            options.push({ text: this.ht('women') || '🩲 Women', action: () => this.renderHivraWomenProducts() });
        }

        options.push({ text: this.ht('haveIssue') || '🛠️ Have an Issue', action: () => this.renderHivraIssueMenu() });
        options.push({ text: this.ht('somethingElse') || '🤔 Something Else', action: () => this.startSomethingElse() });
        options.push({ text: '🔄 Start New Chat', action: () => this.startFreshChatSession() });

        const group = document.createElement('div');
        group.className = 'fade-in hivra-session-resume';
        group.style.display = 'flex';
        group.style.flexDirection = 'column';
        group.style.gap = '8px';
        group.style.width = '100%';
        group.style.marginTop = '8px';

        options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'chat-btn';
            btn.innerText = opt.text;
            btn.onclick = (e) => {
                e.preventDefault();
                group.querySelectorAll('button').forEach(b => b.disabled = true);
                this.addMessage('user', opt.text);
                opt.action();
            };
            group.appendChild(btn);
        });

        this.messagesArea.appendChild(group);
        this.scrollToBottom();
    }

    escapeHtml(value) {
        return String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
    }

    async apiGet(path) {
        const response = await fetch(`${this.apiBase}${path}`, {
            method: 'GET', credentials: 'include', cache: 'no-store',
            headers: { Accept: 'application/json' }
        });
        let data = null;
        try { data = await response.json(); } catch (_) {}
        if (!response.ok || data?.success === false) {
            const error = new Error(data?.message || `API Error (${response.status})`);
            error.status = response.status;
            throw error;
        }
        return data || {};
    }

    async refreshAuth() {
        try {
            const response = await this.apiGet('/api/auth/me');
            const user = response.user || response.account || response.data?.user || null;
            const newUserId = user ? String(user.id || user._id || '') : null;
            if (this.authLoaded && newUserId !== this.authUserId) this.handleIdentityChange();
            this.authUserId = newUserId;
            this.authLoaded = true;
            this.userName = user ? String(user.name || '').trim().slice(0, 50) : '';
            this.updateBubble();
            return user;
        } catch (error) {
            if (error.status === 401 || error.status === 403) {
                if (this.authLoaded && this.authUserId) this.handleIdentityChange();
                this.authLoaded = true;
                this.authUserId = null;
                this.userName = '';
                this.updateBubble();
                return null;
            }
            // A network error must not be treated as a verified logout.
            return null;
        }
    }

    handleIdentityChange() {
        this.clearChatSession();
        if (this.messagesArea) this.messagesArea.innerHTML = '';
        this.isTracking = false;
        this.isSomethingElse = false;
        this.pendingAfterLogin = false;
        this.enableChat();
    }

    handleLogout() {
        this.handleIdentityChange();
        this.authUserId = null;
        this.authLoaded = true;
        this.userName = '';
        this.updateBubble();
    }

    openLogin() {
        // This event is already wired to the website's actual OTP login modal.
        window.dispatchEvent(new Event('hivrasoft-auth-required'));
    }

    async fetchOrders() {
        const data = await this.apiGet('/api/orders');
        return Array.isArray(data.orders) ? data.orders : [];
    }

    async loadKnowledge() {
        try {
            const res = await fetch('/chatbot/chatbot.json', { cache: 'force-cache' });
            if (!res.ok) return;
            const data = await res.json();
            if (Array.isArray(data)) this.knowledge = data.filter(item =>
                item && typeof item.keyword === 'string' && typeof item.answer === 'string'
            );
        } catch (_) { /* Static knowledge is optional; other bot flows remain available. */ }
    }

    startFreshChatSession() {
        this.messagesArea.innerHTML = '';
        this.clearChatSession();
        this.isTracking = false;
        this.isSomethingElse = false;
        this.selectedProductType = '';
        this.selectedCatalogProduct = null;
        ++this.catalogRequestSeq;
        this.userGenderCode = '';
        this.braData = { underbust: 0, bust: 0 };
        this.enableChat();
        this.startOnboarding();
    }

    async handleInput() {
        const rawInput = this.userInput.value.trim();
        const input = rawInput.toLowerCase();
        if (!input) return;

        this.messagesArea.querySelectorAll('.chat-btn').forEach(btn => btn.disabled = true);

        if (this.isTracking) {
            this.addMessage('user', rawInput);
            this.userInput.value = '';
            if (rawInput.length < 3 || rawInput.length > 90) {
                await this.botReply('Valid full order number ya order ID type karein.');
                this.addNavButtons(() => this.startTracking());
                return;
            }
            await this.processTracking(rawInput);
            return;
        }

        this.addMessage('user', rawInput);
        this.userInput.value = "";

        // HivraSoft authenticated actions and live product search.
        if (/\b(login|log in|sign in|signin|register|signup|sign up)\b/i.test(input)) {
            await this.botReply('🔐 HivraSoft account login OTP se hota hai.');
            this.openLogin();
            this.addNavButtons(() => this.renderMainMenu());
            return;
        }
        if (/\b(track|tracking|order status|my order|my orders)\b/i.test(input)) {
            await this.startTracking();
            return;
        }
        if (/\b(search|find|show products|products? dikhao|shopping)\b/i.test(input)) {
            await this.openHivraProductPage(rawInput.replace(/\b(search|find|show|products?|please|dikhao)\b/ig, '').trim() || 'innerwear');
            return;
        }

        // New requested greeting/product/issue text routing.
        // This does not remove your existing keyword knowledge base.
        if (this.isGreetingInput(input)) {
            await this.botReply(this.t('greet'));
            await this.renderMainMenu();
            return;
        }

        if (this.isHivraMenInput(input)) {
            await this.renderHivraMenProducts();
            return;
        }

        if (this.isHivraWomenInput(input)) {
            await this.renderHivraWomenProducts();
            return;
        }

        if (this.isHivraIssueInput(input)) {
            await this.renderHivraIssueMenu();
            return;
        }

        if (input.includes('track') || input.includes('tracking') || input.includes('order status')) {
            this.openTrackOrderPage();
            return;
        }

        if (this.isSomethingElse) { 
            this.handleSomethingElseReply(); 
            return; 
        }

        const langData = this.i18n[this.userLanguage || 'English'];
        let matched = false;

        await this.botReply("...", 600); 
        this.messagesArea.removeChild(this.messagesArea.lastChild); 

        for (let item of langData.kb) {
            if (item.gender && item.gender !== 'all' && item.gender !== this.userGenderCode) {
                continue; 
            }

            if (item.keys.some(k => input.includes(k))) {
                await this.botReply(item.ans);
                matched = true; 
                break;
            }
        }

        if (!matched) {
            const kbMatch = this.knowledge.find(item => {
                const keyword = String(item.keyword || '').toLowerCase().trim();
                return keyword.length >= 4 && (input.includes(keyword) || (keyword.includes(input) && input.length >= 7));
            });
            if (kbMatch) await this.botReply(this.escapeHtml(kbMatch.answer));
            else await this.botReply(this.t('fallback'));
        }

        this.addNavButtons(() => this.renderMainMenu());
    }
}

function startHivraChatbot() {
    if (!document.getElementById('chatbot-container')) return;
    if (window.hivraChatbotInstance) return;
    window.hivraChatbotInstance = new HivraProAssistant();
}
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startHivraChatbot, { once: true });
} else {
    startHivraChatbot();
}