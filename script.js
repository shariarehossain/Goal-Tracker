(function() {
    // ----- PERSISTENCE (localStorage only - auto export to file) -----
    let currentFileName = 'my_goal_data';

    function getStorageKey() {
        return 'goalTracker_' + currentFileName;
    }

    let appData = {
        goalYears: 2,
        startDate: null,
        endDate: null,
        tasks: {},
        goalSet: false
    };

    function loadData() {
        try {
            const raw = localStorage.getItem(getStorageKey());
            if (raw) {
                const parsed = JSON.parse(raw);
                appData = { ...appData, ...parsed };
                if (appData.startDate) appData.startDate = new Date(appData.startDate);
                if (appData.endDate) appData.endDate = new Date(appData.endDate);
                if (!appData.tasks) appData.tasks = {};
                return true;
            }
        } catch (e) { console.error('Load error:', e); }
        return false;
    }

    function saveData() {
        try {
            const copy = {
                goalYears: appData.goalYears,
                startDate: appData.startDate ? appData.startDate.toISOString() : null,
                endDate: appData.endDate ? appData.endDate.toISOString() : null,
                tasks: appData.tasks,
                goalSet: appData.goalSet
            };
            localStorage.setItem(getStorageKey(), JSON.stringify(copy));
            localStorage.setItem('goalTracker_fileName', currentFileName);
        } catch (e) { console.error('Save error:', e); }
    }

    // Delete file data
    function deleteFileData() {
        if (confirm('⚠️ Are you sure you want to delete ALL data for file "' + currentFileName + '.json"?\n\nThis will:\n- Delete all goal data\n- Delete all tasks\n- Reset everything\n\nThis action cannot be undone!')) {
            // Remove from localStorage
            localStorage.removeItem(getStorageKey());
            localStorage.removeItem('goalTracker_fileName');
            
            // Reset app data
            appData = {
                goalYears: 2,
                startDate: null,
                endDate: null,
                tasks: {},
                goalSet: false
            };
            
            // Reset UI
            selectedStartDate = null;
            startTimeInput.value = '09:00';
            goalYearsInput.value = '2';
            currentFileName = 'my_goal_data';
            localFileNameInput.value = 'my_goal_data';
            
            renderCalendar(new Date());
            updateEndDateDisplay();
            updateFileDisplay();
            showStep(0);
            
            alert('✅ File data deleted successfully!\n\nFile: ' + currentFileName + '.json\nAll data has been reset.');
        }
    }

    // Reset goal data (keep file)
    function resetGoalData() {
        if (confirm('⚠️ Are you sure you want to reset your goal data?\n\nThis will:\n- Reset goal settings\n- Clear all tasks\n- Keep the file name\n\nThis action cannot be undone!')) {
            appData.goalSet = false;
            appData.startDate = null;
            appData.endDate = null;
            appData.tasks = {};
            appData.goalYears = 2;
            
            saveData();
            
            selectedStartDate = null;
            startTimeInput.value = '09:00';
            goalYearsInput.value = '2';
            
            renderCalendar(new Date());
            updateEndDateDisplay();
            showStep(0);
            
            alert('✅ Goal data reset successfully!\n\nFile name: ' + currentFileName + '.json\nStart fresh with new goal settings.');
        }
    }

    // Export data to file - downloads to Downloads folder
    function exportDataToFile() {
        try {
            const data = {
                goalYears: appData.goalYears,
                startDate: appData.startDate ? appData.startDate.toISOString() : null,
                endDate: appData.endDate ? appData.endDate.toISOString() : null,
                tasks: appData.tasks,
                goalSet: appData.goalSet,
                exportDate: new Date().toISOString()
            };
            
            const json = JSON.stringify(data, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = currentFileName + '.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            alert('✅ File saved successfully!\n\n📁 Location: Downloads folder\n📄 File name: ' + currentFileName + '.json\n\nYou can find this file in your device\'s Downloads folder.');
            
        } catch (e) {
            alert('❌ Error saving file: ' + e.message);
        }
    }

    // ----- state -----
    let currentStep = 0;
    let selectedStartDate = null;
    let dashboardInterval = null;

    // DOM refs
    const step0 = document.getElementById('step0');
    const step1 = document.getElementById('step1');
    const step2 = document.getElementById('step2');
    const step3 = document.getElementById('step3');
    const localFileNameInput = document.getElementById('localFileName');
    const fileNamePreview = document.getElementById('fileNamePreview');
    const nextStep0 = document.getElementById('nextStep0');
    const exportDataBtn = document.getElementById('exportDataBtn');
    const exportDataBtn2 = document.getElementById('exportDataBtn2');
    const currentFileDisplay = document.getElementById('currentFileDisplay');
    const fileDisplayOnDashboard = document.getElementById('fileDisplayOnDashboard');
    const deleteFileBtn = document.getElementById('deleteFileBtn');

    const goalYearsInput = document.getElementById('goalYears');
    const nextStep1 = document.getElementById('nextStep1');
    const backStep2 = document.getElementById('backStep2');
    const doneGoal = document.getElementById('doneGoal');
    const calendarContainer = document.getElementById('calendarContainer');
    const startTimeInput = document.getElementById('startTime');
    const endDateDisplay = document.getElementById('endDateDisplay');
    const endTimeDisplay = document.getElementById('endTimeDisplay');
    const todayDisplay = document.getElementById('todayDisplay');
    const daysRemain = document.getElementById('daysRemain');
    const daysComplete = document.getElementById('daysComplete');
    const goalPeriodDisplay = document.getElementById('goalPeriodDisplay');
    const taskList = document.getElementById('taskList');
    const taskDateDisplay = document.getElementById('taskDateDisplay');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const addTaskInput = document.getElementById('addTaskInput');
    const newTaskText = document.getElementById('newTaskText');
    const saveTaskBtn = document.getElementById('saveTaskBtn');
    const cancelTaskBtn = document.getElementById('cancelTaskBtn');
    const resetGoalBtn = document.getElementById('resetGoalBtn');
    const changeFileBtn = document.getElementById('changeFileBtn');

    // ----- helpers -----
    function getToday() {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }

    function formatDate(d) {
        if (!d) return '—';
        return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }

    function formatDateKey(d) {
        if (!d) return '';
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    }

    function formatTime(d) {
        if (!d) return '—';
        return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }

    function computeEndDate(startDate, years) {
        if (!startDate) return null;
        const end = new Date(startDate);
        end.setFullYear(end.getFullYear() + years);
        return end;
    }

    function updateFileDisplay() {
        const full = currentFileName + '.json';
        currentFileDisplay.textContent = full || 'not set';
        if (fileDisplayOnDashboard) {
            fileDisplayOnDashboard.textContent = '📁 ' + (full || '—');
        }
        if (fileNamePreview) {
            fileNamePreview.textContent = full;
        }
    }

    function renderCalendar(selectedDate) {
        if (!selectedDate) selectedDate = new Date();
        const year = selectedDate.getFullYear();
        const month = selectedDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        let html = `<div style="font-weight:600; margin:6px 0 8px;">${selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</div><div class="calendar-grid">`;
        const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
        weekDays.forEach(d => html += `<div style="font-size:0.7rem; color:#6f86a3; text-align:center;">${d}</div>`);
        for (let i = 0; i < firstDay; i++) html += `<div></div>`;
        for (let day = 1; day <= daysInMonth; day++) {
            const dateObj = new Date(year, month, day);
            const isSelected = (selectedStartDate && selectedStartDate.toDateString() === dateObj.toDateString());
            html += `<div class="day ${isSelected ? 'selected' : ''}" data-day="${day}" data-month="${month}" data-year="${year}">${day}</div>`;
        }
        html += `</div>`;
        calendarContainer.innerHTML = html;
        calendarContainer.querySelectorAll('.day[data-day]').forEach(el => {
            el.addEventListener('click', function() {
                const day = parseInt(this.dataset.day);
                const month = parseInt(this.dataset.month);
                const year = parseInt(this.dataset.year);
                selectedStartDate = new Date(year, month, day);
                updateEndDateDisplay();
                renderCalendar(selectedStartDate);
                saveData();
            });
        });
    }

    function updateEndDateDisplay() {
        if (!selectedStartDate) {
            endDateDisplay.textContent = '—';
            endTimeDisplay.textContent = '—';
            return;
        }
        const years = parseFloat(goalYearsInput.value) || 2;
        const end = computeEndDate(selectedStartDate, years);
        if (end) {
            endDateDisplay.textContent = formatDate(end);
            const [h, m] = (startTimeInput.value || '09:00').split(':').map(Number);
            const endTime = new Date(end);
            endTime.setHours(h, m);
            endTimeDisplay.textContent = formatTime(endTime);
            appData.endDate = end;
        }
    }

    function getTodayKey() {
        return formatDateKey(getToday());
    }

    function renderTasks() {
        const todayKey = getTodayKey();
        taskDateDisplay.textContent = formatDate(new Date());
        
        if (!appData.tasks) appData.tasks = {};
        if (!appData.tasks[todayKey]) {
            appData.tasks[todayKey] = [];
        }
        
        const todayTasks = appData.tasks[todayKey];
        taskList.innerHTML = '';
        if (todayTasks.length === 0) {
            taskList.innerHTML = `<div class="text-muted" style="padding: 12px;">No tasks for today. Add one!</div>`;
            return;
        }
        todayTasks.forEach((task, index) => {
            const div = document.createElement('div');
            div.className = 'task-item';
            const cb = document.createElement('input');
            cb.type = 'checkbox';
            cb.checked = task.done || false;
            cb.addEventListener('change', function() {
                appData.tasks[todayKey][index].done = this.checked;
                saveData();
                renderTasks();
            });
            const span = document.createElement('span');
            span.className = 'task-text';
            span.textContent = task.text || 'unnamed';
            const status = document.createElement('span');
            status.className = 'task-status';
            status.textContent = task.done ? '✅ done' : '⏳ pending';
            const del = document.createElement('button');
            del.textContent = '✕';
            del.style.cssText = 'background: none; border: none; color: #b13e4b; font-size:1.2rem; cursor:pointer;';
            del.addEventListener('click', function() {
                appData.tasks[todayKey].splice(index, 1);
                saveData();
                renderTasks();
            });
            div.appendChild(cb);
            div.appendChild(span);
            div.appendChild(status);
            div.appendChild(del);
            taskList.appendChild(div);
        });
    }

    function renderDashboard() {
        if (!appData.goalSet || !appData.startDate || !appData.endDate) {
            daysRemain.textContent = '—';
            daysComplete.textContent = '—';
            goalPeriodDisplay.textContent = '—';
            return;
        }
        const now = new Date();
        const start = new Date(appData.startDate);
        const end = new Date(appData.endDate);
        const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        const elapsed = Math.ceil((now - start) / (1000 * 60 * 60 * 24));
        const remaining = Math.max(0, totalDays - elapsed);
        daysRemain.textContent = remaining + ' days';
        daysComplete.textContent = Math.min(elapsed, totalDays) + ' days';
        goalPeriodDisplay.textContent = `${formatDate(start)} → ${formatDate(end)}`;
        todayDisplay.textContent = formatDate(now) + ' ' + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        renderTasks();
        updateFileDisplay();
    }

    function showStep(step) {
        step0.classList.add('hidden');
        step1.classList.add('hidden');
        step2.classList.add('hidden');
        step3.classList.add('hidden');
        if (step === 0) step0.classList.remove('hidden');
        else if (step === 1) step1.classList.remove('hidden');
        else if (step === 2) step2.classList.remove('hidden');
        else if (step === 3) step3.classList.remove('hidden');
        currentStep = step;
        if (step === 3) {
            renderDashboard();
            if (dashboardInterval) clearInterval(dashboardInterval);
            dashboardInterval = setInterval(() => {
                if (currentStep === 3) renderDashboard();
            }, 30000);
        } else {
            if (dashboardInterval) {
                clearInterval(dashboardInterval);
                dashboardInterval = null;
            }
        }
    }

    function resetGoal() {
        if (confirm('Reset goal? All data will be cleared.')) {
            appData.goalSet = false;
            appData.startDate = null;
            appData.endDate = null;
            appData.tasks = {};
            saveData();
            selectedStartDate = null;
            startTimeInput.value = '09:00';
            goalYearsInput.value = '2';
            renderCalendar(new Date());
            updateEndDateDisplay();
            showStep(0);
        }
    }

    function loadFileInfo() {
        try {
            const saved = localStorage.getItem('goalTracker_fileName');
            if (saved) {
                currentFileName = saved;
                localFileNameInput.value = currentFileName;
                updateFileDisplay();
                return true;
            }
        } catch (e) { console.error('Load file info error:', e); }
        return false;
    }

    function applyFileSettings() {
        const name = localFileNameInput.value.trim();
        if (!name) {
            alert('Please enter a file name.');
            return false;
        }
        currentFileName = name;
        saveData();
        updateFileDisplay();
        return true;
    }

    // ----- init -----
    function init() {
        loadFileInfo();
        const dataExists = loadData();

        if (dataExists && appData.goalSet && appData.startDate) {
            selectedStartDate = new Date(appData.startDate);
            startTimeInput.value = selectedStartDate.toTimeString().slice(0, 5);
            goalYearsInput.value = appData.goalYears;
            renderCalendar(selectedStartDate);
            updateEndDateDisplay();
            showStep(3);
        } else {
            selectedStartDate = new Date();
            startTimeInput.value = '09:00';
            renderCalendar(new Date());
            updateEndDateDisplay();
            showStep(0);
        }
        updateFileDisplay();

        // Live preview of filename
        localFileNameInput.addEventListener('input', function() {
            fileNamePreview.textContent = this.value.trim() + '.json';
        });

        // Step0: set file name
        nextStep0.addEventListener('click', function() {
            if (!applyFileSettings()) return;
            const hasData = loadData();
            if (hasData && appData.goalSet && appData.startDate) {
                selectedStartDate = new Date(appData.startDate);
                startTimeInput.value = selectedStartDate.toTimeString().slice(0, 5);
                goalYearsInput.value = appData.goalYears;
                renderCalendar(selectedStartDate);
                updateEndDateDisplay();
                showStep(3);
            } else {
                appData = { goalYears: 2, startDate: null, endDate: null, tasks: {}, goalSet: false };
                selectedStartDate = new Date();
                startTimeInput.value = '09:00';
                goalYearsInput.value = '2';
                renderCalendar(new Date());
                updateEndDateDisplay();
                showStep(1);
            }
        });

        // Export data buttons - saves to Downloads
        exportDataBtn.addEventListener('click', exportDataToFile);
        exportDataBtn2.addEventListener('click', exportDataToFile);

        // Delete file button
        deleteFileBtn.addEventListener('click', deleteFileData);

        // Reset goal button (keep file)
        resetGoalBtn.addEventListener('click', resetGoalData);

        // Step1: next
        nextStep1.addEventListener('click', function() {
            const years = parseFloat(goalYearsInput.value);
            if (!years || years <= 0) { alert('Please enter a valid number of years.'); return; }
            appData.goalYears = years;
            if (selectedStartDate) {
                const end = computeEndDate(selectedStartDate, years);
                if (end) appData.endDate = end;
                updateEndDateDisplay();
            }
            showStep(2);
        });

        // Step2: back
        backStep2.addEventListener('click', function() {
            showStep(1);
        });

        // Done goal
        doneGoal.addEventListener('click', function() {
            if (!selectedStartDate) {
                alert('Please select a start date.');
                return;
            }
            const years = parseFloat(goalYearsInput.value) || 2;
            const end = computeEndDate(selectedStartDate, years);
            if (!end) { alert('Invalid date.'); return; }
            const [h, m] = (startTimeInput.value || '09:00').split(':').map(Number);
            const startWithTime = new Date(selectedStartDate);
            startWithTime.setHours(h, m);
            const endWithTime = new Date(end);
            endWithTime.setHours(h, m);

            appData.startDate = startWithTime;
            appData.endDate = endWithTime;
            appData.goalYears = years;
            appData.goalSet = true;
            if (!appData.tasks) appData.tasks = {};
            const todayKey = getTodayKey();
            if (!appData.tasks[todayKey] || appData.tasks[todayKey].length === 0) {
                appData.tasks[todayKey] = [{ text: 'Example: work on goal', done: false }];
            }
            saveData();
            showStep(3);
        });

        // Tasks
        addTaskBtn.addEventListener('click', function() {
            addTaskInput.classList.remove('hidden');
            newTaskText.value = '';
            newTaskText.focus();
        });

        cancelTaskBtn.addEventListener('click', function() {
            addTaskInput.classList.add('hidden');
        });

        saveTaskBtn.addEventListener('click', function() {
            const text = newTaskText.value.trim();
            if (!text) { alert('Please enter task.'); return; }
            const todayKey = getTodayKey();
            if (!appData.tasks[todayKey]) appData.tasks[todayKey] = [];
            appData.tasks[todayKey].push({ text, done: false });
            saveData();
            renderTasks();
            addTaskInput.classList.add('hidden');
        });

        newTaskText.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') saveTaskBtn.click();
        });

        changeFileBtn.addEventListener('click', function() {
            showStep(0);
            updateFileDisplay();
        });

        startTimeInput.addEventListener('input', function() {
            if (selectedStartDate) updateEndDateDisplay();
        });

        goalYearsInput.addEventListener('input', function() {
            if (selectedStartDate) updateEndDateDisplay();
        });
    }

    // Start the app
    init();
})();