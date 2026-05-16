/**
 * CreoVio Core State & Navigation Logic
 * Persists generation state between Voice -> Video -> YouTube
 */

const CreoVio = {
    // Initial State
    state: {
        user: { name: 'Pravallika', email: 'pravallika@example.com', plan: 'Premium' },
        currentJobId: null,
        text: '',
        audioUrl: '',
        videoUrl: '',
        voiceId: 'en-IN-NeerjaNeural',
        avatarEngine: 'sadtalker',
        status: 'idle' // idle, generating_audio, audio_ready, generating_video, video_ready
    },

    // Persistence Keys
    STORAGE_KEY: 'creovio_state',

    // Initialize State from Storage
    init() {
        const saved = localStorage.getItem(this.STORAGE_KEY);
        if (saved) {
            this.state = { ...this.state, ...JSON.parse(saved) };
        }
        this.updateUI();
    },

    // Save State to Storage
    save() {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.state));
    },

    // Update global state properties
    updateState(updates) {
        this.state = { ...this.state, ...updates };
        this.save();
        this.updateUI();
    },

    // UI Updates based on state (shared across pages)
    updateUI() {
        if (!this.state.user) return;

        // Update name displays
        document.querySelectorAll('#userNameDisplay, #profileNameDisplay').forEach(el => {
            el.innerText = this.state.user.name || 'pravallika';
        });

        // Update input fields if they exist (for profile page)
        const inputs = {
            'inputName': this.state.user.name,
            'inputHandle': this.state.user.handle,
            'inputEmail': this.state.user.email,
            'inputLocation': this.state.user.location,
            'inputBio': this.state.user.bio
        };
        for (const [id, val] of Object.entries(inputs)) {
            const el = document.getElementById(id);
            if (el && val && !el.value) el.value = val;
        }

        // Update handle/bio displays
        document.querySelectorAll('#profileHandleDisplay').forEach(el => {
            el.innerText = this.state.user.handle || '@pravallika_creates';
        });
        document.querySelectorAll('#profileBioDisplay').forEach(el => {
            el.innerText = this.state.user.bio || '';
        });

        const initials = this.state.user.name ? this.state.user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'P';
        document.querySelectorAll('#navAvatarInitials, #profileInitials').forEach(el => el.innerText = initials);

        const avatarDisplays = document.querySelectorAll('#navAvatarImg, #profilePreview');
        const initialPlaceholders = document.querySelectorAll('#navAvatarPlaceholder, #navAvatarInitials, #profileInitials');

        if (this.state.user.avatar && this.state.user.avatar.length > 5) {
            console.log("Setting avatar:", this.state.user.avatar);
            avatarDisplays.forEach(el => {
                el.src = this.state.user.avatar;
                el.classList.remove('hidden');
                el.style.display = 'block'; // Force display
            });
            initialPlaceholders.forEach(el => {
                el.classList.add('hidden');
                el.style.display = 'none';
            });
        } else {
            console.log("No avatar found, showing initials");
            avatarDisplays.forEach(el => {
                el.classList.add('hidden');
                el.style.display = 'none';
            });
            initialPlaceholders.forEach(el => {
                el.classList.remove('hidden');
                el.style.display = 'flex'; // Usually flex for centering
            });
        }

        // Populate text area if present
        const scriptInput = document.getElementById('scriptInput');
        if (scriptInput && this.state.text && !scriptInput.value) {
            scriptInput.value = this.state.text;
            const charCount = document.getElementById('charCount');
            if (charCount) charCount.innerText = `${this.state.text.length} Characters`;
        }

        // Show Audio Ready bars if present
        const audioReadyBar = document.getElementById('audioReadyBar');
        if (audioReadyBar && this.state.audioUrl) {
            audioReadyBar.classList.remove('hidden');
            const preview = document.getElementById('audioPreviewMini');
            if (preview) preview.src = this.state.audioUrl;
            const summary = document.getElementById('audioSummaryText');
            if (summary) summary.innerText = `Audio Ready (${this.state.voiceId})`;
        }

        // Populate Video Preview if present
        const videoPlayer = document.getElementById('videoPlayer');
        if (videoPlayer && this.state.videoUrl) {
            videoPlayer.src = this.state.videoUrl;
        }

        // Auto-fill YouTube Metadata
        const ytTitle = document.getElementById('ytTitle');
        if (ytTitle && !ytTitle.value && this.state.text) {
            ytTitle.value = "AI Tutorial: " + this.state.text.substring(0, 40) + "...";
        }
        const ytDesc = document.getElementById('ytDesc');
        if (ytDesc && !ytDesc.value && this.state.text) {
            ytDesc.value = this.state.text;
        }
    },

    // Clear state (e.g. for new project)
    reset() {
        localStorage.removeItem(this.STORAGE_KEY);
        window.location.href = '/dashboard';
    }
};

// Auto-init on page load
window.addEventListener('DOMContentLoaded', () => CreoVio.init());
