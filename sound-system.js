// Sound System for Couch Guardian
// Web Audio API based sound system with fallback to HTML5 Audio

class SoundSystem {
    constructor() {
        this.audioContext = null;
        this.isInitialized = false;
        this.isEnabled = true;
        this.masterVolume = 0.5;
        this.sounds = new Map();
        this.loadedSounds = new Map();
        
        // Sound configuration
        this.config = {
            pushPositive: { volume: 0.6, pitch: 1.0, pan: 0 },
            pushNegative: { volume: 0.7, pitch: 0.8, pan: 0 },
            cursed: { volume: 0.8, pitch: 0.7, pan: 0 },
            levelUp: { volume: 0.6, pitch: 1.2, pan: 0 },
            gameStart: { volume: 0.7, pitch: 1.0, pan: 0 },
            buttonClick: { volume: 0.4, pitch: 1.0, pan: 0 },
            notification: { volume: 0.5, pitch: 1.0, pan: 0 },
            ambient: { volume: 0.3, pitch: 1.0, pan: 0, loop: true }
        };
        
        // Sound definitions
        this.soundDefinitions = {
            'push-positive': { 
                url: 'sounds/push-positive.mp3',
                type: 'effect',
                config: this.config.pushPositive
            },
            'push-negative': { 
                url: 'sounds/push-negative.mp3',
                type: 'effect',
                config: this.config.pushNegative
            },
            'cursed': { 
                url: 'sounds/cursed.mp3',
                type: 'effect',
                config: this.config.cursed
            },
            'level-up': { 
                url: 'sounds/level-up.mp3',
                type: 'effect',
                config: this.config.levelUp
            },
            'game-start': { 
                url: 'sounds/game-start.mp3',
                type: 'effect',
                config: this.config.gameStart
            },
            'button-click': { 
                url: 'sounds/button-click.mp3',
                type: 'ui',
                config: this.config.buttonClick
            },
            'notification': { 
                url: 'sounds/notification.mp3',
                type: 'ui',
                config: this.config.notification
            },
            'ambient': { 
                url: 'sounds/ambient.mp3',
                type: 'background',
                config: this.config.ambient
            }
        };
        
        // Fallback to HTML5 Audio if Web Audio API not available
        this.useWebAudio = false;
        
        // Use sound generator as fallback
        this.useSoundGenerator = false;
        this.soundGenerator = null;
        
        // Initialize on user interaction (autoplay policy)
        this.initializeOnInteraction();
    }
    
    // Initialize on first user interaction
    initializeOnInteraction() {
        const initEvents = ['click', 'touchstart', 'keydown', 'mousedown'];
        
        const initHandler = () => {
            this.init();
            
            // Remove event listeners after initialization
            initEvents.forEach(event => {
                document.removeEventListener(event, initHandler);
            });
        };
        
        initEvents.forEach(event => {
            document.addEventListener(event, initHandler, { once: true });
        });
    }
    
    // Initialize sound system
    async init() {
        if (this.isInitialized) return true;
        
        try {
            // Try to use Web Audio API
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            
            if (AudioContext) {
                this.audioContext = new AudioContext();
                this.useWebAudio = true;
                console.log('🎵 Web Audio API инициализирован');
            } else {
                console.warn('⚠️ Web Audio API не доступен, используем HTML5 Audio');
                this.useWebAudio = false;
            }
            
            // Initialize sound generator as fallback
            if (window.SoundGenerator) {
                this.soundGenerator = new window.SoundGenerator();
                this.useSoundGenerator = true;
                console.log('🎵 Генератор звуков инициализирован');
            }
            
            // Preload essential sounds
            await this.preloadSounds(['button-click', 'push-positive', 'push-negative']);
            
            this.isInitialized = true;
            console.log('✅ Sound system initialized');
            return true;
        } catch (error) {
            console.error('❌ Error initializing sound system:', error);
            this.isInitialized = false;
            return false;
        }
    }
    
