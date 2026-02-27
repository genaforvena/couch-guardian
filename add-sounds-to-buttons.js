// Скрипт для добавления звуковых эффектов ко всем кнопкам
// Запустить в консоли браузера после загрузки игры

(function() {
    // Функция для воспроизведения звука кнопки
    function playButtonSound() {
        if (window.gameSoundSystem && window.gameSoundSystem.isSoundEnabled()) {
            window.gameSoundSystem.playGameEvent('button_click');
        }
    }
    
    // Находим все кнопки
    const buttons = document.querySelectorAll('button');
    
    // Добавляем обработчики ко всем кнопкам
    buttons.forEach(button => {
        // Пропускаем кнопки которые уже имеют обработчики звуков
        if (button.hasAttribute('data-sound-added')) {
            return;
        }
        
        // Сохраняем оригинальный обработчик onclick
        const originalOnClick = button.onclick;
        
        // Создаем новый обработчик
        button.onclick = function(e) {
            playButtonSound();
            
            // Вызываем оригинальный обработчик если он есть
            if (originalOnClick) {
                return originalOnClick.call(this, e);
            }
        };
        
        // Добавляем атрибут чтобы не добавлять повторно
        button.setAttribute('data-sound-added', 'true');
        
        // Также добавляем обработчик для touch событий на мобильных
        button.addEventListener('touchstart', playButtonSound, { passive: true });
    });
    
    console.log(`✅ Добавлены звуки к ${buttons.length} кнопкам`);
    
    // Также добавляем звуки к элементам управления в игре
    const gameFunctions = ['startGame', 'togglePause', 'selectCharacter', 'shareGame'];
    
    gameFunctions.forEach(funcName => {
        if (window[funcName]) {
            const originalFunc = window[funcName];
            window[funcName] = function(...args) {
                playButtonSound();
                return originalFunc.apply(this, args);
            };
            console.log(`✅ Добавлен звук к функции ${funcName}`);
        }
    });
    
    // Добавляем звук к уведомлениям
    const originalShowNotification = window.showNotification;
    if (originalShowNotification) {
        window.showNotification = function(...args) {
            if (window.gameSoundSystem && window.gameSoundSystem.isSoundEnabled()) {
                window.gameSoundSystem.playGameEvent('notification');
            }
            return originalShowNotification.apply(this, args);
        };
        console.log('✅ Добавлен звук к уведомлениям');
    }
})();