/**
 * DateRangePicker - Componente de seleção de período entre duas datas
 *
 * Uso:
 *   const picker = new DateRangePicker('#meu-input', {
 *     onChange: (startDate, endDate) => console.log(startDate, endDate),
 *     format: 'DD/MM/YYYY',
 *     placeholder: 'Selecione o período'
 *   });
 *
 * Métodos:
 *   picker.getRange()     // Retorna { start: Date, end: Date }
 *   picker.setRange(start, end)  // Define o período
 *   picker.clear()        // Limpa a seleção
 *   picker.destroy()      // Remove o picker
 */

class DateRangePicker {
    constructor(selector, options = {}) {
        this.input = typeof selector === 'string' ? document.querySelector(selector) : selector;

        if (!this.input) {
            console.error('DateRangePicker: Elemento não encontrado');
            return;
        }

        // Opções padrão
        this.options = {
            format: options.format || 'DD/MM/YYYY',
            placeholder: options.placeholder || 'Selecione o período',
            separator: options.separator || ' - ',
            minDate: options.minDate || null,
            maxDate: options.maxDate || null,
            onChange: options.onChange || (() => {}),
            position: options.position || 'bottom', // 'bottom' ou 'top'
            showShortcuts: options.showShortcuts !== false,
            locale: options.locale || 'pt-BR',
            ...options,
        };

        // Estado
        this.startDate = null;
        this.endDate = null;
        this.isSelecting = false;
        this.currentMonth = new Date();
        this.isOpen = false;

        // Nomes em português
        this.monthNames = [
            'Janeiro',
            'Fevereiro',
            'Março',
            'Abril',
            'Maio',
            'Junho',
            'Julho',
            'Agosto',
            'Setembro',
            'Outubro',
            'Novembro',
            'Dezembro',
        ];
        this.dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

        this.init();
    }

