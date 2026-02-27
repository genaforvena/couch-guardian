// Генератор простых звуков для Couch Guardian
// Использует Web Audio API для создания звуков на лету

class SoundGenerator {
    constructor() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.sampleRate = this.audioContext.sampleRate;
    }
    
    // Генерация тона
    generateTone(frequency, duration, type = 'sine', volume = 0.5) {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.type = type;
        oscillator.frequency.value = frequency;
        
        gainNode.gain.value = volume;
        
        // Envelope
        const now = this.audioContext.currentTime;
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(volume, now + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.start(now);
        oscillator.stop(now + duration);
        
        return { oscillator, gainNode };
    }
    
    // Генерация шума
    generateNoise(duration, volume = 0.3) {
        const bufferSize = this.audioContext.sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.sampleRate);
        const output = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        
        const source = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();
        
        source.buffer = buffer;
        
        // Envelope
        const now = this.audioContext.currentTime;
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(volume, now + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
        
        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        source.start(now);
        
        return { source, gainNode };
    }
    
    // Положительный толчок (высокий тон)
    generatePushPositive() {
        return this.generateTone(800, 0.2, 'sine', 0.4);
    }
    
    // Отрицательный толчок (низкий тон)
    generatePushNegative() {
        return this.generateTone(300, 0.3, 'sawtooth', 0.5);
    }
    
    // Проклятый толчок (искаженный звук)
    generateCursed() {
        const oscillator1 = this.audioContext.createOscillator();
        const oscillator2 = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator1.type = 'square';
        oscillator1.frequency.value = 200;
        
        oscillator2.type = 'sawtooth';
        oscillator2.frequency.value = 150;
        
        // Modulation
        const now = this.audioContext.currentTime;
        oscillator1.frequency.setValueAtTime(200, now);
        oscillator1.frequency.exponentialRampToValueAtTime(50, now + 0.5);
        
        oscillator2.frequency.setValueAtTime(150, now);
        oscillator2.frequency.exponentialRampToValueAtTime(100, now + 0.5);
        
        // Envelope
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.6, now + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        
        oscillator1.connect(gainNode);
        oscillator2.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator1.start(now);
        oscillator2.start(now);
        oscillator1.stop(now + 0.5);
        oscillator2.stop(now + 0.5);
        
        return { oscillators: [oscillator1, oscillator2], gainNode };
    }
    
    // Повышение уровня (восходящий тон)
    generateLevelUp() {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.type = 'sine';
        
        const now = this.audioContext.currentTime;
        oscillator.frequency.setValueAtTime(400, now);
        oscillator.frequency.exponentialRampToValueAtTime(800, now + 0.3);
        
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.5, now + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.start(now);
        oscillator.stop(now + 0.3);
        
        return { oscillator, gainNode };
    }
    
    // Начало игры (короткая мелодия)
    generateGameStart() {
        const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
        const duration = 0.15;
        
        notes.forEach((freq, index) => {
            setTimeout(() => {
                this.generateTone(freq, duration, 'sine', 0.4);
            }, index * 150);
        });
    }
    
    // Клик кнопки (короткий щелчок)
    generateButtonClick() {
        return this.generateTone(1000, 0.05, 'square', 0.3);
    }
    
    // Уведомление (короткий бип)
    generateNotification() {
        return this.generateTone(1200, 0.1, 'sine', 0.4);
    }
    
    // Фоновая атмосфера (низкочастотный шум)
    generateAmbient() {
        const bufferSize = this.audioContext.sampleRate * 2;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.sampleRate);
        const output = buffer.getChannelData(0);
        
        // Генерация розового шума (более приятного)
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.96900 * b2 + white * 0.1538520;
            b3 = 0.86650 * b3 + white * 0.3104856;
            b4 = 0.55000 * b4 + white * 0.5329522;
            b5 = -0.7616 * b5 - white * 0.0168980;
            const pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
            b6 = white * 0.115926;
            
            output[i] = pink * 0.11;
        }
        
        const source = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();
        
        source.buffer = buffer;
        source.loop = true;
        
        gainNode.gain.value = 0.1;
        
        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        source.start();
        
        return { source, gainNode };
    }
    
    // Тест всех звуков
    testAllSounds() {
        console.log('🔊 Тестирование звуков...');
        
        const sounds = [
            { name: 'Положительный толчок', fn: () => this.generatePushPositive(), delay: 300 },
            { name: 'Отрицательный толчок', fn: () => this.generatePushNegative(), delay: 400 },
            { name: 'Проклятый толчок', fn: () => this.generateCursed(), delay: 600 },
            { name: 'Повышение уровня', fn: () => this.generateLevelUp(), delay: 400 },
            { name: 'Начало игры', fn: () => this.generateGameStart(), delay: 500 },
            { name: 'Клик кнопки', fn: () => this.generateButtonClick(), delay: 200 },
            { name: 'Уведомление', fn: () => this.generateNotification(), delay: 200 }
        ];
        
        let delay = 0;
        sounds.forEach(sound => {
            setTimeout(() => {
                console.log(`🎵 ${sound.name}`);
                sound.fn();
            }, delay);
            delay += sound.delay;
        });
        
        setTimeout(() => {
            console.log('🌫️ Фоновая атмосфера (нажмите Ctrl+C чтобы остановить)');
            this.generateAmbient();
        }, delay + 500);
    }
    
    // Остановить все звуки
    stopAll() {
        this.audioContext.close();
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
}

// Создаем глобальный экземпляр
window.SoundGenerator = SoundGenerator;

// Авто-тест при загрузке
window.addEventListener('load', () => {
    setTimeout(() => {
        console.log('🎵 Генератор звуков готов');
        
        // Можно раскомментировать для теста
        // const generator = new SoundGenerator();
        // generator.testAllSounds();
    }, 1000);
});

// Экспорт для модулей
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SoundGenerator;
}