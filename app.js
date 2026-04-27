document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const landingPage = document.getElementById('landing-page');
    const appWrapper = document.getElementById('app-wrapper');
    const getStartedBtn = document.getElementById('get-started-btn');
    const mainLogo = document.querySelector('.main-logo');
    
    const sourceText = document.getElementById('source-text');
    const summaryOutput = document.getElementById('summary-output');
    const summarizeBtn = document.getElementById('summarize-btn');
    const clearBtn = document.getElementById('clear-btn');
    const copyBtn = document.getElementById('copy-btn');

    // Mouse Parallax for Landing Page
    landingPage.addEventListener('mousemove', (e) => {
        if (mainLogo) {
            const moveX = (e.clientX - window.innerWidth / 2) / 25;
            const moveY = (e.clientY - window.innerHeight / 2) / 25;
            mainLogo.style.transform = `translate(${moveX}px, ${moveY}px) scale(1.05)`;
        }
    });

    landingPage.addEventListener('mouseleave', () => {
        if (mainLogo) {
            mainLogo.style.transform = `translate(0, 0) scale(1)`;
        }
    });
    const downloadBtn = document.getElementById('download-btn');
    const historyBtn = document.getElementById('history-btn');
    const closeHistory = document.getElementById('close-history');
    const historySidebar = document.getElementById('history-sidebar');
    const historyList = document.getElementById('history-list');
    const outputSection = document.getElementById('output-section');
    const loader = document.getElementById('loader');
    const inputWordCount = document.getElementById('input-word-count');
    const outputWordCount = document.getElementById('output-word-count');
    const summaryLength = document.getElementById('summary-length');
    
    const bulletMode = document.getElementById('bullet-mode');
    const highlightMode = document.getElementById('highlight-mode');
    const outputLang = document.getElementById('output-lang');
    
    const downloadTxtBtn = document.getElementById('download-txt-btn');
    const downloadPdfBtn = document.getElementById('download-pdf-btn');
    const regenerateBtn = document.getElementById('regenerate-btn');
    
    const listenSourceBtn = document.getElementById('listen-source-btn');
    const listenSummaryBtn = document.getElementById('listen-summary-btn');

    // Navigation
    getStartedBtn.addEventListener('click', () => {
        landingPage.style.opacity = '0';
        landingPage.style.transition = 'opacity 0.5s ease';
        setTimeout(() => {
            landingPage.classList.add('hidden');
            appWrapper.classList.remove('hidden');
            appWrapper.classList.add('animate-fade-in');
            window.scrollTo(0, 0);
        }, 500);
    });

    // State
    let history = JSON.parse(localStorage.getItem('summary-history')) || [];

    // --- Core Logic: Summarization ---

    const stopWords = new Set([
        'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by', 'could', 'did', 'do', 'does', 'doing', 'down', 'during', 'each', 'few', 'for', 'from', 'further', 'had', 'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'i', 'if', 'in', 'into', 'is', 'it', 'its', 'itself', 'just', 'me', 'more', 'most', 'my', 'myself', 'no', 'nor', 'not', 'now', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same', 'she', 'should', 'so', 'some', 'such', 'than', 'that', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'these', 'they', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'we', 'were', 'what', 'when', 'where', 'which', 'while', 'who', 'whom', 'why', 'with', 'would', 'you', 'your', 'yours', 'yourself', 'yourselves'
    ]);

    function getWordCount(text) {
        return text.trim() ? text.trim().split(/\s+/).length : 0;
    }

    async function translateText(text, target = 'bn') {
        try {
            const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${target}`);
            const data = await res.json();
            return data.responseData.translatedText;
        } catch (err) {
            console.error("Translation failed", err);
            return text; // Fallback to English
        }
    }

    function summarize(text, ratio = 0.5) {
        if (!text.trim()) return [];

        // 1. Split into sentences (handles English and basic Bangla punctuation)
        const sentences = text.match(/[^\.!\?।]+[\.!\?।]+/g) || [text];
        if (sentences.length <= 1) return sentences.map(s => ({text: s, important: true}));

        // 2. Frequency Map
        const words = text.toLowerCase().match(/\w+/g) || [];
        const freqMap = {};
        words.forEach(word => {
            if (!stopWords.has(word)) {
                freqMap[word] = (freqMap[word] || 0) + 1;
            }
        });

        // 3. Score Sentences
        const scoredSentences = sentences.map((sentence, index) => {
            const sentenceWords = sentence.toLowerCase().match(/\w+/g) || [];
            let score = 0;
            sentenceWords.forEach(word => {
                if (freqMap[word]) score += freqMap[word];
            });
            
            // Add a small random jitter (0-5% of score) to allow for "different versions"
            const jitter = score * 0.05 * Math.random();
            return { text: sentence.trim(), score: score + jitter, index: index };
        });

        // 4. Sort by score and pick top N
        const countToKeep = Math.max(1, Math.ceil(sentences.length * ratio));
        const importantThreshold = Math.ceil(countToKeep * 0.4); // Top 40% of summary is "most important"
        
        const sorted = [...scoredSentences].sort((a, b) => b.score - a.score);
        const topIndices = new Set(sorted.slice(0, countToKeep).map(s => s.index));
        const highlightIndices = new Set(sorted.slice(0, importantThreshold).map(s => s.index));

        return scoredSentences
            .filter(s => topIndices.has(s.index))
            .map(s => ({
                text: s.text,
                important: highlightIndices.has(s.index)
            }));
    }

    // --- UI Handlers ---

    function updateWordCounts() {
        inputWordCount.textContent = `${getWordCount(sourceText.value)} words`;
    }

    async function handleSummarize() {
        const text = sourceText.value.trim();
        if (!text) {
            alert('Please paste some text first.');
            return;
        }

        // Show loading state
        outputSection.classList.remove('hidden');
        loader.classList.remove('hidden');
        summaryOutput.innerHTML = "";
        
        // Simulate processing time
        await new Promise(r => setTimeout(r, 800));

        const lengthMap = { 'short': 0.25, 'medium': 0.5, 'long': 0.75 };
        const ratio = lengthMap[summaryLength.value];
        
        let summaryData = summarize(text, ratio);
        
        // Language Support
        if (outputLang.value === 'bn') {
            loader.querySelector('p').textContent = "Translating to Bangla...";
            const translatedSentences = await Promise.all(
                summaryData.map(async s => ({
                    text: await translateText(s.text, 'bn'),
                    important: s.important
                }))
            );
            summaryData = translatedSentences;
        }

        // Render HTML
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
        outputWordCount.textContent = `${getWordCount(plainText)} words`;
        loader.classList.add('hidden');
        loader.querySelector('p').textContent = "Processing text...";

        // Save to History
        saveToHistory(text.substring(0, 50) + "...", plainText);
    }

    function saveToHistory(title, summary) {
        const entry = {
            id: Date.now(),
            title: title,
            content: summary,
            date: new Date().toLocaleDateString()
        };
        history.unshift(entry);
        if (history.length > 10) history.pop();
        localStorage.setItem('summary-history', JSON.stringify(history));
        renderHistory();
    }

    function renderHistory() {
        if (history.length === 0) {
            historyList.innerHTML = '<p class="empty-msg">No history yet.</p>';
            return;
        }

        historyList.innerHTML = history.map(item => `
            <div class="history-item" data-id="${item.id}">
                <h4>${item.title}</h4>
                <span>${item.date}</span>
            </div>
        `).join('');

        document.querySelectorAll('.history-item').forEach(item => {
            item.addEventListener('click', () => {
                const id = item.getAttribute('data-id');
                const selected = history.find(h => h.id == id);
                if (selected) {
                    summaryOutput.innerHTML = selected.content;
                    outputSection.classList.remove('hidden');
                    outputWordCount.textContent = `${getWordCount(selected.content)} words`;
                    historySidebar.classList.remove('open');
                }
            });
        });
    }

    // --- Event Listeners ---

    sourceText.addEventListener('input', updateWordCounts);
    summarizeBtn.addEventListener('click', handleSummarize);
    regenerateBtn.addEventListener('click', handleSummarize);

    clearBtn.addEventListener('click', () => {
        sourceText.value = "";
        summaryOutput.innerHTML = "";
        outputSection.classList.add('hidden');
        updateWordCounts();
    });

    copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(summaryOutput.innerText);
        const originalText = copyBtn.innerHTML;
        copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
        setTimeout(() => copyBtn.innerHTML = originalText, 2000);
    });

    downloadTxtBtn.addEventListener('click', () => {
        const element = document.createElement('a');
        // Add UTF-8 BOM for better compatibility with text editors
        const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
        const file = new Blob([bom, summaryOutput.innerText], {type: 'text/plain;charset=utf-8'});
        element.href = URL.createObjectURL(file);
        element.download = "summary.txt";
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    });

    downloadPdfBtn.addEventListener('click', () => {
        window.print();
    });

    historyBtn.addEventListener('click', () => {
        historySidebar.classList.add('open');
        renderHistory();
    });

    closeHistory.addEventListener('click', () => {
        historySidebar.classList.remove('open');
    });

    // --- Audio Features ---
    let speechUtterance = null;
    let isSpeaking = false;

    function speak(text, lang = 'en') {
        if (isSpeaking) {
            window.speechSynthesis.cancel();
            isSpeaking = false;
            updateAudioButtons(false);
            return;
        }

        if (!text.trim()) return;

        speechUtterance = new SpeechSynthesisUtterance(text);
        
        // Find suitable voice
        const voices = window.speechSynthesis.getVoices();
        const voice = voices.find(v => v.lang.startsWith(lang)) || voices[0];
        if (voice) speechUtterance.voice = voice;
        
        speechUtterance.onend = () => {
            isSpeaking = false;
            updateAudioButtons(false);
        };

        isSpeaking = true;
        updateAudioButtons(true);
        window.speechSynthesis.speak(speechUtterance);
    }

    function updateAudioButtons(playing) {
        const iconClass = playing ? 'fa-stop' : 'fa-volume-up';
        listenSourceBtn.innerHTML = `<i class="fas ${iconClass}"></i>`;
        listenSummaryBtn.innerHTML = `<i class="fas ${iconClass}"></i>`;
        
        if (playing) {
            // We don't know which one was clicked here, but usually one at a time
        }
    }

    listenSourceBtn.addEventListener('click', () => {
        speak(sourceText.value, 'en');
    });

    listenSummaryBtn.addEventListener('click', () => {
        const lang = outputLang.value === 'bn' ? 'bn' : 'en';
        speak(summaryOutput.innerText, lang);
    });

    // Ensure voices are loaded
    window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
    };

    renderHistory();
});