    init() {
        // Criar wrapper
        this.wrapper = document.createElement('div');
        this.wrapper.className = 'drp-wrapper';
        this.input.parentNode.insertBefore(this.wrapper, this.input);
        this.wrapper.appendChild(this.input);

        // Estilizar input
        this.input.classList.add('drp-input');
        this.input.readOnly = true;
        this.input.placeholder = this.options.placeholder;

        // Criar ícone
        this.icon = document.createElement('span');
        this.icon.className = 'drp-icon';
        this.icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`;
        this.wrapper.appendChild(this.icon);

        // Criar dropdown do calendário
        this.dropdown = document.createElement('div');
        this.dropdown.className = 'drp-dropdown';
        this.dropdown.innerHTML = this.buildDropdownHTML();
        this.wrapper.appendChild(this.dropdown);

        // Injetar estilos se ainda não existem
        this.injectStyles();

        // Bind eventos
        this.bindEvents();
    }

    buildDropdownHTML() {
        return `
            <div class="drp-container">
                ${this.options.showShortcuts ? this.buildShortcutsHTML() : ''}
                <div class="drp-calendars">
                    <div class="drp-calendar drp-calendar-left">
                        ${this.buildCalendarHTML(this.currentMonth)}
                    </div>
                    <div class="drp-calendar drp-calendar-right">
                        ${this.buildCalendarHTML(this.getNextMonth(this.currentMonth))}
                    </div>
                </div>
                <div class="drp-footer">
                    <div class="drp-selected-range">
                        <span class="drp-start-display">Data inicial</span>
                        <span class="drp-arrow">→</span>
                        <span class="drp-end-display">Data final</span>
                    </div>
                    <div class="drp-actions">
                        <button type="button" class="drp-btn drp-btn-clear">Limpar</button>
                        <button type="button" class="drp-btn drp-btn-apply">Aplicar</button>
                    </div>
                </div>
            </div>
        `;
    }

    buildShortcutsHTML() {
        return `
            <div class="drp-shortcuts">
                <button type="button" data-range="today">Hoje</button>
                <button type="button" data-range="yesterday">Ontem</button>
                <button type="button" data-range="last7">Últimos 7 dias</button>
                <button type="button" data-range="last30">Últimos 30 dias</button>
                <button type="button" data-range="thisMonth">Este mês</button>
                <button type="button" data-range="lastMonth">Mês passado</button>
                <button type="button" data-range="thisYear">Este ano</button>
            </div>
        `;
    }

    buildCalendarHTML(date) {
        const year = date.getFullYear();
        const month = date.getMonth();

        return `
            <div class="drp-header">
                <button type="button" class="drp-nav drp-prev" data-action="prev">‹</button>
                <span class="drp-month-year">${this.monthNames[month]} ${year}</span>
                <button type="button" class="drp-nav drp-next" data-action="next">›</button>
            </div>
            <div class="drp-weekdays">
                ${this.dayNames.map((d) => `<span>${d}</span>`).join('')}
            </div>
            <div class="drp-days">
                ${this.buildDaysHTML(year, month)}
            </div>
        `;
    }

    buildDaysHTML(year, month) {
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let html = '';

        // Dias vazios no início
        for (let i = 0; i < firstDay; i++) {
            html += '<span class="drp-day drp-empty"></span>';
        }

        // Dias do mês
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            date.setHours(0, 0, 0, 0);

            let classes = ['drp-day'];

            // Hoje
            if (date.getTime() === today.getTime()) {
                classes.push('drp-today');
            }

            // Verificar se está no range
            if (this.startDate && this.endDate) {
                const start = new Date(this.startDate);
                start.setHours(0, 0, 0, 0);
                const end = new Date(this.endDate);
                end.setHours(0, 0, 0, 0);

                if (date.getTime() === start.getTime()) {
                    classes.push('drp-start');
                }
                if (date.getTime() === end.getTime()) {
                    classes.push('drp-end');
                }
                if (date > start && date < end) {
                    classes.push('drp-in-range');
                }
            } else if (this.startDate && !this.endDate) {
                const start = new Date(this.startDate);
                start.setHours(0, 0, 0, 0);
                if (date.getTime() === start.getTime()) {
                    classes.push('drp-start');
                }
            }

            // Verificar min/max
            if (this.options.minDate && date < this.options.minDate) {
                classes.push('drp-disabled');
            }
            if (this.options.maxDate && date > this.options.maxDate) {
                classes.push('drp-disabled');
            }

            html += `<span class="${classes.join(' ')}" data-date="${date.toISOString()}">${day}</span>`;
        }

        return html;
    }

    getNextMonth(date) {
        return new Date(date.getFullYear(), date.getMonth() + 1, 1);
    }

    getPrevMonth(date) {
        return new Date(date.getFullYear(), date.getMonth() - 1, 1);
    }

    bindEvents() {
        // Toggle dropdown
        this.input.addEventListener('click', () => this.toggle());
        this.icon.addEventListener('click', () => this.toggle());

        // Fechar ao clicar fora
        document.addEventListener('click', (e) => {
            if (this.isOpen && !this.wrapper.contains(e.target)) {
                this.close();
            }
        });

        // Navegação dos calendários
        this.dropdown.addEventListener('click', (e) => {
            const target = e.target;

            // Navegação prev/next
            if (target.classList.contains('drp-prev') || target.classList.contains('drp-next')) {
                const calendar = target.closest('.drp-calendar');
                const isLeft = calendar.classList.contains('drp-calendar-left');
                const action = target.dataset.action;

                if (action === 'prev') {
                    this.currentMonth = this.getPrevMonth(this.currentMonth);
                } else {
                    this.currentMonth = this.getNextMonth(this.currentMonth);
                }
                this.renderCalendars();
            }

            // Seleção de dia
            if (
                target.classList.contains('drp-day') &&
                !target.classList.contains('drp-empty') &&
                !target.classList.contains('drp-disabled')
            ) {
                this.handleDayClick(new Date(target.dataset.date));
            }

            // Atalhos
            if (target.dataset.range) {
                this.applyShortcut(target.dataset.range);
            }

            // Botões
            if (target.classList.contains('drp-btn-clear')) {
                this.clear();
            }
            if (target.classList.contains('drp-btn-apply')) {
                this.apply();
            }
        });

        // Hover para mostrar preview do range
        this.dropdown.addEventListener('mouseover', (e) => {
            if (
                this.startDate &&
                !this.endDate &&
                e.target.classList.contains('drp-day') &&
                !e.target.classList.contains('drp-empty')
            ) {
                const hoverDate = new Date(e.target.dataset.date);
                this.showRangePreview(hoverDate);
            }
        });
    }

    handleDayClick(date) {
        if (!this.startDate || this.endDate) {
            // Primeiro clique ou recomeçando seleção
            this.startDate = date;
            this.endDate = null;
            this.isSelecting = true;
        } else {
            // Segundo clique
            if (date < this.startDate) {
                // Se clicou antes da data inicial, troca
                this.endDate = this.startDate;
                this.startDate = date;
            } else {
                this.endDate = date;
            }
            this.isSelecting = false;
        }

        this.renderCalendars();
        this.updateFooter();
    }

    showRangePreview(hoverDate) {
        const days = this.dropdown.querySelectorAll('.drp-day:not(.drp-empty)');
        const start = new Date(this.startDate);
        start.setHours(0, 0, 0, 0);
        hoverDate.setHours(0, 0, 0, 0);

        days.forEach((day) => {
            const dayDate = new Date(day.dataset.date);
            dayDate.setHours(0, 0, 0, 0);

            day.classList.remove('drp-preview');

            if (hoverDate >= start) {
                if (dayDate > start && dayDate <= hoverDate) {
                    day.classList.add('drp-preview');
                }
            } else {
                if (dayDate >= hoverDate && dayDate < start) {
                    day.classList.add('drp-preview');
                }
            }
        });
    }

    applyShortcut(range) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let start, end;

        switch (range) {
            case 'today':
                start = end = new Date(today);
                break;
            case 'yesterday':
                start = end = new Date(today);
                start.setDate(start.getDate() - 1);
                break;
            case 'last7':
                end = new Date(today);
                start = new Date(today);
                start.setDate(start.getDate() - 6);
                break;
            case 'last30':
                end = new Date(today);
                start = new Date(today);
                start.setDate(start.getDate() - 29);
                break;
            case 'thisMonth':
                start = new Date(today.getFullYear(), today.getMonth(), 1);
                end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                break;
            case 'lastMonth':
                start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                end = new Date(today.getFullYear(), today.getMonth(), 0);
                break;
            case 'thisYear':
                start = new Date(today.getFullYear(), 0, 1);
                end = new Date(today.getFullYear(), 11, 31);
                break;
        }

        this.startDate = start;
        this.endDate = end;
        this.currentMonth = new Date(start);
        this.renderCalendars();
        this.updateFooter();
    }

    renderCalendars() {
        const leftCalendar = this.dropdown.querySelector('.drp-calendar-left');
        const rightCalendar = this.dropdown.querySelector('.drp-calendar-right');

        leftCalendar.innerHTML = this.buildCalendarHTML(this.currentMonth);
        rightCalendar.innerHTML = this.buildCalendarHTML(this.getNextMonth(this.currentMonth));
    }

    updateFooter() {
        const startDisplay = this.dropdown.querySelector('.drp-start-display');
        const endDisplay = this.dropdown.querySelector('.drp-end-display');

        startDisplay.textContent = this.startDate
            ? this.formatDate(this.startDate)
            : 'Data inicial';
        startDisplay.classList.toggle('drp-has-value', !!this.startDate);

        endDisplay.textContent = this.endDate ? this.formatDate(this.endDate) : 'Data final';
        endDisplay.classList.toggle('drp-has-value', !!this.endDate);
    }

    formatDate(date) {
        if (!date) return '';

        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();

        return this.options.format.replace('DD', day).replace('MM', month).replace('YYYY', year);
    }

    updateInput() {
        if (this.startDate && this.endDate) {
            this.input.value = `${this.formatDate(this.startDate)}${this.options.separator}${this.formatDate(this.endDate)}`;
        } else if (this.startDate) {
            this.input.value = this.formatDate(this.startDate);
        } else {
            this.input.value = '';
        }
    }

    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    open() {
        this.isOpen = true;
        this.dropdown.classList.add('drp-show');

        // Posicionamento
        const inputRect = this.input.getBoundingClientRect();
        const dropdownRect = this.dropdown.getBoundingClientRect();

        if (
            this.options.position === 'top' ||
            inputRect.bottom + dropdownRect.height > window.innerHeight
        ) {
            this.dropdown.classList.add('drp-top');
        } else {
            this.dropdown.classList.remove('drp-top');
        }

        this.renderCalendars();
        this.updateFooter();
    }

    close() {
        this.isOpen = false;
        this.dropdown.classList.remove('drp-show');
    }

    apply() {
        this.updateInput();
        this.close();

        if (this.options.onChange && this.startDate && this.endDate) {
            this.options.onChange(this.startDate, this.endDate);
        }
    }

    clear() {
        this.startDate = null;
        this.endDate = null;
        this.isSelecting = false;
        this.input.value = '';
        this.renderCalendars();
        this.updateFooter();

        if (this.options.onChange) {
            this.options.onChange(null, null);
        }
    }

    // API Pública
    getRange() {
        return {
            start: this.startDate,
            end: this.endDate,
        };
    }

    setRange(start, end) {
        this.startDate = start ? new Date(start) : null;
        this.endDate = end ? new Date(end) : null;
        this.currentMonth = this.startDate ? new Date(this.startDate) : new Date();
        this.updateInput();
        this.renderCalendars();
        this.updateFooter();
    }

    destroy() {
        // Remove wrapper e restaura input
        this.wrapper.parentNode.insertBefore(this.input, this.wrapper);
        this.wrapper.remove();
        this.input.classList.remove('drp-input');
        this.input.readOnly = false;
    }

    injectStyles() {
        if (document.getElementById('drp-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'drp-styles';
        styles.textContent = `
            .drp-wrapper {
                position: relative;
                display: inline-block;
                width: 100%;
            }

            .drp-input {
                width: 100%;
                padding: 10px 40px 10px 12px;
                border: 1px solid #d1d5db;
                border-radius: 8px;
                font-size: 14px;
                cursor: pointer;
                background: white;
                transition: all 0.2s;
            }

            .drp-input:hover {
                border-color: #9ca3af;
            }

            .drp-input:focus {
                outline: none;
                border-color: #06b6d4;
                box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.1);
            }