    // Preload sounds
    async preloadSounds(soundNames) {
        if (!this.isInitialized) return;
        
        const promises = soundNames.map(name => this.loadSound(name));
        
        try {
            await Promise.all(promises);
            console.log(`✅ Preloaded ${soundNames.length} sounds`);
        } catch (error) {
            console.error('❌ Error preloading sounds:', error);
        }
    }
    
    // Load a sound
    async loadSound(soundName) {
        if (this.loadedSounds.has(soundName)) {
            return this.loadedSounds.get(soundName);
        }
        
        const definition = this.soundDefinitions[soundName];
        if (!definition) {
            console.error(`Sound "${soundName}" not defined`);
            return null;
        }
        
        try {
            let audioBuffer;
            
            if (this.useWebAudio && this.audioContext) {
                // Load with Web Audio API
                const response = await fetch(definition.url);
                const arrayBuffer = await response.arrayBuffer();
                audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            } else {
                // Load as HTML5 Audio element
                audioBuffer = new Audio(definition.url);
                audioBuffer.preload = 'auto';
            }
            
            this.loadedSounds.set(soundName, {
                buffer: audioBuffer,
                definition: definition
            });
            
            return audioBuffer;
        } catch (error) {
            console.error(`❌ Error loading sound "${soundName}":`, error);
            
            // Try to use sound generator
            if (this.useSoundGenerator && this.soundGenerator) {
                console.log(`🎵 Используем генератор для "${soundName}"`);
                return 'generator';
            }
            
            return null;
        }
    }
    
    // Play a sound
    play(soundName, options = {}) {
        if (!this.isEnabled || !this.isInitialized) return null;
        
        const soundData = this.loadedSounds.get(soundName);
        if (!soundData) {
            // Try to load on-demand
            this.loadSound(soundName).then(() => {
                this.play(soundName, options);
            });
            return null;
        }
        
        // Use sound generator if loaded as 'generator'
        if (soundData.buffer === 'generator' && this.useSoundGenerator) {
            return this.playGeneratedSound(soundName, config);
        }
        
        const { buffer, definition } = soundData;
        const config = { ...definition.config, ...options };
        
        try {
            if (this.useWebAudio && this.audioContext && buffer instanceof AudioBuffer) {
                return this.playWebAudio(buffer, config);
            } else if (buffer instanceof Audio) {
                return this.playHTML5Audio(buffer, config);
            }
        } catch (error) {
            console.error(`❌ Error playing sound "${soundName}":`, error);
        }
        
        return null;
    }
    
    // Play using Web Audio API
    playWebAudio(audioBuffer, config) {
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        const source = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();
        const panNode = this.audioContext.createStereoPanner();
        
        source.buffer = audioBuffer;
        source.playbackRate.value = config.pitch || 1.0;
        
        gainNode.gain.value = config.volume * this.masterVolume;
        panNode.pan.value = config.pan || 0;
        
        // Connect nodes: source → gain → pan → destination
        source.connect(gainNode);
        gainNode.connect(panNode);
        panNode.connect(this.audioContext.destination);
        
        source.start(0);
        
        // Cleanup after playback
        source.onended = () => {
            source.disconnect();
            gainNode.disconnect();
            panNode.disconnect();
        };
        
        return {
            stop: () => source.stop(),
            setVolume: (volume) => gainNode.gain.value = volume * this.masterVolume,
            setPitch: (pitch) => source.playbackRate.value = pitch
        };
    }
    
