/* =========================================================
   CreoVio AI — Studio Reset Logic
   Step 1: Voice | Step 2: Video | Step 3: YouTube
   ========================================================= */

const API = "`" + window.API_URL + `"";

// State management
let currentAudioUrl = null;
let currentVideoUrl = null;
let currentJobId = null;
let currentScript = "";

// Scroll to steps
document.querySelectorAll(".nav-scroll").forEach(link => {
    link.addEventListener("click", e => {
        e.preventDefault();
        const targetId = link.getAttribute('href').substring(1);
        document.getElementById(targetId).scrollIntoView({ behavior: 'smooth' });
    });
});

// Utilities
function enableStep(stepId) {
    const block = document.getElementById(`block-${stepId}`);
    if (block) {
        block.classList.remove("disabled");
        const btn = block.querySelector("button");
        if (btn) btn.disabled = false;
    }
}

// Custom Voices
async function fetchCustomVoices() {
    try {
        const res = await fetch(`${API}/custom_voices`);
        const voices = await res.json();
        const grid = document.getElementById("customVoiceGrid");
        if (!grid) return;
        if (voices.length === 0) {
            grid.innerHTML = '<p class="text-sm opacity-50 p-4">No custom voices yet.</p>';
            return;
        }
        grid.innerHTML = voices.map(v => `
            <label class="voice-option" data-voice="${v.id}">
                <input type="radio" name="voice" value="${v.id}">
                <span class="voice-avatar">${v.name[0]}</span>
                <div class="voice-info"><strong>${v.name}</strong><small>Custom</small></div>
            </label>
        `).join('');
        attachVoiceListeners();
    } catch (e) { console.error(e); }
}

document.getElementById("createVoiceBtn")?.addEventListener("click", async () => {
    const name = document.getElementById("customVoiceName").value;
    const file = document.getElementById("customVoiceFile").files[0];
    if (!name || !file) return alert("Fill all fields.");
    const btn = document.getElementById("createVoiceBtn");
    btn.disabled = true;
    const formData = new FormData();
    formData.append("name", name);
    formData.append("sample", file);
    try {
        const res = await fetch(`${API}/clone_voice`, { method: 'POST', body: formData });
        if (res.ok) {
            alert("Success!");
            document.getElementById("customVoiceName").value = "";
            document.getElementById("customVoiceFile").value = "";
            fetchCustomVoices();
        }
    } catch (e) { alert(e); }
    finally { btn.disabled = false; }
});

// Step 1: Voice
document.getElementById("generateVoiceBtn")?.addEventListener("click", async () => {
    const text = document.getElementById("scriptInput").value;
    const voiceInput = document.querySelector('input[name="voice"]:checked');
    if (!text || !voiceInput) return alert("Select voice and enter text.");
    
    currentScript = text;
    const btn = document.getElementById("generateVoiceBtn");
    btn.disabled = true;
    document.getElementById("voiceLoading").classList.remove("hidden");
    document.getElementById("audioResult").classList.add("hidden");

    try {
        const res = await fetch(`${API}/generate_voice`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, voice_id: voiceInput.value })
        });
        const data = await res.json();
        currentAudioUrl = `${API}/${data.audio_path}`;
        currentJobId = data.job_id;
        
        document.getElementById("audioPlayer").src = currentAudioUrl;
        document.getElementById("downloadAudioBtn").href = currentAudioUrl;
        document.getElementById("voiceLoading").classList.add("hidden");
        document.getElementById("audioResult").classList.remove("hidden");

        document.getElementById("audioReadyBar").classList.remove("hidden");
        document.getElementById("audioPreviewMini").src = currentAudioUrl;
        document.getElementById("audioSummaryText").innerText = `Audio Ready (${voiceInput.value})`;

        enableStep('video');
    } catch (e) { alert(e); }
    finally { btn.disabled = false; }
});

// Step 2: Video
document.getElementById("generateVideoBtn")?.addEventListener("click", async () => {
    const file = document.getElementById("imageFileInput").files[0];
    const engine = document.getElementById("avatarEngine").value;
    if (!file) return alert("Upload image.");
    const btn = document.getElementById("generateVideoBtn");
    btn.disabled = true;
    const loading = document.getElementById("videoLoading");
    const progressBar = document.getElementById("progressBar");
    loading.classList.remove("hidden");
    document.getElementById("videoResult").classList.add("hidden");

    const formData = new FormData();
    formData.append("image", file);
    formData.append("job_id", currentJobId);
    formData.append("engine", engine);

    try {
        await fetch(`${API}/generate_video`, { method: 'POST', body: formData });
        let progress = 0;
        const interval = setInterval(() => {
            progress += (98 - progress) * 0.05;
            progressBar.style.width = `${progress}%`;
        }, 1000);
        const ws = new WebSocket(`${window.API_URL.replace("https://", "wss://").replace("http://", "ws://")}/ws/jobs`);
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.job_id === currentJobId && data.status === "VIDEO_DONE") {
                clearInterval(interval);
                progressBar.style.width = "100%";
                currentVideoUrl = `${API}/${data.video_path}`;
                document.getElementById("videoPlayer").src = currentVideoUrl;
                document.getElementById("downloadVideoBtn").href = currentVideoUrl;
                setTimeout(() => {
                    loading.classList.add("hidden");
                    document.getElementById("videoResult").classList.remove("hidden");
                    enableStep('publish');
                }, 500);
                document.getElementById("ytTitle").value = "AI: " + currentScript.substring(0, 30);
                document.getElementById("ytDescription").value = currentScript;
            } else if (data.status === "FAILED") {
                clearInterval(interval);
                alert("Failed");
                loading.classList.add("hidden");
                btn.disabled = false;
            } else { setTimeout(poll, 4000); }
        };
        poll();
    } catch (e) { alert(e); loading.classList.add("hidden"); btn.disabled = false; }
});

// Step 3: Publish
document.getElementById("publishBtn")?.addEventListener("click", async () => {
    const btn = document.getElementById("publishBtn");
    btn.disabled = true;
    try {
        const res = await fetch(`${API}/publish_youtube`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                job_id: currentJobId,
                title: document.getElementById("ytTitle").value,
                description: document.getElementById("ytDescription").value
            })
        });
        const data = await res.json();
        document.getElementById("publishResult").classList.remove("hidden");
        document.getElementById("youtubeLink").href = data.youtube_url || "#";
    } catch (e) { alert(e); }
    finally { btn.disabled = false; }
});

// Helpers
document.getElementById("imageUploadZone")?.addEventListener("click", () => document.getElementById("imageFileInput").click());
document.getElementById("imageFileInput")?.addEventListener("change", e => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = r => {
            document.getElementById("previewImg").src = r.target.result;
            document.getElementById("imagePreview").classList.remove("hidden");
        };
        reader.readAsDataURL(file);
    }
});
document.getElementById("removeImgBtn")?.addEventListener("click", () => {
    document.getElementById("imageFileInput").value = "";
    document.getElementById("imagePreview").classList.add("hidden");
});
function attachVoiceListeners() {
    document.querySelectorAll('.voice-option').forEach(opt => {
        opt.addEventListener('click', () => {
            document.querySelectorAll('.voice-option').forEach(o => o.classList.remove('selected'));
            opt.classList.add('selected');
            const radio = opt.querySelector('input');
            if (radio) radio.checked = true;
        });
    });
}

window.addEventListener("DOMContentLoaded", () => {
    fetchCustomVoices();
    attachVoiceListeners();
    document.getElementById("scriptInput")?.addEventListener("input", e => {
        document.getElementById("charCount").innerText = `${e.target.value.length} characters`;
    });
});