            .drp-icon {
                position: absolute;
                right: 12px;
                top: 50%;
                transform: translateY(-50%);
                color: #6b7280;
                cursor: pointer;
                display: flex;
                align-items: center;
            }

            .drp-dropdown {
                position: absolute;
                top: calc(100% + 8px);
                left: 0;
                z-index: 1000;
                background: white;
                border-radius: 12px;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
                opacity: 0;
                visibility: hidden;
                transform: translateY(-10px);
                transition: all 0.2s ease;
            }

            .drp-dropdown.drp-show {
                opacity: 1;
                visibility: visible;
                transform: translateY(0);
            }

            .drp-dropdown.drp-top {
                top: auto;
                bottom: calc(100% + 8px);
            }

            .drp-container {
                display: flex;
                flex-direction: column;
            }

            .drp-shortcuts {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
                padding: 12px 16px;
                border-bottom: 1px solid #e5e7eb;
                background: #f9fafb;
                border-radius: 12px 12px 0 0;
            }

            .drp-shortcuts button {
                padding: 6px 12px;
                border: 1px solid #e5e7eb;
                border-radius: 6px;
                background: white;
                font-size: 12px;
                color: #374151;
                cursor: pointer;
                transition: all 0.15s;
            }

            .drp-shortcuts button:hover {
                background: #06b6d4;
                color: white;
                border-color: #06b6d4;
            }

