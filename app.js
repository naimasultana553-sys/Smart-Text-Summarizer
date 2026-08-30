document.addEventListener('DOMContentLoaded', () => {
    const landingPage = document.getElementById('landing-page');
    const appWrapper = document.getElementById('app-wrapper');
    const getStartedBtn = document.getElementById('get-started-btn');
    const mainLogo = document.querySelector('.main-logo');
    const sourceText = document.getElementById('source-text');
    const summaryOutput = document.getElementById('summary-output');
    const summarizeBtn = document.getElementById('summarize-btn');
    const clearBtn = document.getElementById('clear-btn');
    const copyBtn = document.getElementById('copy-btn');
    if (landingPage && mainLogo) {
        landingPage.addEventListener('mousemove', (e) => {
            const moveX = (e.clientX - window.innerWidth / 2) / 25;
            const moveY = (e.clientY - window.innerHeight / 2) / 25;
            mainLogo.style.transform = `translate(${moveX}px, ${moveY}px) scale(1.05)`;
        });
        landingPage.addEventListener('mouseleave', () => { mainLogo.style.transform = `translate(0, 0) scale(1)`; });
    }
    const historyBtn = document.getElementById('history-btn');
    const closeHistory = document.getElementById('close-history');
    const historySidebar = document.getElementById('history-sidebar');
    const historyList = document.getElementById('history-list');
    const backdrop = document.getElementById('sidebar-backdrop');
    const outputSection = document.getElementById('output-section');
    const outputEmpty = document.getElementById('output-empty');
    const loader = document.getElementById('loader');
    const inputWordCount = document.getElementById('input-word-count');
    const outputWordCount = document.getElementById('output-word-count');
    const inputCharCount = document.getElementById('input-char-count');
    const readingTime = document.getElementById('reading-time');
    const summaryLength = document.getElementById('summary-length');
    const bulletMode = document.getElementById('bullet-mode');
    const highlightMode = document.getElementById('highlight-mode');
    const outputLang = document.getElementById('output-lang');
    const downloadTxtBtn = document.getElementById('download-txt-btn');
    const downloadPdfBtn = document.getElementById('download-pdf-btn');
    const regenerateBtn = document.getElementById('regenerate-btn');
    const listenSourceBtn = document.getElementById('listen-source-btn');
    const listenSummaryBtn = document.getElementById('listen-summary-btn');
    const toastEl = document.getElementById('toast');
    const getStarted = () => {
        if (!landingPage || !appWrapper) return;
        landingPage.style.opacity = '0';
        landingPage.style.transition = 'opacity 0.5s ease';
        setTimeout(() => {
            landingPage.classList.add('hidden');
            appWrapper.classList.remove('hidden');
            window.scrollTo(0, 0);
        }, 420);
    };
    if (getStartedBtn) getStartedBtn.addEventListener('click', getStarted);
    let history = JSON.parse(localStorage.getItem('summary-history')) || [];
    const stopWords = new Set(['a','about','above','after','again','against','all','am','an','and','any','are','as','at','be','because','been','before','being','below','between','both','but','by','could','did','do','does','doing','down','during','each','few','for','from','further','had','has','have','having','he','her','here','hers','herself','him','himself','his','how','i','if','in','into','is','it','its','itself','just','me','more','most','my','myself','no','nor','not','now','of','off','on','once','only','or','other','ought','our','ours','ourselves','out','over','own','same','she','should','so','some','such','than','that','the','their','theirs','them','themselves','then','there','these','they','this','those','through','to','too','under','until','up','very','was','we','were','what','when','where','which','while','who','whom','why','with','would','you','your','yours','yourself','yourselves']);
    function getWordCount(text) { return text.trim() ? text.trim().split(/\s+/).length : 0; }
    function showToast(msg) {
        if (!toastEl) return;
        toastEl.textContent = msg;
        toastEl.classList.remove('hidden');
        clearTimeout(showToast._t);
        showToast._t = setTimeout(() => toastEl.classList.add('hidden'), 2200);
    }
    async function translateText(text, target = 'bn') {
        try {
            const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${target}`);
            const data = await res.json();
            return data.responseData.translatedText;
        } catch (err) { return text; }
    }
    function summarize(text, ratio = 0.5) {
        if (!text.trim()) return [];
        const sentences = text.match(/[^\.!\?।]+[\.!\?।]+/g) || [text];
        if (sentences.length <= 1) return sentences.map(s => ({text: s, important: true}));
        const words = text.toLowerCase().match(/\w+/g) || [];
        const freqMap = {};
        words.forEach(word => { if (!stopWords.has(word)) freqMap[word] = (freqMap[word] || 0) + 1; });
        const scoredSentences = sentences.map((sentence, index) => {
            const sentenceWords = sentence.toLowerCase().match(/\w+/g) || [];
            let score = 0;
            sentenceWords.forEach(word => { if (freqMap[word]) score += freqMap[word]; });
            const jitter = score * 0.05 * Math.random();
            return { text: sentence.trim(), score: score + jitter, index: index };
        });
        const countToKeep = Math.max(1, Math.ceil(sentences.length * ratio));
        const importantThreshold = Math.ceil(countToKeep * 0.4);
        const sorted = [...scoredSentences].sort((a, b) => b.score - a.score);
        const topIndices = new Set(sorted.slice(0, countToKeep).map(s => s.index));
        const highlightIndices = new Set(sorted.slice(0, importantThreshold).map(s => s.index));
        return scoredSentences.filter(s => topIndices.has(s.index)).map(s => ({ text: s.text, important: highlightIndices.has(s.index) }));
    }
    function updateWordCounts() {
        const wc = getWordCount(sourceText.value);
        if (inputWordCount) inputWordCount.textContent = `${wc} words`;
        if (inputCharCount) inputCharCount.textContent = `${sourceText.value.length} characters`;
        if (readingTime) readingTime.textContent = `~${Math.max(1, Math.ceil(wc / 220))} min read`;
        if (summarizeBtn) summarizeBtn.disabled = wc < 3;
    }
    async function handleSummarize() {
        const text = sourceText.value.trim();
        if (!text) { showToast('Paste some text first'); return; }
        if (getWordCount(text) < 5) { showToast('Add a bit more text for best results'); }
        if (outputSection) outputSection.classList.remove('hidden');
        if (outputEmpty) outputEmpty.classList.add('hidden');
        if (loader) loader.classList.remove('hidden');
        if (summaryOutput) summaryOutput.innerHTML = "";
        if (summarizeBtn) { summarizeBtn.disabled = true; summarizeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Summarizing...'; }
        await new Promise(r => setTimeout(r, 700));
        const lengthMap = { 'short': 0.25, 'medium': 0.5, 'long': 0.75 };
        const ratio = lengthMap[summaryLength.value];
        let summaryData = summarize(text, ratio);
        if (outputLang.value === 'bn' && loader) {
            const p = loader.querySelector('p');
            if (p) p.textContent = "Translating to Bangla...";
            const translatedSentences = await Promise.all(summaryData.map(async s => ({ text: await translateText(s.text, 'bn'), important: s.important })));
            summaryData = translatedSentences;
        }
        let finalHtml = "";
        if (bulletMode.checked) {
            finalHtml = "<ul>" + summaryData.map(s => {
                const content = (highlightMode.checked && s.important) ? `<mark>${s.text}</mark>` : s.text;
                return `<li>${content}</li>`;
            }).join('') + "</ul>";
        } else {
            finalHtml = summaryData.map(s => {
                const content = (highlightMode.checked && s.important) ? `<mark>${s.text}</mark>` : s.text;
                return content;
            }).join(' ');
        }
        summaryOutput.innerHTML = finalHtml;
        const plainText = summaryOutput.innerText;
        if (outputWordCount) outputWordCount.textContent = `${getWordCount(plainText)} words`;
        if (loader) {
            loader.classList.add('hidden');
            const p = loader.querySelector('p'); if (p) p.textContent = "Analyzing and compressing...";
        }
        if (summarizeBtn) summarizeBtn.innerHTML = '<span>Summarize</span> <i class="fas fa-wand-magic-sparkles"></i>';
        updateWordCounts();
        if (outputSection) outputSection.scrollIntoView({behavior:'smooth', block:'start'});
        saveToHistory(text.substring(0, 60) + "...", plainText);
        showToast('Summary ready');
    }
    function saveToHistory(title, summary) {
        const entry = { id: Date.now(), title: title, content: summary, date: new Date().toLocaleDateString() };
        history.unshift(entry);
        if (history.length > 10) history.pop();
        localStorage.setItem('summary-history', JSON.stringify(history));
        renderHistory();
    }
    function renderHistory() {
        if (!historyList) return;
        if (history.length === 0) { historyList.innerHTML = '<p class="empty-msg">No history yet. Your last 10 summaries will appear here.</p>'; return; }
        historyList.innerHTML = history.map(item => `<div class="history-item" data-id="${item.id}"><h4>${item.title}</h4><span>${item.date}</span></div>`).join('');
        document.querySelectorAll('.history-item').forEach(item => {
            item.addEventListener('click', () => {
                const id = item.getAttribute('data-id');
                const selected = history.find(h => h.id == id);
                if (selected) {
                    if (outputSection) outputSection.classList.remove('hidden');
                    if (outputEmpty) outputEmpty.classList.add('hidden');
                    summaryOutput.innerHTML = selected.content;
                    if (outputWordCount) outputWordCount.textContent = `${getWordCount(selected.content)} words`;
                    closeSidebar();
                    showToast('Restored from history');
                }
            });
        });
    }
    function openSidebar(){ if(historySidebar) historySidebar.classList.add('open'); if(backdrop) backdrop.classList.remove('hidden'); document.body.style.overflow='hidden'; renderHistory(); }
    function closeSidebar(){ if(historySidebar) historySidebar.classList.remove('open'); if(backdrop) backdrop.classList.add('hidden'); document.body.style.overflow=''; }
    if (sourceText) sourceText.addEventListener('input', updateWordCounts);
    if (summarizeBtn) summarizeBtn.addEventListener('click', handleSummarize);
    if (regenerateBtn) regenerateBtn.addEventListener('click', handleSummarize);
    if (clearBtn) clearBtn.addEventListener('click', () => {
        sourceText.value = ""; if (summaryOutput) summaryOutput.innerHTML = "";
        if (outputSection) outputSection.classList.add('hidden'); if (outputEmpty) outputEmpty.classList.remove('hidden'); updateWordCounts(); showToast('Cleared');
    });
    if (copyBtn) copyBtn.addEventListener('click', async () => {
        if (!summaryOutput.innerText.trim()) { showToast('Nothing to copy'); return; }
        await navigator.clipboard.writeText(summaryOutput.innerText);
        const orig = copyBtn.innerHTML; copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!'; showToast('Copied to clipboard'); setTimeout(() => copyBtn.innerHTML = orig, 1800);
    });
    if (downloadTxtBtn) downloadTxtBtn.addEventListener('click', () => {
        if (!summaryOutput.innerText.trim()) { showToast('No summary to download'); return; }
        const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
        const file = new Blob([bom, summaryOutput.innerText], {type: 'text/plain;charset=utf-8'});
        const a = document.createElement('a'); a.href = URL.createObjectURL(file); a.download = "smart-text-summary.txt"; document.body.appendChild(a); a.click(); a.remove(); showToast('TXT downloaded');
    });
    if (downloadPdfBtn) downloadPdfBtn.addEventListener('click', () => { if(!summaryOutput.innerText.trim()){showToast('No summary to print');return;} window.print(); });
    if (historyBtn) historyBtn.addEventListener('click', openSidebar);
    if (closeHistory) closeHistory.addEventListener('click', closeSidebar);
    if (backdrop) backdrop.addEventListener('click', closeSidebar);
    document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') closeSidebar(); if((e.ctrlKey||e.metaKey)&&e.key==='Enter') handleSummarize(); });
    let isSpeaking = false;
    function speak(text, lang = 'en') {
        if (isSpeaking) { window.speechSynthesis.cancel(); isSpeaking = false; updateAudioButtons(false); return; }
        if (!text.trim()) { showToast('No text to speak'); return; }
        const ut = new SpeechSynthesisUtterance(text);
        const voices = window.speechSynthesis.getVoices();
        const voice = voices.find(v => v.lang.startsWith(lang)) || voices[0];
        if (voice) ut.voice = voice;
        ut.onend = () => { isSpeaking = false; updateAudioButtons(false); };
        isSpeaking = true; updateAudioButtons(true); window.speechSynthesis.speak(ut);
    }
    function updateAudioButtons(playing) {
        const icon = playing ? 'fa-stop' : 'fa-volume-high';
        if (listenSourceBtn) listenSourceBtn.innerHTML = `<i class="fas ${icon}"></i>`;
        if (listenSummaryBtn) listenSummaryBtn.innerHTML = `<i class="fas ${icon}"></i>`;
    }
    if (listenSourceBtn) listenSourceBtn.addEventListener('click', () => speak(sourceText.value, 'en'));
    if (listenSummaryBtn) listenSummaryBtn.addEventListener('click', () => { const lang = outputLang.value === 'bn' ? 'bn' : 'en'; speak(summaryOutput.innerText, lang); });
    window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
    updateWordCounts(); renderHistory();
    if (outputSection && !outputSection.classList.contains('hidden') && outputEmpty) outputEmpty.classList.add('hidden');
});