    // Play using HTML5 Audio (fallback)
    playHTML5Audio(audioElement, config) {
        const audio = audioElement.cloneNode();
        
        audio.volume = config.volume * this.masterVolume;
        audio.playbackRate = config.pitch || 1.0;
        
        if (config.loop) {
            audio.loop = true;
        }
        
        const playPromise = audio.play();
        
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.error('Audio play failed:', error);
            });
        }
        
        return {
            stop: () => {
                audio.pause();
                audio.currentTime = 0;
            },
            setVolume: (volume) => audio.volume = volume * this.masterVolume,
            setPitch: (pitch) => audio.playbackRate = pitch
        };
    }
    
    // Play push sound based on points
    playPushSound(pointsChange, isCursed = false) {
        if (!this.isEnabled) return;
        
        if (isCursed) {
            this.play('cursed');
        } else if (pointsChange > 0) {
            this.play('push-positive', { 
                pitch: 1.0 + (Math.min(pointsChange, 100) / 500) 
            });
        } else {
            this.play('push-negative', { 
                pitch: 0.8 + (Math.max(pointsChange, -100) / 500) 
            });
        }
    }
    
    // Play game event sound
    playGameEvent(eventType, metadata = {}) {
        if (!this.isEnabled) return;
        
        switch (eventType) {
            case 'game_start':
                this.play('game-start');
                break;
                
            case 'level_up':
                this.play('level-up');
                break;
                
            case 'notification':
                this.play('notification');
                break;
                
            case 'button_click':
                this.play('button-click');
                break;
                
            case 'cursed_push':
                this.play('cursed');
                break;
        }
    }
    
    // Start ambient sound
    startAmbient() {
        if (!this.isEnabled) return null;
        
        return this.play('ambient', { loop: true });
    }
    
    // Stop all sounds
    stopAll() {
        // For Web Audio API, we would need to track all sources
        // For HTML5 Audio, we can't easily stop all without tracking
        
        // Instead, we can mute everything
        this.setMasterVolume(0);
        
        // Restore volume after a short delay
        setTimeout(() => {
            this.setMasterVolume(this.masterVolume);
        }, 100);
    }
    
    // Toggle sound on/off
    toggle() {
        this.isEnabled = !this.isEnabled;
        
        if (!this.isEnabled) {
            this.stopAll();
        }
        
        // Save to localStorage
        localStorage.setItem('cg_sound_enabled', this.isEnabled);
        
        return this.isEnabled;
    }
    
    // Set master volume (0.0 to 1.0)
    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
        
        // Save to localStorage
        localStorage.setItem('cg_sound_volume', this.masterVolume);
        
        return this.masterVolume;
    }
    
    // Get current volume
    getMasterVolume() {
        return this.masterVolume;
    }
    
    // Check if sound is enabled
    isSoundEnabled() {
        return this.isEnabled;
    }
    
    // Load settings from localStorage
    loadSettings() {
        const savedEnabled = localStorage.getItem('cg_sound_enabled');
        const savedVolume = localStorage.getItem('cg_sound_volume');
        
        if (savedEnabled !== null) {
            this.isEnabled = savedEnabled === 'true';
        }
        
        if (savedVolume !== null) {
            this.masterVolume = parseFloat(savedVolume);
        }
    }
    
    // Save settings to localStorage
    saveSettings() {
        localStorage.setItem('cg_sound_enabled', this.isEnabled);
        localStorage.setItem('cg_sound_volume', this.masterVolume);
    }
    
    // Create sound controls UI
    createControlsUI() {
        const container = document.createElement('div');
        container.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            display: flex;
            gap: 10px;
            align-items: center;
            background: rgba(0, 0, 0, 0.7);
            padding: 10px 15px;
            border-radius: 25px;
            z-index: 1000;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
        `;
        
        // Toggle button
        const toggleBtn = document.createElement('button');
        toggleBtn.innerHTML = this.isEnabled ? '🔊' : '🔇';
        toggleBtn.style.cssText = `
            background: none;
            border: none;
            color: white;
            font-size: 1.5rem;
            cursor: pointer;
            padding: 5px;
            border-radius: 50%;
            transition: background 0.3s ease;
        `;
        
        toggleBtn.addEventListener('click', () => {
            const enabled = this.toggle();
            toggleBtn.innerHTML = enabled ? '🔊' : '🔇';
            volumeSlider.disabled = !enabled;
        });
        
        // Volume slider
        const volumeSlider = document.createElement('input');
        volumeSlider.type = 'range';
        volumeSlider.min = '0';
        volumeSlider.max = '100';
        volumeSlider.value = this.masterVolume * 100;
        volumeSlider.disabled = !this.isEnabled;
        volumeSlider.style.cssText = `
            width: 100px;
            height: 5px;
            -webkit-appearance: none;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 5px;
            outline: none;
        `;
        
        volumeSlider.addEventListener('input', (e) => {
            const volume = e.target.value / 100;
            this.setMasterVolume(volume);
        });
        
        // Style the slider
        volumeSlider.style.background = `
            linear-gradient(to right, #4ecdc4 0%, #4ecdc4 ${this.masterVolume * 100}%, 
            rgba(255, 255, 255, 0.2) ${this.masterVolume * 100}%, rgba(255, 255, 255, 0.2) 100%)
        `;
        
        volumeSlider.addEventListener('input', (e) => {
            const value = e.target.value;
            volumeSlider.style.background = `
                linear-gradient(to right, #4ecdc4 0%, #4ecdc4 ${value}%, 
                rgba(255, 255, 255, 0.2) ${value}%, rgba(255, 255, 255, 0.2) 100%)
            `;
        });
        
        container.appendChild(toggleBtn);
        container.appendChild(volumeSlider);
        
        return container;
    }
    
    // Test all sounds
    testSounds() {
        if (!this.isInitialized) {
            console.warn('Sound system not initialized');
            return;
        }
        
        const sounds = Object.keys(this.soundDefinitions);
        let index = 0;
        
        const playNext = () => {
            if (index >= sounds.length) return;
            
            const soundName = sounds[index];
            console.log(`Testing: ${soundName}`);
            this.play(soundName);
            
            index++;
            setTimeout(playNext, 1000);
        };
        
        playNext();
    }
    
    // Play using sound generator
    playGeneratedSound(soundName, config) {
        if (!this.soundGenerator) return null;
        
        try {
            let sound;
            
            switch (soundName) {
                case 'push-positive':
                    sound = this.soundGenerator.generatePushPositive();
                    break;
                case 'push-negative':
                    sound = this.soundGenerator.generatePushNegative();
                    break;
                case 'cursed':
                    sound = this.soundGenerator.generateCursed();
                    break;
                case 'level-up':
                    sound = this.soundGenerator.generateLevelUp();
                    break;
                case 'game-start':
                    sound = this.soundGenerator.generateGameStart();
                    break;
                case 'button-click':
                    sound = this.soundGenerator.generateButtonClick();
                    break;
                case 'notification':
                    sound = this.soundGenerator.generateNotification();
                    break;
                case 'ambient':
                    sound = this.soundGenerator.generateAmbient();
                    break;
                default:
                    console.warn(`Unknown sound for generator: ${soundName}`);
                    return null;
            }
            
            // Apply volume
            if (sound.gainNode) {
                sound.gainNode.gain.value *= (config.volume || 1) * this.masterVolume;
            }
            
            return {
                stop: () => {
                    if (sound.oscillator) sound.oscillator.stop();
                    if (sound.oscillators) sound.oscillators.forEach(o => o.stop());
                    if (sound.source) sound.source.stop();
                },
                setVolume: (volume) => {
                    if (sound.gainNode) {
                        sound.gainNode.gain.value = volume * this.masterVolume;
                    }
                },
                setPitch: (pitch) => {
                    // Not easily adjustable with generator
                }
            };
        } catch (error) {
            console.error(`Error playing generated sound "${soundName}":`, error);
            return null;
        }
    }
    
    // Cleanup
    destroy() {
        this.stopAll();
        
        if (this.audioContext) {
            this.audioContext.close();
        }
        
        this.isInitialized = false;
        console.log('Sound system destroyed');
    }
}

// Create global instance
window.SoundSystem = SoundSystem;

// Helper function to initialize sound system
async function initSoundSystem() {
    const soundSystem = new SoundSystem();
    
    // Load saved settings
    soundSystem.loadSettings();
    
    // Initialize on first user interaction
    // The system will auto-initialize on click/touch
    
    // Add sound controls to page
    window.addEventListener('load', () => {
        setTimeout(() => {
            const controls = soundSystem.createControlsUI();
            document.body.appendChild(controls);
        }, 2000);
    });
    
    window.gameSoundSystem = soundSystem;
    console.log('🎵 Sound system ready');
    
    return soundSystem;
}

// Auto-initialize
window.addEventListener('load', () => {
    setTimeout(() => {
        initSoundSystem();
    }, 1000);
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        SoundSystem,
        initSoundSystem
    };
}