            .drp-calendars {
                display: flex;
                padding: 16px;
                gap: 24px;
            }

            .drp-calendar {
                min-width: 260px;
            }

            .drp-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 12px;
            }

            .drp-nav {
                width: 32px;
                height: 32px;
                border: none;
                background: #f3f4f6;
                border-radius: 6px;
                cursor: pointer;
                font-size: 18px;
                color: #374151;
                transition: all 0.15s;
            }

            .drp-nav:hover {
                background: #e5e7eb;
            }

            .drp-month-year {
                font-weight: 600;
                color: #111827;
            }

            .drp-weekdays {
                display: grid;
                grid-template-columns: repeat(7, 1fr);
                gap: 4px;
                margin-bottom: 8px;
            }

            .drp-weekdays span {
                text-align: center;
                font-size: 12px;
                font-weight: 500;
                color: #6b7280;
                padding: 4px;
            }

            .drp-days {
                display: grid;
                grid-template-columns: repeat(7, 1fr);
                gap: 2px;
            }

            .drp-day {
                aspect-ratio: 1;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 14px;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.15s;
                color: #374151;
            }

            .drp-day:hover:not(.drp-empty):not(.drp-disabled) {
                background: #f0f9ff;
            }

            .drp-day.drp-empty {
                cursor: default;
            }

            .drp-day.drp-today {
                font-weight: 600;
                color: #06b6d4;
            }

            .drp-day.drp-disabled {
                color: #d1d5db;
                cursor: not-allowed;
            }

            .drp-day.drp-start,
            .drp-day.drp-end {
                background: #06b6d4 !important;
                color: white !important;
                font-weight: 600;
            }

            .drp-day.drp-start {
                border-radius: 8px 0 0 8px;
            }

            .drp-day.drp-end {
                border-radius: 0 8px 8px 0;
            }

            .drp-day.drp-start.drp-end {
                border-radius: 8px;
            }

            .drp-day.drp-in-range {
                background: #e0f7fa;
                border-radius: 0;
            }

            .drp-day.drp-preview {
                background: #f0f9ff;
                border-radius: 0;
            }

            .drp-footer {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 12px 16px;
                border-top: 1px solid #e5e7eb;
                background: #f9fafb;
                border-radius: 0 0 12px 12px;
            }

            .drp-selected-range {
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 13px;
                color: #6b7280;
            }

            .drp-selected-range span {
                padding: 6px 12px;
                background: white;
                border: 1px solid #e5e7eb;
                border-radius: 6px;
            }

            .drp-selected-range .drp-has-value {
                color: #111827;
                font-weight: 500;
                border-color: #06b6d4;
                background: #f0f9ff;
            }

            .drp-arrow {
                background: none !important;
                border: none !important;
                padding: 0 !important;
            }

            .drp-actions {
                display: flex;
                gap: 8px;
            }

            .drp-btn {
                padding: 8px 16px;
                border-radius: 6px;
                font-size: 13px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.15s;
            }

            .drp-btn-clear {
                background: white;
                border: 1px solid #e5e7eb;
                color: #6b7280;
            }

            .drp-btn-clear:hover {
                background: #f3f4f6;
            }

            .drp-btn-apply {
                background: #06b6d4;
                border: 1px solid #06b6d4;
                color: white;
            }

            .drp-btn-apply:hover {
                background: #0891b2;
                border-color: #0891b2;
            }

            /* Responsivo */
            @media (max-width: 640px) {
                .drp-calendars {
                    flex-direction: column;
                    gap: 16px;
                }

                .drp-dropdown {
                    left: 0;
                    right: 0;
                    width: auto;
                }

                .drp-calendar {
                    min-width: auto;
                }

                .drp-shortcuts {
                    justify-content: center;
                }
            }
        `;
        document.head.appendChild(styles);
    }
}

// Export para uso como módulo
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DateRangePicker;
}

// Disponibilizar globalmente
window.DateRangePicker = DateRangePicker;
